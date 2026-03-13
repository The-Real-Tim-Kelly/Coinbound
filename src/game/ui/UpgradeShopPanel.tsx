import React from 'react';
import {
  MAGNET_MAX_LEVEL,
  MAGNET_COSTS,
  MAGNET_RADIUS_PER_LEVEL,
  LUCKY_CHARM_MAX_LEVEL,
  LUCKY_CHARM_COSTS,
  LUCKY_CHARM_BONUS_PER_LEVEL,
  POWER_SURGE_MAX_LEVEL,
  POWER_SURGE_COSTS,
  POWER_SURGE_INTERVAL_REDUCTION_PER_LEVEL,
} from '../constants';

interface UpgradeShopPanelProps {
  totalCoins: number;
  magnetLevel: number;
  onBuyMagnet: () => void;
  luckyCharmLevel: number;
  onBuyLuckyCharm: () => void;
  powerSurgeLevel: number;
  onBuyPowerSurge: () => void;
}

export function UpgradeShopPanel({
  totalCoins,
  magnetLevel,
  onBuyMagnet,
  luckyCharmLevel,
  onBuyLuckyCharm,
  powerSurgeLevel,
  onBuyPowerSurge,
}: UpgradeShopPanelProps) {
  const canAffordMagnet =
    magnetLevel < MAGNET_MAX_LEVEL && totalCoins >= MAGNET_COSTS[magnetLevel];
  const canAffordLucky =
    luckyCharmLevel < LUCKY_CHARM_MAX_LEVEL &&
    totalCoins >= LUCKY_CHARM_COSTS[luckyCharmLevel];
  const canAffordSurge =
    powerSurgeLevel < POWER_SURGE_MAX_LEVEL &&
    totalCoins >= POWER_SURGE_COSTS[powerSurgeLevel];

  const upgradeRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 10,
  };

  const btnStyle = (canAfford: boolean): React.CSSProperties => ({
    background: canAfford ? undefined : 'rgba(255,255,255,0.05)',
    color: canAfford ? '#000' : '#444',
    border: canAfford ? 'none' : '1px solid #333',
    borderRadius: 6,
    padding: '7px 12px',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    cursor: canAfford ? 'pointer' : 'not-allowed',
    whiteSpace: 'nowrap' as const,
  });

  return (
    <>
      <div style={{ fontSize: 14, color: '#ffd700', marginBottom: 14 }}>
        💰 Wallet: {totalCoins} coins
      </div>

      {/* Magnet */}
      <div
        style={{
          ...upgradeRowStyle,
          background: 'rgba(0,200,255,0.08)',
          border: '1px solid rgba(0,200,255,0.2)',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#00ccff' }}>
            🧲 MAGNET
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>
            {magnetLevel === 0
              ? 'Attracts nearby coins'
              : `Radius: ${magnetLevel * MAGNET_RADIUS_PER_LEVEL}px`}
            {' · Lv '}
            {magnetLevel}/{MAGNET_MAX_LEVEL}
          </div>
        </div>
        {magnetLevel < MAGNET_MAX_LEVEL ? (
          <button
            onClick={onBuyMagnet}
            disabled={!canAffordMagnet}
            style={{
              ...btnStyle(canAffordMagnet),
              background: canAffordMagnet ? '#00ccff' : undefined,
            }}
          >
            ↑ {MAGNET_COSTS[magnetLevel]} 🪙
          </button>
        ) : (
          <span style={{ color: '#00ff88', fontSize: 13, fontWeight: 'bold' }}>
            ✓ MAX
          </span>
        )}
      </div>

      {/* Lucky Charm */}
      <div
        style={{
          ...upgradeRowStyle,
          background: 'rgba(255,215,0,0.07)',
          border: '1px solid rgba(255,215,0,0.22)',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#ffd700' }}>
            🍀 LUCKY CHARM
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>
            {luckyCharmLevel === 0
              ? 'Increases coin spawn chance'
              : `+${Math.round(luckyCharmLevel * LUCKY_CHARM_BONUS_PER_LEVEL * 100)}% more coins`}
            {' · Lv '}
            {luckyCharmLevel}/{LUCKY_CHARM_MAX_LEVEL}
          </div>
        </div>
        {luckyCharmLevel < LUCKY_CHARM_MAX_LEVEL ? (
          <button
            onClick={onBuyLuckyCharm}
            disabled={!canAffordLucky}
            style={{
              ...btnStyle(canAffordLucky),
              background: canAffordLucky ? '#ffd700' : undefined,
            }}
          >
            ↑ {LUCKY_CHARM_COSTS[luckyCharmLevel]} 🪙
          </button>
        ) : (
          <span style={{ color: '#00ff88', fontSize: 13, fontWeight: 'bold' }}>
            ✓ MAX
          </span>
        )}
      </div>

      {/* Power Surge */}
      <div
        style={{
          ...upgradeRowStyle,
          background: 'rgba(180,0,255,0.08)',
          border: '1px solid rgba(180,0,255,0.25)',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#cc44ff' }}>
            ⚡ POWER SURGE
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>
            {powerSurgeLevel === 0
              ? 'More frequent Shield, Breaker & Ghost'
              : `-${Math.round(powerSurgeLevel * POWER_SURGE_INTERVAL_REDUCTION_PER_LEVEL * 100)}% power-up intervals`}
            {' · Lv '}
            {powerSurgeLevel}/{POWER_SURGE_MAX_LEVEL}
          </div>
        </div>
        {powerSurgeLevel < POWER_SURGE_MAX_LEVEL ? (
          <button
            onClick={onBuyPowerSurge}
            disabled={!canAffordSurge}
            style={{
              ...btnStyle(canAffordSurge),
              background: canAffordSurge ? '#cc44ff' : undefined,
            }}
          >
            ↑ {POWER_SURGE_COSTS[powerSurgeLevel]} 🪙
          </button>
        ) : (
          <span style={{ color: '#00ff88', fontSize: 13, fontWeight: 'bold' }}>
            ✓ MAX
          </span>
        )}
      </div>
    </>
  );
}
