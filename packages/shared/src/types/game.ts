import { PipValue, Tile } from './tile';

export type SeatIndex = 0 | 1 | 2 | 3;
export type TeamIndex = 0 | 1;

/**
 * Returns the team index for a given seat:
 * - Seat 0 and Seat 2 belong to Team 0 (Team A).
 * - Seat 1 and Seat 3 belong to Team 1 (Team B).
 */
export function getTeamForSeat(seat: SeatIndex): TeamIndex {
  return (seat % 2) as TeamIndex;
}

/**
 * Returns the partner's seat (sitting opposite).
 */
export function getPartnerSeat(seat: SeatIndex): SeatIndex {
  return ((seat + 2) % 4) as SeatIndex;
}

/**
 * Returns the next seat in clockwise order (0 -> 1 -> 2 -> 3 -> 0).
 */
export function getNextSeat(seat: SeatIndex): SeatIndex {
  return ((seat + 1) % 4) as SeatIndex;
}

/**
 * Represents the domino chain on the board.
 * Tiles are stored in left-to-right visual order.
 */
export interface BoardChain {
  readonly tiles: readonly Tile[];
  readonly leftEndValue: PipValue | null;
  readonly rightEndValue: PipValue | null;
}

export type RoundEndReason = 'domino' | 'blocked';

export interface RoundResult {
  readonly reason: RoundEndReason;
  readonly winningTeam: TeamIndex | null; // null if blocked game resulted in an exact tie
  readonly winningSeat: SeatIndex | null;
  readonly pointsAwarded: number;
  readonly teamPips: readonly [number, number]; // [Team 0 pips, Team 1 pips]
  readonly finalHands: Record<SeatIndex, readonly Tile[]>;
}

export interface RoundState {
  readonly roundNumber: number;
  readonly activeSeat: SeatIndex;
  readonly starterSeat: SeatIndex;
  readonly hands: Record<SeatIndex, readonly Tile[]>;
  readonly board: BoardChain;
  readonly consecutivePasses: number;
  readonly isRoundOver: boolean;
  readonly result: RoundResult | null;
}

export interface MatchState {
  readonly targetScore: number;
  readonly scores: readonly [number, number]; // [Team 0 score, Team 1 score]
  readonly currentRound: RoundState | null;
  readonly roundHistory: readonly RoundResult[];
  readonly isMatchOver: boolean;
  readonly matchWinner: TeamIndex | null;
}

export interface LegalMove {
  readonly tileId: string;
  readonly end: 'left' | 'right';
}

/**
 * Personalized public game-state snapshot for a specific player seat.
 * Opponents' hands are NEVER included in this object.
 */
export interface PlayerPublicView {
  readonly mySeat: SeatIndex;
  readonly myTeam: TeamIndex;
  readonly roundNumber: number;
  readonly scores: readonly [number, number];
  readonly targetScore: number;
  readonly activeSeat: SeatIndex | null;
  readonly isMyTurn: boolean;
  readonly myHand: readonly Tile[];
  readonly opponentTileCounts: Record<SeatIndex, number>;
  readonly board: BoardChain;
  readonly isRoundOver: boolean;
  readonly roundResult: RoundResult | null;
  readonly isMatchOver: boolean;
  readonly matchWinner: TeamIndex | null;
  readonly legalMoves: readonly LegalMove[];
  readonly canPass: boolean;
}
