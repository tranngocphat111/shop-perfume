import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
import { FaSpinner } from 'react-icons/fa';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, location]);

  const fetchOrders = useCallback(async (email?: string) => {
    const emailToSearch = email || searchEmail;
    
    if (!emailToSearch || !emailToSearch.trim()) {
      console.log('[MyOrders] ⚠️ Email is required');
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
  }, [searchEmail]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      'COD': 'Trả tiền mặt khi nhận hàng',
      'QR_PAYMENT': 'Thanh toán QR Code',
      'BANK_TRANSFER': 'Chuyển khoản ngân hàng',
      'E_WALLET': 'Thanh toán QR Code',
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
            (order.payment?.method === 'E_WALLET' || order.payment?.method === 'QR_PAYMENT')) {
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
          (order.payment?.method === 'E_WALLET' || order.payment?.method === 'QR_PAYMENT') &&
          !qrUrls[order.orderId]) {
        generateQRCode(order.orderId, order.totalAmount);
      }
    });
  }, [orders, generateQRCode, qrUrls]);

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
        <OrderSearchForm
          email={searchEmail}
          onEmailChange={handleEmailChange}
          onSubmit={handleSearch}
          isLoading={isLoading}
          error={error}
          isAuthenticated={isAuthenticated}
        />

        {/* Content */}
        {!hasSearched ? (
          <EmptyState type="no-search" isAuthenticated={isAuthenticated} />
        ) : isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FaSpinner className="text-5xl text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Đang tìm kiếm đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState type="no-orders" email={searchEmail} onReset={handleReset} />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                isExpanded={selectedOrder?.orderId === order.orderId}
                onToggleExpand={() => setSelectedOrder(selectedOrder?.orderId === order.orderId ? null : order)}
                qrUrl={qrUrls[order.orderId]}
                timeRemaining={timeRemaining[order.orderId]}
                getPaymentMethodLabel={getPaymentMethodLabel}
              />
            ))}
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
