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
import { InGameButtons } from './ui/InGameButtons';
import type { CosmeticType } from './types';

//

interface GameOverData {
  score: number;
  coins: number;
  hiScore: number;
  hiCoins: number;
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
    );
  }

  //  UI state
  const [showShop, setShowShop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);

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
    audio.startMusicRef.current();
  }, [audio.startMusicRef]);

  const goToMenu = useCallback(() => {
    const engine = engineRef.current!;
    engine.reset(engine.state.hiScore, engine.state.hiCoins);
    gameOverFiredRef.current = false;
    pendingGameOverRef.current = null;
    setIsMenuVisible(true);
    setShowShop(false);
    setShowSettings(false);
    setGameOverData(null);
    audio.stopMusicRef.current();
  }, [audio.stopMusicRef]);

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
        store.addRunCoins(s.coinCount);
        audio.playCrashSfxRef.current();
        // Stash data; GameOverScreen is shown after the death animation finishes.
        pendingGameOverRef.current = {
          score: s.score,
          coins: s.coinCount,
          hiScore: s.hiScore,
          hiCoins: s.hiCoins,
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
        // Belt-and-suspenders: suppress the mobile browser's blue tap-highlight
        // on this element in addition to the global CSS rule in index.css.
        WebkitTapHighlightColor: 'transparent',
        // Disable all default touch gestures on the container so the game
        // captures every pointer event cleanly on mobile.
        touchAction: 'none',
      }}
      onPointerDown={
        isPlaying
          ? (e) => {
              // Retain pointer capture so pointerup fires even if the finger
              // travels outside the element.
              e.currentTarget.setPointerCapture(e.pointerId);
              startHold();
            }
          : undefined
      }
      onPointerUp={isPlaying ? endHold : undefined}
      onPointerLeave={isPlaying ? endHold : undefined}
      onPointerCancel={isPlaying ? endHold : undefined}
      // Prevent the iOS long-press context menu (copy/paste/select callout)
      // from appearing during gameplay. Safe on desktop — right-click still
      // works in menus because those elements stop propagation.
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Single canvas for all dynamic gameplay rendering */}
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
          touchAction: 'none',
        }}
      />

      {/*  React DOM overlays (UI only  no gameplay rendering here)  */}

      {isMenuVisible && !showShop && !showSettings && (
        <MainMenu
          totalCoins={store.totalCoins}
          onPlay={startGame}
          onShop={() => setShowShop(true)}
          onSettings={() => setShowSettings(true)}
        />
      )}

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

      {isPlaying && (
        <InGameButtons
          muted={audio.muted}
          onShop={() => setShowShop((v) => !v)}
          onSettings={() => setShowSettings((v) => !v)}
        />
      )}

      <ShopModal
        visible={showShop}
        onClose={() => setShowShop(false)}
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
