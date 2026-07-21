import { useState } from "react"

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  async function sendMessage(userText) {
    // Add the user's message immediately
    setMessages((prev) => [...prev, { role: "user", content: userText }])
    setIsLoading(true)

    // Add an empty assistant message we'll fill in as tokens arrive
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() // keep the last incomplete chunk for next time

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const token = line.slice(6) // remove "data: "

          if (token === "[DONE]") continue

          // Append this token to the last (assistant) message
          setMessages((prev) => {
            const updated = [...prev]
            const lastIndex = updated.length - 1
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: updated[lastIndex].content + token,
            }
            return updated
          })
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return { messages, isLoading, sendMessage }
}