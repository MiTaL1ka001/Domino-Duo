import { PipValue, Tile, flipTile, tileHasValue } from '../types/tile';
import { BoardChain } from '../types/game';

/**
 * Returns a new, empty domino board chain.
 */
export function createEmptyBoard(): BoardChain {
  return {
    tiles: Object.freeze([]),
    leftEndValue: null,
    rightEndValue: null
  };
}

/**
 * Checks if a tile can legally be placed on a specific end of the board.
 */
export function canPlayOnEnd(
  board: BoardChain,
  tile: Tile,
  end: 'left' | 'right'
): boolean {
  if (board.tiles.length === 0) {
    return true; // Any tile can be played on an empty board
  }

  const targetValue = end === 'left' ? board.leftEndValue : board.rightEndValue;
  if (targetValue === null) {
    return false;
  }

  return tileHasValue(tile, targetValue);
}

/**
 * Returns an array of ends ('left', 'right', or both) where this tile can be legally placed.
 */
export function getPlayableEnds(
  board: BoardChain,
  tile: Tile
): ('left' | 'right')[] {
  if (board.tiles.length === 0) {
    return ['left', 'right'];
  }

  const ends: ('left' | 'right')[] = [];
  if (canPlayOnEnd(board, tile, 'left')) {
    ends.push('left');
  }
  if (canPlayOnEnd(board, tile, 'right')) {
    ends.push('right');
  }
  return ends;
}

/**
 * Places a tile on the specified end of the board, correctly rotating it so matching pips face inward.
 * Returns a new immutable BoardChain state.
 * Throws an Error if the move is illegal.
 */
export function placeTile(
  board: BoardChain,
  tile: Tile,
  end: 'left' | 'right'
): BoardChain {
  // Opening tile on empty board
  if (board.tiles.length === 0) {
    return {
      tiles: Object.freeze([tile]),
      leftEndValue: tile.left,
      rightEndValue: tile.right
    };
  }

  if (end === 'left') {
    const leftValue = board.leftEndValue;
    if (leftValue === null) {
      throw new Error('Corrupted board: left end value is null');
    }

    let orientedTile: Tile;
    let newLeftEnd: PipValue;

    if (tile.right === leftValue) {
      // Right end connects inward to existing left end
      orientedTile = tile;
      newLeftEnd = tile.left;
    } else if (tile.left === leftValue) {
      // Flip tile so its left end moves to right (connecting inward)
      orientedTile = flipTile(tile);
      newLeftEnd = orientedTile.left;
    } else {
      throw new Error(`Illegal move: tile [${tile.left}|${tile.right}] does not match left board end ${leftValue}`);
    }

    return {
      tiles: Object.freeze([orientedTile, ...board.tiles]),
      leftEndValue: newLeftEnd,
      rightEndValue: board.rightEndValue
    };
  } else {
    // end === 'right'
    const rightValue = board.rightEndValue;
    if (rightValue === null) {
      throw new Error('Corrupted board: right end value is null');
    }

    let orientedTile: Tile;
    let newRightEnd: PipValue;

    if (tile.left === rightValue) {
      // Left end connects inward to existing right end
      orientedTile = tile;
      newRightEnd = tile.right;
    } else if (tile.right === rightValue) {
      // Flip tile so its right end moves to left (connecting inward)
      orientedTile = flipTile(tile);
      newRightEnd = orientedTile.right;
    } else {
      throw new Error(`Illegal move: tile [${tile.left}|${tile.right}] does not match right board end ${rightValue}`);
    }

    return {
      tiles: Object.freeze([...board.tiles, orientedTile]),
      leftEndValue: board.leftEndValue,
      rightEndValue: newRightEnd
    };
  }
}
