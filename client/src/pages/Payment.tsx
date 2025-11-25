import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaInfoCircle, FaClock, FaCheckCircle, FaSpinner, FaSearch, FaMoneyBillWave, FaQrcode, FaUniversity } from 'react-icons/fa';
import { apiService } from '../services/api';
import type { OrderResponse } from '../types';
import { formatCurrency } from '../utils/helpers';

const BANK_INFO = {
  accountName: 'NGUYEN NGOC LAN',
  accountNo: '0359234689',
  bankCode: '970422',
  bankName: 'MB Bank',
};

interface PaymentLocationState {
  order: OrderResponse;
  paymentMethod: 'cod' | 'qr-payment' | 'bank-transfer';
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
  const [countdown, setCountdown] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');

  const generateQRCode = useCallback((orderId: string, amount: number) => {
    const amountRounded = Math.floor(amount);
    const content = `LAN_${orderId}`;
    
    const url = `https://img.vietqr.io/image/${BANK_INFO.bankCode}-${BANK_INFO.accountNo}-compact2.jpg?amount=${amountRounded}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;
    
    const img = new Image();
    img.onload = () => {
      setQrUrl(url);
    };
    img.onerror = () => {
      console.error('Failed to load QR code');
    };
    img.src = url;
  }, []);

  // Redirect if no state
  useEffect(() => {
    if (!state || !state.order) {
      navigate('/checkout');
      return;
    }

    // Set order from state
    setOrder(state.order);
    setIsLoading(false);

    // Generate QR code if needed
    if (state.paymentMethod === 'qr-payment' || state.paymentMethod === 'bank-transfer') {
      generateQRCode(state.order.orderId.toString(), state.totalAmount);
    }
  }, [state, navigate, generateQRCode]);

  const checkPayment = useCallback(async () => {
    if (!order?.orderId || isPaid || isChecking) return;

    setIsChecking(true);
    try {
      const data = await apiService.get<{ paid: boolean }>(`/payment/check-qr?orderId=${order.orderId}`);

      if (data.paid) {
        setIsPaid(true);
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate('/', { state: { orderSuccess: true } });
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    } finally {
      setIsChecking(false);
    }
  }, [order, isPaid, isChecking, navigate]);

  // Auto check payment status for QR and Bank Transfer
  useEffect(() => {
    if (!order || isPaid) return;
    if (state?.paymentMethod !== 'qr-payment' && state?.paymentMethod !== 'bank-transfer') return;

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
    'bank-transfer': 'Chuyển khoản ngân hàng',
  };

  const paymentMethodIcons = {
    'cod': FaMoneyBillWave,
    'qr-payment': FaQrcode,
    'bank-transfer': FaUniversity,
  };

  const PaymentIcon = paymentMethodIcons[state.paymentMethod];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li>
              <button
                onClick={() => navigate('/')}
                className="hover:text-black transition-colors"
              >
                Trang chủ
              </button>
            </li>
            <li>/</li>
            <li>
              <button
                onClick={() => navigate('/checkout')}
                className="hover:text-black transition-colors"
              >
                Thanh toán
              </button>
            </li>
            <li>/</li>
            <li className="text-black font-medium">Xác nhận thanh toán</li>
          </ol>
        </nav>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Xác nhận thanh toán</h1>
          <p className="text-gray-600">
            Mã đơn hàng: <span className="font-semibold text-black">#{order.orderId}</span>
          </p>
        </div>

        {/* Payment Method Display */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm mb-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-6 pb-3 border-b-2 border-gray-100">
            Phương thức thanh toán
          </h2>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border-2 border-black">
            <PaymentIcon className={`text-2xl ${
              state.paymentMethod === 'cod' ? 'text-green-600' :
              state.paymentMethod === 'qr-payment' ? 'text-blue-600' :
              'text-purple-600'
            }`} />
            <span className="font-semibold text-lg">{paymentMethodLabels[state.paymentMethod]}</span>
          </div>
        </div>

        {/* Payment Instructions for QR and Bank Transfer */}
        {(state.paymentMethod === 'qr-payment' || state.paymentMethod === 'bank-transfer') && (
          <>
            {/* Instructions */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
              <h5 className="flex items-center gap-2 text-blue-700 font-semibold text-base mb-3">
                <FaInfoCircle />
                Hướng dẫn thanh toán
              </h5>
              <ol className="space-y-2 text-sm text-gray-700 ml-1">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">1.</span>
                  <span>Mở ứng dụng Ngân hàng hoặc Ví điện tử</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">2.</span>
                  <span>Quét mã QR bên dưới</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">3.</span>
                  <span>Kiểm tra thông tin và xác nhận thanh toán</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">4.</span>
                  <span>Hệ thống sẽ tự động xác nhận sau khi thanh toán thành công</span>
                </li>
              </ol>
            </div>

            {/* QR Code and Payment Info */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm mb-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* QR Code Display */}
                <div className="flex-shrink-0 flex justify-center">
                  <div className="w-[300px] h-[300px]">
                    {qrUrl ? (
                      <div className="relative">
                        <img
                          src={qrUrl}
                          alt="QR Code Thanh Toán"
                          className="w-full h-full object-contain rounded-lg shadow-lg border-4 border-blue-500"
                        />
                        <div className="absolute -top-2 -left-2">
                          <img
                            src="https://img.vietqr.io/image/vietqr-logo.png"
                            alt="VIETQR"
                            className="h-8"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-blue-500">
                        <FaSpinner className="text-5xl text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-600 text-sm">Đang tạo mã QR...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="flex-1 bg-gray-50 p-6 rounded-lg border border-gray-200">
                  {/* Amount */}
                  <div className="bg-white p-4 rounded-lg mb-4 text-center border-2 border-blue-500">
                    <span className="block text-sm text-gray-600 mb-1">Số tiền:</span>
                    <span className="block text-3xl font-bold text-blue-600">
                      {formatCurrency(state.totalAmount)} ₫
                    </span>
                  </div>

                  {/* Bank Details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Ngân hàng:</span>
                      <span className="font-semibold">{BANK_INFO.bankName} ({BANK_INFO.bankCode})</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Chủ tài khoản:</span>
                      <span className="font-semibold">{BANK_INFO.accountName}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600 font-medium">Số tài khoản:</span>
                      <span className="font-semibold">{BANK_INFO.accountNo}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 font-medium">Nội dung:</span>
                      <span className="font-semibold text-blue-600">LAN_{order.orderId}</span>
                    </div>
                  </div>

                  {/* Bank logos */}
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-200">
                    <img
                      src="https://img.vietqr.io/image/napas-logo.png"
                      alt="NAPAS"
                      className="h-6"
                    />
                    <img
                      src="https://img.vietqr.io/image/mb-logo.png"
                      alt="MB Bank"
                      className="h-6"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            {!isPaid ? (
              <div className="bg-yellow-50 border-2 border-yellow-400 p-6 rounded-lg text-center">
                <FaClock className="text-5xl text-yellow-500 mx-auto mb-4 animate-pulse" />
                <h5 className="text-yellow-800 font-semibold text-lg mb-2">
                  Đang chờ thanh toán...
                </h5>
                <p className="text-yellow-700 mb-4">
                  Vui lòng quét mã QR và hoàn tất thanh toán
                </p>
                <div className="text-yellow-700 text-sm mb-4 flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Tự động kiểm tra sau: <span className="font-bold">{countdown}s</span>
                </div>
                <button
                  onClick={checkPayment}
                  disabled={isChecking}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center gap-2"
                >
                  {isChecking ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      <FaSearch />
                      Kiểm tra ngay
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border-2 border-green-500 p-6 rounded-lg text-center animate-fadeIn">
                <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
                <h5 className="text-green-800 font-semibold text-lg mb-2">
                  Thanh toán thành công!
                </h5>
                <p className="text-green-700 mb-1">
                  Đơn hàng của bạn đã được xác nhận
                </p>
                <p className="text-green-700 font-semibold text-sm">
                  Đang chuyển về trang chủ...
                </p>
              </div>
            )}
          </>
        )}

        {/* COD Payment Success */}
        {state.paymentMethod === 'cod' && (
          <div className="bg-green-50 border-2 border-green-500 p-6 rounded-lg text-center">
            <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
            <h5 className="text-green-800 font-semibold text-lg mb-2">
              Đặt hàng thành công!
            </h5>
            <p className="text-green-700 mb-4">
              Đơn hàng của bạn đã được xác nhận. Bạn sẽ thanh toán khi nhận hàng.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all"
            >
              Về trang chủ
            </button>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm mt-6">
          <h3 className="text-xl font-semibold mb-4 pb-3 border-b-2 border-gray-100">
            Thông tin đơn hàng
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Khách hàng:</span>
              <span className="font-semibold">{order.guestName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Số điện thoại:</span>
              <span className="font-semibold">{order.guestPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-semibold">{order.guestEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Địa chỉ:</span>
              <span className="font-semibold text-right max-w-xs">{order.guestAddress}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-lg font-semibold">Tổng tiền:</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(order.totalAmount)} ₫
              </span>
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

