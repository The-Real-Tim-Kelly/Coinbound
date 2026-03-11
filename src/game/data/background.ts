import { CANVAS_W, CANVAS_H } from '../constants';

// Static star field — positions are deterministic so no jitter on re-renders.
export const BG_STARS = Array.from({ length: 80 }, (_, i) => ({
  x: ((i * 137 + 50) % (CANVAS_W - 4)) + 2,
  y: ((i * 97 + 30) % (CANVAS_H - 4)) + 2,
  r: i % 5 === 0 ? 1.5 : i % 3 === 0 ? 1.0 : 0.5,
  a: 0.35 + (i % 5) * 0.12,
}));

// Horizontal motion streaks that scroll left to sell forward motion.
export const SPEED_LINES = Array.from({ length: 28 }, (_, i) => ({
  y: ((i * 89 + 15) % (CANVAS_H - 20)) + 10,
  baseLen: 22 + ((i * 47) % 72),
  speedMult: 0.55 + (i % 6) * 0.13,
  alpha: 0.032 + (i % 5) * 0.016,
  phase: (i * 137) % CANVAS_W,
}));
