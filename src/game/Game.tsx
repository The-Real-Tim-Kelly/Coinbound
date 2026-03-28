/**
 * Game  thin React orchestrator.
 *
 * Responsibilities:
 *    Owns the GameEngine instance and the animation-frame loop.
 *    Wires pointer / keyboard input  engine.setHolding().
 *    Syncs store config into the engine on every frame.
 *    Calls canvas render helpers after each engine.update().
 *    Renders React UI overlays (menus, modals) as DOM elements.
 *
 * All physics, collision, spawning, and particle-emission logic
 * lives in src/game/engine/GameEngine.ts.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

//  Constants
import {
  CANVAS_W,
  CANVAS_H,
  PLAYER_X,
  PLAYER_SIZE,
  DEATH_ANIM_DURATION,
  INVINCIBILITY_DURATION,
} from './constants';

//  Engine
import { GameEngine } from './engine/GameEngine';

//  Data
import { PLAYER_SKINS } from './data/cosmetics';

//  Render helpers
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
  updateAndDrawDeathParticles,
  updateAndDrawBreakerParticles,
  updateAndDrawGhostParticles,
} from './render/drawParticles';
import {
  drawPlayer,
  drawMagnetField,
  drawCeilingGlow,
  drawShieldGlow,
  drawBreakerAura,
  drawElectricArc,
  applyScreenShake,
  drawBounceFlash,
  drawShieldHudIndicator,
  drawBreakerFlash,
  drawBreakerHudIndicator,
  drawInvincibilityAura,
  drawInvincibilityHudIndicator,
} from './render/drawPlayer';
import { drawHUD } from './render/drawHUD';

//  Audio & store
import { useAudio } from './audio/useAudio';
import { useStore } from './hooks/useStore';

//  UI components
import { MainMenu } from './ui/MainMenu';
import { GameOverScreen } from './ui/GameOverScreen';
import { ShopModal } from './ui/ShopModal';
import { SettingsModal } from './ui/SettingsModal';
import type { CosmeticType } from './types';

//

interface GameOverData {
  score: number;
  coins: number;
  hiScore: number;
  hiCoins: number;
  isNewScore: boolean;
  isNewCoins: boolean;
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const gameOverFiredRef = useRef(false);
  // Stores the game-over data while the death animation plays; cleared once
  // the GameOverScreen is actually shown (after ~400 ms).
  const pendingGameOverRef = useRef<GameOverData | null>(null);

  //  Hooks
  const store = useStore();
  const audio = useAudio({
    initialMuted: localStorage.getItem('coinbound_muted') === 'true',
    initialMusicVolume: parseInt(
      localStorage.getItem('coinbound_music_volume') ?? '50',
      10,
    ),
    initialSfxVolume: parseInt(
      localStorage.getItem('coinbound_sfx_volume') ?? '65',
      10,
    ),
  });

  //  GameEngine (created once; stable across all re-renders)
  const engineRef = useRef<GameEngine | null>(null);
  if (engineRef.current == null) {
    engineRef.current = new GameEngine(
      {
        magnetLevel: store.magnetLevelRef.current,
        luckyCharmLevel: store.luckyCharmLevelRef.current,
        powerSurgeLevel: store.powerSurgeLevelRef.current,
        activeTrail: store.activeTrailRef.current,
      },
      {
        // Callbacks read `.current` at fire-time so they always invoke the
        // latest audio function even after re-renders.
        onRareCoinCollected: () => audio.playRareCoinSfxRef.current(),
        onCoinCollected: () => audio.playCoinSfxRef.current(),
        onShieldPickedUp: () => audio.playShieldPickupSfxRef.current(),
        onShieldBroken: () => audio.playShieldBreakSfxRef.current(),
        onBreakerPickedUp: () => audio.playBreakerPickupSfxRef.current(),
        onBreakerUsed: () => audio.playBreakerUsedSfxRef.current(),
        onInvincibilityPickedUp: () =>
          audio.playInvincibilityPickupSfxRef.current(),
      },
      store.bestScoreRef.current,
      store.bestCoinsRef.current,
    );
  }

  //  UI state
  const [showShop, setShowShop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);
  const [hasPlayedPostGameCoinAnimation, setHasPlayedPostGameCoinAnimation] =
    useState(false);

  // Wallet display — two separate values:
  //   displayWalletCoins: what the top-bar shows (animates during coin flight)
  //   store.totalCoins / localStorage: the real total, updated immediately on run end
  const walletCoinRef = useRef<HTMLSpanElement>(null);
  // Stable alias so callbacks can read totalCoinsRef.current without listing
  // the whole `store` object as a dependency (same pattern as engineRef).
  const { totalCoinsRef } = store;
  // Initialised from localStorage so the display is correct on first render.
  // Read directly from storage to avoid touching a ref during render.
  const [displayWalletCoins, setDisplayWalletCoins] = useState(() =>
    parseInt(localStorage.getItem('coinbound_total_coins') ?? '0', 10),
  );
  const [walletPulseKey, setWalletPulseKey] = useState(0);

  // Stable callback — GameOverScreen calls this to get the wallet element's
  // screen position at the moment the coin flight canvas mounts (after layout).
  const getWalletPos = useCallback((): { x: number; y: number } | null => {
    const rect = walletCoinRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  const handleWalletIncrement = useCallback((delta: number) => {
    setWalletPulseKey((k) => k + 1);
    setDisplayWalletCoins((prev) => prev + delta);
  }, []);

  // The top-bar always shows displayWalletCoins — it starts at the pre-run
  // total, then increments visually as coins land during the animation.
  const walletCoinsDisplay = displayWalletCoins;

  //  Navigation helpers

  const startGame = useCallback(() => {
    const engine = engineRef.current!;
    engine.reset(engine.state.hiScore, engine.state.hiCoins);
    engine.start();
    gameOverFiredRef.current = false;
    pendingGameOverRef.current = null;
    setIsMenuVisible(false);
    setShowShop(false);
    setShowSettings(false);
    setGameOverData(null);
    setHasPlayedPostGameCoinAnimation(false);
    audio.startMusicRef.current();
  }, [audio.startMusicRef]);

  const retry = useCallback(() => {
    const engine = engineRef.current!;
    engine.reset(engine.state.hiScore, engine.state.hiCoins);
    engine.start();
    gameOverFiredRef.current = false;
    pendingGameOverRef.current = null;
    setIsMenuVisible(false);
    setShowShop(false);
    setShowSettings(false);
    setGameOverData(null);
    setWalletPulseKey(0);
    setHasPlayedPostGameCoinAnimation(false);
    // Snap display to the true wallet so the top bar is always accurate at
    // the start of a new run (e.g. if the player bought something mid-screen).
    setDisplayWalletCoins(totalCoinsRef.current);
    audio.startMusicRef.current();
  }, [audio.startMusicRef, totalCoinsRef]);

  const goToMenu = useCallback(() => {
    const engine = engineRef.current!;
    engine.reset(engine.state.hiScore, engine.state.hiCoins);
    gameOverFiredRef.current = false;
    pendingGameOverRef.current = null;
    setIsMenuVisible(true);
    setShowShop(false);
    setShowSettings(false);
    setGameOverData(null);
    setWalletPulseKey(0);
    // Snap display to the true wallet so the top bar is always accurate.
    setDisplayWalletCoins(totalCoinsRef.current);
    audio.stopMusicRef.current();
  }, [audio.stopMusicRef, totalCoinsRef]);

  //  Input handlers

  const startHold = useCallback(() => {
    const engine = engineRef.current!;
    if (!engine.state.started || engine.state.gameOver) return;
    engine.setHolding(true);
    audio.startMagnetHum();
  }, [audio]);

  const endHold = useCallback(() => {
    engineRef.current?.setHolding(false);
    audio.stopMagnetHum();
  }, [audio]);

  //  Trail equip (clears particles + notifies engine)

  const handleEquipTrail = useCallback(
    (id: string) => {
      store.equipTrail(id);
      const engine = engineRef.current;
      if (engine) {
        engine.clearTrailParticles();
        engine.updateConfig({ activeTrail: id });
      }
    },
    [store],
  );

  //  Pause helpers — pause engine when opening a menu mid-run, resume on close

  const openShop = useCallback(() => {
    const engine = engineRef.current!;
    if (engine.state.started && !engine.state.gameOver) {
      engine.pause();
      audio.stopMagnetHumRef.current();
    }
    setShowShop(true);
  }, [audio]);

  const closeShop = useCallback(() => {
    setShowShop(false);
    // Sync wallet display to the real total; purchases in the shop could have
    // reduced store.totalCoins while the animation was frozen.
    setDisplayWalletCoins(totalCoinsRef.current);
    const engine = engineRef.current!;
    if (engine.paused) {
      engine.resume();
      lastTimeRef.current = 0; // reset dt so first resumed frame uses 1/60
    }
  }, [totalCoinsRef]);

  const openSettings = useCallback(() => {
    const engine = engineRef.current!;
    if (engine.state.started && !engine.state.gameOver) {
      engine.pause();
      audio.stopMagnetHumRef.current();
    }
    setShowSettings(true);
  }, [audio]);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
    // Keep wallet display in sync if settings were opened from the game-over screen.
    setDisplayWalletCoins(totalCoinsRef.current);
    const engine = engineRef.current!;
    if (engine.paused) {
      engine.resume();
      lastTimeRef.current = 0;
    }
  }, [totalCoinsRef]);

  //  Animation-frame loop

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const loop = (timestamp: number) => {
      const engine = engineRef.current!;
      const s = engine.state;
      const p = engine.particles;

      // Push latest store values into the engine every frame so upgrades
      // and equipped items take effect without any extra wiring.
      engine.updateConfig({
        magnetLevel: store.magnetLevelRef.current,
        luckyCharmLevel: store.luckyCharmLevelRef.current,
        powerSurgeLevel: store.powerSurgeLevelRef.current,
        activeTrail: store.activeTrailRef.current,
      });

      //  Delta time, normalised to 60 fps
      // Clamped to 50 ms (20 fps minimum) to prevent physics tunnelling
      // after tab switches or slow frames.
      const dt =
        lastTimeRef.current > 0
          ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.05)
          : 1 / 60;
      lastTimeRef.current = timestamp;
      const dtFactor = dt * 60; // 1.0 at exactly 60 fps

      //  Advance game logic
      engine.update(dtFactor);

      //  Game-over transition (fires exactly once)
      if (s.gameOver && !gameOverFiredRef.current) {
        gameOverFiredRef.current = true;
        engine.setHolding(false);
        audio.stopMagnetHumRef.current();
        audio.stopMusicRef.current();
        // Capture previous bests BEFORE updating leaderboards so we can
        // detect a new personal record.
        const prevBestScore = store.bestScoreRef.current;
        const prevBestCoins = store.bestCoinsRef.current;
        // Capture the pre-run display total BEFORE adding coins so the
        // top-bar stays frozen at the old value until the animation plays.
        const prevTotal = store.totalCoinsRef.current;
        // Immediately update the true wallet (localStorage) — this is the
        // authoritative value; it does NOT affect displayWalletCoins yet.
        store.addRunCoins(s.coinCount);
        setDisplayWalletCoins(prevTotal);
        store.updateLeaderboards(s.score, s.coinCount);
        audio.playCrashSfxRef.current();
        // Stash data; GameOverScreen is shown after the death animation finishes.
        pendingGameOverRef.current = {
          score: s.score,
          coins: s.coinCount,
          hiScore: s.hiScore,
          hiCoins: s.hiCoins,
          isNewScore: s.score > prevBestScore,
          isNewCoins: s.coinCount > prevBestCoins,
        };
      }

      // Show the GameOverScreen once the death animation completes.
      if (
        pendingGameOverRef.current !== null &&
        s.deathAge >= DEATH_ANIM_DURATION
      ) {
        setGameOverData(pendingGameOverRef.current);
        pendingGameOverRef.current = null;
      }

      //  Canvas rendering

      // Background is always drawn (menu and gameplay).
      drawBackground(
        ctx,
        store.activeBgRef.current,
        engine.bgOffset,
        s.started,
        s.speed,
      );

      if (s.started) {
        // Ceiling magnetic glow while the player holds input.
        if (engine.isHolding && !s.gameOver) {
          drawCeilingGlow(ctx, engine.holdAge, s.frameCount);
        }

        // Screen shake  saves ctx; restore called after shaken draws.
        const shaking = applyScreenShake(ctx, s.bounceAge);

        drawCoins(
          ctx,
          s.coins,
          s.shieldPickups,
          s.breakerPickups,
          s.invincibilityPickups,
          s.frameCount,
        );
        drawObstacles(ctx, s.obstacles);

        // Particle systems: each function filters dead particles and returns
        // the trimmed array that we store back onto the particles object.
        p.trail = updateAndDrawTrailParticles(
          ctx,
          p.trail,
          store.activeTrailRef.current,
          dtFactor,
        );
        p.mag = updateAndDrawMagParticles(ctx, p.mag, dtFactor);
        p.ceil = updateAndDrawCeilParticles(ctx, p.ceil, dtFactor);
        p.shieldShards = updateAndDrawShieldShards(
          ctx,
          p.shieldShards,
          dtFactor,
        );
        p.rareCoin = updateAndDrawRareCoinParticles(ctx, p.rareCoin, dtFactor);
        p.floatingTexts = updateAndDrawFloatingTexts(
          ctx,
          p.floatingTexts,
          dtFactor,
        );
        p.breakerBurst = updateAndDrawBreakerParticles(
          ctx,
          p.breakerBurst,
          dtFactor,
        );
        p.ghostBurst = updateAndDrawGhostParticles(ctx, p.ghostBurst, dtFactor);

        // Magnet attraction ring (only while alive).
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
          store.activeCosmeticTypeRef.current as CosmeticType,
          engine.isHolding,
          s.frameCount,
          engine.holdAge,
          s.deathAge,
          s.invincibilityActive,
          s.invincibilityTimer,
        );

        // Death particle burst (only visible after fatal collision).
        p.deathParticles = updateAndDrawDeathParticles(
          ctx,
          p.deathParticles,
          dtFactor,
        );

        drawShieldGlow(
          ctx,
          PLAYER_X + PLAYER_SIZE / 2,
          s.playerY + PLAYER_SIZE / 2,
          s.shieldActive,
          s.frameCount,
        );

        drawBreakerAura(
          ctx,
          PLAYER_X + PLAYER_SIZE / 2,
          s.playerY + PLAYER_SIZE / 2,
          s.breakerActive,
          s.frameCount,
        );

        drawInvincibilityAura(
          ctx,
          PLAYER_X + PLAYER_SIZE / 2,
          s.playerY + PLAYER_SIZE / 2,
          s.invincibilityActive,
          s.invincibilityTimer,
          s.frameCount,
        );

        drawElectricArc(
          ctx,
          engine.isHolding && !s.gameOver,
          s.playerY,
          engine.holdAge,
        );

        // Restore context saved by applyScreenShake.
        if (shaking) ctx.restore();

        drawBounceFlash(ctx, s.bounceAge);
        drawBreakerFlash(ctx, s.breakerFlashAge);
        drawShieldHudIndicator(ctx, s.shieldActive, s.frameCount);
        drawBreakerHudIndicator(ctx, s.breakerActive, s.frameCount);
        drawInvincibilityHudIndicator(
          ctx,
          s.invincibilityActive,
          s.invincibilityTimer,
          INVINCIBILITY_DURATION,
          s.frameCount,
        );
        drawHUD(ctx, s.score, s.coinCount, s.hiScore);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  //  Keyboard input

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

  //  JSX

  const isPlaying = !isMenuVisible && !gameOverData;

  // Shared button style for the top bar
  const topBarBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12,
    color: '#e0d8ff',
    fontSize: 22,
    lineHeight: 1,
    cursor: 'pointer',
    padding: '10px 14px',
    minWidth: 48,
    minHeight: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
    flexShrink: 0,
  };

  return (
    <div
      className="coinbound-root"
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── Animated arcade background ── */}
      <div className="coinbound-bg" aria-hidden="true" />

      {/* ── Top UI bar ── */}
      {/* The outer div absorbs the status-bar / notch height via
          env(safe-area-inset-top) so buttons always appear below the
          system UI. The inner row has a fixed 56 px height for the controls. */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          // env(safe-area-inset-top) provides the exact status-bar height on
          // Android (Capacitor sets viewport-fit=cover).  The max() fallback
          // ensures at least 24 px on older WebViews that ignore env().
          paddingTop: 'max(env(safe-area-inset-top, 0px), 24px)',
          background: 'rgba(4,0,16,0.72)',
          borderBottom: '1px solid rgba(120,60,255,0.18)',
          boxShadow: '0 2px 18px rgba(0,0,0,0.5)',
          zIndex: 15,
          position: 'relative',
        }}
      >
        {/* Inner control row — always 56 px tall */}
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px',
            gap: 8,
          }}
        >
          {/* Settings */}
          <button
            onClick={showSettings ? closeSettings : openSettings}
            style={topBarBtnStyle}
            aria-label="Settings"
          >
            ⚙️
          </button>

          {/* Coin counter */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
            }}
          >
            <span
              style={{
                fontSize: 20,
                filter: 'drop-shadow(0 0 6px #ffd700)',
                lineHeight: 1,
              }}
            >
              🪙
            </span>
            <span
              ref={walletCoinRef}
              key={walletPulseKey}
              style={{
                color: '#ffd700',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                fontSize: 'clamp(16px, 4.5vw, 22px)',
                letterSpacing: 1,
                textShadow: '0 0 10px rgba(255,215,0,0.6)',
                display: 'inline-block',
                animation:
                  walletPulseKey > 0
                    ? 'wallet-coin-pulse 0.32s ease-out both'
                    : undefined,
              }}
            >
              {walletCoinsDisplay}
            </span>
          </div>

          {/* Shop */}
          <button
            onClick={showShop ? closeShop : openShop}
            style={topBarBtnStyle}
            aria-label="Shop"
          >
            🛒
          </button>
        </div>
      </div>

      {/* ── Canvas area — fills remaining space ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'none',
        }}
        onPointerDown={
          isPlaying
            ? (e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                startHold();
              }
            : undefined
        }
        onPointerUp={isPlaying ? endHold : undefined}
        onPointerLeave={isPlaying ? endHold : undefined}
        onPointerCancel={isPlaying ? endHold : undefined}
      >
        {/* ── Decorative corner accents ── */}
        <div
          className="coinbound-corner coinbound-corner-tl"
          aria-hidden="true"
        />
        <div
          className="coinbound-corner coinbound-corner-tr"
          aria-hidden="true"
        />
        <div
          className="coinbound-corner coinbound-corner-bl"
          aria-hidden="true"
        />
        <div
          className="coinbound-corner coinbound-corner-br"
          aria-hidden="true"
        />

        {/* Single canvas for all dynamic gameplay rendering */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            imageRendering: 'pixelated',
            cursor: 'pointer',
            display: 'block',
            touchAction: 'none',
            position: 'relative',
            zIndex: 1,
            willChange: 'transform',
          }}
        />

        {/* React DOM overlays (menus/game-over — fixed so they cover the full viewport) */}

        {isMenuVisible && !showShop && !showSettings && (
          <MainMenu
            totalCoins={store.totalCoins}
            scoreLeaderboard={store.scoreLeaderboard}
            coinsLeaderboard={store.coinsLeaderboard}
            onPlay={startGame}
            onShop={openShop}
            onSettings={openSettings}
          />
        )}

        {gameOverData && !showShop && !showSettings && (
          <GameOverScreen
            score={gameOverData.score}
            coins={gameOverData.coins}
            hiScore={gameOverData.hiScore}
            hiCoins={gameOverData.hiCoins}
            isNewScore={gameOverData.isNewScore}
            isNewCoins={gameOverData.isNewCoins}
            onRetry={retry}
            onShop={openShop}
            onMenu={goToMenu}
            onPlayFanfare={
              gameOverData.isNewScore || gameOverData.isNewCoins
                ? audio.playNewRecordSfx
                : audio.playRunFanfare
            }
            onPlayBankCoin={audio.playBankCoinSfx}
            getWalletPos={getWalletPos}
            onWalletIncrement={handleWalletIncrement}
            skipCoinAnimation={hasPlayedPostGameCoinAnimation}
            onCoinAnimationPlayed={() =>
              setHasPlayedPostGameCoinAnimation(true)
            }
          />
        )}
      </div>

      {/* Modals — use position:fixed so they cover everything including the top bar */}
      <ShopModal
        visible={showShop}
        onClose={closeShop}
        totalCoins={store.totalCoins}
        magnetLevel={store.magnetLevel}
        onBuyMagnet={store.buyMagnetUpgrade}
        luckyCharmLevel={store.luckyCharmLevel}
        onBuyLuckyCharm={store.buyLuckyCharmUpgrade}
        powerSurgeLevel={store.powerSurgeLevel}
        onBuyPowerSurge={store.buyPowerSurgeUpgrade}
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

      <SettingsModal
        visible={showSettings}
        onClose={closeSettings}
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
