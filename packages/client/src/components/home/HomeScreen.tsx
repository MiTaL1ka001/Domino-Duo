import React, { useState } from 'react';
import { Users, PlusCircle, LogIn, ShieldCheck, Zap, Lock, Bot, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../common/Button';
import { TeamIndex } from '@domino-duo/shared';

interface HomeScreenProps {
  onCreateRoom: (nickname: string, preferredTeam?: TeamIndex) => void;
  onJoinRoom: (nickname: string, roomCode: string, preferredTeam?: TeamIndex) => void;
  onStartLocalDemo?: (nickname: string) => void;
  isConnectedToServer?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  onStartLocalDemo,
  isConnectedToServer = true
}) => {
  const [nickname, setNickname] = useState('Alex');
  const [joinCode, setJoinCode] = useState('');
  const [preferredTeam, setPreferredTeam] = useState<TeamIndex | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('Please enter a nickname to create a room');
      return;
    }
    setError(null);
    onCreateRoom(trimmed, preferredTeam);
  };

  const handleJoin = () => {
    const trimmedNick = nickname.trim();
    const trimmedCode = joinCode.trim().toUpperCase();

    if (!trimmedNick) {
      setError('Please enter a nickname first');
      return;
    }
    if (!trimmedCode) {
      setError('Please enter a 6-letter room code');
      return;
    }
    setError(null);
    onJoinRoom(trimmedNick, trimmedCode, preferredTeam);
  };

  const handleLocalDemo = () => {
    const trimmed = nickname.trim() || 'Alex';
    onStartLocalDemo?.(trimmed);
  };

  return (
    <div
      className="felt-table"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative'
      }}
    >
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 10
        }}
      >
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: '#0f3a22',
              border: '2px solid #34d399',
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}
          >
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '24px', backgroundColor: '#fff', borderRadius: '3px' }} />
              <div style={{ width: '12px', height: '24px', backgroundColor: '#fff', borderRadius: '3px' }} />
            </div>
          </div>

          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              margin: '0 0 4px 0'
            }}
          >
            Domino Duo
          </h1>
          <p style={{ color: '#a7f3d0', fontSize: '0.95rem', margin: '0 0 8px 0', fontWeight: 500 }}>
            Private 2v2 Online Domino Game for Friends
          </p>

          {/* Connection Status indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isConnectedToServer ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${isConnectedToServer ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '9999px',
              padding: '2px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: isConnectedToServer ? '#34d399' : '#f87171'
            }}
          >
            {isConnectedToServer ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{isConnectedToServer ? 'Server Connected' : 'Connecting to Server...'}</span>
          </div>
        </div>

        {/* Card Container */}
        <div
          style={{
            backgroundColor: 'rgba(15, 45, 28, 0.85)',
            border: '1.5px solid rgba(52, 211, 153, 0.25)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {/* Nickname Input */}
          <div>
            <label
              htmlFor="nickname-input"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#d1fae5',
                marginBottom: '6px'
              }}
            >
              Your Nickname
            </label>
            <input
              id="nickname-input"
              type="text"
              maxLength={16}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Alex"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '1rem',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600
              }}
            />
          </div>

          {/* Preferred Team Selection */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#d1fae5',
                marginBottom: '6px'
              }}
            >
              Preferred Team (Optional)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setPreferredTeam(undefined)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: preferredTeam === undefined ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: preferredTeam === undefined ? 'rgba(52, 211, 153, 0.2)' : 'rgba(0,0,0,0.3)',
                  color: preferredTeam === undefined ? '#ffffff' : '#9ca3af',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Auto / Any
              </button>
              <button
                type="button"
                onClick={() => setPreferredTeam(0)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: preferredTeam === 0 ? '2px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.3)',
                  backgroundColor: preferredTeam === 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0,0,0,0.3)',
                  color: preferredTeam === 0 ? '#ffffff' : '#7dd3fc',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Team A (Sky)
              </button>
              <button
                type="button"
                onClick={() => setPreferredTeam(1)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: preferredTeam === 1 ? '2px solid #fbbf24' : '1px solid rgba(251, 191, 36, 0.3)',
                  backgroundColor: preferredTeam === 1 ? 'rgba(251, 191, 36, 0.25)' : 'rgba(0,0,0,0.3)',
                  color: preferredTeam === 1 ? '#ffffff' : '#fde68a',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Team B (Amber)
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#fca5a5',
                fontSize: '0.85rem',
                fontWeight: 500
              }}
            >
              {error}
            </div>
          )}

          {/* Action 1: Create Online Room */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<PlusCircle size={20} />}
            onClick={handleCreate}
          >
            Create Private Online Room
          </Button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
            <span>or join with code</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
          </div>

          {/* Action 2: Join with Code */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '1rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textAlign: 'center'
              }}
            />
            <Button
              variant="secondary"
              size="md"
              icon={<LogIn size={18} />}
              onClick={handleJoin}
            >
              Join
            </Button>
          </div>

          {/* Action 3: Offline Local Demo Mode */}
          {onStartLocalDemo && (
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '14px' }}>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                icon={<Bot size={16} />}
                onClick={handleLocalDemo}
                style={{ color: '#9ca3af' }}
              >
                Play Offline Demo (With Bots)
              </Button>
            </div>
          )}
        </div>

        {/* Feature Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '0.78rem',
            color: '#a7f3d0'
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={14} color="#34d399" />
            <span>4 Players (2v2 Teams)</span>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Lock size={14} color="#34d399" />
            <span>No Accounts Needed</span>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Zap size={14} color="#34d399" />
            <span>RAM-Only Privacy</span>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={14} color="#34d399" />
            <span>Authoritative Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
