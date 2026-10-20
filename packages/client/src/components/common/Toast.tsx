import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#34d399" />;
      case 'error':
        return <AlertCircle size={18} color="#f87171" />;
      case 'info':
        return <Info size={18} color="#60a5fa" />;
    }
  };

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        backgroundColor: '#111827',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        borderRadius: '12px',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#f9fafb',
        fontSize: '0.9rem',
        fontWeight: 600,
        pointerEvents: 'none'
      }}
    >
      {getIcon()}
      <span>{message}</span>
    </div>
  );
};
