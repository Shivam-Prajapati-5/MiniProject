/* EmptyState — shown in chat area when no conversation is selected */
const EmptyState = () => (
  <div className="empty-state">
    <div className="empty-state__icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2L2 9l10 7 10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 15l10 7 10-7" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
        <path d="M2 11l10 7 10-7" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      </svg>
    </div>
    <span className="empty-state__tag">NEXCHAT // SECURE TERMINAL</span>
    <h2 className="empty-state__title">Select a Conversation</h2>
    <p className="empty-state__sub">Choose an active peer from the sidebar or click + to search verified handles</p>

    <style>{`
      .empty-state {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 40px;
        animation: fadeIn 300ms var(--ease);
        background: #141315;
        background-image: radial-gradient(rgba(198, 161, 91, 0.03) 1px, transparent 0);
        background-size: 28px 28px;
      }
      .empty-state__icon {
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #38101C;
        border: 1px solid rgba(198, 161, 91, 0.4);
        border-radius: 8px;
        color: #E0C58A;
        margin-bottom: 8px;
        box-shadow: 0 4px 18px rgba(74, 21, 37, 0.45);
      }
      .empty-state__icon svg {
        width: 32px;
        height: 32px;
      }
      .empty-state__tag {
        font-family: var(--font-cinzel);
        font-size: 9px;
        letter-spacing: 0.22em;
        color: #C6A15B;
      }
      .empty-state__title {
        font-family: var(--font-serif);
        font-size: 1.6rem;
        font-weight: 500;
        color: #F5F2ED;
        letter-spacing: -0.01em;
      }
      .empty-state__sub {
        font-size: 12.5px;
        color: #77777D;
        text-align: center;
        max-width: 320px;
        line-height: 1.5;
      }
    `}</style>
  </div>
)

export default EmptyState
