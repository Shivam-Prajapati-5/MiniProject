import { useEffect, useRef } from 'react'
import { useChatContext } from '../context/ChatContext'
import EmptyState from './EmptyState'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'

const ChatPanel = () => {
  const {
    selectedUser,
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

  if (!selectedUser) {
    return (
      <main className="chat-panel chat-panel--empty">
        <EmptyState />
      </main>
    )
  }

  return (
    <main className="chat-panel">
      {/* ── Header ── */}
      <div className="chat-panel__header">
        <div className="chat-panel__header-avatar">
          {selectedUser.profilepicture
            ? <img src={selectedUser.profilepicture} alt={selectedUser.fullname} />
            : <span>{selectedUser.fullname?.[0]?.toUpperCase()}</span>
          }
        </div>
        <div className="chat-panel__header-info">
          <span className="chat-panel__header-name">{selectedUser.fullname}</span>
          <span className={`chat-panel__header-sub ${isOnline ? 'chat-panel__header-sub--online' : ''}`}>
            {isOnline ? 'Online' : 'Offline'} · @{selectedUser.username}
          </span>
        </div>
        {/* Decorative teal accent line */}
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
          background: var(--bg-chat);
          overflow: hidden;
          animation: fadeIn 300ms var(--ease);
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
          border-bottom: 1px solid var(--border-mist);
          background: rgba(13, 26, 34, 0.8);
          backdrop-filter: blur(8px);
          flex-shrink: 0;
          position: relative;
        }
        .chat-panel__header-avatar {
          width: 38px;
          height: 38px;
          border-radius: var(--r-avatar);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--teal-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-mist);
        }
        .chat-panel__header-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .chat-panel__header-avatar span {
          font-size: 14px;
          font-weight: 600;
          color: var(--teal-bright);
        }
        .chat-panel__header-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .chat-panel__header-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.2px;
        }
        .chat-panel__header-sub {
          font-size: 12px;
          font-weight: 300;
          color: var(--text-muted);
          letter-spacing: 0.03em;
        }
        .chat-panel__header-sub--online {
          color: var(--teal-bright);
        }
        /* Subtle teal accent strip at bottom of header */
        .chat-panel__header-accent {
          position: absolute;
          bottom: 0;
          left: 22px;
          right: 22px;
          height: 1px;
          background: linear-gradient(90deg, var(--teal-bright), transparent);
          opacity: 0.25;
        }

        /* Messages scrollable area */
        .chat-panel__messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* Older-message pagination */
        .chat-panel__load-older {
          align-self: center;
          flex-shrink: 0;
          margin-bottom: 10px;
          padding: 6px 14px;
          background: var(--bg-input);
          border: 1px solid var(--border-mist);
          border-radius: var(--r-full);
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 11.5px;
          cursor: pointer;
          transition: border-color var(--t-fast), color var(--t-fast);
        }
        .chat-panel__load-older:hover:not(:disabled) {
          border-color: var(--teal-mid);
          color: var(--teal-bright);
        }
        .chat-panel__load-older:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        /* Typing indicator */
        .chat-panel__typing {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 2px 0;
          color: var(--text-muted);
          font-size: 11.5px;
          font-style: italic;
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
          background: var(--teal-bright);
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
          background: linear-gradient(90deg, var(--bg-hover) 25%, rgba(30,60,80,0.25) 50%, var(--bg-hover) 75%);
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
