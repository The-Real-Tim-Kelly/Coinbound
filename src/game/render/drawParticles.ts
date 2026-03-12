import type {
  TrailParticle,
  MagParticle,
  CeilParticle,
  ShieldShard,
  RareCoinParticle,
  FloatingText,
  DeathParticle,
} from '../types';

export function updateAndDrawTrailParticles(
  ctx: CanvasRenderingContext2D,
  particles: TrailParticle[],
  activeTrail: string,
  dtFactor: number,
): TrailParticle[] {
  const kept: TrailParticle[] = [];
  for (const p of particles) {
    p.age += dtFactor;
    if (p.age >= p.maxAge) continue;
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    kept.push(p);
    const alpha = 1 - p.age / p.maxAge;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (activeTrail === 'ghost') {
      ctx.shadowColor = '#00ddff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = 'rgba(0,220,255,0.5)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * alpha), 0, Math.PI * 2);
      ctx.fill();
    } else if (activeTrail === 'rainbow') {
      ctx.shadowColor = `hsl(${p.hue},100%,65%)`;
      ctx.shadowBlur = 8;
      ctx.fillStyle = `hsl(${p.hue},100%,65%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
      ctx.fill();
    } else if (activeTrail === 'stars') {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      const sz = p.size * alpha;
      ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  return kept;
}

export function updateAndDrawMagParticles(
  ctx: CanvasRenderingContext2D,
  particles: MagParticle[],
  dtFactor: number,
): MagParticle[] {
  const kept: MagParticle[] = [];
  for (const p of particles) {
    p.age += dtFactor;
    if (p.age >= p.maxAge) continue;
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.vy *= Math.pow(0.96, dtFactor);
    kept.push(p);
    const t = p.age / p.maxAge;
    const alpha = (1 - t) * 0.85;
    const lightness = 65 + t * 30;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur = 8;
    ctx.fillStyle = `hsl(190,100%,${lightness}%)`;
    const sz = p.size * (1 - t * 0.5);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  return kept;
}

export function updateAndDrawCeilParticles(
  ctx: CanvasRenderingContext2D,
  particles: CeilParticle[],
  dtFactor: number,
): CeilParticle[] {
  const kept: CeilParticle[] = [];
  for (const p of particles) {
    p.age += dtFactor;
    if (p.age >= p.maxAge) continue;
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.vy *= Math.pow(0.92, dtFactor);
    kept.push(p);
    const t = p.age / p.maxAge;
    const alpha = (1 - t) * 0.92;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#88eeff';
    ctx.shadowBlur = 7;
    ctx.fillStyle = t < 0.25 ? '#ffffff' : `hsl(190,100%,${75 + t * 20}%)`;
    const sz = p.size * (1 - t * 0.5);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  return kept;
}

export function updateAndDrawShieldShards(
  ctx: CanvasRenderingContext2D,
  particles: ShieldShard[],
  dtFactor: number,
): ShieldShard[] {
  const kept: ShieldShard[] = [];
  for (const p of particles) {
    p.age += dtFactor;
    if (p.age >= p.maxAge) continue;
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.vx *= Math.pow(0.93, dtFactor);
    p.vy *= Math.pow(0.93, dtFactor);
    kept.push(p);
    const t = p.age / p.maxAge;
    const alpha = (1 - t) * 0.95;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = `hsl(${p.hue},100%,75%)`;
    ctx.shadowBlur = 9;
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
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  return kept;
}

export function updateAndDrawRareCoinParticles(
  ctx: CanvasRenderingContext2D,
  particles: RareCoinParticle[],
  dtFactor: number,
): RareCoinParticle[] {
  const kept: RareCoinParticle[] = [];
  for (const p of particles) {
    p.age += dtFactor;
    if (p.age >= p.maxAge) continue;
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.vx *= Math.pow(0.92, dtFactor);
    p.vy *= Math.pow(0.92, dtFactor);
    kept.push(p);
    const t = p.age / p.maxAge;
    const alpha = (1 - t) * 0.9;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = `hsl(${p.hue},100%,75%)`;
    ctx.shadowBlur = 10;
    ctx.fillStyle = t < 0.25 ? '#ffffff' : `hsl(${p.hue},100%,${70 + t * 20}%)`;
    const sz = p.size * (1 - t * 0.5);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  return kept;
}

export function updateAndDrawFloatingTexts(
  ctx: CanvasRenderingContext2D,
  particles: FloatingText[],
  dtFactor: number,
): FloatingText[] {
  const kept: FloatingText[] = [];
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
    ctx.shadowColor = '#dd44ff';
    ctx.shadowBlur = 14;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.lineWidth = 3;
    ctx.strokeText(ft.text, 0, 0);
    ctx.fillStyle = '#ffaaff';
    ctx.fillText(ft.text, 0, 0);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  return kept;
}

export function updateAndDrawDeathParticles(
  ctx: CanvasRenderingContext2D,
  particles: DeathParticle[],
  dtFactor: number,
): DeathParticle[] {
  const kept: DeathParticle[] = [];
  for (const p of particles) {
    p.age += dtFactor;
    if (p.age >= p.maxAge) continue;
    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.vx *= Math.pow(0.91, dtFactor);
    p.vy *= Math.pow(0.91, dtFactor);
    kept.push(p);
    const t = p.age / p.maxAge;
    const alpha = (1 - t) * 0.95;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = `hsl(${p.hue},100%,65%)`;
    ctx.shadowBlur = 10;
    // Flash white at the very start, then fade to red/orange
    ctx.fillStyle =
      t < 0.18 ? '#ffffff' : `hsl(${p.hue},100%,${65 - t * 20}%)`;
    const sz = p.size * (1 - t * 0.45);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  return kept;
}
