import React, { useEffect, useState } from 'react';
import { FaExclamationCircle, FaTimes } from 'react-icons/fa';

interface OutOfStockModalProps {
  isOpen: boolean;
  message: string;
  subMessage?: string;
  onClose?: () => void;
  autoRedirectDelay?: number; // Delay in seconds before auto redirect
  onAutoRedirect?: () => void;
}

export const OutOfStockModal: React.FC<OutOfStockModalProps> = ({
  isOpen,
  message,
  subMessage,
  onClose,
  autoRedirectDelay = 3,
  onAutoRedirect,
}) => {
  const [countdown, setCountdown] = useState(autoRedirectDelay);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(autoRedirectDelay);
      return;
    }

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Use setTimeout to avoid setState during render
          if (onAutoRedirect) {
            setTimeout(() => {
              onAutoRedirect();
            }, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isOpen, autoRedirectDelay, onAutoRedirect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <FaExclamationCircle className="text-red-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {subMessage && (
            <p className="text-gray-700 whitespace-pre-wrap break-words mb-4">
              {subMessage}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Tự động chuyển về giỏ hàng sau</span>
            <span className="font-bold text-red-600 text-lg">{countdown}</span>
            <span>giây</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose || onAutoRedirect}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Về giỏ hàng ngay
          </button>
        </div>
      </div>
    </div>
  );
};

