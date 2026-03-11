import { useCallback, useRef, useState } from 'react';
import {
  MAGNET_MAX_LEVEL,
  MAGNET_COSTS,
  LUCKY_CHARM_MAX_LEVEL,
  LUCKY_CHARM_COSTS,
} from '../constants';
import { CosmeticType } from '../types';

export interface UseStoreReturn {
  // Coins
  totalCoins: number;
  totalCoinsRef: React.MutableRefObject<number>;
  addRunCoins: (earned: number) => void;
  // Upgrades
  magnetLevel: number;
  magnetLevelRef: React.MutableRefObject<number>;
  luckyCharmLevel: number;
  luckyCharmLevelRef: React.MutableRefObject<number>;
  buyMagnetUpgrade: () => void;
  buyLuckyCharmUpgrade: () => void;
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
    magnetLevel,
    magnetLevelRef,
    luckyCharmLevel,
    luckyCharmLevelRef,
    buyMagnetUpgrade,
    buyLuckyCharmUpgrade,
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
