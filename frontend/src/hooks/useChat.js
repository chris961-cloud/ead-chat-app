import { useState } from "react"
import { apiFetch } from "@/api"

function createAssistantMessage() {
  return {
    role: "assistant",
    versions: [{ content: "", sources: [] }],
    activeVersion: 0,
  }
}

function normalizeAssistantMessage(msg) {
  if (msg.versions) {
    return {
      ...msg,
      activeVersion: msg.activeVersion ?? msg.active_version ?? 0,
    }
  }

  return {
    role: "assistant",
    versions: [{ content: msg.content ?? "", sources: msg.sources ?? [] }],
    activeVersion: 0,
  }
}

function normalizeMessages(messages) {
  return messages.map((msg) =>
    msg.role === "assistant" ? normalizeAssistantMessage(msg) : msg
  )
}

async function consumeSSE(response, { onConversationId, onSources, onToken }) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n\n")
    buffer = lines.pop()

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const token = line.slice(6)

      if (token === "[DONE]") continue

      if (token.startsWith("[CONVERSATION_ID]")) {
        onConversationId?.(token.replace("[CONVERSATION_ID]", ""))
        continue
      }

      if (token.startsWith("[SOURCES]")) {
        onSources?.(JSON.parse(token.replace("[SOURCES]", "")))
        continue
      }

      if (token.startsWith("[ERROR]")) {
        onToken?.(token)
        continue
      }

      onToken?.(token)
    }
  }
}

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)

  function updateAssistantVersion(messageIndex, updater) {
    setMessages((prev) => {
      const updated = [...prev]
      const msg = { ...updated[messageIndex] }
      const versions = [...msg.versions]
      const versionIndex = msg.activeVersion
      versions[versionIndex] = updater(versions[versionIndex])
      msg.versions = versions
      updated[messageIndex] = msg
      return updated
    })
  }

  async function sendMessage(userText) {
    let assistantIndex = 0

    setMessages((prev) => {
      assistantIndex = prev.length + 1
      return [...prev, { role: "user", content: userText }, createAssistantMessage()]
    })
    setIsLoading(true)

    try {
      const response = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, conversation_id: conversationId }),
      })

      await consumeSSE(response, {
        onConversationId: setConversationId,
        onSources: (sources) => {
          updateAssistantVersion(assistantIndex, (v) => ({ ...v, sources }))
        },
        onToken: (token) => {
          updateAssistantVersion(assistantIndex, (v) => ({
            ...v,
            content: v.content + token,
          }))
        },
      })
    } catch (error) {
      console.error("Chat error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function regenerateMessage(messageIndex) {
    if (!conversationId || isLoading) return

    setIsLoading(true)

    setMessages((prev) => {
      const updated = [...prev]
      const msg = { ...updated[messageIndex] }
      const newVersionIndex = msg.versions.length
      msg.versions = [...msg.versions, { content: "", sources: [] }]
      msg.activeVersion = newVersionIndex
      updated[messageIndex] = msg
      return updated
    })

    try {
      const response = await apiFetch("/api/chat/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_index: messageIndex,
        }),
      })

      if (!response.ok) {
        console.error("Regenerate failed:", response.status)
        return
      }

      await consumeSSE(response, {
        onSources: (sources) => {
          updateAssistantVersion(messageIndex, (v) => ({ ...v, sources }))
        },
        onToken: (token) => {
          updateAssistantVersion(messageIndex, (v) => ({
            ...v,
            content: v.content + token,
          }))
        },
      })
    } catch (error) {
      console.error("Regenerate error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function setActiveVersion(messageIndex, versionIndex) {
    setMessages((prev) => {
      const updated = [...prev]
      updated[messageIndex] = { ...updated[messageIndex], activeVersion: versionIndex }
      return updated
    })

    if (!conversationId) return

    try {
      await apiFetch(
        `/api/conversations/${conversationId}/messages/${messageIndex}/version`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version_index: versionIndex }),
        }
      )
    } catch (error) {
      console.error("Set version error:", error)
    }
  }

  function updateVersionFeedback(messageIndex, versionIndex, feedback) {
    setMessages((prev) => {
      const updated = [...prev]
      const msg = { ...updated[messageIndex] }
      const versions = [...msg.versions]
      versions[versionIndex] = { ...versions[versionIndex], feedback }
      msg.versions = versions
      updated[messageIndex] = msg
      return updated
    })
  }

  async function submitFeedback(messageIndex, versionIndex, { rating, reasons = [], comment = "" }) {
    if (!conversationId) return

    const feedback = { rating, reasons, comment }

    updateVersionFeedback(messageIndex, versionIndex, feedback)

    try {
      const res = await apiFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_index: messageIndex,
          version_index: versionIndex,
          rating,
          reasons,
          comment,
        }),
      })

      if (!res.ok) {
        console.error("Feedback submit failed:", res.status)
      }
    } catch (error) {
      console.error("Feedback error:", error)
    }
  }

  async function loadConversation(id) {
    const res = await apiFetch(`/api/conversations/${id}`)
    if (!res.ok) {
      console.error("Conversation not found, starting fresh")
      setMessages([])
      setConversationId(null)
      return
    }
    const data = await res.json()
    setMessages(normalizeMessages(data.messages))
    setConversationId(id)
  }

  async function deleteConversation(id) {
    await apiFetch(`/api/conversations/${id}`, {
      method: "DELETE",
    })

    if (id === conversationId) {
      setMessages([])
      setConversationId(null)
    }
  }

  function startNewChat() {
    setMessages([])
    setConversationId(null)
  }

  return {
    messages,
    isLoading,
    sendMessage,
    regenerateMessage,
    setActiveVersion,
    submitFeedback,
    conversationId,
    loadConversation,
    startNewChat,
    deleteConversation,
  }
}
