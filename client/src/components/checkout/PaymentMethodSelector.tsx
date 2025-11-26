import React from 'react';
import { FaMoneyBillWave, FaQrcode } from 'react-icons/fa';
import type { CheckoutFormData } from '../../types';

interface PaymentMethodSelectorProps {
  selectedMethod: CheckoutFormData['paymentMethod'];
  onSelect: (method: CheckoutFormData['paymentMethod']) => void;
  onQRPaymentSelect?: () => void;
  validationError?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelect,
  onQRPaymentSelect,
  validationError,
}) => {
  const handleMethodChange = (method: CheckoutFormData['paymentMethod']) => {
    onSelect(method);
    if (method === 'qr-payment' && onQRPaymentSelect) {
      onQRPaymentSelect();
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm mt-6">
      <h2 className="text-xl md:text-2xl font-semibold mb-6 pb-3 border-b-2 border-gray-100">
        Phương thức thanh toán
      </h2>

      <div className="space-y-4">
        {/* COD - Trả tiền mặt khi nhận hàng */}
        <div className="relative">
          <input
            type="radio"
            id="cod"
            name="paymentMethod"
            value="cod"
            checked={selectedMethod === 'cod'}
            onChange={() => handleMethodChange('cod')}
            className="absolute opacity-0 cursor-pointer"
          />
          <label
            htmlFor="cod"
            className={`flex items-start p-5 border-2 rounded-lg cursor-pointer transition-all ${
              selectedMethod === 'cod'
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-5 h-5 rounded-full border-2 mr-4 mt-0.5 flex-shrink-0 relative transition-all ${
                  selectedMethod === 'cod'
                    ? 'border-black bg-black'
                    : 'border-gray-300'
                }`}
              >
                {selectedMethod === 'cod' && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 font-semibold text-lg mb-2">
                <FaMoneyBillWave className="text-green-600" />
                <span>Trả tiền mặt khi nhận hàng</span>
              </div>
              {selectedMethod === 'cod' && (
                <p className="text-sm text-gray-600 mt-2 animate-fadeIn">
                  Thanh toán bằng tiền mặt khi nhận hàng tại địa chỉ của bạn.
                </p>
              )}
            </div>
          </label>
        </div>

        {/* QR Payment */}
        <div className="relative">
          <input
            type="radio"
            id="qr-payment"
            name="paymentMethod"
            value="qr-payment"
            checked={selectedMethod === 'qr-payment'}
            onChange={() => handleMethodChange('qr-payment')}
            className="absolute opacity-0 cursor-pointer"
          />
          <label
            htmlFor="qr-payment"
            className={`flex items-start p-5 border-2 rounded-lg cursor-pointer transition-all ${
              selectedMethod === 'qr-payment'
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-5 h-5 rounded-full border-2 mr-4 mt-0.5 flex-shrink-0 relative transition-all ${
                  selectedMethod === 'qr-payment'
                    ? 'border-black bg-black'
                    : 'border-gray-300'
                }`}
              >
                {selectedMethod === 'qr-payment' && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 font-semibold text-lg mb-2">
                <FaQrcode className="text-blue-600" />
                <span>Thanh toán QR Code</span>
              </div>
            </div>
          </label>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-500 rounded-lg">
            <p className="text-sm text-red-600 font-medium">
              {validationError}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

