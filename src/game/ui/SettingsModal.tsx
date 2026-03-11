import { SettingsPanel } from './SettingsPanel';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  muted: boolean;
  musicVolume: number;
  sfxVolume: number;
  onToggleMute: () => void;
  onMusicVolumeChange: (v: number) => void;
  onSfxVolumeChange: (v: number) => void;
}

export function SettingsModal({
  visible,
  onClose,
  muted,
  musicVolume,
  sfxVolume,
  onToggleMute,
  onMusicVolumeChange,
  onSfxVolumeChange,
}: SettingsModalProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        zIndex: 20,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          background: 'rgba(8,8,22,0.99)',
          border: '2px solid #2a2a4a',
          borderRadius: 18,
          padding: 'clamp(18px, 4vw, 32px)',
          width: 'min(92vw, 360px)',
          fontFamily: 'monospace',
          color: '#fff',
          position: 'relative',
          boxShadow: '0 0 60px rgba(0,0,0,0.95)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            background: 'transparent',
            border: 'none',
            color: '#556677',
            fontSize: 20,
            cursor: 'pointer',
            fontFamily: 'monospace',
            lineHeight: 1,
          }}
          aria-label="Close settings"
        >
          ✕
        </button>
        <div
          style={{
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontWeight: 'bold',
            color: '#aaaaaa',
            marginBottom: 20,
            letterSpacing: 2,
          }}
        >
          ⚙️ SETTINGS
        </div>
        <SettingsPanel
          muted={muted}
          musicVolume={musicVolume}
          sfxVolume={sfxVolume}
          onToggleMute={onToggleMute}
          onMusicVolumeChange={onMusicVolumeChange}
          onSfxVolumeChange={onSfxVolumeChange}
        />
      </div>
    </div>
  );
}
