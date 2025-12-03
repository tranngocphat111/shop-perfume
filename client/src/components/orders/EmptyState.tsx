import React from 'react';
import { FaReceipt, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  type: 'no-search' | 'no-orders';
  email?: string;
  isAuthenticated?: boolean;
  onReset?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  email,
  isAuthenticated = false,
  onReset,
}) => {
  const navigate = useNavigate();

  if (type === 'no-search') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <FaSearch className="text-6xl text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Nhập email để tra cứu đơn hàng</h3>
        <p className="text-gray-500">
          Vui lòng nhập email bạn đã sử dụng khi đặt hàng để xem các đơn hàng của bạn.
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 px-6 text-center">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-6">
        <FaReceipt className="text-5xl text-gray-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">Không có đơn hàng</h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        {isAuthenticated
          ? 'Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!'
          : email
          ? `Không có đơn hàng nào được tìm thấy với email ${email}`
          : 'Không có đơn hàng nào được tìm thấy'}
      </p>
      <div className="flex gap-3 justify-center">
        {onReset && (
          <button
            onClick={onReset}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Tìm lại
          </button>
        )}
        <button
          onClick={() => navigate('/products')}
          className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
        >
          Xem sản phẩm
        </button>
      </div>
    </div>
  );
};

