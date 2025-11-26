import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type { OrderResponse } from '../../types';
import { OrderCard, LoadingState, EmptyState } from '../orders';
import { FaSpinner } from 'react-icons/fa';
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
    if (isAuthenticated && user?.email) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchOrders = useCallback(async () => {
    if (!user?.email) {
      return;
    }

    console.log('[Profile Orders] 🔵 Fetching orders for user:', user.email);
    setIsLoading(true);
    setError(null);
    
    try {
      const url = `/orders/my-orders?email=${encodeURIComponent(user.email)}`;
      const response = await apiService.get<OrderResponse[]>(url);
      
      console.log('[Profile Orders] 🔵 Orders fetched:', {
        count: response?.length || 0,
        orders: response
      });
      
      setOrders(response || []);
    } catch (err: any) {
      console.error('[Profile Orders] ❌ Error fetching orders:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách đơn hàng.';
      setError(errorMessage);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
        <h3 className="text-lg font-medium mb-3">Quản lý đơn hàng</h3>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
        <EmptyState type="no-orders" email={user.email} />
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

