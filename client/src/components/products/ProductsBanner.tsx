import { motion } from "framer-motion";
import type { Brand, Category } from "../../types";

interface ProductsBannerProps {
  selectedBrandInfo: Brand | null;
  selectedCategoryInfo: Category | null;
  onClearBrand: () => void;
  onClearCategory: () => void;
}

export const ProductsBanner = ({
  selectedBrandInfo,
  selectedCategoryInfo,
  onClearBrand,
  onClearCategory,
}: ProductsBannerProps) => {
  if (!selectedBrandInfo && !selectedCategoryInfo) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      {selectedBrandInfo && !selectedCategoryInfo && (
        <>
          <h2 className="text-2xl font-bold text-black mb-2">
            {selectedBrandInfo.name}
          </h2>
          {selectedBrandInfo.description && (
            <p className="text-gray-600 text-sm leading-relaxed">
              {selectedBrandInfo.description}
            </p>
          )}
          <button
            onClick={onClearBrand}
            className="mt-4 text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-1">
            <i className="bi bi-x-circle"></i>
            Xóa bộ lọc
          </button>
        </>
      )}
      {selectedCategoryInfo && !selectedBrandInfo && (
        <>
          <h2 className="text-2xl font-bold text-black mb-2">
            {selectedCategoryInfo.name}
          </h2>
          {selectedCategoryInfo.description && (
            <p className="text-gray-600 text-sm leading-relaxed">
              {selectedCategoryInfo.description}
            </p>
          )}
          <button
            onClick={onClearCategory}
            className="mt-4 text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-1">
            <i className="bi bi-x-circle"></i>
            Xóa bộ lọc
          </button>
        </>
      )}
    </motion.div>
  );
};

