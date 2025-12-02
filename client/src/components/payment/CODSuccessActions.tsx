import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import type { OrderResponse } from '../../types';

interface CODSuccessActionsProps {
  order: OrderResponse;
}

export const CODSuccessActions: React.FC<CODSuccessActionsProps> = ({ order }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => {
            if (isAuthenticated) {
              navigate('/profile');
            } else {
              navigate('/my-orders', { state: { email: order.guestEmail } });
            }
          }}
          className="relative btn-slide-overlay-dark overflow-hidden flex-1 bg-black text-white px-4 py-3 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
        >
          <span className="flex items-center gap-1 relative z-10">
            <FaSearch className="text-xs" />
            Xem đơn hàng</span>
        </button>
        <button
          onClick={() => navigate('/')}
          className="relative btn-slide-overlay overflow-hidden flex-1 bg-white text-gray-900 px-4 py-3 rounded-full text-sm font-semibold border-[1px] border-gray-300 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md"
        >
          <span className="relative z-10">
            Về trang chủ
          </span>
        </button>
      </div>
    </div>
  );
};

