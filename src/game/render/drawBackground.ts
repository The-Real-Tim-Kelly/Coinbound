import { CANVAS_W, CANVAS_H, INITIAL_SPEED } from '../constants';
import { BG_THEMES } from '../data/cosmetics';
import { BG_STARS, SPEED_LINES } from '../data/background';

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  activeBg: string,
  bgOffset: number,
  started: boolean,
  speed: number,
): void {
  const theme = BG_THEMES.find((t) => t.id === activeBg) ?? BG_THEMES[0];
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (activeBg === 'space') {
    const starOff = bgOffset % CANVAS_W;
    for (const star of BG_STARS) {
      const sx = (((star.x - starOff) % CANVAS_W) + CANVAS_W) % CANVAS_W;
      ctx.fillStyle = `rgba(255,255,255,${star.a})`;
      ctx.beginPath();
      ctx.arc(sx, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (activeBg === 'neon') {
    const gridOff = bgOffset % 60;
    ctx.strokeStyle = 'rgba(180,0,255,0.07)';
    ctx.lineWidth = 1;
    for (let gx = -gridOff; gx < CANVAS_W; gx += 60) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, CANVAS_H);
      ctx.stroke();
    }
    for (let gy = 0; gy < CANVAS_H; gy += 60) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(CANVAS_W, gy);
      ctx.stroke();
    }
  } else if (activeBg === 'lava') {
    const lg = ctx.createLinearGradient(0, CANVAS_H * 0.6, 0, CANVAS_H);
    lg.addColorStop(0, 'rgba(0,0,0,0)');
    lg.addColorStop(1, 'rgba(200,60,0,0.18)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, CANVAS_H * 0.6, CANVAS_W, CANVAS_H * 0.4);
  } else if (activeBg === 'ocean') {
    const og = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    og.addColorStop(0, 'rgba(0,50,100,0.14)');
    og.addColorStop(1, 'rgba(0,10,40,0.14)');
    ctx.fillStyle = og;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // Ceiling / floor guide lines — scrolling dashes reinforce forward motion
  const dashOff = bgOffset % 40;
  ctx.strokeStyle = theme.lineColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 20]);
  ctx.lineDashOffset = -dashOff;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(CANVAS_W, 2);
  ctx.moveTo(0, CANVAS_H - 2);
  ctx.lineTo(CANVAS_W, CANVAS_H - 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;

  // Speed streak lines (motion blur effect)
  if (started) {
    const speedFactor = Math.min(speed / INITIAL_SPEED, 2.8);
    for (const sl of SPEED_LINES) {
      const lineLen = sl.baseLen * speedFactor;
      const period = CANVAS_W + lineLen;
      const scrolled = (bgOffset * sl.speedMult) % period;
      const worldX =
        ((((sl.phase - scrolled) % period) + period) % period) - lineLen;
      if (worldX >= CANVAS_W || worldX + lineLen <= 0) continue;
      const alpha = Math.min(sl.alpha * speedFactor, 0.2);
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(Math.max(worldX, 0), sl.y);
      ctx.lineTo(Math.min(worldX + lineLen, CANVAS_W), sl.y);
      ctx.stroke();
    }
  }
}
