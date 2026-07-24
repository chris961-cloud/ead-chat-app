import { useState, useEffect, useCallback } from "react"

/** Base LocalStorage key flag for tour completion */
export const TOUR_STORAGE_KEY = "ead_chat_tour_completed"

/** Sequence of onboarding steps describing core application features */
export const TOUR_STEPS = [
  {
    id: "welcome",
    title: "Welcome to EAD Chat",
    content:
      "This assistant answers questions about CIS Controls using retrieval-augmented generation (RAG). Let's take a quick look around.",
    placement: "center",
  },
  {
    id: "new-chat",
    target: "new-chat",
    title: "Start a new chat",
    content: "Click here anytime to begin a fresh conversation. Your previous chats are saved automatically.",
    placement: "right",
  },
  {
    id: "conversation-list",
    target: "conversation-list",
    title: "Chat history",
    content:
      "Past conversations appear here. Click one to resume it. Hover a thread and press × to delete it.",
    placement: "right",
  },
  {
    id: "chat-input",
    target: "chat-input",
    title: "Ask a question",
    content:
      'Type a question about CIS Controls — try: "How should administrator and privileged accounts be managed?"',
    placement: "top",
  },
  {
    id: "send-button",
    target: "send-button",
    title: "Send your message",
    content: "Press Send or hit Enter to get an AI-generated answer grounded in the CIS Controls document.",
    placement: "top",
  },
  {
    id: "chat-area",
    target: "chat-area",
    title: "Answers & sources",
    content:
      "Responses appear here. Expand the Sources accordion under any answer to see the document chunks that were retrieved.",
    placement: "left",
  },
  {
    id: "response-actions",
    target: "response-actions",
    title: "Manage responses",
    content:
      "Rate answers with thumbs up/down, regenerate for an alternative response, and switch between versions with the arrows.",
    placement: "top",
  },
]

/**
 * Hook providing onboarding tour state and step controls.
 * @param {string|null} username - Currently logged-in user's username.
 * Automatically triggers the tour 500ms after a new user logs in for the first time.
 */
export function useGuidedTour(username) {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const getUserStorageKey = useCallback(() => {
    return username ? `${TOUR_STORAGE_KEY}_${username}` : TOUR_STORAGE_KEY
  }, [username])

  const start = useCallback(() => {
    setStepIndex(0)
    setActive(true)
  }, [])

  const finish = useCallback(() => {
    const key = getUserStorageKey()
    localStorage.setItem(key, "true")
    setActive(false)
    setStepIndex(0)
  }, [getUserStorageKey])

  // Auto-start tour for newly logged in users if not previously completed
  useEffect(() => {
    if (!username) return // Only run when user is authenticated

    const userKey = `ead_chat_tour_completed_${username}`
    const isCompleted = localStorage.getItem(userKey)

    if (!isCompleted) {
      const timer = setTimeout(() => {
        setStepIndex(0)
        setActive(true)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [username])


  function next() {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((i) => i + 1)
    } else {
      finish()
    }
  }

  function prev() {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
  }

  function skip() {
    finish()
  }

  return {
    active,
    stepIndex,
    step: TOUR_STEPS[stepIndex],
    totalSteps: TOUR_STEPS.length,
    next,
    prev,
    skip,
    finish,
    start,
  }
}


