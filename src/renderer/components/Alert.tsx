import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  dismissible?: boolean;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  message,
  onClose,
  dismissible = true,
}) => {
  const typeConfig = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: '✓',
      iconColor: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '✕',
      iconColor: 'text-red-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: '!',
      iconColor: 'text-yellow-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ',
      iconColor: 'text-blue-600',
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`${config.bg} border ${config.border} ${config.text} px-4 py-3 rounded-lg flex items-start gap-3 mb-4`}
      role="alert"
    >
      <span className={`${config.iconColor} font-bold text-lg flex-shrink-0`}>
        {config.icon}
      </span>
      <p className="text-sm flex-1">{message}</p>
      {dismissible && onClose && (
        <button
          onClick={onClose}
          className={`${config.text} hover:opacity-70 transition flex-shrink-0`}
          aria-label="Close alert"
        >
          ✕
        </button>
      )}
    </div>
  );
};
