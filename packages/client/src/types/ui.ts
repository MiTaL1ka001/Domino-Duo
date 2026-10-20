import { SeatIndex, TeamIndex } from '@domino-duo/shared';

export type ScreenState = 'home' | 'lobby' | 'game';

export interface PlayerSlot {
  readonly seat: SeatIndex;
  readonly team: TeamIndex;
  readonly nickname: string;
  readonly isReady: boolean;
  readonly isConnected: boolean;
  readonly isHost: boolean;
  readonly isBot: boolean;
  readonly isOccupied?: boolean;
}

export interface RoomSession {
  readonly roomCode: string;
  readonly mySeat: SeatIndex;
  readonly myNickname: string;
  readonly slots: Record<SeatIndex, PlayerSlot>;
  readonly isGameStarted: boolean;
}
