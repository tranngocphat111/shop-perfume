import React from 'react';
import { Star } from 'lucide-react';

export const EmptyReviews: React.FC = () => {
  return (
    <div className="text-center py-12">
      <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-600 text-lg">Chưa có đánh giá nào cho sản phẩm này</p>
      <p className="text-gray-500 text-sm mt-2">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
    </div>
  );
};

