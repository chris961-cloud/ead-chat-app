import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { MessageContent } from "@/components/chat/MessageContent"
import { ResponseActions } from "@/components/chat/ResponseActions"
import { FeedbackModal } from "@/components/chat/FeedbackModal"

export function ChatWindow({ chat }) {
  const { messages, isLoading, sendMessage, regenerateMessage, setActiveVersion, submitFeedback } =
    chat
  const [input, setInput] = useState("")
  const [feedbackTarget, setFeedbackTarget] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput("")
  }

  async function handleThumbsUp(messageIndex, versionIndex) {
    await submitFeedback(messageIndex, versionIndex, { rating: "up" })
  }

  function handleThumbsDown(messageIndex, versionIndex) {
    setFeedbackTarget({ messageIndex, versionIndex })
  }

  async function handleFeedbackModalSubmit({ reasons, comment }) {
    if (!feedbackTarget) return
    await submitFeedback(feedbackTarget.messageIndex, feedbackTarget.versionIndex, {
      rating: "down",
      reasons,
      comment,
    })
  }

  return (
    <>
      <div className="flex flex-col h-screen flex-1 max-w-4xl mx-auto p-4 bg-slate-950">
        <div data-tour="chat-area" className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <div
                  key={i}
                  className="p-3 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl bg-indigo-600 text-white ml-auto max-w-[80%] transition-all duration-200"
                >
                  <MessageContent content={msg.content} />
                </div>
              )
            }

            const version = msg.versions[msg.activeVersion]
            const isStreamingThis =
              isLoading &&
              msg.activeVersion === msg.versions.length - 1 &&
              version.content === ""

            return (
              <div
                key={i}
                className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-100 mr-auto max-w-[80%] transition-all duration-200"
              >
                {isStreamingThis && version.content === "" ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <span>Thinking</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                    </span>
                  </div>
                ) : (
                  <MessageContent content={version.content} sources={version.sources} />
                )}

                {!isStreamingThis && version.content && (
                  <div data-tour="response-actions">
                    <ResponseActions
                      versionCount={msg.versions.length}
                      activeVersion={msg.activeVersion}
                      feedback={version.feedback}
                      onRegenerate={() => regenerateMessage(i)}
                      onPrevVersion={() => setActiveVersion(i, msg.activeVersion - 1)}
                      onNextVersion={() => setActiveVersion(i, msg.activeVersion + 1)}
                      onThumbsUp={() => handleThumbsUp(i, msg.activeVersion)}
                      onThumbsDown={() => handleThumbsDown(i, msg.activeVersion)}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            data-tour="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-slate-50 placeholder:text-slate-500 transition-all duration-200 disabled:opacity-50"
          />
          <Button
            data-tour="send-button"
            type="submit"
            disabled={isLoading}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all duration-200"
          >
            Send
          </Button>
        </form>
      </div>

      <FeedbackModal
        open={feedbackTarget !== null}
        onClose={() => setFeedbackTarget(null)}
        onSubmit={handleFeedbackModalSubmit}
      />
    </>
  )
}
