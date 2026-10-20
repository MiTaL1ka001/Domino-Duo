export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  ROOM_CLEANUP_EMPTY_MS: 2 * 60 * 1000, // 2 minutes
  RECONNECT_GRACE_MS: 60 * 1000 // 60 seconds
} as const;
