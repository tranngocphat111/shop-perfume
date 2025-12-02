import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';

export const PaymentInstructions: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FaInfoCircle className="text-blue-600 text-lg" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Hướng dẫn thanh toán</h3>
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
  );
};

