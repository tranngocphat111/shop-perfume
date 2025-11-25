import React from 'react';
import { FaQrcode, FaSpinner } from 'react-icons/fa';
import { formatCurrency } from '../../utils/helpers';
import { DEFAULT_SEPAY_CONFIG } from '../../services/sepay';

const BANK_INFO = {
  accountName: 'NGUYEN NGOC LAN',
  accountNo: DEFAULT_SEPAY_CONFIG.account,
  bankCode: '970422',
  bankName: DEFAULT_SEPAY_CONFIG.bank,
};

interface QRPaymentSectionProps {
  orderId: number;
  amount: number;
  qrUrl?: string;
  timeRemaining?: number;
}

export const QRPaymentSection: React.FC<QRPaymentSectionProps> = ({
  orderId,
  amount,
  qrUrl,
  timeRemaining,
}) => {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
      <div className="flex items-start gap-3 mb-3">
        <FaQrcode className="text-blue-600 text-lg mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Thanh toán QR Code</h4>
          <p className="text-xs text-blue-700 mb-3">
            Quét mã QR bên dưới để thanh toán. Đơn hàng sẽ tự động hủy sau 30 phút nếu chưa thanh toán.
          </p>

          {/* Time remaining */}
          {timeRemaining !== undefined && timeRemaining > 0 && (
            <div className="mb-3 p-2 bg-white rounded">
              <span className="text-xs text-gray-600">Thời gian còn lại: </span>
              <span className={`font-mono font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-800'}`}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          {/* QR Code */}
          {qrUrl ? (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-shrink-0">
                <div className="w-[200px] mx-auto">
                  <div className="relative bg-white p-3 rounded-lg border-2 border-blue-500 shadow-md">
                    <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
                    <div className="absolute -top-1.5 -left-1.5 bg-white rounded shadow-sm p-0.5 px-1">
                      <span className="text-[8px] font-semibold text-blue-600">SEPAY</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Info */}
              <div className="flex-1 space-y-2 text-xs">
                <div className="bg-slate-800 text-white p-3 rounded-lg">
                  <div className="text-[10px] text-slate-300 mb-1">Số tiền cần thanh toán</div>
                  <div className="text-lg font-bold">{formatCurrency(amount)} ₫</div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600">Ngân hàng</span>
                    <span className="font-semibold text-gray-800">{BANK_INFO.bankName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600">Chủ TK</span>
                    <span className="font-semibold text-gray-800">{BANK_INFO.accountName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600">Số TK</span>
                    <span className="font-mono font-semibold text-gray-800">{BANK_INFO.accountNo}</span>
                  </div>
                  <div className="flex justify-between py-1 bg-blue-50 rounded px-2 -mx-2">
                    <span className="text-gray-700 font-medium">Nội dung CK</span>
                    <span className="font-mono font-bold text-blue-600">LAN_{orderId}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-[200px] aspect-square flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-blue-400">
              <FaSpinner className="text-3xl text-blue-500 animate-spin mb-2" />
              <p className="text-gray-500 text-[10px]">Đang tạo mã QR...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

