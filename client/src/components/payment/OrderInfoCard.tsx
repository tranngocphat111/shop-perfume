import React from 'react';
import type { OrderResponse } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface OrderInfoCardProps {
  order: OrderResponse;
}

export const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ order }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800 mb-3">Thông tin đơn hàng</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between py-1.5 border-b border-slate-100">
          <span className="text-slate-600">Ngày đặt hàng</span>
          <span className="font-semibold text-slate-800 text-lg">
            {new Date(order.orderDate).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-100">
          <span className="text-slate-600">Số lượng sản phẩm</span>
          <span className="font-semibold text-slate-800 text-lg">
            {order.orderItems?.length || 0} sản phẩm
          </span>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-slate-600">Tổng tiền</span>
          <span className="font-bold text-slate-800 text-xl">
            {formatCurrency(order.totalAmount)} ₫
          </span>
        </div>
      </div>
    </div>
  );
};

