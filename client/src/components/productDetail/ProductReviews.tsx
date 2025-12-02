import { useState, useEffect, useMemo } from 'react';
import { reviewService, type Review } from '../../services/review.service';
import { ReviewSummary } from './ReviewSummary';
import { ReviewCard } from './ReviewCard';
import { ReviewPagination } from './ReviewPagination';
import { EmptyReviews } from './EmptyReviews';
import { ReviewFilter } from './ReviewFilter';

interface ProductReviewsProps {
  productId: number;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  
  // Filter reviews by selected rating
  const filteredReviews = useMemo(() => {
    if (selectedRating === null) {
      return reviews;
    }
    return reviews.filter(review => review.rating === selectedRating);
  }, [reviews, selectedRating]);

  // Calculate rating counts for filter
  const ratingCounts = useMemo(() => {
    return [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length,
    }));
  }, [reviews]);
  
  const REVIEWS_PER_PAGE = 5;
  const totalPages = Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE);
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const endIndex = startIndex + REVIEWS_PER_PAGE;
  const displayedReviews = filteredReviews.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRating]);

  useEffect(() => {
    const loadReviews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await reviewService.getReviewsByProduct(productId);
        setReviews(data);
        setCurrentPage(1); // Reset to first page when product changes
      } catch (err: any) {
        console.error('Error loading reviews:', err);
        setError('Không thể tải đánh giá');
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ReviewSummary reviews={reviews} />

      {reviews.length === 0 ? (
        <EmptyReviews />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {selectedRating === null 
                ? `Tất cả đánh giá (${reviews.length})`
                : `Đánh giá ${selectedRating} sao (${filteredReviews.length})`
              }
            </h3>
            <ReviewFilter
              selectedRating={selectedRating}
              onRatingChange={setSelectedRating}
              ratingCounts={ratingCounts}
            />
          </div>
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Không có đánh giá {selectedRating} sao nào</p>
            </div>
          ) : (
            <>
              {displayedReviews.map((review, index) => (
                <ReviewCard key={review.reviewId} review={review} index={index} />
              ))}
              <ReviewPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

