import { useCallback, useRef, useState } from 'react';
import {
  MAGNET_MAX_LEVEL,
  MAGNET_COSTS,
  LUCKY_CHARM_MAX_LEVEL,
  LUCKY_CHARM_COSTS,
  POWER_SURGE_MAX_LEVEL,
  POWER_SURGE_COSTS,
} from '../constants';
import { CosmeticType } from '../types';
import type { LeaderboardEntry } from '../types';

export interface UseStoreReturn {
  // Coins
  totalCoins: number;
  totalCoinsRef: React.MutableRefObject<number>;
  addRunCoins: (earned: number) => void;
  // Leaderboards
  scoreLeaderboard: LeaderboardEntry[];
  coinsLeaderboard: LeaderboardEntry[];
  bestScoreRef: React.MutableRefObject<number>;
  bestCoinsRef: React.MutableRefObject<number>;
  updateLeaderboards: (score: number, coins: number) => void;
  // Upgrades
  magnetLevel: number;
  magnetLevelRef: React.MutableRefObject<number>;
  luckyCharmLevel: number;
  luckyCharmLevelRef: React.MutableRefObject<number>;
  powerSurgeLevel: number;
  powerSurgeLevelRef: React.MutableRefObject<number>;
  buyMagnetUpgrade: () => void;
  buyLuckyCharmUpgrade: () => void;
  buyPowerSurgeUpgrade: () => void;
  // Cosmetics equip state (React state for UI)
  activeSkin: string;
  activeTrail: string;
  activeBg: string;
  activeCosmeticType: string;
  // Cosmetics equip state (refs for game loop)
  activeSkinRef: React.MutableRefObject<string>;
  activeTrailRef: React.MutableRefObject<string>;
  activeBgRef: React.MutableRefObject<string>;
  activeCosmeticTypeRef: React.MutableRefObject<string>;
  // Cosmetics actions
  unlockedCosmetics: Set<string>;
  unlockCosmetic: (id: string, cost: number) => void;
  equipSkin: (id: string) => void;
  equipTrail: (id: string) => void;
  equipBg: (id: string) => void;
  equipCosmeticType: (id: string) => void;
}

function ls(key: string, fallback: string): string {
  return localStorage.getItem(key) ?? fallback;
}
function lsInt(key: string, fallback: number): number {
  return parseInt(localStorage.getItem(key) ?? String(fallback), 10);
}

const LEADERBOARD_SIZE = 5;

function loadLeaderboard(key: string): LeaderboardEntry[] {
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

function insertLeaderboard(
  entries: LeaderboardEntry[],
  value: number,
): LeaderboardEntry[] {
  return [...entries, { value, datetime: new Date().toISOString() }]
    .sort((a, b) => b.value - a.value)
    .slice(0, LEADERBOARD_SIZE);
}

export function useStore(): UseStoreReturn {
  // ── Coins ────────────────────────────────────────────────────────────────
  const totalCoinsRef = useRef(lsInt('coinbound_total_coins', 0));
  const [totalCoins, setTotalCoinsState] = useState(totalCoinsRef.current);

  const setTotalCoins = useCallback((n: number) => {
    totalCoinsRef.current = n;
    localStorage.setItem('coinbound_total_coins', String(n));
    setTotalCoinsState(n);
  }, []);

  const addRunCoins = useCallback(
    (earned: number) => {
      setTotalCoins(totalCoinsRef.current + earned);
    },
    [setTotalCoins],
  );

  // ── Leaderboards ─────────────────────────────────────────────────────────
  const _initScores = loadLeaderboard('coinbound_score_leaderboard');
  const _initCoins = loadLeaderboard('coinbound_coins_leaderboard');
  const scoreLeaderboardRef = useRef(_initScores);
  const [scoreLeaderboard, setScoreLeaderboard] = useState(
    scoreLeaderboardRef.current,
  );

  const coinsLeaderboardRef = useRef(_initCoins);
  const [coinsLeaderboard, setCoinsLeaderboard] = useState(
    coinsLeaderboardRef.current,
  );

  const bestScoreRef = useRef(_initScores[0]?.value ?? 0);
  const bestCoinsRef = useRef(_initCoins[0]?.value ?? 0);

  const updateLeaderboards = useCallback((score: number, coins: number) => {
    const newScores = insertLeaderboard(scoreLeaderboardRef.current, score);
    scoreLeaderboardRef.current = newScores;
    bestScoreRef.current = newScores[0]?.value ?? 0;
    localStorage.setItem(
      'coinbound_score_leaderboard',
      JSON.stringify(newScores),
    );
    setScoreLeaderboard(newScores);

    const newCoins = insertLeaderboard(coinsLeaderboardRef.current, coins);
    coinsLeaderboardRef.current = newCoins;
    bestCoinsRef.current = newCoins[0]?.value ?? 0;
    localStorage.setItem(
      'coinbound_coins_leaderboard',
      JSON.stringify(newCoins),
    );
    setCoinsLeaderboard(newCoins);
  }, []);

  // ── Magnet upgrade ────────────────────────────────────────────────────────
  const magnetLevelRef = useRef(lsInt('coinbound_magnet_level', 0));
  const [magnetLevel, setMagnetLevelState] = useState(magnetLevelRef.current);

  const buyMagnetUpgrade = useCallback(() => {
    const level = magnetLevelRef.current;
    if (level >= MAGNET_MAX_LEVEL) return;
    const cost = MAGNET_COSTS[level];
    if (totalCoinsRef.current < cost) return;
    const newLevel = level + 1;
    magnetLevelRef.current = newLevel;
    localStorage.setItem('coinbound_magnet_level', String(newLevel));
    setMagnetLevelState(newLevel);
    setTotalCoins(totalCoinsRef.current - cost);
  }, [setTotalCoins]);

  // ── Lucky Charm upgrade ───────────────────────────────────────────────────
  const luckyCharmLevelRef = useRef(lsInt('coinbound_lucky_charm_level', 0));
  const [luckyCharmLevel, setLuckyCharmLevelState] = useState(
    luckyCharmLevelRef.current,
  );

  const buyLuckyCharmUpgrade = useCallback(() => {
    const level = luckyCharmLevelRef.current;
    if (level >= LUCKY_CHARM_MAX_LEVEL) return;
    const cost = LUCKY_CHARM_COSTS[level];
    if (totalCoinsRef.current < cost) return;
    const newLevel = level + 1;
    luckyCharmLevelRef.current = newLevel;
    localStorage.setItem('coinbound_lucky_charm_level', String(newLevel));
    setLuckyCharmLevelState(newLevel);
    setTotalCoins(totalCoinsRef.current - cost);
  }, [setTotalCoins]);

  // ── Power Surge upgrade ──────────────────────────────────────────────────
  const powerSurgeLevelRef = useRef(lsInt('coinbound_power_surge_level', 0));
  const [powerSurgeLevel, setPowerSurgeLevelState] = useState(
    powerSurgeLevelRef.current,
  );

  const buyPowerSurgeUpgrade = useCallback(() => {
    const level = powerSurgeLevelRef.current;
    if (level >= POWER_SURGE_MAX_LEVEL) return;
    const cost = POWER_SURGE_COSTS[level];
    if (totalCoinsRef.current < cost) return;
    const newLevel = level + 1;
    powerSurgeLevelRef.current = newLevel;
    localStorage.setItem('coinbound_power_surge_level', String(newLevel));
    setPowerSurgeLevelState(newLevel);
    setTotalCoins(totalCoinsRef.current - cost);
  }, [setTotalCoins]);

  // ── Active cosmetics (dual ref + state pattern) ───────────────────────────
  const activeSkinRef = useRef(ls('coinbound_active_skin', 'default'));
  const [activeSkin, setActiveSkinState] = useState(activeSkinRef.current);

  const activeTrailRef = useRef(ls('coinbound_active_trail', 'none'));
  const [activeTrail, setActiveTrailState] = useState(activeTrailRef.current);

  const activeBgRef = useRef(ls('coinbound_active_bg', 'void'));
  const [activeBg, setActiveBgState] = useState(activeBgRef.current);

  const activeCosmeticTypeRef = useRef(
    ls('coinbound_active_cosmetic_type', CosmeticType.Square),
  );
  const [activeCosmeticType, setActiveCosmeticTypeState] = useState(
    activeCosmeticTypeRef.current,
  );

  // ── Unlocked cosmetics ────────────────────────────────────────────────────
  const [unlockedCosmetics, setUnlockedCosmetics] = useState<Set<string>>(
    () => {
      const stored = localStorage.getItem('coinbound_cosmetics_unlocked');
      const ids: string[] = stored ? (JSON.parse(stored) as string[]) : [];
      return new Set(['default', 'none', 'void', CosmeticType.Square, ...ids]);
    },
  );

  const unlockCosmetic = useCallback(
    (id: string, cost: number) => {
      if (totalCoinsRef.current < cost) return;
      setTotalCoins(totalCoinsRef.current - cost);
      setUnlockedCosmetics((prev) => {
        const next = new Set(prev);
        next.add(id);
        localStorage.setItem(
          'coinbound_cosmetics_unlocked',
          JSON.stringify([...next]),
        );
        return next;
      });
    },
    [setTotalCoins],
  );

  const equipSkin = useCallback((id: string) => {
    activeSkinRef.current = id;
    localStorage.setItem('coinbound_active_skin', id);
    setActiveSkinState(id);
  }, []);

  const equipTrail = useCallback((id: string) => {
    activeTrailRef.current = id;
    localStorage.setItem('coinbound_active_trail', id);
    setActiveTrailState(id);
  }, []);

  const equipBg = useCallback((id: string) => {
    activeBgRef.current = id;
    localStorage.setItem('coinbound_active_bg', id);
    setActiveBgState(id);
  }, []);

  const equipCosmeticType = useCallback((id: string) => {
    activeCosmeticTypeRef.current = id;
    localStorage.setItem('coinbound_active_cosmetic_type', id);
    setActiveCosmeticTypeState(id);
  }, []);

  return {
    totalCoins,
    totalCoinsRef,
    addRunCoins,
    scoreLeaderboard,
    coinsLeaderboard,
    bestScoreRef,
    bestCoinsRef,
    updateLeaderboards,
    magnetLevel,
    magnetLevelRef,
    luckyCharmLevel,
    luckyCharmLevelRef,
    powerSurgeLevel,
    powerSurgeLevelRef,
    buyMagnetUpgrade,
    buyLuckyCharmUpgrade,
    buyPowerSurgeUpgrade,
    activeSkin,
    activeTrail,
    activeBg,
    activeCosmeticType,
    activeSkinRef,
    activeTrailRef,
    activeBgRef,
    activeCosmeticTypeRef,
    unlockedCosmetics,
    unlockCosmetic,
    equipSkin,
    equipTrail,
    equipBg,
    equipCosmeticType,
  };
}
