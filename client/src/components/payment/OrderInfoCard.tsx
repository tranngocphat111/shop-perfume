import React from 'react';
import type { OrderResponse } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface OrderInfoCardProps {
  order: OrderResponse;
}

export const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ order }) => {
  // Tính subtotal từ orderItems
  const subtotal = order.orderItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  
  // Tính discount (nếu có) = subtotal - totalAmount
  const discount = subtotal - order.totalAmount;
  const shippingFee = 0; // Free shipping

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 ">
        <h3 className="text-lg font-semibold text-slate-800">Thông tin đơn hàng</h3>
      </div>
      
      {/* Content */}
      <div className="p-5">
        {/* Thông tin cơ bản */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center py-2.5">
            <span className="text-slate-600 text-sm">Ngày đặt hàng</span>
            <span className="font-medium text-slate-800 text-sm">
              {new Date(order.orderDate).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600 text-sm">Số lượng sản phẩm</span>
            <span className="font-medium text-slate-800 text-sm">
              {order.orderItems?.length || 0} sản phẩm
            </span>
          </div>
        </div>
        
        {/* Divider */}
        <div className="h-px bg-slate-200 my-4" />
        
        {/* Phần tính tiền */}
        <div className="space-y-3">
          <div className="flex justify-between items-center ">
            <span className="text-slate-600 text-sm">Tạm tính</span>
            <span className="font-medium text-slate-800 text-lg">
              {formatCurrency(subtotal)} ₫
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm">Giảm giá</span>
              <span className="font-semibold text-red-600 text-lg">
                -{formatCurrency(discount)} ₫
              </span>
            </div>
          )}
          {shippingFee > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600 text-sm">Phí vận chuyển</span>
              <span className="font-medium text-slate-800 text-sm">
                {formatCurrency(shippingFee)} ₫
              </span>
            </div>
          )}
          
          {/* Tổng tiền - Highlight */}
          <div className="pt-3 mt-3 border-t-2 border-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-800 font-semibold text-base">Tổng tiền</span>
              <span className="font-bold text-slate-900 text-xl">
                {formatCurrency(order.totalAmount)} ₫
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

