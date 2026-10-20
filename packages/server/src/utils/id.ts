import { randomUUID } from 'crypto';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates a random, sufficiently hard-to-guess 6-character room code.
 * Excludes ambiguous characters (0, O, 1, I).
 * Provides ~1.07 billion unique combinations (32^6).
 */
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
    code += CODE_CHARS.charAt(randomIndex);
  }
  return code;
}

/**
 * Generates an ephemeral cryptographic player session token.
 */
export function generateSessionToken(): string {
  return randomUUID();
}
