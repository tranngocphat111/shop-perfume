import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSpinner } from 'react-icons/fa';
import { apiService } from '../services/api';
import { useCart } from '../contexts/CartContext';
import type { OrderResponse } from '../types';
import { generateOrderQRCode } from '../services/sepay';
import {
  PaymentHeader,
  PaymentInstructions,
  OrderItemsList,
  QRCodeCard,
  OrderInfoCard,
  PaymentStatusCard,
  CODSuccessBanner,
  CODSuccessActions,
  OrderSummarySidebar,
} from '../components/payment';

interface PaymentLocationState {
  order: OrderResponse;
  paymentMethod: 'cod' | 'qr-payment';
  totalAmount: number;
}

export const Payment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PaymentLocationState;
  const { removeFromCart } = useCart();

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // Time remaining in seconds

  const generateQRCode = useCallback((orderId: string, amount: number) => {
    console.log('[Payment] 🔵 Generating QR code:', { orderId, amount });
    // Use Sepay QR code generation
    const url = generateOrderQRCode(orderId, amount);
    console.log('[Payment] 🔵 QR Code URL generated:', url);
    
    const img = new Image();
    img.onload = () => {
      console.log('[Payment] ✅ QR code image loaded successfully');
      setQrUrl(url);
    };
    img.onerror = () => {
      console.error('[Payment] ❌ Failed to load QR code image');
    };
    img.src = url;
  }, []);

  // Check if order should be cancelled due to timeout
  const checkTimeout = useCallback(async () => {
    if (!order?.orderId) {
      console.log('[Payment] ⚠️ Cannot check timeout: orderId is missing');
      return;
    }
    
    console.log('[Payment] 🔵 Checking timeout for order:', order.orderId);
    try {
      const response = await apiService.post<{ cancelled: boolean; message: string }>(
        `/orders/${order.orderId}/cancel-timeout`,
        {}
      );
      console.log('[Payment] 🔵 Timeout check response:', response);
      
      if (response.cancelled) {
        console.log('[Payment] ⚠️ Order cancelled due to timeout:', order.orderId);
        setIsCancelled(true);
        setError('Đơn hàng đã bị hủy do quá thời gian thanh toán (30 phút). Vui lòng đặt hàng lại.');
      } else {
        console.log('[Payment] ✅ Order still valid (not cancelled)');
      }
    } catch (error) {
      console.error('[Payment] ❌ Error checking timeout:', error);
    }
  }, [order]);

  // Calculate time remaining (30 minutes from order creation)
  useEffect(() => {
    if (!order || !state?.order) return;
    
    // Get order creation time from order object (use orderDate)
    const orderCreatedAt = new Date(order.orderDate || new Date());
    const timeoutMs = 30 * 60 * 1000; // 30 minutes
    const elapsed = Date.now() - orderCreatedAt.getTime();
    const remaining = Math.max(0, timeoutMs - elapsed);
    
    if (remaining > 0) {
      setTimeRemaining(Math.floor(remaining / 1000));
      
      // Update countdown every second
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(interval);
            checkTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setTimeRemaining(0);
      checkTimeout();
    }
  }, [order, state, checkTimeout]);

  // Scroll to top when page loads or when order changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [order, state]);

  // Redirect if no state
  useEffect(() => {
    if (!state || !state.order) {
      console.log('[Payment] ⚠️ No state or order found, redirecting to checkout');
      navigate('/checkout');
      return;
    }

    console.log('[Payment] 🔵 Initializing payment page:', {
      orderId: state.order.orderId,
      paymentMethod: state.paymentMethod,
      totalAmount: state.totalAmount,
      order: state.order
    });

    // Set order from state
    setOrder(state.order);
    setIsLoading(false);

    // Generate QR code if needed
    if (state.paymentMethod === 'qr-payment') {
      console.log('[Payment] 🔵 QR payment detected, generating QR code');
      generateQRCode(state.order.orderId.toString(), state.totalAmount);
    }
    
    // Check timeout immediately
    checkTimeout();
  }, [state, navigate, generateQRCode, checkTimeout]);

  const checkPayment = useCallback(async () => {
    if (!order?.orderId) {
      return;
    }
    
    if (isPaid || isChecking || isCancelled) {
      return;
    }

    setIsChecking(true);
    try {
      const url = `/payment/check-qr?orderId=${order.orderId}`;
      const data = await apiService.get<{ 
        paid: boolean; 
        cancelled?: boolean;
        amount?: number;
        paymentDate?: string;
        orderId?: string;
      }>(url);

      // Log payment status check result
      console.log('[Payment] 📊 Payment Status Check:', {
        orderId: order.orderId,
        paid: data.paid,
        cancelled: data.cancelled,
        amount: data.amount,
        paymentDate: data.paymentDate,
        timestamp: new Date().toISOString()
      });

      if (data.cancelled) {
        console.log('[Payment] ⚠️⚠️⚠️ ORDER CANCELLED! Order:', order.orderId);
        setIsCancelled(true);
        setError('Đơn hàng đã bị hủy do quá thời gian thanh toán (30 phút). Vui lòng đặt hàng lại.');
      } else if (data.paid) {
        console.log('[Payment] ✅✅✅✅✅ PAYMENT CONFIRMED! ✅✅✅✅✅');
        console.log('[Payment] Order ID:', order.orderId);
        console.log('[Payment] Amount:', data.amount);
        console.log('[Payment] Payment Date:', data.paymentDate);
        console.log('[Payment] Webhook đã xử lý thành công!');
        setIsPaid(true);
        
        // Chỉ remove các items đã thanh toán thành công khỏi cart
        const pendingOrderKey = `pending_order_${order.orderId}`;
        const orderItemsToRemove = localStorage.getItem(pendingOrderKey);
        if (orderItemsToRemove) {
          try {
            const productIds: number[] = JSON.parse(orderItemsToRemove);
            productIds.forEach(productId => {
              removeFromCart(productId);
            });
            // Xóa key sau khi đã remove
            localStorage.removeItem(pendingOrderKey);
            console.log('[Payment] ✅ Removed paid items from cart:', productIds);
          } catch (error) {
            console.error('[Payment] ❌ Error removing items from cart:', error);
          }
        }
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate('/', { state: { orderSuccess: true } });
        }, 3000);
      } else {
        // Payment still pending - log only every 10th check to reduce noise
        const checkCount = Math.floor(Date.now() / 10000) % 10;
        if (checkCount === 0) {
          console.log('[Payment] ⏳ Payment still pending for order:', order.orderId, '- Waiting for webhook...');
        }
      }
    } catch (error: any) {
      // Only log connection errors occasionally to avoid spam
      const errorMessage = error?.message || '';
      const isConnectionError = errorMessage.includes('Network error') || 
                                errorMessage.includes('CONNECTION_REFUSED') ||
                                errorMessage.includes('Failed to fetch');
      
      if (isConnectionError) {
        // Log connection errors only every 30 seconds to reduce spam
        const errorLogCount = Math.floor(Date.now() / 30000) % 2;
        if (errorLogCount === 0) {
          console.warn('[Payment] ⚠️ Server connection error - server may be restarting. Will retry...');
        }
      } else {
        // Log other errors normally
        console.error('[Payment] ❌ Error checking payment:', error);
        console.error('[Payment] ❌ Error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status
        });
      }
    } finally {
      setIsChecking(false);
    }
  }, [order, isPaid, isChecking, isCancelled, navigate]);

  // Auto check payment status for QR payment
  useEffect(() => {
    if (!order || isPaid) return;
    if (state?.paymentMethod !== 'qr-payment') return;

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          checkPayment();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [order, isPaid, state?.paymentMethod, checkPayment]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-5xl text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error || !order || !state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy thông tin đơn hàng'}</p>
          <button
            onClick={() => navigate('/checkout')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Quay lại thanh toán
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pt-24">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <PaymentHeader order={order} paymentMethod={state.paymentMethod} />

        {/* Main Layout - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Payment Content */}
          <div className="lg:col-span-2 space-y-4">

            {/* Payment Instructions for QR Payment */}
            {state.paymentMethod === 'qr-payment' && (
              <>
                <PaymentInstructions />
                <OrderItemsList orderItems={order.orderItems} />
                <QRCodeCard qrUrl={qrUrl} totalAmount={state.totalAmount} orderId={order.orderId} />
                <OrderInfoCard order={order} />
                <PaymentStatusCard
                  isCancelled={isCancelled}
                  isPaid={isPaid}
                  isChecking={isChecking}
                  timeRemaining={timeRemaining}
                  countdown={countdown}
                  order={order}
                  onCheckPayment={checkPayment}
                />
              </>
            )}

            {/* COD Payment Success */}
            {state.paymentMethod === 'cod' && (
              <>
                <CODSuccessBanner order={order} />
                <OrderItemsList orderItems={order.orderItems} />
                <OrderInfoCard order={order} />
                <CODSuccessActions order={order} />
              </>
            )}
          </div>

          {/* Right Column - Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummarySidebar order={order} />
          </div>
        </div>
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

export default Payment;

