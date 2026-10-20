import { SeatIndex, TeamIndex, PlayerPublicView } from './game';

export interface RoomPlayerInfo {
  readonly seat: SeatIndex;
  readonly team: TeamIndex;
  readonly nickname: string;
  readonly isReady: boolean;
  readonly isConnected: boolean;
  readonly isHost: boolean;
}

export interface RoomPublicState {
  readonly roomCode: string;
  readonly hostSeat: SeatIndex;
  readonly players: Record<SeatIndex, RoomPlayerInfo | null>;
  readonly isGameStarted: boolean;
  readonly playerCount: number;
}

export type GameEventNotification =
  | { type: 'play'; seat: SeatIndex; tileId: string; end: 'left' | 'right'; message: string }
  | { type: 'pass'; seat: SeatIndex; message: string }
  | { type: 'roundEnd'; winningTeam: TeamIndex | null; points: number; message: string }
  | { type: 'matchEnd'; winningTeam: TeamIndex; message: string }
  | { type: 'reconnect'; seat: SeatIndex; message: string }
  | { type: 'disconnect'; seat: SeatIndex; message: string };

export interface ServerToClientEvents {
  'room:joined': (payload: {
    roomCode: string;
    sessionToken: string;
    seat: SeatIndex;
    nickname: string;
  }) => void;
  'room:state': (payload: RoomPublicState) => void;
  'game:state': (payload: PlayerPublicView) => void;
  'game:event': (payload: GameEventNotification) => void;
  'error:message': (payload: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'room:create': (
    payload: { nickname: string; preferredTeam?: TeamIndex },
    callback?: (response: { success: boolean; error?: string; roomCode?: string; sessionToken?: string; seat?: SeatIndex; team?: TeamIndex }) => void
  ) => void;
  'room:join': (
    payload: { roomCode: string; nickname: string; sessionToken?: string; preferredTeam?: TeamIndex },
    callback?: (response: { success: boolean; error?: string; roomCode?: string; sessionToken?: string; seat?: SeatIndex; team?: TeamIndex }) => void
  ) => void;
  'room:selectTeam': (
    payload: { roomCode: string; sessionToken: string; targetTeam: TeamIndex },
    callback?: (response: { success: boolean; error?: string; newSeat?: SeatIndex; newTeam?: TeamIndex }) => void
  ) => void;
  'room:toggleReady': (
    payload: { roomCode: string; sessionToken: string },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
  'room:startMatch': (
    payload: { roomCode: string; sessionToken: string },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
  'room:leave': (
    payload: { roomCode: string; sessionToken: string },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
  'game:playTile': (
    payload: { roomCode: string; sessionToken: string; tileId: string; end: 'left' | 'right' },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
  'game:pass': (
    payload: { roomCode: string; sessionToken: string },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
  'game:nextRound': (
    payload: { roomCode: string; sessionToken: string },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
  'game:playAgain': (
    payload: { roomCode: string; sessionToken: string },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
}

export const ERROR_CODES = {
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  TEAM_FULL: 'TEAM_FULL',
  UNAUTHORIZED: 'UNAUTHORIZED',
  OUT_OF_TURN: 'OUT_OF_TURN',
  ILLEGAL_MOVE: 'ILLEGAL_MOVE',
  ILLEGAL_PASS: 'ILLEGAL_PASS',
  GAME_NOT_STARTED: 'GAME_NOT_STARTED',
  GAME_ALREADY_STARTED: 'GAME_ALREADY_STARTED',
  NOT_ALL_READY: 'NOT_ALL_READY',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD'
} as const;
