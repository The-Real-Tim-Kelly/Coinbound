import {
  CANVAS_W,
  CANVAS_H,
  COIN_RADIUS,
  SHIELD_RADIUS,
  BREAKER_RADIUS,
  INVINCIBILITY_RADIUS,
  SPAWN_SAFE_MARGIN,
  MAX_SPAWN_ATTEMPTS,
} from '../constants';
import type { Coin, Shield, Breaker, Invincibility, Obstacle } from '../types';

// Returns true when a circular item at (x, y) with the given clearance
// is too close to any obstacle slab.
export function isPositionBlockedByObstacles(
  x: number,
  y: number,
  clearance: number,
  obstacles: Obstacle[],
): boolean {
  const c2 = clearance * clearance;
  for (const obs of obstacles) {
    const nearX = Math.max(obs.x, Math.min(obs.x + obs.w, x));
    for (const slab of obs.slabs) {
      const nearY = Math.max(slab.y, Math.min(slab.y + slab.h, y));
      const dx = x - nearX;
      const dy = y - nearY;
      if (dx * dx + dy * dy < c2) return true;
    }
  }
  return false;
}

// Finds a vertical spawn position not blocked by any obstacle, retrying up to
// MAX_SPAWN_ATTEMPTS times. Returns the last candidate if no clear spot found.
export function findSafeSpawnY(
  x: number,
  radius: number,
  obstacles: Obstacle[],
  yMin: number,
  yMax: number,
): number {
  const clearance = radius + SPAWN_SAFE_MARGIN;
  let y = yMin + Math.random() * (yMax - yMin);
  for (let i = 1; i < MAX_SPAWN_ATTEMPTS; i++) {
    if (!isPositionBlockedByObstacles(x, y, clearance, obstacles)) break;
    y = yMin + Math.random() * (yMax - yMin);
  }
  return y;
}

export function spawnCoin(rare = false): Coin {
  return {
    x: CANVAS_W + COIN_RADIUS,
    y: COIN_RADIUS + 10 + Math.random() * (CANVAS_H - COIN_RADIUS * 2 - 20),
    radius: COIN_RADIUS,
    collected: false,
    bobOffset: Math.random() * Math.PI * 2,
    isRare: rare,
  };
}

export function spawnShield(): Shield {
  return {
    x: CANVAS_W + SHIELD_RADIUS,
    y: SHIELD_RADIUS + 14 + Math.random() * (CANVAS_H - SHIELD_RADIUS * 2 - 28),
    radius: SHIELD_RADIUS,
    collected: false,
    bobOffset: Math.random() * Math.PI * 2,
  };
}

export function spawnBreaker(): Breaker {
  return {
    x: CANVAS_W + BREAKER_RADIUS,
    y:
      BREAKER_RADIUS +
      14 +
      Math.random() * (CANVAS_H - BREAKER_RADIUS * 2 - 28),
    radius: BREAKER_RADIUS,
    collected: false,
    bobOffset: Math.random() * Math.PI * 2,
  };
}

export function spawnInvincibility(): Invincibility {
  return {
    x: CANVAS_W + INVINCIBILITY_RADIUS,
    y:
      INVINCIBILITY_RADIUS +
      14 +
      Math.random() * (CANVAS_H - INVINCIBILITY_RADIUS * 2 - 28),
    radius: INVINCIBILITY_RADIUS,
    collected: false,
    bobOffset: Math.random() * Math.PI * 2,
  };
}
