import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInfoCircle, FaClock, FaCheckCircle, FaSpinner, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import type { OrderResponse } from '../../types';

interface PaymentStatusCardProps {
  isCancelled: boolean;
  isPaid: boolean;
  isChecking: boolean;
  timeRemaining: number | null;
  countdown: number;
  order: OrderResponse;
  onCheckPayment: () => void;
}

export const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({
  isCancelled,
  isPaid,
  isChecking,
  timeRemaining,
  countdown,
  order,
  onCheckPayment,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (isCancelled) {
    return (
      <div className="bg-white border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
        <div className="flex items-start gap-3">
          <FaInfoCircle className="text-red-500 text-lg mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h5 className="text-red-800 font-semibold text-sm mb-1.5">Đơn hàng đã bị hủy</h5>
            <p className="text-red-700 text-xs mb-3">Quá thời gian thanh toán (30 phút). Vui lòng đặt hàng lại.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="bg-white border-l-4 border-green-500 p-4 rounded-lg shadow-sm animate-fadeIn">
        <div className="flex items-start gap-3">
          <FaCheckCircle className="text-green-500 text-lg mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h5 className="text-green-800 font-semibold text-sm mb-1.5">Thanh toán thành công! 🎉</h5>
            <p className="text-green-700 text-xs mb-2.5">Đơn hàng của bạn đã được xác nhận</p>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/profile');
                  } else {
                    navigate('/my-orders', { state: { email: order.guestEmail } });
                  }
                }}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                Xem đơn hàng
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors"
              >
                Về trang chủ
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-green-600 text-[10px]">
              <FaSpinner className="animate-spin" />
              <span>Tự động chuyển về trang chủ sau 5 giây...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-l-4 border-yellow-500 p-4 rounded-lg shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <FaClock className="text-yellow-500 text-lg mt-0.5 flex-shrink-0 animate-pulse" />
        <div className="flex-1">
          <h5 className="text-yellow-800 font-semibold text-sm mb-1.5">Đang chờ thanh toán</h5>
          <p className="text-yellow-700 text-xs mb-2">Vui lòng quét mã QR và hoàn tất thanh toán</p>
        </div>
      </div>
      {timeRemaining !== null && timeRemaining > 0 && (
        <div className="bg-slate-50 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">Thời gian còn lại</span>
          <span className={`font-mono font-bold text-base ${timeRemaining < 300 ? 'text-red-600' : 'text-slate-800'}`}>
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-600 flex items-center gap-1.5">
          <FaSpinner className="animate-spin text-blue-500" />
          <span>Tự động kiểm tra sau: <span className="font-semibold">{countdown}s</span></span>
        </div>
        <button
          onClick={onCheckPayment}
          disabled={isChecking}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
        >
          {isChecking ? (
            <>
              <FaSpinner className="animate-spin text-xs" />
              Đang kiểm tra...
            </>
          ) : (
            <>
              <FaSearch className="text-xs" />
              Kiểm tra
            </>
          )}
        </button>
      </div>
    </div>
  );
};

