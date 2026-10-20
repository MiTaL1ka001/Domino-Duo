import React from 'react';
import { Sparkles, Bot, Eye, RefreshCw } from 'lucide-react';
import { SeatIndex } from '@domino-duo/shared';

interface DemoBannerProps {
  currentSeat: SeatIndex;
  onSeatChange: (seat: SeatIndex) => void;
  autoPlayBots: boolean;
  onToggleAutoPlay: () => void;
  onResetMatch?: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  currentSeat,
  onSeatChange,
  autoPlayBots,
  onToggleAutoPlay,
  onResetMatch
}) => {
  return (
    <div
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '0.8rem',
        zIndex: 40
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            backgroundColor: '#10b981',
            color: '#064e3b',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 800,
            fontSize: '0.7rem'
          }}
        >
          STAGE 3 DEMO
        </span>
        <span style={{ color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={13} color="#34d399" />
          Local Simulation (No Server Connection Yet)
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Perspective Seat Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Eye size={13} color="#9ca3af" />
          <span style={{ color: '#9ca3af' }}>View Seat:</span>
          {([0, 1, 2, 3] as SeatIndex[]).map((seat) => (
            <button
              key={seat}
              onClick={() => onSeatChange(seat)}
              style={{
                backgroundColor: currentSeat === seat ? '#34d399' : 'rgba(255, 255, 255, 0.1)',
                color: currentSeat === seat ? '#064e3b' : '#e5e7eb',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title={`View hand from Seat ${seat}`}
            >
              P{seat}
            </button>
          ))}
        </div>

        {/* Auto Bot Toggle */}
        <button
          onClick={onToggleAutoPlay}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: autoPlayBots ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            color: autoPlayBots ? '#34d399' : '#9ca3af',
            border: `1px solid ${autoPlayBots ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Bots will automatically take their turns"
        >
          <Bot size={13} />
          <span>Bots: {autoPlayBots ? 'Auto' : 'Manual'}</span>
        </button>

        {onResetMatch && (
          <button
            onClick={onResetMatch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#d1d5db',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
            title="Start new round"
          >
            <RefreshCw size={12} />
            <span>Redeal</span>
          </button>
        )}
      </div>
    </div>
  );
};
