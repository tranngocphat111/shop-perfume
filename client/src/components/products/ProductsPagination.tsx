import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { PageResponse } from "../../types";

interface ProductsPaginationProps {
  pageInfo: PageResponse<any> | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean; // Whether data is loading
}

export const ProductsPagination = ({
  pageInfo,
  currentPage,
  onPageChange,
  isLoading = false,
}: ProductsPaginationProps) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Check if scrolled to top and not loading
  useEffect(() => {
    if (!isLoading) {
      const checkScroll = () => {
        if (window.scrollY <= 100) {
          setShouldAnimate(true);
        }
      };
      
      // Check immediately
      checkScroll();
      
      // Also listen for scroll events
      window.addEventListener('scroll', checkScroll);
      return () => window.removeEventListener('scroll', checkScroll);
    } else {
      setShouldAnimate(false);
    }
  }, [isLoading]);

  if (!pageInfo || pageInfo.totalPages <= 1) {
    return null;
  }

  return (
    <motion.div
      className="mt-8 bg-white rounded-lg shadow-sm p-4"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.25, 0.1, 0.25, 1],
        delay: 0.1
      }}
    >
      <div className="flex justify-center items-center gap-2 flex-wrap">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={pageInfo.first}
          className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <i className="bi bi-chevron-left mr-1"></i>
          Trước
        </button>

        {/* Page Numbers */}
        <div className="flex gap-2">
          {Array.from({ length: pageInfo.totalPages }, (_, i) => i).map(
            (page) => {
              const showPage =
                page === 0 ||
                page === pageInfo.totalPages - 1 ||
                (page >= currentPage - 1 && page <= currentPage + 1);

              const showEllipsis =
                (page === 1 && currentPage > 3) ||
                (page === pageInfo.totalPages - 2 &&
                  currentPage < pageInfo.totalPages - 4);

              if (showEllipsis) {
                return (
                  <span
                    key={page}
                    className="px-3 py-2 text-gray-500 text-sm">
                    ...
                  </span>
                );
              }

              if (!showPage) return null;

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    page === currentPage
                      ? "bg-black text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  } disabled:opacity-50`}>
                  {page + 1}
                </button>
              );
            }
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={pageInfo.last}
          className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Sau
          <i className="bi bi-chevron-right ml-1"></i>
        </button>
      </div>
    </motion.div>
  );
};

