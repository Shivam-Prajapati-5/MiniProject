import { useState, useRef, useEffect } from 'react'
import { useChatContext } from '../context/ChatContext'
import { useToast } from '../context/ToastContext'

const MessageInput = () => {
  const { sendMessage, selectedUser, emitTyping } = useChatContext()
  const { addToast } = useToast()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef(null)
  const typingTimerRef = useRef(null)

  const stopTyping = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current)
      typingTimerRef.current = null
    }
    emitTyping(false)
  }

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      emitTyping(false)
    }
  }, [emitTyping])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    stopTyping()
    setSending(true)
    try {
      await sendMessage(trimmed)
      setText('')
      textareaRef.current?.focus()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to send message', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e) => {
    const value = e.target.value
    setText(value)

    if (value.trim()) {
      emitTyping(true)

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        typingTimerRef.current = null
        emitTyping(false)
      }, 1200)
    } else {
      stopTyping()
    }

    // auto-resize
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
    }
  }

  if (!selectedUser) return null

  return (
    <div className="msg-input-bar">
      <div className="msg-input-wrap">
        <textarea
          ref={textareaRef}
          className="msg-input__textarea"
          placeholder={`Message ${selectedUser.fullname}…`}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKey}
          rows={1}
          disabled={sending}
        />
        <button
          className={`msg-input__send ${text.trim() ? 'msg-input__send--active' : ''}`}
          onClick={handleSend}
          disabled={!text.trim() || sending}
          aria-label="Send message"
        >
          {sending ? (
            <span className="msg-send-spinner" />
          ) : (
            /* Paper-plane icon */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <style>{`
        .msg-input-bar {
          padding: 12px 18px 16px;
          border-top: 1px solid rgba(198, 161, 91, 0.20);
          background: #141315;
          flex-shrink: 0;
        }
        .msg-input-wrap {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          background: #18171A;
          border: 1px solid rgba(198, 161, 91, 0.22);
          border-radius: 6px;
          padding: 8px 10px 8px 14px;
          transition: border-color var(--t-fast), box-shadow var(--t-fast);
        }
        .msg-input-wrap:focus-within {
          border-color: #E0C58A;
          box-shadow: 0 0 0 1px #E0C58A;
        }
        .msg-input__textarea {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          resize: none;
          color: var(--text-primary);
          font-family: var(--font-sans);
          font-size: 13.5px;
          font-weight: 400;
          line-height: 1.5;
          min-height: 22px;
          max-height: 120px;
          overflow-y: auto;
          caret-color: #E0C58A;
        }
        .msg-input__textarea::placeholder { color: var(--text-muted); }
        .msg-input__send {
          width: 34px;
          height: 34px;
          border-radius: 4px;
          border: 1px solid rgba(198, 161, 91, 0.2);
          background: #232126;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all var(--t-fast);
        }
        .msg-input__send svg { width: 15px; height: 15px; }
        .msg-input__send--active {
          background: #4A1525;
          border-color: rgba(198, 161, 91, 0.45);
          color: #E0C58A;
          box-shadow: 0 2px 8px rgba(74, 21, 37, 0.4);
        }
        .msg-input__send--active:hover {
          background: #702A3C;
          border-color: #E0C58A;
          transform: translateY(-1px);
        }
        .msg-input__send:disabled { cursor: not-allowed; }
        .msg-send-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(224, 197, 138, 0.3);
          border-top-color: #E0C58A;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default MessageInput
