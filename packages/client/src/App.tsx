import React, { useState, useEffect, useRef } from 'react';
import {
  MatchState,
  PlayerPublicView,
  SeatIndex,
  TeamIndex,
  RoomPublicState,
  createMatch,
  startRound,
  playMove as enginePlayMove,
  passTurn as enginePassTurn,
  getPlayerView,
  getLegalMovesForHand,
  getTeamForSeat
} from '@domino-duo/shared';
import { ScreenState, RoomSession, PlayerSlot } from './types/ui';
import { generateDemoRoomCode, createInitialSlots } from './state/localDemoStore';
import { getSocket, saveSession, loadSession, clearSession } from './socket/socketClient';
import { HomeScreen } from './components/home/HomeScreen';
import { LobbyScreen } from './components/lobby/LobbyScreen';
import { GameTable } from './components/game/GameTable';
import { DemoBanner } from './components/demo/DemoBanner';
import { Toast } from './components/common/Toast';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>('home');
  const [mode, setMode] = useState<'online' | 'localDemo'>('online');
  const [isConnectedToServer, setIsConnectedToServer] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Online Multiplayer State
  const [roomCode, setRoomCode] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [mySeat, setMySeat] = useState<SeatIndex>(0);
  const [myNickname, setMyNickname] = useState<string>('Alex');
  const [onlineRoomState, setOnlineRoomState] = useState<RoomPublicState | null>(null);
  const [onlinePlayerView, setOnlinePlayerView] = useState<PlayerPublicView | null>(null);

  // Local Demo State
  const [demoSession, setDemoSession] = useState<RoomSession | null>(null);
  const [demoMatchState, setDemoMatchState] = useState<MatchState | null>(null);
  const [demoViewingSeat, setDemoViewingSeat] = useState<SeatIndex>(0);
  const [demoAutoPlayBots, setDemoAutoPlayBots] = useState<boolean>(true);
  const botTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Socket.IO Setup & Event Listeners
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnectedToServer(true);
      // Attempt auto-reconnect if session exists in sessionStorage
      const saved = loadSession();
      if (saved && mode === 'online' && !sessionToken) {
        socket.emit(
          'room:join',
          { roomCode: saved.roomCode, nickname: saved.nickname, sessionToken: saved.sessionToken },
          (res) => {
            if (res.success && res.roomCode && res.sessionToken && res.seat !== undefined) {
              setRoomCode(res.roomCode);
              setSessionToken(res.sessionToken);
              setMySeat(res.seat);
              setMyNickname(saved.nickname);
              setScreen('lobby');
              showToast(`Reconnected to Room ${res.roomCode} as Seat ${res.seat}`);
            } else {
              clearSession();
            }
          }
        );
      }
    };

    const handleDisconnect = () => {
      setIsConnectedToServer(false);
    };

    const handleRoomJoined = (data: { roomCode: string; sessionToken: string; seat: SeatIndex; nickname: string }) => {
      setRoomCode(data.roomCode);
      setSessionToken(data.sessionToken);
      setMySeat(data.seat);
      setMyNickname(data.nickname);
      saveSession(data);
      setScreen('lobby');
      showToast(`Joined Room ${data.roomCode} as Seat ${data.seat}`);
    };

    const handleRoomState = (state: RoomPublicState) => {
      setOnlineRoomState(state);
      if (state.isGameStarted) {
        setScreen('game');
      }
    };

    const handleGameState = (view: PlayerPublicView) => {
      setOnlinePlayerView(view);
      setScreen('game');
    };

    const handleGameEvent = (event: { message: string }) => {
      showToast(event.message);
    };

    const handleErrorMessage = (err: { message: string }) => {
      showToast(err.message);
    };

    const handleConnectError = (err: Error) => {
      setIsConnectedToServer(false);
      console.warn('[Domino Duo Socket] Connection error:', err.message);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('room:joined', handleRoomJoined);
    socket.on('room:state', handleRoomState);
    socket.on('game:state', handleGameState);
    socket.on('game:event', handleGameEvent);
    socket.on('error:message', handleErrorMessage);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('room:joined', handleRoomJoined);
      socket.off('room:state', handleRoomState);
      socket.off('game:state', handleGameState);
      socket.off('game:event', handleGameEvent);
      socket.off('error:message', handleErrorMessage);
    };
  }, [mode, sessionToken]);

  // Online Actions
  const handleCreateOnlineRoom = (nickname: string, preferredTeam?: TeamIndex) => {
    setMode('online');
    const socket = getSocket();
    socket.emit('room:create', { nickname, preferredTeam }, (res) => {
      if (!res.success) {
        showToast(res.error || 'Failed to create room');
      }
    });
  };

  const handleJoinOnlineRoom = (nickname: string, code: string, preferredTeam?: TeamIndex) => {
    setMode('online');
    const socket = getSocket();
    socket.emit('room:join', { roomCode: code, nickname, preferredTeam }, (res) => {
      if (!res.success) {
        showToast(res.error || 'Failed to join room');
      }
    });
  };

  const handleOnlineSelectTeam = (targetTeam: TeamIndex) => {
    const socket = getSocket();
    socket.emit('room:selectTeam', { roomCode, sessionToken, targetTeam }, (res) => {
      if (!res.success) {
        showToast(res.error || 'Cannot switch team');
      } else if (res.newSeat !== undefined) {
        setMySeat(res.newSeat);
        showToast(`Switched to ${targetTeam === 0 ? 'Team A' : 'Team B'} (Seat ${res.newSeat})`);
      }
    });
  };

  const handleOnlineToggleReady = () => {
    const socket = getSocket();
    socket.emit('room:toggleReady', { roomCode, sessionToken }, (res) => {
      if (!res.success) {
        showToast(res.error || 'Failed to toggle ready');
      }
    });
  };

  const handleOnlineStartMatch = () => {
    const socket = getSocket();
    socket.emit('room:startMatch', { roomCode, sessionToken }, (res) => {
      if (!res.success) {
        showToast(res.error || 'Cannot start match');
      }
    });
  };

  const handleOnlinePlayMove = (tileId: string, end: 'left' | 'right') => {
    const socket = getSocket();
    socket.emit('game:playTile', { roomCode, sessionToken, tileId, end }, (res) => {
      if (!res.success) {
        showToast(res.error || 'Invalid move');
      }
    });
  };

  const handleOnlinePassTurn = () => {
    const socket = getSocket();
    socket.emit('game:pass', { roomCode, sessionToken }, (res) => {
      if (!res.success) {
        showToast(res.error || 'Invalid pass');
      }
    });
  };

  const handleOnlineNextRound = () => {
    const socket = getSocket();
    socket.emit('game:nextRound', { roomCode, sessionToken });
  };

  const handleOnlinePlayAgain = () => {
    const socket = getSocket();
    socket.emit('game:playAgain', { roomCode, sessionToken });
  };

  const handleOnlineLeaveRoom = () => {
    const socket = getSocket();
    socket.emit('room:leave', { roomCode, sessionToken });
    clearSession();
    setSessionToken('');
    setRoomCode('');
    setOnlineRoomState(null);
    setOnlinePlayerView(null);
    setScreen('home');
  };

  // Convert OnlineRoomState to RoomSession for LobbyScreen
  const getOnlineSession = (): RoomSession => {
    const seats: SeatIndex[] = [0, 1, 2, 3];
    const slots: Record<SeatIndex, PlayerSlot> = {
      0: { seat: 0, team: 0, nickname: 'Waiting...', isReady: false, isConnected: false, isHost: false, isBot: false, isOccupied: false },
      1: { seat: 1, team: 1, nickname: 'Waiting...', isReady: false, isConnected: false, isHost: false, isBot: false, isOccupied: false },
      2: { seat: 2, team: 0, nickname: 'Waiting...', isReady: false, isConnected: false, isHost: false, isBot: false, isOccupied: false },
      3: { seat: 3, team: 1, nickname: 'Waiting...', isReady: false, isConnected: false, isHost: false, isBot: false, isOccupied: false }
    };

    if (onlineRoomState) {
      for (const s of seats) {
        const info = onlineRoomState.players[s];
        if (info) {
          slots[s] = {
            seat: s,
            team: getTeamForSeat(s),
            nickname: info.nickname,
            isReady: info.isReady,
            isConnected: info.isConnected,
            isHost: info.isHost,
            isBot: false,
            isOccupied: true
          };
        }
      }
    }

    return {
      roomCode,
      mySeat,
      myNickname,
      slots,
      isGameStarted: onlineRoomState?.isGameStarted ?? false
    };
  };

  // Local Offline Demo Handlers (Preserved from Stage 3)
  const handleStartLocalDemo = (nickname: string) => {
    setMode('localDemo');
    const code = generateDemoRoomCode();
    setDemoSession({
      roomCode: code,
      mySeat: 0,
      myNickname: nickname,
      slots: createInitialSlots(nickname),
      isGameStarted: false
    });
    setDemoViewingSeat(0);
    setScreen('lobby');
    showToast(`Offline Demo Room ${code} started with simulated bots`);
  };

  const handleDemoToggleReady = () => {
    if (!demoSession) return;
    const current = demoSession.slots[demoSession.mySeat];
    if (!current) return;
    setDemoSession({
      ...demoSession,
      slots: {
        ...demoSession.slots,
        [demoSession.mySeat]: { ...current, isReady: !current.isReady }
      }
    });
  };

  const handleDemoSelectTeam = (targetTeam: TeamIndex) => {
    if (!demoSession) return;
    const currentSeat = demoSession.mySeat;
    const currentTeam = getTeamForSeat(currentSeat);
    if (currentTeam === targetTeam) return;

    const targetSeats: SeatIndex[] = targetTeam === 0 ? [0, 2] : [1, 3];
    const newSeat = targetSeats[0]!;
    const oldSlot = demoSession.slots[currentSeat]!;
    const targetSlot = demoSession.slots[newSeat]!;

    const updatedSlots = {
      ...demoSession.slots,
      [newSeat]: {
        ...oldSlot,
        seat: newSeat,
        team: targetTeam
      },
      [currentSeat]: {
        ...targetSlot,
        seat: currentSeat,
        team: currentTeam
      }
    };

    setDemoSession({
      ...demoSession,
      mySeat: newSeat,
      slots: updatedSlots
    });
    setDemoViewingSeat(newSeat);
    showToast(`Switched to ${targetTeam === 0 ? 'Team A' : 'Team B'} (Seat ${newSeat})`);
  };

  const handleDemoStartGame = () => {
    if (!demoSession) return;
    let match = createMatch({ targetScore: 100 });
    match = startRound(match);
    setDemoMatchState(match);
    setScreen('game');
  };

  const handleDemoPlayMove = (tileId: string, end: 'left' | 'right') => {
    if (!demoMatchState) return;
    try {
      const active = demoMatchState.currentRound?.activeSeat;
      if (active === undefined) return;
      const updated = enginePlayMove(demoMatchState, active, tileId, end);
      setDemoMatchState(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid move';
      showToast(msg);
    }
  };

  const handleDemoPass = () => {
    if (!demoMatchState) return;
    try {
      const active = demoMatchState.currentRound?.activeSeat;
      if (active === undefined) return;
      const updated = enginePassTurn(demoMatchState, active);
      setDemoMatchState(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid pass';
      showToast(msg);
    }
  };

  const handleDemoNextRound = () => {
    if (!demoMatchState) return;
    const nextMatch = startRound(demoMatchState);
    setDemoMatchState(nextMatch);
  };

  const handleDemoPlayAgain = () => {
    let match = createMatch({ targetScore: 100 });
    match = startRound(match);
    setDemoMatchState(match);
  };

  const handleDemoLeave = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setDemoMatchState(null);
    setDemoSession(null);
    setScreen('home');
  };

  // Bot auto-play loop for local demo
  useEffect(() => {
    if (mode !== 'localDemo' || screen !== 'game' || !demoMatchState || !demoAutoPlayBots) return;

    const round = demoMatchState.currentRound;
    if (!round || round.isRoundOver || demoMatchState.isMatchOver) return;

    const activeSeat = round.activeSeat;
    const isBot = demoSession?.slots[activeSeat]?.isBot ?? false;

    if (isBot) {
      botTimerRef.current = window.setTimeout(() => {
        try {
          const botHand = round.hands[activeSeat];
          const legalMoves = getLegalMovesForHand(round.board, botHand);
          if (legalMoves.length > 0 && legalMoves[0]) {
            const sixSix = legalMoves.find((m) => m.tileId === '6-6');
            const move = sixSix || legalMoves[0];
            const updated = enginePlayMove(demoMatchState, activeSeat, move.tileId, move.end);
            setDemoMatchState(updated);
          } else {
            const updated = enginePassTurn(demoMatchState, activeSeat);
            setDemoMatchState(updated);
          }
        } catch {
          // Ignore
        }
      }, 700);
    }

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [mode, screen, demoMatchState, demoAutoPlayBots, demoSession]);

  const activePlayerView: PlayerPublicView | null =
    mode === 'online'
      ? onlinePlayerView
      : demoMatchState
      ? getPlayerView(demoMatchState, demoViewingSeat)
      : null;

  const currentSession: RoomSession = mode === 'online' ? getOnlineSession() : (demoSession as RoomSession);

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Demo Banner shown during local demo */}
      {mode === 'localDemo' && screen !== 'home' && (
        <DemoBanner
          currentSeat={demoViewingSeat}
          onSeatChange={(s) => setDemoViewingSeat(s)}
          autoPlayBots={demoAutoPlayBots}
          onToggleAutoPlay={() => setDemoAutoPlayBots(!demoAutoPlayBots)}
          onResetMatch={screen === 'game' ? handleDemoNextRound : undefined}
        />
      )}

      {/* Screen 1: Home */}
      {screen === 'home' && (
        <HomeScreen
          onCreateRoom={handleCreateOnlineRoom}
          onJoinRoom={handleJoinOnlineRoom}
          onStartLocalDemo={handleStartLocalDemo}
          isConnectedToServer={isConnectedToServer}
        />
      )}

      {/* Screen 2: Lobby */}
      {screen === 'lobby' && (
        <LobbyScreen
          session={currentSession}
          onToggleReady={mode === 'online' ? handleOnlineToggleReady : handleDemoToggleReady}
          onStartGame={mode === 'online' ? handleOnlineStartMatch : handleDemoStartGame}
          onLeaveRoom={mode === 'online' ? handleOnlineLeaveRoom : handleDemoLeave}
          onSelectTeam={mode === 'online' ? handleOnlineSelectTeam : handleDemoSelectTeam}
        />
      )}

      {/* Screen 3: Game Table */}
      {screen === 'game' && activePlayerView && (
        <GameTable
          session={currentSession}
          playerView={activePlayerView}
          roundNumber={activePlayerView.isRoundOver ? 1 : 1}
          onPlayMove={mode === 'online' ? handleOnlinePlayMove : handleDemoPlayMove}
          onPass={mode === 'online' ? handleOnlinePassTurn : handleDemoPass}
          onNextRound={mode === 'online' ? handleOnlineNextRound : handleDemoNextRound}
          onPlayAgain={mode === 'online' ? handleOnlinePlayAgain : handleDemoPlayAgain}
          onLeave={mode === 'online' ? handleOnlineLeaveRoom : handleDemoLeave}
        />
      )}

      {/* Toast Feedback */}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
};
