import { motion } from "framer-motion";
import { PerfumeCard } from "../PerfumeCard";
import type { Product, Inventory, Brand } from "../../types";
import type { InventoryItem } from "../../services/inventory.service";

interface ProductsGridProps {
  products: Product[];
  inventoryMap: Map<number, InventoryItem>;
  brands: Brand[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  isLoading?: boolean;
}

export const ProductsGrid = ({
  products,
  inventoryMap,
  brands,
  hasActiveFilters,
  onResetFilters,
  isLoading = false,
}: ProductsGridProps) => {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-16 text-center">
        <i className="bi bi-inbox text-6xl text-gray-300 mb-4 block"></i>
        <h4 className="text-xl text-gray-600 mb-2 font-semibold">
          Không tìm thấy sản phẩm
        </h4>
        <p className="text-gray-500 mb-4">
          Vui lòng thử lại với bộ lọc khác
        </p>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm">
            Đặt lại bộ lọc
          </button>
        )}
      </div>
    );
  }

  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.96,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  // Create a key based on products and loading state to trigger re-animation
  // This ensures animation runs again when loading completes
  const productsKey = `${products.map(p => p.productId).join(',')}-${isLoading}`;

  return (
    <motion.div
      key={productsKey}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5"
      variants={containerVariants}
      initial="hidden"
      animate={isLoading ? "hidden" : "visible"}
    >
      {products.map((product) => {
        // Get inventory data from map
        const inventoryItem = inventoryMap.get(product.productId);
        const inventory: Inventory = {
          inventoryId: inventoryItem?.inventoryId || product.productId,
          product: product,
          quantity: Number(inventoryItem?.quantity),
        };

        return (
          <motion.div
            key={product.productId}
            variants={itemVariants}
            className="[&_.product-image-wrapper]:!p-3 [&_.product-image-wrapper]:!min-h-[180px] 
                       sm:[&_.product-image-wrapper]:!p-4 sm:[&_.product-image-wrapper]:!min-h-[200px]
                       lg:[&_.product-image-wrapper]:!p-4 lg:[&_.product-image-wrapper]:!min-h-[220px]
                       xl:[&_.product-image-wrapper]:!p-5 xl:[&_.product-image-wrapper]:!min-h-[240px]
                       [&_.product-image_img]:!max-h-[120px]
                       sm:[&_.product-image_img]:!max-h-[130px]
                       lg:[&_.product-image_img]:!max-h-[140px]">
            <PerfumeCard inventory={inventory} brands={brands} />
          </motion.div>
        );
      })}
    </motion.div>
  );
};

