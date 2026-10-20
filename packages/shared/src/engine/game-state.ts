import { Tile } from '../types/tile';
import {
  SeatIndex,
  TeamIndex,
  BoardChain,
  RoundResult,
  RoundState,
  MatchState,
  PlayerPublicView,
  getTeamForSeat,
  getNextSeat
} from '../types/game';
import { GameRulesConfig, DEFAULT_RULES } from '../rules/config';
import { generateFullDeck, shuffleDeck, dealHands, RngFunction } from './deck';
import { createEmptyBoard, placeTile } from './board';
import { getLegalMovesForHand, canPlayerPass, validateMove } from './validator';
import { checkRoundEnd } from './scoring';

/**
 * Finds which player holds the double-six tile [6|6].
 */
export function findDoubleSixSeat(hands: Record<SeatIndex, readonly Tile[]>): SeatIndex {
  const seats: SeatIndex[] = [0, 1, 2, 3];
  for (const seat of seats) {
    if (hands[seat].some((t) => t.left === 6 && t.right === 6)) {
      return seat;
    }
  }
  return 0; // Fallback
}

/**
 * Finds which player holds the highest double (from [6|6] down to [0|0]).
 */
export function findHighestDoubleSeat(hands: Record<SeatIndex, readonly Tile[]>): SeatIndex {
  const seats: SeatIndex[] = [0, 1, 2, 3];
  for (let val = 6; val >= 0; val--) {
    for (const seat of seats) {
      if (hands[seat].some((t) => t.left === val && t.right === val)) {
        return seat;
      }
    }
  }
  return 0; // Fallback
}

/**
 * Initializes a new Match.
 */
export function createMatch(
  rulesConfig: Partial<GameRulesConfig> = {}
): MatchState {
  const rules = { ...DEFAULT_RULES, ...rulesConfig };
  return {
    targetScore: rules.targetScore,
    scores: [0, 0],
    currentRound: null,
    roundHistory: Object.freeze([]),
    isMatchOver: false,
    matchWinner: null
  };
}

export interface StartRoundOptions {
  customDeck?: readonly Tile[];
  rng?: RngFunction;
  rules?: GameRulesConfig;
}

/**
 * Starts a new round within an active match.
 * Generates and shuffles tiles, deals 7 tiles to each player, and establishes the starter seat.
 */
export function startRound(
  match: MatchState,
  options: StartRoundOptions = {}
): MatchState {
  if (match.isMatchOver) {
    throw new Error('Cannot start round: match is already over');
  }

  const rules = options.rules ?? DEFAULT_RULES;
  const roundNumber = match.roundHistory.length + 1;

  // 1. Generate or use provided deck
  let deck = options.customDeck ?? generateFullDeck();
  if (!options.customDeck) {
    deck = shuffleDeck(deck, options.rng);
  }

  // 2. Deal hands
  const hands = dealHands(deck);

  // 3. Determine starter seat
  let starterSeat: SeatIndex;
  if (roundNumber === 1) {
    if (rules.firstRoundStarter === 'highestDouble') {
      starterSeat = findHighestDoubleSeat(hands);
    } else {
      starterSeat = findDoubleSixSeat(hands);
    }
  } else {
    const lastResult = match.roundHistory[match.roundHistory.length - 1];
    if (rules.subsequentRoundStarter === 'clockwise' || !lastResult || lastResult.winningSeat === null) {
      const prevStarter = match.currentRound?.starterSeat ?? 0;
      starterSeat = getNextSeat(prevStarter);
    } else {
      starterSeat = lastResult.winningSeat;
    }
  }

  const newRound: RoundState = {
    roundNumber,
    activeSeat: starterSeat,
    starterSeat,
    hands,
    board: createEmptyBoard(),
    consecutivePasses: 0,
    isRoundOver: false,
    result: null
  };

  return {
    ...match,
    currentRound: newRound
  };
}

/**
 * Executes a tile play action by the active player.
 */
export function playMove(
  match: MatchState,
  seat: SeatIndex,
  tileId: string,
  end: 'left' | 'right',
  rules: GameRulesConfig = DEFAULT_RULES
): MatchState {
  if (match.isMatchOver) {
    throw new Error('Cannot play: match is already over');
  }

  const round = match.currentRound;
  if (!round || round.isRoundOver) {
    throw new Error('Cannot play: no active round');
  }

  if (round.activeSeat !== seat) {
    throw new Error(`Out of turn: active seat is ${round.activeSeat}, but seat ${seat} attempted to play`);
  }

  const playerHand = round.hands[seat];
  const validation = validateMove(round.board, playerHand, tileId, end);
  if (!validation.valid || !validation.tile) {
    throw new Error(`Invalid move: ${validation.error}`);
  }

  const tileToPlay = validation.tile;

  // If Round 1, board is empty, and firstRoundStarter is doubleSix, verify tile is [6|6]
  if (round.roundNumber === 1 && round.board.tiles.length === 0 && rules.firstRoundStarter === 'doubleSix') {
    if (tileToPlay.left !== 6 || tileToPlay.right !== 6) {
      throw new Error('First move of round 1 must be the double-six [6|6]');
    }
  }

  // Apply move to board
  const newBoard = placeTile(round.board, tileToPlay, end);

  // Remove tile from player's hand
  const newHand = Object.freeze(playerHand.filter((t) => t.id !== tileId));
  const newHands: Record<SeatIndex, readonly Tile[]> = {
    ...round.hands,
    [seat]: newHand
  };

  const updatedRoundState: RoundState = {
    ...round,
    hands: newHands,
    board: newBoard,
    consecutivePasses: 0 // A successful play resets the pass counter
  };

  // Check if this move triggers the end of the round ("Domino!")
  const roundResult = checkRoundEnd(updatedRoundState, rules);

  if (roundResult) {
    return resolveRoundCompletion(match, updatedRoundState, roundResult, rules);
  }

  // Move continues: advance turn to next clockwise player
  return {
    ...match,
    currentRound: {
      ...updatedRoundState,
      activeSeat: getNextSeat(seat)
    }
  };
}

/**
 * Executes a pass action by the active player.
 */
export function passTurn(
  match: MatchState,
  seat: SeatIndex,
  rules: GameRulesConfig = DEFAULT_RULES
): MatchState {
  if (match.isMatchOver) {
    throw new Error('Cannot pass: match is already over');
  }

  const round = match.currentRound;
  if (!round || round.isRoundOver) {
    throw new Error('Cannot pass: no active round');
  }

  if (round.activeSeat !== seat) {
    throw new Error(`Out of turn: active seat is ${round.activeSeat}, but seat ${seat} attempted to pass`);
  }

  const playerHand = round.hands[seat];
  if (!canPlayerPass(round.board, playerHand, rules.allowPassOnlyWhenNoMoves)) {
    throw new Error('Illegal pass: player holds at least one legal move');
  }

  const updatedRoundState: RoundState = {
    ...round,
    consecutivePasses: round.consecutivePasses + 1
  };

  // Check if 4 consecutive passes occurred (Blocked Game)
  const roundResult = checkRoundEnd(updatedRoundState, rules);

  if (roundResult) {
    return resolveRoundCompletion(match, updatedRoundState, roundResult, rules);
  }

  // Advance turn to next clockwise player
  return {
    ...match,
    currentRound: {
      ...updatedRoundState,
      activeSeat: getNextSeat(seat)
    }
  };
}

/**
 * Resolves score updates and match victory when a round ends.
 */
function resolveRoundCompletion(
  match: MatchState,
  round: RoundState,
  result: RoundResult,
  rules: GameRulesConfig
): MatchState {
  const finalizedRound: RoundState = {
    ...round,
    isRoundOver: true,
    result
  };

  let newScoreTeam0 = match.scores[0];
  let newScoreTeam1 = match.scores[1];

  if (result.winningTeam === 0) {
    newScoreTeam0 += result.pointsAwarded;
  } else if (result.winningTeam === 1) {
    newScoreTeam1 += result.pointsAwarded;
  }

  const newScores: readonly [number, number] = [newScoreTeam0, newScoreTeam1];
  const roundHistory = Object.freeze([...match.roundHistory, result]);

  // Check for match victory (target score reached)
  let isMatchOver = false;
  let matchWinner: TeamIndex | null = null;

  if (newScoreTeam0 >= match.targetScore || newScoreTeam1 >= match.targetScore) {
    isMatchOver = true;
    if (newScoreTeam0 > newScoreTeam1) {
      matchWinner = 0;
    } else if (newScoreTeam1 > newScoreTeam0) {
      matchWinner = 1;
    } else {
      // Tie breaker: winner of the final round takes match
      matchWinner = result.winningTeam;
    }
  }

  return {
    ...match,
    scores: newScores,
    currentRound: finalizedRound,
    roundHistory,
    isMatchOver,
    matchWinner
  };
}

/**
 * Generates a privacy-filtered view of the game state for a specific player seat.
 * Opponents' private hands are completely excluded.
 */
export function getPlayerView(
  match: MatchState,
  seat: SeatIndex,
  rules: GameRulesConfig = DEFAULT_RULES
): PlayerPublicView {
  const myTeam = getTeamForSeat(seat);
  const round = match.currentRound;

  if (!round) {
    return {
      mySeat: seat,
      myTeam,
      roundNumber: 1,
      scores: match.scores,
      targetScore: match.targetScore,
      activeSeat: null,
      isMyTurn: false,
      myHand: Object.freeze([]),
      opponentTileCounts: { 0: 0, 1: 0, 2: 0, 3: 0 },
      board: createEmptyBoard(),
      isRoundOver: false,
      roundResult: null,
      isMatchOver: match.isMatchOver,
      matchWinner: match.matchWinner,
      legalMoves: Object.freeze([]),
      canPass: false
    };
  }

  const isMyTurn = !round.isRoundOver && round.activeSeat === seat;
  const myHand = round.hands[seat];

  const opponentTileCounts: Record<SeatIndex, number> = {
    0: round.hands[0].length,
    1: round.hands[1].length,
    2: round.hands[2].length,
    3: round.hands[3].length
  };

  const legalMoves = isMyTurn ? getLegalMovesForHand(round.board, myHand) : Object.freeze([]);
  const canPass = isMyTurn ? canPlayerPass(round.board, myHand, rules.allowPassOnlyWhenNoMoves) : false;

  return {
    mySeat: seat,
    myTeam,
    roundNumber: round.roundNumber,
    scores: match.scores,
    targetScore: match.targetScore,
    activeSeat: round.isRoundOver ? null : round.activeSeat,
    isMyTurn,
    myHand,
    opponentTileCounts,
    board: round.board,
    isRoundOver: round.isRoundOver,
    roundResult: round.result,
    isMatchOver: match.isMatchOver,
    matchWinner: match.matchWinner,
    legalMoves,
    canPass
  };
}
