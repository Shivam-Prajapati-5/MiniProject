import { createContext, useContext, useState, useCallback, useRef } from 'react'

export const ToastContext = createContext(null)

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
      <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" strokeLinecap="round" />
      <line x1="12" y1="8" x2="12.01" y2="8" strokeLinecap="round" />
    </svg>
  ),
}

function ToastItem({ toast, onDismiss }) {
  return (
    <div
      className={`nexchat-toast nexchat-toast--${toast.variant} ${toast.exiting ? 'nexchat-toast--exit' : ''}`}
      onClick={() => onDismiss(toast.id)}
    >
      <span className="nexchat-toast__icon">{ICONS[toast.variant]}</span>
      <span className="nexchat-toast__msg">{toast.message}</span>
    </div>
  )
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 360)
    clearTimeout(timers.current[id])
  }, [])

  const addToast = useCallback((message, variant = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, message, variant, exiting: false }])
    timers.current[id] = setTimeout(() => dismiss(id), 3200)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast container — fixed, top-right */}
      <div className="nexchat-toast-wrap">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>

      {/* Inline styles so no extra CSS file needed */}
      <style>{`
        .nexchat-toast-wrap {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }
        .nexchat-toast {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          min-width: 260px;
          max-width: 340px;
          background: rgba(15, 30, 48, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-radius: 10px;
          border: 1px solid rgba(180, 210, 220, 0.10);
          box-shadow: 0 8px 32px rgba(0,0,0,0.55);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #e8f0f2;
          cursor: pointer;
          pointer-events: all;
          animation: toastIn 280ms cubic-bezier(0.25,0.46,0.45,0.94) both;
        }
        .nexchat-toast--exit {
          animation: toastOut 320ms cubic-bezier(0.25,0.46,0.45,0.94) forwards;
        }
        .nexchat-toast--success { border-left: 3px solid #17a8c4; }
        .nexchat-toast--error   { border-left: 3px solid #e8a048; }
        .nexchat-toast--info    { border-left: 3px solid #3d5c6a; }
        .nexchat-toast__icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          display: flex;
        }
        .nexchat-toast--success .nexchat-toast__icon { color: #17a8c4; }
        .nexchat-toast--error   .nexchat-toast__icon { color: #e8a048; }
        .nexchat-toast--info    .nexchat-toast__icon { color: #7fa3b0; }
        .nexchat-toast__icon svg { width: 16px; height: 16px; }
      `}</style>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
