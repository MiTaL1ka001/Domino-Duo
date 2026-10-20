import { describe, it, expect } from 'vitest';
import {
  getLegalMovesForHand,
  canPlayerPass,
  validateMove
} from '../src/engine/validator';
import { createEmptyBoard, placeTile } from '../src/engine/board';
import { createTile } from '../src/types/tile';

describe('Domino Move Validator', () => {
  it('should allow playing any tile on an empty board', () => {
    const board = createEmptyBoard();
    const hand = [createTile(1, 2), createTile(3, 4)];

    const moves = getLegalMovesForHand(board, hand);
    expect(moves).toHaveLength(2);
    expect(moves.map((m) => m.tileId)).toEqual(['1-2', '3-4']);
  });

  it('should strictly prohibit passing when a player holds legal moves', () => {
    let board = createEmptyBoard();
    board = placeTile(board, createTile(6, 6), 'left');

    const hand = [
      createTile(0, 1),
      createTile(6, 3), // Playable!
      createTile(2, 4)
    ];

    expect(canPlayerPass(board, hand, true)).toBe(false);
  });

  it('should allow passing when a player holds zero legal moves', () => {
    let board = createEmptyBoard();
    board = placeTile(board, createTile(6, 6), 'left');

    const hand = [
      createTile(0, 1),
      createTile(2, 3),
      createTile(4, 5)
    ];

    expect(canPlayerPass(board, hand, true)).toBe(true);
  });

  it('should validate whether a player owns the tile they try to play', () => {
    const board = createEmptyBoard();
    const hand = [createTile(1, 2)];

    const result = validateMove(board, hand, '5-5', 'left');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/does not hold tile/);
  });

  it('should validate whether the tile matches the target board end', () => {
    let board = createEmptyBoard();
    board = placeTile(board, createTile(3, 4), 'left'); // left=3, right=4

    const hand = [createTile(4, 5)];

    // Playing [4|5] on 'left' (needs 3) is invalid
    const invalidPlay = validateMove(board, hand, '4-5', 'left');
    expect(invalidPlay.valid).toBe(false);
    expect(invalidPlay.error).toMatch(/cannot connect to left end/);

    // Playing [4|5] on 'right' (needs 4) is valid
    const validPlay = validateMove(board, hand, '4-5', 'right');
    expect(validPlay.valid).toBe(true);
  });
});
