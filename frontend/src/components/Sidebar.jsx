import { useState } from 'react'
import { useChatContext } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ContactItem from './ContactItem'
import Avatar from './Avatar'
import AddFriendModal from './AddFriendModal'

const Sidebar = ({ onProfileClick }) => {
  const {
    users,
    loadingUsers,
    pendingRequests,
    selectedUser,
    selectUser,
    onlineUserIds,
  } = useChatContext()
  const { authUser, logout } = useAuth()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

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
            onClick={() => setShowAddModal(true)}
            title="Add contact / View requests"
            aria-label="Add contact"
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
                onClick={() => setShowAddModal(true)}
              >
                + Add Contacts
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

      {showAddModal && (
        <AddFriendModal onClose={() => setShowAddModal(false)} />
      )}

      <style>{`
        .sidebar {
          width: 280px;
          min-width: 250px;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          background: rgba(16, 15, 18, 0.85);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border-right: 1px solid rgba(198, 161, 91, 0.20);
          box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.05);
          overflow: hidden;
          animation: slideInLeft 300ms var(--ease);
          flex-shrink: 0;
          z-index: 10;
        }

        /* Header */
        .sidebar__header {
          display: flex;
          align-items: center;
          padding: 14px 12px;
          gap: 8px;
          border-bottom: 1px solid rgba(198, 161, 91, 0.18);
          background: rgba(20, 19, 23, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          flex-shrink: 0;
        }

        .sidebar__header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sidebar__add-btn {
          position: relative;
          background: rgba(74, 21, 37, 0.45);
          border: 1px solid rgba(198, 161, 91, 0.35);
          color: #E0C58A;
          width: 32px;
          height: 32px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s;
        }

        .sidebar__add-btn:hover {
          background: #4A1525;
          border-color: #E0C58A;
          color: #FFFFFF;
        }

        .sidebar__add-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #C6A15B;
          color: #141315;
          font-size: 0.65rem;
          font-weight: 800;
          min-width: 15px;
          height: 15px;
          padding: 0 3px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #141315;
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
          letter-spacing: 0.1em;
          border-radius: 4px;
          background: #4A1525;
          color: #F5F2ED;
          border: 1px solid rgba(198, 161, 91, 0.4);
          cursor: pointer;
          transition: all 0.18s;
        }

        .sidebar__empty-add:hover {
          background: #702A3C;
          border-color: #E0C58A;
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
          border-radius: 4px;
          text-align: left;
          transition: background var(--t-fast);
          min-width: 0;
        }
        .sidebar__me:hover {
          background: rgba(198, 161, 91, 0.08);
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
          color: #C6A15B;
          letter-spacing: 0.02em;
        }

        .sidebar__logout {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          border: 1px solid rgba(198, 161, 91, 0.18);
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
          padding: 12px 14px 6px;
          font-family: var(--font-cinzel);
          font-size: 9.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #C6A15B;
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
          color: #C6A15B;
          pointer-events: none;
        }
        .sidebar__search-input {
          width: 100%;
          padding: 8px 30px 8px 32px;
          background: rgba(24, 23, 28, 0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(198, 161, 91, 0.20);
          border-radius: 6px;
          color: var(--text-primary);
          font-family: var(--font-sans);
          font-size: 12px;
          outline: none;
          transition: border-color var(--t-fast);
        }
        .sidebar__search-input::placeholder { color: var(--text-muted); }
        .sidebar__search-input:focus { border-color: #E0C58A; }
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
          border-radius: 4px;
          background: linear-gradient(90deg, #18171A 25%, #232126 50%, #18171A 75%);
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
