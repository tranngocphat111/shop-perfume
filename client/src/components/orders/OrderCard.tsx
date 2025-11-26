import React from 'react';
import { FaCalendarAlt, FaMoneyBillWave, FaTruck, FaEye } from 'react-icons/fa';
import { formatCurrency, formatDate } from '../../utils/helpers';
import type { OrderResponse } from '../../types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderDetails } from './OrderDetails';

interface OrderCardProps {
  order: OrderResponse;
  isExpanded: boolean;
  onToggleExpand: () => void;
  qrUrl?: string;
  timeRemaining?: number;
  getPaymentMethodLabel: (method: string) => string;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isExpanded,
  onToggleExpand,
  qrUrl,
  timeRemaining,
  getPaymentMethodLabel,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Order Header */}
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Đơn hàng #{order.orderId}
              </h3>
              <OrderStatusBadge status={order.payment?.status || 'PENDING'} />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FaCalendarAlt />
                <span>{formatDate(order.orderDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaMoneyBillWave />
                <span className="font-semibold text-gray-900">
                  {formatCurrency(order.totalAmount)} ₫
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 hover:border-black"
          >
            <FaEye />
            {isExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
          </button>
        </div>

        {/* Order Items Preview */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <FaTruck />
            <span className="font-medium">Sản phẩm ({order.orderItems?.length || 0})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {order.orderItems?.slice(0, 3).map((item) => (
              <div key={item.orderItemId} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                  <p className="text-xs text-gray-500">
                    SL: {item.quantity} × {formatCurrency(item.unitPrice || 0)} ₫
                  </p>
                </div>
              </div>
            ))}
            {order.orderItems && order.orderItems.length > 3 && (
              <div className="flex items-center justify-center p-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">
                  +{order.orderItems.length - 3} sản phẩm khác
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        {order.payment && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Phương thức thanh toán:</span>
              <span className="font-semibold text-gray-800">
                {getPaymentMethodLabel(order.payment.method)}
              </span>
            </div>
          </div>
        )}

        {/* Order Details (Expandable) */}
        {isExpanded && (
          <OrderDetails order={order} qrUrl={qrUrl} timeRemaining={timeRemaining} />
        )}
      </div>
    </div>
  );
};

