import type { PlayerSkin, TrailDef, BgTheme, CosmeticShape } from '../types';
export { CosmeticType } from '../types';

export const PLAYER_SKINS: PlayerSkin[] = [
  {
    id: 'default',
    name: 'Default',
    icon: '🟩',
    cost: 0,
    color1: '#00ff99',
    color2: '#009944',
    glow: '#00ff88',
    dirColor: 'rgba(255,255,255,0.85)',
  },
  {
    id: 'cyber',
    name: 'Cyber',
    icon: '🔷',
    cost: 50,
    color1: '#00ccff',
    color2: '#0044aa',
    glow: '#00ccff',
    dirColor: 'rgba(255,255,255,0.85)',
  },
  {
    id: 'fire',
    name: 'Fire',
    icon: '🔥',
    cost: 80,
    color1: '#ff8800',
    color2: '#cc2200',
    glow: '#ff5500',
    dirColor: 'rgba(255,220,100,0.9)',
  },
  {
    id: 'ice',
    name: 'Ice',
    icon: '❄️',
    cost: 120,
    color1: '#ccf0ff',
    color2: '#3399cc',
    glow: '#88ddff',
    dirColor: 'rgba(200,240,255,0.9)',
  },
  {
    id: 'gold',
    name: 'Gold',
    icon: '⭐',
    cost: 300,
    color1: '#ffd700',
    color2: '#b8860b',
    glow: '#ffd700',
    dirColor: 'rgba(0,0,0,0.75)',
  },
];

export const TRAIL_DEFS: TrailDef[] = [
  { id: 'none', name: 'None', icon: '✖️', cost: 0 },
  { id: 'sparks', name: 'Sparks', icon: '✨', cost: 40 },
  { id: 'stars', name: 'Stars', icon: '⭐', cost: 70 },
  { id: 'ghost', name: 'Ghost', icon: '👻', cost: 100 },
  { id: 'rainbow', name: 'Rainbow', icon: '🌈', cost: 200 },
];

export const BG_THEMES: BgTheme[] = [
  {
    id: 'void',
    name: 'Void',
    icon: '🌑',
    cost: 0,
    bg: '#0f0f23',
    lineColor: '#2a2a4a',
  },
  {
    id: 'space',
    name: 'Deep Space',
    icon: '🌌',
    cost: 60,
    bg: '#000010',
    lineColor: '#111133',
  },
  {
    id: 'neon',
    name: 'Neon City',
    icon: '🌃',
    cost: 90,
    bg: '#0d001a',
    lineColor: '#440055',
  },
  {
    id: 'lava',
    name: 'Lava',
    icon: '🌋',
    cost: 150,
    bg: '#1a0400',
    lineColor: '#551100',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: '🌊',
    cost: 180,
    bg: '#000f20',
    lineColor: '#003366',
  },
];

export const COSMETIC_SHAPES: CosmeticShape[] = [
  { id: 'square', name: 'Square', icon: '⬛', cost: 0 },
  { id: 'circle', name: 'Circle', icon: '🔵', cost: 30 },
  { id: 'airplane', name: 'Airplane', icon: '✈️', cost: 75 },
  { id: 'spaceship', name: 'Spaceship', icon: '🚀', cost: 120 },
  { id: 'ufo', name: 'UFO', icon: '🛸', cost: 200 },
];
