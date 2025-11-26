import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaInfoCircle, FaClock, FaCheckCircle, FaSpinner, FaSearch, FaMoneyBillWave, FaQrcode, FaUniversity } from 'react-icons/fa';
import { apiService } from '../services/api';
import type { OrderResponse } from '../types';
import { formatCurrency } from '../utils/helpers';
import { generateOrderQRCode } from '../services/sepay';

const BANK_INFO = {
  accountName: 'TRẦN NGỌC PHÁT',
  accountNo: '0963360910',
  bankCode: '970422',
  bankName: 'MB Bank',
};

interface PaymentLocationState {
  order: OrderResponse;
  paymentMethod: 'cod' | 'qr-payment';
  totalAmount: number;
}

export const Payment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PaymentLocationState;

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

  const paymentMethodLabels = {
    'cod': 'Trả tiền mặt khi nhận hàng',
    'qr-payment': 'Thanh toán QR Code',
  };

  const paymentMethodIcons = {
    'cod': FaMoneyBillWave,
    'qr-payment': FaQrcode,
  };

  const PaymentIcon = paymentMethodIcons[state.paymentMethod];

  return (
    <div className="min-h-screen bg-slate-100 pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Thanh toán đơn hàng</h1>
              <p className="text-sm text-slate-600">Mã đơn hàng: <span className="font-mono font-semibold text-slate-800">#{order.orderId}</span></p>
            </div>
            <div className={`flex items-center gap-3 px-5 py-3 bg-white rounded-xl border-2 shadow-sm ${
              state.paymentMethod === 'cod' 
                ? 'border-green-200 bg-green-50' 
                : 'border-blue-200 bg-blue-50'
            }`}>
              <div className={`p-2 rounded-lg ${
                state.paymentMethod === 'cod' ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                <PaymentIcon className={`text-xl ${
                  state.paymentMethod === 'cod' ? 'text-green-600' : 'text-blue-600'
                }`} />
              </div>
              <span className="text-sm font-semibold text-slate-800">{paymentMethodLabels[state.paymentMethod]}</span>
            </div>
          </div>
        </div>

        {/* Main Layout - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Payment Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Payment Instructions for QR Payment */}
            {state.paymentMethod === 'qr-payment' && (
              <>
                {/* Instructions */}
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaInfoCircle className="text-blue-600 text-lg" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-slate-800 mb-3">Hướng dẫn thanh toán</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold text-base">1.</span>
                          <span>Mở app ngân hàng/Ví điện tử</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold text-base">2.</span>
                          <span>Quét mã QR bên cạnh</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold text-base">3.</span>
                          <span>Kiểm tra và xác nhận</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold text-base">4.</span>
                          <span>Hệ thống tự động xác nhận</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code and Bank Info Card */}
                <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* QR Code */}
                    <div className="flex-shrink-0">
                      <div className="w-[280px] mx-auto">
                        {qrUrl ? (
                          <div className="relative bg-white p-4 rounded-lg border-2 border-slate-300 shadow-md">
                            <img
                              src={qrUrl}
                              alt="QR Code"
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute -top-2 -left-2 bg-white rounded shadow-md p-1 px-2">
                              <span className="text-[10px] font-semibold text-blue-600">SEPAY</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full aspect-square flex flex-col items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                            <FaSpinner className="text-4xl text-blue-500 animate-spin mb-2" />
                            <p className="text-slate-500 text-xs">Đang tạo mã QR...</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bank Info */}
                    <div className="flex-1 space-y-4">
                      {/* Amount */}
                      <div className="bg-slate-800 text-white p-4 rounded-lg">
                        <div className="text-xs text-slate-300 mb-2">Số tiền cần thanh toán</div>
                        <div className="text-2xl font-bold">{formatCurrency(state.totalAmount)} ₫</div>
                      </div>

                      {/* Bank Details */}
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-600">Ngân hàng</span>
                          <span className="font-semibold text-slate-800">{BANK_INFO.bankName}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-600">Chủ TK</span>
                          <span className="font-semibold text-slate-800">{BANK_INFO.accountName}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-600">Số TK</span>
                          <span className="font-mono font-semibold text-slate-800">{BANK_INFO.accountNo}</span>
                        </div>
                        <div className="flex justify-between py-2 bg-blue-50 rounded px-3 -mx-3">
                          <span className="text-slate-700 font-medium">Nội dung CK</span>
                          <span className="font-mono font-bold text-blue-600">STNP_{order.orderId}</span>
                        </div>
                      </div>

                      {/* Logos */}
                      <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-100">
                        <span className="text-xs font-semibold text-gray-600">SEPAY</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">Powered by Sepay</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                {isCancelled ? (
                  <div className="bg-white border-l-4 border-red-500 p-5 rounded-lg shadow-sm">
                    <div className="flex items-start gap-4">
                      <FaInfoCircle className="text-red-500 text-xl mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h5 className="text-red-800 font-semibold text-base mb-2">Đơn hàng đã bị hủy</h5>
                        <p className="text-red-700 text-sm mb-4">Quá thời gian thanh toán (30 phút). Vui lòng đặt hàng lại.</p>
                        <button
                          onClick={() => navigate('/')}
                          className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Về trang chủ
                        </button>
                      </div>
                    </div>
                  </div>
                ) : !isPaid ? (
                  <div className="bg-white border-l-4 border-yellow-500 p-5 rounded-lg shadow-sm">
                    <div className="flex items-start gap-4 mb-4">
                      <FaClock className="text-yellow-500 text-xl mt-0.5 flex-shrink-0 animate-pulse" />
                      <div className="flex-1">
                        <h5 className="text-yellow-800 font-semibold text-base mb-2">Đang chờ thanh toán</h5>
                        <p className="text-yellow-700 text-sm">Vui lòng quét mã QR và hoàn tất thanh toán</p>
                      </div>
                    </div>
                    {timeRemaining !== null && timeRemaining > 0 && (
                      <div className="bg-slate-50 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
                        <span className="text-sm text-slate-600 font-medium">Thời gian còn lại</span>
                        <span className={`font-mono font-bold text-lg ${timeRemaining < 300 ? 'text-red-600' : 'text-slate-800'}`}>
                          {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-600 flex items-center gap-2">
                        <FaSpinner className="animate-spin text-blue-500" />
                        <span>Tự động kiểm tra sau: <span className="font-semibold">{countdown}s</span></span>
                      </div>
                      <button
                        onClick={checkPayment}
                        disabled={isChecking}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                      >
                        {isChecking ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Đang kiểm tra...
                          </>
                        ) : (
                          <>
                            <FaSearch />
                            Kiểm tra
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border-l-4 border-green-500 p-5 rounded-lg shadow-sm animate-fadeIn">
                <div className="flex items-start gap-4">
                  <FaCheckCircle className="text-green-500 text-xl mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h5 className="text-green-800 font-semibold text-base mb-2">Thanh toán thành công! 🎉</h5>
                    <p className="text-green-700 text-sm mb-3">Đơn hàng của bạn đã được xác nhận</p>
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => navigate('/my-orders', { state: { email: order.guestEmail } })}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Xem đơn hàng
                      </button>
                      <button
                        onClick={() => navigate('/')}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                      >
                        Về trang chủ
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 text-xs">
                      <FaSpinner className="animate-spin" />
                      <span>Tự động chuyển về trang chủ sau 5 giây...</span>
                    </div>
                  </div>
                </div>
                  </div>
                )}
          </>
        )}

            {/* COD Payment Success */}
            {state.paymentMethod === 'cod' && (
              <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 overflow-hidden animate-fadeIn">
                {/* Success Header with Green Background */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-white rounded-full p-3 shadow-lg">
                      <FaCheckCircle className="text-green-600 text-3xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">Đặt hàng thành công!</h2>
                      <p className="text-green-50 text-sm">Mã đơn hàng: <span className="font-mono font-semibold">#{order.orderId}</span></p>
                    </div>
                  </div>
                </div>

                {/* Success Content */}
                <div className="p-8">
                  {/* Success Message */}
                  <div className="mb-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-1 h-12 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Đơn hàng đã được xác nhận</h3>
                        <p className="text-gray-600 leading-relaxed">
                          Cảm ơn bạn đã đặt hàng! Đơn hàng của bạn đã được tiếp nhận và đang được xử lý. 
                          Bạn sẽ thanh toán khi nhận hàng (COD).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Badge */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <FaMoneyBillWave className="text-green-600" />
                      <span className="text-sm font-semibold text-green-700">Trả tiền mặt khi nhận hàng</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => navigate('/my-orders', { state: { email: order.guestEmail } })}
                      className="flex-1 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <FaSearch />
                      Xem đơn hàng
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="flex-1 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md"
                    >
                      Về trang chủ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm sticky top-28">
              <div className="p-5 border-b border-slate-200">
                <h3 className="text-base font-semibold text-slate-800">Thông tin đơn hàng</h3>
              </div>
              <div className="p-5 space-y-4 text-sm">
                <div>
                  <div className="text-slate-500 mb-1.5 text-xs">Khách hàng</div>
                  <div className="font-semibold text-slate-800">{order.guestName}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1.5 text-xs">Số điện thoại</div>
                  <div className="font-mono font-semibold text-slate-800">{order.guestPhone}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1.5 text-xs">Email</div>
                  <div className="font-semibold text-slate-800 break-all text-xs">{order.guestEmail}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1.5 text-xs">Địa chỉ</div>
                  <div className="font-semibold text-slate-800">{order.guestAddress}</div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Tổng tiền</span>
                    <span className="text-lg font-bold text-slate-800">{formatCurrency(order.totalAmount)} ₫</span>
                  </div>
                </div>
              </div>
            </div>
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

