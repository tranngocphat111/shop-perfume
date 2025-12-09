import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Tag, Sparkles } from "lucide-react";
import type { Product, Inventory } from "../../types";
import { getPrimaryImageUrl, formatCurrency } from "../../utils/helpers";

interface RelatedProductsProps {
  relatedProducts: Product[];
  sameCategoryProducts: Product[];
  inventories?: Map<number, Inventory>;
  isLoading?: boolean;
}

export const RelatedProducts = ({
  relatedProducts,
  sameCategoryProducts,
  inventories = new Map(),
  isLoading = false,
}: RelatedProductsProps) => {
  // Helper function to get stock status badge
  const getStockBadge = (productId: number) => {
    const inventory = inventories.get(productId);

    // If no inventory data, don't show badge
    if (!inventory) {
      console.warn(
        `[RelatedProducts] No inventory data for product ${productId}`
      );
      return null;
    }

    const quantity = inventory.quantity;
    console.log(`[RelatedProducts] Product ${productId}: quantity=${quantity}`);

    // Chỉ hiển thị badge khi hết hàng hoặc sắp hết
    if (quantity === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 rounded-full text-xs font-medium text-red-700">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          Hết hàng
        </span>
      );
    } else if (quantity <= 10) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-xs font-medium text-yellow-700">
          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
          Sắp hết
        </span>
      );
    }

    // Không hiển thị badge khi còn hàng
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
      className="lg:col-span-3"
    >
      <div className="space-y-8">
        {/* Related Products by Brand */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <h2 className="flex items-center gap-2 font-medium text-lg text-black mb-4 py-4">
            <Tag className="w-6 h-6" />
            <span>Sản phẩm cùng thương hiệu</span>
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-lg animate-pulse"
                >
                  <div className="w-20 h-20 bg-gray-200 rounded border border-gray-200 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-5 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="space-y-3">
              {relatedProducts.map((relatedProduct, index) => {
                const imageUrl = getPrimaryImageUrl(relatedProduct);
                const showPrice = relatedProduct.unitPrice > 0;
                return (
                  <motion.div
                    key={relatedProduct.productId}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Link
                      to={`/products/${relatedProduct.productId}`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                    >
                      <div className="flex-shrink-0 w-20 h-20 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={relatedProduct.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/80x80/f0f0f0/333333?text=No+Image";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-gray-900 group-hover:text-black line-clamp-2 mb-1">
                          {relatedProduct.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-1">
                          {getStockBadge(relatedProduct.productId)}
                        </div>
                        {showPrice ? (
                          <p className="text-base font-normal text-gray-500">
                            {formatCurrency(relatedProduct.unitPrice)} ₫
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">Liên hệ</p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
              <p className="text-sm">Không có sản phẩm cùng thương hiệu</p>
            </div>
          )}
        </motion.div>

        {/* Products by Category */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <h2 className="flex items-center gap-2 font-medium text-lg text-black mb-4 py-4">
            <Sparkles className="w-6 h-6" />
            <span>Sản phẩm cùng loại</span>
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-lg animate-pulse"
                >
                  <div className="w-20 h-20 bg-gray-200 rounded border border-gray-200 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-5 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : sameCategoryProducts.length > 0 ? (
            <div className="space-y-3">
              {sameCategoryProducts.map((categoryProduct, index) => {
                const imageUrl = getPrimaryImageUrl(categoryProduct);
                const showPrice = categoryProduct.unitPrice > 0;
                return (
                  <motion.div
                    key={categoryProduct.productId}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Link
                      to={`/products/${categoryProduct.productId}`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                    >
                      <div className="flex-shrink-0 w-20 h-20 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={categoryProduct.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/80x80/f0f0f0/333333?text=No+Image";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-gray-900 group-hover:text-black line-clamp-2 mb-1">
                          {categoryProduct.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-1">
                          {getStockBadge(categoryProduct.productId)}
                        </div>
                        {showPrice ? (
                          <p className="text-base font-normal text-gray-500">
                            {formatCurrency(categoryProduct.unitPrice)} ₫
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">Liên hệ</p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
              <p className="text-sm">Không có sản phẩm cùng loại</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
