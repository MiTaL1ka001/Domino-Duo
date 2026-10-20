import { Server, Socket } from 'socket.io';
import {
  SeatIndex,
  playMove as enginePlayMove,
  passTurn as enginePassTurn,
  startRound as engineStartRound,
  createMatch as engineCreateMatch,
  ERROR_CODES,
  ClientToServerEvents,
  ServerToClientEvents
} from '@domino-duo/shared';
import { roomStore } from '../rooms/store';
import { CONFIG } from '../config';
import {
  CreateRoomSchema,
  JoinRoomSchema,
  SelectTeamSchema,
  RoomActionSchema,
  PlayTileSchema
} from './validator';

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  // Helper to send personalized game state snapshots to each seated player
  const broadcastPersonalizedGameStates = (roomCode: string) => {
    const room = roomStore.getRoom(roomCode);
    if (!room || !room.matchState) return;

    const seats: SeatIndex[] = [0, 1, 2, 3];
    for (const seat of seats) {
      const player = room.players[seat];
      if (player && player.socketId) {
        const view = room.getPlayerView(seat);
        if (view) {
          io.to(player.socketId).emit('game:state', view);
        }
      }
    }
  };

  io.on('connection', (socket: Socket) => {
    // 1. Create Room
    socket.on('room:create', (rawPayload, callback) => {
      try {
        const parsed = CreateRoomSchema.safeParse(rawPayload);
        if (!parsed.success) {
          const errMsg = parsed.error.issues[0]?.message || 'Invalid payload';
          socket.emit('error:message', { code: ERROR_CODES.INVALID_PAYLOAD, message: errMsg });
          callback?.({ success: false, error: errMsg });
          return;
        }

        const room = roomStore.createRoom();
        const { player } = room.joinPlayer(parsed.data.nickname, socket.id, undefined, parsed.data.preferredTeam);

        socket.join(room.roomCode);

        socket.emit('room:joined', {
          roomCode: room.roomCode,
          sessionToken: player.sessionToken,
          seat: player.seat,
          nickname: player.nickname
        });

        io.to(room.roomCode).emit('room:state', room.getPublicState());

        callback?.({
          success: true,
          roomCode: room.roomCode,
          sessionToken: player.sessionToken,
          seat: player.seat,
          team: player.team
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error creating room';
        socket.emit('error:message', { code: 'SERVER_ERROR', message });
        callback?.({ success: false, error: message });
      }
    });

    // 2. Join Room (New or Reconnect)
    socket.on('room:join', (rawPayload, callback) => {
      try {
        const parsed = JoinRoomSchema.safeParse(rawPayload);
        if (!parsed.success) {
          const errMsg = parsed.error.issues[0]?.message || 'Invalid payload';
          socket.emit('error:message', { code: ERROR_CODES.INVALID_PAYLOAD, message: errMsg });
          callback?.({ success: false, error: errMsg });
          return;
        }

        const { roomCode, nickname, sessionToken, preferredTeam } = parsed.data;
        const room = roomStore.getRoom(roomCode);
        if (!room) {
          socket.emit('error:message', {
            code: ERROR_CODES.ROOM_NOT_FOUND,
            message: `Room "${roomCode}" does not exist`
          });
          callback?.({ success: false, error: 'Room does not exist' });
          return;
        }

        const { player, isReconnect } = room.joinPlayer(nickname, socket.id, sessionToken, preferredTeam);

        if (isReconnect) {
          roomStore.cancelCleanup(roomCode);
        }

        socket.join(roomCode);

        socket.emit('room:joined', {
          roomCode,
          sessionToken: player.sessionToken,
          seat: player.seat,
          nickname: player.nickname
        });

        io.to(roomCode).emit('room:state', room.getPublicState());

        if (isReconnect) {
          io.to(roomCode).emit('game:event', {
            type: 'reconnect',
            seat: player.seat,
            message: `${player.nickname} reconnected to Seat ${player.seat}`
          });
        }

        // If match is active, send current personalized game state
        if (room.matchState) {
          const view = room.getPlayerView(player.seat);
          if (view) {
            socket.emit('game:state', view);
          }
        }

        callback?.({
          success: true,
          roomCode,
          sessionToken: player.sessionToken,
          seat: player.seat,
          team: player.team
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error joining room';
        socket.emit('error:message', { code: 'JOIN_ERROR', message });
        callback?.({ success: false, error: message });
      }
    });

    // 2.5 Select / Switch Team
    socket.on('room:selectTeam', (rawPayload, callback) => {
      try {
        const parsed = SelectTeamSchema.safeParse(rawPayload);
        if (!parsed.success) {
          const errMsg = parsed.error.issues[0]?.message || 'Invalid payload';
          socket.emit('error:message', { code: ERROR_CODES.INVALID_PAYLOAD, message: errMsg });
          callback?.({ success: false, error: errMsg });
          return;
        }

        const { roomCode, sessionToken, targetTeam } = parsed.data;
        const room = roomStore.getRoom(roomCode);
        if (!room) {
          socket.emit('error:message', { code: ERROR_CODES.ROOM_NOT_FOUND, message: 'Room not found' });
          callback?.({ success: false, error: 'Room not found' });
          return;
        }

        const { player, newSeat, newTeam } = room.switchTeam(sessionToken, targetTeam);

        // Update socket client's seat and broadcast room state to all clients
        socket.emit('room:joined', {
          roomCode,
          sessionToken: player.sessionToken,
          seat: newSeat,
          nickname: player.nickname
        });

        io.to(roomCode).emit('room:state', room.getPublicState());

        const teamName = newTeam === 0 ? 'Team A' : 'Team B';
        io.to(roomCode).emit('game:event', {
          type: 'reconnect',
          seat: newSeat,
          message: `${player.nickname} joined ${teamName}`
        });

        callback?.({ success: true, newSeat, newTeam });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error switching team';
        socket.emit('error:message', { code: ERROR_CODES.TEAM_FULL, message });
        callback?.({ success: false, error: message });
      }
    });

    // 3. Toggle Ready
    socket.on('room:toggleReady', (rawPayload, callback) => {
      try {
        const parsed = RoomActionSchema.safeParse(rawPayload);
        if (!parsed.success) {
          callback?.({ success: false, error: 'Invalid payload' });
          return;
        }

        const { roomCode, sessionToken } = parsed.data;
        const room = roomStore.getRoom(roomCode);
        if (!room) {
          callback?.({ success: false, error: 'Room not found' });
          return;
        }

        room.toggleReady(sessionToken);
        io.to(roomCode).emit('room:state', room.getPublicState());
        callback?.({ success: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error toggling ready';
        callback?.({ success: false, error: message });
      }
    });

    // 4. Start Match
    socket.on('room:startMatch', (rawPayload, callback) => {
      try {
        const parsed = RoomActionSchema.safeParse(rawPayload);
        if (!parsed.success) {
          callback?.({ success: false, error: 'Invalid payload' });
          return;
        }

        const { roomCode, sessionToken } = parsed.data;
        const room = roomStore.getRoom(roomCode);
        if (!room) {
          callback?.({ success: false, error: 'Room not found' });
          return;
        }

        room.startMatch(sessionToken);

        io.to(roomCode).emit('room:state', room.getPublicState());
        broadcastPersonalizedGameStates(roomCode);

        const starterSeat = room.matchState?.currentRound?.starterSeat ?? 0;
        const starterName = room.players[starterSeat]?.nickname ?? `Seat ${starterSeat}`;

        io.to(roomCode).emit('game:event', {
          type: 'play',
          seat: starterSeat,
          tileId: '6-6',
          end: 'left',
          message: `Match started! ${starterName} holds double-six [6|6] and plays first.`
        });

        callback?.({ success: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Cannot start match';
        socket.emit('error:message', { code: 'START_ERROR', message });
        callback?.({ success: false, error: message });
      }
    });

    // 5. Play Tile
    socket.on('game:playTile', (rawPayload, callback) => {
      try {
        const parsed = PlayTileSchema.safeParse(rawPayload);
        if (!parsed.success) {
          callback?.({ success: false, error: 'Invalid payload' });
          return;
        }

        const { roomCode, sessionToken, tileId, end } = parsed.data;
        const room = roomStore.getRoom(roomCode);
        if (!room || !room.matchState) {
          callback?.({ success: false, error: 'No active match' });
          return;
        }

        const player = room.findPlayerBySessionToken(sessionToken);
        if (!player) {
          callback?.({ success: false, error: 'Unauthorized' });
          return;
        }

        // Apply move via shared authoritative engine
        const updatedMatch = enginePlayMove(room.matchState, player.seat, tileId, end, room.rules);
        room.matchState = updatedMatch;

        // Broadcast notification
        io.to(roomCode).emit('game:event', {
          type: 'play',
          seat: player.seat,
          tileId,
          end,
          message: `${player.nickname} played [${tileId}] on ${end} end`
        });

        // Check if round ended
        const round = updatedMatch.currentRound;
        if (round?.isRoundOver && round.result) {
          const res = round.result;
          if (res.reason === 'domino') {
            const teamLabel = res.winningTeam === 0 ? 'Team A' : 'Team B';
            io.to(roomCode).emit('game:event', {
              type: 'roundEnd',
              winningTeam: res.winningTeam,
              points: res.pointsAwarded,
              message: `Domino! ${teamLabel} won round ${round.roundNumber} (+${res.pointsAwarded} pts)`
            });
          }
        }

        // Check if match won
        if (updatedMatch.isMatchOver && updatedMatch.matchWinner !== null) {
          const winnerLabel = updatedMatch.matchWinner === 0 ? 'Team A' : 'Team B';
          io.to(roomCode).emit('game:event', {
            type: 'matchEnd',
            winningTeam: updatedMatch.matchWinner,
            message: `${winnerLabel} reached target score and won the match!`
          });
        }

        broadcastPersonalizedGameStates(roomCode);
        callback?.({ success: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid move';
        socket.emit('error:message', { code: ERROR_CODES.ILLEGAL_MOVE, message });
        callback?.({ success: false, error: message });
      }
    });

    // 6. Pass Turn
    socket.on('game:pass', (rawPayload, callback) => {
      try {
        const parsed = RoomActionSchema.safeParse(rawPayload);
        if (!parsed.success) {
          callback?.({ success: false, error: 'Invalid payload' });
          return;
        }

        const { roomCode, sessionToken } = parsed.data;
        const room = roomStore.getRoom(roomCode);
        if (!room || !room.matchState) {
          callback?.({ success: false, error: 'No active match' });
          return;
        }

        const player = room.findPlayerBySessionToken(sessionToken);
        if (!player) {
          callback?.({ success: false, error: 'Unauthorized' });
          return;
        }

        // Apply pass via shared authoritative engine
        const updatedMatch = enginePassTurn(room.matchState, player.seat, room.rules);
        room.matchState = updatedMatch;

        io.to(roomCode).emit('game:event', {
          type: 'pass',
          seat: player.seat,
          message: `${player.nickname} passed their turn`
        });

        // If 4 passes occurred, game blocked!
        const round = updatedMatch.currentRound;
        if (round?.isRoundOver && round.result) {
          const res = round.result;
          if (res.reason === 'blocked') {
            const winnerLabel = res.winningTeam === 0 ? 'Team A' : res.winningTeam === 1 ? 'Team B' : null;
            io.to(roomCode).emit('game:event', {
              type: 'roundEnd',
              winningTeam: res.winningTeam,
              points: res.pointsAwarded,
              message: winnerLabel !== null
                ? `Game blocked! ${winnerLabel} had fewer pips and won (+${res.pointsAwarded} pts)`
                : 'Game blocked! Both teams tied with identical pips (0 pts)'
            });
          }

          // Check if match won from a blocked round
          if (updatedMatch.isMatchOver && updatedMatch.matchWinner !== null) {
            const winnerLabel = updatedMatch.matchWinner === 0 ? 'Team A' : 'Team B';
            io.to(roomCode).emit('game:event', {
              type: 'matchEnd',
              winningTeam: updatedMatch.matchWinner,
              message: `${winnerLabel} reached target score and won the match!`
            });
          }
        }

        broadcastPersonalizedGameStates(roomCode);
        callback?.({ success: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid pass';
        socket.emit('error:message', { code: ERROR_CODES.ILLEGAL_PASS, message });
        callback?.({ success: false, error: message });
      }
    });

    // 7. Next Round
    socket.on('game:nextRound', (rawPayload, callback) => {
      try {
        const parsed = RoomActionSchema.safeParse(rawPayload);
        if (!parsed.success) {
          callback?.({ success: false, error: 'Invalid payload' });
          return;
        }

        const { roomCode, sessionToken } = parsed.data;
        const room = roomStore.getRoom(roomCode);
        if (!room || !room.matchState) {
          callback?.({ success: false, error: 'No active match' });
          return;
        }

        const player = room.findPlayerBySessionToken(sessionToken);
        if (!player) {
          callback?.({ success: false, error: 'Unauthorized' });
          return;
        }

        if (!player.isHost) {
          socket.emit('error:message', { code: 'FORBIDDEN', message: 'Only the room host can start the next round' });
          callback?.({ success: false, error: 'Only the host can start the next round' });
          return;
        }

        const updatedMatch = engineStartRound(room.matchState, { rules: room.rules });
        room.matchState = updatedMatch;

        const nextRoundNum = updatedMatch.roundHistory.length + 1;
        const starterSeat = updatedMatch.currentRound?.starterSeat ?? 0;
        const starterName = room.players[starterSeat]?.nickname ?? `Seat ${starterSeat}`;
        io.to(roomCode).emit('game:event', {
          type: 'play',
          seat: starterSeat,
          tileId: updatedMatch.currentRound?.board.tiles[0]?.id ?? '',
          end: 'left',
          message: `Round ${nextRoundNum} started! ${starterName} plays first.`
        });

        broadcastPersonalizedGameStates(roomCode);
        callback?.({ success: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Cannot start next round';
        callback?.({ success: false, error: message });
      }
    });

    // 8. Play Again (New Match)
    socket.on('game:playAgain', (rawPayload, callback) => {
      try {
        const parsed = RoomActionSchema.safeParse(rawPayload);
        if (!parsed.success) {
          callback?.({ success: false, error: 'Invalid payload' });
          return;
        }

        const { roomCode, sessionToken } = parsed.data;
        const room = roomStore.getRoom(roomCode);
        if (!room) {
          callback?.({ success: false, error: 'Room not found' });
          return;
        }

        const player = room.findPlayerBySessionToken(sessionToken);
        if (!player) {
          callback?.({ success: false, error: 'Unauthorized' });
          return;
        }

        if (!player.isHost) {
          socket.emit('error:message', { code: 'FORBIDDEN', message: 'Only the room host can reset the match' });
          callback?.({ success: false, error: 'Only the host can reset the match' });
          return;
        }

        let newMatch = engineCreateMatch(room.rules);
        newMatch = engineStartRound(newMatch, { rules: room.rules });
        room.matchState = newMatch;

        broadcastPersonalizedGameStates(roomCode);
        callback?.({ success: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Cannot reset match';
        callback?.({ success: false, error: message });
      }
    });

    // 9. Explicit Leave
    socket.on('room:leave', (rawPayload, callback) => {
      try {
        const parsed = RoomActionSchema.safeParse(rawPayload);
        if (!parsed.success) {
          callback?.({ success: false, error: 'Invalid payload' });
          return;
        }

        const { roomCode, sessionToken } = parsed.data;
        const room = roomStore.getRoom(roomCode);
        if (room) {
          const removed = room.removePlayer(sessionToken);
          socket.leave(roomCode);
          if (removed) {
            io.to(roomCode).emit('room:state', room.getPublicState());
            if (room.isEmpty()) {
              roomStore.scheduleCleanup(roomCode, CONFIG.ROOM_CLEANUP_EMPTY_MS);
            }
          }
        }
        callback?.({ success: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error leaving room';
        callback?.({ success: false, error: message });
      }
    });

    // 10. Disconnect
    socket.on('disconnect', () => {
      const match = roomStore.findRoomBySocketId(socket.id);
      if (match) {
        const { room, player } = match;
        room.disconnectSocket(socket.id);
        io.to(room.roomCode).emit('room:state', room.getPublicState());

        io.to(room.roomCode).emit('game:event', {
          type: 'disconnect',
          seat: player.seat,
          message: `${player.nickname} disconnected`
        });

        // If all players in room are disconnected, schedule room expiration
        if (room.getConnectedCount() === 0) {
          roomStore.scheduleCleanup(room.roomCode, CONFIG.ROOM_CLEANUP_EMPTY_MS);
        }
      }
    });
  });
}
