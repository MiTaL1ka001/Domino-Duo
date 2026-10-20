import React from 'react';
import { Trophy, ArrowLeft } from 'lucide-react';
import { SeatIndex } from '@domino-duo/shared';

interface GameHeaderProps {
  scores: readonly [number, number];
  targetScore: number;
  roundNumber: number;
  activeSeat: SeatIndex | null;
  mySeat: SeatIndex;
  activePlayerName: string;
  onLeave: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  scores,
  targetScore,
  roundNumber,
  activeSeat,
  mySeat,
  activePlayerName,
  onLeave
}) => {
  const isMyTurn = activeSeat === mySeat;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        backgroundColor: 'rgba(10, 32, 18, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        zIndex: 30,
        gap: '8px',
        flexWrap: 'wrap'
      }}
    >
      {/* Leave button */}
      <button
        onClick={onLeave}
        aria-label="Leave match"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'transparent',
          border: 'none',
          color: '#9ca3af',
          cursor: 'pointer',
          padding: '6px 8px',
          borderRadius: '6px',
          fontSize: '0.85rem',
          fontWeight: 600
        }}
      >
        <ArrowLeft size={16} />
        <span>Leave</span>
      </button>

      {/* Center Turn Status Banner */}
      <div
        style={{
          backgroundColor: isMyTurn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.3)',
          border: `1.5px solid ${isMyTurn ? '#34d399' : 'rgba(255, 255, 255, 0.15)'}`,
          borderRadius: '9999px',
          padding: '4px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isMyTurn ? '#34d399' : '#fbbf24',
            boxShadow: `0 0 8px ${isMyTurn ? '#34d399' : '#fbbf24'}`
          }}
        />
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: isMyTurn ? '#a7f3d0' : '#f3f4f6'
          }}
        >
          {isMyTurn ? 'YOUR TURN' : `Turn: ${activePlayerName}`}
        </span>
      </div>

      {/* Scoreboard */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          padding: '4px 10px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <Trophy size={14} color="#f59e0b" />
        
        {/* Team 0 (Sky) */}
        <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.88rem' }}>
          T1: {scores[0]}
        </span>

        <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.8rem' }}>vs</span>

        {/* Team 1 (Amber) */}
        <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.88rem' }}>
          T2: {scores[1]}
        </span>

        <span
          style={{
            fontSize: '0.72rem',
            color: '#9ca3af',
            marginLeft: '4px',
            borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
            paddingLeft: '6px'
          }}
        >
          R{roundNumber} (Goal: {targetScore})
        </span>
      </div>
    </div>
  );
};
