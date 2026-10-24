import React from 'react';

export const CURATED_EMOJIS = [
  '🦊', '⚡', '🚀', '🐱', '👾', '🎨',
  '🐼', '🦁', '🔮', '🪐', '🎯', '💎',
  '🦄', '🔥', '🌟', '🍀', '🎧', '🎸'
];

/**
 * Interactive Emoji Avatar Picker
 * @param {{
 *   selected: string,
 *   onSelect: (emoji: string) => void,
 *   label?: string
 * }} props
 */
const EmojiAvatarPicker = ({ selected = '🦊', onSelect, label = 'Choose your Emoji Avatar' }) => {
  return (
    <div className="emoji-picker-container">
      {label && <label className="emoji-picker-label">{label}</label>}

      <div className="emoji-grid-wrap">
        {CURATED_EMOJIS.map((emoji) => {
          const isSelected = selected === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelect(emoji)}
              className={`emoji-tile ${isSelected ? 'emoji-tile--selected' : ''}`}
              title={`Select ${emoji}`}
              aria-label={`Select ${emoji} avatar`}
            >
              <span className="emoji-tile__char">{emoji}</span>
              {isSelected && <span className="emoji-tile__check">✓</span>}
            </button>
          );
        })}
      </div>

      <style>{`
        .emoji-picker-container {
          margin: 12px 0 16px;
        }

        .emoji-picker-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #A39E9B;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .emoji-grid-wrap {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          background: #18171A;
          border: 1px solid rgba(198, 161, 91, 0.20);
          border-radius: 8px;
          padding: 10px;
        }

        .emoji-tile {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #201F21;
          border: 1px solid rgba(198, 161, 91, 0.12);
          border-radius: 6px;
          cursor: pointer;
          font-size: 1.25rem;
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          padding: 0;
          outline: none;
        }

        .emoji-tile:hover {
          transform: scale(1.08);
          background: #2B292C;
          border-color: rgba(198, 161, 91, 0.35);
        }

        .emoji-tile--selected {
          background: #4A1525;
          border-color: #C6A15B;
          box-shadow: 0 0 10px rgba(198, 161, 91, 0.25);
          transform: scale(1.05);
        }

        .emoji-tile__char {
          line-height: 1;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .emoji-tile__check {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #E0C58A;
          box-shadow: 0 0 4px #E0C58A;
        }
      `}</style>
    </div>
  );
};

export default EmojiAvatarPicker;
