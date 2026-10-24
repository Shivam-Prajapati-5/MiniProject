/* EmptyState — shown in chat area when no conversation is selected */
const EmptyState = () => (
  <div className="empty-state">
    <div className="empty-state__icon">
      <svg viewBox="0 0 80 80" fill="none">
        {/* outer bubble */}
        <rect x="6" y="10" width="52" height="38" rx="10" stroke="var(--teal-mid)" strokeWidth="2.5" />
        {/* tail */}
        <path d="M18 48 L12 58 L30 50" stroke="var(--teal-mid)" strokeWidth="2.5" strokeLinejoin="round" />
        {/* inner bubble (receiver) */}
        <rect x="26" y="32" width="46" height="30" rx="9" stroke="var(--teal-bright)" strokeWidth="2" strokeDasharray="4 3" />
        {/* dots inside first bubble */}
        <circle cx="20" cy="29" r="3" fill="var(--teal-mid)" />
        <circle cx="30" cy="29" r="3" fill="var(--teal-mid)" />
        <circle cx="40" cy="29" r="3" fill="var(--teal-mid)" />
        {/* mint accent dot */}
        <circle cx="64" cy="22" r="5" fill="var(--mint-sender)" opacity="0.7" />
      </svg>
    </div>
    <h2 className="empty-state__title">Pick a conversation</h2>
    <p className="empty-state__sub">Select a contact from the sidebar to start chatting</p>

    <style>{`
      .empty-state {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        padding: 40px;
        animation: fadeIn 300ms var(--ease);
      }
      .empty-state__icon {
        width: 100px;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(13, 92, 110, 0.12);
        border-radius: 50%;
        margin-bottom: 8px;
      }
      .empty-state__icon svg {
        width: 60px;
        height: 60px;
      }
      .empty-state__title {
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: -0.3px;
      }
      .empty-state__sub {
        font-size: 14px;
        color: var(--text-muted);
        text-align: center;
        max-width: 260px;
        line-height: 1.55;
      }
    `}</style>
  </div>
)

export default EmptyState
