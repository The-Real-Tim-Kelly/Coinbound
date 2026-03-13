import type { Coin, Shield, Breaker, Invincibility } from '../types';

export function drawCoins(
  ctx: CanvasRenderingContext2D,
  coins: Coin[],
  shieldPickups: Shield[],
  breakerPickups: Breaker[],
  invincibilityPickups: Invincibility[],
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

  // ── Breaker pickups ──────────────────────────────────────────────────────
  for (const bp of breakerPickups) {
    if (bp.collected) continue;
    const bob = Math.sin(frameCount * 0.11 + bp.bobOffset) * 4;
    const bcx = bp.x;
    const bcy = bp.y + bob;
    const br = bp.radius;
    const pulse = 0.65 + Math.sin(frameCount * 0.14) * 0.35;

    ctx.save();
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 18 * pulse;

    const bg = ctx.createRadialGradient(
      bcx - br * 0.3,
      bcy - br * 0.4,
      br * 0.1,
      bcx,
      bcy,
      br,
    );
    bg.addColorStop(0, '#ffe066');
    bg.addColorStop(0.45, '#ff6600');
    bg.addColorStop(1, '#aa2200');
    ctx.fillStyle = bg;

    // Rotating 8-pointed starburst
    ctx.beginPath();
    const pts = 8;
    const outerR = br;
    const innerR = br * 0.52;
    for (let pi = 0; pi < pts * 2; pi++) {
      const angle =
        (pi / (pts * 2)) * Math.PI * 2 - Math.PI / 2 + frameCount * 0.04;
      const r = pi % 2 === 0 ? outerR : innerR;
      if (pi === 0)
        ctx.moveTo(bcx + Math.cos(angle) * r, bcy + Math.sin(angle) * r);
      else ctx.lineTo(bcx + Math.cos(angle) * r, bcy + Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();

    // Bold X emblem
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    const em = br * 0.38;
    ctx.beginPath();
    ctx.moveTo(bcx - em, bcy - em);
    ctx.lineTo(bcx + em, bcy + em);
    ctx.moveTo(bcx + em, bcy - em);
    ctx.lineTo(bcx - em, bcy + em);
    ctx.stroke();

    // Pulsing outer ring
    ctx.strokeStyle = `rgba(255,160,40,${(0.6 * pulse).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bcx, bcy, br + 4 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ── Invincibility pickups ──────────────────────────────────────────────────
  for (const ip of invincibilityPickups) {
    if (ip.collected) continue;
    const bob = Math.sin(frameCount * 0.1 + ip.bobOffset) * 4;
    const icx = ip.x;
    const icy = ip.y + bob;
    const ir = ip.radius;
    const pulse = 0.6 + Math.sin(frameCount * 0.13 + ip.bobOffset) * 0.4;

    ctx.save();

    // Outer ethereal glow
    ctx.shadowColor = '#00ffdd';
    ctx.shadowBlur = 22 * pulse;

    // Ghost-blue gradient fill
    const ig = ctx.createRadialGradient(
      icx - ir * 0.3,
      icy - ir * 0.4,
      ir * 0.08,
      icx,
      icy,
      ir,
    );
    ig.addColorStop(0, 'rgba(200,255,255,0.95)');
    ig.addColorStop(0.45, 'rgba(0,200,220,0.88)');
    ig.addColorStop(1, 'rgba(0,80,160,0.9)');
    ctx.fillStyle = ig;

    // Soft outer semi-transparent halo circle
    ctx.globalAlpha = 0.38 * pulse;
    ctx.beginPath();
    ctx.arc(icx, icy, ir + 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Main ghost-shape circle
    ctx.beginPath();
    ctx.arc(icx, icy, ir, 0, Math.PI * 2);
    ctx.fill();

    // Ghost face details (eyes)
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,30,0.85)';
    ctx.beginPath();
    ctx.arc(icx - ir * 0.28, icy - ir * 0.18, ir * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(icx + ir * 0.28, icy - ir * 0.18, ir * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Eye gleam
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(icx - ir * 0.24, icy - ir * 0.24, ir * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(icx + ir * 0.32, icy - ir * 0.24, ir * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // Spinning orbital dots
    const orbitR = ir + 6 + Math.sin(frameCount * 0.08 + ip.bobOffset) * 1.5;
    const rotAngle = frameCount * 0.065 + ip.bobOffset;
    for (let di = 0; di < 5; di++) {
      const da = rotAngle + (di / 5) * Math.PI * 2;
      const dx = icx + Math.cos(da) * orbitR;
      const dy = icy + Math.sin(da) * orbitR;
      const dotAlpha = 0.55 + Math.sin(frameCount * 0.15 + di * 1.26) * 0.45;
      ctx.shadowColor = '#00ffee';
      ctx.shadowBlur = 6;
      ctx.fillStyle = `rgba(160,255,240,${dotAlpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(dx, dy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Pulsing outer ring
    ctx.strokeStyle = `rgba(0,230,210,${(0.55 * pulse).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(icx, icy, ir + 4 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
