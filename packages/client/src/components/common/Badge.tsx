import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'team0' | 'team1' | 'success' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md'
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'team0':
        return {
          backgroundColor: 'rgba(56, 189, 248, 0.18)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.35)'
        };
      case 'team1':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.18)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.35)'
        };
      case 'success':
        return {
          backgroundColor: 'rgba(52, 211, 153, 0.18)',
          color: '#34d399',
          border: '1px solid rgba(52, 211, 153, 0.35)'
        };
      case 'warning':
        return {
          backgroundColor: 'rgba(251, 146, 60, 0.18)',
          color: '#fb923c',
          border: '1px solid rgba(251, 146, 60, 0.35)'
        };
      case 'neutral':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          color: '#d1d5db',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        };
    }
  };

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: isSmall ? '2px 8px' : '4px 10px',
        borderRadius: '9999px',
        fontSize: isSmall ? '0.72rem' : '0.82rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        ...getVariantStyles()
      }}
    >
      {children}
    </span>
  );
};
