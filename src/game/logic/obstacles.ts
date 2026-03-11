import {
  CANVAS_W,
  CANVAS_H,
  GAP_MIN,
  GAP_NORMAL_MIN,
  GAP_NORMAL_MAX,
  GAP_NARROW_MIN,
  GAP_NARROW_MAX,
  GAP_NARROW_CHANCE,
  MIN_SLAB_H,
} from '../constants';
import type {
  Obstacle,
  ObstacleKind,
  ObstacleLayout,
  ObstacleSlab,
} from '../types';

export const OBSTACLE_PALETTE: Record<ObstacleKind, string[]> = {
  block: ['#c0392b', '#e74c3c', '#8e44ad'],
  bar: ['#d35400', '#e67e22', '#f39c12'],
  spike: ['#16a085', '#1abc9c', '#2980b9'],
  diamond: ['#8e44ad', '#9b59b6', '#2471a3'],
};

export function pickGapHeight(): number {
  const narrow = Math.random() < GAP_NARROW_CHANCE;
  if (narrow) {
    return GAP_NARROW_MIN + Math.random() * (GAP_NARROW_MAX - GAP_NARROW_MIN);
  }
  return GAP_NORMAL_MIN + Math.random() * (GAP_NORMAL_MAX - GAP_NORMAL_MIN);
}

export function spawnObstacle(): Obstacle {
  const kinds: ObstacleKind[] = ['block', 'bar', 'spike', 'diamond'];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const palette = OBSTACLE_PALETTE[kind];
  const color = palette[Math.floor(Math.random() * palette.length)];

  let w: number;
  switch (kind) {
    case 'bar':
      w = 84 + Math.random() * 96;
      break;
    case 'spike':
      w = 48 + Math.random() * 48;
      break;
    case 'diamond':
      w = 56 + Math.random() * 44;
      break;
    default:
      w = 48 + Math.random() * 52;
      break; // block
  }

  // Layout: 30 % top, 30 % bottom, 40 % double
  const layoutRoll = Math.random();
  const layout: ObstacleLayout =
    layoutRoll < 0.3 ? 'top' : layoutRoll < 0.6 ? 'bottom' : 'double';

  const gapH = Math.max(GAP_MIN, pickGapHeight());
  let gapY: number;
  let slabs: ObstacleSlab[];

  if (layout === 'top') {
    const topH = CANVAS_H - gapH;
    gapY = topH;
    slabs = [{ y: 0, h: topH }];
  } else if (layout === 'bottom') {
    const botH = CANVAS_H - gapH;
    gapY = 0;
    slabs = [{ y: gapH, h: botH }];
  } else {
    const minGapY = MIN_SLAB_H;
    const maxGapY = Math.max(minGapY, CANVAS_H - MIN_SLAB_H - gapH);
    gapY = minGapY + Math.random() * (maxGapY - minGapY);
    slabs = [
      { y: 0, h: gapY },
      { y: gapY + gapH, h: CANVAS_H - gapY - gapH },
    ];
  }

  return {
    kind,
    layout,
    x: CANVAS_W + w,
    w,
    slabs,
    gapY,
    gapH,
    color,
    passed: false,
  };
}
