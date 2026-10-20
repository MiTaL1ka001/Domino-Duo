import { describe, it, expect } from 'vitest';
import {
  generateFullDeck,
  shuffleDeck,
  dealHands,
  verifyHandsIntegrity,
  defaultCryptoRng
} from '../src/engine/deck';
import { Tile } from '../src/types/tile';

describe('Domino Deck Engine', () => {
  it('should generate exactly 28 unique double-six domino tiles', () => {
    const deck = generateFullDeck();
    expect(deck).toHaveLength(28);

    const ids = new Set(deck.map((t) => t.id));
    expect(ids.size).toBe(28);

    // Verify all pip combinations (0..6)
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        const id = `${i}-${j}`;
        expect(ids.has(id)).toBe(true);
      }
    }
  });

  it('should deal exactly 7 tiles to each of the 4 players without duplication', () => {
    const deck = generateFullDeck();
    const shuffled = shuffleDeck(deck);
    const hands = dealHands(shuffled);

    expect(hands[0]).toHaveLength(7);
    expect(hands[1]).toHaveLength(7);
    expect(hands[2]).toHaveLength(7);
    expect(hands[3]).toHaveLength(7);

    expect(verifyHandsIntegrity(hands)).toBe(true);
  });

  it('should reject dealing if deck length is not 28', () => {
    const incompleteDeck: Tile[] = generateFullDeck().slice(0, 20);
    expect(() => dealHands(incompleteDeck)).toThrow(/must contain exactly 28 tiles/);
  });

  it('should shuffle deterministically with an injected RNG', () => {
    const deck = generateFullDeck();

    // Constant RNG returning 0.5
    const mockRng1 = () => 0.5;
    const shuffled1 = shuffleDeck(deck, mockRng1);

    const mockRng2 = () => 0.5;
    const shuffled2 = shuffleDeck(deck, mockRng2);

    expect(shuffled1.map((t) => t.id)).toEqual(shuffled2.map((t) => t.id));
  });

  it('should produce a cryptographically random number in [0, 1)', () => {
    for (let i = 0; i < 50; i++) {
      const val = defaultCryptoRng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});
