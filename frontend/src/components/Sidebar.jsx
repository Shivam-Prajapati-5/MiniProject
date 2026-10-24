import { useState } from 'react'
import { useChatContext } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ContactItem from './ContactItem'

const Sidebar = ({ onProfileClick }) => {
  const {
    users,
    loadingUsers,
    selectedUser,
    selectUser,
    onlineUserIds,
  } = useChatContext()
  const { authUser, logout } = useAuth()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')

  const filtered = users.filter(u =>
    u.fullname.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      addToast('Logout failed', 'error')
    }
  }

  return (
    <aside className="sidebar">
      {/* ── Current user header ── */}
      <div className="sidebar__header">
        <button className="sidebar__me" onClick={onProfileClick} title="View profile">
          <div className="sidebar__me-avatar">
            {authUser?.profilepicture
              ? <img src={authUser.profilepicture} alt={authUser.fullname} />
              : <span>{authUser?.fullname?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div className="sidebar__me-info">
            <span className="sidebar__me-name">{authUser?.fullname}</span>
            <span className="sidebar__me-tag">@{authUser?.username}</span>
          </div>
        </button>

        <button className="sidebar__logout" onClick={handleLogout} title="Sign out" aria-label="Sign out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      {/* ── Section title ── */}
      <div className="sidebar__section-label">Messages</div>

      {/* ── Search ── */}
      <div className="sidebar__search">
        <svg className="sidebar__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search contacts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="sidebar__search-input"
        />
        {search && (
          <button className="sidebar__search-clear" onClick={() => setSearch('')} aria-label="Clear search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Contact list ── */}
      <div className="sidebar__list">
        {loadingUsers ? (
          <div className="sidebar__loading">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="sidebar__skeleton" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="sidebar__empty">
            {search ? 'No contacts found' : 'No other users yet'}
          </p>
        ) : (
          filtered.map(user => (
            <ContactItem
              key={user._id}
              user={user}
              active={selectedUser?._id === user._id}
              online={onlineUserIds.has(String(user._id))}
              onClick={() => selectUser(user)}
            />
          ))
        )}
      </div>

      <style>{`
        .sidebar {
          width: 25%;
          min-width: 220px;
          max-width: 300px;
          display: flex;
          flex-direction: column;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border-mist);
          overflow: hidden;
          animation: slideInLeft 300ms var(--ease);
        }

        /* Header */
        .sidebar__header {
          display: flex;
          align-items: center;
          padding: 16px 14px 14px;
          gap: 8px;
          border-bottom: 1px solid var(--border-mist);
          flex-shrink: 0;
        }
        .sidebar__me {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: var(--r-sm);
          text-align: left;
          transition: background var(--t-fast);
          min-width: 0;
        }
        .sidebar__me:hover { background: var(--bg-hover); }
        .sidebar__me-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--r-avatar);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--teal-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-mist);
        }
        .sidebar__me-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .sidebar__me-avatar span {
          font-size: 14px;
          font-weight: 600;
          color: var(--teal-bright);
        }
        .sidebar__me-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        .sidebar__me-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar__me-tag {
          font-size: 11px;
          font-weight: 300;
          color: var(--text-muted);
          letter-spacing: 0.03em;
        }
        .sidebar__logout {
          width: 32px;
          height: 32px;
          border-radius: var(--r-sm);
          border: none;
          background: none;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: color var(--t-fast), background var(--t-fast);
        }
        .sidebar__logout:hover { color: var(--amber); background: var(--amber-glow); }
        .sidebar__logout svg { width: 16px; height: 16px; }

        /* Section label */
        .sidebar__section-label {
          padding: 14px 18px 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        /* Search */
        .sidebar__search {
          position: relative;
          display: flex;
          align-items: center;
          margin: 0 12px 10px;
          flex-shrink: 0;
        }
        .sidebar__search-icon {
          position: absolute;
          left: 11px;
          width: 14px;
          height: 14px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .sidebar__search-input {
          width: 100%;
          padding: 9px 32px 9px 34px;
          background: var(--bg-input);
          border: 1px solid var(--border-mist);
          border-radius: var(--r-full);
          color: var(--text-primary);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          outline: none;
          transition: border-color var(--t-fast);
          caret-color: var(--teal-bright);
        }
        .sidebar__search-input::placeholder { color: var(--text-muted); }
        .sidebar__search-input:focus { border-color: var(--teal-mid); }
        .sidebar__search-clear {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          padding: 2px;
          transition: color var(--t-fast);
        }
        .sidebar__search-clear:hover { color: var(--text-secondary); }
        .sidebar__search-clear svg { width: 12px; height: 12px; }

        /* List */
        .sidebar__list {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 8px;
        }
        .sidebar__empty {
          font-size: 13px;
          color: var(--text-muted);
          text-align: center;
          padding: 30px 16px;
        }

        /* Skeleton loaders */
        .sidebar__loading { padding: 8px 12px; display: flex; flex-direction: column; gap: 10px; }
        .sidebar__skeleton {
          height: 52px;
          border-radius: var(--r-md);
          background: linear-gradient(90deg, var(--bg-hover) 25%, rgba(30,60,80,0.35) 50%, var(--bg-hover) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </aside>
  )
}

export default Sidebar
