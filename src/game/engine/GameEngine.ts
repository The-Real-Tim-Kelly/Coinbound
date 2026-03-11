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
  MAX_TRAIL_PARTICLES,
  MAX_MAG_PARTICLES,
  MAX_CEIL_PARTICLES,
  MAX_SHIELD_SHARDS,
  MAX_RARE_COIN_PARTICLES,
  MAX_FLOATING_TEXTS,
} from '../constants';
import { makeInitialState } from '../logic/gameState';
import { spawnObstacle } from '../logic/obstacles';
import { spawnCoin, spawnShield, findSafeSpawnY } from '../logic/coins';
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
} from '../types';

// ─── Public interfaces ────────────────────────────────────────────────────────

/** Live configuration the engine reads on each frame from the store. */
export interface EngineConfig {
  magnetLevel: number;
  luckyCharmLevel: number;
  activeTrail: string;
}

/**
 * Callbacks fired by the engine when audio-worthy events occur.
 * The game component wires these to the audio subsystem.
 */
export interface EngineCallbacks {
  onRareCoinCollected: () => void;
  onShieldPickedUp: () => void;
  onShieldBroken: () => void;
}

/** All live particle arrays, kept together for tidy access from the renderer. */
export interface ParticleState {
  trail: TrailParticle[];
  mag: MagParticle[];
  ceil: CeilParticle[];
  shieldShards: ShieldShard[];
  rareCoin: RareCoinParticle[];
  floatingTexts: FloatingText[];
}

// ─── GameEngine ───────────────────────────────────────────────────────────────

export class GameEngine {
  // ── Public state (read-only references, mutated in-place each frame) ─────
  readonly state: GameState;
  readonly particles: ParticleState;

  // ── Input ─────────────────────────────────────────────────────────────────
  private _isHolding = false;
  private _holdAge = 0;

  // ── Scroll offset (background + parallax) ─────────────────────────────────
  private _bgOffset = 0;

  // ── Wired-in config and callbacks ─────────────────────────────────────────
  private _config: EngineConfig;
  private readonly _cb: EngineCallbacks;

  constructor(config: EngineConfig, callbacks: EngineCallbacks) {
    this._config = { ...config };
    this._cb = callbacks;
    this.state = makeInitialState();
    this.particles = {
      trail: [],
      mag: [],
      ceil: [],
      shieldShards: [],
      rareCoin: [],
      floatingTexts: [],
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
  }

  /** Transition from "idle / menu" to active gameplay. */
  start(): void {
    this.state.started = true;
  }

  /** Clear trail particles when the player equips a new trail skin. */
  clearTrailParticles(): void {
    this.particles.trail.length = 0;
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
    const s = this.state;

    // Background scroll advances only during active, non-game-over play.
    if (s.started && !s.gameOver) {
      this._bgOffset += s.speed * dtFactor;
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

    // ── Lucky Charm bonus coins ───────────────────────────────────────────
    if (
      this._config.luckyCharmLevel > 0 &&
      s.frameCount - s.lastLuckySpawn >= LUCKY_COIN_CHECK_INTERVAL
    ) {
      s.lastLuckySpawn = s.frameCount;
      const chance = this._config.luckyCharmLevel * LUCKY_CHARM_BONUS_PER_LEVEL;
      if (Math.random() < chance) {
        const lc = spawnCoin(Math.random() < RARE_COIN_CHANCE);
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

    // ── Scroll world left ─────────────────────────────────────────────────
    for (const obs of s.obstacles) obs.x -= s.speed * dtFactor;
    for (const coin of s.coins) coin.x -= s.speed * dtFactor;
    for (const sp of s.shieldPickups) sp.x -= s.speed * dtFactor;

    // ── Prune off-screen entities ─────────────────────────────────────────
    s.obstacles = s.obstacles.filter((o) => o.x > -o.w - 2);
    s.coins = s.coins.filter((c) => !c.collected && c.x > -c.radius - 2);
    s.shieldPickups = s.shieldPickups.filter(
      (sp) => !sp.collected && sp.x > -sp.radius - 2,
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
          const strength = 0.15 * dtFactor * (1 - dist / magnetRadius);
          coin.x += mdx * strength;
          coin.y += mdy * strength;
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

    // ── Collision detection (per-slab AABB, 4 px inset) ──────────────────
    const px1 = PLAYER_X + 4;
    const px2 = PLAYER_X + PLAYER_SIZE - 4;
    const py1 = s.playerY + 4;
    const py2 = s.playerY + PLAYER_SIZE - 4;

    collisionLoop: for (const obs of s.obstacles) {
      if (px2 > obs.x && px1 < obs.x + obs.w) {
        for (const slab of obs.slabs) {
          if (py2 > slab.y && py1 < slab.y + slab.h) {
            if (s.shieldActive) {
              // Shield absorbs the hit: bounce player away and push world back.
              s.shieldActive = false;
              s.bounceAge = SHIELD_BOUNCE_DURATION;
              const slabMidY = slab.y + slab.h / 2;
              s.playerVY =
                pcy < slabMidY ? -SHIELD_BOUNCE_VY : SHIELD_BOUNCE_VY;
              for (const o of s.obstacles) o.x += SHIELD_BOUNCE_PUSHBACK;
              for (const c of s.coins) c.x += SHIELD_BOUNCE_PUSHBACK;
              for (const shp of s.shieldPickups)
                shp.x += SHIELD_BOUNCE_PUSHBACK;
              this._bgOffset = Math.max(
                0,
                this._bgOffset - SHIELD_BOUNCE_PUSHBACK,
              );
              this._spawnShieldShards(pcx, pcy);
              this._cb.onShieldBroken();
            } else {
              s.gameOver = true;
              if (s.score > s.hiScore) s.hiScore = s.score;
            }
            break collisionLoop;
          }
        }
      }
    }

    // ── Bounce-flash countdown ────────────────────────────────────────────
    if (s.bounceAge > 0) s.bounceAge = Math.max(0, s.bounceAge - dtFactor);

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
}
