import { Tile, getTilePips } from '../types/tile';
import { SeatIndex, TeamIndex, getTeamForSeat, RoundResult, RoundState } from '../types/game';
import { GameRulesConfig } from '../rules/config';

/**
 * Calculates the total pip count for a single hand of tiles.
 */
export function calculateHandPips(hand: readonly Tile[]): number {
  return hand.reduce((sum, tile) => sum + getTilePips(tile), 0);
}

/**
 * Calculates remaining pip counts for each team:
 * - Team 0: Seat 0 + Seat 2
 * - Team 1: Seat 1 + Seat 3
 */
export function calculateTeamPips(
  hands: Record<SeatIndex, readonly Tile[]>
): [number, number] {
  const team0Pips = calculateHandPips(hands[0]) + calculateHandPips(hands[2]);
  const team1Pips = calculateHandPips(hands[1]) + calculateHandPips(hands[3]);
  return [team0Pips, team1Pips];
}

/**
 * Evaluates whether the current round has ended either by a player emptying their hand ("Domino!")
 * or by all players being blocked.
 * Returns null if the round is still active.
 */
export function checkRoundEnd(
  round: RoundState,
  rules: GameRulesConfig
): RoundResult | null {
  const seats: SeatIndex[] = [0, 1, 2, 3];

  // 1. Check for normal win ("Domino!"): any hand with 0 tiles
  for (const seat of seats) {
    if (round.hands[seat].length === 0) {
      const winningTeam = getTeamForSeat(seat);
      const losingTeam: TeamIndex = winningTeam === 0 ? 1 : 0;
      const [team0Pips, team1Pips] = calculateTeamPips(round.hands);

      // Points awarded: sum of opposing team's remaining tiles
      const opposingTeamPips = losingTeam === 0 ? team0Pips : team1Pips;

      return {
        reason: 'domino',
        winningTeam,
        winningSeat: seat,
        pointsAwarded: opposingTeamPips,
        teamPips: [team0Pips, team1Pips],
        finalHands: round.hands
      };
    }
  }

  // 2. Check for blocked game: 4 consecutive passes
  if (round.consecutivePasses >= 4) {
    const [team0Pips, team1Pips] = calculateTeamPips(round.hands);

    let winningTeam: TeamIndex | null = null;
    let winningSeat: SeatIndex | null = null;
    let pointsAwarded = 0;

    if (team0Pips < team1Pips) {
      winningTeam = 0;
      // Winning seat is the partner on the winning team with lowest pips
      const pipsSeat0 = calculateHandPips(round.hands[0]);
      const pipsSeat2 = calculateHandPips(round.hands[2]);
      winningSeat = pipsSeat0 <= pipsSeat2 ? 0 : 2;

      pointsAwarded = rules.blockedScoringMethod === 'pipDifference'
        ? team1Pips - team0Pips
        : team1Pips;
    } else if (team1Pips < team0Pips) {
      winningTeam = 1;
      const pipsSeat1 = calculateHandPips(round.hands[1]);
      const pipsSeat3 = calculateHandPips(round.hands[3]);
      winningSeat = pipsSeat1 <= pipsSeat3 ? 1 : 3;

      pointsAwarded = rules.blockedScoringMethod === 'pipDifference'
        ? team0Pips - team1Pips
        : team0Pips;
    } else {
      // Exact tie in pips
      winningTeam = null;
      winningSeat = null;
      pointsAwarded = 0;
    }

    return {
      reason: 'blocked',
      winningTeam,
      winningSeat,
      pointsAwarded,
      teamPips: [team0Pips, team1Pips],
      finalHands: round.hands
    };
  }

  return null;
}
