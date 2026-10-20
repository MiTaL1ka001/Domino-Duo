import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '@domino-duo/shared';
import { CONFIG } from './config';
import { roomStore } from './rooms/store';
import { registerSocketHandlers } from './sockets/handlers';

export const app = express();

const allowedOrigins = CONFIG.CLIENT_ORIGIN === '*'
  ? ['*']
  : CONFIG.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Always permit local development environments
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
    return true;
  }
  return false;
}

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint (reports zero-database RAM state)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeRooms: roomStore.getActiveRoomCount()
  });
});

export const httpServer = http.createServer(app);

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

registerSocketHandlers(io);

export function startServer(
  port: number = CONFIG.PORT,
  host: string = CONFIG.HOST
): Promise<http.Server> {
  return new Promise((resolve) => {
    httpServer.listen(port, host, () => {
      console.log(`[Domino Duo Server] Running authoritatively on http://${host}:${port}`);
      resolve(httpServer);
    });
  });
}

// Start immediately if executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer(CONFIG.PORT, CONFIG.HOST);
}
