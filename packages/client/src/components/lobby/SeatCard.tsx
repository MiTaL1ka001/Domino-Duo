import React from 'react';
import { User, Check, Clock, Bot } from 'lucide-react';
import { PlayerSlot } from '../../types/ui';
import { Badge } from '../common/Badge';

interface SeatCardProps {
  slot: PlayerSlot;
  isMySeat: boolean;
  isMyPartner: boolean;
}

export const SeatCard: React.FC<SeatCardProps> = ({
  slot,
  isMySeat,
  isMyPartner
}) => {
  const isTeam0 = slot.team === 0;
  const teamColor = isTeam0 ? '#38bdf8' : '#fbbf24';
  const teamBg = isTeam0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(245, 158, 11, 0.12)';
  const teamBorder = isTeam0 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(245, 158, 11, 0.35)';

  const isOccupied = slot.isOccupied ?? (slot.isConnected || slot.isBot || slot.nickname !== 'Waiting...');

  if (!isOccupied) {
    return (
      <div
        style={{
          backgroundColor: 'rgba(15, 30, 20, 0.5)',
          border: `1.5px dashed ${teamBorder}`,
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: 0.8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: `1.5px dashed ${teamColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: teamColor,
              opacity: 0.6
            }}
          >
            <User size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', color: '#9ca3af', fontWeight: 600 }}>
              Empty Seat
            </div>
            <div style={{ fontSize: '0.75rem', color: teamColor }}>
              Seat {slot.seat} • {isTeam0 ? 'Team A' : 'Team B'}
            </div>
          </div>
        </div>
        <Badge variant="warning" size="sm">
          Open
        </Badge>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'rgba(15, 35, 23, 0.85)',
        border: `1.5px solid ${isMySeat ? '#34d399' : teamBorder}`,
        borderRadius: '14px',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Avatar */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: teamBg,
            border: `2px solid ${teamColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: teamColor,
            fontWeight: 800,
            fontSize: '1.1rem'
          }}
        >
          {slot.nickname.charAt(0).toUpperCase()}
        </div>

        {/* Player info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.98rem', color: '#f9fafb' }}>
              {slot.nickname}
            </span>
            {isMySeat && (
              <span
                style={{
                  backgroundColor: '#34d399',
                  color: '#064e3b',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '4px'
                }}
              >
                YOU
              </span>
            )}
            {isMyPartner && !isMySeat && (
              <span
                style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  border: '1px solid rgba(56, 189, 248, 0.4)'
                }}
              >
                PARTNER
              </span>
            )}
            {slot.isBot && (
              <span title="Simulated Player" style={{ display: 'inline-flex' }}>
                <Bot size={13} color="#9ca3af" />
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontSize: '0.78rem', color: teamColor, fontWeight: 600 }}>
              Seat {slot.seat} • {isTeam0 ? 'Team A (Sky)' : 'Team B (Amber)'}
            </span>
          </div>
        </div>
      </div>

      {/* Ready Status */}
      <div>
        {slot.isReady ? (
          <Badge variant="success" size="sm">
            <Check size={12} />
            Ready
          </Badge>
        ) : (
          <Badge variant="warning" size="sm">
            <Clock size={12} />
            Waiting
          </Badge>
        )}
      </div>
    </div>
  );
};
