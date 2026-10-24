/**
 * ContactItem — one row in the sidebar user list
 * @param {{ user, active, online, onClick }} props
 */
const ContactItem = ({ user, active, online = false, onClick }) => {
  const initials = user.fullname
    ? user.fullname.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <button
      className={`contact-item ${active ? 'contact-item--active' : ''}`}
      onClick={onClick}
      aria-label={`Chat with ${user.fullname}`}
    >
      {/* Avatar */}
      <div className="contact-avatar">
        {user.profilepicture ? (
          <img src={user.profilepicture} alt={user.fullname} className="contact-avatar__img" />
        ) : (
          <span className="contact-avatar__initials">{initials}</span>
        )}
        <span
          className={`contact-avatar__dot ${online ? 'contact-avatar__dot--online' : ''}`}
          title={online ? 'Online' : 'Offline'}
        />
      </div>

      {/* Info */}
      <div className="contact-info">
        <span className="contact-info__name">{user.fullname}</span>
        <span className="contact-info__sub">@{user.username}</span>
      </div>

      <style>{`
        .contact-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          background: none;
          border: none;
          border-left: 3px solid transparent;
          cursor: pointer;
          text-align: left;
          transition: background var(--t-fast), border-color var(--t-fast);
          border-radius: 0;
          position: relative;
        }
        .contact-item:hover {
          background: var(--bg-hover);
        }
        .contact-item--active {
          background: rgba(13, 92, 110, 0.22);
          border-left-color: var(--teal-bright);
        }

        /* Avatar */
        .contact-avatar {
          position: relative;
          flex-shrink: 0;
          width: 40px;
          height: 40px;
        }
        .contact-avatar__img {
          width: 40px;
          height: 40px;
          border-radius: var(--r-avatar);
          object-fit: cover;
          display: block;
          border: 1px solid var(--border-mist);
        }
        .contact-avatar__initials {
          width: 40px;
          height: 40px;
          border-radius: var(--r-avatar);
          background: var(--teal-dark);
          color: var(--teal-bright);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        .contact-avatar__dot {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--text-muted);
          border: 1.5px solid var(--bg-sidebar);
        }
        .contact-avatar__dot--online {
          background: var(--teal-bright);
          box-shadow: 0 0 0 2px rgba(23, 168, 196, 0.18);
        }

        /* Info */
        .contact-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .contact-info__name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .contact-info__sub {
          font-size: 12px;
          font-weight: 300;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .contact-item--active .contact-info__name {
          color: var(--text-primary);
        }
      `}</style>
    </button>
  )
}

export default ContactItem
