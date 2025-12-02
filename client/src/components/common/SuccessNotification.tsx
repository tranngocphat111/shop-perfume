import React, { useEffect } from 'react';

interface SuccessNotificationProps {
  message: string;
  subMessage?: string;
  duration?: number;
  onClose?: () => void;
  isError?: boolean; // New prop to indicate error state
}

export const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  message,
  subMessage,
  duration = 3000,
  onClose,
  isError = false,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = isError ? 'bg-red-500' : 'bg-green-500';
  const icon = isError ? (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  ) : (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
  );

  return (
    <div className={`fixed top-24 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in flex items-center gap-3`}>
      {icon}
      <div>
        <p className="font-semibold">{message}</p>
        {subMessage && <p className="text-sm">{subMessage}</p>}
      </div>
    </div>
  );
};

