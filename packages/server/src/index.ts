import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '@domino-duo/shared';
import { CONFIG } from './config';
import { roomStore } from './rooms/store';
import { registerSocketHandlers } from './sockets/handlers';

export const app = express();
app.use(cors({ origin: '*' }));
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
    origin: '*',
    methods: ['GET', 'POST']
  }
});

registerSocketHandlers(io);

export function startServer(port: number = CONFIG.PORT): Promise<http.Server> {
  return new Promise((resolve) => {
    httpServer.listen(port, () => {
      console.log(`[Domino Duo Server] Running authoritatively on http://localhost:${port}`);
      resolve(httpServer);
    });
  });
}

// Start immediately if executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer(CONFIG.PORT);
}
