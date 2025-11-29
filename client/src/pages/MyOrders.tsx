import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { OrderResponse } from '../types';
import { generateOrderQRCode } from '../services/sepay';
import {
  OrderSearchForm,
  OrderCard,
  LoadingState,
  EmptyState,
} from '../components/orders';
import { ErrorModal } from '../components/common/ErrorModal';
import { FaSpinner } from 'react-icons/fa';
import { X, Calendar as CalendarIcon, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomSelect } from '../components/profile/CustomSelect';

type FilterStatus = 'ALL' | 'PENDING' | 'PAID' | 'FAILED';
type FilterDate = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

const ITEMS_PER_PAGE = 2;

export const MyOrders: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [searchEmail, setSearchEmail] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);
  const [qrUrls, setQrUrls] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<Record<number, number>>({});
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [filterDate, setFilterDate] = useState<FilterDate>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);

  // Auto-load orders if user is authenticated or email is passed from navigation
  useEffect(() => {
    const state = location.state as { email?: string } | null;
    if (state?.email) {
      // Guest search by email
      setSearchEmail(state.email);
      fetchOrders(state.email);
    } else if (isAuthenticated) {
      // Authenticated user - fetch by userId (no email param)
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, location]);

  const fetchOrders = useCallback(async (email?: string) => {
    // Nếu user đã đăng nhập và không có email param → gọi API không có email (backend sẽ dùng userId)
    if (isAuthenticated && !email) {
      console.log('[MyOrders] 🔵 Fetching orders for authenticated user (by userId)');
      setIsLoading(true);
      setError(null);
      setHasSearched(true);
      
      try {
        const url = `/orders/my-orders`; // Không có email param
        console.log('[MyOrders] 🔵 API Request URL:', url);
        
        const response = await apiService.get<OrderResponse[]>(url);
        console.log('[MyOrders] 🔵 Orders fetched:', {
          count: response?.length || 0,
          orders: response
        });
        
        setOrders(response || []);
        if (response && response.length === 0) {
          console.log('[MyOrders] ℹ️ No orders found for user');
          setError(null);
        } else {
          console.log('[MyOrders] ✅ Successfully loaded', response?.length || 0, 'orders');
          response?.forEach(order => {
            console.log('[MyOrders] 📦 Order:', {
              orderId: order.orderId,
              paymentStatus: order.payment?.status,
              paymentMethod: order.payment?.method,
              totalAmount: order.totalAmount
            });
          });
        }
      } catch (err: any) {
        console.error('[MyOrders] ❌ Error fetching orders:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.';
        setError(errorMessage);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // Guest search by email
    const emailToSearch = email || searchEmail;
    
    if (!emailToSearch || !emailToSearch.trim()) {
      console.log('[MyOrders] ⚠️ Email is required for guest search');
      setError('Vui lòng nhập email để tìm kiếm đơn hàng');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToSearch.trim())) {
      console.log('[MyOrders] ⚠️ Invalid email format:', emailToSearch);
      setError('Email không hợp lệ. Vui lòng nhập đúng định dạng email.');
      return;
    }

    console.log('[MyOrders] 🔵 Fetching orders for email:', emailToSearch);
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const url = `/orders/my-orders?email=${encodeURIComponent(emailToSearch.trim())}`;
      console.log('[MyOrders] 🔵 API Request URL:', url);
      
      const response = await apiService.get<OrderResponse[]>(url);
      console.log('[MyOrders] 🔵 Orders fetched:', {
        count: response?.length || 0,
        orders: response
      });
      
      setOrders(response || []);
      if (response && response.length === 0) {
        console.log('[MyOrders] ℹ️ No orders found for email:', emailToSearch);
        setError(null); // Clear error if no orders found (not an error)
      } else {
        console.log('[MyOrders] ✅ Successfully loaded', response?.length || 0, 'orders');
        // Log payment status for each order
        response?.forEach(order => {
          console.log('[MyOrders] 📦 Order:', {
            orderId: order.orderId,
            paymentStatus: order.payment?.status,
            paymentMethod: order.payment?.method,
            totalAmount: order.totalAmount
          });
        });
      }
    } catch (err: any) {
      console.error('[MyOrders] ❌ Error fetching orders:', err);
      console.error('[MyOrders] ❌ Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status
      });
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.';
      setError(errorMessage);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchEmail, isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      'COD': 'Trả tiền mặt khi nhận hàng',
      'QR_CODE': 'Thanh toán QR Code',
      // Keep backward compatibility with old values
      'QR_PAYMENT': 'Thanh toán QR Code',
      'E_WALLET': 'Thanh toán QR Code',
      'BANK_TRANSFER': 'Thanh toán QR Code',
    };
    return methodMap[method] || method;
  };

  const generateQRCode = useCallback((orderId: number, amount: number) => {
    // Use Sepay QR code generation
    const url = generateOrderQRCode(orderId.toString(), amount);
    setQrUrls(prev => ({ ...prev, [orderId]: url }));
  }, []);

  // Calculate time remaining for pending QR payments
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newTimeRemaining: Record<number, number> = {};
      
      orders.forEach(order => {
        if (order.payment?.status === 'PENDING' && 
            (order.payment?.method === 'QR_CODE' || order.payment?.method === 'E_WALLET' || order.payment?.method === 'QR_PAYMENT')) {
          const orderDate = new Date(order.orderDate);
          const timeoutMs = 30 * 60 * 1000; // 30 minutes
          const elapsed = now - orderDate.getTime();
          const remaining = Math.max(0, timeoutMs - elapsed);
          
          if (remaining > 0) {
            newTimeRemaining[order.orderId] = Math.floor(remaining / 1000);
          } else {
            // Timeout - check with backend
            console.log('[MyOrders] ⏰ Timeout reached for order:', order.orderId);
            apiService.post(`/orders/${order.orderId}/cancel-timeout`, {})
              .then((response) => {
                console.log('[MyOrders] 🔵 Timeout check response for order', order.orderId, ':', response);
                // Refresh orders after timeout
                if (searchEmail) {
                  console.log('[MyOrders] 🔵 Refreshing orders after timeout');
                  fetchOrders(searchEmail);
                }
              })
              .catch(err => {
                console.error('[MyOrders] ❌ Error checking timeout for order', order.orderId, ':', err);
              });
          }
        }
      });
      
      setTimeRemaining(newTimeRemaining);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [orders, searchEmail, fetchOrders]);

  // Generate QR codes for pending QR payment orders
  useEffect(() => {
    orders.forEach(order => {
      if (order.payment?.status === 'PENDING' && 
          (order.payment?.method === 'QR_CODE' || order.payment?.method === 'E_WALLET' || order.payment?.method === 'QR_PAYMENT') &&
          !qrUrls[order.orderId]) {
        generateQRCode(order.orderId, order.totalAmount);
      }
    });
  }, [orders, generateQRCode, qrUrls]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(order => {
        const status = order.payment?.status || 'PENDING';
        return status === filterStatus;
      });
    }

    // Filter by date
    if (filterDate !== 'ALL') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        
        if (filterDate === 'TODAY') {
          return orderDate >= today;
        } else if (filterDate === 'WEEK') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        } else if (filterDate === 'MONTH') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        } else if (filterDate === 'CUSTOM') {
          if (!customStartDate || !customEndDate) return true;
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          return orderDate >= start && orderDate <= end;
        }
        return true;
      });
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.orderDate).getTime();
      const dateB = new Date(b.orderDate).getTime();
      return dateB - dateA;
    });
  }, [orders, filterStatus, filterDate, customStartDate, customEndDate]);

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage]);

  // Total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  }, [filteredOrders.length]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [filterStatus, filterDate, customStartDate, customEndDate]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleEmailChange = (email: string) => {
    setSearchEmail(email);
    setError(null);
    setHasSearched(false);
  };

  const handleReset = () => {
    setSearchEmail('');
    setHasSearched(false);
    setError(null);
    setOrders([]);
  };

  if (isLoading && !hasSearched) {
    return <LoadingState message="Đang tải danh sách đơn hàng..." />;
  }


  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tra cứu đơn hàng</h1>
          <p className="text-gray-600 text-lg">
            {isAuthenticated 
              ? 'Xem lịch sử và trạng thái các đơn hàng của bạn' 
              : 'Nhập email để tra cứu đơn hàng của bạn'}
          </p>
        </div>

        {/* Search Form */}
        <OrderSearchForm
          email={searchEmail}
          onEmailChange={handleEmailChange}
          onSubmit={handleSearch}
          isLoading={isLoading}
          error={null}
          isAuthenticated={isAuthenticated}
        />

        {/* Content */}
        {!hasSearched ? (
          <EmptyState type="no-search" isAuthenticated={isAuthenticated} />
        ) : isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FaSpinner className="text-5xl text-black animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Đang tìm kiếm đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState type="no-orders" email={searchEmail} onReset={handleReset} />
        ) : (
          <>
            {/* Filters */}
            <div className="mb-6 p-5 pt-0 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4 ">
                {(filterStatus !== 'ALL' || filterDate !== 'ALL') && (
                  <motion.button
                    onClick={() => {
                      setFilterStatus('ALL');
                      setFilterDate('ALL');
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className=" mt-5 flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:border-gray-300 transition-colors"
                  >
                    <X size={14} />
                    <span>Xóa bộ lọc</span>
                  </motion.button>
                )}
              </div>
              
              <div>
                {/* All filters in one row */}
                <div className={`grid gap-4 ${filterDate === 'CUSTOM' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Trạng thái</label>
                    <CustomSelect
                      value={filterStatus}
                      onChange={(value) => setFilterStatus(value as FilterStatus)}
                      options={[
                        { code: 'ALL', name: 'Tất cả' },
                        { code: 'PENDING', name: 'Chờ thanh toán' },
                        { code: 'PAID', name: 'Đã thanh toán' },
                        { code: 'FAILED', name: 'Thất bại' },
                      ]}
                      placeholder="Chọn trạng thái"
                      icon={<Tag size={16} />}
                    />
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Thời gian</label>
                    <CustomSelect
                      value={filterDate}
                      onChange={(value) => setFilterDate(value as FilterDate)}
                      options={[
                        { code: 'ALL', name: 'Tất cả' },
                        { code: 'TODAY', name: 'Hôm nay' },
                        { code: 'WEEK', name: '7 ngày qua' },
                        { code: 'MONTH', name: '30 ngày qua' },
                        { code: 'CUSTOM', name: 'Tùy chọn' },
                      ]}
                      placeholder="Chọn thời gian"
                      icon={<CalendarIcon size={16} />}
                    />
                  </div>

                  {/* Custom Date Range - From Date */}
                  {filterDate === 'CUSTOM' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">Từ ngày</label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
                            <CalendarIcon size={16} />
                          </div>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">Đến ngày</label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
                            <CalendarIcon size={16} />
                          </div>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-gray-500 text-sm">Không tìm thấy đơn hàng nào với bộ lọc đã chọn</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedOrders.map((order, index) => (
                    <motion.div
                      key={order.orderId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <OrderCard
                        order={order}
                        isExpanded={selectedOrder?.orderId === order.orderId}
                        onToggleExpand={() => setSelectedOrder(selectedOrder?.orderId === order.orderId ? null : order)}
                        qrUrl={qrUrls[order.orderId]}
                        timeRemaining={timeRemaining[order.orderId]}
                        getPaymentMethodLabel={getPaymentMethodLabel}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} className="text-gray-700" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = 
                          page === 0 || 
                          page === totalPages - 1 || 
                          (page >= currentPage - 1 && page <= currentPage + 1);

                        if (!showPage) {
                          // Show ellipsis
                          if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className="px-2 text-gray-400">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {page + 1}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} className="text-gray-700" />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        title="Lỗi khi tải danh sách đơn hàng"
        message={error || ''}
        onRetry={() => fetchOrders()}
      />

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
