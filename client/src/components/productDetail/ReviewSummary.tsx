import React from 'react';
import { Star } from 'lucide-react';
import type { Review } from '../../services/review.service';

interface ReviewSummaryProps {
  reviews: Review[];
}

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({ reviews }) => {
  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  // Count reviews by rating
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Average Rating */}
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
            <div className="flex items-center">
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Dựa trên {reviews.length} {reviews.length === 1 ? 'đánh giá' : 'đánh giá'}
          </p>
        </div>

        {/* Rating Breakdown */}
        <div className="flex-1 space-y-2">
          {ratingCounts.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-20">
                <span className="text-sm text-gray-700">{rating}</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

