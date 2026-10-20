import React from 'react';
import { PipValue } from '@domino-duo/shared';
import { DominoPip } from './DominoPip';

interface DominoHalfProps {
  value: PipValue;
  pipSize?: number;
}

export const DominoHalf: React.FC<DominoHalfProps> = ({ value, pipSize = 6 }) => {
  // 3x3 grid positions: [row, col] (0-indexed)
  // Grid row/col indices 1..3
  const getPipsForValue = (val: PipValue): Array<[number, number]> => {
    switch (val) {
      case 0:
        return [];
      case 1:
        return [[2, 2]];
      case 2:
        return [[1, 3], [3, 1]];
      case 3:
        return [[1, 3], [2, 2], [3, 1]];
      case 4:
        return [[1, 1], [1, 3], [3, 1], [3, 3]];
      case 5:
        return [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]];
      case 6:
        return [[1, 1], [1, 3], [2, 1], [2, 3], [3, 1], [3, 3]];
      default:
        return [];
    }
  };

  const pips = getPipsForValue(value);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        alignItems: 'center',
        justifyItems: 'center',
        width: '100%',
        height: '100%',
        padding: '3px'
      }}
    >
      {pips.map(([row, col], idx) => (
        <div
          key={idx}
          style={{
            gridRow: row,
            gridColumn: col,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <DominoPip size={pipSize} />
        </div>
      ))}
    </div>
  );
};
