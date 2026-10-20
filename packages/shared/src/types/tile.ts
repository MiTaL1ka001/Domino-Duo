export type PipValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Tile {
  readonly id: string;
  readonly left: PipValue;
  readonly right: PipValue;
}

export type TileEnd = 'left' | 'right';

/**
 * Creates a canonical tile identifier (e.g. "0-0", "0-6", "3-5").
 * Always orders values with the lower value first so equivalent tiles share the same ID.
 */
export function createTileId(a: PipValue, b: PipValue): string {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return `${min}-${max}`;
}

/**
 * Creates an immutable Tile object.
 */
export function createTile(left: PipValue, right: PipValue): Tile {
  return {
    id: createTileId(left, right),
    left,
    right
  };
}

/**
 * Returns true if the tile is a double (both ends have identical pip counts).
 */
export function isDouble(tile: Tile): boolean {
  return tile.left === tile.right;
}

/**
 * Returns the sum of pips on the tile.
 */
export function getTilePips(tile: Tile): number {
  return tile.left + tile.right;
}

/**
 * Flips the orientation of a tile (swaps left and right).
 */
export function flipTile(tile: Tile): Tile {
  return {
    id: tile.id,
    left: tile.right,
    right: tile.left
  };
}

/**
 * Returns true if the tile has an end that matches the target value.
 */
export function tileHasValue(tile: Tile, value: PipValue): boolean {
  return tile.left === value || tile.right === value;
}

/**
 * Checks equality between two tiles regardless of orientation.
 */
export function tileEquals(a: Tile, b: Tile): boolean {
  return a.id === b.id;
}
