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
          background: rgba(5, 14, 34, 0.88);
          backdrop-filter: blur(28px) saturate(190%);
          -webkit-backdrop-filter: blur(28px) saturate(190%);
          border-left: 1px solid rgba(59, 130, 246, 0.22);
          box-shadow: -20px 0 60px rgba(0, 0, 0, 0.8), inset 1px 0 0 rgba(255, 255, 255, 0.08);
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
          background: linear-gradient(90deg, transparent, #38BDF8, transparent);
        }

        .drawer-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(59, 130, 246, 0.16);
          background: rgba(7, 18, 42, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .drawer-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #F8FAFC;
        }

        .drawer-subtitle {
          font-size: 11.5px;
          color: #94A3B8;
          margin-top: 3px;
        }

        .drawer-close-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(14, 30, 64, 0.8);
          border: 1px solid rgba(59, 130, 246, 0.25);
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.15s;
        }
        .drawer-close-btn:hover {
          color: #FFFFFF;
          background: #1D68F6;
          border-color: #60A5FA;
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
          background: rgba(8, 20, 46, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
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
          color: #F8FAFC;
        }

        .profile-verified {
          color: #38BDF8;
          font-size: 13px;
        }

        .socket-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(14, 30, 64, 0.8);
          border: 1px solid rgba(59, 130, 246, 0.25);
          padding: 3px 10px;
          border-radius: 999px;
          margin: 8px 0;
          font-family: var(--font-mono);
          font-size: 10px;
          color: #38BDF8;
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
          color: #94A3B8;
        }

        .handle-copy-btn {
          background: rgba(29, 104, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #60A5FA;
          font-size: 9px;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .handle-copy-btn:hover { background: #1D68F6; color: #FFF; }

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
          font-size: 10px;
          letter-spacing: 0.14em;
          color: #60A5FA;
          font-weight: 700;
          text-transform: uppercase;
          display: block;
        }

        .section-sub {
          font-size: 11px;
          color: #94A3B8;
        }

        .picker-toggle-btn {
          background: #1D68F6;
          border: 1px solid rgba(147, 197, 253, 0.35);
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.18s;
          box-shadow: 0 4px 12px rgba(29, 104, 246, 0.35);
        }
        .picker-toggle-btn:hover {
          background: #195ce0;
          color: #FFF;
        }

        .picker-dropdown {
          background: rgba(8, 20, 46, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: 10px;
          padding: 14px;
          animation: fadeIn 0.2s ease;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .meta-card {
          background: rgba(8, 20, 46, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        }

        .meta-row {
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          border-bottom: 1px solid rgba(59, 130, 246, 0.12);
        }
        .meta-row:last-child { border-bottom: none; }

        .meta-label { color: #94A3B8; font-weight: 500; }
        .meta-val { color: #F8FAFC; font-weight: 600; }
        .meta-tag {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 600;
          color: #38BDF8;
          background: rgba(29, 104, 246, 0.18);
          border: 1px solid rgba(59, 130, 246, 0.3);
          padding: 2px 8px;
          border-radius: 999px;
        }

        .drawer-logout-btn {
          width: 100%;
          background: rgba(239, 68, 68, 0.15);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #FCA5A5;
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.18s;
        }
        .drawer-logout-btn:hover {
          background: rgba(239, 68, 68, 0.25);
          border-color: #EF4444;
          color: #FFF;
        }

        .drawer-footer {
          padding: 14px 24px calc(14px + env(safe-area-inset-bottom, 0px));
          background: rgba(7, 18, 42, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid rgba(59, 130, 246, 0.16);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 10px;
          color: #94A3B8;
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
          color: #38BDF8;
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
