import { Sidebar } from "@/components/chat/Sidebar"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { GuidedTour } from "@/components/chat/GuidedTour"
import { AuthPage } from "@/components/auth/AuthPage"
import { useChat } from "@/hooks/useChat"
import { useGuidedTour } from "@/hooks/useGuidedTour"
import { useAuth } from "@/hooks/useAuth"

function App() {
  const auth = useAuth()
  const chat = useChat()
  const tour = useGuidedTour(auth.user?.username)

  function handleLogout() {
    chat.startNewChat()
    auth.logout()
  }

  // Not logged in — show the auth page
  if (!auth.user) {
    return (
      <AuthPage
        onLogin={auth.login}
        onSignup={auth.signup}
        authError={auth.authError}
      />
    )
  }

  // Logged in — show the chat app with active GuidedTour
  return (
    <div className="flex">
      <Sidebar
        key={auth.user.username}
        onSelectConversation={chat.loadConversation}
        onNewChat={chat.startNewChat}
        onDeleteConversation={chat.deleteConversation}
        activeConversationId={chat.conversationId}
        onStartTour={tour.start}
        onLogout={handleLogout}
        username={auth.user.username}
      />
      <ChatWindow chat={chat} />
      <GuidedTour tour={tour} />
    </div>
  )
}

export default App

