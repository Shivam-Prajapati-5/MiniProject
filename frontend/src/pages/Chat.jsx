import { useState } from 'react'
import { ChatProvider } from '../context/ChatContext'
import Sidebar from '../components/Sidebar'
import ChatPanel from '../components/ChatPanel'
import ProfilePanel from '../components/ProfilePanel'

const ChatLayout = () => {
  const [showProfile, setShowProfile] = useState(false)

  return (
    <div className="chat-layout">
      <Sidebar onProfileClick={() => setShowProfile(true)} />
      <ChatPanel />
      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}

      <style>{`
        .chat-layout {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: var(--bg-base);
          position: relative;
        }
      `}</style>
    </div>
  )
}

const Chat = () => (
  <ChatProvider>
    <ChatLayout />
  </ChatProvider>
)

export default Chat
