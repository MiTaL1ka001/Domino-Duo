import { SeatIndex, TeamIndex, getTeamForSeat, RoomPlayerInfo } from '@domino-duo/shared';

export interface PlayerData {
  seat: SeatIndex;
  team: TeamIndex;
  readonly sessionToken: string;
  nickname: string;
  socketId: string | null;
  isReady: boolean;
  isConnected: boolean;
  isHost: boolean;
}

export class Player {
  seat: SeatIndex;
  team: TeamIndex;
  readonly sessionToken: string;
  nickname: string;
  socketId: string | null;
  isReady: boolean;
  isConnected: boolean;
  isHost: boolean;

  constructor(
    seat: SeatIndex,
    nickname: string,
    sessionToken: string,
    socketId: string | null = null,
    isHost = false
  ) {
    this.seat = seat;
    this.team = getTeamForSeat(seat);
    this.nickname = nickname;
    this.sessionToken = sessionToken;
    this.socketId = socketId;
    this.isReady = false;
    this.isConnected = true;
    this.isHost = isHost;
  }

  toPublicInfo(): RoomPlayerInfo {
    return {
      seat: this.seat,
      team: this.team,
      nickname: this.nickname,
      isReady: this.isReady,
      isConnected: this.isConnected,
      isHost: this.isHost
    };
  }
}
