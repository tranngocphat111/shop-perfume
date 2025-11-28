import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type { OrderResponse } from '../../types';
import { OrderCard, LoadingState, EmptyState } from '../orders';
import { FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { generateOrderQRCode } from '../../services/sepay';

export const Orders = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [qrUrls, setQrUrls] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<Record<number, number>>({});

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

  if (!isAuthenticated || !user) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium mb-3">Quản lý đơn hàng</h3>
        <p className="text-gray-700 mb-4">Vui lòng đăng nhập để xem đơn hàng của bạn.</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium mb-3">Quản lý đơn hàng</h3>
        <LoadingState message="Đang tải danh sách đơn hàng..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">Quản lý đơn hàng</h3>
        <div className="py-12 px-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 mb-5">
            <FaExclamationCircle className="text-4xl text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Không thể tải đơn hàng</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={fetchOrders}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Quản lý đơn hàng</h3>
        <button
          onClick={() => navigate('/my-orders')}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Tra cứu đơn hàng khác
        </button>
      </div>
      
      {orders.length === 0 ? (
        <EmptyState type="no-orders" isAuthenticated={isAuthenticated} />
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
  );
};

