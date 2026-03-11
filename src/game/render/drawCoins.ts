import type { Coin, Shield } from '../types';

export function drawCoins(
  ctx: CanvasRenderingContext2D,
  coins: Coin[],
  shieldPickups: Shield[],
  frameCount: number,
): void {
  // ── Coins ──────────────────────────────────────────────────────────────────
  for (const coin of coins) {
    if (coin.collected) continue;
    const bob = Math.sin(frameCount * 0.07 + coin.bobOffset) * 3;
    const cx = coin.x;
    const cy = coin.y + bob;
    const r = coin.radius;

    ctx.save();
    if (coin.isRare) {
      const rarePulse =
        0.7 + Math.sin(frameCount * 0.14 + coin.bobOffset) * 0.3;
      ctx.shadowColor = '#dd44ff';
      ctx.shadowBlur = 22 * rarePulse;

      ctx.strokeStyle = `rgba(220,100,255,${(0.55 * rarePulse).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 5 * rarePulse, 0, Math.PI * 2);
      ctx.stroke();

      const cg = ctx.createRadialGradient(
        cx - r * 0.3,
        cy - r * 0.3,
        r * 0.1,
        cx,
        cy,
        r,
      );
      cg.addColorStop(0, '#ffbbff');
      cg.addColorStop(0.5, '#cc44ff');
      cg.addColorStop(1, '#660099');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = `bold ${Math.round(r * 1.25)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', cx, cy);
      ctx.textBaseline = 'alphabetic';

      const orbitR = r + 7 + Math.sin(frameCount * 0.09 + coin.bobOffset) * 1.5;
      const rotAngle = frameCount * 0.055 + coin.bobOffset;
      for (let si = 0; si < 4; si++) {
        const sa = rotAngle + (si / 4) * Math.PI * 2;
        const spkX = cx + Math.cos(sa) * orbitR;
        const spkY = cy + Math.sin(sa) * orbitR;
        const spkSize = 1.6 + Math.sin(frameCount * 0.13 + si * 1.57) * 0.5;
        ctx.shadowColor = '#ff66ff';
        ctx.shadowBlur = 7;
        ctx.fillStyle = si % 2 === 0 ? '#ffffff' : '#ffaaff';
        ctx.beginPath();
        ctx.arc(spkX, spkY, spkSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    } else {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 14;

      const cg = ctx.createRadialGradient(
        cx - r * 0.3,
        cy - r * 0.3,
        r * 0.1,
        cx,
        cy,
        r,
      );
      cg.addColorStop(0, '#fffaaa');
      cg.addColorStop(0.5, '#ffd700');
      cg.addColorStop(1, '#b8860b');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.font = `bold ${Math.round(r * 1.3)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', cx, cy);
      ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();
  }

  // ── Shield pickups ─────────────────────────────────────────────────────────
  for (const sp of shieldPickups) {
    if (sp.collected) continue;
    const bob = Math.sin(frameCount * 0.09 + sp.bobOffset) * 4;
    const scx = sp.x;
    const scy = sp.y + bob;
    const sr = sp.radius;
    const pulse = 0.65 + Math.sin(frameCount * 0.12) * 0.35;

    ctx.save();
    ctx.shadowColor = '#448fff';
    ctx.shadowBlur = 18 * pulse;

    const shg = ctx.createRadialGradient(
      scx - sr * 0.3,
      scy - sr * 0.4,
      sr * 0.1,
      scx,
      scy,
      sr,
    );
    shg.addColorStop(0, '#ccddff');
    shg.addColorStop(0.45, '#4488ff');
    shg.addColorStop(1, '#1133bb');
    ctx.fillStyle = shg;

    // Hexagonal shield shape
    ctx.beginPath();
    for (let hi = 0; hi < 6; hi++) {
      const a = (hi / 6) * Math.PI * 2 - Math.PI / 2;
      if (hi === 0) ctx.moveTo(scx + Math.cos(a) * sr, scy + Math.sin(a) * sr);
      else ctx.lineTo(scx + Math.cos(a) * sr, scy + Math.sin(a) * sr);
    }
    ctx.closePath();
    ctx.fill();

    // Bright inner triangle (shield emblem)
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    const ti = sr * 0.42;
    ctx.beginPath();
    ctx.moveTo(scx, scy - ti);
    ctx.lineTo(scx - ti * 0.85, scy + ti * 0.55);
    ctx.lineTo(scx + ti * 0.85, scy + ti * 0.55);
    ctx.closePath();
    ctx.fill();

    // Pulsing outer ring
    ctx.strokeStyle = `rgba(160,210,255,${(0.6 * pulse).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(scx, scy, sr + 4 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
