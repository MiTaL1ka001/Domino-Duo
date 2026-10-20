import React from 'react';

interface DominoPipProps {
  size?: number;
}

export const DominoPip: React.FC<DominoPipProps> = ({ size = 6 }) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: '#18181b',
        boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.7), 0 0.5px 0.5px rgba(255, 255, 255, 0.4)'
      }}
    />
  );
};
