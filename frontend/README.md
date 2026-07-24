# EAD Chat Frontend ⚛️

React + Vite single-page application styled with Tailwind CSS and shadcn/ui components.

## Setup & Running

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## Key Modules & Components

* `src/api.js`: Centralized fetch wrapper automatically injecting JWT Authorization headers.
* `src/hooks/`:
  * `useAuth.js`: User authentication state management (login, signup, token storage).
  * `useChat.js`: SSE streaming reader, multi-turn messaging, response regeneration & versioning state.
  * `useGuidedTour.js`: Step-by-step onboarding tour state and localStorage completion tracking.
* `src/components/chat/`:
  * `ChatWindow.jsx`: Chat message stream, thinking indicator & question prompt input.
  * `Citation.jsx`: Hover tooltips showing raw source text for cited document chunks.
  * `FeedbackModal.jsx`: Modal popup collecting negative feedback reasons and comments.
  * `GuidedTour.jsx`: Onboarding tour modal overlay with keyboard navigation.
  * `MessageContent.jsx`: Markdown response renderer with collapsible sources accordion.
  * `ResponseActions.jsx`: Thumbs up/down rating buttons, regenerate prompt button & version navigator.
  * `Sidebar.jsx`: Conversation history list, new chat button, user profile & tour launcher.
