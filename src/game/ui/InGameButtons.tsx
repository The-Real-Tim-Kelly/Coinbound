import React from 'react';

interface InGameButtonsProps {
  muted: boolean;
  onShop: () => void;
  onSettings: () => void;
}

export function InGameButtons({
  muted,
  onShop,
  onSettings,
}: InGameButtonsProps) {
  const btnStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.45)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    color: '#cccccc',
    fontFamily: 'monospace',
    fontSize: 'clamp(10px, 2.5vw, 13px)',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: '6px 12px',
    letterSpacing: 1,
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        zIndex: 5,
      }}
    >
      <button onClick={onShop} style={btnStyle}>
        🛍
      </button>
      <button onClick={onSettings} style={btnStyle}>
        {muted ? '🔇' : '⚙️'}
      </button>
    </div>
  );
}
