import React, { useState } from 'react';
import { UpgradeShopPanel } from './UpgradeShopPanel';
import { CosmeticsPanel } from './CosmeticsPanel';

export interface ShopContentProps {
  totalCoins: number;
  magnetLevel: number;
  onBuyMagnet: () => void;
  luckyCharmLevel: number;
  onBuyLuckyCharm: () => void;
  powerSurgeLevel: number;
  onBuyPowerSurge: () => void;
  unlocked: Set<string>;
  activeSkin: string;
  activeTrail: string;
  activeBg: string;
  activeCosmeticType: string;
  onUnlock: (id: string, cost: number) => void;
  onEquipSkin: (id: string) => void;
  onEquipTrail: (id: string) => void;
  onEquipBg: (id: string) => void;
  onEquipCosmeticType: (id: string) => void;
}

export function ShopContent(props: ShopContentProps) {
  const [tab, setTab] = useState<'upgrades' | 'cosmetics'>('upgrades');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '8px 0',
    cursor: 'pointer',
    background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
    color: active ? '#fff' : '#555',
    border: 'none',
    borderBottom: active ? '2px solid #00ff88' : '2px solid transparent',
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: active ? 'bold' : 'normal',
  });

  return (
    <>
      <div style={{ display: 'flex', marginBottom: 14 }}>
        <button
          style={tabStyle(tab === 'upgrades')}
          onClick={() => setTab('upgrades')}
        >
          ⚡ UPGRADES
        </button>
        <button
          style={tabStyle(tab === 'cosmetics')}
          onClick={() => setTab('cosmetics')}
        >
          🎨 COSMETICS
        </button>
      </div>
      {tab === 'upgrades' && (
        <UpgradeShopPanel
          totalCoins={props.totalCoins}
          magnetLevel={props.magnetLevel}
          onBuyMagnet={props.onBuyMagnet}
          luckyCharmLevel={props.luckyCharmLevel}
          onBuyLuckyCharm={props.onBuyLuckyCharm}
          powerSurgeLevel={props.powerSurgeLevel}
          onBuyPowerSurge={props.onBuyPowerSurge}
        />
      )}
      {tab === 'cosmetics' && (
        <CosmeticsPanel
          totalCoins={props.totalCoins}
          unlocked={props.unlocked}
          activeSkin={props.activeSkin}
          activeTrail={props.activeTrail}
          activeBg={props.activeBg}
          activeCosmeticType={props.activeCosmeticType}
          onUnlock={props.onUnlock}
          onEquipSkin={props.onEquipSkin}
          onEquipTrail={props.onEquipTrail}
          onEquipBg={props.onEquipBg}
          onEquipCosmeticType={props.onEquipCosmeticType}
        />
      )}
    </>
  );
}
