import { GameRulesConfig, DEFAULT_RULES } from '@domino-duo/shared';
import { Room } from './room';
import { Player } from './player';
import { generateRoomCode } from '../utils/id';

export class RoomStore {
  private readonly rooms = new Map<string, Room>();

  createRoom(rules: GameRulesConfig = DEFAULT_RULES): Room {
    let roomCode = generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const room = new Room(roomCode, rules);
    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  deleteRoom(roomCode: string): void {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (room?.cleanupTimer) {
      clearTimeout(room.cleanupTimer);
    }
    this.rooms.delete(code);
  }

  findRoomBySocketId(socketId: string): { room: Room; player: Player } | undefined {
    for (const room of this.rooms.values()) {
      const player = room.findPlayerBySocketId(socketId);
      if (player) {
        return { room, player };
      }
    }
    return undefined;
  }

  scheduleCleanup(roomCode: string, delayMs: number): void {
    const room = this.getRoom(roomCode);
    if (!room) return;

    if (room.cleanupTimer) {
      clearTimeout(room.cleanupTimer);
    }

    room.cleanupTimer = setTimeout(() => {
      // If room still has 0 connected players, delete it
      if (room.getConnectedCount() === 0 || room.isEmpty()) {
        this.deleteRoom(roomCode);
      }
    }, delayMs);
  }

  cancelCleanup(roomCode: string): void {
    const room = this.getRoom(roomCode);
    if (room?.cleanupTimer) {
      clearTimeout(room.cleanupTimer);
      room.cleanupTimer = null;
    }
  }

  getActiveRoomCount(): number {
    return this.rooms.size;
  }

  clearAll(): void {
    for (const room of this.rooms.values()) {
      if (room.cleanupTimer) {
        clearTimeout(room.cleanupTimer);
      }
    }
    this.rooms.clear();
  }
}

// Global in-memory singleton
export const roomStore = new RoomStore();
