from langchain_huggingface import HuggingFaceEmbeddings
from sentence_transformers import CrossEncoder
import weaviate
from weaviate.classes.query import MetadataQuery
import requests

# Load models once, when the module is first imported (not on every request)
embedding_model = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
reranker = CrossEncoder("BAAI/bge-reranker-v2-m3")

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:1b"
COLLECTION_NAME = "CISControls"


def retrieve_chunks(query: str, limit: int = 10):
    query_vector = embedding_model.embed_query(query)

    client = weaviate.connect_to_local()
    collection = client.collections.get(COLLECTION_NAME)

    results = collection.query.near_vector(
        near_vector=query_vector,
        limit=limit,
        target_vector="default",
        return_metadata=MetadataQuery(distance=True),
    )

    candidates = [obj.properties["content"] for obj in results.objects]
    client.close()
    return candidates


def rerank_chunks(query: str, candidates: list[str], top_n: int = 3):
    pairs = [(query, candidate) for candidate in candidates]
    scores = reranker.predict(pairs)
    reranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
    return [content for content, score in reranked[:top_n]]


def build_prompt(query: str, top_chunks: list[str]) -> str:
    context = "\n\n---\n\n".join(top_chunks)
    return f"""Answer the question using ONLY the context below. If the context doesn't contain the answer, say so.

Context:
{context}

Question: {query}

Answer:"""


def stream_answer(query: str):
    """Generator that yields tokens from Ollama as they arrive."""
    candidates = retrieve_chunks(query)
    top_chunks = rerank_chunks(query, candidates)
    prompt = build_prompt(query, top_chunks)

    response = requests.post(
        OLLAMA_URL,
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": True},
        stream=True,
    )

    import json as json_lib
    for line in response.iter_lines():
        if line:
            data = json_lib.loads(line)
            if "response" in data:
                yield data["response"]
            if data.get("done"):
                break