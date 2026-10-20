import { describe, it, expect } from 'vitest';
import {
  createEmptyBoard,
  placeTile,
  canPlayOnEnd,
  getPlayableEnds
} from '../src/engine/board';
import { createTile } from '../src/types/tile';

describe('Domino Board Engine', () => {
  it('should initialize an empty board with null ends', () => {
    const board = createEmptyBoard();
    expect(board.tiles).toHaveLength(0);
    expect(board.leftEndValue).toBeNull();
    expect(board.rightEndValue).toBeNull();
  });

  it('should accept the opening tile and establish both open ends', () => {
    const board = createEmptyBoard();
    const doubleSix = createTile(6, 6);
    const updated = placeTile(board, doubleSix, 'left');

    expect(updated.tiles).toHaveLength(1);
    expect(updated.leftEndValue).toBe(6);
    expect(updated.rightEndValue).toBe(6);
  });

  it('should attach a matching tile to the right end', () => {
    let board = createEmptyBoard();
    board = placeTile(board, createTile(6, 6), 'left');

    // Tile [6|4]: its left end (6) matches board right end (6)
    const tile64 = createTile(6, 4);
    board = placeTile(board, tile64, 'right');

    expect(board.tiles).toHaveLength(2);
    expect(board.leftEndValue).toBe(6);
    expect(board.rightEndValue).toBe(4);
    expect(board.tiles[1]?.left).toBe(6);
    expect(board.tiles[1]?.right).toBe(4);
  });

  it('should flip a tile when placed on the right end if necessary', () => {
    let board = createEmptyBoard();
    board = placeTile(board, createTile(6, 6), 'left');

    // Tile [4|6]: its right end (6) matches board right end (6) -> should flip to [6|4]
    const tile46 = createTile(4, 6);
    board = placeTile(board, tile46, 'right');

    expect(board.tiles).toHaveLength(2);
    expect(board.leftEndValue).toBe(6);
    expect(board.rightEndValue).toBe(4);
    expect(board.tiles[1]?.left).toBe(6);
    expect(board.tiles[1]?.right).toBe(4);
  });

  it('should attach a matching tile to the left end', () => {
    let board = createEmptyBoard();
    board = placeTile(board, createTile(6, 6), 'left');

    // Tile [3|6]: its right end (6) matches board left end (6)
    const tile36 = createTile(3, 6);
    board = placeTile(board, tile36, 'left');

    expect(board.tiles).toHaveLength(2);
    expect(board.leftEndValue).toBe(3);
    expect(board.rightEndValue).toBe(6);
    expect(board.tiles[0]?.left).toBe(3);
    expect(board.tiles[0]?.right).toBe(6);
  });

  it('should flip a tile when placed on the left end if necessary', () => {
    let board = createEmptyBoard();
    board = placeTile(board, createTile(6, 6), 'left');

    // Tile [6|2]: its left end (6) matches board left end (6) -> should flip to [2|6]
    const tile62 = createTile(6, 2);
    board = placeTile(board, tile62, 'left');

    expect(board.tiles).toHaveLength(2);
    expect(board.leftEndValue).toBe(2);
    expect(board.rightEndValue).toBe(6);
    expect(board.tiles[0]?.left).toBe(2);
    expect(board.tiles[0]?.right).toBe(6);
  });

  it('should reject an illegal move when neither end matches', () => {
    let board = createEmptyBoard();
    board = placeTile(board, createTile(6, 6), 'left');

    const unmatchable = createTile(2, 3);
    expect(() => placeTile(board, unmatchable, 'left')).toThrow(/Illegal move/);
    expect(() => placeTile(board, unmatchable, 'right')).toThrow(/Illegal move/);
  });

  it('should accurately report playable ends for a tile', () => {
    let board = createEmptyBoard();
    board = placeTile(board, createTile(2, 5), 'left'); // left is 2, right is 5

    // Tile [2|3] matches left end (2) only
    expect(getPlayableEnds(board, createTile(2, 3))).toEqual(['left']);

    // Tile [5|4] matches right end (5) only
    expect(getPlayableEnds(board, createTile(5, 4))).toEqual(['right']);

    // Tile [2|5] matches both ends
    expect(getPlayableEnds(board, createTile(2, 5))).toEqual(['left', 'right']);

    // Tile [0|1] matches neither
    expect(getPlayableEnds(board, createTile(0, 1))).toEqual([]);

    expect(canPlayOnEnd(board, createTile(2, 3), 'left')).toBe(true);
    expect(canPlayOnEnd(board, createTile(2, 3), 'right')).toBe(false);
  });
});
