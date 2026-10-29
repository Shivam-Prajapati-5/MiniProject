import { useState } from 'react'
import { useChatContext } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ContactItem from './ContactItem'
import Avatar from './Avatar'

const Sidebar = ({ onProfileClick }) => {
  const {
    users,
    loadingUsers,
    pendingRequests,
    selectedUser,
    selectUser,
    setIsFindingContacts,
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
          <Avatar user={authUser} size={36} />
          <div className="sidebar__me-info">
            <span className="sidebar__me-name">{authUser?.fullname}</span>
            <span className="sidebar__me-tag">@{authUser?.username}</span>
          </div>
        </button>

        <div className="sidebar__header-actions">
          <button
            className="sidebar__add-btn"
            onClick={() => {
              selectUser(null)
              setIsFindingContacts(true)
            }}
            title="Find Contacts / Friend Requests"
            aria-label="Find contacts"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            {pendingRequests && pendingRequests.length > 0 && (
              <span className="sidebar__add-badge">{pendingRequests.length}</span>
            )}
          </button>

          <button className="sidebar__logout" onClick={handleLogout} title="Sign out" aria-label="Sign out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
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
          <div className="sidebar__empty-wrap">
            <p className="sidebar__empty">
              {search ? 'No contacts found' : 'No contacts yet'}
            </p>
            {!search && (
              <button
                className="btn-primary sidebar__empty-add"
                onClick={() => {
                  selectUser(null)
                  setIsFindingContacts(true)
                }}
              >
                + Find Contacts
              </button>
            )}
          </div>
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
          width: 290px;
          min-width: 260px;
          max-width: 330px;
          display: flex;
          flex-direction: column;
          background: rgba(5, 13, 31, 0.76);
          backdrop-filter: blur(28px) saturate(190%);
          -webkit-backdrop-filter: blur(28px) saturate(190%);
          border-right: 1px solid rgba(59, 130, 246, 0.16);
          box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.04);
          overflow: hidden;
          animation: slideInLeft 300ms var(--ease);
          flex-shrink: 0;
          z-index: 10;
        }

        /* Header */
        .sidebar__header {
          display: flex;
          align-items: center;
          padding: 14px 14px;
          gap: 8px;
          border-bottom: 1px solid rgba(59, 130, 246, 0.15);
          background: rgba(7, 18, 42, 0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          flex-shrink: 0;
        }

        .sidebar__header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sidebar__add-btn {
          position: relative;
          background: rgba(29, 104, 246, 0.18);
          border: 1px solid rgba(59, 130, 246, 0.35);
          color: #38BDF8;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s;
        }

        .sidebar__add-btn:hover {
          background: #1D68F6;
          border-color: #60A5FA;
          color: #FFFFFF;
        }

        .sidebar__add-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #1D68F6;
          color: #FFFFFF;
          font-size: 0.65rem;
          font-weight: 800;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #030712;
          box-shadow: 0 2px 6px rgba(29, 104, 246, 0.6);
        }

        .sidebar__empty-wrap {
          padding: 40px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .sidebar__empty-add {
          padding: 8px 16px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-radius: 8px;
          background: #1D68F6;
          color: #FFFFFF;
          border: 1px solid rgba(147, 197, 253, 0.35);
          cursor: pointer;
          transition: all 0.18s;
          box-shadow: 0 4px 14px rgba(29, 104, 246, 0.4);
        }

        .sidebar__empty-add:hover {
          background: #195ce0;
          box-shadow: 0 6px 20px rgba(29, 104, 246, 0.6);
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
          border-radius: 8px;
          text-align: left;
          transition: background var(--t-fast);
          min-width: 0;
        }
        .sidebar__me:hover {
          background: rgba(37, 99, 235, 0.12);
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
          font-family: var(--font-mono);
          font-size: 11px;
          color: #38BDF8;
          letter-spacing: 0.02em;
        }

        .sidebar__logout {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid rgba(59, 130, 246, 0.20);
          background: transparent;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.18s;
        }
        .sidebar__logout:hover {
          color: #FFB4AB;
          border-color: rgba(255, 180, 171, 0.4);
          background: rgba(147, 0, 10, 0.2);
        }
        .sidebar__logout svg { width: 15px; height: 15px; }

        /* Section label */
        .sidebar__section-label {
          padding: 12px 16px 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #60A5FA;
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
          left: 10px;
          width: 14px;
          height: 14px;
          color: #38BDF8;
          pointer-events: none;
        }
        .sidebar__search-input {
          width: 100%;
          padding: 8px 30px 8px 32px;
          background: rgba(9, 21, 48, 0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(59, 130, 246, 0.22);
          border-radius: 8px;
          color: var(--text-primary);
          font-family: var(--font-sans);
          font-size: 12.5px;
          outline: none;
          transition: border-color var(--t-fast);
        }
        .sidebar__search-input::placeholder { color: #64748B; }
        .sidebar__search-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
        }
        .sidebar__search-clear {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          padding: 2px;
        }
        .sidebar__search-clear:hover { color: var(--text-primary); }
        .sidebar__search-clear svg { width: 12px; height: 12px; }

        /* List */
        .sidebar__list {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 4px 8px calc(14px + env(safe-area-inset-bottom, 8px));
        }
        .sidebar__empty {
          font-size: 12px;
          color: var(--text-muted);
          text-align: center;
        }

        /* Skeleton loaders */
        .sidebar__loading { padding: 8px; display: flex; flex-direction: column; gap: 8px; }
        .sidebar__skeleton {
          height: 48px;
          border-radius: 8px;
          background: linear-gradient(90deg, rgba(14, 30, 64, 0.5) 25%, rgba(29, 104, 246, 0.15) 50%, rgba(14, 30, 64, 0.5) 75%);
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
