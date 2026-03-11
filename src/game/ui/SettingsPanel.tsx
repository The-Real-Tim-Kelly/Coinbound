import React from 'react';

interface SettingsPanelProps {
  muted: boolean;
  musicVolume: number;
  sfxVolume: number;
  onToggleMute: () => void;
  onMusicVolumeChange: (v: number) => void;
  onSfxVolumeChange: (v: number) => void;
}

export function SettingsPanel({
  muted,
  musicVolume,
  sfxVolume,
  onToggleMute,
  onMusicVolumeChange,
  onSfxVolumeChange,
}: SettingsPanelProps) {
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  };

  const sliderRow = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    isLast = false,
  ) => (
    <div
      style={{
        ...rowStyle,
        borderBottom: isLast ? 'none' : rowStyle.borderBottom,
        paddingBottom: isLast ? 4 : 0,
      }}
    >
      <span
        style={{
          fontSize: 14,
          color: '#ccc',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={muted}
          style={{
            width: 100,
            accentColor: '#00ccff',
            opacity: muted ? 0.28 : 1,
            cursor: muted ? 'not-allowed' : 'pointer',
          }}
        />
        <span
          style={{
            fontSize: 12,
            color: muted ? '#444' : '#888',
            minWidth: 34,
            textAlign: 'right',
          }}
        >
          {muted ? '—' : `${value}%`}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ textAlign: 'left', minWidth: 240 }}>
      {/* Global mute toggle */}
      <div style={rowStyle}>
        <span style={{ fontSize: 14, color: '#ccc' }}>
          {muted ? '🔇' : '🔊'} Mute All
        </span>
        <button
          onClick={onToggleMute}
          style={{
            background: muted ? 'rgba(255,80,80,0.18)' : 'rgba(0,255,136,0.14)',
            color: muted ? '#ff6666' : '#00ff88',
            border: muted
              ? '1px solid rgba(255,80,80,0.4)'
              : '1px solid rgba(0,255,136,0.35)',
            borderRadius: 6,
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            cursor: 'pointer',
            minWidth: 56,
          }}
        >
          {muted ? 'ON' : 'OFF'}
        </button>
      </div>
      {sliderRow('🎵 Music', musicVolume, onMusicVolumeChange)}
      {sliderRow('🔊 SFX', sfxVolume, onSfxVolumeChange, true)}
    </div>
  );
}
