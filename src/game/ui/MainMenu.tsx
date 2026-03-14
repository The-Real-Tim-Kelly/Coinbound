import { useState } from 'react';
import type { LeaderboardEntry } from '../types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }) +
    ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  );
}

const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#aaaaaa', '#888888'];

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  valueLabel: string;
  valueColor: string;
}

function LeaderboardTable({
  entries,
  valueLabel,
  valueColor,
}: LeaderboardTableProps) {
  const thStyle: React.CSSProperties = {
    fontSize: 9,
    letterSpacing: 1,
    color: '#556677',
    paddingBottom: 4,
    textAlign: 'center',
    fontWeight: 'bold',
  };
  const tdStyle: React.CSSProperties = {
    fontSize: 'clamp(10px, 2.5vw, 12px)',
    padding: '3px 2px',
    textAlign: 'center',
  };

  if (entries.length === 0) {
    return (
      <div
        style={{
          color: '#445566',
          fontSize: 11,
          textAlign: 'center',
          padding: '10px 0',
        }}
      >
        No runs yet. Play to set a record!
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ ...thStyle, width: '18%' }}>RANK</th>
          <th style={{ ...thStyle, width: '26%' }}>{valueLabel}</th>
          <th style={{ ...thStyle }}>DATE</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr
            key={i}
            style={{
              background: i === 0 ? 'rgba(255,215,0,0.06)' : 'transparent',
              borderTop: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <td
              style={{
                ...tdStyle,
                color: rankColors[i] ?? '#888',
                fontWeight: 'bold',
              }}
            >
              #{i + 1}
            </td>
            <td
              style={{
                ...tdStyle,
                color: valueColor,
                fontWeight: i === 0 ? 'bold' : 'normal',
              }}
            >
              {e.value}
            </td>
            <td
              style={{
                ...tdStyle,
                color: '#667788',
                fontSize: 'clamp(9px, 2vw, 11px)',
              }}
            >
              {formatDate(e.datetime)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface MainMenuProps {
  totalCoins: number;
  scoreLeaderboard: LeaderboardEntry[];
  coinsLeaderboard: LeaderboardEntry[];
  onPlay: () => void;
  onShop: () => void;
  onSettings: () => void;
}

export function MainMenu({
  totalCoins,
  scoreLeaderboard,
  coinsLeaderboard,
  onPlay,
  onShop,
  onSettings,
}: MainMenuProps) {
  const [activeTab, setActiveTab] = useState<'score' | 'coins'>('score');
  const hasAnyEntry =
    scoreLeaderboard.length > 0 || coinsLeaderboard.length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.62)',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: 'rgba(10,10,28,0.97)',
          border: '2px solid #2a2a4a',
          borderRadius: 18,
          padding: 'clamp(24px, 5vw, 44px) clamp(20px, 6vw, 52px)',
          textAlign: 'center',
          fontFamily: 'monospace',
          color: '#fff',
          width: 'min(90vw, 340px)',
          boxShadow: '0 0 60px rgba(0,0,0,0.9), 0 0 30px rgba(0,255,136,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(28px, 8vw, 48px)',
            fontWeight: 'bold',
            color: '#00ff88',
            textShadow: '0 0 24px #00ff88, 0 0 48px rgba(0,255,136,0.4)',
            letterSpacing: 3,
            marginBottom: 6,
          }}
        >
          COINBOUND
        </div>
        <div
          style={{
            fontSize: 'clamp(10px, 2.5vw, 13px)',
            color: '#556677',
            marginBottom: 16,
          }}
        >
          Hold to pull up · Release to fall
        </div>
        <div
          style={{
            fontSize: 'clamp(12px, 3vw, 14px)',
            color: '#ffd700',
            marginBottom: 16,
          }}
        >
          💰 {totalCoins} coins
        </div>

        {/* Leaderboard */}
        <div style={{ width: '100%', marginBottom: 18 }}>
          {/* Tab row */}
          <div
            style={{
              display: 'flex',
              marginBottom: 8,
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {(['score', 'coins'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    fontSize: 10,
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    letterSpacing: 1,
                    cursor: 'pointer',
                    border: 'none',
                    background: isActive
                      ? 'rgba(255,215,0,0.15)'
                      : 'transparent',
                    color: isActive ? '#ffd700' : '#445566',
                    transition: 'background 0.15s',
                  }}
                >
                  {tab === 'score' ? '🏆 SCORE' : '💰 COINS'}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div style={{ minHeight: hasAnyEntry ? undefined : 40 }}>
            {activeTab === 'score' ? (
              <LeaderboardTable
                entries={scoreLeaderboard}
                valueLabel="SCORE"
                valueColor="#00ff88"
              />
            ) : (
              <LeaderboardTable
                entries={coinsLeaderboard}
                valueLabel="COINS"
                valueColor="#ffd700"
              />
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            width: '100%',
          }}
        >
          <button
            onClick={onPlay}
            style={{
              background: '#00ff88',
              color: '#000',
              border: 'none',
              borderRadius: 10,
              padding: 'clamp(10px, 2.5vw, 14px) 0',
              fontSize: 'clamp(14px, 3.5vw, 18px)',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: 'pointer',
              letterSpacing: 2,
              width: '100%',
              boxShadow: '0 0 20px rgba(0,255,136,0.4)',
            }}
          >
            ▶ PLAY
          </button>
          <button
            onClick={onShop}
            style={{
              background: 'rgba(0,200,255,0.1)',
              color: '#00ccff',
              border: '1px solid rgba(0,200,255,0.35)',
              borderRadius: 10,
              padding: 'clamp(10px, 2.5vw, 14px) 0',
              fontSize: 'clamp(13px, 3.2vw, 16px)',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: 'pointer',
              letterSpacing: 1,
              width: '100%',
            }}
          >
            🛍 STORE
          </button>
          <button
            onClick={onSettings}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#aaaaaa',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              padding: 'clamp(10px, 2.5vw, 14px) 0',
              fontSize: 'clamp(13px, 3.2vw, 16px)',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              cursor: 'pointer',
              letterSpacing: 1,
              width: '100%',
            }}
          >
            ⚙️ SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
}
