import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  disabled,
  style,
  className = '',
  ...props
}) => {
  // Styles based on variant
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#10b981',
          color: '#ffffff',
          border: '1px solid #059669',
          boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
        };
      case 'accent':
        return {
          backgroundColor: '#f59e0b',
          color: '#ffffff',
          border: '1px solid #d97706',
          boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
        };
      case 'secondary':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: '#f3f4f6',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(4px)'
        };
      case 'danger':
        return {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          border: '1px solid #dc2626'
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: '#9ca3af',
          border: 'none'
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '6px 12px', fontSize: '0.85rem', minHeight: '36px' };
      case 'md':
        return { padding: '10px 18px', fontSize: '0.95rem', minHeight: '44px' };
      case 'lg':
        return { padding: '14px 24px', fontSize: '1.05rem', minHeight: '52px', fontWeight: 700 };
    }
  };

  return (
    <button
      disabled={disabled}
      className={`app-button ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '10px',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'all 0.15s ease-in-out',
        width: fullWidth ? '100%' : 'auto',
        textDecoration: 'none',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style
      }}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
};
