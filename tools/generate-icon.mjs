/**
 * Coinbound — App Icon Generator
 * Generates coinbound-icon-1024.png using @napi-rs/canvas (no browser needed).
 *
 * Usage: node tools/generate-icon.mjs
 */

import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const W = 1024, H = 1024, CX = 512, CY = 512;
const TAU = Math.PI * 2;

const canvas = createCanvas(W, H);
const ctx    = canvas.getContext('2d');

// ─── HELPERS ───────────────────────────────────────────────────────────────
function arc(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
}

function sparkle4Path(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const oa = (i / 4) * TAU - Math.PI / 4;
    const ia = oa + Math.PI / 4;
    const ox = x + Math.cos(oa) * r;
    const oy = y + Math.sin(oa) * r;
    const ix = x + Math.cos(ia) * (r * 0.18);
    const iy = y + Math.sin(ia) * (r * 0.18);
    if (i === 0) ctx.moveTo(ox, oy); else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
}

// ─── 1. BACKGROUND ─────────────────────────────────────────────────────────
function drawBackground() {
  const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, 660);
  bg.addColorStop(0.00, '#1C0A44');
  bg.addColorStop(0.45, '#0C0420');
  bg.addColorStop(1.00, '#03010B');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const vig = ctx.createRadialGradient(CX, CY, 200, CX, CY, 660);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  const stars = [
    [72,95,1.8],[194,64,2.2],[340,88,1.1],[698,72,1.9],[887,115,1.6],
    [948,342,1.0],[975,598,1.7],[918,798,2.0],[798,948,1.1],[598,976,1.6],
    [198,918,2.1],[98,748,1.0],[58,498,1.6],[148,198,1.1],[748,175,1.0],
    [848,498,1.6],[450,70,1.0],[820,68,1.5],[974,200,1.0],[972,822,1.7],
    [820,974,1.1],[200,974,1.6],[900,450,1.2],[120,380,1.5],[680,920,1.3],
    [520,40,1.4],[30,310,1.5],[998,310,1.3],
  ];
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  for (const [x, y, r] of stars) { arc(x, y, r); ctx.fill(); }
}

// ─── 2. AMBIENT GLOW ───────────────────────────────────────────────────────
function drawAmbientGlow() {
  const pg = ctx.createRadialGradient(CX, CY, 40, CX, CY, 560);
  pg.addColorStop(0,   'rgba(95, 0, 210, 0.24)');
  pg.addColorStop(0.4, 'rgba(50, 0, 140, 0.13)');
  pg.addColorStop(1,   'rgba(0, 0, 0, 0)');
  ctx.fillStyle = pg;
  ctx.fillRect(0, 0, W, H);

  const wg = ctx.createRadialGradient(CX, CY, 0, CX, CY, 500);
  wg.addColorStop(0,    'rgba(255, 148, 0, 0.16)');
  wg.addColorStop(0.45, 'rgba(255, 80, 0, 0.08)');
  wg.addColorStop(1,    'rgba(0, 0, 0, 0)');
  ctx.fillStyle = wg;
  ctx.fillRect(0, 0, W, H);
}

// ─── 3. ORBIT RINGS ────────────────────────────────────────────────────────
function drawOrbitRing(rx, ry, rotation, colorRGB, glowColor, width, alpha) {
  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(rotation);
  ctx.shadowColor = glowColor;

  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.strokeStyle = `rgba(${colorRGB}, ${alpha * 0.35})`;
  ctx.lineWidth = width * 3.5;
  ctx.stroke();

  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.strokeStyle = `rgba(${colorRGB}, ${alpha})`;
  ctx.lineWidth = width;
  ctx.stroke();

  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.28})`;
  ctx.lineWidth = width * 0.3;
  ctx.stroke();

  ctx.restore();
}

function drawAllOrbitRings() {
  ctx.shadowBlur = 0;
  drawOrbitRing(448, 118,  Math.PI * 0.11, '55, 95, 255',  '#3355FF', 7, 0.88);
  drawOrbitRing(118, 438, -Math.PI * 0.08, '135, 35, 255', '#8822FF', 6, 0.78);
  drawOrbitRing(412, 88,   Math.PI * 0.36, '0, 195, 255',  '#00CCFF', 5, 0.62);
  ctx.shadowBlur = 0;
}

// ─── 4. COIN ───────────────────────────────────────────────────────────────
function drawCoin() {
  const R = 292;

  ctx.shadowBlur = 0;
  for (let i = 6; i >= 1; i--) {
    const gR  = R + i * 20;
    const a   = 0.04 + (7 - i) * 0.018;
    const grd = ctx.createRadialGradient(CX, CY, R - 30, CX, CY, gR);
    grd.addColorStop(0, `rgba(255, 165, 0, ${a})`);
    grd.addColorStop(1, 'rgba(255, 100, 0, 0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.shadowBlur = 48;
  ctx.shadowColor = '#FFAA00';
  arc(CX, CY, R);
  const rimGrd = ctx.createLinearGradient(CX - R, CY - R, CX + R, CY + R);
  rimGrd.addColorStop(0.0, '#9A6800');
  rimGrd.addColorStop(0.5, '#5C3600');
  rimGrd.addColorStop(1.0, '#3A1E00');
  ctx.fillStyle = rimGrd;
  ctx.fill();
  ctx.shadowBlur = 0;

  const faceR = R - 16;
  const fg = ctx.createRadialGradient(CX - 80, CY - 92, 12, CX + 40, CY + 55, faceR + 30);
  fg.addColorStop(0.00, '#FFF162');
  fg.addColorStop(0.10, '#FFD700');
  fg.addColorStop(0.42, '#FFAF00');
  fg.addColorStop(0.73, '#E07600');
  fg.addColorStop(1.00, '#7A3C00');
  arc(CX, CY, faceR);
  ctx.fillStyle = fg;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(CX, CY, R - 8, Math.PI * 1.10, Math.PI * 1.90);
  ctx.strokeStyle = 'rgba(255, 248, 185, 0.68)';
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CX, CY, R - 8, Math.PI * 0.10, Math.PI * 0.90);
  ctx.strokeStyle = 'rgba(35, 12, 0, 0.52)';
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.stroke();

  arc(CX, CY, R - 56);
  ctx.strokeStyle = 'rgba(55, 24, 0, 0.46)';
  ctx.lineWidth = 6;
  ctx.stroke();

  arc(CX, CY, R - 59);
  ctx.strokeStyle = 'rgba(255, 212, 88, 0.30)';
  ctx.lineWidth = 3;
  ctx.stroke();

  drawCoinSymbol();

  const shine = ctx.createRadialGradient(CX - 90, CY - 100, 0, CX - 90, CY - 100, 230);
  shine.addColorStop(0.00, 'rgba(255, 255, 255, 0.52)');
  shine.addColorStop(0.28, 'rgba(255, 252, 200, 0.20)');
  shine.addColorStop(0.55, 'rgba(255, 240, 150, 0.06)');
  shine.addColorStop(1.00, 'rgba(255, 255, 255, 0)');
  ctx.save();
  arc(CX, CY, faceR);
  ctx.clip();
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ─── 5. COIN SYMBOL ────────────────────────────────────────────────────────
function drawCoinSymbol() {
  ctx.save();
  ctx.translate(CX, CY);

  const halfW  = 54;
  const tipY   = 112;
  const baseY  = 52;
  const fill      = 'rgba(72, 34, 0, 0.62)';
  const edgeLight = 'rgba(255, 200, 60, 0.32)';
  const edgeDark  = 'rgba(18, 7, 0, 0.30)';

  function drawArrow(up) {
    const s = up ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(0,      s * tipY);
    ctx.lineTo(-halfW, s * baseY);
    ctx.lineTo( halfW, s * baseY);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, s * tipY);
    ctx.lineTo(s * halfW * (up ? -1 : 1), s * baseY);
    ctx.strokeStyle = edgeLight;
    ctx.lineWidth   = 2.5;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-halfW, s * baseY);
    ctx.lineTo( halfW, s * baseY);
    ctx.strokeStyle = edgeDark;
    ctx.lineWidth   = 2;
    ctx.stroke();
  }

  drawArrow(true);
  drawArrow(false);

  const dotG = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
  dotG.addColorStop(0, 'rgba(255, 238, 100, 0.55)');
  dotG.addColorStop(1, 'rgba(255, 210, 50,  0)');
  arc(0, 0, 14);
  ctx.fillStyle = dotG;
  ctx.fill();

  ctx.restore();
}

// ─── 6. SPARKLES ───────────────────────────────────────────────────────────
function drawSparkles() {
  const goldList = [
    [CX + 328, CY - 108, 14], [CX - 342, CY +  98, 12],
    [CX +  88, CY - 342, 13], [CX -  98, CY + 338, 11],
    [182, 248, 12], [838, 198, 10], [872, 742, 12],
    [168, 782, 11], [782, 858,  9], [240, 155,  8],
  ];
  const blueList = [
    [348, 158,  9], [692, 152,  9], [898, 542, 10],
    [132, 448,  9], [CX + 278, CY + 242, 8],
    [CX - 268, CY - 252, 7], [CX - 310, CY + 155, 8],
  ];

  ctx.save();
  for (const [x, y, r] of goldList) {
    ctx.shadowBlur = 16; ctx.shadowColor = '#FFAA00'; ctx.fillStyle = '#FFE055';
    sparkle4Path(x, y, r); ctx.fill();
  }
  for (const [x, y, r] of blueList) {
    ctx.shadowBlur = 14; ctx.shadowColor = '#5577FF'; ctx.fillStyle = '#AADDFF';
    sparkle4Path(x, y, r); ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── 7. PARTICLES ──────────────────────────────────────────────────────────
function drawParticles() {
  const list = [
    [CX + 218, CY - 252, 4.5, '#FFC030', '#FF9800'],
    [CX - 252, CY + 228, 3.5, '#FFB820', '#FF8800'],
    [CX + 268, CY + 212, 4.0, '#FFAA00', '#FF7700'],
    [CX - 228, CY - 248, 4.5, '#FFD040', '#FFB000'],
    [CX + 188, CY + 288, 3.0, '#88BBFF', '#4488FF'],
    [CX - 292, CY - 132, 3.5, '#AA66FF', '#7733EE'],
    [CX + 338, CY -  22, 3.0, '#66AAFF', '#3366EE'],
    [CX - 345, CY +  48, 3.5, '#BB77FF', '#8844EE'],
    [CX +  98, CY - 348, 3.0, '#FFD040', '#FFB000'],
    [CX - 108, CY + 358, 3.5, '#FFB820', '#FF9000'],
    [CX + 295, CY - 188, 2.5, '#99CCFF', '#4488EE'],
    [CX - 182, CY + 302, 2.5, '#88AAFF', '#3366DD'],
  ];

  ctx.save();
  for (const [x, y, r, fill, glow] of list) {
    ctx.shadowBlur = 12; ctx.shadowColor = glow; ctx.fillStyle = fill;
    arc(x, y, r); ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── RENDER & SAVE ─────────────────────────────────────────────────────────
ctx.lineCap  = 'round';
ctx.lineJoin = 'round';

drawBackground();
drawAmbientGlow();
drawAllOrbitRings();
drawCoin();
drawSparkles();
drawParticles();

// Output: public/coinbound-icon-1024.png
const outDir  = join(__dirname, '..', 'public');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'coinbound-icon-1024.png');
const buffer  = canvas.toBuffer('image/png');
writeFileSync(outPath, buffer);

console.log(`✅  Icon saved → ${outPath}`);
console.log(`    Size: ${(buffer.length / 1024).toFixed(1)} KB  |  1024 × 1024 px`);
