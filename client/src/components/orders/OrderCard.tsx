import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, DollarSign, Truck, Eye, ChevronDown, X, Star } from 'lucide-react';
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
  onCancelOrder?: (orderId: number) => void;
  onReviewProduct?: (productId: number, productName: string) => void;
  reviewedProducts?: Set<number>;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isExpanded,
  onToggleExpand,
  qrUrl,
  timeRemaining,
  getPaymentMethodLabel,
  onCancelOrder,
  onReviewProduct,
  reviewedProducts,
}) => {
  const canCancel = order.payment?.status === 'PENDING';
  const canReview = order.payment?.status === 'PAID';
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-4 sm:p-5">
        {/* Order Header */}
        <div className="flex items-start justify-between mb-5 pb-4 border-b border-gray-100">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Đơn hàng #{order.orderId}
              </h3>
              <OrderStatusBadge status={order.payment?.status || 'PENDING'} />
            </div>
            <div className="flex items-center gap-5 text-sm sm:text-base text-gray-600 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span>{formatDate(order.orderDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-gray-400 " />
                <span className="font-semibold text-gray-900 text-xl mt-[-2px]">
                  {formatCurrency(order.totalAmount)} ₫
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canCancel && onCancelOrder && (
              <motion.button
                onClick={() => onCancelOrder(order.orderId)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors"
              >
                <X size={16} />
                <span className="hidden sm:inline">Hủy đơn</span>
              </motion.button>
            )}
            <motion.button
              onClick={onToggleExpand}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:border-gray-300 transition-colors flex-shrink-0"
            >
              <Eye size={16} />
              <span className="hidden sm:inline">{isExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}</span>
              <ChevronDown 
                size={16} 
                className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </motion.button>
          </div>
        </div>

        {/* Order Items Preview */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600 mb-3">
            <Truck size={16} className="text-gray-400" />
            <span className="font-medium">Sản phẩm ({order.orderItems?.length || 0})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {order.orderItems?.slice(0, 3).map((item) => {
              const isReviewed = reviewedProducts?.has(item.productId);
              return (
                <div 
                  key={item.orderItemId} 
                  className="flex items-start justify-between gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-800 truncate">{item.productName}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      SL: {item.quantity} × {formatCurrency(item.unitPrice || 0)} ₫
                    </p>
                  </div>
                  {canReview && onReviewProduct && (
                    <button
                      onClick={() => onReviewProduct(item.productId, item.productName)}
                      disabled={isReviewed}
                      className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors flex-shrink-0 ${
                        isReviewed
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          : 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200'
                      }`}
                      title={isReviewed ? 'Đã đánh giá' : 'Đánh giá sản phẩm'}
                    >
                      <Star size={14} className={isReviewed ? '' : 'fill-yellow-400 text-yellow-400'} />
                      <span className="hidden sm:inline">{isReviewed ? 'Đã đánh giá' : 'Đánh giá'}</span>
                    </button>
                  )}
                </div>
              );
            })}
            {order.orderItems && order.orderItems.length > 3 && (
              <div className="flex items-center justify-center p-3 bg-gray-50 border border-gray-100 rounded-lg">
                <span className="text-sm sm:text-base text-gray-600 font-medium">
                  +{order.orderItems.length - 3} sản phẩm khác
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        {order.payment && (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between text-sm sm:text-base">
              <span className="text-gray-600">Phương thức thanh toán:</span>
              <span className="font-semibold text-gray-800">
                {getPaymentMethodLabel(order.payment.method)}
              </span>
            </div>
          </div>
        )}

        {/* Order Details (Expandable) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <OrderDetails order={order} qrUrl={qrUrl} timeRemaining={timeRemaining} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

