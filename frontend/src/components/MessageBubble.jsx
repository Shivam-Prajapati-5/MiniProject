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

        /* Sender — Deep Maroon */
        .bubble--mine {
          background: #4A1525;
          color: #F5F2ED;
          border: 1px solid rgba(198, 161, 91, 0.4);
          border-radius: 8px 8px 2px 8px;
          box-shadow: 0 4px 14px rgba(74, 21, 37, 0.4);
        }
        /* Receiver — Charcoal Glass */
        .bubble--theirs {
          background: #1E1D20;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(198, 161, 91, 0.18);
          color: #F5F2ED;
          border-radius: 8px 8px 8px 2px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
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
        .bubble--mine   .bubble__time { color: #E0C58A; opacity: 0.85; }
        .bubble--theirs .bubble__time { color: #77777D; opacity: 0.85; }
      `}</style>
    </div>
  )
}

export default MessageBubble
