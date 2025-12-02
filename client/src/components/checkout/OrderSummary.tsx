import React from 'react';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import type { CartItem } from '../../types';
import { getPrimaryImageUrl, formatCurrency } from '../../utils/helpers';

interface OrderSummaryProps {
  cartItems: CartItem[];
  onSubmit: () => void;
  isProcessing: boolean;
  showQRWarning: boolean;
  isPaymentConfirmed: boolean;
  discount?: number; // Thêm discount
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  cartItems,
  onSubmit,
  isProcessing,
  showQRWarning,
  isPaymentConfirmed,
  discount = 0, // Default 0
}) => {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.unitPrice * item.quantity,
    0
  );
  const shippingFee = 0; // Free shipping
  const total = subtotal + shippingFee - discount; // Trừ discount

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm sticky top-5">
      <h3 className="text-xl font-semibold mb-6 pb-3 border-b-2 border-gray-100">
        Sản phẩm
      </h3>

      {/* Cart Items */}
      <div className="max-h-[300px] overflow-y-auto mb-6 pr-2 space-y-4 custom-scrollbar">
        {cartItems.map((item, index) => (
          <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0">
            <img
              src={getPrimaryImageUrl(item.product)}
              alt={item.product.name}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60';
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight mb-1">
                    {item.product.name}
                  </h4>
                  <p className="text-sm text-gray-500">× {item.quantity}</p>
                </div>
                <div className="text-lg md:text-xl font-semibold text-gray-900 whitespace-nowrap">
                  {formatCurrency(item.product.unitPrice * item.quantity)} ₫
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 my-6" />

      {/* Summary */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-base">
          <span className="text-gray-600">Tạm tính</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(subtotal)} ₫
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-base">
            <span className="text-gray-600">Giảm giá</span>
            <span className="font-semibold text-red-600">
              -{formatCurrency(discount)} ₫
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-6 border-t-2 border-gray-900 mb-6">
        <span className="text-xl font-semibold text-gray-900">Tổng</span>
        <span className="text-2xl font-bold text-gray-900">
          {formatCurrency(total)} ₫
        </span>
      </div>

      {/* QR Payment Warning */}
      {showQRWarning && !isPaymentConfirmed && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg mb-6 animate-fadeIn">
          <FaExclamationCircle className="text-yellow-500 text-2xl flex-shrink-0" />
          <p className="text-sm text-yellow-800 font-medium">
            Vui lòng quét mã QR và hoàn tất thanh toán trước khi đặt hàng
          </p>
        </div>
      )}

      {/* Place Order Button */}
      {!showQRWarning && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isProcessing}
          className={`relative btn-slide-overlay-dark overflow-hidden w-full py-2.5 rounded-full font-semibold text-lg ${isPaymentConfirmed
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white '
              : 'bg-black text-white hover:bg-gray-800 '
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2`}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Đang xử lý...
            </>
          ) : (
            <>
              <span className="flex items-center gap-3 relative z-10"> <FaCheckCircle />
                Đặt hàng</span>
            </>
          )}
        </button>
      )}

      {/* Shipping Note */}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.8);
          }
        }
        .animate-glow {
          animation: glow 2s infinite;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
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

