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
          border-left: 3px solid transparent;
          cursor: pointer;
          text-align: left;
          transition: all 0.18s ease;
          border-radius: 8px;
          position: relative;
          margin-bottom: 3px;
        }
        .contact-item:hover {
          background: rgba(14, 30, 64, 0.55);
          border-color: rgba(59, 130, 246, 0.20);
        }
        .contact-item--active {
          background: rgba(29, 104, 246, 0.18);
          border-left-color: #38BDF8;
          border-top-color: rgba(59, 130, 246, 0.30);
          border-right-color: rgba(59, 130, 246, 0.30);
          border-bottom-color: rgba(59, 130, 246, 0.30);
          box-shadow: 0 4px 14px rgba(29, 104, 246, 0.15);
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
          color: #FFFFFF;
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
          color: #38BDF8;
        }
      `}</style>
    </button>
  );
};

export default ContactItem;
