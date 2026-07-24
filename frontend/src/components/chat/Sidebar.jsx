import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/api"

export function Sidebar({
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  activeConversationId,
  onStartTour,
  onLogout,
  username,
}) {
  const [conversations, setConversations] = useState([])

  async function loadConversations() {
    const res = await apiFetch("/api/conversations")
    const data = await res.json()
    setConversations(data)
  }

  useEffect(() => {
    loadConversations()
  }, [activeConversationId, username])

  async function handleDelete(e, id) {
    e.stopPropagation()
    await onDeleteConversation(id)
    loadConversations()
  }

  return (
    <div className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col p-3">
      <Button
        data-tour="new-chat"
        onClick={onNewChat}
        className="mb-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all duration-200"
      >
        + New Chat
      </Button>

      <div data-tour="conversation-list" className="flex-1 overflow-y-auto space-y-1">
        {conversations.map((conv) => {
          const isActive = conv.id === activeConversationId
          return (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer group transition-all duration-200 ${
                isActive
                  ? "bg-slate-800 border-l-2 border-indigo-500 text-slate-50 font-medium"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              }`}
            >
              <span className="truncate flex-1">{conv.title}</span>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 ml-2 px-1 transition-all duration-200"
                title="Delete conversation"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      {/* Bottom section — tour link + user info + logout */}
      <div className="mt-3 space-y-2">
        {onStartTour && (
          <button
            type="button"
            onClick={onStartTour}
            className="w-full text-xs text-slate-500 hover:text-indigo-400 transition-colors text-center"
          >
            Take a tour
          </button>
        )}

        {/* Logged-in user + logout */}
        <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-slate-800/50 border border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            {/* Avatar circle */}
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {username?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <span className="text-xs text-slate-300 truncate">{username}</span>
          </div>
          <button
            id="logout-button"
            type="button"
            onClick={onLogout}
            title="Log out"
            className="text-slate-500 hover:text-red-400 transition-colors text-xs ml-1 flex-shrink-0"
          >
            ⏻
          </button>
        </div>
      </div>
    </div>
  )
}