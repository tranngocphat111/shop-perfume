import React from 'react';
import type { OrderResponse } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface OrderItemsListProps {
  orderItems: OrderResponse['orderItems'];
}

export const OrderItemsList: React.FC<OrderItemsListProps> = ({ orderItems }) => {
  if (!orderItems || orderItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800 mb-3">Sản phẩm trong đơn hàng</h3>
      <div className="space-y-2">
        {orderItems.map((item) => (
          <div key={item.orderItemId} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{item.productName}</p>
              <p className="text-sm text-slate-500 mt-0.5">
                SL: {item.quantity} × {formatCurrency(item.unitPrice)} ₫
              </p>
            </div>
            <div className="text-right ml-3">
              <p className="text-xl font-semibold text-slate-800">
                {formatCurrency(item.subTotal)} ₫
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

