import React from 'react';
import { Tile, LegalMove } from '@domino-duo/shared';
import { DominoTile } from '../tile/DominoTile';
import { Button } from '../common/Button';
import { SkipForward, Hand } from 'lucide-react';

interface PlayerHandProps {
  hand: readonly Tile[];
  legalMoves: readonly LegalMove[];
  isMyTurn: boolean;
  canPass: boolean;
  selectedTile: Tile | null;
  onTileClick: (tile: Tile) => void;
  onPass: () => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  legalMoves,
  isMyTurn,
  canPass,
  selectedTile,
  onTileClick,
  onPass
}) => {
  const legalTileIds = new Set(legalMoves.map((m) => m.tileId));

  return (
    <div
      style={{
        backgroundColor: 'rgba(8, 26, 15, 0.95)',
        borderTop: '1.5px solid rgba(52, 211, 153, 0.3)',
        boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        zIndex: 25
      }}
    >
      {/* Hand status label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '800px',
          fontSize: '0.8rem',
          color: '#a7f3d0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Hand size={14} color="#34d399" />
          <span style={{ fontWeight: 700, color: '#f3f4f6' }}>
            Your Hand ({hand.length} {hand.length === 1 ? 'tile' : 'tiles'})
          </span>
          {isMyTurn && legalMoves.length > 0 && (
            <span style={{ color: '#34d399', fontWeight: 600 }}>
              • {legalTileIds.size} playable {legalTileIds.size === 1 ? 'tile' : 'tiles'} highlighted
            </span>
          )}
          {isMyTurn && legalMoves.length === 0 && (
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>
              • No legal moves available — you must Pass
            </span>
          )}
        </div>

        {/* Pass Button */}
        <Button
          variant={canPass ? 'accent' : 'secondary'}
          size="sm"
          disabled={!canPass}
          onClick={onPass}
          icon={<SkipForward size={14} />}
          title={
            canPass
              ? 'Pass your turn (no legal moves)'
              : 'Pass is strictly disabled while you hold playable tiles'
          }
        >
          Pass Turn
        </Button>
      </div>

      {/* Tiles container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          overflowX: 'auto',
          maxWidth: '100%',
          padding: '6px 4px 10px 4px',
          scrollbarWidth: 'none'
        }}
      >
        {hand.map((tile) => {
          const isPlayable = isMyTurn && legalTileIds.has(tile.id);
          const isSelected = selectedTile?.id === tile.id;

          return (
            <DominoTile
              key={tile.id}
              tile={tile}
              orientation="vertical"
              size="md"
              isPlayable={isPlayable}
              isSelected={isSelected}
              disabled={!isMyTurn}
              onClick={() => onTileClick(tile)}
            />
          );
        })}
      </div>
    </div>
  );
};
