import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomPublicState,
  PlayerPublicView,
  ERROR_CODES
} from '@domino-duo/shared';
import { app, httpServer, io } from '../src/index';
import { roomStore } from '../src/rooms/store';

type TypedClientSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

describe('Real-Time Multiplayer Server & 4-Player Integration', () => {
  let server: http.Server;
  let serverPort: number;
  let serverUrl: string;

  beforeAll(async () => {
    // Listen on dynamic random port to avoid port collisions in tests
    await new Promise<void>((resolve) => {
      server = httpServer.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          serverPort = addr.port;
          serverUrl = `http://localhost:${serverPort}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      io.close(() => {
        server.close(() => resolve());
      });
    });
  });

  beforeEach(() => {
    roomStore.clearAll();
  });

  const createClient = (): Promise<TypedClientSocket> => {
    return new Promise((resolve) => {
      const socket: TypedClientSocket = Client(serverUrl, {
        transports: ['websocket'],
        forceNew: true
      });
      socket.on('connect', () => resolve(socket));
    });
  };

  it('should create a private room and assign the host to Seat 0', async () => {
    const client = await createClient();

    const result = await new Promise<{
      success: boolean;
      roomCode?: string;
      sessionToken?: string;
      seat?: number;
    }>((resolve) => {
      client.emit('room:create', { nickname: 'Alice' }, resolve);
    });

    expect(result.success).toBe(true);
    expect(result.roomCode).toBeDefined();
    expect(result.seat).toBe(0);
    expect(result.sessionToken).toBeDefined();

    const room = roomStore.getRoom(result.roomCode!);
    expect(room).toBeDefined();
    expect(room?.hostSeat).toBe(0);
    expect(room?.players[0]?.nickname).toBe('Alice');

    client.disconnect();
  });

  it('should allow exactly 4 players to join and prevent a 5th player from joining', async () => {
    const host = await createClient();
    const p2 = await createClient();
    const p3 = await createClient();
    const p4 = await createClient();
    const p5 = await createClient();

    // 1. Host creates room
    const createRes = await new Promise<any>((resolve) => {
      host.emit('room:create', { nickname: 'P0-Alice' }, resolve);
    });
    const roomCode = createRes.roomCode;

    // 2. Players 2, 3, 4 join
    const p2Res = await new Promise<any>((resolve) => {
      p2.emit('room:join', { roomCode, nickname: 'P1-Bob' }, resolve);
    });
    expect(p2Res.success).toBe(true);
    expect(p2Res.seat).toBe(1);

    const p3Res = await new Promise<any>((resolve) => {
      p3.emit('room:join', { roomCode, nickname: 'P2-Charlie' }, resolve);
    });
    expect(p3Res.success).toBe(true);
    expect(p3Res.seat).toBe(2);

    const p4Res = await new Promise<any>((resolve) => {
      p4.emit('room:join', { roomCode, nickname: 'P3-Diana' }, resolve);
    });
    expect(p4Res.success).toBe(true);
    expect(p4Res.seat).toBe(3);

    // 3. 5th player attempts to join -> REJECTED
    const p5Res = await new Promise<any>((resolve) => {
      p5.emit('room:join', { roomCode, nickname: 'P4-Extra' }, resolve);
    });
    expect(p5Res.success).toBe(false);
    expect(p5Res.error).toBe(ERROR_CODES.ROOM_FULL);

    host.disconnect();
    p2.disconnect();
    p3.disconnect();
    p4.disconnect();
    p5.disconnect();
  });

  it('should deliver private hand snapshots to each seat with zero exposure of opponent tiles', async () => {
    const clients: TypedClientSocket[] = [];
    for (let i = 0; i < 4; i++) {
      clients.push(await createClient());
    }

    const c0 = clients[0]!;
    const c1 = clients[1]!;
    const c2 = clients[2]!;
    const c3 = clients[3]!;

    const createRes = await new Promise<any>((resolve) => {
      c0.emit('room:create', { nickname: 'P0' }, resolve);
    });
    const roomCode = createRes.roomCode;
    const tokens = [createRes.sessionToken];

    for (let i = 1; i <= 3; i++) {
      const joinRes = await new Promise<any>((resolve) => {
        clients[i]!.emit('room:join', { roomCode, nickname: `P${i}` }, resolve);
      });
      tokens.push(joinRes.sessionToken);
    }

    // Toggle all ready
    for (let i = 0; i < 4; i++) {
      await new Promise<any>((resolve) => {
        clients[i]!.emit('room:toggleReady', { roomCode, sessionToken: tokens[i] }, resolve);
      });
    }

    // Capture game:state events for each client
    const gameStatePromises = clients.map(
      (client) =>
        new Promise<PlayerPublicView>((resolve) => {
          client.once('game:state', (state) => resolve(state));
        })
    );

    // Host starts match
    const startRes = await new Promise<any>((resolve) => {
      c0.emit('room:startMatch', { roomCode, sessionToken: tokens[0] }, resolve);
    });
    expect(startRes.success).toBe(true);

    const states = await Promise.all(gameStatePromises);

    // Verify privacy projection:
    // Every player receives exactly 7 tiles in their own hand
    for (let i = 0; i < 4; i++) {
      const state = states[i]!;
      expect(state.mySeat).toBe(i);
      expect(state.myHand).toHaveLength(7);
      expect(state.opponentTileCounts).toEqual({ 0: 7, 1: 7, 2: 7, 3: 7 });

      // Check that other players' tiles are NEVER present anywhere in this snapshot
      const stateJson = JSON.stringify(state);
      for (let other = 0; other < 4; other++) {
        if (other !== i) {
          const otherHand = states[other]!.myHand;
          for (const tile of otherHand) {
            // Unless the viewing player also shares this tile (impossible in a standard set)
            if (!state.myHand.some((t) => t.id === tile.id)) {
              expect(stateJson).not.toContain(`"${tile.id}"`);
            }
          }
        }
      }
    }

    clients.forEach((c) => c.disconnect());
  });

  it('should support reconnection with sessionToken preserving seat and match state', async () => {
    const c0 = await createClient();
    const c1 = await createClient();

    const createRes = await new Promise<any>((resolve) => {
      c0.emit('room:create', { nickname: 'Alice' }, resolve);
    });
    const roomCode = createRes.roomCode;
    const sessionToken = createRes.sessionToken;

    await new Promise<any>((resolve) => {
      c1.emit('room:join', { roomCode, nickname: 'Bob' }, resolve);
    });

    // Alice disconnects abruptly
    c0.disconnect();
    await new Promise((r) => setTimeout(r, 60));

    // Verify Alice is marked disconnected
    const room = roomStore.getRoom(roomCode);
    expect(room?.players[0]?.isConnected).toBe(false);

    // Alice reconnects with a fresh socket presenting her sessionToken
    const c0New = await createClient();
    const reconnectRes = await new Promise<any>((resolve) => {
      c0New.emit('room:join', { roomCode, nickname: 'Alice', sessionToken }, resolve);
    });

    expect(reconnectRes.success).toBe(true);
    expect(reconnectRes.seat).toBe(0);
    expect(reconnectRes.sessionToken).toBe(sessionToken);
    expect(room?.players[0]?.isConnected).toBe(true);

    c0New.disconnect();
    c1.disconnect();
  });

  it('should reject illegal moves and out-of-turn play on the server', async () => {
    const clients: TypedClientSocket[] = [];
    for (let i = 0; i < 4; i++) clients.push(await createClient());

    const createRes = await new Promise<any>((resolve) => {
      clients[0]!.emit('room:create', { nickname: 'P0' }, resolve);
    });
    const roomCode = createRes.roomCode;
    const tokens = [createRes.sessionToken];

    for (let i = 1; i < 4; i++) {
      const res = await new Promise<any>((resolve) => {
        clients[i]!.emit('room:join', { roomCode, nickname: `P${i}` }, resolve);
      });
      tokens.push(res.sessionToken);
    }

    for (let i = 0; i < 4; i++) {
      await new Promise<any>((resolve) => {
        clients[i]!.emit('room:toggleReady', { roomCode, sessionToken: tokens[i] }, resolve);
      });
    }

    // Start match
    await new Promise<any>((resolve) => {
      clients[0]!.emit('room:startMatch', { roomCode, sessionToken: tokens[0] }, resolve);
    });

    const room = roomStore.getRoom(roomCode)!;
    const activeSeat = room.matchState!.currentRound!.activeSeat;
    const inactiveSeat = ((activeSeat + 1) % 4) as number;

    // Inactive seat tries to play -> REJECTED (Out of turn)
    const outOfTurnRes = await new Promise<any>((resolve) => {
      clients[inactiveSeat]!.emit(
        'game:playTile',
        { roomCode, sessionToken: tokens[inactiveSeat], tileId: '6-6', end: 'left' },
        resolve
      );
    });
    expect(outOfTurnRes.success).toBe(false);
    expect(outOfTurnRes.error).toMatch(/Out of turn/);

    // Active seat plays a tile they do NOT hold -> REJECTED
    const fakeTileRes = await new Promise<any>((resolve) => {
      clients[activeSeat]!.emit(
        'game:playTile',
        { roomCode, sessionToken: tokens[activeSeat], tileId: '99-99', end: 'left' },
        resolve
      );
    });
    expect(fakeTileRes.success).toBe(false);
    expect(fakeTileRes.error).toMatch(/does not hold tile/);

    clients.forEach((c) => c.disconnect());
  });

  it('should respond to health endpoint and accept Socket.IO client connections', async () => {
    // 1. Health HTTP check
    const response = await fetch(`${serverUrl}/health`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.activeRooms).toBe(0);

    // 2. Real Socket.IO client connection check
    const client = await createClient();
    expect(client.connected).toBe(true);
    client.disconnect();
  });

  it('should emit error and reject when joining a non-existent room', async () => {
    const client = await createClient();

    const errorPromise = new Promise<{ code: string; message: string }>((resolve) => {
      client.once('error:message', resolve);
    });

    const callbackPromise = new Promise<any>((resolve) => {
      client.emit('room:join', { roomCode: 'NOPE99', nickname: 'Stranger' }, resolve);
    });

    const [err, callbackRes] = await Promise.all([errorPromise, callbackPromise]);

    expect(err.code).toBe(ERROR_CODES.ROOM_NOT_FOUND);
    expect(callbackRes.success).toBe(false);

    client.disconnect();
  });

  it('should support team selection, switching, and enforce max 2 players per team', async () => {
    const c0 = await createClient();
    const c1 = await createClient();
    const c2 = await createClient();
    const c3 = await createClient();

    // 1. Host creates room specifying preferredTeam = 1 (Team B)
    const createRes = await new Promise<any>((resolve) => {
      c0.emit('room:create', { nickname: 'Alice', preferredTeam: 1 }, resolve);
    });
    expect(createRes.success).toBe(true);
    expect(createRes.team).toBe(1);
    expect(createRes.seat).toBe(1); // First seat of Team B
    const roomCode = createRes.roomCode;
    const t0 = createRes.sessionToken;

    // 2. Client 1 joins Team B
    const join1Res = await new Promise<any>((resolve) => {
      c1.emit('room:join', { roomCode, nickname: 'Bob', preferredTeam: 1 }, resolve);
    });
    expect(join1Res.success).toBe(true);
    expect(join1Res.team).toBe(1);
    expect(join1Res.seat).toBe(3); // Second seat of Team B
    const t1 = join1Res.sessionToken;

    // Team B is now full (seats 1 and 3)
    const room = roomStore.getRoom(roomCode)!;
    expect(room.players[1]?.nickname).toBe('Alice');
    expect(room.players[3]?.nickname).toBe('Bob');

    // 3. Client 2 joins with preferredTeam = 1 (Team B), but Team B is full -> assigned to Team A (seat 0)
    const join2Res = await new Promise<any>((resolve) => {
      c2.emit('room:join', { roomCode, nickname: 'Charlie', preferredTeam: 1 }, resolve);
    });
    expect(join2Res.success).toBe(true);
    expect(join2Res.team).toBe(0);
    expect(join2Res.seat).toBe(0);
    const t2 = join2Res.sessionToken;

    // 4. Client 2 (on Team A) tries to switch to Team B (which is full) -> REJECTED
    const switchFailRes = await new Promise<any>((resolve) => {
      c2.emit('room:selectTeam', { roomCode, sessionToken: t2, targetTeam: 1 }, resolve);
    });
    expect(switchFailRes.success).toBe(false);
    expect(switchFailRes.error).toMatch(/full/i);

    // 5. Client 1 (Bob on Team B) switches to Team A (seat 2 available)
    const switchSuccessRes = await new Promise<any>((resolve) => {
      c1.emit('room:selectTeam', { roomCode, sessionToken: t1, targetTeam: 0 }, resolve);
    });
    expect(switchSuccessRes.success).toBe(true);
    expect(switchSuccessRes.newTeam).toBe(0);
    expect(switchSuccessRes.newSeat).toBe(2);

    // Now Team A has seats 0 (Charlie) and 2 (Bob). Team B has seat 1 (Alice).
    // Client 3 joins Team B
    const join3Res = await new Promise<any>((resolve) => {
      c3.emit('room:join', { roomCode, nickname: 'Dave', preferredTeam: 1 }, resolve);
    });
    expect(join3Res.success).toBe(true);
    expect(join3Res.team).toBe(1);
    expect(join3Res.seat).toBe(3);
    const t3 = join3Res.sessionToken;

    // Now both teams have exactly 2 players:
    // Team A: Seat 0 & Seat 2 (Charlie & Bob)
    // Team B: Seat 1 & Seat 3 (Alice & Dave)
    expect(room.players[0]?.team).toBe(0);
    expect(room.players[2]?.team).toBe(0);
    expect(room.players[1]?.team).toBe(1);
    expect(room.players[3]?.team).toBe(1);

    // All players ready up
    await new Promise((r) => c0.emit('room:toggleReady', { roomCode, sessionToken: t0 }, r));
    await new Promise((r) => c1.emit('room:toggleReady', { roomCode, sessionToken: t1 }, r));
    await new Promise((r) => c2.emit('room:toggleReady', { roomCode, sessionToken: t2 }, r));
    await new Promise((r) => c3.emit('room:toggleReady', { roomCode, sessionToken: t3 }, r));

    // Start match
    await new Promise((r) => c0.emit('room:startMatch', { roomCode, sessionToken: t0 }, r));
    expect(room.matchState).toBeDefined();

    // After match starts, team switching must be REJECTED
    const midGameSwitchRes = await new Promise<any>((resolve) => {
      c3.emit('room:selectTeam', { roomCode, sessionToken: t3, targetTeam: 0 }, resolve);
    });
    expect(midGameSwitchRes.success).toBe(false);
    expect(midGameSwitchRes.error).toMatch(/started/i);

    [c0, c1, c2, c3].forEach((c) => c.disconnect());
  });

  it('should correctly handle a blocked round, calculate team pips, award points, and support next round', async () => {
    const clients: TypedClientSocket[] = [];
    for (let i = 0; i < 4; i++) clients.push(await createClient());

    const createRes = await new Promise<any>((resolve) => {
      clients[0]!.emit('room:create', { nickname: 'P0' }, resolve);
    });
    const roomCode = createRes.roomCode;
    const tokens = [createRes.sessionToken];

    for (let i = 1; i < 4; i++) {
      const res = await new Promise<any>((resolve) => {
        clients[i]!.emit('room:join', { roomCode, nickname: `P${i}` }, resolve);
      });
      tokens.push(res.sessionToken);
    }

    for (let i = 0; i < 4; i++) {
      await new Promise<any>((resolve) => {
        clients[i]!.emit('room:toggleReady', { roomCode, sessionToken: tokens[i] }, resolve);
      });
    }

    await new Promise<any>((resolve) => {
      clients[0]!.emit('room:startMatch', { roomCode, sessionToken: tokens[0] }, resolve);
    });

    const room = roomStore.getRoom(roomCode)!;
    expect(room.matchState).toBeDefined();

    // Create a deterministic blocked state:
    // Board has ends [5, 5].
    // Team A (Seats 0 & 2) has tiles with low pips ([0|1], [0|2]). Total Team A pips = 1 + 2 = 3 pips.
    // Team B (Seats 1 & 3) has tiles with higher pips ([3|4], [2|4]). Total Team B pips = 7 + 6 = 13 pips.
    // None of the players hold a 5, so none can play on either end!
    room.matchState = {
      ...room.matchState!,
      currentRound: {
        roundNumber: 1,
        activeSeat: 0,
        starterSeat: 0,
        hands: {
          0: [{ id: '0-1', left: 0, right: 1 }],
          1: [{ id: '3-4', left: 3, right: 4 }],
          2: [{ id: '0-2', left: 0, right: 2 }],
          3: [{ id: '2-4', left: 2, right: 4 }]
        },
        board: {
          tiles: [
            { id: '5-5', left: 5, right: 5 }
          ],
          leftEndValue: 5,
          rightEndValue: 5
        },
        consecutivePasses: 0,
        isRoundOver: false,
        result: null
      }
    };

    // 4 consecutive passes
    for (let seat = 0; seat < 4; seat++) {
      const passRes = await new Promise<any>((resolve) => {
        clients[seat]!.emit('game:pass', { roomCode, sessionToken: tokens[seat] }, resolve);
      });
      expect(passRes.success).toBe(true);
    }

    // Now the round should be over as BLOCKED!
    const round = room.matchState.currentRound!;
    expect(round.isRoundOver).toBe(true);
    expect(round.result).toBeDefined();
    expect(round.result?.reason).toBe('blocked');

    // Team A has 3 pips (0: 1 pip, 2: 2 pips)
    // Team B has 13 pips (1: 7 pips, 3: 6 pips)
    // Team A wins because 3 < 13!
    expect(round.result?.winningTeam).toBe(0);
    // Points awarded to Team A = opposing team's pips (13 pts)
    expect(round.result?.pointsAwarded).toBe(13);
    expect(round.result?.teamPips).toEqual([3, 13]);
    expect(room.matchState.scores).toEqual([13, 0]);

    // Non-host attempts to start next round -> REJECTED
    const nonHostNextRes = await new Promise<any>((resolve) => {
      clients[1]!.emit('game:nextRound', { roomCode, sessionToken: tokens[1] }, resolve);
    });
    expect(nonHostNextRes.success).toBe(false);
    expect(nonHostNextRes.error).toMatch(/host/i);

    // Host starts next round -> SUCCEEDS
    const hostNextRes = await new Promise<any>((resolve) => {
      clients[0]!.emit('game:nextRound', { roomCode, sessionToken: tokens[0] }, resolve);
    });
    expect(hostNextRes.success).toBe(true);

    // Verify round 2 started: fresh 7 tiles each, consecutivePasses reset, scores preserved!
    const round2 = room.matchState.currentRound!;
    expect(round2.roundNumber).toBe(2);
    expect(round2.isRoundOver).toBe(false);
    expect(round2.consecutivePasses).toBe(0);
    expect(round2.hands[0].length).toBe(7);
    expect(round2.hands[1].length).toBe(7);
    expect(round2.hands[2].length).toBe(7);
    expect(round2.hands[3].length).toBe(7);
    expect(room.matchState.scores).toEqual([13, 0]);

    clients.forEach((c) => c.disconnect());
  });
});
