import React from 'react';
import { Tile, isDouble } from '@domino-duo/shared';
import { DominoHalf } from './DominoHalf';

export interface DominoTileProps {
  tile: Tile;
  orientation?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
  isPlayable?: boolean;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const DominoTile: React.FC<DominoTileProps> = ({
  tile,
  orientation = 'vertical',
  size = 'md',
  isPlayable = false,
  isSelected = false,
  disabled = false,
  onClick,
  className = ''
}) => {
  // Dimension definitions
  const dimensions = {
    sm: { width: 28, height: 56, pip: 4, rivet: 3.5 },
    md: { width: 44, height: 88, pip: 6, rivet: 5 },
    lg: { width: 56, height: 112, pip: 7.5, rivet: 6 }
  }[size];

  const isHoriz = orientation === 'horizontal';
  const width = isHoriz ? dimensions.height : dimensions.width;
  const height = isHoriz ? dimensions.width : dimensions.height;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={handleKeyDown}
      aria-label={`Domino tile ${tile.left} and ${tile.right}${isPlayable ? ', playable' : ''}`}
      aria-disabled={disabled}
      className={`domino-tile-face ${isPlayable ? 'playable-tile-anim' : ''} ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        flexDirection: isHoriz ? 'row' : 'column',
        cursor: onClick && !disabled ? 'pointer' : 'default',
        opacity: disabled ? 0.75 : 1,
        border: isSelected
          ? '2px solid #34d399'
          : isPlayable
          ? '2px solid #10b981'
          : '1.5px solid var(--color-tile-border)',
        transform: isSelected ? 'translateY(-6px)' : undefined,
        flexShrink: 0,
        position: 'relative'
      }}
    >
      {/* First Half */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <DominoHalf value={tile.left} pipSize={dimensions.pip} />
      </div>

      {/* Center Divider with Brass Spinner Rivet */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isHoriz ? '1px' : '100%',
          height: isHoriz ? '100%' : '1px',
          backgroundColor: 'var(--color-tile-divider)'
        }}
      >
        <div
          title="Spinner pin"
          style={{
            position: 'absolute',
            width: `${dimensions.rivet}px`,
            height: `${dimensions.rivet}px`,
            borderRadius: '50%',
            backgroundColor: 'var(--color-tile-rivet)',
            boxShadow: '0 0.5px 1px rgba(0,0,0,0.5), inset 0 0.5px 0.5px rgba(255,255,255,0.8)',
            zIndex: 2
          }}
        />
      </div>

      {/* Second Half */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <DominoHalf value={tile.right} pipSize={dimensions.pip} />
      </div>
    </div>
  );
};
