import { useEffect, useRef } from 'react'
import { useChatContext } from '../context/ChatContext'
import FindContactsContainer from './FindContactsContainer'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import Avatar from './Avatar'

const ChatPanel = () => {
  const {
    selectedUser,
    selectUser,
    isFindingContacts,
    messages,
    loadingMessages,
    hasMoreMessages,
    loadingOlder,
    loadOlderMessages,
    typingUserIds,
    onlineUserIds,
    users,
  } = useChatContext()
  const bottomRef = useRef(null)
  const lastMessageIdRef = useRef(null)

  const isOnline = selectedUser
    ? onlineUserIds.has(String(selectedUser._id))
    : false

  const typingNames = typingUserIds
    .map(userId => users.find(user => String(user._id) === String(userId))?.fullname)
    .filter(Boolean)

  const typingLabel = typingNames.length === 1
    ? `${typingNames[0]} is typing…`
    : typingNames.length > 1
      ? `${typingNames.join(', ')} are typing…`
      : 'Typing…'

  /* Auto-scroll only when a new message is appended, not when older pages load. */
  useEffect(() => {
    const lastMessageId = messages[messages.length - 1]?._id ?? null

    if (lastMessageId && lastMessageId !== lastMessageIdRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    lastMessageIdRef.current = lastMessageId
  }, [messages])

  if (!selectedUser || isFindingContacts) {
    return (
      <main className="chat-panel chat-panel--empty">
        <FindContactsContainer />
      </main>
    )
  }

  return (
    <main className="chat-panel">
      {/* ── Header ── */}
      <div className="chat-panel__header">
        <button
          className="chat-panel__back-btn"
          onClick={() => selectUser(null)}
          aria-label="Back to contacts list"
          title="Back to contacts"
        >
          ←
        </button>
        <Avatar user={selectedUser} size={38} showOnline={true} isOnline={isOnline} />
        <div className="chat-panel__header-info">
          <span className="chat-panel__header-name">{selectedUser.fullname}</span>
          <span className={`chat-panel__header-sub ${isOnline ? 'chat-panel__header-sub--online' : ''}`}>
            {isOnline ? 'Online' : 'Offline'} · @{selectedUser.username}
          </span>
        </div>
        <div className="chat-panel__header-accent" />
      </div>

      {/* ── Messages area ── */}
      <div className="chat-panel__messages">
        {hasMoreMessages && !loadingMessages && (
          <button
            className="chat-panel__load-older"
            onClick={loadOlderMessages}
            disabled={loadingOlder}
          >
            {loadingOlder ? 'Loading…' : 'Load earlier messages'}
          </button>
        )}

        {loadingMessages ? (
          <div className="chat-panel__loading">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`chat-panel__msg-skeleton ${i % 2 === 0 ? 'chat-panel__msg-skeleton--right' : ''}`}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-panel__no-msgs">
            <span>👋</span>
            <p>No messages yet — say hello to <strong>{selectedUser.fullname}</strong>!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={msg._id ?? i} msg={msg} />
          ))
        )}
        {typingUserIds.length > 0 && (
          <div className="chat-panel__typing" aria-live="polite">
            <span className="chat-panel__typing-dots">
              <i /><i /><i />
            </span>
            {typingLabel}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <MessageInput />

      <style>{`
        .chat-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: rgba(4, 11, 28, 0.65);
          backdrop-filter: blur(28px) saturate(190%);
          -webkit-backdrop-filter: blur(28px) saturate(190%);
          overflow: hidden;
          animation: fadeIn 300ms var(--ease);
          position: relative;
          z-index: 5;
          box-shadow: inset 1px 0 0 0 rgba(59, 130, 246, 0.12);
        }
        .chat-panel--empty {
          align-items: stretch;
          justify-content: stretch;
        }

        /* Header */
        .chat-panel__header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 22px;
          border-bottom: 1px solid rgba(59, 130, 246, 0.16);
          background: rgba(6, 16, 38, 0.78);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          flex-shrink: 0;
          position: relative;
        }
        .chat-panel__back-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(14, 30, 64, 0.8);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #38BDF8;
          cursor: pointer;
          font-size: 16px;
          margin-right: 2px;
          transition: all 0.18s;
        }
        .chat-panel__back-btn:hover {
          background: #1D68F6;
          border-color: #60A5FA;
          color: #FFFFFF;
        }
        .chat-panel__header-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        .chat-panel__header-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .chat-panel__header-sub {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .chat-panel__back-btn {
            display: inline-flex;
          }
          .chat-panel__header {
            padding: 10px 14px;
          }
          .chat-panel__messages {
            padding: 14px 12px calc(14px + env(safe-area-inset-bottom, 0px));
          }
        }
        .chat-panel__header-sub--online {
          color: #10B981;
        }
        /* Electric blue accent strip at bottom of header */
        .chat-panel__header-accent {
          position: absolute;
          bottom: 0;
          left: 20px;
          right: 20px;
          height: 1px;
          background: linear-gradient(90deg, #1D68F6 0%, #38BDF8 50%, transparent 100%);
          opacity: 0.55;
        }

        /* Messages scrollable area */
        .chat-panel__messages {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: transparent;
          background-image: radial-gradient(rgba(59, 130, 246, 0.06) 1px, transparent 0);
          background-size: 24px 24px;
        }

        /* Older-message pagination */
        .chat-panel__load-older {
          align-self: center;
          flex-shrink: 0;
          margin-bottom: 10px;
          padding: 6px 16px;
          background: rgba(10, 24, 52, 0.85);
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: 8px;
          color: #60A5FA;
          font-family: var(--font-mono);
          font-size: 11px;
          cursor: pointer;
          transition: all var(--t-fast);
        }
        .chat-panel__load-older:hover:not(:disabled) {
          border-color: #38BDF8;
          background: #1D68F6;
          color: #FFFFFF;
        }
        .chat-panel__load-older:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .chat-panel__no-msgs {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          height: 100%;
          color: var(--text-muted);
          font-size: 13px;
        }

        /* Typing indicator */
        .chat-panel__typing {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 2px 0;
          color: #38BDF8;
          font-family: var(--font-mono);
          font-size: 11px;
          animation: fadeIn 180ms var(--ease);
        }
        .chat-panel__typing-dots {
          display: inline-flex;
          gap: 3px;
          align-items: center;
        }
        .chat-panel__typing-dots i {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #38BDF8;
          animation: typingBounce 1.1s infinite ease-in-out;
        }
        .chat-panel__typing-dots i:nth-child(2) { animation-delay: 0.15s; }
        .chat-panel__typing-dots i:nth-child(3) { animation-delay: 0.3s; }

        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
          30% { transform: translateY(-3px); opacity: 1; }
        }

        /* Skeleton loaders */
        .chat-panel__loading {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chat-panel__msg-skeleton {
          height: 40px;
          width: 55%;
          border-radius: var(--r-lg);
          background: linear-gradient(90deg, rgba(14, 30, 64, 0.4) 25%, rgba(29, 104, 246, 0.15) 50%, rgba(14, 30, 64, 0.4) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          align-self: flex-start;
        }
        .chat-panel__msg-skeleton--right {
          align-self: flex-end;
          width: 45%;
        }

        /* No messages state */
        .chat-panel__no-msgs {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--text-muted);
          font-size: 14px;
          text-align: center;
          padding: 40px;
          animation: fadeIn 300ms var(--ease);
        }
        .chat-panel__no-msgs span { font-size: 32px; }
        .chat-panel__no-msgs strong { color: var(--text-secondary); font-weight: 600; }
      `}</style>
    </main>
  )
}

export default ChatPanel
