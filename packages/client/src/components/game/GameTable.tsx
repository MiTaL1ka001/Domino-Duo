import React, { useState } from 'react';
import {
  SeatIndex,
  Tile,
  PlayerPublicView,
  getPartnerSeat,
  canPlayOnEnd
} from '@domino-duo/shared';
import { RoomSession } from '../../types/ui';
import { GameHeader } from './GameHeader';
import { OpponentSeat } from './OpponentSeat';
import { DominoBoard } from './DominoBoard';
import { PlayerHand } from './PlayerHand';
import { EndPickerModal } from './EndPickerModal';
import { RoundResultsModal } from './RoundResultsModal';
import { MatchOverModal } from './MatchOverModal';

interface GameTableProps {
  session: RoomSession;
  playerView: PlayerPublicView;
  roundNumber: number;
  onPlayMove: (tileId: string, end: 'left' | 'right') => void;
  onPass: () => void;
  onNextRound: () => void;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export const GameTable: React.FC<GameTableProps> = ({
  session,
  playerView,
  roundNumber,
  onPlayMove,
  onPass,
  onNextRound,
  onPlayAgain,
  onLeave
}) => {
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const mySeat = playerView.mySeat;

  // Derive seating arrangement relative to mySeat
  // Partner is opposite (mySeat + 2) % 4
  const topSeat = getPartnerSeat(mySeat);
  // Left player is (mySeat + 3) % 4
  const leftSeat = ((mySeat + 3) % 4) as SeatIndex;
  // Right player is (mySeat + 1) % 4
  const rightSeat = ((mySeat + 1) % 4) as SeatIndex;

  const activeSlot = playerView.activeSeat !== null ? session.slots[playerView.activeSeat] : null;
  const activeName = activeSlot ? activeSlot.nickname : 'Waiting...';

  // Playable ends for the selected tile
  const getPlayableEnds = (tile: Tile | null): ('left' | 'right')[] => {
    if (!tile || !playerView.isMyTurn) return [];
    if (playerView.board.tiles.length === 0) return ['left']; // Opening play

    const ends: ('left' | 'right')[] = [];
    if (canPlayOnEnd(playerView.board, tile, 'left')) ends.push('left');
    if (canPlayOnEnd(playerView.board, tile, 'right')) ends.push('right');
    return ends;
  };

  const playableEnds = getPlayableEnds(selectedTile);

  const handleTileClick = (tile: Tile) => {
    if (!playerView.isMyTurn) return;

    // Check if this tile has legal moves
    const matchingMoves = playerView.legalMoves.filter((m: { tileId: string }) => m.tileId === tile.id);
    if (matchingMoves.length === 0) return;

    const availableEnds = getPlayableEnds(tile);

    if (availableEnds.length === 1 && availableEnds[0]) {
      // Unambiguous placement: place immediately!
      onPlayMove(tile.id, availableEnds[0]);
      setSelectedTile(null);
    } else if (availableEnds.length > 1) {
      // Tile fits on both Left and Right: show picker
      setSelectedTile(tile);
      setShowEndPicker(true);
    }
  };

  const handleChooseEnd = (end: 'left' | 'right') => {
    if (selectedTile) {
      onPlayMove(selectedTile.id, end);
      setSelectedTile(null);
      setShowEndPicker(false);
    }
  };

  return (
    <div
      className="felt-table"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Top HUD */}
      <GameHeader
        scores={playerView.scores}
        targetScore={playerView.targetScore}
        roundNumber={roundNumber}
        activeSeat={playerView.activeSeat}
        mySeat={mySeat}
        activePlayerName={activeName}
        onLeave={onLeave}
      />

      {/* Main Table Layout */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(60px, 120px) 1fr minmax(60px, 120px)',
          gridTemplateRows: 'auto 1fr',
          padding: '8px 12px',
          alignItems: 'center',
          justifyItems: 'center',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Top Opponent (Partner) */}
        <div style={{ gridColumn: '2', gridRow: '1', paddingBottom: '6px' }}>
          <OpponentSeat
            seat={topSeat}
            nickname={session.slots[topSeat]?.nickname ?? `Seat ${topSeat}`}
            tileCount={playerView.opponentTileCounts[topSeat] ?? 0}
            isActiveTurn={playerView.activeSeat === topSeat}
            position="top"
            isPartner={true}
          />
        </div>

        {/* Left Opponent */}
        <div style={{ gridColumn: '1', gridRow: '2', justifySelf: 'start', paddingLeft: '4px' }}>
          <OpponentSeat
            seat={leftSeat}
            nickname={session.slots[leftSeat]?.nickname ?? `Seat ${leftSeat}`}
            tileCount={playerView.opponentTileCounts[leftSeat] ?? 0}
            isActiveTurn={playerView.activeSeat === leftSeat}
            position="left"
            isPartner={false}
          />
        </div>

        {/* Center: Domino Chain Board */}
        <div
          style={{
            gridColumn: '2',
            gridRow: '2',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <DominoBoard
            board={playerView.board}
            selectedTile={selectedTile}
            playableEndsForSelected={playableEnds}
            onSelectEnd={handleChooseEnd}
          />
        </div>

        {/* Right Opponent */}
        <div style={{ gridColumn: '3', gridRow: '2', justifySelf: 'end', paddingRight: '4px' }}>
          <OpponentSeat
            seat={rightSeat}
            nickname={session.slots[rightSeat]?.nickname ?? `Seat ${rightSeat}`}
            tileCount={playerView.opponentTileCounts[rightSeat] ?? 0}
            isActiveTurn={playerView.activeSeat === rightSeat}
            position="right"
            isPartner={false}
          />
        </div>
      </div>

      {/* Bottom: Player's Interactive Hand Dock */}
      <PlayerHand
        hand={playerView.myHand}
        legalMoves={playerView.legalMoves}
        isMyTurn={playerView.isMyTurn}
        canPass={playerView.canPass}
        selectedTile={selectedTile}
        onTileClick={handleTileClick}
        onPass={onPass}
      />

      {/* Modal: Placement End Picker (Left vs. Right) */}
      <EndPickerModal
        isOpen={showEndPicker}
        tile={selectedTile}
        leftEndVal={playerView.board.leftEndValue}
        rightEndVal={playerView.board.rightEndValue}
        onChooseEnd={handleChooseEnd}
        onCancel={() => {
          setSelectedTile(null);
          setShowEndPicker(false);
        }}
      />

      {/* Modal: Round Results (Domino or Blocked Game) */}
      <RoundResultsModal
        isOpen={playerView.isRoundOver}
        result={playerView.roundResult}
        roundNumber={playerView.roundNumber || roundNumber}
        slots={session.slots}
        scores={playerView.scores}
        targetScore={playerView.targetScore}
        isHost={session.slots[playerView.mySeat]?.isHost ?? false}
        isMatchOver={playerView.isMatchOver}
        matchWinner={playerView.matchWinner}
        onNextRound={onNextRound}
        onPlayAgain={onPlayAgain}
        onLeave={onLeave}
      />
    </div>
  );
};
