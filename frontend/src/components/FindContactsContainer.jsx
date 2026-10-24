import { useState, useEffect } from 'react';
import { useChatContext } from '../context/ChatContext';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';

/**
 * FindContactsContainer — main-page container for searching users and managing friend requests
 * Appears in the main central area so cards and words have full width and never get squished.
 */
const FindContactsContainer = () => {
  const {
    pendingRequests,
    fetchPendingRequests,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    selectUser,
    setIsFindingContacts,
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

  const handleAccept = async (requestId, sender) => {
    try {
      setActingId(requestId);
      await acceptFriendRequest(requestId);
      addToast(`Connected with ${sender?.fullname || 'User'}!`, 'success');
      await fetchPendingRequests();
      if (sender) {
        selectUser(sender);
      }
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
    <div className="main-contacts-wrapper">
      <div className="main-contacts-container">
        <div className="container-hairline" />

        {/* 1. Header with mobile back button */}
        <div className="contacts-header">
          <button
            className="contacts-mobile-back"
            onClick={() => {
              setIsFindingContacts(false);
              selectUser(null);
            }}
            aria-label="Back to contacts list"
          >
            ← Back to Contacts
          </button>

          <div className="contacts-header__title-group">
            <h2 className="contacts-title">Find Contacts</h2>
            <p className="contacts-subtitle">
              Search users by username or name to send a friend request
            </p>
          </div>
        </div>

        {/* 2. Mode Tabs */}
        <div className="contacts-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'add' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <span>Find People</span>
            {activeTab === 'add' && <div className="tab-indicator" />}
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
            {activeTab === 'requests' && <div className="tab-indicator" />}
          </button>
        </div>

        {/* 3. Tab Body */}
        <div className="contacts-body">
          {activeTab === 'add' && (
            <div className="tab-pane">
              {/* Search Bar */}
              <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by username or name (e.g. Alex, @sarah_c)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  autoFocus
                />
                {searchQuery && (
                  <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                    ✕
                  </button>
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

              {/* Search Results List */}
              <div className="results-scroll">
                {!searchQuery.trim() ? (
                  <div className="pane-empty-state">
                    <span className="empty-emoji">🤝</span>
                    <h3 className="empty-heading">Connect with People</h3>
                    <p className="empty-copy">
                      Search by name or username above to find people and start chatting once they accept your request.
                    </p>
                  </div>
                ) : searching ? (
                  <div className="pane-loading">
                    <span className="spinner-pane" />
                    <span>Searching directory…</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="pane-empty-state">
                    <span className="empty-emoji">🔍</span>
                    <h3 className="empty-heading">No users found</h3>
                    <p className="empty-copy">
                      No user matches &quot;{searchQuery}&quot;. Check the spelling and try again.
                    </p>
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <div key={user._id} className="user-contact-card">
                      <div className="user-contact-card__left">
                        <Avatar user={user} size={44} showOnline={false} />
                        <div className="user-contact-card__info">
                          <span className="user-contact-card__name">{user.fullname}</span>
                          <span className="user-contact-card__handle">@{user.username}</span>
                        </div>
                      </div>

                      <div className="user-contact-card__action">
                        {user.friendStatus === 'friends' ? (
                          <span className="status-pill status-pill--friends">
                            ✓ Connected
                          </span>
                        ) : user.friendStatus === 'pending_sent' ? (
                          <span className="status-pill status-pill--sent">
                            Request Sent ✓
                          </span>
                        ) : user.friendStatus === 'pending_received' ? (
                          <button
                            className="btn-respond"
                            onClick={() => setActiveTab('requests')}
                          >
                            Respond →
                          </button>
                        ) : (
                          <button
                            className="btn-add-contact"
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
            <div className="tab-pane">
              <div className="section-label-row">
                <span className="section-title">
                  Pending Friend Requests ({pendingRequests.length})
                </span>
              </div>

              <div className="results-scroll">
                {pendingRequests.length === 0 ? (
                  <div className="pane-empty-state">
                    <span className="empty-emoji">✨</span>
                    <h3 className="empty-heading">No Pending Requests</h3>
                    <p className="empty-copy">
                      When someone sends you a friend request, you will see it here.
                    </p>
                  </div>
                ) : (
                  pendingRequests.map((req) => (
                    <div key={req._id} className="user-contact-card">
                      <div className="user-contact-card__left">
                        <Avatar user={req.sender} size={44} showOnline={false} />
                        <div className="user-contact-card__info">
                          <span className="user-contact-card__name">
                            {req.sender?.fullname || 'User'}
                          </span>
                          <span className="user-contact-card__handle">
                            @{req.sender?.username}
                          </span>
                        </div>
                      </div>

                      <div className="user-contact-card__actions">
                        <button
                          className="btn-accept"
                          onClick={() => handleAccept(req._id, req.sender)}
                          disabled={actingId === req._id}
                        >
                          {actingId === req._id ? <span className="spinner-sm" /> : 'Accept ✓'}
                        </button>
                        <button
                          className="btn-decline"
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

          {/* 4. Privacy & Protection Shield Notice */}
          <div className="privacy-shield-notice">
            <span className="shield-icon">🛡️</span>
            <p className="shield-text">
              Only users with accepted requests will appear in your contacts list and be able to message you.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .main-contacts-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          width: 100%;
        }

        .main-contacts-container {
          position: relative;
          width: 100%;
          max-width: 660px;
          background: rgba(24, 23, 28, 0.76);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid rgba(198, 161, 91, 0.28);
          border-top-color: rgba(224, 197, 138, 0.45);
          border-radius: 12px;
          box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.75), 0 0 30px rgba(198, 161, 91, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.12);
          overflow: hidden;
          animation: fadeIn 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .container-hairline {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #E0C58A, transparent);
        }

        .contacts-header {
          padding: 24px 28px 16px;
          border-bottom: 1px solid rgba(198, 161, 91, 0.18);
          background: rgba(20, 19, 23, 0.85);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .contacts-mobile-back {
          display: none;
          align-self: flex-start;
          background: rgba(35, 33, 38, 0.8);
          border: 1px solid rgba(198, 161, 91, 0.25);
          color: #E0C58A;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 4px;
        }

        .contacts-title {
          font-family: var(--font-serif);
          font-size: 1.55rem;
          font-weight: 500;
          color: #F5F2ED;
        }

        .contacts-subtitle {
          font-size: 13px;
          color: #A39E9B;
          margin-top: 4px;
          line-height: 1.5;
        }

        .contacts-tabs {
          display: flex;
          padding: 0 28px;
          background: rgba(16, 15, 19, 0.65);
          border-bottom: 1px solid rgba(198, 161, 91, 0.15);
        }

        .tab-btn {
          position: relative;
          background: none;
          border: none;
          padding: 14px 20px;
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 600;
          color: #77777D;
          cursor: pointer;
          transition: color 0.18s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tab-btn:hover { color: #F5F2ED; }
        .tab-btn--active { color: #E0C58A; }

        .tab-indicator {
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
          padding: 2px 7px;
          border-radius: 999px;
        }

        .contacts-body {
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .search-bar {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(16, 15, 19, 0.75);
          border: 1px solid rgba(198, 161, 91, 0.25);
          border-radius: 6px;
          padding: 10px 14px;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .search-bar:focus-within {
          border-color: #E0C58A;
          box-shadow: 0 0 16px rgba(198, 161, 91, 0.15);
        }

        .search-icon {
          font-size: 14px;
          margin-right: 10px;
        }

        .search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #F5F2ED;
          font-family: var(--font-sans);
          font-size: 13.5px;
        }
        .search-input::placeholder { color: #77777D; }

        .search-clear-btn {
          background: none;
          border: none;
          color: #77777D;
          cursor: pointer;
          font-size: 12px;
          padding: 4px;
        }
        .search-clear-btn:hover { color: #F5F2ED; }

        .section-label-row {
          margin-top: 4px;
          margin-bottom: 10px;
        }

        .section-title {
          font-family: var(--font-cinzel);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          color: #C6A15B;
          text-transform: uppercase;
        }

        .results-scroll {
          max-height: 380px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 4px;
        }

        .pane-empty-state {
          padding: 36px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .empty-emoji {
          font-size: 32px;
          margin-bottom: 4px;
        }

        .empty-heading {
          font-family: var(--font-serif);
          font-size: 1.15rem;
          color: #F5F2ED;
          font-weight: 500;
        }

        .empty-copy {
          font-size: 12.5px;
          color: #77777D;
          max-width: 380px;
          line-height: 1.5;
        }

        .pane-loading {
          padding: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #C6A15B;
          font-size: 12.5px;
        }

        .spinner-pane {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(224, 197, 138, 0.3);
          border-top-color: #E0C58A;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .user-contact-card {
          background: rgba(28, 26, 32, 0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(198, 161, 91, 0.18);
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          transition: background 0.18s, border-color 0.18s;
        }
        .user-contact-card:hover {
          background: rgba(35, 33, 40, 0.85);
          border-color: rgba(224, 197, 138, 0.35);
        }

        .user-contact-card__left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .user-contact-card__info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .user-contact-card__name {
          font-size: 13.5px;
          font-weight: 600;
          color: #F5F2ED;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-contact-card__handle {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #C6A15B;
        }

        .status-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 999px;
        }
        .status-pill--friends {
          background: rgba(16, 185, 129, 0.15);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .status-pill--sent {
          background: rgba(198, 161, 91, 0.15);
          color: #E0C58A;
          border: 1px solid rgba(198, 161, 91, 0.3);
        }

        .btn-add-contact {
          background: #4A1525;
          border: 1px solid rgba(198, 161, 91, 0.38);
          color: #F5F2ED;
          font-size: 12px;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .btn-add-contact:hover {
          background: #702A3C;
          border-color: #E0C58A;
          box-shadow: 0 4px 12px rgba(74, 21, 37, 0.45);
        }

        .btn-respond {
          background: #4A1525;
          border: 1px solid rgba(198, 161, 91, 0.38);
          color: #E0C58A;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
        }

        .user-contact-card__actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .btn-accept {
          background: #4A1525;
          border: 1px solid rgba(198, 161, 91, 0.38);
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.18s;
        }
        .btn-accept:hover {
          background: #702A3C;
          border-color: #E0C58A;
        }

        .btn-decline {
          background: rgba(30, 29, 33, 0.8);
          border: 1px solid rgba(255, 180, 171, 0.25);
          color: #FFB4AB;
          font-size: 12px;
          font-weight: 500;
          padding: 7px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.18s;
        }
        .btn-decline:hover {
          background: rgba(147, 0, 10, 0.35);
          border-color: #FFB4AB;
        }

        .privacy-shield-notice {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(16, 15, 19, 0.65);
          border: 1px solid rgba(198, 161, 91, 0.18);
          border-radius: 8px;
          padding: 12px 16px;
          margin-top: 6px;
        }

        .shield-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .shield-text {
          font-size: 12px;
          color: #A39E9B;
          line-height: 1.45;
        }

        @media (max-width: 768px) {
          .contacts-mobile-back {
            display: inline-flex;
          }
          .contacts-header {
            padding: 18px 18px 14px;
          }
          .contacts-tabs {
            padding: 0 16px;
          }
          .tab-btn {
            padding: 12px 14px;
            font-size: 12px;
          }
          .contacts-body {
            padding: 18px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default FindContactsContainer;
