import React from 'react';
import { TeamIndex } from '@domino-duo/shared';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Crown, RotateCcw, Home } from 'lucide-react';

interface MatchOverModalProps {
  isOpen: boolean;
  winner: TeamIndex | null;
  scores: readonly [number, number];
  targetScore: number;
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

export const MatchOverModal: React.FC<MatchOverModalProps> = ({
  isOpen,
  winner,
  scores,
  onPlayAgain,
  onReturnHome
}) => {
  if (winner === null) return null;

  const isTeam0 = winner === 0;
  const teamColor = isTeam0 ? '#38bdf8' : '#fbbf24';

  return (
    <Modal isOpen={isOpen} showCloseButton={false} title="Match Complete!">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          textAlign: 'center'
        }}
      >
        {/* Crown Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            border: '2px solid #fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(245, 158, 11, 0.4)'
          }}
        >
          <Crown size={32} color="#fbbf24" />
        </div>

        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
            Team {winner + 1} Wins the Match!
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#a7f3d0' }}>
            First team to reach the target score has claimed overall victory.
          </p>
        </div>

        {/* Final Scoreboard */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            width: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '16px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>
              TEAM 1 (SKY)
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
              {scores[0]}
            </div>
            {winner === 0 && (
              <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 800 }}>
                WINNERS
              </span>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>
              TEAM 2 (AMBER)
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
              {scores[1]}
            </div>
            {winner === 1 && (
              <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 800 }}>
                WINNERS
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<RotateCcw size={18} />}
            onClick={onPlayAgain}
          >
            Play Again
          </Button>

          <Button
            variant="ghost"
            size="md"
            fullWidth
            icon={<Home size={18} />}
            onClick={onReturnHome}
          >
            Return to Home
          </Button>
        </div>
      </div>
    </Modal>
  );
};
