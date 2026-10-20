import React, { useState } from 'react';
import { Copy, Check, Play, ArrowLeft, Users, ShieldAlert, UserCheck } from 'lucide-react';
import { RoomSession } from '../../types/ui';
import { SeatIndex, TeamIndex, getPartnerSeat } from '@domino-duo/shared';
import { SeatCard } from './SeatCard';
import { Button } from '../common/Button';

interface LobbyScreenProps {
  session: RoomSession;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onSelectTeam: (team: TeamIndex) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  session,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
  onSelectTeam
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(session.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSlotOccupied = (seat: SeatIndex): boolean => {
    const slot = session.slots[seat];
    if (!slot) return false;
    return slot.isOccupied ?? (slot.isConnected || slot.isBot || slot.nickname !== 'Waiting...');
  };

  const teamAOccupied = ([0, 2] as SeatIndex[]).filter(isSlotOccupied).length;
  const teamBOccupied = ([1, 3] as SeatIndex[]).filter(isSlotOccupied).length;
  const totalOccupied = teamAOccupied + teamBOccupied;

  const mySlot = session.slots[session.mySeat];
  const myTeam: TeamIndex = mySlot?.team ?? 0;
  const partnerSeat = getPartnerSeat(session.mySeat);

  const isTeamAFull = teamAOccupied >= 2;
  const isTeamBFull = teamBOccupied >= 2;

  // All 4 players must be present and marked ready to start
  const allOccupied = totalOccupied === 4;
  const allReady =
    allOccupied &&
    ([0, 1, 2, 3] as SeatIndex[]).every((s) => {
      const slot = session.slots[s];
      return slot && isSlotOccupied(s) && slot.isReady;
    });

  return (
    <div
      className="felt-table"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          margin: 'auto 0'
        }}
      >
        {/* Top bar with back button and room code */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} />}
            onClick={onLeaveRoom}
          >
            Leave Room
          </Button>

          {/* Room Code Badge */}
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              border: '1.5px solid rgba(52, 211, 153, 0.4)',
              borderRadius: '12px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.68rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 700 }}>
                Private Room Code
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#ffffff',
                  letterSpacing: '0.12em'
                }}
              >
                {session.roomCode}
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              title="Copy Room Code"
              aria-label="Copy Room Code"
              style={{
                backgroundColor: copied ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                color: copied ? '#ffffff' : '#e5e7eb',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Lobby Card */}
        <div
          style={{
            backgroundColor: 'rgba(15, 45, 28, 0.85)',
            border: '1.5px solid rgba(52, 211, 153, 0.25)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              Match Lobby (2v2 Domino)
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#a7f3d0' }}>
              Partners sit opposite each other • Max 2 players per team
            </p>
          </div>

          {/* Teams Grid (Team A and Team B) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {/* Team A Section */}
            <div
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.06)',
                border: '1.5px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      backgroundColor: '#38bdf8',
                      color: '#082f49',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    TEAM A
                  </span>
                  <span style={{ color: '#e0f2fe', fontWeight: 700, fontSize: '0.92rem' }}>
                    Seats 0 & 2
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#7dd3fc', fontWeight: 700 }}>
                    {teamAOccupied}/2 Players
                  </span>
                  {myTeam === 0 ? (
                    <span
                      style={{
                        backgroundColor: 'rgba(56, 189, 248, 0.25)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      Your Team
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isTeamAFull}
                      onClick={() => onSelectTeam(0)}
                      style={{
                        backgroundColor: isTeamAFull ? 'rgba(255, 255, 255, 0.05)' : '#38bdf8',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        color: isTeamAFull ? '#6b7280' : '#082f49',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: isTeamAFull ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isTeamAFull ? 'Full (2/2)' : 'Join Team A'}
                    </button>
                  )}
                </div>
              </div>

              {isTeamAFull && myTeam !== 0 && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    color: '#fca5a5',
                    fontWeight: 600
                  }}
                >
                  Team A is full (max 2 players).
                </div>
              )}

              {/* Seats for Team A */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {([0, 2] as SeatIndex[]).map((seat) => (
                  <SeatCard
                    key={seat}
                    slot={session.slots[seat]}
                    isMySeat={seat === session.mySeat}
                    isMyPartner={seat === partnerSeat}
                  />
                ))}
              </div>
            </div>

            {/* Team B Section */}
            <div
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.06)',
                border: '1.5px solid rgba(251, 191, 36, 0.35)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      backgroundColor: '#fbbf24',
                      color: '#451a03',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    TEAM B
                  </span>
                  <span style={{ color: '#fef3c7', fontWeight: 700, fontSize: '0.92rem' }}>
                    Seats 1 & 3
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#fde68a', fontWeight: 700 }}>
                    {teamBOccupied}/2 Players
                  </span>
                  {myTeam === 1 ? (
                    <span
                      style={{
                        backgroundColor: 'rgba(251, 191, 36, 0.25)',
                        border: '1px solid #fbbf24',
                        color: '#fbbf24',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      Your Team
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isTeamBFull}
                      onClick={() => onSelectTeam(1)}
                      style={{
                        backgroundColor: isTeamBFull ? 'rgba(255, 255, 255, 0.05)' : '#fbbf24',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        color: isTeamBFull ? '#6b7280' : '#451a03',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: isTeamBFull ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isTeamBFull ? 'Full (2/2)' : 'Join Team B'}
                    </button>
                  )}
                </div>
              </div>

              {isTeamBFull && myTeam !== 1 && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    color: '#fca5a5',
                    fontWeight: 600
                  }}
                >
                  Team B is full (max 2 players).
                </div>
              )}

              {/* Seats for Team B */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {([1, 3] as SeatIndex[]).map((seat) => (
                  <SeatCard
                    key={seat}
                    slot={session.slots[seat]}
                    isMySeat={seat === session.mySeat}
                    isMyPartner={seat === partnerSeat}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                variant={mySlot?.isReady ? 'secondary' : 'accent'}
                size="md"
                fullWidth
                onClick={onToggleReady}
              >
                {mySlot?.isReady ? 'Mark Not Ready' : 'Mark Ready'}
              </Button>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon={<Play size={20} />}
                disabled={!allReady}
                onClick={onStartGame}
              >
                Start Match
              </Button>
            </div>

            {!allReady && (
              <p
                style={{
                  margin: 0,
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: '#fbbf24',
                  fontWeight: 500
                }}
              >
                {!allOccupied
                  ? `Waiting for 4 players to join (${totalOccupied}/4 seats occupied)...`
                  : 'Waiting for all four players to be marked ready...'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
