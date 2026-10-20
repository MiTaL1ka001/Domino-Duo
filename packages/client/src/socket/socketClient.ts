import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SeatIndex
} from '@domino-duo/shared';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketInstance: TypedSocket | null = null;

export function getServerUrl(): string {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  if (typeof window !== 'undefined') {
    // If running in development (e.g. Vite on port 5173, 5174, etc.)
    // connect directly to port 3001 on the same hostname (localhost, 127.0.0.1, or local LAN IP)
    if (window.location.port && window.location.port !== '3001') {
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }
    return window.location.origin;
  }
  return 'http://localhost:3001';
}

export function getSocket(): TypedSocket {
  if (!socketInstance) {
    const serverUrl = getServerUrl();

    socketInstance = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });
  }
  return socketInstance;
}

export interface StoredSession {
  roomCode: string;
  sessionToken: string;
  seat: SeatIndex;
  nickname: string;
}

const STORAGE_KEY = 'domino_duo_session';

export function saveSession(session: StoredSession): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors in private browsing modes
  }
}

export function loadSession(): StoredSession | null {
  try {
    const item = sessionStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
