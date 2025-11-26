import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Tag, Sparkles } from "lucide-react";
import type { Product } from "../../types";
import { getPrimaryImageUrl, formatCurrency } from "../../utils/helpers";

interface RelatedProductsProps {
  relatedProducts: Product[];
  sameCategoryProducts: Product[];
}

export const RelatedProducts = ({
  relatedProducts,
  sameCategoryProducts,
}: RelatedProductsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
      className="lg:col-span-3">
      <div className="space-y-8">
        {/* Related Products by Brand */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4, delay: 0.5 }}>
          <h2 className="flex items-center gap-2 font-medium text-base text-black mb-4 py-4">
            <Tag className="w-5 h-5" />
            <span>Sản phẩm cùng thương hiệu</span>
          </h2>
          {relatedProducts.length > 0 ? (
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
                    transition={{ duration: 0.4, delay: index * 0.1 }}>
                    <Link
                      to={`/products/${relatedProduct.productId}`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
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
                        <h3 className="text-sm font-medium text-gray-900 group-hover:text-black line-clamp-2 mb-1">
                          {relatedProduct.name}
                        </h3>
                        {showPrice ? (
                          <p className="text-sm font-semibold text-black">
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
          transition={{ duration: 0.4, delay: 0.6 }}>
          <h2 className="flex items-center gap-2 font-medium text-base text-black mb-4 py-4">
            <Sparkles className="w-5 h-5" />
            <span>Sản phẩm cùng loại</span>
          </h2>
          {sameCategoryProducts.length > 0 ? (
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
                    transition={{ duration: 0.4, delay: index * 0.1 }}>
                    <Link
                      to={`/products/${categoryProduct.productId}`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
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
                        <h3 className="text-sm font-medium text-gray-900 group-hover:text-black line-clamp-2 mb-1">
                          {categoryProduct.name}
                        </h3>
                        {showPrice ? (
                          <p className="text-sm font-semibold text-black">
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

