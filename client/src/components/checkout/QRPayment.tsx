import React, { useEffect, useState, useCallback } from 'react';
import { FaInfoCircle, FaClock, FaCheckCircle, FaSpinner, FaSearch } from 'react-icons/fa';

interface QRPaymentProps {
  amount: number;
  onPaymentConfirmed?: () => void;
}

const BANK_INFO = {
  accountName: 'NGUYEN NGOC LAN',
  accountNo: '0359234689',
  bankCode: '970422',
  bankName: 'MB Bank',
};

export const QRPayment: React.FC<QRPaymentProps> = ({ amount, onPaymentConfirmed }) => {
  const [orderId, setOrderId] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // Generate order ID and QR code
  useEffect(() => {
    const newOrderId = Date.now().toString();
    setOrderId(newOrderId);
    generateQRCode(newOrderId);
  }, [amount]);

  const generateQRCode = (orderId: string) => {
    setIsLoading(true);
    const amountRounded = Math.floor(amount);
    const content = `LAN${orderId}`;
    
    const url = `https://img.vietqr.io/image/${BANK_INFO.bankCode}-${BANK_INFO.accountNo}-compact2.jpg?amount=${amountRounded}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;
    
    // Simulate loading image
    const img = new Image();
    img.onload = () => {
      setQrUrl(url);
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsLoading(false);
    };
    img.src = url;
  };

  // Auto check payment status
  useEffect(() => {
    if (!orderId || isPaid) return;

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
  }, [orderId, isPaid]);

  const checkPayment = useCallback(async () => {
    if (!orderId || isPaid || isChecking) return;

    setIsChecking(true);
    try {
      // Call API to check payment status
      const response = await fetch(`/api/payment/check-qr?orderId=${orderId}`);
      const data = await response.json();

      if (data.paid) {
        setIsPaid(true);
        if (onPaymentConfirmed) {
          onPaymentConfirmed();
        }
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    } finally {
      setIsChecking(false);
    }
  }, [orderId, isPaid, isChecking, onPaymentConfirmed]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  return (
    <div className="animate-fadeIn">
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
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* QR Code Display */}
        <div className="flex-shrink-0 flex justify-center">
          <div className="w-[300px] h-[300px]">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-blue-500">
                <FaSpinner className="text-5xl text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600 text-sm">Đang tạo mã QR...</p>
              </div>
            ) : (
              <img
                src={qrUrl}
                alt="QR Code Thanh Toán"
                className="w-full h-full object-contain rounded-lg shadow-lg border-4 border-blue-500"
              />
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="flex-1 bg-gray-50 p-6 rounded-lg border border-gray-200">
          {/* Amount */}
          <div className="bg-white p-4 rounded-lg mb-4 text-center border-2 border-blue-500">
            <span className="block text-sm text-gray-600 mb-1">Số tiền:</span>
            <span className="block text-3xl font-bold text-blue-600">
              {formatCurrency(amount)} ₫
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
              <span className="font-semibold text-blue-600">LAN_{orderId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div>
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
              Bạn có thể đặt hàng ngay bây giờ
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

