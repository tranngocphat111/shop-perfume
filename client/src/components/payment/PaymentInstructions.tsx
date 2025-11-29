import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';

export const PaymentInstructions: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <FaInfoCircle className="text-blue-600 text-base" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Hướng dẫn thanh toán</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
            <div className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold text-sm">1.</span>
              <span>Mở app ngân hàng/Ví điện tử</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold text-sm">2.</span>
              <span>Quét mã QR bên cạnh</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold text-sm">3.</span>
              <span>Kiểm tra và xác nhận</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold text-sm">4.</span>
              <span>Hệ thống tự động xác nhận</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

