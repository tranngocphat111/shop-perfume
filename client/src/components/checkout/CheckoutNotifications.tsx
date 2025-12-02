import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SuccessNotification } from '../common';
import { OutOfStockModal } from '../common/OutOfStockModal';

interface CheckoutNotificationsProps {
  showSuccessNotification: boolean;
  successMessage: { message: string; subMessage?: string } | null;
  isErrorNotification: boolean;
  onClose: () => void;
}

export const CheckoutNotifications: React.FC<CheckoutNotificationsProps> = ({
  showSuccessNotification,
  successMessage,
  isErrorNotification,
  onClose,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Success Notification - Only for success messages */}
      {showSuccessNotification && successMessage && !isErrorNotification && (
        <SuccessNotification
          message={successMessage.message}
          subMessage={successMessage.subMessage}
          isError={false}
          duration={3000}
          onClose={onClose}
        />
      )}

      {/* Out of Stock Modal - Blocks interaction for error messages */}
      {showSuccessNotification && successMessage && isErrorNotification && (
        <OutOfStockModal
          isOpen={true}
          message={successMessage.message}
          subMessage={successMessage.subMessage}
          autoRedirectDelay={3}
          onAutoRedirect={() => {
            onClose();
            navigate('/cart', { replace: true });
          }}
          onClose={() => {
            onClose();
            navigate('/cart', { replace: true });
          }}
        />
      )}
    </>
  );
};

