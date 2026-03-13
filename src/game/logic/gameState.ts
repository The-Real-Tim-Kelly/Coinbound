import {
  CANVAS_H,
  PLAYER_SIZE,
  INITIAL_SPEED,
  OBSTACLE_INTERVAL,
  COIN_INTERVAL,
  SHIELD_INTERVAL_MIN,
  SHIELD_INTERVAL_MAX,
  BREAKER_INTERVAL_MIN,
  BREAKER_INTERVAL_MAX,
  INVINCIBILITY_INTERVAL_MIN,
  INVINCIBILITY_INTERVAL_MAX,
  LUCKY_COIN_CHECK_INTERVAL,
} from '../constants';
import type { GameState } from '../types';

export function makeInitialState(hiScore = 0, hiCoins = 0): GameState {
  return {
    playerY: CANVAS_H / 2 - PLAYER_SIZE / 2,
    playerVY: 0,
    obstacles: [],
    coins: [],
    shieldPickups: [],
    breakerPickups: [],
    invincibilityPickups: [],
    coinCount: 0,
    hiCoins,
    score: 0,
    hiScore,
    gameOver: false,
    started: false,
    shieldActive: false,
    breakerActive: false,
    invincibilityActive: false,
    invincibilityTimer: 0,
    bounceAge: 0,
    breakerFlashAge: 0,
    deathAge: 0,
    speed: INITIAL_SPEED,
    frameCount: 0,
    lastSpawn: -OBSTACLE_INTERVAL,
    lastCoinSpawn: -COIN_INTERVAL,
    lastLuckySpawn: -LUCKY_COIN_CHECK_INTERVAL,
    nextShieldSpawn: Math.floor(
      SHIELD_INTERVAL_MIN +
        Math.random() * (SHIELD_INTERVAL_MAX - SHIELD_INTERVAL_MIN),
    ),
    nextBreakerSpawn: Math.floor(
      BREAKER_INTERVAL_MIN +
        Math.random() * (BREAKER_INTERVAL_MAX - BREAKER_INTERVAL_MIN),
    ),
    nextInvincSpawn: Math.floor(
      INVINCIBILITY_INTERVAL_MIN +
        Math.random() *
          (INVINCIBILITY_INTERVAL_MAX - INVINCIBILITY_INTERVAL_MIN),
    ),
    nextPowerUpAllowed: 0,
  };
}
