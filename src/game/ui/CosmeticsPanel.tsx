import React, { useState } from 'react';
import {
  PLAYER_SKINS,
  TRAIL_DEFS,
  BG_THEMES,
  COSMETIC_SHAPES,
} from '../data/cosmetics';

interface CosmeticsPanelProps {
  totalCoins: number;
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

export function CosmeticsPanel({
  totalCoins,
  unlocked,
  activeSkin,
  activeTrail,
  activeBg,
  activeCosmeticType,
  onUnlock,
  onEquipSkin,
  onEquipTrail,
  onEquipBg,
  onEquipCosmeticType,
}: CosmeticsPanelProps) {
  const [subtab, setSubtab] = useState<
    'shapes' | 'skins' | 'trails' | 'backgrounds'
  >('shapes');

  function renderGrid<
    T extends { id: string; name: string; icon: string; cost: number },
  >(items: T[], activeId: string, onEquip: (id: string) => void) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginTop: 10,
        }}
      >
        {items.map((item) => {
          const owned = item.cost === 0 || unlocked.has(item.id);
          const equipped = activeId === item.id;
          const canAfford = totalCoins >= item.cost;
          return (
            <div
              key={item.id}
              onClick={() => {
                if (owned) onEquip(item.id);
                else if (canAfford) {
                  onUnlock(item.id, item.cost);
                  onEquip(item.id);
                }
              }}
              style={{
                border: equipped ? '2px solid #00ff88' : '1px solid #333',
                borderRadius: 8,
                padding: '8px 6px',
                textAlign: 'center',
                cursor: owned || canAfford ? 'pointer' : 'not-allowed',
                background: equipped
                  ? 'rgba(0,255,136,0.09)'
                  : 'rgba(255,255,255,0.03)',
                opacity: !owned && !canAfford ? 0.35 : 1,
              }}
            >
              <div style={{ fontSize: 20 }}>{item.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 'bold', marginTop: 3 }}>
                {item.name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  marginTop: 3,
                  color: equipped
                    ? '#00ff88'
                    : owned
                      ? 'rgba(255,255,255,0.35)'
                      : canAfford
                        ? '#ffd700'
                        : '#444',
                }}
              >
                {equipped ? '✓ ON' : owned ? 'EQUIP' : `${item.cost} 🪙`}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const subBtn = (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
    color: active ? '#fff' : '#555',
    border: active
      ? '1px solid rgba(255,255,255,0.2)'
      : '1px solid transparent',
    borderRadius: 5,
    padding: '4px 10px',
    fontSize: 11,
    fontFamily: 'monospace',
    cursor: 'pointer',
    fontWeight: active ? 'bold' : 'normal',
  });

  return (
    <>
      <div style={{ fontSize: 14, color: '#ffd700', marginBottom: 14 }}>
        💰 Wallet: {totalCoins} coins
      </div>
      <div
        style={{
          display: 'flex',
          gap: 4,
          justifyContent: 'center',
          marginBottom: 4,
          flexWrap: 'wrap',
        }}
      >
        <button
          style={subBtn(subtab === 'shapes')}
          onClick={() => setSubtab('shapes')}
        >
          🔷 SHAPES
        </button>
        <button
          style={subBtn(subtab === 'skins')}
          onClick={() => setSubtab('skins')}
        >
          🎨 SKINS
        </button>
        <button
          style={subBtn(subtab === 'trails')}
          onClick={() => setSubtab('trails')}
        >
          ✨ TRAILS
        </button>
        <button
          style={subBtn(subtab === 'backgrounds')}
          onClick={() => setSubtab('backgrounds')}
        >
          🖼 BG
        </button>
      </div>
      {subtab === 'shapes' &&
        renderGrid(COSMETIC_SHAPES, activeCosmeticType, onEquipCosmeticType)}
      {subtab === 'skins' && renderGrid(PLAYER_SKINS, activeSkin, onEquipSkin)}
      {subtab === 'trails' && renderGrid(TRAIL_DEFS, activeTrail, onEquipTrail)}
      {subtab === 'backgrounds' && renderGrid(BG_THEMES, activeBg, onEquipBg)}
    </>
  );
}
