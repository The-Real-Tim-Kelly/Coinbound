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
export const GAP_MIN = PLAYER_SIZE + 28; // absolute floor: player always fits (62 px)
export const GAP_NORMAL_MIN = 190;
export const GAP_NORMAL_MAX = 285;
export const GAP_NARROW_MIN = PLAYER_SIZE + 28; // challenge gap lower bound
export const GAP_NARROW_MAX = 160; // challenge gap upper bound
export const GAP_NARROW_CHANCE = 0.15; // 15 % of spawns are challenge gaps
export const MIN_SLAB_H = 50; // thinnest a wall slab may be

// ─── Coins ────────────────────────────────────────────────────────────────────
export const COIN_RADIUS = 10;
export const COIN_INTERVAL = 145;
export const RARE_COIN_CHANCE_MIN = 0.04; // chance at game start
export const RARE_COIN_CHANCE_MAX = 0.22; // maximum chance (reached over time)
export const RARE_COIN_CHANCE_GROWTH = 0.00004; // per-frame chance increase
export const RARE_COIN_VALUE = 5;
export const SPAWN_SAFE_MARGIN = 18;
export const MAX_SPAWN_ATTEMPTS = 30;

// ─── Shield power-up ─────────────────────────────────────────────────────────
export const SHIELD_RADIUS = 13;
export const SHIELD_INTERVAL_MIN = 1080; // ~18 s at 60 fps
export const SHIELD_INTERVAL_MAX = 1680; // ~28 s at 60 fps
export const SHIELD_BOUNCE_VY = 9; // vertical speed when shield bounces player
export const SHIELD_BOUNCE_PUSHBACK = 260; // px to push all obstacles rightward
export const SHIELD_BOUNCE_DURATION = 38; // frames of bounce flash + shake

// ─── Breaker power-up ─────────────────────────────────────────────────────────
export const BREAKER_RADIUS = 13;
export const BREAKER_INTERVAL_MIN = 1620; // ~27 s at 60 fps
export const BREAKER_INTERVAL_MAX = 2400; // ~40 s at 60 fps
export const BREAKER_FLASH_DURATION = 30; // frames of orange flash on obstacle break

// ─── Invincibility power-up ───────────────────────────────────────────────────
export const INVINCIBILITY_RADIUS = 13;
export const INVINCIBILITY_INTERVAL_MIN = 1440; // ~24 s at 60 fps
export const INVINCIBILITY_INTERVAL_MAX = 2100; // ~35 s at 60 fps
export const INVINCIBILITY_DURATION = 420; // frames the effect lasts (~7 s at 60 fps)
export const INVINCIBILITY_BLINK_START = 90; // frames before end when player starts blinking (~1.5 s warning)

// ─── Power-up global cooldown ─────────────────────────────────────────────────
// Randomised gap between any two power-up spawns — prevents clustering while
// keeping each run feel slightly different.
export const POWER_UP_GLOBAL_COOLDOWN_MIN = 360; // ~6 s at 60 fps
export const POWER_UP_GLOBAL_COOLDOWN_MAX = 600; // ~10 s at 60 fps

// ─── Upgrades ────────────────────────────────────────────────────────────────
export const MAGNET_MAX_LEVEL = 5;
export const BASE_MAGNET_RADIUS = 40; // base attraction radius once any magnet level is owned
export const MAGNET_RADIUS_PER_LEVEL = 25; // additional px per upgrade level
export const MAGNET_COSTS = [20, 50, 100, 200, 400]; // coin cost per upgrade level

export const LUCKY_CHARM_MAX_LEVEL = 5;
export const LUCKY_CHARM_COSTS = [15, 35, 75, 150, 300];
export const LUCKY_CHARM_BONUS_PER_LEVEL = 0.15; // +15% extra-spawn chance per level
export const LUCKY_COIN_CHECK_INTERVAL = 55; // frames between bonus spawn roll checks

export const POWER_SURGE_MAX_LEVEL = 5;
export const POWER_SURGE_COSTS = [25, 60, 120, 250, 500];
// Each level reduces power-up spawn intervals by 8% (multiplicative).
// At max level the factor is 0.60, keeping power-ups rare but more accessible.
export const POWER_SURGE_INTERVAL_REDUCTION_PER_LEVEL = 0.08;

// ─── Adaptive quality scale ───────────────────────────────────────────────────
// Detect low-end devices at module load; reduce particle caps to keep 60 fps.
// Signals: ≤4 CPU cores (budget mobile) or ≤2 GB device memory (Chrome only).
const _lowEnd =
  navigator.hardwareConcurrency <= 4 ||
  (typeof (navigator as unknown as { deviceMemory?: number }).deviceMemory ===
    'number' &&
    (navigator as unknown as { deviceMemory: number }).deviceMemory <= 2);
/** 1.0 on capable devices; 0.6 on budget/low-RAM mobile. */
export const PERF_SCALE = _lowEnd ? 0.6 : 1.0;

// ─── Particle caps (limits simultaneous particles to avoid mobile lag) ────────
export const MAX_TRAIL_PARTICLES = Math.round(80 * PERF_SCALE);
export const MAX_MAG_PARTICLES = Math.round(40 * PERF_SCALE);
export const MAX_CEIL_PARTICLES = Math.round(30 * PERF_SCALE);
export const MAX_SHIELD_SHARDS = Math.round(30 * PERF_SCALE);
export const MAX_RARE_COIN_PARTICLES = Math.round(60 * PERF_SCALE);
export const MAX_FLOATING_TEXTS = 8;
export const MAX_BREAKER_PARTICLES = Math.round(80 * PERF_SCALE);

// ─── Death animation ────────────────────────────────────────────────────────
export const DEATH_ANIM_DURATION = 26; // frames (~433 ms at 60 fps)
export const MAX_DEATH_PARTICLES = Math.round(30 * PERF_SCALE);

// ─── Audio ────────────────────────────────────────────────────────────────────
export const MUSIC_BPM = 120; // synthwave tempo
export const MUSIC_STEP_S = 60 / MUSIC_BPM / 4; // 16th-note duration in seconds
export const MUSIC_LOOKAHEAD_S = 0.14; // schedule notes this far ahead
export const MUSIC_SCHEDULER_MS = 25; // ms between scheduler ticks
