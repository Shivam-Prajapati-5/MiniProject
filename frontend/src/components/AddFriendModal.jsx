import { useState, useEffect } from 'react';
import { useChatContext } from '../context/ChatContext';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';

const AddFriendModal = ({ onClose }) => {
  const {
    pendingRequests,
    fetchPendingRequests,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
  } = useChatContext();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState(pendingRequests.length > 0 ? 'requests' : 'add');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actingId, setActingId] = useState(null);

  // Live debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return undefined;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } catch {
        addToast('Search failed', 'error');
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers, addToast]);

  const handleSendRequest = async (targetUser) => {
    try {
      setActingId(targetUser._id);
      await sendFriendRequest(targetUser._id);
      addToast(`Peer handshake dispatched to @${targetUser.username}`, 'success');

      setSearchResults(prev =>
        prev.map(u => (u._id === targetUser._id ? { ...u, friendStatus: 'pending_sent' } : u))
      );
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to dispatch request', 'error');
    } finally {
      setActingId(null);
    }
  };

  const handleAccept = async (requestId, senderName) => {
    try {
      setActingId(requestId);
      await acceptFriendRequest(requestId);
      addToast(`Reciprocal handshake ratified with ${senderName}!`, 'success');
      await fetchPendingRequests();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to accept request', 'error');
    } finally {
      setActingId(null);
    }
  };

  const handleDecline = async (requestId) => {
    try {
      setActingId(requestId);
      await declineFriendRequest(requestId);
      addToast('Handshake declined', 'info');
      await fetchPendingRequests();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to decline request', 'error');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="peer-modal-overlay" onClick={onClose}>
      <div className="peer-modal" onClick={(e) => e.stopPropagation()}>
        {/* Top Gold Hairline */}
        <div className="modal-hairline" />

        {/* Modal Header */}
        <div className="peer-modal__header">
          <div className="peer-modal__title-group">
            <span className="peer-modal__tag">NEXCHAT // CONTACT GATEWAY</span>
            <h2 className="peer-modal__title">Peer Mesh Discovery</h2>
            <p className="peer-modal__subtitle">Search verified socket handles &amp; ratify reciprocal handshakes</p>
          </div>
          <button className="peer-modal__close" onClick={onClose} title="Close (Esc)">
            ✕
          </button>
        </div>

        {/* Dual Tabs Navigation Strip */}
        <div className="peer-modal__tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'add' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <span>Add New Peer</span>
            {activeTab === 'add' && <div className="tab-bottom-bar" />}
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'requests' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <span>Pending Handshakes</span>
            {pendingRequests.length > 0 && (
              <span className="tab-badge">{pendingRequests.length}</span>
            )}
            {activeTab === 'requests' && <div className="tab-bottom-bar" />}
          </button>
        </div>

        {/* Modal Body */}
        <div className="peer-modal__body">
          {/* TAB 1: Add New Peer */}
          {activeTab === 'add' && (
            <div className="tab-content">
              {/* Search Bar */}
              <div className="peer-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by username or name (e.g. @alex_r, Sarah)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="search-input"
                />
                {searchQuery && (
                  <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>

              {/* Status Row */}
              <div className="section-label-row">
                <div className="section-label-left">
                  <span className="dot-gold"></span>
                  <span className="section-title">
                    {searching
                      ? 'SEARCHING MESH IDENTIFIERS…'
                      : searchQuery
                        ? `VERIFIED IDENTIFIERS // ${searchResults.length} FOUND`
                        : 'DIRECT PEER LOOKUP'}
                  </span>
                </div>
                <span className="section-meta">TLS 1.3 RATIFIED</span>
              </div>

              {/* Results List */}
              <div className="results-scroll">
                {!searchQuery.trim() ? (
                  <div className="peer-empty-state">
                    <span className="empty-icon">🔐</span>
                    <p className="empty-title">Privacy-First Directory</p>
                    <p className="empty-hint">
                      Users are not broadcasted openly. Type a handle or name above to locate a peer and dispatch a handshake.
                    </p>
                  </div>
                ) : searching ? (
                  <div className="peer-loading">
                    <span className="spinner-modal" />
                    <span>Searching node directory…</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="peer-empty-state">
                    <span className="empty-icon">⚡</span>
                    <p className="empty-title">No Peer Found</p>
                    <p className="empty-hint">No user matches &quot;{searchQuery}&quot;. Verify the handle and try again.</p>
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <div key={user._id} className="peer-card">
                      <div className="peer-card__left">
                        <Avatar user={user} size={42} showOnline={false} />
                        <div className="peer-card__info">
                          <div className="peer-card__name-row">
                            <span className="peer-card__name">{user.fullname}</span>
                            <span className="peer-card__tag">VERIFIED</span>
                          </div>
                          <span className="peer-card__handle">@{user.username}</span>
                        </div>
                      </div>

                      <div className="peer-card__action">
                        {user.friendStatus === 'friends' ? (
                          <span className="status-badge status-badge--friends">
                            ✓ Connected
                          </span>
                        ) : user.friendStatus === 'pending_sent' ? (
                          <span className="status-badge status-badge--sent">
                            Handshake Dispatched ✓
                          </span>
                        ) : user.friendStatus === 'pending_received' ? (
                          <button
                            className="editorial-btn editorial-btn--primary"
                            onClick={() => setActiveTab('requests')}
                          >
                            Review Request →
                          </button>
                        ) : (
                          <button
                            className="peer-btn-handshake"
                            onClick={() => handleSendRequest(user)}
                            disabled={actingId === user._id}
                          >
                            {actingId === user._id ? (
                              <span className="spinner-sm" />
                            ) : (
                              <>
                                <span>Send Peer Handshake</span>
                                <span className="arrow">→</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Pending Handshakes */}
          {activeTab === 'requests' && (
            <div className="tab-content">
              <div className="section-label-row">
                <div className="section-label-left">
                  <span className="dot-gold"></span>
                  <span className="section-title">
                    INCOMING PEER HANDSHAKES ({pendingRequests.length})
                  </span>
                </div>
                <span className="section-meta">RECIPROCAL APPROVAL REQUIRED</span>
              </div>

              <div className="results-scroll">
                {pendingRequests.length === 0 ? (
                  <div className="peer-empty-state">
                    <span className="empty-icon">✨</span>
                    <p className="empty-title">No Pending Handshakes</p>
                    <p className="empty-hint">When another peer invites you to chat, their cryptographic request will arrive here.</p>
                  </div>
                ) : (
                  pendingRequests.map((req) => (
                    <div key={req._id} className="peer-card">
                      <div className="peer-card__left">
                        <Avatar user={req.sender} size={42} showOnline={false} />
                        <div className="peer-card__info">
                          <span className="peer-card__name">{req.sender?.fullname || 'Unknown Peer'}</span>
                          <span className="peer-card__handle">@{req.sender?.username}</span>
                        </div>
                      </div>

                      <div className="peer-card__action-group">
                        <button
                          className="peer-btn-accept"
                          onClick={() => handleAccept(req._id, req.sender?.fullname)}
                          disabled={actingId === req._id}
                        >
                          {actingId === req._id ? <span className="spinner-sm" /> : 'Accept Handshake'}
                        </button>
                        <button
                          className="peer-btn-decline"
                          onClick={() => handleDecline(req._id)}
                          disabled={actingId === req._id}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Security Disclosure Footer */}
        <div className="peer-modal__footer">
          <span className="footer-shield">🛡️</span>
          <p className="footer-disclosure">
            <strong className="footer-strong">Privacy Protocol:</strong> Unconnected peers cannot inspect your presence, read message frames, or establish direct channels without reciprocal handshake ratification.
          </p>
        </div>
      </div>

      <style>{`
        .peer-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 9, 11, 0.82);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fadeIn 200ms ease;
        }

        .peer-modal {
          position: relative;
          width: 100%;
          max-width: 580px;
          background: #18171A;
          border: 1px solid rgba(198, 161, 91, 0.25);
          border-radius: 8px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(198, 161, 91, 0.2);
          overflow: hidden;
          animation: popIn 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .modal-hairline {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #E0C58A, transparent);
        }

        .peer-modal__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 22px 24px 16px;
          border-bottom: 1px solid rgba(198, 161, 91, 0.15);
        }

        .peer-modal__tag {
          font-family: var(--font-cinzel);
          font-size: 9px;
          letter-spacing: 0.2em;
          color: #C6A15B;
          display: block;
          margin-bottom: 4px;
        }

        .peer-modal__title {
          font-family: var(--font-serif);
          font-size: 1.55rem;
          font-weight: 500;
          color: #F5F2ED;
          line-height: 1.1;
        }

        .peer-modal__subtitle {
          font-size: 12px;
          color: #77777D;
          margin-top: 4px;
        }

        .peer-modal__close {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: #201F21;
          border: 1px solid rgba(198, 161, 91, 0.2);
          color: #A39E9B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.15s;
        }
        .peer-modal__close:hover {
          color: #F5F2ED;
          background: #4A1525;
          border-color: #E0C58A;
        }

        /* Tabs */
        .peer-modal__tabs {
          display: flex;
          padding: 0 24px;
          background: #141315;
          border-bottom: 1px solid rgba(198, 161, 91, 0.15);
        }

        .tab-btn {
          position: relative;
          background: none;
          border: none;
          padding: 12px 18px;
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #77777D;
          cursor: pointer;
          transition: color 0.18s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tab-btn:hover { color: #F5F2ED; }
        .tab-btn--active { color: #E0C58A; }

        .tab-bottom-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: #E0C58A;
        }

        .tab-badge {
          background: #C6A15B;
          color: #141315;
          font-size: 10px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
        }

        /* Body */
        .peer-modal__body {
          padding: 20px 24px;
        }

        .peer-search-bar {
          position: relative;
          display: flex;
          align-items: center;
          background: #0F0E10;
          border: 1px solid rgba(198, 161, 91, 0.22);
          border-radius: 5px;
          padding: 10px 14px;
          margin-bottom: 16px;
        }
        .search-icon { font-size: 14px; margin-right: 10px; }
        .search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #F5F2ED;
          font-family: var(--font-sans);
          font-size: 13px;
        }
        .search-input::placeholder { color: #77777D; }
        .search-clear-btn {
          background: none;
          border: none;
          color: #77777D;
          cursor: pointer;
          font-size: 12px;
        }

        .section-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 10px;
          color: #77777D;
          margin-bottom: 12px;
        }
        .section-label-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dot-gold {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #C6A15B;
        }
        .section-title {
          color: #C6A15B;
          letter-spacing: 0.1em;
          font-weight: 600;
        }

        .results-scroll {
          max-height: 260px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .peer-card {
          background: #1C1B1D;
          border: 1px solid rgba(198, 161, 91, 0.15);
          border-radius: 6px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          transition: border-color 0.18s;
        }
        .peer-card:hover { border-color: rgba(198, 161, 91, 0.35); }

        .peer-card__left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .peer-card__info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .peer-card__name-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .peer-card__name {
          font-size: 13.5px;
          font-weight: 600;
          color: #F5F2ED;
        }
        .peer-card__tag {
          font-family: var(--font-cinzel);
          font-size: 8px;
          letter-spacing: 0.1em;
          background: rgba(198, 161, 91, 0.15);
          color: #E0C58A;
          padding: 1px 4px;
          border-radius: 2px;
        }
        .peer-card__handle {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #77777D;
        }

        .peer-btn-handshake {
          background: #4A1525;
          border: 1px solid rgba(198, 161, 91, 0.4);
          color: #E0C58A;
          font-family: var(--font-sans);
          font-size: 11px;
          letter-spacing: 0.08em;
          font-weight: 600;
          text-transform: uppercase;
          padding: 7px 12px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.18s;
        }
        .peer-btn-handshake:hover:not(:disabled) {
          background: #702A3C;
          border-color: #E0C58A;
          color: #FFFFFF;
        }

        .peer-card__action-group {
          display: flex;
          gap: 8px;
        }
        .peer-btn-accept {
          background: #4A1525;
          border: 1px solid rgba(198, 161, 91, 0.4);
          color: #E0C58A;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        .peer-btn-accept:hover { background: #702A3C; color: #FFF; }
        .peer-btn-decline {
          background: transparent;
          border: 1px solid #77777D;
          color: #77777D;
          font-size: 11px;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        .peer-btn-decline:hover { color: #FFB4AB; border-color: #FFB4AB; }

        .status-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 3px;
        }
        .status-badge--friends {
          background: rgba(16, 185, 129, 0.15);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .status-badge--sent {
          background: rgba(198, 161, 91, 0.15);
          color: #E0C58A;
          border: 1px solid rgba(198, 161, 91, 0.3);
        }

        .peer-empty-state {
          padding: 32px 16px;
          text-align: center;
          color: #77777D;
        }
        .empty-icon { font-size: 24px; display: block; margin-bottom: 8px; }
        .empty-title {
          font-family: var(--font-serif);
          font-size: 1.15rem;
          color: #F5F2ED;
          margin-bottom: 4px;
        }
        .empty-hint { font-size: 11.5px; max-width: 380px; margin: 0 auto; line-height: 1.5; }

        .peer-loading {
          padding: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #E0C58A;
          font-family: var(--font-mono);
          font-size: 11px;
        }

        .spinner-modal {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(224, 197, 138, 0.3);
          border-top-color: #E0C58A;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        /* Footer */
        .peer-modal__footer {
          background: #141315;
          border-top: 1px solid rgba(198, 161, 91, 0.15);
          padding: 14px 24px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .footer-shield { font-size: 14px; margin-top: 2px; }
        .footer-disclosure {
          font-size: 11px;
          line-height: 1.45;
          color: #77777D;
        }
        .footer-strong { color: #F5F2ED; }
      `}</style>
    </div>
  );
};

export default AddFriendModal;
