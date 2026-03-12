import {
  CANVAS_H,
  PLAYER_SIZE,
  INITIAL_SPEED,
  OBSTACLE_INTERVAL,
  COIN_INTERVAL,
  SHIELD_INTERVAL,
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
    coinCount: 0,
    hiCoins,
    score: 0,
    hiScore,
    gameOver: false,
    started: false,
    shieldActive: false,
    bounceAge: 0,
    deathAge: 0,
    speed: INITIAL_SPEED,
    frameCount: 0,
    lastSpawn: -OBSTACLE_INTERVAL,
    lastCoinSpawn: -COIN_INTERVAL,
    lastShieldSpawn: -SHIELD_INTERVAL,
    lastLuckySpawn: -LUCKY_COIN_CHECK_INTERVAL,
  };
}
