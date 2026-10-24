import { useState } from 'react';

/**
 * Universal Avatar component supporting Emoji avatars, image URLs, and initial fallbacks.
 * @param {{
 *   user?: { profilepicture?: string, fullname?: string, username?: string },
 *   avatar?: string,
 *   name?: string,
 *   size?: number,
 *   showOnline?: boolean,
 *   isOnline?: boolean,
 *   className?: string
 * }} props
 */
const Avatar = ({
  user,
  avatar,
  name,
  size = 40,
  showOnline = false,
  isOnline = false,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  const rawAvatar = avatar || user?.profilepicture || '';
  const displayName = name || user?.fullname || user?.username || '?';
  const initial = displayName.trim()[0]?.toUpperCase() || '?';

  // Check if avatar is an emoji (doesn't start with http/data and is short)
  const isEmoji = rawAvatar && !rawAvatar.startsWith('http') && !rawAvatar.startsWith('/') && !rawAvatar.startsWith('data:') && rawAvatar.length <= 4;
  const isImage = rawAvatar && (rawAvatar.startsWith('http') || rawAvatar.startsWith('/') || rawAvatar.startsWith('data:')) && !imgError;

  const squircleStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    fontSize: isEmoji ? `${size * 0.52}px` : `${size * 0.42}px`,
    borderRadius: isEmoji ? `${Math.round(size * 0.32)}px` : '50%',
  };

  return (
    <div className={`nex-avatar ${className}`} style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <div
        className={`nex-avatar__inner ${isEmoji ? 'nex-avatar--emoji' : ''}`}
        style={squircleStyle}
      >
        {isEmoji ? (
          <span className="nex-avatar__emoji" role="img" aria-label="Avatar emoji">
            {rawAvatar}
          </span>
        ) : isImage ? (
          <img
            src={rawAvatar}
            alt={displayName}
            onError={() => setImgError(true)}
            className="nex-avatar__img"
          />
        ) : (
          <span className="nex-avatar__initial">{initial}</span>
        )}
      </div>

      {showOnline && (
        <span
          className={`nex-avatar__beacon ${isOnline ? 'nex-avatar__beacon--online' : 'nex-avatar__beacon--offline'}`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}

      <style>{`
        .nex-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .nex-avatar__inner {
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #18171A;
          border: 1px solid rgba(198, 161, 91, 0.20);
          color: #F5F2ED;
          font-weight: 600;
          user-select: none;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .nex-avatar--emoji {
          background: #38101C;
          border: 1px solid rgba(198, 161, 91, 0.35);
          box-shadow: 0 2px 8px rgba(74, 21, 37, 0.45);
        }

        .nex-avatar__emoji {
          line-height: 1;
          display: block;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
        }

        .nex-avatar__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .nex-avatar__initial {
          line-height: 1;
          color: #E0C58A;
          font-family: var(--font-serif);
        }

        .nex-avatar__beacon {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          border: 2px solid #141315;
          z-index: 2;
        }

        .nex-avatar__beacon--online {
          background: #10B981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
        }

        .nex-avatar__beacon--offline {
          background: #77777D;
        }
      `}</style>
    </div>
  );
};

export default Avatar;
