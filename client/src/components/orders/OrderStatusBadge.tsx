import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface OrderStatusBadgeProps {
  status: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const statusMap: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    'PENDING': { 
      label: 'Chờ thanh toán', 
      color: 'text-amber-700', 
      bgColor: 'bg-amber-50 border-amber-200',
      icon: <Clock size={12} />
    },
    'PAID': { 
      label: 'Đã thanh toán', 
      color: 'text-green-700', 
      bgColor: 'bg-green-50 border-green-200',
      icon: <CheckCircle size={12} />
    },
    'FAILED': { 
      label: 'Thanh toán thất bại', 
      color: 'text-red-700', 
      bgColor: 'bg-red-50 border-red-200',
      icon: <XCircle size={12} />
    },
  };

  const statusInfo = statusMap[status] || { 
    label: status, 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-50 border-gray-200',
    icon: <Clock size={12} />
  };

  return (
    <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold flex items-center gap-1 border ${statusInfo.color} ${statusInfo.bgColor}`}>
      {statusInfo.icon}
      <span>{statusInfo.label}</span>
    </span>
  );
};

