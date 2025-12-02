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
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.02)] border border-slate-100 mt-6">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-800 mb-6 pb-4 border-b-2 border-slate-100">
        Phương thức thanh toán
      </h2>

      <div className="space-y-3">
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
            className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
              selectedMethod === 'cod'
                ? 'border-black bg-slate-50 shadow-md'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center flex-1 gap-4">
              {/* Radio Button */}
              <div
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 relative transition-all ${
                  selectedMethod === 'cod'
                    ? 'border-black bg-black'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {selectedMethod === 'cod' && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full" />
                )}
              </div>

              {/* Icon */}
              <div className={`p-3 rounded-lg flex-shrink-0 ${
                selectedMethod === 'cod' ? 'bg-green-100' : 'bg-slate-100'
              }`}>
                <FaMoneyBillWave className={`text-xl ${
                  selectedMethod === 'cod' ? 'text-green-600' : 'text-slate-500'
                }`} />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 font-semibold text-base md:text-lg text-slate-800 mb-1">
                  <span>Trả tiền mặt khi nhận hàng</span>
                </div>
                {selectedMethod === 'cod' && (
                  <p className="text-sm text-slate-600 mt-1 animate-fadeIn">
                    Thanh toán bằng tiền mặt khi nhận hàng tại địa chỉ của bạn
                  </p>
                )}
              </div>
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
            className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
              selectedMethod === 'qr-payment'
                ? 'border-black bg-slate-50 shadow-md'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center flex-1 gap-4">
              {/* Radio Button */}
              <div
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 relative transition-all ${
                  selectedMethod === 'qr-payment'
                    ? 'border-black bg-black'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {selectedMethod === 'qr-payment' && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full" />
                )}
              </div>

              {/* Icon */}
              <div className={`p-3 rounded-lg flex-shrink-0 ${
                selectedMethod === 'qr-payment' ? 'bg-blue-100' : 'bg-slate-100'
              }`}>
                <FaQrcode className={`text-xl ${
                  selectedMethod === 'qr-payment' ? 'text-blue-600' : 'text-slate-500'
                }`} />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 font-semibold text-base md:text-lg text-slate-800 mb-1">
                  <span>Thanh toán QR Code</span>
                </div>
                {selectedMethod === 'qr-payment' && (
                  <p className="text-sm text-slate-600 mt-1 animate-fadeIn">
                    Quét mã QR để thanh toán nhanh chóng và an toàn
                  </p>
                )}
              </div>
            </div>
          </label>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-500 rounded-lg animate-fadeIn">
            <p className="text-sm text-red-600 font-medium">
              {validationError}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

