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
            <p className="drawer-subtitle">Manage your profile, avatar, and account settings</p>
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
              <span className="socket-text">Active Now</span>
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
                <span className="section-label">PROFILE AVATAR</span>
                <span className="section-sub">Choose your emoji avatar</span>
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
                  label={savingAvatar ? 'Saving avatar…' : 'Select Avatar'}
                />
              </div>
            )}
          </section>

          {/* 4. Identity Credentials */}
          <section className="drawer-section">
            <span className="section-label">ACCOUNT DETAILS</span>
            <div className="meta-card">
              <div className="meta-row">
                <span className="meta-label">Email Address</span>
                <span className="meta-val">{authUser.email}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Username</span>
                <span className="meta-val font-mono">@{authUser.username}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Session Status</span>
                <span className="meta-tag">Active</span>
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
              <span>Sign Out</span>
            </button>
          </section>
        </div>

        {/* Drawer Footer Status */}
        <div className="drawer-footer">
          <div className="footer-status-row">
            <span className="footer-beacon"></span>
            <span>Status: Online</span>
          </div>
          <span className="footer-proto">NexChat</span>
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
          background: rgba(20, 19, 23, 0.86);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border-left: 1px solid rgba(198, 161, 91, 0.25);
          box-shadow: -20px 0 60px rgba(0, 0, 0, 0.75), inset 1px 0 0 rgba(255, 255, 255, 0.08);
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
          background: rgba(24, 23, 28, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
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
          background: rgba(32, 31, 33, 0.8);
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
          -webkit-overflow-scrolling: touch;
          padding: 24px 24px calc(30px + env(safe-area-inset-bottom, 16px));
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .drawer-card {
          background: rgba(28, 26, 32, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(198, 161, 91, 0.2);
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
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
          background: rgba(26, 24, 30, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(198, 161, 91, 0.25);
          border-radius: 8px;
          padding: 14px;
          animation: fadeIn 0.2s ease;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .meta-card {
          background: rgba(26, 24, 30, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(198, 161, 91, 0.2);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        }

        .meta-row {
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          border-bottom: 1px solid rgba(198, 161, 91, 0.12);
        }
        .meta-row:last-child { border-bottom: none; }

        .meta-label { color: #A39E9B; font-weight: 500; }
        .meta-val { color: #F5F2ED; font-weight: 600; }
        .meta-tag {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 600;
          color: #E0C58A;
          background: rgba(198, 161, 91, 0.14);
          border: 1px solid rgba(198, 161, 91, 0.25);
          padding: 2px 8px;
          border-radius: 999px;
        }

        .drawer-logout-btn {
          width: 100%;
          background: rgba(74, 21, 37, 0.35);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 180, 171, 0.35);
          color: #FFB4AB;
          padding: 12px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.18s;
        }
        .drawer-logout-btn:hover {
          background: rgba(147, 0, 10, 0.45);
          border-color: #FFB4AB;
          color: #FFF;
        }

        .drawer-footer {
          padding: 14px 24px calc(14px + env(safe-area-inset-bottom, 0px));
          background: rgba(16, 15, 18, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
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
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 6px #10B981;
        }
        .footer-proto {
          color: #C6A15B;
        }

        @media (max-width: 480px) {
          .drawer-panel {
            width: 100%;
            max-width: 100vw;
          }
        }
      `}</style>
    </>
  );
};

export default ProfilePanel;
