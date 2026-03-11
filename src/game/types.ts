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

// ─── Game state ───────────────────────────────────────────────────────────────
export interface GameState {
  playerY: number;
  playerVY: number;
  obstacles: Obstacle[];
  coins: Coin[];
  shieldPickups: Shield[];
  coinCount: number;
  hiCoins: number;
  score: number;
  hiScore: number;
  gameOver: boolean;
  started: boolean;
  shieldActive: boolean;
  bounceAge: number; // countdown for bounce animation frames
  speed: number;
  frameCount: number;
  lastSpawn: number;
  lastCoinSpawn: number;
  lastShieldSpawn: number;
  lastLuckySpawn: number;
}
