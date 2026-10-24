import { useAuth } from '../context/AuthContext'

/**
 * MessageBubble
 * @param {{ msg: object }} props
 * msg shape: { _id, senderId, reciverId, message, conversationId, createdAt }
 */
const MessageBubble = ({ msg }) => {
  const { authUser } = useAuth()
  const isMine = String(msg.senderId) === String(authUser._id)

  const time = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className={`bubble-row ${isMine ? 'bubble-row--mine' : 'bubble-row--theirs'}`}>
      <div className={`bubble ${isMine ? 'bubble--mine' : 'bubble--theirs'}`}>
        <span className="bubble__text">{msg.message}</span>
        {time && <span className="bubble__time">{time}</span>}
      </div>

      <style>{`
        .bubble-row {
          display: flex;
          padding: 2px 0;
          animation: slideInUp 200ms var(--ease) both;
        }
        .bubble-row--mine   { justify-content: flex-end; }
        .bubble-row--theirs { justify-content: flex-start; }

        .bubble {
          max-width: 68%;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px 14px;
          border-radius: var(--r-lg);
          word-break: break-word;
          line-height: 1.5;
        }

        /* Sender — sea glass mint */
        .bubble--mine {
          background: var(--mint-sender);
          color: var(--mint-text);
          border-radius: 16px 16px 4px 16px;
        }
        /* Receiver — deep blue charcoal glass */
        .bubble--theirs {
          background: var(--glass-recv);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--border-mist);
          color: var(--text-primary);
          border-radius: 16px 16px 16px 4px;
        }

        .bubble__text {
          font-size: 14px;
          font-weight: 400;
        }
        .bubble__time {
          font-size: 10px;
          font-weight: 300;
          letter-spacing: 0.04em;
          opacity: 0.65;
          align-self: flex-end;
        }
        .bubble--mine   .bubble__time { color: var(--mint-text); }
        .bubble--theirs .bubble__time { color: var(--text-secondary); }
      `}</style>
    </div>
  )
}

export default MessageBubble
