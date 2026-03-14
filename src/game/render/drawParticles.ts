import type {
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

export function updateAndDrawTrailParticles(
  ctx: CanvasRenderingContext2D,
  particles: TrailParticle[],
  activeTrail: string,
  dtFactor: number,
): TrailParticle[] {
  const kept: TrailParticle[] = [];
  if (particles.length === 0) return kept;
  // Hoist ctx.save/restore outside loop; set constant shadow state once per batch.
  ctx.save();
  if (activeTrail === 'ghost') {
    ctx.shadowColor = '#00ddff';
    ctx.shadowBlur = 10;
  } else if (activeTrail === 'rainbow' || activeTrail === 'stars') {
    ctx.shadowBlur = 8;
  }
  for (const p of particles) {
    p.age += dtFactor;
    if (p.age >= p.maxAge) continue;
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    kept.push(p);
    const alpha = 1 - p.age / p.maxAge;
    ctx.globalAlpha = alpha;
    if (activeTrail === 'ghost') {
      ctx.fillStyle = 'rgba(0,220,255,0.5)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * alpha), 0, Math.PI * 2);
      ctx.fill();
    } else if (activeTrail === 'rainbow') {
      ctx.shadowColor = `hsl(${p.hue},100%,65%)`;
      ctx.fillStyle = `hsl(${p.hue},100%,65%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
      ctx.fill();
    } else if (activeTrail === 'stars') {
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      const sz = p.size * alpha;
      ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
    }
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
  return kept;
}

export function updateAndDrawMagParticles(
  ctx: CanvasRenderingContext2D,
  particles: MagParticle[],
  dtFactor: number,
): MagParticle[] {
  const kept: MagParticle[] = [];
  if (particles.length === 0) return kept;
  // Pre-compute per-frame friction; hoist uniform shadow state outside loop.
  const friction96 = Math.pow(0.96, dtFactor);
  ctx.save();
  ctx.shadowColor = '#00ccff';
  ctx.shadowBlur = 8;
  for (const p of particles) {
    p.age += dtFactor;
    if (p.age >= p.maxAge) continue;
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.vy *= friction96;
    kept.push(p);
    const t = p.age / p.maxAge;
    ctx.globalAlpha = (1 - t) * 0.85;
    ctx.fillStyle = `hsl(190,100%,${65 + t * 30}%)`;
    const sz = p.size * (1 - t * 0.5);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
  return kept;
}

export function updateAndDrawCeilParticles(
  ctx: CanvasRenderingContext2D,
  particles: CeilParticle[],
  dtFactor: number,
): CeilParticle[] {
  const kept: CeilParticle[] = [];
  if (particles.length === 0) return kept;
  const friction92 = Math.pow(0.92, dtFactor);
  ctx.save();
  ctx.shadowColor = '#88eeff';
  ctx.shadowBlur = 7;
  for (const p of particles) {
    p.age += dtFactor;
    if (p.age >= p.maxAge) continue;
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.vy *= friction92;
    kept.push(p);
    const t = p.age / p.maxAge;
    ctx.globalAlpha = (1 - t) * 0.92;
    ctx.fillStyle = t < 0.25 ? '#ffffff' : `hsl(190,100%,${75 + t * 20}%)`;
    const sz = p.size * (1 - t * 0.5);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
  return kept;
}

export function updateAndDrawShieldShards(
  ctx: CanvasRenderingContext2D,
  particles: ShieldShard[],
  dtFactor: number,
): ShieldShard[] {
  const kept: ShieldShard[] = [];
  if (particles.length === 0) return kept;
  // shadowBlur is constant across all shards; only shadowColor varies per hue.
  const friction93 = Math.pow(0.93, dtFactor);
  ctx.save();
  ctx.shadowBlur = 9;
  for (const p of particles) {
    p.age += dtFactor;
    if (p.age >= p.maxAge) continue;
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.vx *= friction93;
    p.vy *= friction93;
    kept.push(p);
    const t = p.age / p.maxAge;
    ctx.globalAlpha = (1 - t) * 0.95;
    ctx.shadowColor = `hsl(${p.hue},100%,75%)`;
    ctx.fillStyle = t < 0.2 ? '#ffffff' : `hsl(${p.hue},100%,${70 + t * 20}%)`;
    const sz = p.size * (1 - t * 0.6);
    // Diamond shard shape
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - sz);
    ctx.lineTo(p.x + sz * 0.5, p.y);
    ctx.lineTo(p.x, p.y + sz);
    ctx.lineTo(p.x - sz * 0.5, p.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
  return kept;
}

export function updateAndDrawRareCoinParticles(
  ctx: CanvasRenderingContext2D,
  particles: RareCoinParticle[],
  dtFactor: number,
): RareCoinParticle[] {
  const kept: RareCoinParticle[] = [];
  if (particles.length === 0) return kept;
  const friction92 = Math.pow(0.92, dtFactor);
  ctx.save();
  ctx.shadowBlur = 10;
  for (const p of particles) {
    p.age += dtFactor;
    if (p.age >= p.maxAge) continue;
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.vx *= friction92;
    p.vy *= friction92;
    kept.push(p);
    const t = p.age / p.maxAge;
    ctx.globalAlpha = (1 - t) * 0.9;
    ctx.shadowColor = `hsl(${p.hue},100%,75%)`;
    ctx.fillStyle = t < 0.25 ? '#ffffff' : `hsl(${p.hue},100%,${70 + t * 20}%)`;
    const sz = p.size * (1 - t * 0.5);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
  return kept;
}

export function updateAndDrawFloatingTexts(
  ctx: CanvasRenderingContext2D,
  particles: FloatingText[],
  dtFactor: number,
): FloatingText[] {
  const kept: FloatingText[] = [];
  if (particles.length === 0) return kept;
  // Hoist constant style state outside the per-particle loop.
  // Each particle still needs its own save/restore for the translate+scale transform.
  ctx.shadowColor = '#dd44ff';
  ctx.shadowBlur = 14;
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.lineWidth = 3;
  ctx.fillStyle = '#ffaaff';
  for (const ft of particles) {
    ft.age += dtFactor;
    if (ft.age >= ft.maxAge) continue;
    ft.y -= 0.85 * dtFactor;
    kept.push(ft);
    const t = ft.age / ft.maxAge;
    const alpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
    const scale = t < 0.12 ? t / 0.12 : 1; // pop-in
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(ft.x, ft.y);
    ctx.scale(scale, scale);
    ctx.strokeText(ft.text, 0, 0);
    ctx.fillText(ft.text, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  return kept;
}

export function updateAndDrawBreakerParticles(
  ctx: CanvasRenderingContext2D,
  particles: BreakerParticle[],
  dtFactor: number,
): BreakerParticle[] {
  const kept: BreakerParticle[] = [];
  if (particles.length === 0) return kept;
  const friction91 = Math.pow(0.91, dtFactor);
  ctx.save();
  ctx.shadowBlur = 12;
  for (const p of particles) {
    p.age += dtFactor;
    if (p.age >= p.maxAge) continue;
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.vx *= friction91;
    p.vy *= friction91;
    kept.push(p);
    const t = p.age / p.maxAge;
    ctx.globalAlpha = (1 - t) * 0.95;
    ctx.shadowColor = `hsl(${p.hue},100%,70%)`;
    ctx.fillStyle = t < 0.2 ? '#ffffff' : `hsl(${p.hue},100%,${62 + t * 15}%)`;
    const sz = p.size * (1 - t * 0.45);
    // Elongated fiery shard
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - sz);
    ctx.lineTo(p.x + sz * 0.4, p.y);
    ctx.lineTo(p.x, p.y + sz * 1.4);
    ctx.lineTo(p.x - sz * 0.4, p.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
  return kept;
}

export function updateAndDrawDeathParticles(
  ctx: CanvasRenderingContext2D,
  particles: DeathParticle[],
  dtFactor: number,
): DeathParticle[] {
  const kept: DeathParticle[] = [];
  if (particles.length === 0) return kept;
  const friction91d = Math.pow(0.91, dtFactor);
  ctx.save();
  ctx.shadowBlur = 10;
  for (const p of particles) {
    p.age += dtFactor;
    if (p.age >= p.maxAge) continue;
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.vx *= friction91d;
    p.vy *= friction91d;
    kept.push(p);
    const t = p.age / p.maxAge;
    ctx.globalAlpha = (1 - t) * 0.95;
    ctx.shadowColor = `hsl(${p.hue},100%,65%)`;
    // Flash white at the very start, then fade to red/orange
    ctx.fillStyle = t < 0.18 ? '#ffffff' : `hsl(${p.hue},100%,${65 - t * 20}%)`;
    const sz = p.size * (1 - t * 0.45);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
  return kept;
}

export function updateAndDrawGhostParticles(
  ctx: CanvasRenderingContext2D,
  particles: GhostParticle[],
  dtFactor: number,
): GhostParticle[] {
  const kept: GhostParticle[] = [];
  if (particles.length === 0) return kept;
  const friction88 = Math.pow(0.88, dtFactor);
  ctx.save();
  ctx.shadowBlur = 14;
  for (const p of particles) {
    p.age += dtFactor;
    if (p.age >= p.maxAge) continue;
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.vx *= friction88;
    p.vy *= friction88;
    kept.push(p);
    const t = p.age / p.maxAge;
    ctx.globalAlpha = (1 - t) * 0.82;
    ctx.shadowColor = `hsl(${p.hue},100%,75%)`;
    ctx.fillStyle = t < 0.15 ? '#ffffff' : `hsl(${p.hue},100%,${72 - t * 18}%)`;
    const sz = p.size * (1 - t * 0.55);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
  return kept;
}
