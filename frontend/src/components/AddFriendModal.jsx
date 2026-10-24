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
      addToast(`Friend request sent to @${targetUser.username}`, 'success');

      setSearchResults(prev =>
        prev.map(u => (u._id === targetUser._id ? { ...u, friendStatus: 'pending_sent' } : u))
      );
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to send request', 'error');
    } finally {
      setActingId(null);
    }
  };

  const handleAccept = async (requestId, senderName) => {
    try {
      setActingId(requestId);
      await acceptFriendRequest(requestId);
      addToast(`Connected with ${senderName}!`, 'success');
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
      addToast('Request declined', 'info');
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
        <div className="modal-hairline" />

        {/* Modal Header */}
        <div className="peer-modal__header">
          <div className="peer-modal__title-group">
            <h2 className="peer-modal__title">Find Contacts</h2>
            <p className="peer-modal__subtitle">Search users by username or name to send a friend request</p>
          </div>
          <button className="peer-modal__close" onClick={onClose} title="Close (Esc)">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="peer-modal__tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'add' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <span>Find People</span>
            {activeTab === 'add' && <div className="tab-bottom-bar" />}
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'requests' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <span>Friend Requests</span>
            {pendingRequests.length > 0 && (
              <span className="tab-badge">{pendingRequests.length}</span>
            )}
            {activeTab === 'requests' && <div className="tab-bottom-bar" />}
          </button>
        </div>

        {/* Body */}
        <div className="peer-modal__body">
          {activeTab === 'add' && (
            <div className="tab-content">
              {/* Search Bar */}
              <div className="peer-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by username or name (e.g. Alex, @sarah_c)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="search-input"
                />
                {searchQuery && (
                  <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>

              {/* Status Header */}
              <div className="section-label-row">
                <span className="section-title">
                  {searching
                    ? 'Searching users…'
                    : searchQuery
                      ? `Matching Users (${searchResults.length})`
                      : 'Search to find users'}
                </span>
              </div>

              {/* Results List */}
              <div className="results-scroll">
                {!searchQuery.trim() ? (
                  <div className="peer-empty-state">
                    <span className="empty-icon">🤝</span>
                    <p className="empty-title">Connect with People</p>
                    <p className="empty-hint">
                      Search by name or username above to find people and start chatting once they accept your request.
                    </p>
                  </div>
                ) : searching ? (
                  <div className="peer-loading">
                    <span className="spinner-modal" />
                    <span>Searching directory…</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="peer-empty-state">
                    <span className="empty-icon">🔍</span>
                    <p className="empty-title">No users found</p>
                    <p className="empty-hint">No user matches &quot;{searchQuery}&quot;. Check the spelling and try again.</p>
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <div key={user._id} className="peer-card">
                      <div className="peer-card__left">
                        <Avatar user={user} size={40} showOnline={false} />
                        <div className="peer-card__info">
                          <span className="peer-card__name">{user.fullname}</span>
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
                            Request Sent ✓
                          </span>
                        ) : user.friendStatus === 'pending_received' ? (
                          <button
                            className="editorial-btn editorial-btn--primary"
                            onClick={() => setActiveTab('requests')}
                          >
                            Respond →
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
                              'Add Contact +'
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

          {activeTab === 'requests' && (
            <div className="tab-content">
              <div className="section-label-row">
                <span className="section-title">
                  Pending Friend Requests ({pendingRequests.length})
                </span>
              </div>

              <div className="results-scroll">
                {pendingRequests.length === 0 ? (
                  <div className="peer-empty-state">
                    <span className="empty-icon">✨</span>
                    <p className="empty-title">No Pending Requests</p>
                    <p className="empty-hint">When someone sends you a friend request, you will see it here.</p>
                  </div>
                ) : (
                  pendingRequests.map((req) => (
                    <div key={req._id} className="peer-card">
                      <div className="peer-card__left">
                        <Avatar user={req.sender} size={40} showOnline={false} />
                        <div className="peer-card__info">
                          <span className="peer-card__name">{req.sender?.fullname || 'User'}</span>
                          <span className="peer-card__handle">@{req.sender?.username}</span>
                        </div>
                      </div>

                      <div className="peer-card__action-group">
                        <button
                          className="peer-btn-accept"
                          onClick={() => handleAccept(req._id, req.sender?.fullname)}
                          disabled={actingId === req._id}
                        >
                          {actingId === req._id ? <span className="spinner-sm" /> : 'Accept'}
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

        {/* Footer */}
        <div className="peer-modal__footer">
          <span className="footer-shield">🛡️</span>
          <p className="footer-disclosure">
            Only users with accepted requests will appear in your contacts list and be able to message you.
          </p>
        </div>
      </div>

      <style>{`
        .peer-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 9, 11, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
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
          max-width: 520px;
          max-height: 88vh;
          max-height: 88dvh;
          display: flex;
          flex-direction: column;
          background: rgba(22, 21, 26, 0.86);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid rgba(198, 161, 91, 0.28);
          border-top-color: rgba(224, 197, 138, 0.45);
          border-radius: 10px;
          box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.85), 0 0 30px rgba(198, 161, 91, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.12);
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
          padding: 18px 20px 14px;
          background: rgba(24, 23, 28, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(198, 161, 91, 0.15);
        }

        .peer-modal__title {
          font-family: var(--font-serif);
          font-size: 1.4rem;
          font-weight: 500;
          color: #F5F2ED;
          line-height: 1.2;
        }

        .peer-modal__subtitle {
          font-size: 12px;
          color: #77777D;
          margin-top: 3px;
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
          flex-shrink: 0;
        }
        .peer-modal__close:hover {
          color: #F5F2ED;
          background: #4A1525;
          border-color: #E0C58A;
        }

        /* Tabs */
        .peer-modal__tabs {
          display: flex;
          padding: 0 20px;
          background: rgba(20, 19, 23, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(198, 161, 91, 0.15);
        }

        .tab-btn {
          position: relative;
          background: none;
          border: none;
          padding: 11px 16px;
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 600;
          color: #77777D;
          cursor: pointer;
          transition: color 0.18s;
          display: flex;
          align-items: center;
          gap: 6px;
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
          padding: 16px 20px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          flex: 1;
        }

        .peer-search-bar {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(15, 14, 18, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(198, 161, 91, 0.22);
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 14px;
        }
        .search-icon { font-size: 13px; margin-right: 8px; }
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
          font-size: 11px;
        }

        .section-label-row {
          margin-bottom: 10px;
        }
        .section-title {
          font-size: 11.5px;
          font-weight: 600;
          color: #E0C58A;
        }

        .results-scroll {
          max-height: 280px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .peer-card {
          background: #1C1B1D;
          border: 1px solid rgba(198, 161, 91, 0.15);
          border-radius: 6px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .peer-card__left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .peer-card__info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .peer-card__name {
          font-size: 13px;
          font-weight: 600;
          color: #F5F2ED;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s;
        }
        .peer-btn-handshake:hover:not(:disabled) {
          background: #702A3C;
          border-color: #E0C58A;
          color: #FFFFFF;
        }

        .peer-card__action-group {
          display: flex;
          gap: 6px;
        }
        .peer-btn-accept {
          background: #4A1525;
          border: 1px solid rgba(198, 161, 91, 0.4);
          color: #E0C58A;
          font-size: 11px;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        .peer-btn-accept:hover { background: #702A3C; color: #FFF; }
        .peer-btn-decline {
          background: transparent;
          border: 1px solid #77777D;
          color: #77777D;
          font-size: 11px;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        .peer-btn-decline:hover { color: #FFB4AB; border-color: #FFB4AB; }

        .status-badge {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 3px;
          white-space: nowrap;
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
          padding: 28px 14px;
          text-align: center;
          color: #77777D;
        }
        .empty-icon { font-size: 22px; display: block; margin-bottom: 6px; }
        .empty-title {
          font-family: var(--font-serif);
          font-size: 1.1rem;
          color: #F5F2ED;
          margin-bottom: 4px;
        }
        .empty-hint { font-size: 11.5px; max-width: 320px; margin: 0 auto; line-height: 1.45; }

        .peer-loading {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #E0C58A;
          font-size: 11.5px;
        }

        .spinner-modal {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(224, 197, 138, 0.3);
          border-top-color: #E0C58A;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        /* Footer */
        .peer-modal__footer {
          background: #141315;
          border-top: 1px solid rgba(198, 161, 91, 0.15);
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .footer-shield { font-size: 13px; }
        .footer-disclosure {
          font-size: 11px;
          line-height: 1.4;
          color: #77777D;
        }

        @media (max-width: 480px) {
          .peer-modal { max-height: 92vh; }
          .peer-modal__header { padding: 14px 16px 12px; }
          .peer-modal__body { padding: 12px 14px; }
          .peer-card { flex-direction: column; align-items: flex-start; gap: 8px; }
          .peer-card__action { width: 100%; display: flex; justify-content: flex-end; }
        }
      `}</style>
    </div>
  );
};

export default AddFriendModal;
