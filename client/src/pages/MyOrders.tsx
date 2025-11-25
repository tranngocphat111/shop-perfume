import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { OrderResponse } from '../types';
import { formatCurrency } from '../utils/helpers';
import { FaReceipt, FaCalendarAlt, FaMoneyBillWave, FaTruck, FaCheckCircle, FaTimesCircle, FaClock, FaSpinner, FaEye, FaSearch, FaEnvelope } from 'react-icons/fa';

export const MyOrders: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [searchEmail, setSearchEmail] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-load orders if user is authenticated or email is passed from navigation
  useEffect(() => {
    const state = location.state as { email?: string } | null;
    if (state?.email) {
      setSearchEmail(state.email);
      fetchOrders(state.email);
    } else if (isAuthenticated && user?.email) {
      setSearchEmail(user.email);
      fetchOrders(user.email);
    }
  }, [isAuthenticated, user, location]);

  const fetchOrders = async (email?: string) => {
    const emailToSearch = email || searchEmail;
    
    if (!emailToSearch || !emailToSearch.trim()) {
      setError('Vui lòng nhập email để tìm kiếm đơn hàng');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToSearch.trim())) {
      setError('Email không hợp lệ. Vui lòng nhập đúng định dạng email.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const response = await apiService.get<OrderResponse[]>(`/orders/my-orders?email=${encodeURIComponent(emailToSearch.trim())}`);
      setOrders(response || []);
      if (response && response.length === 0) {
        setError(null); // Clear error if no orders found (not an error)
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.';
      setError(errorMessage);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const getPaymentStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      'PENDING': { label: 'Chờ thanh toán', color: 'text-yellow-600 bg-yellow-50', icon: <FaClock /> },
      'PAID': { label: 'Đã thanh toán', color: 'text-green-600 bg-green-50', icon: <FaCheckCircle /> },
      'FAILED': { label: 'Thanh toán thất bại', color: 'text-red-600 bg-red-50', icon: <FaTimesCircle /> },
    };
    return statusMap[status] || { label: status, color: 'text-gray-600 bg-gray-50', icon: <FaClock /> };
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      'COD': 'Trả tiền mặt khi nhận hàng',
      'QR_PAYMENT': 'Thanh toán QR Code',
      'BANK_TRANSFER': 'Chuyển khoản ngân hàng',
    };
    return methodMap[method] || method;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <FaSpinner className="text-5xl text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Đang tải danh sách đơn hàng...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !hasSearched) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button
              onClick={(e) => {
                e.preventDefault();
                fetchOrders();
              }}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tra cứu đơn hàng</h1>
          <p className="text-gray-600">
            {isAuthenticated 
              ? 'Xem lịch sử và trạng thái các đơn hàng của bạn' 
              : 'Nhập email để tra cứu đơn hàng của bạn (không cần đăng nhập)'}
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <FaEnvelope className="inline mr-2" />
                Email đặt hàng
              </label>
              <input
                type="email"
                id="email"
                value={searchEmail}
                onChange={(e) => {
                  setSearchEmail(e.target.value);
                  setError(null);
                  setHasSearched(false);
                }}
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

        {!hasSearched ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FaSearch className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nhập email để tra cứu đơn hàng</h3>
            <p className="text-gray-500">
              {isAuthenticated 
                ? 'Email của bạn đã được điền sẵn. Nhấn "Tìm kiếm" để xem đơn hàng.'
                : 'Vui lòng nhập email bạn đã sử dụng khi đặt hàng để xem các đơn hàng của bạn.'}
            </p>
          </div>
        ) : isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FaSpinner className="text-5xl text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Đang tìm kiếm đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FaReceipt className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy đơn hàng</h3>
            <p className="text-gray-500 mb-6">
              Không có đơn hàng nào được tìm thấy với email <span className="font-semibold">{searchEmail}</span>
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setSearchEmail('');
                  setHasSearched(false);
                  setError(null);
                  setOrders([]);
                }}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Tìm lại
              </button>
              <button
                onClick={() => navigate('/products')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Xem sản phẩm
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getPaymentStatusLabel(order.payment?.status || 'PENDING');
              return (
                <div
                  key={order.orderId}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Đơn hàng #{order.orderId}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusInfo.color}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt />
                            <span>{formatDate(order.orderDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaMoneyBillWave />
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(order.totalAmount)} ₫
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedOrder(selectedOrder?.orderId === order.orderId ? null : order)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FaEye />
                        {selectedOrder?.orderId === order.orderId ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                      </button>
                    </div>

                    {/* Order Items Preview */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <FaTruck />
                        <span className="font-medium">Sản phẩm ({order.orderItems?.length || 0})</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {order.orderItems?.slice(0, 3).map((item) => (
                          <div key={item.orderItemId} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                              <p className="text-xs text-gray-500">
                                SL: {item.quantity} × {formatCurrency(item.price)} ₫
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.orderItems && order.orderItems.length > 3 && (
                          <div className="flex items-center justify-center p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">
                              +{order.orderItems.length - 3} sản phẩm khác
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Info */}
                    {order.payment && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Phương thức thanh toán:</span>
                          <span className="font-semibold text-gray-800">
                            {getPaymentMethodLabel(order.payment.method)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Order Details (Expandable) */}
                    {selectedOrder?.orderId === order.orderId && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 animate-fadeIn">
                        {/* Customer Info */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Thông tin khách hàng</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Họ tên:</span>
                              <span className="ml-2 font-medium text-gray-800">{order.guestName}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Số điện thoại:</span>
                              <span className="ml-2 font-medium text-gray-800">{order.guestPhone}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <span className="ml-2 font-medium text-gray-800">{order.guestEmail}</span>
                            </div>
                            <div className="md:col-span-2">
                              <span className="text-gray-600">Địa chỉ:</span>
                              <span className="ml-2 font-medium text-gray-800">{order.guestAddress}</span>
                            </div>
                          </div>
                        </div>

                        {/* All Order Items */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Chi tiết sản phẩm</h4>
                          <div className="space-y-2">
                            {order.orderItems?.map((item) => (
                              <div
                                key={item.orderItemId}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">{item.productName}</p>
                                  <p className="text-sm text-gray-500">
                                    Số lượng: {item.quantity} × {formatCurrency(item.price)} ₫
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900">
                                    {formatCurrency(item.subTotal)} ₫
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <span className="text-lg font-semibold text-gray-700">Tổng tiền:</span>
                          <span className="text-xl font-bold text-blue-600">
                            {formatCurrency(order.totalAmount)} ₫
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
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

export default MyOrders;

