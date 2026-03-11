import { useCallback, useEffect, useRef, useState } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────
import {
  CANVAS_W,
  CANVAS_H,
  PLAYER_X,
  PLAYER_SIZE,
  GRAVITY,
  MAX_VY,
  HOLD_GRAVITY,
  OBSTACLE_INTERVAL,
  INITIAL_SPEED,
  SPEED_INCREMENT,
  COIN_RADIUS,
  COIN_INTERVAL,
  RARE_COIN_CHANCE,
  RARE_COIN_VALUE,
  SHIELD_RADIUS,
  SHIELD_INTERVAL,
  SHIELD_BOUNCE_VY,
  SHIELD_BOUNCE_PUSHBACK,
  SHIELD_BOUNCE_DURATION,
  MAGNET_RADIUS_PER_LEVEL,
  LUCKY_CHARM_BONUS_PER_LEVEL,
  LUCKY_COIN_CHECK_INTERVAL,
  MIN_OBSTACLE_SPACING,
} from './constants';

// ── Types ─────────────────────────────────────────────────────────────────────
import type {
  GameState,
  TrailParticle,
  MagParticle,
  CeilParticle,
  ShieldShard,
  RareCoinParticle,
  FloatingText,
} from './types';

// ── Data ──────────────────────────────────────────────────────────────────────
import { PLAYER_SKINS } from './data/cosmetics';

// ── Logic ─────────────────────────────────────────────────────────────────────
import { makeInitialState } from './logic/gameState';
import { spawnObstacle } from './logic/obstacles';
import { spawnCoin, spawnShield, findSafeSpawnY } from './logic/coins';

// ── Render ────────────────────────────────────────────────────────────────────
import { drawBackground } from './render/drawBackground';
import { drawObstacles } from './render/drawObstacles';
import { drawCoins } from './render/drawCoins';
import {
  updateAndDrawTrailParticles,
  updateAndDrawMagParticles,
  updateAndDrawCeilParticles,
  updateAndDrawShieldShards,
  updateAndDrawRareCoinParticles,
  updateAndDrawFloatingTexts,
} from './render/drawParticles';
import {
  drawPlayer,
  drawMagnetField,
  drawCeilingGlow,
  drawShieldGlow,
  drawElectricArc,
  applyScreenShake,
  drawBounceFlash,
  drawShieldHudIndicator,
} from './render/drawPlayer';
import { drawHUD } from './render/drawHUD';

// ── Audio & store hooks ────────────────────────────────────────────────────────
import { useAudio } from './audio/useAudio';
import { useStore } from './hooks/useStore';

// ── UI components ─────────────────────────────────────────────────────────────
import { MainMenu } from './ui/MainMenu';
import { GameOverScreen } from './ui/GameOverScreen';
import { ShopModal } from './ui/ShopModal';
import { SettingsModal } from './ui/SettingsModal';
import { InGameButtons } from './ui/InGameButtons';

// ─────────────────────────────────────────────────────────────────────────────

interface GameOverData {
  score: number;
  coins: number;
  hiScore: number;
  hiCoins: number;
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(makeInitialState());
  const rafRef = useRef<number>(0);
  const gameOverFiredRef = useRef(false);
  const isHoldingRef = useRef(false);
  const holdAgeRef = useRef(0);
  const bgOffsetRef = useRef(0);

  // Particle arrays
  const trailParticlesRef = useRef<TrailParticle[]>([]);
  const magParticlesRef = useRef<MagParticle[]>([]);
  const ceilParticlesRef = useRef<CeilParticle[]>([]);
  const shieldShardRef = useRef<ShieldShard[]>([]);
  const rareCoinParticlesRef = useRef<RareCoinParticle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  // Hooks
  const store = useStore();
  const audio = useAudio({
    initialMuted: localStorage.getItem('coinbound_muted') === 'true',
    initialMusicVolume: parseInt(
      localStorage.getItem('coinbound_music_volume') ?? '70',
      10,
    ),
    initialSfxVolume: parseInt(
      localStorage.getItem('coinbound_sfx_volume') ?? '80',
      10,
    ),
  });

  // UI state
  const [showShop, setShowShop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);

  // ── Navigation helpers ──────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    const s = stateRef.current;
    stateRef.current = makeInitialState(s.hiScore, s.hiCoins);
    stateRef.current.started = true;
    gameOverFiredRef.current = false;
    magParticlesRef.current = [];
    ceilParticlesRef.current = [];
    shieldShardRef.current = [];
    rareCoinParticlesRef.current = [];
    floatingTextsRef.current = [];
    setIsMenuVisible(false);
    setShowShop(false);
    setShowSettings(false);
    setGameOverData(null);
    audio.startMusicRef.current();
  }, [audio.startMusicRef]);

  const retry = useCallback(() => {
    const s = stateRef.current;
    stateRef.current = makeInitialState(s.hiScore, s.hiCoins);
    stateRef.current.started = true;
    gameOverFiredRef.current = false;
    magParticlesRef.current = [];
    ceilParticlesRef.current = [];
    shieldShardRef.current = [];
    rareCoinParticlesRef.current = [];
    floatingTextsRef.current = [];
    setIsMenuVisible(false);
    setShowShop(false);
    setShowSettings(false);
    setGameOverData(null);
    audio.startMusicRef.current();
  }, [audio.startMusicRef]);

  const goToMenu = useCallback(() => {
    const s = stateRef.current;
    stateRef.current = makeInitialState(s.hiScore, s.hiCoins);
    gameOverFiredRef.current = false;
    isHoldingRef.current = false;
    magParticlesRef.current = [];
    ceilParticlesRef.current = [];
    shieldShardRef.current = [];
    rareCoinParticlesRef.current = [];
    floatingTextsRef.current = [];
    setIsMenuVisible(true);
    setShowShop(false);
    setShowSettings(false);
    setGameOverData(null);
    audio.stopMusicRef.current();
  }, [audio.stopMusicRef]);

  // ── Input handlers ──────────────────────────────────────────────────────────

  const startHold = useCallback(() => {
    const s = stateRef.current;
    if (!s.started || s.gameOver) return;
    holdAgeRef.current = 0;
    isHoldingRef.current = true;
    audio.startMagnetHum();
  }, [audio.startMagnetHum]);

  const endHold = useCallback(() => {
    isHoldingRef.current = false;
    audio.stopMagnetHum();
  }, [audio.stopMagnetHum]);

  // ── Trail equip wrapper (also clears particle array) ─────────────────────────

  const handleEquipTrail = useCallback(
    (id: string) => {
      store.equipTrail(id);
      trailParticlesRef.current = [];
    },
    [store],
  );

  // ── Game loop ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    stateRef.current = makeInitialState(stateRef.current.hiScore);

    const draw = () => {
      const s = stateRef.current;

      // Background
      drawBackground(
        ctx,
        store.activeBgRef.current,
        bgOffsetRef.current,
        s.started,
        s.speed,
      );

      if (!s.started) return;

      // Physics update
      if (!s.gameOver) {
        s.frameCount++;
        s.speed = INITIAL_SPEED + s.frameCount * SPEED_INCREMENT;
        bgOffsetRef.current += s.speed;

        if (isHoldingRef.current) {
          s.playerVY -= HOLD_GRAVITY;
        } else {
          s.playerVY += GRAVITY;
        }
        s.playerVY = Math.max(-MAX_VY, Math.min(MAX_VY, s.playerVY));
        s.playerY += s.playerVY;

        if (s.playerY <= 0) {
          s.playerY = 0;
          s.playerVY = 0;
        }
        if (s.playerY + PLAYER_SIZE >= CANVAS_H) {
          s.playerY = CANVAS_H - PLAYER_SIZE;
          s.playerVY = 0;
        }

        // Spawn obstacles
        const lastObs = s.obstacles[s.obstacles.length - 1];
        const spacingClear =
          !lastObs || lastObs.x + lastObs.w < CANVAS_W - MIN_OBSTACLE_SPACING;
        if (s.frameCount - s.lastSpawn >= OBSTACLE_INTERVAL && spacingClear) {
          s.lastSpawn = s.frameCount;
          s.obstacles.push(spawnObstacle());
        }

        // Spawn coins
        if (s.frameCount - s.lastCoinSpawn >= COIN_INTERVAL) {
          s.lastCoinSpawn = s.frameCount;
          const coin = spawnCoin(Math.random() < RARE_COIN_CHANCE);
          coin.y = findSafeSpawnY(
            coin.x,
            coin.radius,
            s.obstacles,
            COIN_RADIUS + 10,
            CANVAS_H - COIN_RADIUS * 2 - 10,
          );
          s.coins.push(coin);
        }

        // Lucky charm bonus coins
        if (
          store.luckyCharmLevelRef.current > 0 &&
          s.frameCount - s.lastLuckySpawn >= LUCKY_COIN_CHECK_INTERVAL
        ) {
          s.lastLuckySpawn = s.frameCount;
          const luckyChance =
            store.luckyCharmLevelRef.current * LUCKY_CHARM_BONUS_PER_LEVEL;
          if (Math.random() < luckyChance) {
            const luckyCoin = spawnCoin(Math.random() < RARE_COIN_CHANCE);
            luckyCoin.y = findSafeSpawnY(
              luckyCoin.x,
              luckyCoin.radius,
              s.obstacles,
              COIN_RADIUS + 10,
              CANVAS_H - COIN_RADIUS * 2 - 10,
            );
            s.coins.push(luckyCoin);
          }
        }

        // Spawn shield (rare; only one on screen at a time)
        if (
          !s.shieldActive &&
          !s.shieldPickups.some((sp) => !sp.collected) &&
          s.frameCount - s.lastShieldSpawn >= SHIELD_INTERVAL
        ) {
          s.lastShieldSpawn = s.frameCount;
          const shield = spawnShield();
          shield.y = findSafeSpawnY(
            shield.x,
            shield.radius,
            s.obstacles,
            SHIELD_RADIUS + 14,
            CANVAS_H - SHIELD_RADIUS * 2 - 14,
          );
          s.shieldPickups.push(shield);
        }

        // Scroll world left
        for (const obs of s.obstacles) obs.x -= s.speed;
        for (const coin of s.coins) coin.x -= s.speed;
        for (const sp of s.shieldPickups) sp.x -= s.speed;

        // Remove off-screen entities
        s.obstacles = s.obstacles.filter((o) => o.x > -o.w - 2);
        s.coins = s.coins.filter((c) => !c.collected && c.x > -c.radius - 2);
        s.shieldPickups = s.shieldPickups.filter(
          (sp) => !sp.collected && sp.x > -sp.radius - 2,
        );

        // Score: count passed obstacles
        for (const obs of s.obstacles) {
          if (!obs.passed && obs.x + obs.w < PLAYER_X) {
            obs.passed = true;
            s.score++;
          }
        }

        // Coin magnet attraction
        const pcx = PLAYER_X + PLAYER_SIZE / 2;
        const pcy = s.playerY + PLAYER_SIZE / 2;
        const magnetRadius =
          store.magnetLevelRef.current * MAGNET_RADIUS_PER_LEVEL;
        if (magnetRadius > 0) {
          for (const coin of s.coins) {
            if (coin.collected) continue;
            const mdx = pcx - coin.x;
            const mdy = pcy - coin.y;
            const distSq = mdx * mdx + mdy * mdy;
            if (distSq < magnetRadius * magnetRadius && distSq > 0) {
              const dist = Math.sqrt(distSq);
              const strength = 0.15 * (1 - dist / magnetRadius);
              coin.x += mdx * strength;
              coin.y += mdy * strength;
            }
          }
        }

        // Coin collection (circle-AABB overlap)
        const half = PLAYER_SIZE / 2;
        for (const coin of s.coins) {
          if (coin.collected) continue;
          const nearX = Math.max(pcx - half, Math.min(pcx + half, coin.x));
          const nearY = Math.max(pcy - half, Math.min(pcy + half, coin.y));
          const dx = coin.x - nearX;
          const dy = coin.y - nearY;
          if (dx * dx + dy * dy < coin.radius * coin.radius) {
            coin.collected = true;
            s.coinCount += coin.isRare ? RARE_COIN_VALUE : 1;
            if (s.coinCount > s.hiCoins) s.hiCoins = s.coinCount;
            if (coin.isRare) {
              for (let i = 0; i < 24; i++) {
                const ang = (i / 24) * Math.PI * 2 + Math.random() * 0.26;
                const spd = 2.5 + Math.random() * 5.0;
                rareCoinParticlesRef.current.push({
                  x: coin.x,
                  y: coin.y,
                  vx: Math.cos(ang) * spd,
                  vy: Math.sin(ang) * spd,
                  age: 0,
                  maxAge: 28 + Math.random() * 22,
                  size: 2 + Math.random() * 3.5,
                  hue: 270 + Math.random() * 60,
                });
              }
              floatingTextsRef.current.push({
                x: PLAYER_X + PLAYER_SIZE / 2,
                y: s.playerY - 4,
                text: '+5',
                age: 0,
                maxAge: 55,
              });
              audio.playRareCoinSfxRef.current();
            }
          }
        }

        // Shield pickup collection
        if (!s.shieldActive) {
          for (const sp of s.shieldPickups) {
            if (sp.collected) continue;
            const spNX = Math.max(pcx - half, Math.min(pcx + half, sp.x));
            const spNY = Math.max(pcy - half, Math.min(pcy + half, sp.y));
            const spDx = sp.x - spNX;
            const spDy = sp.y - spNY;
            if (spDx * spDx + spDy * spDy < sp.radius * sp.radius) {
              sp.collected = true;
              s.shieldActive = true;
              audio.playShieldPickupSfxRef.current();
            }
          }
        }

        // Collision: obstacles (AABB with 4 px inset, per-slab)
        const px1 = PLAYER_X + 4;
        const px2 = PLAYER_X + PLAYER_SIZE - 4;
        const py1 = s.playerY + 4;
        const py2 = s.playerY + PLAYER_SIZE - 4;

        collisionLoop: for (const obs of s.obstacles) {
          if (px2 > obs.x && px1 < obs.x + obs.w) {
            for (const slab of obs.slabs) {
              if (py2 > slab.y && py1 < slab.y + slab.h) {
                if (s.shieldActive) {
                  s.shieldActive = false;
                  s.bounceAge = SHIELD_BOUNCE_DURATION;
                  const slabMidY = slab.y + slab.h / 2;
                  s.playerVY =
                    pcy < slabMidY ? -SHIELD_BOUNCE_VY : SHIELD_BOUNCE_VY;
                  for (const o of s.obstacles) o.x += SHIELD_BOUNCE_PUSHBACK;
                  for (const c of s.coins) c.x += SHIELD_BOUNCE_PUSHBACK;
                  for (const shp of s.shieldPickups)
                    shp.x += SHIELD_BOUNCE_PUSHBACK;
                  bgOffsetRef.current = Math.max(
                    0,
                    bgOffsetRef.current - SHIELD_BOUNCE_PUSHBACK,
                  );
                  const bpx = PLAYER_X + PLAYER_SIZE / 2;
                  const bpy = s.playerY + PLAYER_SIZE / 2;
                  for (let i = 0; i < 28; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = 2.5 + Math.random() * 5.5;
                    shieldShardRef.current.push({
                      x: bpx + (Math.random() - 0.5) * PLAYER_SIZE,
                      y: bpy + (Math.random() - 0.5) * PLAYER_SIZE,
                      vx: Math.cos(ang) * spd,
                      vy: Math.sin(ang) * spd,
                      age: 0,
                      maxAge: 22 + Math.random() * 20,
                      size: 1.5 + Math.random() * 3,
                      hue: 200 + Math.random() * 60,
                    });
                  }
                  audio.playShieldBreakSfxRef.current();
                } else {
                  s.gameOver = true;
                  if (s.score > s.hiScore) s.hiScore = s.score;
                }
                break collisionLoop;
              }
            }
          }
        }

        if (s.bounceAge > 0) s.bounceAge--;

        // Trail particles
        const trail = store.activeTrailRef.current;
        if (trail !== 'none') {
          const tpx = PLAYER_X;
          const tpy = s.playerY + PLAYER_SIZE / 2;
          if (trail === 'sparks') {
            for (let i = 0; i < 2; i++) {
              trailParticlesRef.current.push({
                x: tpx + Math.random() * 8,
                y: tpy + (Math.random() - 0.5) * PLAYER_SIZE * 0.7,
                vx: -(s.speed + 0.5 + Math.random() * 2),
                vy: (Math.random() - 0.5) * 1.5,
                age: 0,
                maxAge: 18 + Math.random() * 12,
                size: 2 + Math.random() * 3,
                hue: 0,
                color: `hsl(${20 + Math.random() * 30},100%,${55 + Math.random() * 25}%)`,
              });
            }
          } else if (trail === 'stars') {
            trailParticlesRef.current.push({
              x: tpx + Math.random() * 10,
              y: tpy + (Math.random() - 0.5) * PLAYER_SIZE * 0.6,
              vx: -(s.speed * 0.5 + 0.4 + Math.random() * 1.0),
              vy: (Math.random() - 0.5) * 0.5,
              age: 0,
              maxAge: 30 + Math.random() * 20,
              size: 3 + Math.random() * 3,
              hue: 0,
              color: `hsl(${50 + Math.random() * 20},100%,80%)`,
            });
          } else if (trail === 'ghost') {
            trailParticlesRef.current.push({
              x: tpx + Math.random() * 10,
              y: tpy + (Math.random() - 0.5) * PLAYER_SIZE * 0.7,
              vx: -(s.speed * 0.35 + 0.2 + Math.random() * 0.6),
              vy: (Math.random() - 0.5) * 0.3,
              age: 0,
              maxAge: 40 + Math.random() * 20,
              size: 7 + Math.random() * 8,
              hue: 0,
              color: '',
            });
          } else if (trail === 'rainbow') {
            trailParticlesRef.current.push({
              x: tpx + Math.random() * 8,
              y: tpy + (Math.random() - 0.5) * PLAYER_SIZE * 0.6,
              vx: -(s.speed * 0.45 + 0.4 + Math.random() * 1.2),
              vy: (Math.random() - 0.5) * 0.8,
              age: 0,
              maxAge: 25 + Math.random() * 15,
              size: 4 + Math.random() * 4,
              hue: (s.frameCount * 6 + Math.random() * 40) % 360,
              color: '',
            });
          }
        }

        // Magnetic hold particles
        if (isHoldingRef.current) {
          const mpx = PLAYER_X + PLAYER_SIZE / 2;
          const mpy = s.playerY;
          for (let i = 0; i < 2; i++) {
            magParticlesRef.current.push({
              x: mpx + (Math.random() - 0.5) * PLAYER_SIZE * 0.75,
              y: mpy + Math.random() * 4,
              vx: (Math.random() - 0.5) * 1.2,
              vy: -(2.0 + Math.random() * 3.0),
              age: 0,
              maxAge: 22 + Math.random() * 18,
              size: 2 + Math.random() * 3,
            });
          }
          holdAgeRef.current++;
          const ceilCount = 1 + Math.floor(Math.random() * 3);
          for (let i = 0; i < ceilCount; i++) {
            ceilParticlesRef.current.push({
              x: Math.random() * CANVAS_W,
              y: Math.random() * 4,
              vx: (Math.random() - 0.5) * 2.5,
              vy: 0.8 + Math.random() * 2.5,
              age: 0,
              maxAge: 12 + Math.random() * 14,
              size: 1 + Math.random() * 2.2,
            });
          }
        }
      } // end !gameOver physics block

      // Game-over transition: notify React once
      if (s.gameOver && !gameOverFiredRef.current) {
        gameOverFiredRef.current = true;
        isHoldingRef.current = false;
        audio.stopMagnetHumRef.current();
        audio.stopMusicRef.current();
        store.addRunCoins(s.coinCount);
        setGameOverData({
          score: s.score,
          coins: s.coinCount,
          hiScore: s.hiScore,
          hiCoins: s.hiCoins,
        });
      }

      // ── Rendering ─────────────────────────────────────────────────────────

      // Ceiling glow (while holding)
      if (isHoldingRef.current && !s.gameOver) {
        drawCeilingGlow(ctx, holdAgeRef.current, s.frameCount);
      }

      // Screen shake
      const shaking = applyScreenShake(ctx, s.bounceAge);

      drawCoins(ctx, s.coins, s.shieldPickups, s.frameCount);
      drawObstacles(ctx, s.obstacles);

      trailParticlesRef.current = updateAndDrawTrailParticles(
        ctx,
        trailParticlesRef.current,
        store.activeTrailRef.current,
      );
      magParticlesRef.current = updateAndDrawMagParticles(
        ctx,
        magParticlesRef.current,
      );
      ceilParticlesRef.current = updateAndDrawCeilParticles(
        ctx,
        ceilParticlesRef.current,
      );
      shieldShardRef.current = updateAndDrawShieldShards(
        ctx,
        shieldShardRef.current,
      );
      rareCoinParticlesRef.current = updateAndDrawRareCoinParticles(
        ctx,
        rareCoinParticlesRef.current,
      );
      floatingTextsRef.current = updateAndDrawFloatingTexts(
        ctx,
        floatingTextsRef.current,
      );

      if (!s.gameOver) {
        drawMagnetField(
          ctx,
          store.magnetLevelRef.current,
          PLAYER_X + PLAYER_SIZE / 2,
          s.playerY + PLAYER_SIZE / 2,
        );
      }

      const skin =
        PLAYER_SKINS.find((sk) => sk.id === store.activeSkinRef.current) ??
        PLAYER_SKINS[0];
      drawPlayer(
        ctx,
        s.playerY,
        s.playerVY,
        skin,
        store.activeCosmeticTypeRef.current as import('./types').CosmeticType,
        isHoldingRef.current,
        s.frameCount,
      );

      drawShieldGlow(
        ctx,
        PLAYER_X + PLAYER_SIZE / 2,
        s.playerY + PLAYER_SIZE / 2,
        s.shieldActive,
        s.frameCount,
      );
      drawElectricArc(
        ctx,
        isHoldingRef.current && !s.gameOver,
        s.playerY,
        holdAgeRef.current,
      );

      if (shaking) ctx.restore();

      drawBounceFlash(ctx, s.bounceAge);
      drawShieldHudIndicator(ctx, s.shieldActive, s.frameCount);
      drawHUD(ctx, s.score, s.coinCount, s.hiScore);
    };

    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard input ──────────────────────────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!e.repeat) startHold();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        endHold();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [startHold, endHold]);

  // ── Render ──────────────────────────────────────────────────────────────────

  const isPlaying = !isMenuVisible && !gameOverData;

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        overflow: 'hidden',
        userSelect: 'none',
      }}
      onMouseDown={isPlaying ? startHold : undefined}
      onMouseUp={isPlaying ? endHold : undefined}
      onMouseLeave={isPlaying ? endHold : undefined}
      onTouchStart={
        isPlaying
          ? (e) => {
              e.preventDefault();
              startHold();
            }
          : undefined
      }
      onTouchEnd={
        isPlaying
          ? (e) => {
              e.preventDefault();
              endHold();
            }
          : undefined
      }
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          maxWidth: '100vw',
          maxHeight: '100vh',
          imageRendering: 'pixelated',
          cursor: 'pointer',
          display: 'block',
        }}
      />

      {/* Main menu */}
      {isMenuVisible && !showShop && !showSettings && (
        <MainMenu
          totalCoins={store.totalCoins}
          onPlay={startGame}
          onShop={() => setShowShop(true)}
          onSettings={() => setShowSettings(true)}
        />
      )}

      {/* Game over */}
      {gameOverData && !showShop && !showSettings && (
        <GameOverScreen
          score={gameOverData.score}
          coins={gameOverData.coins}
          hiScore={gameOverData.hiScore}
          hiCoins={gameOverData.hiCoins}
          onRetry={retry}
          onShop={() => setShowShop(true)}
          onMenu={goToMenu}
        />
      )}

      {/* In-game buttons (SHOP + SETTINGS) */}
      {isPlaying && (
        <InGameButtons
          muted={audio.muted}
          onShop={() => setShowShop((v) => !v)}
          onSettings={() => setShowSettings((v) => !v)}
        />
      )}

      {/* Shop modal */}
      <ShopModal
        visible={showShop}
        onClose={() => setShowShop(false)}
        totalCoins={store.totalCoins}
        magnetLevel={store.magnetLevel}
        onBuyMagnet={store.buyMagnetUpgrade}
        luckyCharmLevel={store.luckyCharmLevel}
        onBuyLuckyCharm={store.buyLuckyCharmUpgrade}
        unlocked={store.unlockedCosmetics}
        activeSkin={store.activeSkin}
        activeTrail={store.activeTrail}
        activeBg={store.activeBg}
        activeCosmeticType={store.activeCosmeticType}
        onUnlock={store.unlockCosmetic}
        onEquipSkin={store.equipSkin}
        onEquipTrail={handleEquipTrail}
        onEquipBg={store.equipBg}
        onEquipCosmeticType={store.equipCosmeticType}
      />

      {/* Settings modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        muted={audio.muted}
        musicVolume={audio.musicVolume}
        sfxVolume={audio.sfxVolume}
        onToggleMute={audio.toggleMute}
        onMusicVolumeChange={audio.changeMusicVolume}
        onSfxVolumeChange={audio.changeSfxVolume}
      />
    </div>
  );
}
