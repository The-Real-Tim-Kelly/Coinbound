import { CANVAS_W } from '../constants';

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number,
  coinCount: number,
  hiScore: number,
): void {
  // Panel background
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.roundRect(8, 6, CANVAS_W - 16, 46, 8);
  ctx.fill();

  // Score (left)
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '13px monospace';
  ctx.fillText('SCORE', 18, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(String(score), 18, 46);

  // Coin counter (centre)
  ctx.textAlign = 'center';
  ctx.save();
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(CANVAS_W / 2 - 32, 30, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', CANVAS_W / 2 - 32, 30);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(String(coinCount), CANVAS_W / 2 - 18, 46);
  ctx.fillStyle = 'rgba(255,215,0,0.5)';
  ctx.font = '13px monospace';
  ctx.fillText('COINS', CANVAS_W / 2 - 18, 24);

  // Best (right)
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '13px monospace';
  ctx.fillText('BEST', CANVAS_W - 18, 24);
  ctx.fillStyle = '#ffdd44';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(String(hiScore), CANVAS_W - 18, 46);
}
