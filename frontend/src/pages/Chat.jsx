import { useState } from 'react';
import { ChatProvider, useChatContext } from '../context/ChatContext';
import Sidebar from '../components/Sidebar';
import ChatPanel from '../components/ChatPanel';
import ProfilePanel from '../components/ProfilePanel';

const ChatLayout = () => {
  const [showProfile, setShowProfile] = useState(false);
  const { selectedUser, isFindingContacts } = useChatContext();

  const showMainPanel = Boolean(selectedUser || isFindingContacts);

  return (
    <div className={`chat-layout ${showMainPanel ? 'has-active-chat' : 'no-active-chat'}`}>
      {/* Ambient Dynamic Background Lighting */}
      <div className="ambient-glow-layer" aria-hidden="true">
        <div className="ambient-orb ambient-orb--maroon" />
        <div className="ambient-orb ambient-orb--gold" />
        <div className="ambient-orb ambient-orb--purple" />
      </div>

      <Sidebar onProfileClick={() => setShowProfile(true)} />
      <ChatPanel />
      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}

      <style>{`
        .chat-layout {
          display: flex;
          height: 100vh;
          height: 100dvh;
          width: 100vw;
          overflow: hidden;
          background: var(--bg-base);
          position: relative;
        }

        /* Responsive Mobile Layout */
        @media (max-width: 768px) {
          .chat-layout.has-active-chat .sidebar {
            display: none !important;
          }
          .chat-layout.no-active-chat .chat-panel {
            display: none !important;
          }
          .chat-layout .sidebar {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .chat-layout .chat-panel {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

const Chat = () => (
  <ChatProvider>
    <ChatLayout />
  </ChatProvider>
);

export default Chat;
