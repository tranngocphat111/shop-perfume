import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';

interface OrderStatusBadgeProps {
  status: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    'PENDING': { label: 'Chờ thanh toán', color: 'text-yellow-600 bg-yellow-50', icon: <FaClock /> },
    'PAID': { label: 'Đã thanh toán', color: 'text-green-600 bg-green-50', icon: <FaCheckCircle /> },
    'FAILED': { label: 'Thanh toán thất bại', color: 'text-red-600 bg-red-50', icon: <FaTimesCircle /> },
  };

  const statusInfo = statusMap[status] || { label: status, color: 'text-gray-600 bg-gray-50', icon: <FaClock /> };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusInfo.color}`}>
      {statusInfo.icon}
      {statusInfo.label}
    </span>
  );
};

