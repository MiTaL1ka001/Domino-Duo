import { PipValue, Tile, createTile } from '../types/tile';
import { SeatIndex } from '../types/game';

/**
 * Generates the complete 28-tile double-six domino set.
 * Tiles range from [0|0] up to [6|6].
 */
export function generateFullDeck(): readonly Tile[] {
  const tiles: Tile[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      tiles.push(createTile(i as PipValue, j as PipValue));
    }
  }
  return Object.freeze(tiles);
}

/**
 * Type signature for an RNG that returns a pseudo-random number in [0, 1).
 */
export type RngFunction = () => number;

/**
 * Default cryptographically secure pseudo-random number generator.
 * Works seamlessly in modern Node.js and browser environments via globalThis.crypto.
 */
export function defaultCryptoRng(): number {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    const uint32 = new Uint32Array(1);
    globalThis.crypto.getRandomValues(uint32);
    const value = uint32[0];
    if (value !== undefined) {
      return value / (0xffffffff + 1);
    }
  }
  return Math.random();
}

/**
 * Shuffles a deck of tiles using the Fisher-Yates (Knuth) algorithm.
 * Accepts an optional RNG function to allow completely deterministic unit tests.
 */
export function shuffleDeck(
  deck: readonly Tile[],
  rng: RngFunction = defaultCryptoRng
): readonly Tile[] {
  const array = [...deck];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const current = array[i];
    const target = array[j];
    if (current !== undefined && target !== undefined) {
      array[i] = target;
      array[j] = current;
    }
  }
  return Object.freeze(array);
}

/**
 * Deals exactly 7 tiles to each of the 4 player seats.
 * Validates that the input deck contains exactly 28 unique tiles.
 */
export function dealHands(
  shuffledDeck: readonly Tile[]
): Record<SeatIndex, readonly Tile[]> {
  if (shuffledDeck.length !== 28) {
    throw new Error(`Cannot deal: deck must contain exactly 28 tiles, received ${shuffledDeck.length}`);
  }

  const hands: Record<SeatIndex, readonly Tile[]> = {
    0: Object.freeze(shuffledDeck.slice(0, 7)),
    1: Object.freeze(shuffledDeck.slice(7, 14)),
    2: Object.freeze(shuffledDeck.slice(14, 21)),
    3: Object.freeze(shuffledDeck.slice(21, 28))
  };

  return hands;
}

/**
 * Verifies that all 28 tiles across all 4 hands are present and unique.
 */
export function verifyHandsIntegrity(hands: Record<SeatIndex, readonly Tile[]>): boolean {
  const seenIds = new Set<string>();
  const seats: SeatIndex[] = [0, 1, 2, 3];

  for (const seat of seats) {
    const hand = hands[seat];
    if (hand.length !== 7) return false;
    for (const tile of hand) {
      if (seenIds.has(tile.id)) {
        return false; // Duplicate tile detected
      }
      seenIds.add(tile.id);
    }
  }

  return seenIds.size === 28;
}
