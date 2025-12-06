import React from 'react';
import { FaEnvelope, FaSpinner } from 'react-icons/fa';
import { IoIosSearch } from "react-icons/io";

interface OrderSearchFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
}

export const OrderSearchForm: React.FC<OrderSearchFormProps> = ({
  email,
  onEmailChange,
  onSubmit,
  isLoading,
  error,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            <FaEnvelope className="inline mr-2 mt-[-3px]" />
            Email đặt hàng
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Nhập email bạn đã dùng khi đặt hàng"
            className="w-full px-6 py-2 border border-gray-300 rounded-full  focus:border-black outline-none"
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading}
            className="relative btn-slide-overlay-dark overflow-hidden w-full md:w-auto px-8 py-2 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin text-white" />
                Đang tìm...
              </>
            ) : (
              <>
                <span className="flex items-center gap-2 relative z-10"><IoIosSearch size={24}/>
                Tìm kiếm</span>
              </>
            )}
          </button>
        </div>
      </form>
      {error && (
        <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

