import React from 'react';
import { FaEnvelope, FaSearch, FaSpinner } from 'react-icons/fa';

interface OrderSearchFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export const OrderSearchForm: React.FC<OrderSearchFormProps> = ({
  email,
  onEmailChange,
  onSubmit,
  isLoading,
  error,
  isAuthenticated,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            <FaEnvelope className="inline mr-2" />
            Email đặt hàng
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Nhập email bạn đã dùng khi đặt hàng"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                Đang tìm...
              </>
            ) : (
              <>
                <FaSearch />
                Tìm kiếm
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

