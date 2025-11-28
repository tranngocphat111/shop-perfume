import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PageResponse } from "../../types";

interface ProductsToolbarProps {
  pageInfo: PageResponse<any> | null;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
}

// Danh sách các lựa chọn để dễ quản lý
const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "popularity", label: "Mức độ phổ biến" },
  { value: "price-asc", label: "Từ thấp đến cao" },
  { value: "price-desc", label: "Từ cao đến thấp" },
];

export const ProductsToolbar = ({
  pageInfo,
  sortBy,
  onSortChange,
}: ProductsToolbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lấy label hiện tại dựa vào sortBy value
  const currentLabel = SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || "Mới nhất";

  // Xử lý click ra ngoài để đóng dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Left: Sort */}
      <div className="flex items-center gap-3 relative">
        <label className="text-base text-gray-700 font-medium whitespace-nowrap">
          Sắp xếp
        </label>
        
        {/* Custom Dropdown */}
        <div className="relative" ref={dropdownRef}>
          {/* Nút bấm hiển thị */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between min-w-[180px] px-4 py-1.5 bg-white border border-gray-300 rounded-md text-base text-gray-700 hover:border-gray-400 focus:outline-none relative z-10"
          >
            <span className="font-normal">{currentLabel}</span>
            {/* Icon mũi tên */}
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Danh sách xổ xuống */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50"
              >
                {SORT_OPTIONS.map((option, index) => (
                  <motion.div
                    key={option.value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    onClick={() => {
                      onSortChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2 cursor-pointer text-sm transition-colors hover:bg-gray-400
                      ${sortBy === option.value 
                        ? "bg-gray-200 text-dark-600 font-medium " // Style cho mục đang chọn
                        : "text-gray-700 hover:text-white"      // Style mặc định
                      }
                    `}
                  >
                    {option.label}
                    {/* Dấu tích nếu đang chọn (Option) */}
                    {sortBy === option.value && (
                       <span className="float-right text-dark-600">✓</span>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Results Count */}
      <div className="text-base text-gray-700">
        <strong className="text-black font-semibold">
          {pageInfo ? pageInfo.totalElements : 0}
        </strong>{" "}
        <span className="font-normal">kết quả tìm kiếm</span>
      </div>
    </motion.div>
  );
};