interface GameOverScreenProps {
  score: number;
  coins: number;
  hiScore: number;
  hiCoins: number;
  onRetry: () => void;
  onShop: () => void;
  onMenu: () => void;
}

export function GameOverScreen({
  score,
  coins,
  hiScore,
  hiCoins,
  onRetry,
  onShop,
  onMenu,
}: GameOverScreenProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.72)',
        zIndex: 10,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div
        style={{
          background: 'rgba(10,10,28,0.98)',
          border: '2px solid #2a2a4a',
          borderRadius: 18,
          padding: 'clamp(22px, 5vw, 40px) clamp(20px, 6vw, 52px)',
          textAlign: 'center',
          fontFamily: 'monospace',
          color: '#fff',
          width: 'min(90vw, 340px)',
          boxShadow: '0 0 60px rgba(0,0,0,0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(22px, 6vw, 36px)',
            fontWeight: 'bold',
            color: '#ff4444',
            textShadow: '0 0 20px rgba(255,68,68,0.5)',
            marginBottom: 18,
            letterSpacing: 2,
          }}
        >
          GAME OVER
        </div>

        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 22,
          }}
        >
          {(
            [
              { label: 'SCORE', value: score },
              { label: 'COINS', value: coins },
              { label: 'BEST', value: hiScore },
              { label: 'MOST COINS', value: hiCoins },
            ] as { label: string; value: number }[]
          ).map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '10px 8px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: '#556677',
                  marginBottom: 4,
                  letterSpacing: 1,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 'clamp(16px, 4vw, 22px)',
                  color: '#fff',
                  fontWeight: 'bold',
                }}
              >
                {value}
              </div>
            </div>
          ))}
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
            onClick={onRetry}
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
            ↺ RETRY
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
            onClick={onMenu}
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
            ≡ MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
