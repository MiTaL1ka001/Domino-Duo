import {
  MatchState,
  PlayerPublicView,
  SeatIndex,
  createMatch,
  startRound,
  playMove as enginePlayMove,
  passTurn as enginePassTurn,
  getPlayerView,
  getLegalMovesForHand,
  DEFAULT_RULES
} from '@domino-duo/shared';
import { RoomSession, PlayerSlot } from '../types/ui';

export interface LocalDemoState {
  roomSession: RoomSession | null;
  matchState: MatchState | null;
  playerView: PlayerPublicView | null;
  viewingSeat: SeatIndex;
  autoPlayBots: boolean;
  botDelayMs: number;
}

/**
 * Generates an easy-to-read 6-character room code.
 */
export function generateDemoRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createInitialSlots(myNickname: string): Record<SeatIndex, PlayerSlot> {
  return {
    0: {
      seat: 0,
      team: 0,
      nickname: myNickname || 'You',
      isReady: true,
      isConnected: true,
      isHost: true,
      isBot: false
    },
    1: {
      seat: 1,
      team: 1,
      nickname: 'Carlos (Bot)',
      isReady: true,
      isConnected: true,
      isHost: false,
      isBot: true
    },
    2: {
      seat: 2,
      team: 0,
      nickname: 'Elena (Bot)',
      isReady: true,
      isConnected: true,
      isHost: false,
      isBot: true
    },
    3: {
      seat: 3,
      team: 1,
      nickname: 'Mateo (Bot)',
      isReady: true,
      isConnected: true,
      isHost: false,
      isBot: true
    }
  };
}
