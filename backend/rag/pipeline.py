import json
import logging
from langchain_huggingface import HuggingFaceEmbeddings
from sentence_transformers import CrossEncoder
import weaviate
from weaviate.classes.query import MetadataQuery
import requests

# Configure logging to capture pipeline warnings and errors
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Model Initialization ──────────────────────────────────────────────────────
# Pre-load embedding and reranker models once during module startup to avoid
# high initialization latency on per-query requests.
embedding_model = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
reranker = CrossEncoder("BAAI/bge-reranker-v2-m3")

# Pipeline Constants
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:1b"
COLLECTION_NAME = "CISControls"
RETRIEVAL_LIMIT = 10  # Number of candidate vector matches to retrieve initial scan
RERANK_TOP_N = 3      # Top N chunks selected after cross-encoder reranking


def retrieve_chunks(query: str, limit: int = RETRIEVAL_LIMIT) -> list[str]:
    """Vector search against local Weaviate instance.

    Converts the natural language query into a vector embedding using BGE-small,
    queries the Weaviate 'CISControls' collection for nearest vector matches,
    and returns a list of candidate chunk text strings.
    """
    query_vector = embedding_model.embed_query(query)

    client = weaviate.connect_to_local()
    try:
        collection = client.collections.get(COLLECTION_NAME)
        results = collection.query.near_vector(
            near_vector=query_vector,
            limit=limit,
            target_vector="default",
            return_metadata=MetadataQuery(distance=True),
        )
        candidates = [obj.properties["content"] for obj in results.objects]
        return candidates
    finally:
        client.close()


def rerank_chunks(query: str, candidates: list[str], top_n: int = RERANK_TOP_N) -> list[str]:
    """Reranks candidate chunks using a cross-encoder model.

    Scores each (query, candidate) pair with BGE-reranker-v2-m3 to prioritize
    the most relevant context chunks, returning the top_n results.
    """
    pairs = [(query, candidate) for candidate in candidates]
    scores = reranker.predict(pairs)
    reranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
    return [content for content, score in reranked[:top_n]]


def build_prompt(query: str, top_chunks: list[str]) -> str:
    """Formats top context chunks into a grounded RAG prompt with bracket citations."""
    numbered_context = "\n\n".join(
        f"[{i+1}] {chunk}" for i, chunk in enumerate(top_chunks)
    )
    return f"""Answer the question using ONLY the context below. Cite your sources using the bracket numbers, like [1] or [2], right after the relevant sentence. If the context doesn't contain the answer, say so.

Context:
{numbered_context}

Question: {query}

Answer:"""


def stream_answer(query: str):
    """Generator yielding streaming text tokens from Ollama.

    Workflow:
      1. Performs vector retrieval against Weaviate.
      2. Reranks candidate chunks with CrossEncoder.
      3. Yields a special '[SOURCES]<json>' token carrying the top chunks.
      4. Streams text tokens from Ollama line-by-line.
      5. Yields '[ERROR]' formatted tokens on connection/service failure.
    """
    try:
        candidates = retrieve_chunks(query)
    except Exception as e:
        logger.error(f"Retrieval failed: {e}")
        yield "[ERROR] Could not reach the document database. Is Weaviate running?"
        return

    if not candidates:
        yield "[ERROR] No relevant information was found for this question."
        return

    top_chunks = rerank_chunks(query, candidates)

    # Send source metadata payload to client before response streaming begins
    sources_payload = json.dumps(top_chunks)
    yield f"[SOURCES]{sources_payload}"

    prompt = build_prompt(query, top_chunks)

    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": True},
            stream=True,
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        logger.error(f"Ollama request failed: {e}")
        yield "[ERROR] Could not reach the AI model. Is Ollama running?"
        return

    for line in response.iter_lines():
        if line:
            data = json.loads(line)
            if "response" in data:
                yield data["response"]
            if data.get("done"):
                break