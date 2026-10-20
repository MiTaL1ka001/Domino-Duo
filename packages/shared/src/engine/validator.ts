import { Tile } from '../types/tile';
import { BoardChain, LegalMove } from '../types/game';
import { canPlayOnEnd, getPlayableEnds } from './board';

/**
 * Returns all legal moves (tile + end) available for a given hand on the current board.
 */
export function getLegalMovesForHand(
  board: BoardChain,
  hand: readonly Tile[]
): readonly LegalMove[] {
  // Opening lead: if board is empty, every tile in hand can be placed on 'left' (which establishes the chain)
  if (board.tiles.length === 0) {
    return Object.freeze(
      hand.map((tile) => ({
        tileId: tile.id,
        end: 'left' as const
      }))
    );
  }

  const moves: LegalMove[] = [];
  for (const tile of hand) {
    const playableEnds = getPlayableEnds(board, tile);
    for (const end of playableEnds) {
      moves.push({
        tileId: tile.id,
        end
      });
    }
  }

  return Object.freeze(moves);
}

/**
 * Validates whether a player is legally allowed to pass.
 * Under strict rules, passing is permitted ONLY when the player holds no playable tiles.
 */
export function canPlayerPass(
  board: BoardChain,
  hand: readonly Tile[],
  allowPassOnlyWhenNoMoves = true
): boolean {
  if (!allowPassOnlyWhenNoMoves) {
    return true;
  }
  const legalMoves = getLegalMovesForHand(board, hand);
  return legalMoves.length === 0;
}

/**
 * Detailed validation result for a play request.
 */
export interface MoveValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly tile?: Tile;
}

/**
 * Validates whether playing a specific tile from the hand onto an end is legal.
 */
export function validateMove(
  board: BoardChain,
  hand: readonly Tile[],
  tileId: string,
  end: 'left' | 'right'
): MoveValidationResult {
  const tile = hand.find((t) => t.id === tileId);
  if (!tile) {
    return {
      valid: false,
      error: `Player does not hold tile with ID ${tileId}`
    };
  }

  if (board.tiles.length === 0) {
    return { valid: true, tile };
  }

  if (!canPlayOnEnd(board, tile, end)) {
    const endVal = end === 'left' ? board.leftEndValue : board.rightEndValue;
    return {
      valid: false,
      error: `Tile [${tile.left}|${tile.right}] cannot connect to ${end} end (requires ${endVal})`
    };
  }

  return { valid: true, tile };
}
