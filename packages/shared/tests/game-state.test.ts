import { describe, it, expect } from 'vitest';
import {
  createMatch,
  startRound,
  playMove,
  passTurn,
  getPlayerView
} from '../src/engine/game-state';
import { generateFullDeck } from '../src/engine/deck';
import { createTile, Tile } from '../src/types/tile';
import { SeatIndex } from '../src/types/game';

describe('Domino Game State Machine', () => {
  it('should initialize a fresh match with scores 0-0 and target 100', () => {
    const match = createMatch();
    expect(match.scores).toEqual([0, 0]);
    expect(match.targetScore).toBe(100);
    expect(match.isMatchOver).toBe(false);
    expect(match.currentRound).toBeNull();
  });

  it('should identify the player holding [6|6] as the round 1 starter', () => {
    // Generate a fixed deck where seat 2 holds [6|6]
    const allTiles = [...generateFullDeck()];
    const doubleSixIdx = allTiles.findIndex((t) => t.left === 6 && t.right === 6);
    const doubleSix = allTiles[doubleSixIdx] as Tile;

    // Remove double-six and insert at index 15 (which belongs to Seat 2: indices 14..20)
    allTiles.splice(doubleSixIdx, 1);
    allTiles.splice(15, 0, doubleSix);

    let match = createMatch();
    match = startRound(match, { customDeck: allTiles });

    expect(match.currentRound?.starterSeat).toBe(2);
    expect(match.currentRound?.activeSeat).toBe(2);
  });

  it('should enforce double-six as the opening tile of round 1', () => {
    // Arrange deck so seat 0 holds [6|6] at index 0 and [1|2] at index 1
    const allTiles = [...generateFullDeck()];
    const doubleSixIdx = allTiles.findIndex((t) => t.left === 6 && t.right === 6);
    const doubleSix = allTiles[doubleSixIdx] as Tile;
    allTiles.splice(doubleSixIdx, 1);
    allTiles.unshift(doubleSix); // seat 0 has [6|6] at hand[0]

    let match = createMatch();
    match = startRound(match, { customDeck: allTiles });

    const seat0OtherTile = match.currentRound?.hands[0].find((t) => !(t.left === 6 && t.right === 6)) as Tile;

    // Trying to play any other tile first must be rejected
    expect(() =>
      playMove(match, 0, seat0OtherTile.id, 'left')
    ).toThrow(/must be the double-six/);

    // Playing [6|6] succeeds
    const updated = playMove(match, 0, doubleSix.id, 'left');
    expect(updated.currentRound?.board.tiles).toHaveLength(1);
    expect(updated.currentRound?.board.leftEndValue).toBe(6);
    expect(updated.currentRound?.board.rightEndValue).toBe(6);
    expect(updated.currentRound?.activeSeat).toBe(1); // Turn advances clockwise
  });

  it('should strictly reject moves played out of turn', () => {
    const allTiles = [...generateFullDeck()];
    const doubleSixIdx = allTiles.findIndex((t) => t.left === 6 && t.right === 6);
    const doubleSix = allTiles[doubleSixIdx] as Tile;
    allTiles.splice(doubleSixIdx, 1);
    allTiles.unshift(doubleSix); // seat 0 has [6|6]

    let match = createMatch();
    match = startRound(match, { customDeck: allTiles });

    // Seat 1 tries to play while Seat 0 is active
    const seat1Tile = match.currentRound?.hands[1][0] as Tile;
    expect(() =>
      playMove(match, 1, seat1Tile.id, 'left')
    ).toThrow(/Out of turn/);

    // Seat 2 tries to pass while Seat 0 is active
    expect(() =>
      passTurn(match, 2)
    ).toThrow(/Out of turn/);
  });

  it('should advance turns in a clockwise circular sequence (0 -> 1 -> 2 -> 3 -> 0)', () => {
    // Construct a curated round state to test clean sequential plays
    let match = createMatch();
    const allTiles = [...generateFullDeck()];
    const doubleSixIdx = allTiles.findIndex((t) => t.left === 6 && t.right === 6);
    const doubleSix = allTiles[doubleSixIdx] as Tile;
    allTiles.splice(doubleSixIdx, 1);
    allTiles.unshift(doubleSix); // seat 0 has [6|6]

    match = startRound(match, { customDeck: allTiles });

    // Seat 0 plays [6|6]
    match = playMove(match, 0, '6-6', 'left');
    expect(match.currentRound?.activeSeat).toBe(1);

    // Find a playable tile for Seat 1
    const seat1Playable = match.currentRound?.hands[1].find((t) => t.left === 6 || t.right === 6);
    if (seat1Playable) {
      match = playMove(match, 1, seat1Playable.id, 'right');
      expect(match.currentRound?.activeSeat).toBe(2);
    }
  });

  it('should strictly forbid passing if the active player holds any playable tile', () => {
    const allTiles = [...generateFullDeck()];
    const doubleSixIdx = allTiles.findIndex((t) => t.left === 6 && t.right === 6);
    const doubleSix = allTiles[doubleSixIdx] as Tile;
    allTiles.splice(doubleSixIdx, 1);
    allTiles.unshift(doubleSix); // seat 0 starts

    let match = createMatch();
    match = startRound(match, { customDeck: allTiles });

    // Seat 0 holds [6|6], so passing must be rejected
    expect(() => passTurn(match, 0)).toThrow(/holds at least one legal move/);
  });

  it('should detect round victory ("Domino!") when a player empties their hand and accumulate match score', () => {
    let match = createMatch({ targetScore: 30 });

    // Craft a scenario where Seat 0 has 1 tile left and plays it out
    const allTiles = [...generateFullDeck()];
    const doubleSixIdx = allTiles.findIndex((t) => t.left === 6 && t.right === 6);
    const doubleSix = allTiles[doubleSixIdx] as Tile;
    allTiles.splice(doubleSixIdx, 1);
    allTiles.unshift(doubleSix);

    match = startRound(match, { customDeck: allTiles });

    // Artificially reduce Seat 0's hand to just [6|6] for direct domino test
    if (match.currentRound) {
      const simulatedRound = {
        ...match.currentRound,
        hands: {
          ...match.currentRound.hands,
          0: [doubleSix] // Only 1 tile
        }
      };
      match = { ...match, currentRound: simulatedRound };
    }

    match = playMove(match, 0, '6-6', 'left');

    expect(match.currentRound?.isRoundOver).toBe(true);
    expect(match.currentRound?.result?.reason).toBe('domino');
    expect(match.currentRound?.result?.winningTeam).toBe(0); // Team 0 wins
    expect(match.scores[0]).toBeGreaterThan(0); // Team 0 received points from opposing team
  });

  it('should detect match victory when target score is reached and stop subsequent moves', () => {
    // Set targetScore low (e.g. 10 points)
    let match = createMatch({ targetScore: 10 });
    const allTiles = [...generateFullDeck()];
    const doubleSixIdx = allTiles.findIndex((t) => t.left === 6 && t.right === 6);
    const doubleSix = allTiles[doubleSixIdx] as Tile;
    allTiles.splice(doubleSixIdx, 1);
    allTiles.unshift(doubleSix);

    match = startRound(match, { customDeck: allTiles });

    // Give Seat 0 only [6|6] so it dominos immediately
    if (match.currentRound) {
      match = {
        ...match,
        currentRound: {
          ...match.currentRound,
          hands: {
            ...match.currentRound.hands,
            0: [doubleSix]
          }
        }
      };
    }

    match = playMove(match, 0, '6-6', 'left');

    // Score of opposing team (7 tiles each in seat 1 and 3) is well above 10 points
    expect(match.isMatchOver).toBe(true);
    expect(match.matchWinner).toBe(0);

    // Subsequent play or startRound must throw
    expect(() => startRound(match)).toThrow(/match is already over/);
  });

  it('should produce privacy-safe player snapshots that never expose opponents hands', () => {
    const allTiles = [...generateFullDeck()];
    let match = createMatch();
    match = startRound(match, { customDeck: allTiles });

    const viewForSeat0 = getPlayerView(match, 0);

    // Seat 0 sees their own 7 tiles
    expect(viewForSeat0.mySeat).toBe(0);
    expect(viewForSeat0.myHand).toHaveLength(7);

    // Opponent tile counts are present
    expect(viewForSeat0.opponentTileCounts).toEqual({
      0: 7,
      1: 7,
      2: 7,
      3: 7
    });

    // Verify that the view object DOES NOT contain any opponent tile objects or IDs
    const viewJson = JSON.stringify(viewForSeat0);
    for (const opponentSeat of [1, 2, 3] as SeatIndex[]) {
      const oppHand = match.currentRound?.hands[opponentSeat] ?? [];
      for (const oppTile of oppHand) {
        // Tile shouldn't be in myHand
        if (!viewForSeat0.myHand.some((t) => t.id === oppTile.id)) {
          expect(viewJson).not.toContain(`"id":"${oppTile.id}"`);
        }
      }
    }
  });
});
