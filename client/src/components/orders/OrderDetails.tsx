import React from 'react';
import { formatCurrency } from '../../utils/helpers';
import type { OrderResponse } from '../../types';
import { QRPaymentSection } from './QRPaymentSection';

interface OrderDetailsProps {
  order: OrderResponse;
  qrUrl?: string;
  timeRemaining?: number;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  qrUrl,
  timeRemaining,
}) => {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 animate-fadeIn">
      {/* QR Payment Section - Show if PENDING and QR payment */}
      {order.payment?.status === 'PENDING' &&
       (order.payment?.method === 'E_WALLET' || order.payment?.method === 'QR_PAYMENT') && (
        <QRPaymentSection
          orderId={order.orderId}
          amount={order.totalAmount}
          qrUrl={qrUrl}
          timeRemaining={timeRemaining}
        />
      )}

      {/* Customer Info */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Thông tin khách hàng</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Họ tên:</span>
            <span className="ml-2 font-medium text-gray-800">{order.guestName}</span>
          </div>
          <div>
            <span className="text-gray-600">Số điện thoại:</span>
            <span className="ml-2 font-medium text-gray-800">{order.guestPhone}</span>
          </div>
          <div>
            <span className="text-gray-600">Email:</span>
            <span className="ml-2 font-medium text-gray-800">{order.guestEmail}</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-gray-600">Địa chỉ:</span>
            <span className="ml-2 font-medium text-gray-800">{order.guestAddress}</span>
          </div>
        </div>
      </div>

      {/* All Order Items */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Chi tiết sản phẩm</h4>
        <div className="space-y-2">
          {order.orderItems?.map((item) => (
            <div
              key={item.orderItemId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.productName}</p>
                <p className="text-sm text-gray-500">
                  Số lượng: {item.quantity} × {formatCurrency(item.unitPrice || 0)} ₫
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(item.subTotal)} ₫
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className="text-lg font-semibold text-gray-700">Tổng tiền:</span>
        <span className="text-xl font-bold text-blue-600">
          {formatCurrency(order.totalAmount)} ₫
        </span>
      </div>
    </div>
  );
};

