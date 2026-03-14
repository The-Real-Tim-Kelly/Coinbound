import type { Obstacle } from '../types';

// Draw stalactite/stalagmite spike teeth on the gap-facing edge of a slab.
function drawSlabSpikes(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  slabY: number,
  slabH: number,
  isCeiling: boolean,
  color: string,
): void {
  const spikeH = Math.min(28, slabH * 0.45);
  const count = Math.max(2, Math.floor(w / 18));
  const tw = w / count;
  ctx.fillStyle = color;
  if (isCeiling) {
    ctx.fillRect(x, slabY, w, slabH - spikeH);
    ctx.beginPath();
    ctx.moveTo(x, slabY + slabH - spikeH);
    for (let i = 0; i < count; i++) {
      ctx.lineTo(x + (i + 0.5) * tw, slabY + slabH);
      ctx.lineTo(x + (i + 1) * tw, slabY + slabH - spikeH);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(x, slabY + spikeH, w, slabH - spikeH);
    ctx.beginPath();
    ctx.moveTo(x, slabY + spikeH);
    for (let i = 0; i < count; i++) {
      ctx.lineTo(x + (i + 0.5) * tw, slabY);
      ctx.lineTo(x + (i + 1) * tw, slabY + spikeH);
    }
    ctx.closePath();
    ctx.fill();
  }
}

export function drawObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: Obstacle[],
): void {
  for (const obs of obstacles) {
    if (obs.destroyed) continue;
    ctx.save();
    ctx.shadowColor = obs.color;
    ctx.shadowBlur = 10;

    for (const slab of obs.slabs) {
      const isCeiling = slab.y === 0;
      const edgeY = isCeiling ? slab.y + slab.h : slab.y;

      if (obs.kind === 'spike') {
        drawSlabSpikes(ctx, obs.x, obs.w, slab.y, slab.h, isCeiling, obs.color);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        if (isCeiling) {
          ctx.fillRect(obs.x, slab.y, obs.w, 3);
        } else {
          ctx.fillRect(obs.x, slab.y + slab.h - 3, obs.w, 3);
        }
      } else if (obs.kind === 'bar') {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, slab.y, obs.w, slab.h);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        for (let sy = slab.y + 6; sy < slab.y + slab.h - 4; sy += 14) {
          ctx.fillRect(obs.x + 4, sy, obs.w - 8, 4);
        }
        ctx.fillStyle = 'rgba(255,100,60,0.70)';
        ctx.fillRect(obs.x, edgeY - (isCeiling ? 4 : 0), obs.w, 4);
      } else if (obs.kind === 'diamond') {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, slab.y, obs.w, slab.h);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        const ds = 22;
        ctx.save();
        ctx.beginPath();
        ctx.rect(obs.x, slab.y, obs.w, slab.h);
        ctx.clip();
        // Batch all diamond shapes into one path: 1 fill() instead of N.
        ctx.beginPath();
        for (let dy = slab.y - ds; dy < slab.y + slab.h + ds; dy += ds) {
          for (let dx = obs.x - ds; dx < obs.x + obs.w + ds; dx += ds) {
            ctx.moveTo(dx + ds / 2, dy);
            ctx.lineTo(dx + ds, dy + ds / 2);
            ctx.lineTo(dx + ds / 2, dy + ds);
            ctx.lineTo(dx, dy + ds / 2);
            ctx.closePath();
          }
        }
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(255,100,60,0.70)';
        ctx.fillRect(obs.x, edgeY - (isCeiling ? 4 : 0), obs.w, 4);
      } else {
        // block (default)
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, slab.y, obs.w, slab.h);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(obs.x, slab.y, 4, slab.h);
        ctx.fillStyle = 'rgba(255,80,80,0.60)';
        ctx.fillRect(obs.x, edgeY - (isCeiling ? 4 : 0), obs.w, 4);
      }
    }

    // Gap guide lines at top and bottom of the safe gap
    ctx.strokeStyle = `${obs.color}55`;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(obs.x, obs.gapY);
    ctx.lineTo(obs.x + obs.w, obs.gapY);
    ctx.moveTo(obs.x, obs.gapY + obs.gapH);
    ctx.lineTo(obs.x + obs.w, obs.gapY + obs.gapH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }
}
