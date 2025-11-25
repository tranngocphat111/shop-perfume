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
          {isAuthenticated
            ? 'Email của bạn đã được điền sẵn. Nhấn "Tìm kiếm" để xem đơn hàng.'
            : 'Vui lòng nhập email bạn đã sử dụng khi đặt hàng để xem các đơn hàng của bạn.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <FaReceipt className="text-6xl text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy đơn hàng</h3>
      <p className="text-gray-500 mb-6">
        Không có đơn hàng nào được tìm thấy với email <span className="font-semibold">{email}</span>
      </p>
      <div className="flex gap-3 justify-center">
        {onReset && (
          <button
            onClick={onReset}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Tìm lại
          </button>
        )}
        <button
          onClick={() => navigate('/products')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Xem sản phẩm
        </button>
      </div>
    </div>
  );
};

