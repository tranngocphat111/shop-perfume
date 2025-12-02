import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Receipt, Search, AlertCircle, Loader2, X, CheckCircle, Calendar as CalendarIcon, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type { OrderResponse } from '../../types';
import { OrderCard, EmptyState, ReviewModal } from '../orders';
import { generateOrderQRCode } from '../../services/sepay';
import { reviewService } from '../../services/review.service';
import { CustomSelect } from './CustomSelect';

type FilterStatus = 'ALL' | 'PENDING' | 'PAID' | 'FAILED';
type FilterDate = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

const ITEMS_PER_PAGE = 2;

export const Orders = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [qrUrls, setQrUrls] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<Record<number, number>>({});
  const [success, setSuccess] = useState<string>('');
  
  // Review states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string } | null>(null);
  const [reviewedProducts, setReviewedProducts] = useState<Set<number>>(new Set());
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [filterDate, setFilterDate] = useState<FilterDate>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);

  // Auto-load orders if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const url = `/orders/my-orders`;
      const response = await apiService.get<OrderResponse[]>(url);
      // Nếu có response (dù rỗng) → không có lỗi, chỉ là không có đơn hàng
      setOrders(response || []);
      setError(null); // Clear error nếu thành công
    } catch (err: any) {
      console.error('[Profile Orders] ❌ Error fetching orders:', err);
      const status = err.response?.status;
      const message = err.response?.data?.message || '';
      
      // Nếu là 400 với message về "không có đơn hàng" → xử lý như empty array
      if (status === 400 && (message.includes('không có đơn hàng') || message.includes('Không có đơn hàng'))) {
        setOrders([]);
        setError(null);
      } else if (status >= 500 || !status) {
        // Chỉ hiển thị error cho lỗi server hoặc network
        setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
        setOrders([]);
      } else {
        // Các lỗi khác (401, 403, etc.) → cũng xử lý như không có đơn hàng
        setOrders([]);
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load reviewed products for all orders
  useEffect(() => {
    if (!isAuthenticated || orders.length === 0) return;

    const loadReviewedProducts = async () => {
      const reviewedSet = new Set<number>();
      
      // Get all unique product IDs from orders with PAID status
      const productIds = new Set<number>();
      orders.forEach(order => {
        if (order.payment?.status === 'PAID') {
          order.orderItems?.forEach(item => {
            productIds.add(item.productId);
          });
        }
      });

      // Check each product if it's been reviewed
      for (const productId of productIds) {
        try {
          const hasReviewed = await reviewService.hasUserReviewedProduct(productId);
          if (hasReviewed) {
            reviewedSet.add(productId);
          }
        } catch (error) {
          console.error(`Error checking review for product ${productId}:`, error);
        }
      }

      setReviewedProducts(reviewedSet);
    };

    loadReviewedProducts();
  }, [orders, isAuthenticated]);

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
          }
        }
      });
      
      setTimeRemaining(newTimeRemaining);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [orders]);

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

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      await apiService.post(`/orders/${orderId}/cancel`, {});
      setSuccess('Hủy đơn hàng thành công!');
      await fetchOrders();
      setTimeout(() => setSuccess(''), 3000); 
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng';
      setError(errorMessage);
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleReviewProduct = (productId: number, productName: string) => {
    setSelectedProduct({ id: productId, name: productName });
    setReviewModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    // Add product to reviewed set
    if (selectedProduct) {
      setReviewedProducts(prev => new Set([...prev, selectedProduct.id]));
    }
    // Refresh orders to get updated data
    fetchOrders();
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Receipt size={20} className="text-gray-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Quản lý đơn hàng</h3>
              <p className="text-xs text-gray-500">Xem và quản lý đơn hàng của bạn</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-4">Vui lòng đăng nhập để xem đơn hàng của bạn.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Receipt size={20} className="text-gray-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Quản lý đơn hàng</h3>
              <p className="text-xs text-gray-500">Xem và quản lý đơn hàng của bạn</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            <span className="ml-3 text-gray-600">Đang tải danh sách đơn hàng...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Receipt size={20} className="text-gray-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Quản lý đơn hàng</h3>
              <p className="text-xs text-gray-500">Xem và quản lý đơn hàng của bạn</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="py-12 px-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-4">
              <AlertCircle size={32} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Không thể tải đơn hàng</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              {error}
            </p>
            <button
              onClick={fetchOrders}
              className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Receipt size={20} className="text-gray-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Quản lý đơn hàng</h3>
            <p className="text-xs text-gray-500">Xem và quản lý đơn hàng của bạn</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/my-orders')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Search size={14} />
          <span>Tra cứu đơn hàng khác</span>
        </button>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-700">{success}</p>
          </motion.div>
        )}

        {/* Filters */}
        <div className="mb-6 p-5 pt-0 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg shadow-sm">
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
                className="mt-5 flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <X size={14} />
                <span>Xóa bộ lọc</span>
              </motion.button>
            )}
          </div>
          
          <div className="space-y-4">
            {/* First Row - Status and Date Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* Second Row - Custom Date Range */}
            {filterDate === 'CUSTOM' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
            )}
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <EmptyState type="no-orders" isAuthenticated={isAuthenticated} />
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500 text-sm">Không tìm thấy đơn hàng nào với bộ lọc đã chọn</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
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
                    onCancelOrder={handleCancelOrder}
                    onReviewProduct={isAuthenticated ? handleReviewProduct : undefined}
                    reviewedProducts={reviewedProducts}
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
      </div>

      {/* Review Modal */}
      {isAuthenticated && selectedProduct && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedProduct(null);
          }}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

