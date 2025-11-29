import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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

  const breadcrumbs = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Thanh toán đơn hàng' },
  ];

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm py-16 px-6 mb-6"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="text-center">
        <motion.h1
          className="text-3.5xl md:text-4.5xl lg:text-5.5xl font-normal text-black mb-4 leading-tight tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        >
          Thanh toán đơn hàng
        </motion.h1>
        
        {/* Payment Method Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border-2 shadow-sm ${
            paymentMethod === 'cod' 
              ? 'border-green-200 bg-green-50' 
              : 'border-blue-200 bg-blue-50'
          }`}>
            <div className={`p-1.5 rounded-lg ${
              paymentMethod === 'cod' ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              <PaymentIcon className={`text-base ${
                paymentMethod === 'cod' ? 'text-green-600' : 'text-blue-600'
              }`} />
            </div>
            <span className="text-xs font-semibold text-slate-800">{paymentMethodLabels[paymentMethod]}</span>
          </div>
        </motion.div>

        {/* Order ID */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-sm text-gray-600 mb-4"
        >
          Mã đơn hàng: <span className="font-mono font-semibold text-black">#{order.orderId}</span>
        </motion.p>

        {/* Breadcrumb */}
        <motion.nav
          className="text-sm md:text-base flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {breadcrumbs.map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
            >
              {item.path ? (
                <Link
                  to={item.path}
                  className="text-gray-600 font-normal hover:text-black transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-black font-medium text-base md:text-lg">{item.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <span className="text-black">{'>'}</span>
              )}
            </motion.div>
          ))}
        </motion.nav>
      </div>
    </motion.div>
  );
};

