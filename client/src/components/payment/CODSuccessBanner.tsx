import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import type { OrderResponse } from '../../types';

interface CODSuccessBannerProps {
  order: OrderResponse;
}

export const CODSuccessBanner: React.FC<CODSuccessBannerProps> = ({ order }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-green-200 overflow-hidden animate-fadeIn">
      {/* Success Header with Green Background */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full p-2 shadow-lg">
            <FaCheckCircle className="text-green-600 text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Đặt hàng thành công!</h2>
            <p className="text-green-50 text-sm">
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
              <h3 className="text-base font-semibold text-gray-900 mb-2">Đơn hàng đã được xác nhận</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Cảm ơn bạn đã đặt hàng! Đơn hàng của bạn đã được tiếp nhận và đang được xử lý. 
                Bạn sẽ thanh toán khi nhận hàng
              </p>
            </div>
          </div>
        </div>

       
      </div>
    </div>
  );
};

