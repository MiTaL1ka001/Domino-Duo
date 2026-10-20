import { describe, it, expect } from 'vitest';
import {
  calculateHandPips,
  calculateTeamPips,
  checkRoundEnd
} from '../src/engine/scoring';
import { createTile } from '../src/types/tile';
import { RoundState } from '../src/types/game';
import { createEmptyBoard } from '../src/engine/board';
import { DEFAULT_RULES, GameRulesConfig } from '../src/rules/config';

describe('Domino Scoring Engine', () => {
  it('should accurately calculate pip sums for a hand', () => {
    const hand = [
      createTile(0, 0), // 0
      createTile(2, 3), // 5
      createTile(6, 6)  // 12
    ];
    expect(calculateHandPips(hand)).toBe(17);
  });

  it('should accurately calculate team pip sums for partners', () => {
    const hands = {
      0: [createTile(1, 1)], // 2
      1: [createTile(3, 3)], // 6
      2: [createTile(2, 2)], // 4
      3: [createTile(4, 4)]  // 8
    };

    const [team0Pips, team1Pips] = calculateTeamPips(hands);
    expect(team0Pips).toBe(2 + 4); // 6
    expect(team1Pips).toBe(6 + 8); // 14
  });

  it('should detect a normal win ("Domino!") and award opponents\' pips to the winning team', () => {
    const emptyBoard = createEmptyBoard();
    const roundState: RoundState = {
      roundNumber: 1,
      activeSeat: 0,
      starterSeat: 0,
      board: emptyBoard,
      consecutivePasses: 0,
      isRoundOver: false,
      result: null,
      hands: {
        0: [], // Seat 0 emptied their hand! Team 0 wins
        1: [createTile(3, 4)], // 7 pips
        2: [createTile(1, 1)], // Partner has 2 pips (not counted against opponents)
        3: [createTile(5, 5)]  // 10 pips
      }
    };

    const result = checkRoundEnd(roundState, DEFAULT_RULES);
    expect(result).not.toBeNull();
    expect(result?.reason).toBe('domino');
    expect(result?.winningTeam).toBe(0);
    expect(result?.winningSeat).toBe(0);
    // Team 1 remaining pips: 7 + 10 = 17
    expect(result?.pointsAwarded).toBe(17);
    expect(result?.teamPips).toEqual([2, 17]);
  });

  it('should detect a blocked game and award victory to the team with lowest pips', () => {
    const emptyBoard = createEmptyBoard();
    const roundState: RoundState = {
      roundNumber: 1,
      activeSeat: 0,
      starterSeat: 0,
      board: emptyBoard,
      consecutivePasses: 4, // 4 consecutive passes = blocked game!
      isRoundOver: false,
      result: null,
      hands: {
        0: [createTile(1, 2)], // 3 pips
        1: [createTile(4, 4)], // 8 pips
        2: [createTile(0, 1)], // 1 pip (Team 0 total = 4)
        3: [createTile(5, 6)]  // 11 pips (Team 1 total = 19)
      }
    };

    const result = checkRoundEnd(roundState, DEFAULT_RULES);
    expect(result).not.toBeNull();
    expect(result?.reason).toBe('blocked');
    expect(result?.winningTeam).toBe(0);
    expect(result?.winningSeat).toBe(2); // Seat 2 had lower pips (1) than Seat 0 (3)
    expect(result?.pointsAwarded).toBe(19); // Default opponentsPips: 19
  });

  it('should support the pipDifference scoring variant for blocked games', () => {
    const emptyBoard = createEmptyBoard();
    const roundState: RoundState = {
      roundNumber: 1,
      activeSeat: 0,
      starterSeat: 0,
      board: emptyBoard,
      consecutivePasses: 4,
      isRoundOver: false,
      result: null,
      hands: {
        0: [createTile(1, 2)], // 3 pips (Team 0 total = 3)
        1: [createTile(5, 5)], // 10 pips
        2: [createTile(0, 0)], // 0 pips (not empty, so it's a blocked game, not a domino win)
        3: [createTile(2, 3)]  // 5 pips (Team 1 total = 15)
      }
    };

    const customRules: GameRulesConfig = {
      ...DEFAULT_RULES,
      blockedScoringMethod: 'pipDifference'
    };

    const result = checkRoundEnd(roundState, customRules);
    expect(result?.winningTeam).toBe(0);
    // Difference: 15 - 3 = 12
    expect(result?.pointsAwarded).toBe(12);
  });

  it('should declare a tie with 0 points when a blocked game has equal team pips', () => {
    const emptyBoard = createEmptyBoard();
    const roundState: RoundState = {
      roundNumber: 1,
      activeSeat: 0,
      starterSeat: 0,
      board: emptyBoard,
      consecutivePasses: 4,
      isRoundOver: false,
      result: null,
      hands: {
        0: [createTile(2, 3)], // 5 pips (Team 0 = 10)
        1: [createTile(1, 4)], // 5 pips (Team 1 = 10)
        2: [createTile(1, 4)], // 5 pips
        3: [createTile(2, 3)]  // 5 pips
      }
    };

    const result = checkRoundEnd(roundState, DEFAULT_RULES);
    expect(result?.reason).toBe('blocked');
    expect(result?.winningTeam).toBeNull();
    expect(result?.pointsAwarded).toBe(0);
  });
});
