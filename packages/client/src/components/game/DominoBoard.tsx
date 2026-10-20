import React, { useRef, useEffect } from 'react';
import { BoardChain, Tile, isDouble } from '@domino-duo/shared';
import { DominoTile } from '../tile/DominoTile';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface DominoBoardProps {
  board: BoardChain;
  selectedTile: Tile | null;
  playableEndsForSelected: ('left' | 'right')[];
  onSelectEnd: (end: 'left' | 'right') => void;
}

export const DominoBoard: React.FC<DominoBoardProps> = ({
  board,
  selectedTile,
  playableEndsForSelected,
  onSelectEnd
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to center or right when tiles change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth) / 2;
    }
  }, [board.tiles.length]);

  const isEmpty = board.tiles.length === 0;

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        minHeight: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '16px'
      }}
    >
      {isEmpty ? (
        <div
          style={{
            textAlign: 'center',
            padding: '24px 32px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            border: '2px dashed rgba(52, 211, 153, 0.3)',
            borderRadius: '16px',
            maxWidth: '360px'
          }}
        >
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f9fafb', marginBottom: '4px' }}>
            Board is Empty
          </div>
          <div style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>
            {selectedTile
              ? 'Click your opening tile in the dock to place it'
              : 'Opening player must start the domino chain'}
          </div>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            padding: '24px',
            maxWidth: '100%',
            scrollbarWidth: 'thin',
            position: 'relative'
          }}
        >
          {/* Left End Action Target */}
          {selectedTile && playableEndsForSelected.includes('left') && (
            <button
              onClick={() => onSelectEnd('left')}
              title={`Place [${selectedTile.left}|${selectedTile.right}] on left end`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: '2px solid #34d399',
                borderRadius: '10px',
                padding: '8px 12px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(52, 211, 153, 0.7)',
                flexShrink: 0,
                animation: 'pulseGlow 1.5s infinite'
              }}
            >
              <ArrowLeft size={16} />
              <span>Connect Left ({board.leftEndValue})</span>
            </button>
          )}

          {/* Placed Domino Tiles */}
          {board.tiles.map((tile: Tile, index: number) => {
            const isTileDouble = isDouble(tile);
            // Doubles are rendered vertically (crosswise to chain); others horizontal
            const orientation = isTileDouble ? 'vertical' : 'horizontal';

            return (
              <div
                key={`${tile.id}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <DominoTile
                  tile={tile}
                  orientation={orientation}
                  size="sm"
                />
              </div>
            );
          })}

          {/* Right End Action Target */}
          {selectedTile && playableEndsForSelected.includes('right') && (
            <button
              onClick={() => onSelectEnd('right')}
              title={`Place [${selectedTile.left}|${selectedTile.right}] on right end`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: '2px solid #34d399',
                borderRadius: '10px',
                padding: '8px 12px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(52, 211, 153, 0.7)',
                flexShrink: 0,
                animation: 'pulseGlow 1.5s infinite'
              }}
            >
              <span>Connect Right ({board.rightEndValue})</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
