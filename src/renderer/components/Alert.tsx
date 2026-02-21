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
      bg: 'bg-green-50/90',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      ),
      iconColor: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50/90',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
        </svg>
      ),
      iconColor: 'text-red-600',
    },
    warning: {
      bg: 'bg-yellow-50/90',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      ),
      iconColor: 'text-yellow-600',
    },
    info: {
      bg: 'bg-brand-50/90',
      border: 'border-brand-200',
      text: 'text-brand-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
      ),
      iconColor: 'text-brand-600',
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`${config.bg} backdrop-blur-sm border ${config.border} ${config.text} px-4 py-3 rounded-xl flex items-start gap-3 mb-5 shadow-sm`}
      role="alert"
    >
      <span className={`${config.iconColor} flex-shrink-0 mt-0.5`}>
        {config.icon}
      </span>
      <p className="text-sm flex-1 font-medium">{message}</p>
      {dismissible && onClose && (
        <button
          onClick={onClose}
          className={`${config.text} rounded-lg p-0.5 hover:bg-black/5 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-black/10`}
          aria-label="Close alert"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
};
