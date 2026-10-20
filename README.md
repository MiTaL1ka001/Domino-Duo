# Domino Duo — Private Online 2v2 Domino Game

Domino Duo is a lightweight, mobile-first, privacy-focused online Domino game for exactly 4 players playing in two teams of two (partners sit opposite each other).

## Project Principles

- **Zero Accounts**: No sign-ups, passwords, emails, or phone numbers.
- **In-Memory Only**: Game rooms and active matches live solely in server RAM. No database and no file persistence.
- **Server-Authoritative**: Game logic, turn order, legal moves, and scoring are validated strictly on the server.
- **Cheating Prevention**: Opponents' hidden tiles are stripped on the server before snapshots are sent over the network.

---

## Monorepo Architecture

```
Domine test/
├── package.json                 # Monorepo workspaces definition ("packages/*")
├── tsconfig.base.json           # Shared strict TypeScript configuration
├── tsconfig.json                # Project references configuration
├── README.md                    # Setup, rules, testing, and architecture documentation
├── packages/
│   ├── shared/                  # Pure Domino game engine, types, and rules (Stage 2)
│   │   ├── src/
│   │   │   ├── types/           # Tile, Seat, Team, BoardChain, MatchState, PlayerPublicView
│   │   │   ├── rules/           # Configurable rules (100pt target, starter rule, scoring)
│   │   │   └── engine/          # Deck, Fisher-Yates shuffle, Board chain, Validator, Scoring
│   │   └── tests/               # 33 Vitest automated tests covering all domino mechanics
│   ├── server/                  # Real-time Express + Socket.IO server (Stage 4)
│   └── client/                  # Mobile-first React + Vite frontend (Stage 3)
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) version 20 or higher (v24.17.0 recommended)
- npm version 10 or higher

### Installation

Clone the repository and install dependencies from the project root:

```bash
npm install
```

### Running Both Server & Client Locally

Run both the authoritative Socket.IO backend and the Vite frontend concurrently with a single command from the root directory:

```bash
npm run dev
```

- **Backend**: Runs at `http://localhost:3001` (Socket.IO + Express health check).
- **Frontend**: Runs at `http://localhost:5173` (React mobile-first UI).

You can also run them independently:
```bash
npm run dev:server    # Authoritative Node.js + Socket.IO server
npm run dev:client    # Vite development server
```

### Testing 4 Independent Browser Sessions (Online Multiplayer)

To test a full 2v2 multiplayer match locally:

1. Run `npm run dev` in your terminal.
2. Open **Window 1** (`http://localhost:5173`), enter nickname `Alice`, and click **Create Private Online Room**.
3. Click the copy icon to copy your 6-letter Room Code.
4. Open **Window 2** (an Incognito or private browser window), enter nickname `Bob`, paste the code, and click **Join**.
5. Open **Window 3** (a different browser, e.g. Edge, Chrome, or Firefox), enter `Charlie`, paste code, and click **Join**.
6. Open **Window 4** (another private window), enter `Diana`, paste code, and click **Join**.
7. In all four windows, click **Mark Ready**.
8. In Window 1 (Host), click **Start Match**.
9. The server deals 7 private tiles to each player, identifies who holds `[6|6]`, and turns advance live in real-time!

### Production Build

Build the TypeScript backend and client bundle:

```bash
npm run build
```

---

## Running Tests & Type Checks

### 1. Run Unit Tests

Execute the automated test suite with Vitest:

```bash
npm test
```

To run tests in interactive watch mode during development:

```bash
npm run test:watch
```

### 2. Run TypeScript Type Check

Verify strict TypeScript compliance across all packages:

```bash
npm run typecheck
```

---

## Domino Rules (2v2 Team Domino)

1. **Tile Set**: Double-six set containing 28 unique tiles (`[0|0]` through `[6|6]`).
2. **Dealing**: All 28 tiles are distributed at the start of each round (exactly 7 tiles per player). There is no draw pile or boneyard.
3. **Teams & Seating**:
   - 4 seats: 0, 1, 2, 3 in clockwise order.
   - Team 0 (Team A): Seat 0 and Seat 2.
   - Team 1 (Team B): Seat 1 and Seat 3.
4. **Opening Lead**:
   - Round 1: The player holding `[6|6]` leads with it.
   - Subsequent Rounds: The winner of the previous round leads and may play any tile.
5. **Passing**:
   - **Strict Rule**: A player is **only** permitted to pass if they hold 0 playable tiles for both the left and right ends of the chain. If any move is possible, passing is rejected.
6. **Round Victory**:
   - **Domino Win**: A player plays their 7th tile. Their team wins and scores the total pips remaining in the opponents' hands.
   - **Blocked Game**: When 4 consecutive passes occur. The team with the lower total remaining pips wins the round.
7. **Match Target**: First team to accumulate 100 points wins the match.

---

## Development Roadmap

- [x] **Stage 1**: Architecture blueprint, game rules specification, and risk mitigation plan.
- [x] **Stage 2**: Shared Domino game engine, strict TypeScript models, and 33 automated unit tests.
- [x] **Stage 3**: Mobile-first responsive React frontend with local mockup state.
- [x] **Stage 4**: Real-time Node.js + Express + Socket.IO server with in-memory private rooms.
- [ ] **Stage 5**: Live integration connecting 4 independent browser clients.
- [ ] **Stage 6**: Disconnection/reconnection handling, match completion, and room expiration.
- [ ] **Stage 7**: Full security audit, Playwright end-to-end tests, and production build verification.
- [ ] **Stage 8**: Deployment documentation for WebSocket hosting.
