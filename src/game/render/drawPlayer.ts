import {
  PLAYER_SIZE,
  PLAYER_X,
  CANVAS_W,
  CANVAS_H,
  SHIELD_BOUNCE_DURATION,
  BREAKER_FLASH_DURATION,
  DEATH_ANIM_DURATION,
  INVINCIBILITY_BLINK_START,
} from '../constants';
import type { PlayerSkin, CosmeticType } from '../types';

// ─── Player shape (centred at 0,0; caller must save/restore + apply tilt) ────
export function drawPlayerShape(
  ctx: CanvasRenderingContext2D,
  cosmeticType: CosmeticType,
  skin: PlayerSkin,
  isHolding: boolean,
  frameCount: number,
  holdAge = 0,
): void {
  const hs = PLAYER_SIZE / 2;

  // Touch-start pulse ring — expands and fades over the first 10 frames of a
  // hold so feedback is localised to the cube, not the whole screen.
  if (isHolding && holdAge < 10) {
    const progress = holdAge / 10;
    const ringR = PLAYER_SIZE * (0.58 + progress * 0.72);
    const ringAlpha = 0.75 * (1 - progress);
    ctx.save();
    ctx.strokeStyle = `rgba(0,210,255,${ringAlpha.toFixed(3)})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur = 16 * (1 - progress);
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  ctx.shadowColor = isHolding ? '#00ccff' : skin.glow;
  ctx.shadowBlur = isHolding ? 24 : 14;

  const pg = ctx.createLinearGradient(-hs, -hs, hs, hs);
  pg.addColorStop(0, skin.color1);
  pg.addColorStop(1, skin.color2);

  switch (cosmeticType) {
    case 'circle': {
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(0, 0, hs - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = skin.dirColor;
      ctx.globalAlpha = 0.88;
      ctx.beginPath();
      ctx.arc(hs * 0.3, -hs * 0.52, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }

    case 'airplane': {
      const fuseGrad = ctx.createLinearGradient(-hs, 0, hs, 0);
      fuseGrad.addColorStop(0, skin.color2);
      fuseGrad.addColorStop(0.75, skin.color1);
      fuseGrad.addColorStop(1, 'rgba(255,255,255,0.7)');
      ctx.fillStyle = fuseGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, hs, hs * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = skin.color1;
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      ctx.moveTo(hs * 0.28, -hs * 0.12);
      ctx.lineTo(-hs * 0.22, -hs * 0.88);
      ctx.lineTo(-hs * 0.52, -hs * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hs * 0.28, hs * 0.12);
      ctx.lineTo(-hs * 0.22, hs * 0.88);
      ctx.lineTo(-hs * 0.52, hs * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = skin.color2;
      ctx.beginPath();
      ctx.moveTo(-hs * 0.72, -hs * 0.24);
      ctx.lineTo(-hs, -hs * 0.72);
      ctx.lineTo(-hs * 0.96, -hs * 0.24);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-hs * 0.72, hs * 0.24);
      ctx.lineTo(-hs, hs * 0.72);
      ctx.lineTo(-hs * 0.96, hs * 0.24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(200,240,255,0.65)';
      ctx.beginPath();
      ctx.ellipse(
        hs * 0.55,
        -hs * 0.07,
        hs * 0.22,
        hs * 0.13,
        0.15,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;
    }

    case 'spaceship': {
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.moveTo(hs, 0);
      ctx.bezierCurveTo(hs * 0.35, -hs * 0.42, -hs * 0.55, -hs * 0.32, -hs, 0);
      ctx.bezierCurveTo(-hs * 0.55, hs * 0.32, hs * 0.35, hs * 0.42, hs, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = skin.color2;
      ctx.beginPath();
      ctx.moveTo(-hs * 0.08, -hs * 0.28);
      ctx.lineTo(-hs * 0.68, -hs * 0.98);
      ctx.lineTo(-hs, -hs * 0.38);
      ctx.lineTo(-hs * 0.48, -hs * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-hs * 0.08, hs * 0.28);
      ctx.lineTo(-hs * 0.68, hs * 0.98);
      ctx.lineTo(-hs, hs * 0.38);
      ctx.lineTo(-hs * 0.48, hs * 0.28);
      ctx.closePath();
      ctx.fill();
      const engGrad = ctx.createRadialGradient(
        -hs * 0.82,
        0,
        0,
        -hs * 0.82,
        0,
        hs * 0.45,
      );
      engGrad.addColorStop(0, 'rgba(255,200,80,0.92)');
      engGrad.addColorStop(0.45, 'rgba(255,70,10,0.5)');
      engGrad.addColorStop(1, 'rgba(200,30,0,0)');
      ctx.fillStyle = engGrad;
      ctx.beginPath();
      ctx.ellipse(-hs * 0.82, 0, hs * 0.38, hs * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(190,235,255,0.82)';
      ctx.beginPath();
      ctx.ellipse(hs * 0.18, 0, hs * 0.3, hs * 0.21, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'ufo': {
      if (isHolding) {
        const beamGrad = ctx.createLinearGradient(0, hs * 0.12, 0, hs * 0.9);
        beamGrad.addColorStop(0, 'rgba(180,255,120,0.5)');
        beamGrad.addColorStop(1, 'rgba(180,255,120,0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(-hs * 0.6, hs * 0.18);
        ctx.lineTo(hs * 0.6, hs * 0.18);
        ctx.lineTo(hs * 0.85, hs * 0.88);
        ctx.lineTo(-hs * 0.85, hs * 0.88);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowColor = isHolding ? '#00ccff' : skin.glow;
      ctx.shadowBlur = isHolding ? 24 : 14;
      const discGrad = ctx.createLinearGradient(-hs, 0, hs, 0);
      discGrad.addColorStop(0, skin.color2);
      discGrad.addColorStop(0.5, skin.color1);
      discGrad.addColorStop(1, skin.color2);
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.ellipse(0, hs * 0.06, hs, hs * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      const domeGrad = ctx.createLinearGradient(0, -hs * 0.52, 0, hs * 0.06);
      domeGrad.addColorStop(0, 'rgba(210,245,255,0.92)');
      domeGrad.addColorStop(0.55, skin.color1 + 'cc');
      domeGrad.addColorStop(1, skin.color2 + '88');
      ctx.fillStyle = domeGrad;
      ctx.beginPath();
      ctx.ellipse(0, -hs * 0.1, hs * 0.5, hs * 0.4, 0, 0, Math.PI, true);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, hs * 0.06 - 2, hs * 0.88, hs * 0.2, 0, Math.PI, 0, true);
      ctx.stroke();
      const numLights = 6;
      for (let li = 0; li < numLights; li++) {
        const t = (li + 0.5) / numLights;
        const lx = (t * 2 - 1) * hs * 0.8;
        const ly = hs * 0.06 + hs * 0.26;
        const pulse = 0.5 + Math.sin(frameCount * 0.22 + li * 1.05) * 0.5;
        ctx.fillStyle =
          li % 3 === 0
            ? `rgba(255,255,80,${pulse.toFixed(2)})`
            : li % 3 === 1
            ? `rgba(255,80,80,${pulse.toFixed(2)})`
            : `rgba(80,200,255,${pulse.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(lx, ly, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    default: {
      // square (and safe fallback)
      ctx.fillStyle = pg;
      ctx.fillRect(-hs, -hs, PLAYER_SIZE, PLAYER_SIZE);
      ctx.shadowBlur = 0;
      const stripeH = 5;
      ctx.fillStyle = skin.dirColor;
      ctx.globalAlpha = 0.88;
      ctx.fillRect(-hs + 3, -hs + 1, PLAYER_SIZE - 6, stripeH);
      ctx.globalAlpha = 1;
      ctx.fillStyle = skin.dirColor;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.moveTo(0, -hs + stripeH + 4);
      ctx.lineTo(-6, -hs + stripeH + 12);
      ctx.lineTo(6, -hs + stripeH + 12);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
  }
}

// ─── Full player draw (with tilt) ─────────────────────────────────────────────
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  playerY: number,
  playerVY: number,
  skin: PlayerSkin,
  cosmeticType: CosmeticType,
  isHolding: boolean,
  frameCount: number,
  holdAge = 0,
  deathAge = 0,
  invincibilityActive = false,
  invincibilityTimer = 0,
): void {
  // Blink: in the last INVINCIBILITY_BLINK_START frames, hide every other 4-frame slot.
  if (invincibilityActive && invincibilityTimer <= INVINCIBILITY_BLINK_START) {
    const blinkCycle = Math.floor(invincibilityTimer / 4) % 2;
    if (blinkCycle === 0) return; // invisible frame — skip drawing
  }

  ctx.save();
  ctx.translate(PLAYER_X + PLAYER_SIZE / 2, playerY + PLAYER_SIZE / 2);
  const tilt = Math.max(-0.35, Math.min(0.35, playerVY * 0.04));
  ctx.rotate(tilt);

  if (deathAge > 0) {
    // Death animation: shrink + fade over DEATH_ANIM_DURATION frames.
    const t = Math.min(1, deathAge / DEATH_ANIM_DURATION);
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.scale(Math.max(0.05, 1 - 0.95 * t), Math.max(0.05, 1 - 0.95 * t));
  } else if (invincibilityActive) {
    // Ghost mode: translucent player with a cyan tint.
    ctx.globalAlpha = 0.38;
  } else if (isHolding && holdAge < 10) {
    // Touch-start scale pulse (existing behaviour).
    const scaleT = holdAge / 10;
    const touchScale = 1 + 0.1 * (1 - scaleT);
    ctx.scale(touchScale, touchScale);
  }

  drawPlayerShape(ctx, cosmeticType, skin, isHolding, frameCount, holdAge);

  if (deathAge > 0) {
    // Red flash overlay in the first 40 % of the animation.
    const t = Math.min(1, deathAge / DEATH_ANIM_DURATION);
    if (t < 0.4) {
      const hs = PLAYER_SIZE / 2;
      const flashAlpha = (1 - t / 0.4) * 0.8;
      ctx.save();
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = '#ff2020';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 28;
      ctx.fillRect(-hs, -hs, PLAYER_SIZE, PLAYER_SIZE);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  if (invincibilityActive) {
    // Cyan ghost overlay — sits on top of the sprite, only visible when the
    // overall globalAlpha is already low from the ghost-mode setting above.
    const hs = PLAYER_SIZE / 2;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = 'rgba(0,230,220,0.55)';
    ctx.shadowColor = '#00ffdd';
    ctx.shadowBlur = 16;
    ctx.fillRect(-hs, -hs, PLAYER_SIZE, PLAYER_SIZE);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  ctx.restore();
}

// ─── Magnet field ring ────────────────────────────────────────────────────────
export function drawMagnetField(
  ctx: CanvasRenderingContext2D,
  magnetLevel: number,
  playerCX: number,
  playerCY: number,
): void {
  if (magnetLevel <= 0) return;
  const mRadius = magnetLevel * 30; // MAGNET_RADIUS_PER_LEVEL = 30
  ctx.save();
  ctx.strokeStyle = 'rgba(0,220,255,0.18)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  ctx.arc(playerCX, playerCY, mRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ─── Ceiling magnetic glow (while holding) ───────────────────────────────────
export function drawCeilingGlow(
  ctx: CanvasRenderingContext2D,
  holdAge: number,
  frameCount: number,
): void {
  const glowInt = Math.min(1, holdAge / 15);
  const pulse = 0.72 + Math.sin(frameCount * 0.18) * 0.28;

  ctx.save();
  const ceilGrad = ctx.createLinearGradient(0, 0, 0, 72);
  ceilGrad.addColorStop(
    0,
    `rgba(0,220,255,${(0.55 * glowInt * pulse).toFixed(3)})`,
  );
  ceilGrad.addColorStop(0.45, `rgba(0,170,255,${(0.22 * glowInt).toFixed(3)})`);
  ceilGrad.addColorStop(1, 'rgba(0,140,255,0)');
  ctx.fillStyle = ceilGrad;
  ctx.fillRect(0, 0, CANVAS_W, 72);

  ctx.strokeStyle = `rgba(120,245,255,${(0.95 * glowInt * pulse).toFixed(3)})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00ddff';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.lineTo(CANVAS_W, 1);
  ctx.stroke();
  ctx.shadowBlur = 0;

  for (let ri = 0; ri < 4; ri++) {
    const rippleY = 3 + ((holdAge * 1.4 + ri * 14) % 52);
    const rippleAlpha = (1 - rippleY / 52) * 0.28 * glowInt;
    if (rippleAlpha > 0.005) {
      ctx.strokeStyle = `rgba(0,220,255,${rippleAlpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, rippleY);
      ctx.lineTo(CANVAS_W, rippleY);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ─── Shield glow around player ────────────────────────────────────────────────
export function drawShieldGlow(
  ctx: CanvasRenderingContext2D,
  playerCX: number,
  playerCY: number,
  shieldActive: boolean,
  frameCount: number,
): void {
  if (!shieldActive) return;
  const shPulse = 0.65 + Math.sin(frameCount * 0.15) * 0.35;
  const shR = PLAYER_SIZE * 0.82 + 6;
  ctx.save();
  const shGrad = ctx.createRadialGradient(
    playerCX,
    playerCY,
    shR - 2,
    playerCX,
    playerCY,
    shR + 14,
  );
  shGrad.addColorStop(0, `rgba(60,140,255,${(0.22 * shPulse).toFixed(3)})`);
  shGrad.addColorStop(1, 'rgba(60,140,255,0)');
  ctx.fillStyle = shGrad;
  ctx.beginPath();
  ctx.arc(playerCX, playerCY, shR + 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = '#3399ff';
  ctx.shadowBlur = 20 * shPulse;
  ctx.strokeStyle = `rgba(100,180,255,${(0.9 * shPulse).toFixed(3)})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(playerCX, playerCY, shR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([6, 5]);
  ctx.lineDashOffset = -(frameCount * 1.8);
  ctx.strokeStyle = `rgba(180,220,255,${(0.55 * shPulse).toFixed(3)})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(playerCX, playerCY, shR - 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── Electric arc: player top → ceiling ──────────────────────────────────────
export function drawElectricArc(
  ctx: CanvasRenderingContext2D,
  isHolding: boolean,
  playerY: number,
  holdAge: number,
): void {
  if (!isHolding) return;
  const arcX = PLAYER_X + PLAYER_SIZE / 2;
  const arcStartY = playerY;
  const arcEndY = 5;
  const segments = 9;
  const segH = (arcStartY - arcEndY) / segments;
  const flicker = 0.45 + Math.random() * 0.45;

  const burstT = Math.min(1, holdAge / 16);
  const burst = 1 + (1 - burstT) * 2;
  const jitter = 22 * burst;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.strokeStyle = `rgba(0,200,255,${Math.min(
    1,
    flicker * 0.65 * burst,
  ).toFixed(3)})`;
  ctx.lineWidth = 3 * burst;
  ctx.shadowColor = '#00ccff';
  ctx.shadowBlur = 18 * burst;
  ctx.beginPath();
  ctx.moveTo(arcX, arcStartY);
  for (let i = 1; i < segments; i++) {
    ctx.lineTo(arcX + (Math.random() - 0.5) * jitter, arcStartY - i * segH);
  }
  ctx.lineTo(arcX + (Math.random() - 0.5) * 6, arcEndY);
  ctx.stroke();

  ctx.strokeStyle = `rgba(210,250,255,${Math.min(1, flicker * 0.88).toFixed(
    3,
  )})`;
  ctx.lineWidth = Math.max(1, burst);
  ctx.shadowBlur = 6 * burst;
  ctx.beginPath();
  ctx.moveTo(arcX, arcStartY);
  for (let i = 1; i < segments; i++) {
    ctx.lineTo(arcX + (Math.random() - 0.5) * 8, arcStartY - i * segH);
  }
  ctx.lineTo(arcX, arcEndY);
  ctx.stroke();

  const sparkR =
    (3 + Math.random() * 2) * (burstT < 1 ? Math.min(burst * 0.7, 2.5) : 1);
  ctx.fillStyle = 'rgba(225,250,255,0.95)';
  ctx.shadowBlur = 18 * burst;
  ctx.beginPath();
  ctx.arc(arcX, arcEndY, sparkR, 0, Math.PI * 2);
  ctx.fill();

  if (burstT < 0.55) {
    const burstSparkAlpha = (1 - burstT / 0.55) * 0.85;
    ctx.strokeStyle = `rgba(200,245,255,${burstSparkAlpha.toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00eeff';
    ctx.shadowBlur = 14;
    const numSparks = 8;
    for (let si = 0; si < numSparks; si++) {
      const angle = (si / numSparks) * Math.PI * 2;
      const len = (10 + Math.random() * 18) * burst;
      ctx.beginPath();
      ctx.moveTo(arcX, arcEndY);
      ctx.lineTo(arcX + Math.cos(angle) * len, arcEndY + Math.sin(angle) * len);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ─── Screen shake: saves context and translates; returns true if shake applied
export function applyScreenShake(
  ctx: CanvasRenderingContext2D,
  bounceAge: number,
): boolean {
  if (bounceAge <= 0) return false;
  const shakeAmt = (bounceAge / SHIELD_BOUNCE_DURATION) * 7;
  ctx.save();
  ctx.translate(
    (Math.random() - 0.5) * shakeAmt,
    (Math.random() - 0.5) * shakeAmt,
  );
  return true;
}

// ─── Blue flash overlay during shield bounce ──────────────────────────────────
export function drawBounceFlash(
  ctx: CanvasRenderingContext2D,
  bounceAge: number,
): void {
  if (bounceAge <= 0) return;
  const flashA = (bounceAge / SHIELD_BOUNCE_DURATION) * 0.42;
  ctx.save();
  ctx.fillStyle = `rgba(60,150,255,${flashA.toFixed(3)})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();
}

// ─── Shield active HUD indicator ─────────────────────────────────────────────
export function drawShieldHudIndicator(
  ctx: CanvasRenderingContext2D,
  shieldActive: boolean,
  frameCount: number,
): void {
  if (!shieldActive) return;
  const siPulse = 0.7 + Math.sin(frameCount * 0.18) * 0.3;
  ctx.save();
  ctx.shadowColor = '#4499ff';
  ctx.shadowBlur = 12 * siPulse;
  ctx.fillStyle = `rgba(80,170,255,${siPulse.toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(CANVAS_W - 22, 62, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SH', CANVAS_W - 22, 62);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

// ─── Orange flash overlay when Breaker destroys an obstacle ─────────────────────
export function drawBreakerFlash(
  ctx: CanvasRenderingContext2D,
  breakerFlashAge: number,
): void {
  if (breakerFlashAge <= 0) return;
  const flashA = (breakerFlashAge / BREAKER_FLASH_DURATION) * 0.48;
  ctx.save();
  ctx.fillStyle = `rgba(255,130,0,${flashA.toFixed(3)})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();
}

// ─── Breaker active aura around player ──────────────────────────────────────
// Drawn before the player so it sits behind the sprite but in front of trails.
export function drawBreakerAura(
  ctx: CanvasRenderingContext2D,
  playerCX: number,
  playerCY: number,
  breakerActive: boolean,
  frameCount: number,
): void {
  if (!breakerActive) return;

  const pulse = 0.6 + Math.sin(frameCount * 0.25) * 0.4;
  const baseR = PLAYER_SIZE * 0.74;

  ctx.save();

  // Outer radial glow halo
  const outerGrad = ctx.createRadialGradient(
    playerCX,
    playerCY,
    baseR - 2,
    playerCX,
    playerCY,
    baseR + 20,
  );
  outerGrad.addColorStop(0, `rgba(255,110,0,${(0.3 * pulse).toFixed(3)})`);
  outerGrad.addColorStop(1, 'rgba(255,60,0,0)');
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(playerCX, playerCY, baseR + 20, 0, Math.PI * 2);
  ctx.fill();

  // Solid ring
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 22 * pulse;
  ctx.strokeStyle = `rgba(255,150,30,${(0.95 * pulse).toFixed(3)})`;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(playerCX, playerCY, baseR, 0, Math.PI * 2);
  ctx.stroke();

  // Inner spinning dashed ring (rotates opposite direction to shield)
  ctx.shadowBlur = 0;
  ctx.setLineDash([4, 5]);
  ctx.lineDashOffset = frameCount * 2.5;
  ctx.strokeStyle = `rgba(255,215,60,${(0.7 * pulse).toFixed(3)})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(playerCX, playerCY, baseR - 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;

  // Eight orbiting spark nodes
  const numSparks = 8;
  for (let i = 0; i < numSparks; i++) {
    const angle = (i / numSparks) * Math.PI * 2 + frameCount * 0.045;
    const sx = playerCX + Math.cos(angle) * baseR;
    const sy = playerCY + Math.sin(angle) * baseR;
    const sparkAlpha = 0.5 + Math.sin(frameCount * 0.32 + i * 0.8) * 0.5;
    ctx.fillStyle = `rgba(255,230,90,${sparkAlpha.toFixed(3)})`;
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── Breaker active HUD indicator ───────────────────────────────────────────
export function drawBreakerHudIndicator(
  ctx: CanvasRenderingContext2D,
  breakerActive: boolean,
  frameCount: number,
): void {
  if (!breakerActive) return;
  const bPulse = 0.7 + Math.sin(frameCount * 0.18) * 0.3;
  ctx.save();
  ctx.shadowColor = '#ff7700';
  ctx.shadowBlur = 12 * bPulse;
  ctx.fillStyle = `rgba(255,120,0,${bPulse.toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(CANVAS_W - 22, 79, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BR', CANVAS_W - 22, 79);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

// ─── Invincibility ghost aura around player ──────────────────────────────────
export function drawInvincibilityAura(
  ctx: CanvasRenderingContext2D,
  playerCX: number,
  playerCY: number,
  invincibilityActive: boolean,
  invincibilityTimer: number,
  frameCount: number,
): void {
  if (!invincibilityActive) return;

  const pulse = 0.55 + Math.sin(frameCount * 0.2) * 0.45;
  const baseR = PLAYER_SIZE * 0.8;

  // Fade out in last INVINCIBILITY_BLINK_START frames
  const fadeAlpha =
    invincibilityTimer <= INVINCIBILITY_BLINK_START
      ? invincibilityTimer / INVINCIBILITY_BLINK_START
      : 1;

  ctx.save();

  // Outer diffuse halo
  const outerGrad = ctx.createRadialGradient(
    playerCX,
    playerCY,
    baseR,
    playerCX,
    playerCY,
    baseR + 22,
  );
  outerGrad.addColorStop(
    0,
    `rgba(0,220,210,${(0.28 * pulse * fadeAlpha).toFixed(3)})`,
  );
  outerGrad.addColorStop(1, 'rgba(0,180,200,0)');
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(playerCX, playerCY, baseR + 22, 0, Math.PI * 2);
  ctx.fill();

  // Solid pulsing ring
  ctx.shadowColor = '#00ffee';
  ctx.shadowBlur = 20 * pulse * fadeAlpha;
  ctx.strokeStyle = `rgba(0,240,220,${(0.9 * pulse * fadeAlpha).toFixed(3)})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(playerCX, playerCY, baseR, 0, Math.PI * 2);
  ctx.stroke();

  // Inner spinning dashed ring
  ctx.shadowBlur = 0;
  ctx.setLineDash([5, 4]);
  ctx.lineDashOffset = -(frameCount * 2.2);
  ctx.strokeStyle = `rgba(160,255,245,${(0.65 * pulse * fadeAlpha).toFixed(
    3,
  )})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(playerCX, playerCY, baseR - 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;

  // Six orbiting ghost motes
  const numMotes = 6;
  for (let i = 0; i < numMotes; i++) {
    const angle = (i / numMotes) * Math.PI * 2 + frameCount * 0.055;
    const mx = playerCX + Math.cos(angle) * baseR;
    const my = playerCY + Math.sin(angle) * baseR;
    const moteAlpha =
      (0.5 + Math.sin(frameCount * 0.3 + i * 1.05) * 0.5) * fadeAlpha;
    ctx.fillStyle = `rgba(180,255,245,${moteAlpha.toFixed(3)})`;
    ctx.shadowColor = '#00eedd';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(mx, my, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── Invincibility active HUD indicator ──────────────────────────────────────
export function drawInvincibilityHudIndicator(
  ctx: CanvasRenderingContext2D,
  invincibilityActive: boolean,
  invincibilityTimer: number,
  invincibilityDuration: number,
  frameCount: number,
): void {
  if (!invincibilityActive) return;
  const iPulse = 0.7 + Math.sin(frameCount * 0.2) * 0.3;
  ctx.save();
  ctx.shadowColor = '#00ffee';
  ctx.shadowBlur = 12 * iPulse;
  ctx.fillStyle = `rgba(0,220,200,${iPulse.toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(CANVAS_W - 22, 96, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GH', CANVAS_W - 22, 96);
  ctx.textBaseline = 'alphabetic';

  // Tiny countdown arc drawn around the dot
  const arcFrac = Math.max(0, invincibilityTimer / invincibilityDuration);
  ctx.strokeStyle = `rgba(0,255,230,${(0.85 * iPulse).toFixed(3)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(
    CANVAS_W - 22,
    96,
    9,
    -Math.PI / 2,
    -Math.PI / 2 + arcFrac * Math.PI * 2,
  );
  ctx.stroke();
  ctx.restore();
}
