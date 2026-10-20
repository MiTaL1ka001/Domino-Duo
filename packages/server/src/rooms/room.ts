import {
  SeatIndex,
  TeamIndex,
  MatchState,
  PlayerPublicView,
  RoomPublicState,
  RoomPlayerInfo,
  GameRulesConfig,
  DEFAULT_RULES,
  createMatch,
  startRound,
  getPlayerView,
  ERROR_CODES
} from '@domino-duo/shared';
import { Player } from './player';
import { generateSessionToken } from '../utils/id';

export class Room {
  readonly roomCode: string;
  hostSeat: SeatIndex;
  readonly players: Record<SeatIndex, Player | null>;
  matchState: MatchState | null;
  rules: GameRulesConfig;
  cleanupTimer: NodeJS.Timeout | null;

  constructor(roomCode: string, rules: GameRulesConfig = DEFAULT_RULES) {
    this.roomCode = roomCode;
    this.hostSeat = 0;
    this.players = {
      0: null,
      1: null,
      2: null,
      3: null
    };
    this.matchState = null;
    this.rules = rules;
    this.cleanupTimer = null;
  }

  getPlayerCount(): number {
    return Object.values(this.players).filter((p): p is Player => p !== null).length;
  }

  getConnectedCount(): number {
    return Object.values(this.players).filter((p): p is Player => p !== null && p.isConnected).length;
  }

  isFull(): boolean {
    return this.getPlayerCount() >= 4;
  }

  isEmpty(): boolean {
    return this.getPlayerCount() === 0;
  }

  findPlayerBySessionToken(token: string): Player | undefined {
    return Object.values(this.players).find(
      (p): p is Player => p !== null && p.sessionToken === token
    );
  }

  findPlayerBySocketId(socketId: string): Player | undefined {
    return Object.values(this.players).find(
      (p): p is Player => p !== null && p.socketId === socketId
    );
  }

  /**
   * Adds a new player or reconnects an existing player with a matching session token.
   */
  joinPlayer(
    nickname: string,
    socketId: string,
    sessionToken?: string,
    preferredTeam?: TeamIndex
  ): { player: Player; isReconnect: boolean } {
    // 1. Check for reconnect via session token
    if (sessionToken) {
      const existing = this.findPlayerBySessionToken(sessionToken);
      if (existing) {
        existing.socketId = socketId;
        existing.isConnected = true;
        if (nickname) existing.nickname = nickname;
        return { player: existing, isReconnect: true };
      }
    }

    // 2. Cannot join if match has already started and this is not a reconnect
    if (this.matchState) {
      throw new Error(ERROR_CODES.GAME_ALREADY_STARTED);
    }

    // 3. Check room capacity (exactly 4 seats)
    if (this.isFull()) {
      throw new Error(ERROR_CODES.ROOM_FULL);
    }

    // 4. Find available seat based on preferredTeam if specified
    // Team A (0): Seats 0 and 2
    // Team B (1): Seats 1 and 3
    let availableSeat: SeatIndex | undefined;
    if (preferredTeam !== undefined) {
      const preferredSeats: SeatIndex[] = preferredTeam === 0 ? [0, 2] : [1, 3];
      const otherSeats: SeatIndex[] = preferredTeam === 0 ? [1, 3] : [0, 2];

      availableSeat = preferredSeats.find((s) => this.players[s] === null);
      if (availableSeat === undefined) {
        // Preferred team is full, fall back to other team
        availableSeat = otherSeats.find((s) => this.players[s] === null);
      }
    } else {
      const seats: SeatIndex[] = [0, 1, 2, 3];
      availableSeat = seats.find((s) => this.players[s] === null);
    }

    if (availableSeat === undefined) {
      throw new Error(ERROR_CODES.ROOM_FULL);
    }

    const token = generateSessionToken();
    const isHost = this.getPlayerCount() === 0;
    if (isHost) {
      this.hostSeat = availableSeat;
    }

    const newPlayer = new Player(availableSeat, nickname, token, socketId, isHost);
    this.players[availableSeat] = newPlayer;

    return { player: newPlayer, isReconnect: false };
  }

  /**
   * Authoritatively switches a player's team in the lobby before a match starts.
   * Ensures Team A and Team B never exceed 2 players.
   */
  switchTeam(
    sessionToken: string,
    targetTeam: TeamIndex
  ): { player: Player; newSeat: SeatIndex; newTeam: TeamIndex } {
    if (this.matchState !== null) {
      throw new Error('Cannot change team after match has started');
    }

    const player = this.findPlayerBySessionToken(sessionToken);
    if (!player) {
      throw new Error(ERROR_CODES.UNAUTHORIZED);
    }

    if (player.team === targetTeam) {
      return { player, newSeat: player.seat, newTeam: player.team };
    }

    // Team A seats: [0, 2], Team B seats: [1, 3]
    const targetSeats: SeatIndex[] = targetTeam === 0 ? [0, 2] : [1, 3];
    const newSeat = targetSeats.find((s) => this.players[s] === null);

    if (newSeat === undefined) {
      const teamLabel = targetTeam === 0 ? 'Team A' : 'Team B';
      throw new Error(`${teamLabel} is full (maximum 2 players)`);
    }

    const oldSeat = player.seat;
    this.players[oldSeat] = null;

    player.seat = newSeat;
    player.team = targetTeam;
    player.isReady = false; // Reset readiness on team switch so other players see the update
    this.players[newSeat] = player;

    if (player.isHost) {
      this.hostSeat = newSeat;
    }

    return { player, newSeat, newTeam: targetTeam };
  }

  /**
   * Handles socket disconnection. Marks the player as disconnected.
   */
  disconnectSocket(socketId: string): Player | null {
    const player = this.findPlayerBySocketId(socketId);
    if (player) {
      player.isConnected = false;
      player.socketId = null;
      return player;
    }
    return null;
  }

  /**
   * Removes a player when they explicitly leave.
   */
  removePlayer(sessionToken: string): Player | null {
    const player = this.findPlayerBySessionToken(sessionToken);
    if (!player) return null;

    this.players[player.seat] = null;

    // If host left, assign host to next remaining player
    if (player.isHost) {
      const nextRemaining = Object.values(this.players).find((p): p is Player => p !== null);
      if (nextRemaining) {
        nextRemaining.isHost = true;
        this.hostSeat = nextRemaining.seat;
      }
    }

    return player;
  }

  /**
   * Toggles the ready state of a player.
   */
  toggleReady(sessionToken: string): boolean {
    const player = this.findPlayerBySessionToken(sessionToken);
    if (!player) {
      throw new Error(ERROR_CODES.UNAUTHORIZED);
    }
    player.isReady = !player.isReady;
    return player.isReady;
  }

  /**
   * Starts the match when all 4 players are present and ready.
   */
  startMatch(sessionToken: string): MatchState {
    const player = this.findPlayerBySessionToken(sessionToken);
    if (!player) {
      throw new Error(ERROR_CODES.UNAUTHORIZED);
    }

    if (this.getPlayerCount() !== 4) {
      throw new Error('All 4 seats must be occupied to start the match');
    }

    const allReady = Object.values(this.players).every((p) => p !== null && p.isReady);
    if (!allReady) {
      throw new Error(ERROR_CODES.NOT_ALL_READY);
    }

    let match = createMatch(this.rules);
    match = startRound(match);
    this.matchState = match;
    return match;
  }

  /**
   * Returns the public room representation sent to all players in the lobby.
   */
  getPublicState(): RoomPublicState {
    const publicPlayers: Record<SeatIndex, RoomPlayerInfo | null> = {
      0: this.players[0] ? this.players[0].toPublicInfo() : null,
      1: this.players[1] ? this.players[1].toPublicInfo() : null,
      2: this.players[2] ? this.players[2].toPublicInfo() : null,
      3: this.players[3] ? this.players[3].toPublicInfo() : null
    };

    return {
      roomCode: this.roomCode,
      hostSeat: this.hostSeat,
      players: publicPlayers,
      isGameStarted: this.matchState !== null,
      playerCount: this.getPlayerCount()
    };
  }

  /**
   * Returns the personalized view for a specific seat, strictly hiding opponent hands.
   */
  getPlayerView(seat: SeatIndex): PlayerPublicView | null {
    if (!this.matchState) return null;
    return getPlayerView(this.matchState, seat, this.rules);
  }
}
