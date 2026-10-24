import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import EmojiAvatarPicker from './EmojiAvatarPicker';

/**
 * ProfilePanel — editorial slide-in drawer
 * @param {{ onClose: () => void }} props
 */
const ProfilePanel = ({ onClose }) => {
  const { authUser, updateProfileAvatar, logout } = useAuth();
  const { addToast } = useToast();
  const [showPicker, setShowPicker] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  if (!authUser) return null;

  const handleSelectEmoji = async (emoji) => {
    try {
      setSavingAvatar(true);
      await updateProfileAvatar(emoji);
      addToast(`Persona glyph updated to ${emoji}!`, 'success');
      setShowPicker(false);
    } catch {
      addToast('Failed to update avatar', 'error');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleCopyHandle = () => {
    navigator.clipboard?.writeText(`@${authUser.username}`);
    addToast(`Copied @${authUser.username} to clipboard`, 'success');
  };

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Slide-In Sheet */}
      <div className="drawer-panel" role="dialog" aria-label="Profile and Node settings">
        {/* Top Gold Hairline */}
        <div className="drawer-hairline" />

        {/* 1. Header Bar */}
        <div className="drawer-header">
          <div className="drawer-header__titles">
            <h2 className="drawer-title">Profile &amp; Settings</h2>
            <p className="drawer-subtitle">Identity persona, account enclave &amp; session controls</p>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="drawer-body">
          {/* 2. Persona Avatar Showcase Card */}
          <section className="drawer-card drawer-card--center">
            <div className="avatar-wrap">
              <Avatar user={authUser} size={76} showOnline={true} isOnline={true} />
            </div>

            <div className="profile-name-row">
              <h3 className="profile-name">{authUser.fullname}</h3>
              <span className="profile-verified" title="Verified Session">✓</span>
            </div>

            <div className="socket-pill">
              <span className="socket-dot"></span>
              <span className="socket-text">SOCKET PEER: @{authUser.username}</span>
            </div>

            <div className="handle-copy-row">
              <span className="handle-text">@{authUser.username}</span>
              <button className="handle-copy-btn" onClick={handleCopyHandle} title="Copy handle">
                Copy
              </button>
            </div>
          </section>

          {/* 3. Change Persona Glyph Section */}
          <section className="drawer-section">
            <div className="section-head">
              <div>
                <span className="section-label">PERSONA SQUIRCLE GLYPH</span>
                <span className="section-sub">18 Curated UTF-8 Tokens</span>
              </div>
              <button
                className="picker-toggle-btn"
                onClick={() => setShowPicker(!showPicker)}
              >
                {showPicker ? 'Close Picker' : 'Change Avatar ✏️'}
              </button>
            </div>

            {showPicker && (
              <div className="picker-dropdown">
                <EmojiAvatarPicker
                  selected={authUser.profilepicture}
                  onSelect={handleSelectEmoji}
                  label={savingAvatar ? 'Saving persona token…' : 'Select New Glyph'}
                />
              </div>
            )}
          </section>

          {/* 4. Identity Credentials */}
          <section className="drawer-section">
            <span className="section-label">CRYPTOGRAPHIC SESSION IDENTITY</span>
            <div className="meta-card">
              <div className="meta-row">
                <span className="meta-label">Primary Account Email</span>
                <span className="meta-val">{authUser.email}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Identity Handle</span>
                <span className="meta-val font-mono">@{authUser.username}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Enclave Storage</span>
                <span className="meta-tag">HTTPONLY // TLS 1.3</span>
              </div>
            </div>
          </section>

          {/* 5. Account & Session Actions */}
          <section className="drawer-section">
            <button
              className="drawer-logout-btn"
              onClick={logout}
              type="button"
            >
              <span>Terminate Session (Sign Out)</span>
            </button>
          </section>
        </div>

        {/* Drawer Footer Status */}
        <div className="drawer-footer">
          <div className="footer-status-row">
            <span className="footer-beacon"></span>
            <span>Enclave State: Active &amp; Synced</span>
          </div>
          <span className="footer-proto">NexChat v2.4</span>
        </div>
      </div>

      <style>{`
        .drawer-backdrop {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(10, 9, 11, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          animation: fadeIn 0.2s ease;
        }

        .drawer-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 420px;
          max-width: 92vw;
          z-index: 201;
          background: #141315;
          border-left: 1px solid rgba(198, 161, 91, 0.22);
          box-shadow: -15px 0 50px rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .drawer-hairline {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #E0C58A, transparent);
        }

        .drawer-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(198, 161, 91, 0.18);
          background: #18171A;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .drawer-title {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          font-weight: 500;
          color: #F5F2ED;
        }

        .drawer-subtitle {
          font-size: 11.5px;
          color: #77777D;
          margin-top: 3px;
        }

        .drawer-close-btn {
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
        .drawer-close-btn:hover {
          color: #F5F2ED;
          background: #4A1525;
          border-color: #E0C58A;
        }

        .drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .drawer-card {
          background: #18171A;
          border: 1px solid rgba(198, 161, 91, 0.18);
          border-radius: 6px;
          padding: 20px;
        }

        .drawer-card--center {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .avatar-wrap {
          margin-bottom: 14px;
        }

        .profile-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .profile-name {
          font-size: 1.15rem;
          font-weight: 600;
          color: #F5F2ED;
        }

        .profile-verified {
          color: #E0C58A;
          font-size: 13px;
        }

        .socket-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #100F12;
          border: 1px solid rgba(198, 161, 91, 0.2);
          padding: 3px 10px;
          border-radius: 999px;
          margin: 8px 0;
          font-family: var(--font-mono);
          font-size: 10px;
          color: #E0C58A;
        }

        .socket-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #10B981;
        }

        .handle-copy-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #77777D;
        }

        .handle-copy-btn {
          background: #201F21;
          border: 1px solid rgba(198, 161, 91, 0.2);
          color: #E0C58A;
          font-size: 9px;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 3px;
          cursor: pointer;
        }
        .handle-copy-btn:hover { background: #4A1525; color: #FFF; }

        .drawer-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .section-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .section-label {
          font-family: var(--font-cinzel);
          font-size: 9.5px;
          letter-spacing: 0.16em;
          color: #C6A15B;
          font-weight: 600;
          display: block;
        }

        .section-sub {
          font-size: 11px;
          color: #77777D;
        }

        .picker-toggle-btn {
          background: #4A1525;
          border: 1px solid rgba(198, 161, 91, 0.35);
          color: #E0C58A;
          font-size: 11px;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.18s;
        }
        .picker-toggle-btn:hover {
          background: #702A3C;
          border-color: #E0C58A;
          color: #FFF;
        }

        .picker-dropdown {
          background: #18171A;
          border: 1px solid rgba(198, 161, 91, 0.2);
          border-radius: 6px;
          padding: 12px;
          animation: fadeIn 0.2s ease;
        }

        .meta-card {
          background: #18171A;
          border: 1px solid rgba(198, 161, 91, 0.18);
          border-radius: 6px;
          divide-y: 1px solid rgba(198, 161, 91, 0.12);
        }

        .meta-row {
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          border-bottom: 1px solid rgba(198, 161, 91, 0.1);
        }
        .meta-row:last-child { border-bottom: none; }

        .meta-label { color: #77777D; }
        .meta-val { color: #F5F2ED; font-weight: 500; }
        .meta-tag {
          font-family: var(--font-mono);
          font-size: 9px;
          color: #E0C58A;
          background: rgba(198, 161, 91, 0.12);
          padding: 2px 6px;
          border-radius: 3px;
        }

        .drawer-logout-btn {
          width: 100%;
          background: #1C1B1D;
          border: 1px solid rgba(255, 180, 171, 0.3);
          color: #FFB4AB;
          padding: 12px;
          border-radius: 4px;
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.18s;
        }
        .drawer-logout-btn:hover {
          background: rgba(147, 0, 10, 0.3);
          border-color: #FFB4AB;
        }

        .drawer-footer {
          padding: 14px 24px;
          background: #100F12;
          border-top: 1px solid rgba(198, 161, 91, 0.18);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 10px;
          color: #77777D;
        }

        .footer-status-row {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #10B981;
        }
        .footer-beacon {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 4px #10B981;
        }
        .footer-proto {
          color: #C6A15B;
        }
      `}</style>
    </>
  );
};

export default ProfilePanel;
