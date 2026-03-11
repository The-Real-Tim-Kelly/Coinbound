import { CANVAS_W, PLAYER_SIZE } from '../constants';
import type { TrailParticle, MagParticle, CeilParticle } from '../types';

// ─── Trail particles ──────────────────────────────────────────────────────────
export function emitTrailParticles(
  trail: string,
  playerLeftX: number,
  playerCenterY: number,
  speed: number,
  frameCount: number,
): TrailParticle[] {
  if (trail === 'none') return [];
  const tpx = playerLeftX;
  const tpy = playerCenterY;
  const pts: TrailParticle[] = [];

  if (trail === 'sparks') {
    for (let i = 0; i < 2; i++) {
      pts.push({
        x: tpx + Math.random() * 8,
        y: tpy + (Math.random() - 0.5) * PLAYER_SIZE * 0.7,
        vx: -(speed + 0.5 + Math.random() * 2),
        vy: (Math.random() - 0.5) * 1.5,
        age: 0,
        maxAge: 18 + Math.random() * 12,
        size: 2 + Math.random() * 3,
        hue: 0,
        color: `hsl(${20 + Math.random() * 30},100%,${55 + Math.random() * 25}%)`,
      });
    }
  } else if (trail === 'stars') {
    pts.push({
      x: tpx + Math.random() * 10,
      y: tpy + (Math.random() - 0.5) * PLAYER_SIZE * 0.6,
      vx: -(speed * 0.5 + 0.4 + Math.random() * 1.0),
      vy: (Math.random() - 0.5) * 0.5,
      age: 0,
      maxAge: 30 + Math.random() * 20,
      size: 3 + Math.random() * 3,
      hue: 0,
      color: `hsl(${50 + Math.random() * 20},100%,80%)`,
    });
  } else if (trail === 'ghost') {
    pts.push({
      x: tpx + Math.random() * 10,
      y: tpy + (Math.random() - 0.5) * PLAYER_SIZE * 0.7,
      vx: -(speed * 0.35 + 0.2 + Math.random() * 0.6),
      vy: (Math.random() - 0.5) * 0.3,
      age: 0,
      maxAge: 40 + Math.random() * 20,
      size: 7 + Math.random() * 8,
      hue: 0,
      color: '',
    });
  } else if (trail === 'rainbow') {
    pts.push({
      x: tpx + Math.random() * 8,
      y: tpy + (Math.random() - 0.5) * PLAYER_SIZE * 0.6,
      vx: -(speed * 0.45 + 0.4 + Math.random() * 1.2),
      vy: (Math.random() - 0.5) * 0.8,
      age: 0,
      maxAge: 25 + Math.random() * 15,
      size: 4 + Math.random() * 4,
      hue: (frameCount * 6 + Math.random() * 40) % 360,
      color: '',
    });
  }

  return pts;
}

// ─── Magnetic hold particles ──────────────────────────────────────────────────
export function emitMagParticles(
  playerCenterX: number,
  playerTopY: number,
): MagParticle[] {
  const pts: MagParticle[] = [];
  for (let i = 0; i < 2; i++) {
    pts.push({
      x: playerCenterX + (Math.random() - 0.5) * PLAYER_SIZE * 0.75,
      y: playerTopY + Math.random() * 4,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -(2.0 + Math.random() * 3.0),
      age: 0,
      maxAge: 22 + Math.random() * 18,
      size: 2 + Math.random() * 3,
    });
  }
  return pts;
}

// ─── Ceiling energy spark particles ──────────────────────────────────────────
export function emitCeilParticles(): CeilParticle[] {
  const pts: CeilParticle[] = [];
  const count = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    pts.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * 4,
      vx: (Math.random() - 0.5) * 2.5,
      vy: 0.8 + Math.random() * 2.5,
      age: 0,
      maxAge: 12 + Math.random() * 14,
      size: 1 + Math.random() * 2.2,
    });
  }
  return pts;
}
