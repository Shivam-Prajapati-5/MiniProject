import Avatar from './Avatar';

/**
 * ContactItem — one row in the sidebar user list
 * @param {{ user: any, active: boolean, online: boolean, onClick: () => void }} props
 */
const ContactItem = ({ user, active, online = false, onClick }) => {
  return (
    <button
      className={`contact-item ${active ? 'contact-item--active' : ''}`}
      onClick={onClick}
      aria-label={`Chat with ${user.fullname}`}
    >
      {/* Universal Avatar */}
      <Avatar
        user={user}
        size={38}
        showOnline={true}
        isOnline={online}
      />

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
          padding: 10px 14px;
          background: transparent;
          border: 1px solid transparent;
          border-left: 2px solid transparent;
          cursor: pointer;
          text-align: left;
          transition: all 0.18s ease;
          border-radius: 4px;
          position: relative;
          margin-bottom: 2px;
        }
        .contact-item:hover {
          background: rgba(37, 38, 41, 0.45);
          border-color: rgba(198, 161, 91, 0.15);
        }
        .contact-item--active {
          background: #1E1D20;
          border-left-color: #C6A15B;
          border-top-color: rgba(198, 161, 91, 0.22);
          border-right-color: rgba(198, 161, 91, 0.22);
          border-bottom-color: rgba(198, 161, 91, 0.22);
        }

        .contact-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
          min-width: 0;
        }
        .contact-info__name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .contact-item--active .contact-info__name {
          color: #F5F2ED;
        }
        .contact-info__sub {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .contact-item--active .contact-info__sub {
          color: #C6A15B;
        }
      `}</style>
    </button>
  );
};

export default ContactItem;
