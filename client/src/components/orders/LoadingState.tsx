import React from 'react';
import { FaSpinner } from 'react-icons/fa';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Đang tải...' }) => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <FaSpinner className="text-5xl text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

