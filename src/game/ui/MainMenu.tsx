interface MainMenuProps {
  totalCoins: number;
  onPlay: () => void;
  onShop: () => void;
  onSettings: () => void;
}

export function MainMenu({
  totalCoins,
  onPlay,
  onShop,
  onSettings,
}: MainMenuProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.62)',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: 'rgba(10,10,28,0.97)',
          border: '2px solid #2a2a4a',
          borderRadius: 18,
          padding: 'clamp(24px, 5vw, 44px) clamp(20px, 6vw, 52px)',
          textAlign: 'center',
          fontFamily: 'monospace',
          color: '#fff',
          width: 'min(90vw, 340px)',
          boxShadow: '0 0 60px rgba(0,0,0,0.9), 0 0 30px rgba(0,255,136,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(28px, 8vw, 48px)',
            fontWeight: 'bold',
            color: '#00ff88',
            textShadow: '0 0 24px #00ff88, 0 0 48px rgba(0,255,136,0.4)',
            letterSpacing: 3,
            marginBottom: 6,
          }}
        >
          COINBOUND
        </div>
        <div
          style={{
            fontSize: 'clamp(10px, 2.5vw, 13px)',
            color: '#556677',
            marginBottom: 16,
          }}
        >
          Hold to pull up · Release to fall
        </div>
        <div
          style={{
            fontSize: 'clamp(12px, 3vw, 14px)',
            color: '#ffd700',
            marginBottom: 24,
          }}
        >
          💰 {totalCoins} coins
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            width: '100%',
          }}
        >
          <button
            onClick={onPlay}
            style={{
              background: '#00ff88',
              color: '#000',
              border: 'none',
              borderRadius: 10,
              padding: 'clamp(10px, 2.5vw, 14px) 0',
              fontSize: 'clamp(14px, 3.5vw, 18px)',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: 'pointer',
              letterSpacing: 2,
              width: '100%',
              boxShadow: '0 0 20px rgba(0,255,136,0.4)',
            }}
          >
            ▶ PLAY
          </button>
          <button
            onClick={onShop}
            style={{
              background: 'rgba(0,200,255,0.1)',
              color: '#00ccff',
              border: '1px solid rgba(0,200,255,0.35)',
              borderRadius: 10,
              padding: 'clamp(10px, 2.5vw, 14px) 0',
              fontSize: 'clamp(13px, 3.2vw, 16px)',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: 'pointer',
              letterSpacing: 1,
              width: '100%',
            }}
          >
            🛍 STORE
          </button>
          <button
            onClick={onSettings}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#aaaaaa',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              padding: 'clamp(10px, 2.5vw, 14px) 0',
              fontSize: 'clamp(13px, 3.2vw, 16px)',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: 'pointer',
              letterSpacing: 1,
              width: '100%',
            }}
          >
            ⚙️ SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
}
