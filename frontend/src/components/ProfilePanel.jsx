import { useAuth } from '../context/AuthContext'

/**
 * ProfilePanel — slides in from the right edge
 * @param {{ onClose: () => void }} props
 */
const ProfilePanel = ({ onClose }) => {
  const { authUser } = useAuth()
  if (!authUser) return null

  const genderLabel = authUser.gender === 'male' ? '👦 Male' : authUser.gender === 'female' ? '👧 Female' : '—'

  const fields = [
    { label: 'Full Name',  value: authUser.fullname },
    { label: 'Username',   value: `@${authUser.username}` },
    { label: 'Email',      value: authUser.email },
    { label: 'Gender',     value: genderLabel },
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="profile-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="profile-panel" role="dialog" aria-label="Your profile">
        {/* Header */}
        <div className="profile-panel__top">
          <span className="profile-panel__title">Profile</span>
          <button className="profile-panel__close" onClick={onClose} aria-label="Close profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Avatar */}
        <div className="profile-panel__avatar-wrap">
          {authUser.profilepicture ? (
            <img
              src={authUser.profilepicture}
              alt={authUser.fullname}
              className="profile-panel__avatar-img"
            />
          ) : (
            <span className="profile-panel__avatar-init">
              {authUser.fullname?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <p className="profile-panel__display-name">{authUser.fullname}</p>
        <p className="profile-panel__handle">@{authUser.username}</p>

        {/* Divider */}
        <div className="profile-panel__divider" />

        {/* Fields */}
        <div className="profile-panel__fields">
          {fields.map(f => (
            <div key={f.label} className="profile-panel__field">
              <span className="profile-panel__field-label">{f.label}</span>
              <span className="profile-panel__field-value">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        /* Backdrop */
        .profile-backdrop {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(2px);
          animation: fadeIn 250ms var(--ease);
        }

        /* Panel */
        .profile-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 300px;
          z-index: 201;
          background: var(--bg-glass);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-left: 1px solid var(--border-mist);
          box-shadow: -8px 0 40px rgba(0,0,0,0.55);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-bottom: 32px;
          animation: panelSlideIn 320ms var(--ease);
          overflow-y: auto;
        }

        /* Top row */
        .profile-panel__top {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px 14px;
        }
        .profile-panel__title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.2px;
        }
        .profile-panel__close {
          width: 30px;
          height: 30px;
          border-radius: var(--r-sm);
          border: none;
          background: none;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: color var(--t-fast), background var(--t-fast);
        }
        .profile-panel__close:hover { color: var(--amber); background: var(--amber-glow); }
        .profile-panel__close svg { width: 15px; height: 15px; }

        /* Avatar */
        .profile-panel__avatar-wrap {
          width: 84px;
          height: 84px;
          border-radius: var(--r-md);
          overflow: hidden;
          margin: 12px 0 10px;
          border: 2px solid var(--teal-mid);
          background: var(--teal-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(23, 168, 196, 0.2);
        }
        .profile-panel__avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .profile-panel__avatar-init {
          font-size: 28px;
          font-weight: 700;
          color: var(--teal-bright);
        }
        .profile-panel__display-name {
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.3px;
          margin-top: 4px;
        }
        .profile-panel__handle {
          font-size: 13px;
          font-weight: 300;
          color: var(--text-muted);
          letter-spacing: 0.03em;
          margin-top: 2px;
        }

        /* Divider */
        .profile-panel__divider {
          width: calc(100% - 40px);
          height: 1px;
          background: var(--border-mist);
          margin: 20px 0;
        }

        /* Fields */
        .profile-panel__fields {
          width: 100%;
          padding: 0 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .profile-panel__field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 14px;
          background: rgba(8, 18, 26, 0.5);
          border: 1px solid var(--border-mist);
          border-radius: var(--r-sm);
        }
        .profile-panel__field-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .profile-panel__field-value {
          font-size: 14px;
          font-weight: 400;
          color: var(--text-primary);
          word-break: break-all;
        }
      `}</style>
    </>
  )
}

export default ProfilePanel
