// ─── Canvas / Player ─────────────────────────────────────────────────────────
export const CANVAS_W = 480;
export const CANVAS_H = 640;
export const PLAYER_X = 90;
export const PLAYER_SIZE = 34;

// ─── Physics ─────────────────────────────────────────────────────────────────
export const GRAVITY = 0.55;
export const MAX_VY = 13;
export const HOLD_GRAVITY = 0.8; // upward acceleration while player holds input
export const INITIAL_SPEED = 3.5;
export const SPEED_INCREMENT = 0.0008; // per frame

// ─── Obstacles ───────────────────────────────────────────────────────────────
export const OBSTACLE_INTERVAL = 75; // frames between spawns
export const MIN_OBSTACLE_SPACING = 195; // px clear before next spawn

// ─── Gap sizing ───────────────────────────────────────────────────────────────
export const GAP_MIN = PLAYER_SIZE + 20; // absolute floor: player always fits (54 px)
export const GAP_NORMAL_MIN = 175;
export const GAP_NORMAL_MAX = 285;
export const GAP_NARROW_MIN = PLAYER_SIZE + 20; // challenge gap lower bound
export const GAP_NARROW_MAX = 148; // challenge gap upper bound
export const GAP_NARROW_CHANCE = 0.15; // 15 % of spawns are challenge gaps
export const MIN_SLAB_H = 50; // thinnest a wall slab may be

// ─── Coins ────────────────────────────────────────────────────────────────────
export const COIN_RADIUS = 10;
export const COIN_INTERVAL = 120;
export const RARE_COIN_CHANCE = 0.12;
export const RARE_COIN_VALUE = 5;
export const SPAWN_SAFE_MARGIN = 18;
export const MAX_SPAWN_ATTEMPTS = 30;

// ─── Shield power-up ─────────────────────────────────────────────────────────
export const SHIELD_RADIUS = 13;
export const SHIELD_INTERVAL = 420; // frames between shield spawns (rare)
export const SHIELD_BOUNCE_VY = 9; // vertical speed when shield bounces player
export const SHIELD_BOUNCE_PUSHBACK = 190; // px to push all obstacles rightward
export const SHIELD_BOUNCE_DURATION = 38; // frames of bounce flash + shake

// ─── Upgrades ────────────────────────────────────────────────────────────────
export const MAGNET_MAX_LEVEL = 5;
export const MAGNET_RADIUS_PER_LEVEL = 60; // px of attraction radius per level
export const MAGNET_COSTS = [20, 50, 100, 200, 400]; // coin cost per upgrade level

export const LUCKY_CHARM_MAX_LEVEL = 5;
export const LUCKY_CHARM_COSTS = [15, 35, 75, 150, 300];
export const LUCKY_CHARM_BONUS_PER_LEVEL = 0.15; // +15% extra-spawn chance per level
export const LUCKY_COIN_CHECK_INTERVAL = 55; // frames between bonus spawn roll checks

// ─── Particle caps (limits simultaneous particles to avoid mobile lag) ────────
export const MAX_TRAIL_PARTICLES = 80;
export const MAX_MAG_PARTICLES = 40;
export const MAX_CEIL_PARTICLES = 30;
export const MAX_SHIELD_SHARDS = 30;
export const MAX_RARE_COIN_PARTICLES = 60;
export const MAX_FLOATING_TEXTS = 8;

// ─── Death animation ────────────────────────────────────────────────────────
export const DEATH_ANIM_DURATION = 26; // frames (~433 ms at 60 fps)
export const MAX_DEATH_PARTICLES = 30;

// ─── Audio ────────────────────────────────────────────────────────────────────
export const MUSIC_BPM = 120; // synthwave tempo
export const MUSIC_STEP_S = 60 / MUSIC_BPM / 4; // 16th-note duration in seconds
export const MUSIC_LOOKAHEAD_S = 0.14; // schedule notes this far ahead
export const MUSIC_SCHEDULER_MS = 25; // ms between scheduler ticks
