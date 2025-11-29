import React from 'react';
import { FaSpinner } from 'react-icons/fa';
import { formatCurrency } from '../../utils/helpers';

const BANK_INFO = {
  accountName: 'TRẦN NGỌC PHÁT',
  accountNo: '0963360910',
  bankCode: '970422',
  bankName: 'MB Bank',
};

interface QRCodeCardProps {
  qrUrl: string;
  totalAmount: number;
  orderId: number;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ qrUrl, totalAmount, orderId }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div className="flex flex-col md:flex-row gap-4">
        {/* QR Code */}
        <div className="flex-shrink-0">
          <div className="w-[200px] mx-auto">
            {qrUrl ? (
              <div className="relative bg-white p-3 rounded-lg border-2 border-slate-300 shadow-md">
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                />
                <div className="absolute -top-1.5 -left-1.5 bg-white rounded shadow-md p-0.5 px-1.5">
                  <span className="text-[9px] font-semibold text-blue-600">SEPAY</span>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-square flex flex-col items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <FaSpinner className="text-3xl text-blue-500 animate-spin mb-2" />
                <p className="text-slate-500 text-[10px]">Đang tạo mã QR...</p>
              </div>
            )}
          </div>
        </div>

        {/* Bank Info */}
        <div className="flex-1 space-y-3">
          {/* Amount */}
          <div className="bg-slate-800 text-white p-3 rounded-lg">
            <div className="text-[10px] text-slate-300 mb-1.5">Số tiền cần thanh toán</div>
            <div className="text-xl font-bold">{formatCurrency(totalAmount)} ₫</div>
          </div>

          {/* Bank Details */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Ngân hàng</span>
              <span className="font-semibold text-slate-800">{BANK_INFO.bankName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Chủ TK</span>
              <span className="font-semibold text-slate-800">{BANK_INFO.accountName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Số TK</span>
              <span className="font-mono font-semibold text-slate-800">{BANK_INFO.accountNo}</span>
            </div>
            <div className="flex justify-between py-1.5 bg-blue-50 rounded px-2.5 -mx-2.5">
              <span className="text-slate-700 font-medium">Nội dung CK</span>
              <span className="font-mono font-bold text-blue-600 text-xs">STNP_{orderId}</span>
            </div>
          </div>

          {/* Logos */}
          <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-semibold text-gray-600">SEPAY</span>
            <span className="text-[10px] text-gray-500">•</span>
            <span className="text-[10px] text-gray-500">Powered by Sepay</span>
          </div>
        </div>
      </div>
    </div>
  );
};

