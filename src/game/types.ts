// ─── CosmeticType ─────────────────────────────────────────────────────────────
// Cosmetics only change visuals — hitbox stays a 34×34 AABB regardless of shape.
export const CosmeticType = {
  Square: 'square',
  Circle: 'circle',
  Airplane: 'airplane',
  Spaceship: 'spaceship',
  Ufo: 'ufo',
} as const;
export type CosmeticType = (typeof CosmeticType)[keyof typeof CosmeticType];

// ─── Cosmetic data interfaces ─────────────────────────────────────────────────
export interface PlayerSkin {
  id: string;
  name: string;
  icon: string;
  cost: number;
  color1: string;
  color2: string;
  glow: string;
  dirColor: string;
}

export interface TrailDef {
  id: string;
  name: string;
  icon: string;
  cost: number;
}

export interface BgTheme {
  id: string;
  name: string;
  icon: string;
  cost: number;
  bg: string;
  lineColor: string;
}

export interface CosmeticShape {
  id: string;
  name: string;
  icon: string;
  cost: number;
}

// ─── Particle interfaces ──────────────────────────────────────────────────────
export interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  size: number;
  hue: number;
  color: string;
}

export interface MagParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  size: number;
}

export interface CeilParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  size: number;
}

export interface ShieldShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  size: number;
  hue: number; // 200–260 blue-purple spectrum
}

export interface RareCoinParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  size: number;
  hue: number; // 270–330 purple/magenta range
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  age: number;
  maxAge: number;
}

export interface DeathParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  size: number;
  hue: number; // 0–40: red/orange spectrum
}

export interface BreakerParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  size: number;
  hue: number; // 10–50 orange/yellow fire
}

export interface GhostParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  size: number;
  hue: number; // 180–240 cyan/blue ethereal
}

// ─── Obstacle types ───────────────────────────────────────────────────────────
export type ObstacleKind = 'block' | 'bar' | 'spike' | 'diamond';

// top – wall from ceiling, gap at bottom
// bottom – wall from floor, gap at top
// double – walls on both edges, gap in the middle
export type ObstacleLayout = 'top' | 'bottom' | 'double';

export interface ObstacleSlab {
  y: number; // top edge in canvas space
  h: number; // height
}

export interface Obstacle {
  kind: ObstacleKind;
  layout: ObstacleLayout;
  x: number;
  w: number;
  slabs: ObstacleSlab[];
  gapY: number; // canvas-y of the top of the passable gap
  gapH: number; // height of the passable gap
  color: string;
  passed: boolean;
  destroyed?: boolean; // set true when Breaker power-up destroys this obstacle
}

// ─── Coin ─────────────────────────────────────────────────────────────────────
export interface Coin {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  bobOffset: number; // phase for vertical bob animation
  isRare: boolean; // true → Rare Coin (5× value, distinct visuals)
}

// ─── Shield pickup ────────────────────────────────────────────────────────────
export interface Shield {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  bobOffset: number;
}

// ─── Breaker pickup ───────────────────────────────────────────────────────────
export interface Breaker {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  bobOffset: number;
}
// ─── Invincibility pickup ───────────────────────────────────────────────
export interface Invincibility {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  bobOffset: number;
}
// ─── Game state ───────────────────────────────────────────────────────────────
export interface GameState {
  playerY: number;
  playerVY: number;
  obstacles: Obstacle[];
  coins: Coin[];
  shieldPickups: Shield[];
  breakerPickups: Breaker[];
  invincibilityPickups: Invincibility[];
  coinCount: number;
  hiCoins: number;
  score: number;
  hiScore: number;
  gameOver: boolean;
  started: boolean;
  shieldActive: boolean;
  breakerActive: boolean;
  invincibilityActive: boolean;
  invincibilityTimer: number; // frames remaining; 0 = inactive
  bounceAge: number; // countdown for bounce animation frames
  breakerFlashAge: number; // countdown frames for orange flash on obstacle break
  deathAge: number; // frames since death (0 = alive, >0 = dying)
  speed: number;
  frameCount: number;
  lastSpawn: number;
  lastCoinSpawn: number;
  lastLuckySpawn: number;
  nextShieldSpawn: number; // frame at which shield is next eligible to spawn
  nextBreakerSpawn: number; // frame at which breaker is next eligible to spawn
  nextInvincSpawn: number; // frame at which invincibility is next eligible to spawn
  nextPowerUpAllowed: number; // global cooldown gate: no power-up may spawn before this frame
}
