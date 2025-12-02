import React from 'react';
import { motion } from 'framer-motion';
import { FaMoneyBillWave, FaQrcode } from 'react-icons/fa';
import type { OrderResponse } from '../../types';

interface PaymentHeaderProps {
  order: OrderResponse;
  paymentMethod: 'cod' | 'qr-payment';
}

const paymentMethodLabels = {
  'cod': 'Trả tiền mặt khi nhận hàng',
  'qr-payment': 'Thanh toán QR Code',
};

const paymentMethodIcons = {
  'cod': FaMoneyBillWave,
  'qr-payment': FaQrcode,
};

export const PaymentHeader: React.FC<PaymentHeaderProps> = ({ order, paymentMethod }) => {
  const PaymentIcon = paymentMethodIcons[paymentMethod];

  return (
    <motion.div
      className="rounded-lg py-4  px-6 mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left side - Title and Order ID */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold text-blue-900 mb-1">
            Thanh toán đơn hàng
          </h1>
          <p className="text-base text-gray-600">
            Mã đơn hàng: <span className="font-mono">#{order.orderId}</span>
          </p>
        </div>

        {/* Right side - Payment Method Button */}
        <div className="flex items-center">
          <button
            className="flex items-center gap-2 bg-white px-5 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            disabled
          >
            <PaymentIcon className={`text-xl ${
              paymentMethod === 'cod' ? 'text-green-600' : 'text-blue-600'
            }`} />
            <span className="text-base font-medium text-blue-900">
              {paymentMethodLabels[paymentMethod]}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

