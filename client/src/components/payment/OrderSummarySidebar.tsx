import React from 'react';
import type { OrderResponse } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface OrderSummarySidebarProps {
  order: OrderResponse;
}

export const OrderSummarySidebar: React.FC<OrderSummarySidebarProps> = ({ order }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm sticky top-28">
      <div className="p-5 border-b border-slate-200">
        <h3 className="text-base font-semibold text-slate-800">Thông tin khách hàng</h3>
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
        <div className="pt-4 border-t-2 border-slate-300">
          <div className="flex justify-between items-center">
            <span className="text-slate-700 font-semibold">Tổng tiền</span>
            <span className="text-lg font-bold text-slate-800">{formatCurrency(order.totalAmount)} ₫</span>
          </div>
        </div>
      </div>
    </div>
  );
};

