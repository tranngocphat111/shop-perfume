import React from 'react';
import { motion } from 'framer-motion';
import { Star, User } from 'lucide-react';
import type { Review } from '../../services/review.service';
import { formatDate } from '../../utils/helpers';

interface ReviewCardProps {
  review: Review;
  index: number;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="font-semibold text-lg text-gray-900">{review.userName || 'Khách hàng'}</p>
            <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (  
            <Star
              key={star}
              size={16}
              className={
                star <= review.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }
            />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-gray-700 leading-relaxed mt-3 text-sm">{review.comment}</p>
      )}
    </motion.div>
  );
};

