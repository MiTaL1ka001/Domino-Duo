import React from 'react';
import { RoundResult, SeatIndex, TeamIndex, Tile, calculateHandPips } from '@domino-duo/shared';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PlayerSlot } from '../../types/ui';
import { Trophy, ShieldAlert, Play, RotateCcw, Home, Clock } from 'lucide-react';

interface RoundResultsModalProps {
  isOpen: boolean;
  result: RoundResult | null;
  roundNumber: number;
  slots: Record<SeatIndex, PlayerSlot>;
  scores: readonly [number, number];
  targetScore: number;
  isHost: boolean;
  isMatchOver?: boolean;
  matchWinner?: TeamIndex | null;
  onNextRound: () => void;
  onPlayAgain?: () => void;
  onLeave?: () => void;
}

export const RoundResultsModal: React.FC<RoundResultsModalProps> = ({
  isOpen,
  result,
  roundNumber,
  slots,
  scores,
  targetScore,
  isHost,
  isMatchOver = false,
  matchWinner = null,
  onNextRound,
  onPlayAgain,
  onLeave
}) => {
  if (!result) return null;

  const isBlocked = result.reason === 'blocked';
  const isTie = result.winningTeam === null;
  const winnerTeamLabel = result.winningTeam === 0 ? 'Team A' : result.winningTeam === 1 ? 'Team B' : 'Tie';
  const winnerColor = result.winningTeam === 0 ? '#38bdf8' : result.winningTeam === 1 ? '#fbbf24' : '#9ca3af';

  const seats: SeatIndex[] = [0, 1, 2, 3];

  return (
    <Modal
      isOpen={isOpen}
      showCloseButton={false}
      title={isMatchOver ? 'Match Concluded!' : `Round ${roundNumber} Complete`}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          maxHeight: '75vh',
          overflowY: 'auto',
          paddingRight: '4px'
        }}
      >
        {/* Banner */}
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: isTie
                ? 'rgba(156, 163, 175, 0.2)'
                : `${winnerColor}26`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isTie ? (
              <ShieldAlert size={28} color="#9ca3af" />
            ) : (
              <Trophy size={28} color={winnerColor} />
            )}
          </div>

          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
              {isBlocked
                ? isTie
                  ? 'Domino Blocked! (Exact Tie)'
                  : `Domino Blocked! ${winnerTeamLabel} Wins`
                : `Domino! ${winnerTeamLabel} Wins`}
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#a7f3d0' }}>
              {isBlocked
                ? isTie
                  ? 'All 4 players passed consecutively with no legal moves. Pip counts are identical!'
                  : 'All 4 players passed consecutively with no legal moves. Lowest remaining pips wins!'
                : `${slots[result.winningSeat ?? 0]?.nickname || 'Player'} emptied their hand and scored opponent pips.`}
            </p>
          </div>
        </div>

        {/* Points Awarded Banner */}
        <div
          style={{
            backgroundColor: isTie ? 'rgba(156, 163, 175, 0.12)' : 'rgba(52, 211, 153, 0.15)',
            border: `1.5px solid ${isTie ? 'rgba(156, 163, 175, 0.3)' : 'rgba(52, 211, 153, 0.35)'}`,
            borderRadius: '12px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 700 }}>
              Round Points Awarded
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: isTie ? '#e5e7eb' : '#34d399' }}>
              {isTie ? '0 points (Tie)' : `+${result.pointsAwarded} pts to ${winnerTeamLabel}`}
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#d1fae5' }}>
            {isBlocked
              ? isTie
                ? 'No points on tie'
                : "Earns opponent team's pips"
              : "Earns opponent team's pips"}
          </div>
        </div>

        {/* Team Pips Comparison */}
        <div>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
            Remaining Pips by Team
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}
          >
            {/* Team A */}
            <div
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                border: `1.5px solid ${result.winningTeam === 0 ? '#38bdf8' : 'rgba(56, 189, 248, 0.25)'}`,
                borderRadius: '12px',
                padding: '10px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#7dd3fc', fontWeight: 700 }}>
                TEAM A (Seats 0 & 2)
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                {result.teamPips[0]} pips
              </div>
              {result.winningTeam === 0 && (
                <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800 }}>
                  ✓ LOWER PIPS (WINNER)
                </span>
              )}
            </div>

            {/* Team B */}
            <div
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.08)',
                border: `1.5px solid ${result.winningTeam === 1 ? '#fbbf24' : 'rgba(251, 191, 36, 0.25)'}`,
                borderRadius: '12px',
                padding: '10px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#fde68a', fontWeight: 700 }}>
                TEAM B (Seats 1 & 3)
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                {result.teamPips[1]} pips
              </div>
              {result.winningTeam === 1 && (
                <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 800 }}>
                  ✓ LOWER PIPS (WINNER)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4 Players Detailed Hands Breakdown */}
        <div>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
            All Players' Remaining Tiles & Pips
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {seats.map((seat) => {
              const slot = slots[seat];
              const hand = result.finalHands[seat] || [];
              const handPips = calculateHandPips(hand);
              const isTeam0 = seat % 2 === 0;
              const teamColor = isTeam0 ? '#38bdf8' : '#fbbf24';

              return (
                <div
                  key={seat}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          backgroundColor: `${teamColor}33`,
                          color: teamColor,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {isTeam0 ? 'Team A' : 'Team B'}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                        Seat {seat}: {slot?.nickname ?? `Player ${seat}`}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#d1fae5' }}>
                      {handPips} pips ({hand.length} tiles)
                    </div>
                  </div>

                  {/* Render Dominoes */}
                  {hand.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                      No tiles remaining (Domino!)
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                      {hand.map((tile: Tile) => (
                        <div
                          key={tile.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            backgroundColor: '#f3f4f6',
                            border: '1.5px solid #111827',
                            borderRadius: '4px',
                            padding: '1px 5px',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            color: '#111827',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                          }}
                        >
                          <span>{tile.left}</span>
                          <span style={{ margin: '0 2px', color: '#9ca3af' }}>|</span>
                          <span>{tile.right}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cumulative Match Standings */}
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '10px 14px'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
            Cumulative Match Standings (First to {targetScore} Pts)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#7dd3fc', fontWeight: 700 }}>Team A:</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                {scores[0]} / {targetScore}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#fde68a', fontWeight: 700 }}>Team B:</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                {scores[1]} / {targetScore}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ marginTop: '4px' }}>
          {isMatchOver ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                  border: '1px solid rgba(234, 179, 8, 0.35)',
                  borderRadius: '10px',
                  padding: '10px',
                  textAlign: 'center',
                  color: '#fef08a',
                  fontWeight: 800,
                  fontSize: '0.95rem'
                }}
              >
                🏆 Team {matchWinner === 0 ? 'A' : 'B'} Reached {targetScore} Points and Won the Match!
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {isHost && onPlayAgain && (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={<RotateCcw size={18} />}
                    onClick={onPlayAgain}
                  >
                    Play Again
                  </Button>
                )}
                {onLeave && (
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    icon={<Home size={18} />}
                    onClick={onLeave}
                  >
                    Return Home
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isHost ? (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<Play size={20} />}
                  onClick={onNextRound}
                >
                  Start Next Round (Round {roundNumber + 1})
                </Button>
              ) : (
                <div
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'center',
                    color: '#7dd3fc',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Clock size={16} />
                  Waiting for room host to start Round {roundNumber + 1}...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
