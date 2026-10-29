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

        /* Sender — Vibrant Electric Blue */
        .bubble--mine {
          background: linear-gradient(135deg, #1d68f6 0%, #2563eb 100%);
          color: #FFFFFF;
          border: 1px solid rgba(147, 197, 253, 0.32);
          border-radius: 14px 14px 4px 14px;
          box-shadow: 0 6px 18px rgba(29, 104, 246, 0.35);
        }
        /* Receiver — Frosted Midnight Glass */
        .bubble--theirs {
          background: rgba(13, 27, 56, 0.75);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border: 1px solid rgba(59, 130, 246, 0.20);
          color: #F8FAFC;
          border-radius: 14px 14px 14px 4px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
        }

        .bubble__text {
          font-size: 13.5px;
          font-weight: 400;
          line-height: 1.5;
        }
        .bubble__time {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 400;
          letter-spacing: 0.04em;
          align-self: flex-end;
          margin-top: 2px;
        }
        .bubble--mine   .bubble__time { color: rgba(255, 255, 255, 0.8); }
        .bubble--theirs .bubble__time { color: #94A3B8; }
      `}</style>
    </div>
  )
}

export default MessageBubble
