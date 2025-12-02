import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaMoneyBillWave, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import type { OrderResponse } from '../../types';

interface CODSuccessCardProps {
  order: OrderResponse;
}

export const CODSuccessCard: React.FC<CODSuccessCardProps> = ({ order }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-green-200 overflow-hidden animate-fadeIn">
      {/* Success Header with Green Background */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full p-2 shadow-lg">
            <FaCheckCircle className="text-green-600 text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-0.5">Đặt hàng thành công!</h2>
            <p className="text-green-50 text-xs">
              Mã đơn hàng: <span className="font-mono font-semibold">#{order.orderId}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Success Content */}
      <div className="p-5">
        {/* Success Message */}
        <div className="mb-4">
          <div className="flex items-start gap-2.5 mb-3">
            <div className="w-0.5 h-8 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Đơn hàng đã được xác nhận</h3>
              <p className="text-gray-600 text-xs leading-relaxed">
                Cảm ơn bạn đã đặt hàng! Đơn hàng của bạn đã được tiếp nhận và đang được xử lý. 
                Bạn sẽ thanh toán khi nhận hàng (COD).
              </p>
            </div>
          </div>
        </div>

        {/* Payment Method Badge */}
        <div className="flex items-center justify-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <FaMoneyBillWave className="text-green-600 text-xs" />
            <span className="text-xs font-semibold text-green-700">Trả tiền mặt khi nhận hàng</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              if (isAuthenticated) {
                navigate('/profile');
              } else {
                navigate('/my-orders', { state: { email: order.guestEmail } });
              }
            }}
            className="flex-1 bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
          >
            <FaSearch className="text-xs" />
            Xem đơn hàng
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold border-2 border-gray-300 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

