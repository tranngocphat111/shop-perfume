import React from 'react';
import { Star, X } from 'lucide-react';

interface ReviewFilterProps {
  selectedRating: number | null;
  onRatingChange: (rating: number | null) => void;
  ratingCounts: Array<{ rating: number; count: number }>;
}

export const ReviewFilter: React.FC<ReviewFilterProps> = ({
  selectedRating,
  onRatingChange,
  ratingCounts,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-gray-700">Lọc theo:</span>
      <button
        onClick={() => onRatingChange(null)}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
          selectedRating === null
            ? 'bg-black text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
        }`}
      >
        Tất cả
      </button>
      {ratingCounts.map(({ rating, count }) => (
        <button
          key={rating}
          onClick={() => onRatingChange(rating)}
          disabled={count === 0}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
            count === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : selectedRating === rating
              ? 'bg-black text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          <Star
            size={14}
            className={selectedRating === rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
          />
          <span>{rating} sao</span>
          {count > 0 && (
            <span className="text-xs opacity-75">({count})</span>
          )}
        </button>
      ))}
      {selectedRating !== null && (
        <button
          onClick={() => onRatingChange(null)}
          className="px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          title="Xóa bộ lọc"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

