/**
 * GameEngine — pure TypeScript class that owns all mutable game state and
 * runs every physics / spawning / collision / particle-emission tick.
 *
 * It is intentionally kept free of React and DOM: the React component
 * (Game.tsx) holds a single `engineRef`, calls `engine.update(dtFactor)`
 * on each animation frame, then passes the resulting state to the canvas
 * render helpers.
 */

import {
  CANVAS_W,
  CANVAS_H,
  PLAYER_X,
  PLAYER_SIZE,
  GRAVITY,
  MAX_VY,
  HOLD_GRAVITY,
  INITIAL_SPEED,
  SPEED_INCREMENT,
  OBSTACLE_INTERVAL,
  MIN_OBSTACLE_SPACING,
  COIN_RADIUS,
  COIN_INTERVAL,
  RARE_COIN_CHANCE_MIN,
  RARE_COIN_CHANCE_MAX,
  RARE_COIN_CHANCE_GROWTH,
  RARE_COIN_VALUE,
  SHIELD_RADIUS,
  SHIELD_INTERVAL_MIN,
  SHIELD_INTERVAL_MAX,
  SHIELD_BOUNCE_VY,
  SHIELD_BOUNCE_PUSHBACK,
  SHIELD_BOUNCE_DURATION,
  BREAKER_RADIUS,
  BREAKER_INTERVAL_MIN,
  BREAKER_INTERVAL_MAX,
  BREAKER_FLASH_DURATION,
  MAX_BREAKER_PARTICLES,
  INVINCIBILITY_RADIUS,
  INVINCIBILITY_INTERVAL_MIN,
  INVINCIBILITY_INTERVAL_MAX,
  INVINCIBILITY_DURATION,
  POWER_UP_GLOBAL_COOLDOWN_MIN,
  POWER_UP_GLOBAL_COOLDOWN_MAX,
  MAGNET_RADIUS_PER_LEVEL,
  LUCKY_CHARM_BONUS_PER_LEVEL,
  LUCKY_COIN_CHECK_INTERVAL,
  POWER_SURGE_INTERVAL_REDUCTION_PER_LEVEL,
  MAX_TRAIL_PARTICLES,
  MAX_MAG_PARTICLES,
  MAX_CEIL_PARTICLES,
  MAX_SHIELD_SHARDS,
  MAX_RARE_COIN_PARTICLES,
  MAX_FLOATING_TEXTS,
  DEATH_ANIM_DURATION,
  MAX_DEATH_PARTICLES,
} from '../constants';
import { makeInitialState } from '../logic/gameState';
import { spawnObstacle } from '../logic/obstacles';
import {
  spawnCoin,
  spawnShield,
  spawnBreaker,
  spawnInvincibility,
  findSafeSpawnY,
} from '../logic/coins';
import {
  emitTrailParticles,
  emitMagParticles,
  emitCeilParticles,
} from '../logic/particles';
import type {
  GameState,
  TrailParticle,
  MagParticle,
  CeilParticle,
  ShieldShard,
  RareCoinParticle,
  FloatingText,
  DeathParticle,
  BreakerParticle,
  GhostParticle,
} from '../types';

// ─── Public interfaces ────────────────────────────────────────────────────────

/** Live configuration the engine reads on each frame from the store. */
export interface EngineConfig {
  magnetLevel: number;
  luckyCharmLevel: number;
  powerSurgeLevel: number;
  activeTrail: string;
}

/**
 * Callbacks fired by the engine when audio-worthy events occur.
 * The game component wires these to the audio subsystem.
 */
export interface EngineCallbacks {
  onRareCoinCollected: () => void;
  onCoinCollected: () => void;
  onShieldPickedUp: () => void;
  onShieldBroken: () => void;
  onBreakerPickedUp: () => void;
  onBreakerUsed: () => void;
  onInvincibilityPickedUp: () => void;
}

/** All live particle arrays, kept together for tidy access from the renderer. */
export interface ParticleState {
  trail: TrailParticle[];
  mag: MagParticle[];
  ceil: CeilParticle[];
  shieldShards: ShieldShard[];
  rareCoin: RareCoinParticle[];
  floatingTexts: FloatingText[];
  deathParticles: DeathParticle[];
  breakerBurst: BreakerParticle[];
  ghostBurst: GhostParticle[];
}

// ─── GameEngine ───────────────────────────────────────────────────────────────

export class GameEngine {
  // ── Public state (read-only references, mutated in-place each frame) ─────
  readonly state: GameState;
  readonly particles: ParticleState;

  // ── Input ─────────────────────────────────────────────────────────────────
  private _isHolding = false;
  private _holdAge = 0;
  // ── Invincibility loop sound state ─────────────────────────────────────
  /** Set externally to true when ghost mode activates; reset when it ends. */
  invincibilityJustEnded = false;
  // ── Scroll offset (background + parallax) ─────────────────────────────────
  private _bgOffset = 0;

  // ── Wired-in config and callbacks ─────────────────────────────────────────
  private _config: EngineConfig;
  private readonly _cb: EngineCallbacks;

  constructor(
    config: EngineConfig,
    callbacks: EngineCallbacks,
    hiScore = 0,
    hiCoins = 0,
  ) {
    this._config = { ...config };
    this._cb = callbacks;
    this.state = makeInitialState(hiScore, hiCoins);
    this.particles = {
      trail: [],
      mag: [],
      ceil: [],
      shieldShards: [],
      rareCoin: [],
      floatingTexts: [],
      deathParticles: [],
      breakerBurst: [],
      ghostBurst: [],
    };
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get isHolding(): boolean {
    return this._isHolding;
  }
  get holdAge(): number {
    return this._holdAge;
  }
  get bgOffset(): number {
    return this._bgOffset;
  }

  // ── Mutators ──────────────────────────────────────────────────────────────

  /** Called by input handlers (pointer/keyboard). */
  setHolding(holding: boolean): void {
    if (holding && !this._isHolding) this._holdAge = 0;
    this._isHolding = holding;
  }

  /**
   * Sync live upgrades / cosmetics from the store into the engine.
   * Called at the top of every animation frame so the engine always sees
   * the latest purchased upgrades without React prop drilling.
   */
  updateConfig(partial: Partial<EngineConfig>): void {
    Object.assign(this._config, partial);
  }

  /** Wipe game state back to initial values, preserving hi-scores. */
  reset(hiScore = 0, hiCoins = 0): void {
    Object.assign(this.state, makeInitialState(hiScore, hiCoins));
    this._isHolding = false;
    this._holdAge = 0;
    // Clear particle arrays in-place so any renderer holding a ref still works.
    this.particles.trail.length = 0;
    this.particles.mag.length = 0;
    this.particles.ceil.length = 0;
    this.particles.shieldShards.length = 0;
    this.particles.rareCoin.length = 0;
    this.particles.floatingTexts.length = 0;
    this.particles.deathParticles.length = 0;
    this.particles.breakerBurst.length = 0;
    this.particles.ghostBurst.length = 0;
  }

  /** Transition from "idle / menu" to active gameplay. */
  start(): void {
    this.state.started = true;
  }

  /** Clear trail particles when the player equips a new trail skin. */
  clearTrailParticles(): void {
    this.particles.trail.length = 0;
  }

  // ── Pause / resume ────────────────────────────────────────────────────────

  private _paused = false;

  get paused(): boolean {
    return this._paused;
  }

  /**
   * Freeze the simulation in-place.  The RAF loop keeps running so the
   * canvas continues to display the frozen frame; update() simply becomes
   * a no-op until resume() is called.
   */
  pause(): void {
    this._paused = true;
    // Release player input so gravity doesn't linger while paused.
    this._isHolding = false;
  }

  /** Unfreeze the simulation.  Caller must reset lastTimeRef to 0 so the
   * first resumed frame uses a safe dt (1/60) instead of the full time
   * the menu was open. */
  resume(): void {
    this._paused = false;
  }

  // ── Main update ───────────────────────────────────────────────────────────

  /**
   * Advance the simulation by one frame.
   *
   * @param dtFactor  Delta time normalised to 60 fps (i.e. `dt_seconds * 60`).
   *                  A value of 1.0 means exactly one 60 fps frame elapsed.
   *                  All per-frame constants in constants.ts were tuned at 60 fps,
   *                  so multiplying them by dtFactor keeps movement frame-rate
   *                  independent without touching any magic numbers.
   */
  update(dtFactor: number): void {
    // While paused the renderer still calls us every frame so the canvas
    // continues to show the frozen game state.  Do nothing except return.
    if (this._paused) return;

    const s = this.state;

    // Background scroll advances only during active, non-game-over play.
    if (s.started && !s.gameOver) {
      this._bgOffset += s.speed * dtFactor;
    }

    // Tick death animation even after game over so the renderer can animate.
    if (s.started && s.gameOver && s.deathAge > 0) {
      s.deathAge = Math.min(
        s.deathAge + dtFactor,
        DEATH_ANIM_DURATION * 3, // cap to prevent unbounded growth
      );
    }

    // Nothing else to update until the game is running.
    if (!s.started || s.gameOver) return;

    // ── Time & speed ──────────────────────────────────────────────────────
    s.frameCount += dtFactor;
    s.speed = INITIAL_SPEED + s.frameCount * SPEED_INCREMENT;

    // ── Player physics ────────────────────────────────────────────────────
    if (this._isHolding) {
      s.playerVY -= HOLD_GRAVITY * dtFactor;
    } else {
      s.playerVY += GRAVITY * dtFactor;
    }
    s.playerVY = Math.max(-MAX_VY, Math.min(MAX_VY, s.playerVY));
    s.playerY += s.playerVY * dtFactor;

    // Clamp to canvas bounds.
    if (s.playerY <= 0) {
      s.playerY = 0;
      s.playerVY = 0;
    }
    if (s.playerY + PLAYER_SIZE >= CANVAS_H) {
      s.playerY = CANVAS_H - PLAYER_SIZE;
      s.playerVY = 0;
    }

    // ── Obstacle spawning ─────────────────────────────────────────────────
    const lastObs = s.obstacles[s.obstacles.length - 1];
    const spacingClear =
      !lastObs || lastObs.x + lastObs.w < CANVAS_W - MIN_OBSTACLE_SPACING;
    if (s.frameCount - s.lastSpawn >= OBSTACLE_INTERVAL && spacingClear) {
      s.lastSpawn = s.frameCount;
      s.obstacles.push(spawnObstacle());
    }

    // ── Coin spawning ─────────────────────────────────────────────────────
    if (s.frameCount - s.lastCoinSpawn >= COIN_INTERVAL) {
      s.lastCoinSpawn = s.frameCount;
      const rareCoinChance = Math.min(
        RARE_COIN_CHANCE_MAX,
        RARE_COIN_CHANCE_MIN + s.frameCount * RARE_COIN_CHANCE_GROWTH,
      );
      const coin = spawnCoin(Math.random() < rareCoinChance);
      coin.y = findSafeSpawnY(
        coin.x,
        coin.radius,
        s.obstacles,
        COIN_RADIUS + 10,
        CANVAS_H - COIN_RADIUS * 2 - 10,
      );
      s.coins.push(coin);
    }

    // ── Lucky Charm bonus coins ───────────────────────────────────────────
    if (
      this._config.luckyCharmLevel > 0 &&
      s.frameCount - s.lastLuckySpawn >= LUCKY_COIN_CHECK_INTERVAL
    ) {
      s.lastLuckySpawn = s.frameCount;
      const chance = this._config.luckyCharmLevel * LUCKY_CHARM_BONUS_PER_LEVEL;
      if (Math.random() < chance) {
        const rareCoinChanceLucky = Math.min(
          RARE_COIN_CHANCE_MAX,
          RARE_COIN_CHANCE_MIN + s.frameCount * RARE_COIN_CHANCE_GROWTH,
        );
        const lc = spawnCoin(Math.random() < rareCoinChanceLucky);
        lc.y = findSafeSpawnY(
          lc.x,
          lc.radius,
          s.obstacles,
          COIN_RADIUS + 10,
          CANVAS_H - COIN_RADIUS * 2 - 10,
        );
        s.coins.push(lc);
      }
    }

    // ── Shield spawning (rare; maximum one on screen) ─────────────────────
    if (
      !s.shieldActive &&
      !s.shieldPickups.some((sp) => !sp.collected) &&
      s.frameCount >= s.nextShieldSpawn &&
      s.frameCount >= s.nextPowerUpAllowed
    ) {
      const surgeFactor = Math.max(
        0.4,
        1 -
          this._config.powerSurgeLevel *
            POWER_SURGE_INTERVAL_REDUCTION_PER_LEVEL,
      );
      s.nextShieldSpawn =
        s.frameCount +
        Math.floor(
          (SHIELD_INTERVAL_MIN +
            Math.random() * (SHIELD_INTERVAL_MAX - SHIELD_INTERVAL_MIN)) *
            surgeFactor,
        );
      s.nextPowerUpAllowed =
        s.frameCount +
        Math.floor(
          POWER_UP_GLOBAL_COOLDOWN_MIN +
            Math.random() *
              (POWER_UP_GLOBAL_COOLDOWN_MAX - POWER_UP_GLOBAL_COOLDOWN_MIN),
        );
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

    // ── Breaker spawning (very rare; maximum one on screen) ──────────────────
    if (
      !s.breakerActive &&
      !s.breakerPickups.some((bp) => !bp.collected) &&
      s.frameCount >= s.nextBreakerSpawn &&
      s.frameCount >= s.nextPowerUpAllowed
    ) {
      const surgeFactor = Math.max(
        0.4,
        1 -
          this._config.powerSurgeLevel *
            POWER_SURGE_INTERVAL_REDUCTION_PER_LEVEL,
      );
      s.nextBreakerSpawn =
        s.frameCount +
        Math.floor(
          (BREAKER_INTERVAL_MIN +
            Math.random() * (BREAKER_INTERVAL_MAX - BREAKER_INTERVAL_MIN)) *
            surgeFactor,
        );
      s.nextPowerUpAllowed =
        s.frameCount +
        Math.floor(
          POWER_UP_GLOBAL_COOLDOWN_MIN +
            Math.random() *
              (POWER_UP_GLOBAL_COOLDOWN_MAX - POWER_UP_GLOBAL_COOLDOWN_MIN),
        );
      const breaker = spawnBreaker();
      breaker.y = findSafeSpawnY(
        breaker.x,
        breaker.radius,
        s.obstacles,
        BREAKER_RADIUS + 14,
        CANVAS_H - BREAKER_RADIUS * 2 - 14,
      );
      s.breakerPickups.push(breaker);
    }

    // ── Invincibility spawning (rare; maximum one on screen, one held at a time) ──
    if (
      !s.invincibilityActive &&
      !s.invincibilityPickups.some((ip) => !ip.collected) &&
      s.frameCount >= s.nextInvincSpawn &&
      s.frameCount >= s.nextPowerUpAllowed
    ) {
      const surgeFactor = Math.max(
        0.4,
        1 -
          this._config.powerSurgeLevel *
            POWER_SURGE_INTERVAL_REDUCTION_PER_LEVEL,
      );
      s.nextInvincSpawn =
        s.frameCount +
        Math.floor(
          (INVINCIBILITY_INTERVAL_MIN +
            Math.random() *
              (INVINCIBILITY_INTERVAL_MAX - INVINCIBILITY_INTERVAL_MIN)) *
            surgeFactor,
        );
      s.nextPowerUpAllowed =
        s.frameCount +
        Math.floor(
          POWER_UP_GLOBAL_COOLDOWN_MIN +
            Math.random() *
              (POWER_UP_GLOBAL_COOLDOWN_MAX - POWER_UP_GLOBAL_COOLDOWN_MIN),
        );
      const invinc = spawnInvincibility();
      invinc.y = findSafeSpawnY(
        invinc.x,
        invinc.radius,
        s.obstacles,
        INVINCIBILITY_RADIUS + 14,
        CANVAS_H - INVINCIBILITY_RADIUS * 2 - 14,
      );
      s.invincibilityPickups.push(invinc);
    }

    // ── Scroll world left ─────────────────────────────────────────────────
    for (const obs of s.obstacles) obs.x -= s.speed * dtFactor;
    for (const coin of s.coins) coin.x -= s.speed * dtFactor;
    for (const sp of s.shieldPickups) sp.x -= s.speed * dtFactor;
    for (const bp of s.breakerPickups) bp.x -= s.speed * dtFactor;
    for (const ip of s.invincibilityPickups) ip.x -= s.speed * dtFactor;

    // ── Prune off-screen entities ─────────────────────────────────────────
    s.obstacles = s.obstacles.filter((o) => o.x > -o.w - 2 && !o.destroyed);
    s.coins = s.coins.filter((c) => !c.collected && c.x > -c.radius - 2);
    s.shieldPickups = s.shieldPickups.filter(
      (sp) => !sp.collected && sp.x > -sp.radius - 2,
    );
    s.breakerPickups = s.breakerPickups.filter(
      (bp) => !bp.collected && bp.x > -bp.radius - 2,
    );
    s.invincibilityPickups = s.invincibilityPickups.filter(
      (ip) => !ip.collected && ip.x > -ip.radius - 2,
    );

    // ── Score: count passed obstacles ─────────────────────────────────────
    for (const obs of s.obstacles) {
      if (!obs.passed && obs.x + obs.w < PLAYER_X) {
        obs.passed = true;
        s.score++;
      }
    }

    // ── Coin magnet attraction ────────────────────────────────────────────
    const pcx = PLAYER_X + PLAYER_SIZE / 2;
    const pcy = s.playerY + PLAYER_SIZE / 2;
    const magnetRadius = this._config.magnetLevel * MAGNET_RADIUS_PER_LEVEL;
    if (magnetRadius > 0) {
      for (const coin of s.coins) {
        if (coin.collected) continue;
        const mdx = pcx - coin.x;
        const mdy = pcy - coin.y;
        const distSq = mdx * mdx + mdy * mdy;
        if (distSq < magnetRadius * magnetRadius && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const nx = mdx / dist;
          const ny = mdy / dist;
          // Pull speed scales from 1.5× world-scroll at the radius edge up to
          // (1.5× + 8) near the player. The base of 1.5× scroll speed means
          // magnetised coins always travel faster than the scrolling world,
          // preventing coins from getting stuck trailing behind the player.
          const t = 1 - dist / magnetRadius; // 0 at edge → 1 at player centre
          const pullSpeed = (s.speed * 1.5 + 8 * t) * dtFactor;
          coin.x += nx * pullSpeed;
          coin.y += ny * pullSpeed;
        }
      }
    }

    // ── Coin collection (circle–AABB overlap) ────────────────────────────
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
          this._spawnRareCoinBurst(coin.x, coin.y);
          this._spawnFloatingText(
            PLAYER_X + PLAYER_SIZE / 2,
            s.playerY - 4,
            '+5',
          );
          this._cb.onRareCoinCollected();
        } else {
          this._cb.onCoinCollected();
        }
      }
    }

    // ── Shield pickup ─────────────────────────────────────────────────────
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
          this._cb.onShieldPickedUp();
        }
      }
    }

    // ── Breaker pickup ───────────────────────────────────────────────────
    if (!s.breakerActive) {
      for (const bp of s.breakerPickups) {
        if (bp.collected) continue;
        const bpNX = Math.max(pcx - half, Math.min(pcx + half, bp.x));
        const bpNY = Math.max(pcy - half, Math.min(pcy + half, bp.y));
        const bpDx = bp.x - bpNX;
        const bpDy = bp.y - bpNY;
        if (bpDx * bpDx + bpDy * bpDy < bp.radius * bp.radius) {
          bp.collected = true;
          s.breakerActive = true;
          this._cb.onBreakerPickedUp();
        }
      }
    }

    // ── Invincibility pickup (can be held alongside Shield or Breaker) ───
    if (!s.invincibilityActive) {
      for (const ip of s.invincibilityPickups) {
        if (ip.collected) continue;
        const ipNX = Math.max(pcx - half, Math.min(pcx + half, ip.x));
        const ipNY = Math.max(pcy - half, Math.min(pcy + half, ip.y));
        const ipDx = ip.x - ipNX;
        const ipDy = ip.y - ipNY;
        if (ipDx * ipDx + ipDy * ipDy < ip.radius * ip.radius) {
          ip.collected = true;
          s.invincibilityActive = true;
          s.invincibilityTimer = INVINCIBILITY_DURATION;
          this._spawnGhostBurst(pcx, pcy);
          this._spawnFloatingText(
            PLAYER_X + PLAYER_SIZE / 2,
            s.playerY - 4,
            'GHOST!',
          );
          this._cb.onInvincibilityPickedUp();
        }
      }
    }

    // ── Invincibility timer countdown ─────────────────────────────────────
    if (s.invincibilityActive) {
      s.invincibilityTimer = Math.max(0, s.invincibilityTimer - dtFactor);
      if (s.invincibilityTimer <= 0) {
        s.invincibilityActive = false;
        this.invincibilityJustEnded = true;
      }
    }

    // ── Collision detection (per-slab AABB, 4 px inset) ──────────────────
    const px1 = PLAYER_X + 4;
    const px2 = PLAYER_X + PLAYER_SIZE - 4;
    const py1 = s.playerY + 4;
    const py2 = s.playerY + PLAYER_SIZE - 4;

    // Invincibility = full ghost mode: pass through all obstacles harmlessly.
    if (!s.invincibilityActive) {
      collisionLoop: for (const obs of s.obstacles) {
        if (obs.destroyed) continue;
        if (px2 > obs.x && px1 < obs.x + obs.w) {
          for (const slab of obs.slabs) {
            if (py2 > slab.y && py1 < slab.y + slab.h) {
              if (s.shieldActive && s.breakerActive) {
                // Both active: Shield is consumed first; Breaker stays for the next hit.
                s.shieldActive = false;
                s.bounceAge = SHIELD_BOUNCE_DURATION;
                const slabMidY = slab.y + slab.h / 2;
                s.playerVY =
                  pcy < slabMidY ? -SHIELD_BOUNCE_VY : SHIELD_BOUNCE_VY;
                for (const o of s.obstacles) o.x += SHIELD_BOUNCE_PUSHBACK;
                for (const c of s.coins) c.x += SHIELD_BOUNCE_PUSHBACK;
                for (const shp of s.shieldPickups)
                  shp.x += SHIELD_BOUNCE_PUSHBACK;
                for (const bp of s.breakerPickups)
                  bp.x += SHIELD_BOUNCE_PUSHBACK;
                this._bgOffset = Math.max(
                  0,
                  this._bgOffset - SHIELD_BOUNCE_PUSHBACK,
                );
                this._spawnShieldShards(pcx, pcy);
                this._cb.onShieldBroken();
              } else if (s.breakerActive) {
                // Only Breaker active: destroy the obstacle and consume it.
                obs.destroyed = true;
                s.breakerActive = false;
                this._spawnBreakerBurst(
                  obs.x + obs.w / 2,
                  s.playerY + PLAYER_SIZE / 2,
                );
                this._spawnFloatingText(
                  PLAYER_X + PLAYER_SIZE / 2,
                  s.playerY - 4,
                  'BREAK!',
                );
                s.breakerFlashAge = BREAKER_FLASH_DURATION;
                this._cb.onBreakerUsed();
              } else if (s.shieldActive) {
                // Only Shield active: absorb the hit, bounce player away.
                s.shieldActive = false;
                s.bounceAge = SHIELD_BOUNCE_DURATION;
                const slabMidY = slab.y + slab.h / 2;
                s.playerVY =
                  pcy < slabMidY ? -SHIELD_BOUNCE_VY : SHIELD_BOUNCE_VY;
                for (const o of s.obstacles) o.x += SHIELD_BOUNCE_PUSHBACK;
                for (const c of s.coins) c.x += SHIELD_BOUNCE_PUSHBACK;
                for (const shp of s.shieldPickups)
                  shp.x += SHIELD_BOUNCE_PUSHBACK;
                for (const bp of s.breakerPickups)
                  bp.x += SHIELD_BOUNCE_PUSHBACK;
                this._bgOffset = Math.max(
                  0,
                  this._bgOffset - SHIELD_BOUNCE_PUSHBACK,
                );
                this._spawnShieldShards(pcx, pcy);
                this._cb.onShieldBroken();
              } else {
                s.gameOver = true;
                s.deathAge = 0.01; // kick off death animation
                if (s.score > s.hiScore) s.hiScore = s.score;
                this._spawnDeathParticles(pcx, pcy);
              }
              break collisionLoop;
            }
          }
        }
      } // closes collisionLoop for
    } // end if (!s.invincibilityActive)

    // ── Bounce-flash / Breaker-flash countdown ────────────────────────────
    if (s.bounceAge > 0) s.bounceAge = Math.max(0, s.bounceAge - dtFactor);
    if (s.breakerFlashAge > 0)
      s.breakerFlashAge = Math.max(0, s.breakerFlashAge - dtFactor);

    // ── Trail particle emission ───────────────────────────────────────────
    const newTrail = emitTrailParticles(
      this._config.activeTrail,
      PLAYER_X,
      s.playerY + PLAYER_SIZE / 2,
      s.speed,
      s.frameCount,
    );
    for (const pt of newTrail) {
      if (this.particles.trail.length < MAX_TRAIL_PARTICLES)
        this.particles.trail.push(pt);
    }

    // ── Magnetic hold particle emission ───────────────────────────────────
    if (this._isHolding) {
      this._holdAge += dtFactor;

      const newMag = emitMagParticles(PLAYER_X + PLAYER_SIZE / 2, s.playerY);
      for (const pt of newMag) {
        if (this.particles.mag.length < MAX_MAG_PARTICLES)
          this.particles.mag.push(pt);
      }

      const newCeil = emitCeilParticles();
      for (const pt of newCeil) {
        if (this.particles.ceil.length < MAX_CEIL_PARTICLES)
          this.particles.ceil.push(pt);
      }
    }
  }

  // ── Private particle helpers ──────────────────────────────────────────────

  private _spawnRareCoinBurst(cx: number, cy: number): void {
    const p = this.particles.rareCoin;
    for (let i = 0; i < 24; i++) {
      if (p.length >= MAX_RARE_COIN_PARTICLES) break;
      const ang = (i / 24) * Math.PI * 2 + Math.random() * 0.26;
      const spd = 2.5 + Math.random() * 5.0;
      p.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        age: 0,
        maxAge: 28 + Math.random() * 22,
        size: 2 + Math.random() * 3.5,
        hue: 270 + Math.random() * 60,
      });
    }
  }

  private _spawnFloatingText(x: number, y: number, text: string): void {
    if (this.particles.floatingTexts.length < MAX_FLOATING_TEXTS) {
      this.particles.floatingTexts.push({ x, y, text, age: 0, maxAge: 55 });
    }
  }

  private _spawnShieldShards(bpx: number, bpy: number): void {
    const p = this.particles.shieldShards;
    for (let i = 0; i < 28; i++) {
      if (p.length >= MAX_SHIELD_SHARDS) break;
      const ang = Math.random() * Math.PI * 2;
      const spd = 2.5 + Math.random() * 5.5;
      p.push({
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
  }

  private _spawnBreakerBurst(cx: number, cy: number): void {
    const p = this.particles.breakerBurst;
    for (let i = 0; i < 36; i++) {
      if (p.length >= MAX_BREAKER_PARTICLES) break;
      const ang = (i / 36) * Math.PI * 2 + Math.random() * 0.18;
      const spd = 3.5 + Math.random() * 7.5;
      p.push({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy + (Math.random() - 0.5) * 30,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        age: 0,
        maxAge: 24 + Math.random() * 22,
        size: 2.5 + Math.random() * 5.5,
        hue: 15 + Math.random() * 35,
      });
    }
  }

  private _spawnDeathParticles(cx: number, cy: number): void {
    const p = this.particles.deathParticles;
    for (let i = 0; i < 22; i++) {
      if (p.length >= MAX_DEATH_PARTICLES) break;
      const ang = (i / 22) * Math.PI * 2 + Math.random() * 0.3;
      const spd = 1.5 + Math.random() * 4.5;
      p.push({
        x: cx + (Math.random() - 0.5) * PLAYER_SIZE * 0.5,
        y: cy + (Math.random() - 0.5) * PLAYER_SIZE * 0.5,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        age: 0,
        maxAge: 18 + Math.random() * 16,
        size: 2 + Math.random() * 4,
        // 60% red (0–20 hue), 40% orange (20–40 hue)
        hue: Math.random() < 0.6 ? Math.random() * 20 : 20 + Math.random() * 20,
      });
    }
  }

  private _spawnGhostBurst(cx: number, cy: number): void {
    const p = this.particles.ghostBurst;
    for (let i = 0; i < 32; i++) {
      const ang = (i / 32) * Math.PI * 2 + Math.random() * 0.2;
      const spd = 2.0 + Math.random() * 5.5;
      p.push({
        x: cx + (Math.random() - 0.5) * PLAYER_SIZE,
        y: cy + (Math.random() - 0.5) * PLAYER_SIZE,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        age: 0,
        maxAge: 28 + Math.random() * 22,
        size: 2 + Math.random() * 4,
        hue: 180 + Math.random() * 60, // cyan to blue
      });
    }
  }
}
