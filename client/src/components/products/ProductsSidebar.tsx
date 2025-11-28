import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FilterCheckbox } from "./FilterCheckbox";
import { formatCurrency } from "../../utils/helpers";
import type { Brand, Category } from "../../types";

interface ProductsSidebarProps {
  categories: Category[];
  brands: Brand[];
  priceBounds: [number, number] | null;
  priceRange: [number, number] | null;
  
  // Selection states
  selectedBrands: number[];
  selectedCategories: number[];
  selectedBrand: number | null;
  selectedCategory: number | null;
  brandSearchQuery: string;
  
  // Callbacks
  onToggleBrand: (brandId: number) => void;
  onToggleCategory: (categoryId: number) => void;
  onClearBrands: () => void;
  onClearCategories: () => void;
  onBrandSearchChange: (query: string) => void;
  onPriceRangeChange: (range: [number, number] | ((prev: [number, number] | null) => [number, number])) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  hasPendingFilters: boolean;
  hasActiveFilters: boolean;
  isLoading?: boolean; // Whether data is loading
}

export const ProductsSidebar = ({
  categories,
  brands,
  priceBounds,
  priceRange,
  selectedBrands,
  selectedCategories,
  selectedBrand,
  selectedCategory,
  brandSearchQuery,
  onToggleBrand,
  onToggleCategory,
  onClearBrands,
  onClearCategories,
  onBrandSearchChange,
  onPriceRangeChange,
  onApplyFilters,
  onResetFilters,
  hasPendingFilters,
  hasActiveFilters,
  isLoading = false,
}: ProductsSidebarProps) => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [isBrandsOpen, setIsBrandsOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);

  // Calculate display range for price slider
  const displayRange: [number, number] | null = priceBounds && priceRange
    ? (() => {
        const clampedMin = Math.max(priceBounds[0], Math.min(priceBounds[1], priceRange[0]));
        const clampedMax = Math.max(priceBounds[0], Math.min(priceBounds[1], priceRange[1]));
        const safeMin = Math.min(clampedMin, clampedMax);
        const safeMax = Math.max(clampedMin, clampedMax);
        return [safeMin, safeMax];
      })()
    : null;

  const handlePriceSliderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!priceBounds || !priceRange || !displayRange) return;

    e.preventDefault();
    e.stopPropagation();
    
    const sliderElement = e.currentTarget as HTMLElement;
    const rect = sliderElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    // Check if clicking on a thumb (within 20px radius)
    const minThumbPos = ((displayRange[0] - priceBounds[0]) / (priceBounds[1] - priceBounds[0])) * rect.width;
    const maxThumbPos = ((displayRange[1] - priceBounds[0]) / (priceBounds[1] - priceBounds[0])) * rect.width;
    const minThumbDistance = Math.abs(clickX - minThumbPos);
    const maxThumbDistance = Math.abs(clickX - maxThumbPos);
    
    // Determine which thumb to drag
    let activeThumb: 'min' | 'max' | null = null;
    if (minThumbDistance < 20) {
      activeThumb = 'min';
    } else if (maxThumbDistance < 20) {
      activeThumb = 'max';
    } else {
      activeThumb = minThumbDistance < maxThumbDistance ? 'min' : 'max';
    }
    
    if (!activeThumb) return;
    
    // Configuration
    const thumbWidth = 12;
    const pixelRange = rect.width;
    const valueRange = priceBounds[1] - priceBounds[0];
    const step = 10000;
    let minDistance = (thumbWidth / pixelRange) * valueRange;
    minDistance = Math.max(step, Math.ceil(minDistance / step) * step);
    
    let hasMoved = false;
    
    const handleMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      hasMoved = true;
      
      const moveRect = sliderElement.getBoundingClientRect();
      const moveX = moveEvent.clientX - moveRect.left;
      const movePercent = Math.max(0, Math.min(1, moveX / moveRect.width));
      const moveVal = priceBounds[0] + movePercent * valueRange;
      let steppedMoveVal = Math.round(moveVal / step) * step;
      
      onPriceRangeChange((currentRange) => {
        if (!currentRange) {
          steppedMoveVal = Math.max(priceBounds[0], Math.min(priceBounds[1], steppedMoveVal));
          steppedMoveVal = Math.round(steppedMoveVal / step) * step;
          return [steppedMoveVal, steppedMoveVal];
        }
        
        if (activeThumb === 'min') {
          const maxAllowed = currentRange[1] - minDistance;
          let finalMin = Math.min(steppedMoveVal, maxAllowed);
          finalMin = Math.max(priceBounds[0], finalMin);
          finalMin = Math.round(finalMin / step) * step;
          finalMin = Math.max(priceBounds[0], finalMin);
          return [finalMin, currentRange[1]];
        } else {
          const minAllowed = currentRange[0] + minDistance;
          let finalMax = Math.max(steppedMoveVal, minAllowed);
          finalMax = Math.min(priceBounds[1], finalMax);
          finalMax = Math.round(finalMax / step) * step;
          finalMax = Math.min(priceBounds[1], finalMax);
          return [currentRange[0], finalMax];
        }
      });
    };
    
    const handleUp = (upEvent?: MouseEvent) => {
      if (upEvent) {
        upEvent.preventDefault();
        upEvent.stopPropagation();
      }
      
      if (!hasMoved && activeThumb) {
        const percent = Math.max(0, Math.min(1, clickX / rect.width));
        const newVal = priceBounds[0] + percent * valueRange;
        let steppedVal = Math.round(newVal / step) * step;
        
        onPriceRangeChange((currentRange) => {
          if (!currentRange) {
            steppedVal = Math.max(priceBounds[0], Math.min(priceBounds[1], steppedVal));
            steppedVal = Math.round(steppedVal / step) * step;
            return [steppedVal, steppedVal];
          }
          
          if (activeThumb === 'min') {
            const maxAllowed = currentRange[1] - minDistance;
            let finalMin = Math.min(steppedVal, maxAllowed);
            finalMin = Math.max(priceBounds[0], finalMin);
            finalMin = Math.round(finalMin / step) * step;
            finalMin = Math.max(priceBounds[0], finalMin);
            return [finalMin, currentRange[1]];
          } else {
            const minAllowed = currentRange[0] + minDistance;
            let finalMax = Math.max(steppedVal, minAllowed);
            finalMax = Math.min(priceBounds[1], finalMax);
            finalMax = Math.round(finalMax / step) * step;
            finalMax = Math.min(priceBounds[1], finalMax);
            return [currentRange[0], finalMax];
          }
        });
      }
      
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  return (
    <aside className="min-h-[1200px] w-full lg:w-64 bg-white rounded-lg shadow-sm">
      <div className="px-6 py-6">
        {/* Categories - First Section */}
        <div className={`mb-6 border-b border-gray-200 ${isCategoriesOpen ? 'pb-6' : 'pb-2'}`}>
          <button
            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
            className="w-full flex items-center justify-between text-xs font-bold mb-4 text-black uppercase tracking-wider hover:opacity-70 transition-opacity">
            <span>DANH MỤC</span>
            <svg 
              className={`w-4 h-4 text-gray-600 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <AnimatePresence>
            {isCategoriesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ overflow: "hidden" }}>
                <motion.div
                  className="space-y-1"
                  initial={{ y: -10 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={isLoading ? { opacity: 0, x: -20, scale: 0.95 } : { opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <FilterCheckbox
                      label="Tất cả"
                      checked={selectedCategories.length === 0 && selectedCategory === null}
                      onChange={onClearCategories}
                    />
                  </motion.div>
                  {categories.map((cat, index) => (
                    <motion.div
                      key={cat.categoryId}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={isLoading ? { opacity: 0, x: -20, scale: 0.95 } : { opacity: 1, x: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: 0.1 * (index + 1),
                        ease: "easeOut"
                      }}
                    >
                      <FilterCheckbox
                        label={cat.name}
                        checked={selectedCategories.includes(cat.categoryId) || selectedCategory === cat.categoryId}
                        onChange={() => onToggleCategory(cat.categoryId)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Brands - Second Section */}
        <div className={`mb-6 border-b border-gray-200 ${isBrandsOpen ? 'pb-6' : 'pb-2'}`}>
          <button
            onClick={() => setIsBrandsOpen(!isBrandsOpen)}
            className="w-full flex items-center justify-between text-xs font-bold mb-4 text-black uppercase tracking-wider hover:opacity-70 transition-opacity">
            <span>THƯƠNG HIỆU</span>
            <svg 
              className={`w-4 h-4 text-gray-600 transition-transform ${isBrandsOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <AnimatePresence>
            {isBrandsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ overflow: "hidden" }}>
                <div>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-3"
                    placeholder="Tìm kiếm nhanh"
                    value={brandSearchQuery}
                    onChange={(e) => onBrandSearchChange(e.target.value)}
                  />
                  <div className="space-y-1 max-h-[280px] overflow-y-auto pr-2">
                    <FilterCheckbox
                      label="Tất cả"
                      checked={selectedBrands.length === 0 && selectedBrand === null}
                      onChange={onClearBrands}
                    />
                    {brands
                      .filter((brand) =>
                        brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
                      )
                      .map((brand) => (
                        <FilterCheckbox
                          key={brand.brandId}
                          label={brand.name}
                          checked={selectedBrands.includes(brand.brandId) || selectedBrand === brand.brandId}
                          onChange={() => onToggleBrand(brand.brandId)}
                        />
                      ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Price Filter - Third Section */}
        {priceBounds !== null && priceRange !== null && displayRange && (
          <div className={`border-b border-gray-200 ${isPriceOpen ? 'pb-6' : 'pb-2'}`}>
            <button
              onClick={() => setIsPriceOpen(!isPriceOpen)}
              className="w-full flex items-center justify-between text-xs font-bold mb-4 text-black uppercase tracking-wider hover:opacity-70 transition-opacity">
              <span>GIÁ</span>
              <svg 
                className={`w-4 h-4 text-gray-600 transition-transform ${isPriceOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {isPriceOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}>
                  <motion.div
                    className="space-y-4"
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="space-y-3">
                      <div 
                        className="relative h-6 cursor-pointer select-none mx-2"
                        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                        onMouseDown={handlePriceSliderMouseDown}>
                        {/* Background Track */}
                        <div className="absolute w-full h-[6px] bg-gray-300 rounded-full top-1/2 -translate-y-1/2 pointer-events-none" />
                        {/* Active Range Track */}
                        <div 
                          className="absolute h-[6px] bg-gray-600 rounded-full top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ 
                            left: `${((displayRange[0] - priceBounds[0]) / (priceBounds[1] - priceBounds[0])) * 100}%`,
                            width: `${((displayRange[1] - displayRange[0]) / (priceBounds[1] - priceBounds[0])) * 100}%`
                          }}
                        />
                        {/* Slider Thumbs */}
                        <div 
                          className="absolute w-5 h-5 bg-white rounded-full border-2 border-gray-400 z-40 top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-sm cursor-grab active:cursor-grabbing"
                          style={{ left: `${((displayRange[0] - priceBounds[0]) / (priceBounds[1] - priceBounds[0])) * 100}%` }}
                        />
                        <div 
                          className="absolute w-5 h-5 bg-white rounded-full border-2 border-gray-400 z-40 top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-sm cursor-grab active:cursor-grabbing"
                          style={{ left: `${((displayRange[1] - priceBounds[0]) / (priceBounds[1] - priceBounds[0])) * 100}%` }}
                        />
                      </div>
                      {/* Display selected price range */}
                      <div className="text-center">
                        <span className="text-lg font-semibold text-gray-900">
                          {formatCurrency(priceRange[0])} đ - {formatCurrency(priceRange[1])} ₫
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Filter Buttons - Bottom */}
      <div className="px-6 space-y-2">
        <button
          onClick={onApplyFilters}
          disabled={!hasPendingFilters}
          className={`w-full relative overflow-hidden py-2.5 px-4 rounded-full font-medium text-sm transition-all ${
            hasPendingFilters
              ? "bg-black text-white hover:bg-gray-800 cursor-pointer btn-slide-overlay-dark"
              : "bg-gray-200 text-gray-400 cursor-not-allowed "
          }`}>
          <span className="relative z-10">Lọc</span>
        </button>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="relative overflow-hidden btn-slide-overlay-dark btn-slide-overlay-white w-full py-2.5 px-4 rounded-full font-medium text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all">
            <span className="relative z-10">Đặt lại</span>
          </button>
        )}
      </div>
    </aside>
  );
};

