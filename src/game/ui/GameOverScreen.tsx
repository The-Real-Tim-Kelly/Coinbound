import { useCallback, useEffect, useRef, useState } from 'react';

// ── Canvas-based flying coin animation ────────────────────────────────────────
const MAX_VISUAL_COINS = 18;
const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 300;
const FLIGHT_DURATION_MS = 1050;
const BASE_COIN_R = 10;

interface Particle {
  x0: number;
  y0: number;
  cx: number;
  cy: number;
  x1: number;
  y1: number;
  startMs: number;
  dur: number;
  rot0: number;
  rotSpd: number;
  r: number;
  landed: boolean;
  pulseT: number;
  batchIdx: number;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function buildParticles(
  coinCount: number,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  now: number,
): Particle[] {
  const count = Math.min(coinCount, MAX_VISUAL_COINS);
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const batchIdx = Math.floor(i / BATCH_SIZE);
    const posInBatch = i % BATCH_SIZE;
    const startMs = now + batchIdx * BATCH_DELAY_MS + posInBatch * 65;
    // Scatter coins from around the source element
    const angle = Math.random() * Math.PI * 2;
    const spread = 20 + Math.random() * 32;
    const x0 = sx + Math.cos(angle) * spread;
    const y0 = sy + Math.sin(angle) * spread;
    // Quadratic bezier arc control point
    const mx = (x0 + tx) / 2;
    const my = (y0 + ty) / 2;
    const dx = tx - x0;
    const dy = ty - y0;
    const len = Math.hypot(dx, dy) || 1;
    const bend = (Math.random() < 0.5 ? 1 : -1) * (0.18 + Math.random() * 0.28);
    particles.push({
      x0,
      y0,
      cx: mx + (-dy / len) * bend * len,
      cy: my + (dx / len) * bend * len,
      x1: tx,
      y1: ty,
      startMs,
      dur: FLIGHT_DURATION_MS + Math.random() * 250,
      rot0: Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 7,
      r: BASE_COIN_R + Math.random() * 3,
      landed: false,
      pulseT: 0,
      batchIdx,
    });
  }
  return particles;
}

function drawCoinSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rotation: number,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(x, y);
  ctx.rotate(rotation);
  // Outer glow shadow
  ctx.shadowColor = 'rgba(255,160,0,0.55)';
  ctx.shadowBlur = r * 1.1;
  // Coin body gradient
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  const bg = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.08, 0, 0, r);
  bg.addColorStop(0, '#fff0a0');
  bg.addColorStop(0.45, '#f0a800');
  bg.addColorStop(0.85, '#c07000');
  bg.addColorStop(1, '#7a4200');
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.shadowBlur = 0;
  // Inner embossed circle
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.76, 0, Math.PI * 2);
  const ig = ctx.createRadialGradient(
    -r * 0.18,
    -r * 0.22,
    r * 0.05,
    0,
    0,
    r * 0.76,
  );
  ig.addColorStop(0, '#ffee88');
  ig.addColorStop(0.55, '#dda000');
  ig.addColorStop(1, '#8a5000');
  ctx.fillStyle = ig;
  ctx.fill();
  // Specular highlight arc
  ctx.beginPath();
  ctx.arc(-r * 0.15, -r * 0.28, r * 0.38, Math.PI * 1.05, Math.PI * 1.88);
  ctx.strokeStyle = 'rgba(255,255,200,0.65)';
  ctx.lineWidth = r * 0.13;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

interface CoinFlightCanvasProps {
  coinCount: number;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  onBatchLand: () => void;
}

function CoinFlightCanvas({
  coinCount,
  sourceX,
  sourceY,
  targetX,
  targetY,
  onBatchLand,
}: CoinFlightCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onBatchLandRef = useRef(onBatchLand);
  useEffect(() => {
    onBatchLandRef.current = onBatchLand;
  }, [onBatchLand]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || coinCount === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap dpr for perf
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const particles = buildParticles(
      coinCount,
      sourceX,
      sourceY,
      targetX,
      targetY,
      performance.now(),
    );
    const firedBatches = new Set<number>();
    let rafId = 0;

    function frame(now: number) {
      ctx.clearRect(0, 0, W, H);
      let pending = false;
      for (const p of particles) {
        const elapsed = now - p.startMs;
        if (elapsed < 0) {
          pending = true;
          continue;
        }
        if (!p.landed) {
          const raw = Math.min(elapsed / p.dur, 1);
          const t = easeOutCubic(raw);
          const inv = 1 - t;
          // Quadratic bezier position
          const x = inv * inv * p.x0 + 2 * inv * t * p.cx + t * t * p.x1;
          const y = inv * inv * p.y0 + 2 * inv * t * p.cy + t * t * p.y1;
          // Subtle scale pop at midway via sin envelope
          const scale = 1 + 0.2 * Math.sin(raw * Math.PI);
          const alpha = raw < 0.82 ? 1.0 : 1.0 - ((raw - 0.82) / 0.18) * 0.15;
          drawCoinSprite(ctx, x, y, p.r * scale, p.rot0 + p.rotSpd * t, alpha);
          if (raw >= 1) {
            p.landed = true;
            if (!firedBatches.has(p.batchIdx)) {
              firedBatches.add(p.batchIdx);
              onBatchLandRef.current();
            }
          }
          pending = true;
        } else {
          // Landing burst: scale up then fade out
          p.pulseT = Math.min(p.pulseT + 0.075, 1);
          const s = 1 + 0.85 * Math.sin(p.pulseT * Math.PI);
          const a = 1 - p.pulseT ** 2;
          drawCoinSprite(ctx, p.x1, p.y1, p.r * s, p.rot0, a);
          if (p.pulseT < 1) pending = true;
        }
      }
      if (pending) rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [coinCount, sourceX, sourceY, targetX, targetY]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  );
}

// ── Keyframe styles injected once per document lifetime ───────────────────────
const KEYFRAMES = `
@keyframes go-fadein {
  from { opacity: 0; transform: scale(0.92) translateY(14px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);    }
}
@keyframes go-record-pop {
  0%   { transform: translateX(-50%) scale(0.45); opacity: 0; }
  65%  { transform: translateX(-50%) scale(1.12); opacity: 1; }
  100% { transform: translateX(-50%) scale(1);    opacity: 1; }
}
@keyframes go-coin-tick {
  0%   { transform: scale(1);    color: #fff; }
  40%  { transform: scale(1.18); color: #ffd700; }
  100% { transform: scale(1);    color: #ffd700; }
}
@keyframes go-bank-pulse {
  0%   { box-shadow: 0 0 0px rgba(255,200,50,0),    inset 0 0 0px  rgba(255,200,50,0);    }
  30%  { box-shadow: 0 0 18px rgba(255,200,50,0.72), inset 0 0 10px rgba(255,200,50,0.2); }
  100% { box-shadow: 0 0 0px rgba(255,200,50,0),    inset 0 0 0px  rgba(255,200,50,0);    }
}
@keyframes wallet-coin-pulse {
  0%   { transform: scale(1);    text-shadow: 0 0 10px rgba(255,215,0,0.6); }
  35%  { transform: scale(1.28); text-shadow: 0 0 20px rgba(255,215,0,1), 0 0 40px rgba(255,200,0,0.6); }
  100% { transform: scale(1);    text-shadow: 0 0 10px rgba(255,215,0,0.6); }
}
`;

let keyframesInjected = false;
function ensureKeyframes() {
  if (keyframesInjected) return;
  keyframesInjected = true;
  const s = document.createElement('style');
  s.textContent = KEYFRAMES;
  document.head.appendChild(s);
}

interface GameOverScreenProps {
  score: number;
  coins: number;
  hiScore: number;
  hiCoins: number;
  isNewScore: boolean;
  isNewCoins: boolean;
  onRetry: () => void;
  onShop: () => void;
  onMenu: () => void;
  /** Called once on mount — play congratulatory or new-record fanfare */
  onPlayFanfare: () => void;
  /** Called for each batch of coins landing in the bank */
  onPlayBankCoin: () => void;
  /** Screen position of the wallet counter in the top bar — coins fly here */
  getWalletPos: () => { x: number; y: number } | null;
  /** Notifies parent of coins to add to the wallet display (gradual increment) */
  onWalletIncrement: (delta: number) => void;
}

export function GameOverScreen({
  score,
  coins,
  hiScore,
  hiCoins,
  isNewScore,
  isNewCoins,
  onRetry,
  onShop,
  onMenu,
  onPlayFanfare,
  onPlayBankCoin,
  getWalletPos,
  onWalletIncrement,
}: GameOverScreenProps) {
  const isNewRecord = isNewScore || isNewCoins;

  // Stable refs so mount-effect closures never go stale.
  const onPlayFanfareRef = useRef(onPlayFanfare);
  const onPlayBankCoinRef = useRef(onPlayBankCoin);
  const onWalletIncrementRef = useRef(onWalletIncrement);
  useEffect(() => {
    onWalletIncrementRef.current = onWalletIncrement;
  }, [onWalletIncrement]);

  const [displayCoins, setDisplayCoins] = useState(0);
  // tickKey increments on each display-counter tick to re-trigger css animation
  const [tickKey, setTickKey] = useState(0);
  const [showRecord, setShowRecord] = useState(false);
  const [flyVisible, setFlyVisible] = useState(false);
  // bankGlowKey re-keys the pulse overlay on each batch landing
  const [bankGlowKey, setBankGlowKey] = useState(0);
  // sourcePos: center of the COINS earned cell — where coins fly FROM
  // walletTarget: center of the top-bar wallet counter — where coins fly TO
  const [sourcePos, setSourcePos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [walletTarget, setWalletTarget] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const coinsCellRef = useRef<HTMLDivElement>(null);

  // How many coins each visual batch represents (for wallet increment)
  const numBatches = Math.max(
    1,
    Math.ceil(Math.min(coins, MAX_VISUAL_COINS) / BATCH_SIZE),
  );
  const coinsPerBatch = Math.ceil(coins / numBatches);

  // When the coin flight starts, measure both source (COINS cell) and target (wallet).
  useEffect(() => {
    if (!flyVisible || sourcePos || !coinsCellRef.current) return;
    const rect = coinsCellRef.current.getBoundingClientRect();
    setSourcePos({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setWalletTarget(getWalletPos());
  }, [flyVisible, sourcePos, getWalletPos]);

  // Called by CoinFlightCanvas once per batch of coins that reaches the wallet
  const handleBatchLand = useCallback(() => {
    onPlayBankCoinRef.current();
    setBankGlowKey((k) => k + 1);
    onWalletIncrementRef.current(coinsPerBatch);
  }, [coinsPerBatch]);

  useEffect(() => {
    ensureKeyframes();
    onPlayFanfareRef.current();

    if (coins === 0) {
      if (isNewRecord) setTimeout(() => setShowRecord(true), 350);
      return;
    }

    // Trigger canvas coin flight slightly before the counter starts
    const flyTimer = setTimeout(() => setFlyVisible(true), 300);

    const steps = Math.min(coins, 30);
    const increment = Math.ceil(coins / steps);
    const intervalMs = Math.round(1400 / steps);

    let current = 0;
    let intervalId: ReturnType<typeof setInterval>;

    const startTimer = setTimeout(() => {
      intervalId = setInterval(() => {
        current = Math.min(current + increment, coins);
        setDisplayCoins(current);
        setTickKey((k) => k + 1);
        if (current >= coins) {
          clearInterval(intervalId);
          if (isNewRecord) setTimeout(() => setShowRecord(true), 220);
        }
      }, intervalMs);
    }, 420);

    return () => {
      clearTimeout(flyTimer);
      clearTimeout(startTimer);
      clearInterval(intervalId!);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* Full-screen canvas coin flight layer — from COINS cell → wallet top bar */}
      {flyVisible && sourcePos && walletTarget && coins > 0 && (
        <CoinFlightCanvas
          coinCount={coins}
          sourceX={sourcePos.x}
          sourceY={sourcePos.y}
          targetX={walletTarget.x}
          targetY={walletTarget.y}
          onBatchLand={handleBatchLand}
        />
      )}

      <div
        style={{
          background: 'rgba(10,10,28,0.98)',
          border: `2px solid ${
            isNewRecord ? 'rgba(255,200,50,0.55)' : '#2a2a4a'
          }`,
          borderRadius: 18,
          padding: 'clamp(22px, 5vw, 40px) clamp(20px, 6vw, 52px)',
          textAlign: 'center',
          fontFamily: 'monospace',
          color: '#fff',
          width: 'min(90vw, 340px)',
          boxShadow: isNewRecord
            ? '0 0 60px rgba(255,200,50,0.28), 0 0 120px rgba(255,200,50,0.10)'
            : '0 0 60px rgba(0,0,0,0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          animation: 'go-fadein 0.32s ease-out both',
        }}
      >
        {/* NEW RECORD badge */}
        {showRecord && (
          <div
            style={{
              position: 'absolute',
              top: -20,
              left: '50%',
              background: 'linear-gradient(135deg, #ffd700, #ff9500)',
              color: '#1a0a00',
              fontFamily: 'monospace',
              fontSize: 'clamp(10px, 2.5vw, 13px)',
              fontWeight: 'bold',
              letterSpacing: 2,
              padding: '5px 16px',
              borderRadius: 20,
              boxShadow: '0 0 18px rgba(255,200,0,0.75)',
              animation:
                'go-record-pop 0.38s cubic-bezier(0.34,1.56,0.64,1) both',
              whiteSpace: 'nowrap',
              zIndex: 21,
            }}
          >
            ⭐ NEW RECORD!
          </div>
        )}

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
              { label: 'SCORE', value: score, highlight: isNewScore },
              {
                label: 'COINS',
                value: displayCoins,
                highlight: isNewCoins,
                animKey: tickKey,
              },
              { label: 'BEST', value: hiScore },
              { label: 'MOST COINS', value: hiCoins },
            ] as {
              label: string;
              value: number;
              highlight?: boolean;
              animKey?: number;
            }[]
          ).map(({ label, value, highlight, animKey }) => (
            <div
              key={label}
              ref={label === 'COINS' ? coinsCellRef : undefined}
              style={{
                background: highlight
                  ? 'rgba(255,200,50,0.10)'
                  : 'rgba(255,255,255,0.04)',
                border: highlight
                  ? '1px solid rgba(255,200,50,0.38)'
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '10px 8px',
                transition: 'background 0.5s, border-color 0.5s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Bank glow pulse overlay — re-keyed to replay animation on each batch */}
              {label === 'COINS' && bankGlowKey > 0 && (
                <div
                  key={bankGlowKey}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 8,
                    pointerEvents: 'none',
                    animation: 'go-bank-pulse 0.5s ease-out both',
                  }}
                />
              )}
              <div
                style={{
                  fontSize: 10,
                  color: highlight ? '#e8b800' : '#556677',
                  marginBottom: 4,
                  letterSpacing: 1,
                  transition: 'color 0.5s',
                }}
              >
                {label}
              </div>
              <div
                key={animKey}
                style={{
                  fontSize: 'clamp(16px, 4vw, 22px)',
                  color: highlight ? '#ffd700' : '#fff',
                  fontWeight: 'bold',
                  transition: 'color 0.5s',
                  animation:
                    animKey !== undefined && animKey > 0
                      ? 'go-coin-tick 0.22s ease-out both'
                      : undefined,
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
