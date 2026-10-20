import React from 'react';
import { SeatIndex, TeamIndex, getTeamForSeat } from '@domino-duo/shared';

interface OpponentSeatProps {
  seat: SeatIndex;
  nickname: string;
  tileCount: number;
  isActiveTurn: boolean;
  position: 'top' | 'left' | 'right';
  isPartner: boolean;
}

export const OpponentSeat: React.FC<OpponentSeatProps> = ({
  seat,
  nickname,
  tileCount,
  isActiveTurn,
  isPartner
}) => {
  const team: TeamIndex = getTeamForSeat(seat);
  const isTeam0 = team === 0;
  const teamColor = isTeam0 ? '#38bdf8' : '#fbbf24';
  const teamBg = isTeam0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        position: 'relative'
      }}
    >
      {/* Avatar Container with Turn Ring */}
      <div
        className={isActiveTurn ? 'turn-active-ring' : ''}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: teamBg,
          border: `2px solid ${teamColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: teamColor,
          fontWeight: 800,
          fontSize: '1rem',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.35)',
          position: 'relative'
        }}
      >
        {nickname.charAt(0).toUpperCase()}

        {/* Tile count badge */}
        <div
          title={`${tileCount} tiles in hand`}
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-6px',
            backgroundColor: '#ffffff',
            color: '#18181b',
            fontSize: '0.7rem',
            fontWeight: 800,
            borderRadius: '9999px',
            padding: '1px 6px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
            border: '1px solid #d4d4cb'
          }}
        >
          {tileCount}
        </div>
      </div>

      {/* Name and Relationship */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: isActiveTurn ? '#34d399' : '#e5e7eb',
            maxWidth: '90px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {nickname}
        </div>
        {isPartner && (
          <div style={{ fontSize: '0.62rem', color: '#38bdf8', fontWeight: 800 }}>
            PARTNER
          </div>
        )}
      </div>
    </div>
  );
};
