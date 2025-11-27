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

  // Use pageInfo.number as source of truth, fallback to currentPage
  // This ensures we're always in sync with backend pagination
  const actualCurrentPage = pageInfo.number !== undefined ? pageInfo.number : currentPage;

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
          onClick={() => onPageChange(actualCurrentPage - 1)}
          disabled={pageInfo.first || actualCurrentPage === 0}
          className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <i className="bi bi-chevron-left mr-1"></i>
          Trước
        </button>

        {/* Page Numbers */}
        <div className="flex gap-2">
          {(() => {
            const totalPages = pageInfo.totalPages;
            const pages: (number | 'ellipsis')[] = [];
            
            // Always show first page
            pages.push(0);
            
            // Determine which pages to show around current page
            let showStartEllipsis = false;
            let showEndEllipsis = false;
            let startPage = 1;
            let endPage = totalPages - 2;
            
            if (totalPages <= 7) {
              // Show all pages if 7 or fewer
              for (let i = 1; i < totalPages - 1; i++) {
                pages.push(i);
              }
            } else {
              // Show pages around current page
              if (actualCurrentPage <= 3) {
                // Near start: show 1, 2, 3, 4
                endPage = Math.min(4, totalPages - 2);
                showEndEllipsis = totalPages > 6;
              } else if (actualCurrentPage >= totalPages - 4) {
                // Near end: show last few pages
                startPage = Math.max(1, totalPages - 5);
                showStartEllipsis = totalPages > 6;
              } else {
                // In middle: show current page and neighbors
                startPage = actualCurrentPage - 1;
                endPage = actualCurrentPage + 1;
                showStartEllipsis = true;
                showEndEllipsis = true;
              }
              
              // Add start ellipsis if needed
              if (showStartEllipsis) {
                pages.push('ellipsis');
              }
              
              // Add middle pages
              for (let i = startPage; i <= endPage; i++) {
                if (i > 0 && i < totalPages - 1) {
                  pages.push(i);
                }
              }
              
              // Add end ellipsis if needed
              if (showEndEllipsis) {
                pages.push('ellipsis');
              }
            }
            
            // Always show last page (if more than 1 page)
            if (totalPages > 1) {
              pages.push(totalPages - 1);
            }
            
            return pages.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-2 text-gray-500 text-sm">
                    ...
                  </span>
                );
              }
              
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    page === actualCurrentPage
                      ? "bg-black text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  } disabled:opacity-50`}>
                  {page + 1}
                </button>
              );
            });
          })()}
        </div>

        <button
          onClick={() => onPageChange(actualCurrentPage + 1)}
          disabled={pageInfo.last || actualCurrentPage >= pageInfo.totalPages - 1}
          className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Sau
          <i className="bi bi-chevron-right ml-1"></i>
        </button>
      </div>
    </motion.div>
  );
};

