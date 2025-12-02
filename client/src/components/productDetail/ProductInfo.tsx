import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Package,
  Sparkles,
  Tag,
  ShoppingBag,
  Star,
} from "lucide-react";
import type { Product, Inventory } from "../../types";
import { formatCurrency } from "../../utils/helpers";
import { reviewService, type Review } from "../../services/review.service";

interface ProductInfoProps {
  product: Product;
  inventory: Inventory | null;
  quantity: number;
  isAddingToCart: boolean;
  onQuantityChange: (newQuantity: number) => void;
  onAddToCart: () => void;
}

export const ProductInfo = ({
  product,
  inventory,
  quantity,
  isAddingToCart,
  onQuantityChange,
  onAddToCart,
}: ProductInfoProps) => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);

  const isInStock = inventory ? inventory.quantity > 0 : true;
  const isLowStock = inventory
    ? inventory.quantity > 0 && inventory.quantity <= 10
    : false;
  const showPrice = product.unitPrice > 0;

  // Fetch reviews for this product
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await reviewService.getReviewsByProduct(product.productId);
        setReviews(data);

        // Calculate average rating
        if (data.length > 0) {
          const total = data.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating(total / data.length);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      }
    };

    fetchReviews();
  }, [product.productId]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* Brand & Category */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex flex-wrap items-center gap-2 mb-2"
      >
        {product.brand && (
          <Link
            to={`/products?brandId=${product.brand.brandId}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors group"
          >
            <Tag className="w-4 h-4 text-gray-600 group-hover:text-black" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-black">
              {product.brand.name}
            </span>
          </Link>
        )}

        <Link
          to={`/products?categoryId=${product.category.categoryId}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors group"
        >
          <Sparkles className="w-4 h-4 text-gray-600 group-hover:text-black" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-black">
            {product.category.name}
          </span>
        </Link>
      </motion.div>

      {/* Product Name */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="text-1xl md:text-2xl font-bold text-black leading-tight"
      >
        {product.name}
      </motion.h1>

      {/* Rating Display - Only show if there are reviews */}
      {reviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="flex items-center gap-2"
        >
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-400">
            ({reviews.length} đánh giá)
          </span>
        </motion.div>
      )}

      {/* Price */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="flex items-center gap-4"
      >
        {showPrice ? (
          <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-black">
            {formatCurrency(product.unitPrice)} ₫
          </span>
        ) : (
          <span className="text-3xl md:text-4xl lg:text-5xl font-medium text-gray-500">
            Liên hệ
          </span>
        )}
      </motion.div>

      {/* Product Specs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200"
      >
        {product.perfumeLongevity && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Độ lưu hương</p>
            <p className="text-lg font-medium text-black">
              {product.perfumeLongevity}
            </p>
          </div>
        )}
        {product.perfumeConcentration && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Nồng độ</p>
            <p className="text-lg font-medium text-black">
              {product.perfumeConcentration}
            </p>
          </div>
        )}
        {product.releaseYear && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Năm phát hành</p>
            <p className="text-lg font-medium text-black">
              {product.releaseYear}
            </p>
          </div>
        )}
        {product.columeMl && product.columeMl > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Dung tích</p>
            <p className="text-lg font-medium text-black">
              {product.columeMl} ml
            </p>
          </div>
        )}
      </motion.div>

      {/* Stock Status & Quantity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-y border-gray-200"
      >
        {inventory && (
          <div className="flex items-center gap-3">
            {!isInStock ? (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-full">
                <Package className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">
                  Hết hàng
                </span>
              </div>
            ) : isLowStock ? (
              <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-full">
                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-orange-700">
                  Sắp hết hàng
                </span>
                <span className="text-sm text-orange-600 font-semibold">
                  ({inventory.quantity || 0} sản phẩm)
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-full">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-emerald-700">
                  Còn hàng
                </span>
                <span className="text-sm text-emerald-600 font-semibold">
                  ({inventory.quantity || 0} sản phẩm)
                </span>
              </div>
            )}
          </div>
        )}

        {isInStock && showPrice && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-800">
              Số lượng:
            </span>
            <div className="flex items-center border-2 border-gray-200 rounded-full overflow-hidden bg-white hover:border-gray-300 transition-colors">
              <button
                onClick={() => {
                  const newQuantity = quantity - 1;
                  if (newQuantity < 1) {
                    onQuantityChange(1);
                  } else {
                    onQuantityChange(newQuantity);
                  }
                }}
                disabled={quantity <= 1}
                className="p-3 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-700" />
              </button>
              <input
                type="number"
                min="1"
                max={inventory?.quantity || 999}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  const maxQuantity = inventory?.quantity || 999;
                  if (val < 1) {
                    onQuantityChange(1);
                  } else if (val > maxQuantity) {
                    onQuantityChange(maxQuantity);
                  } else {
                    onQuantityChange(val);
                  }
                }}
                className="w-16 text-center border-0 focus:outline-none focus:ring-0 py-2 text-sm font-semibold text-gray-900 bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => {
                  const maxQuantity = inventory?.quantity || 999;
                  const newQuantity = quantity + 1;
                  if (newQuantity > maxQuantity) {
                    onQuantityChange(maxQuantity);
                  } else {
                    onQuantityChange(newQuantity);
                  }
                }}
                disabled={quantity >= (inventory?.quantity || 999)}
                className="p-3 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="flex flex-row gap-2.5 pt-2"
      >
        <button
          onClick={() => {
            if (isInStock && showPrice) {
              onAddToCart();
              navigate("/checkout");
            }
          }}
          disabled={!isInStock || !showPrice}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold overflow-hidden transition-shadow focus:outline-none focus:ring-0 focus-visible:outline-none ${
            !isInStock || !showPrice
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "btn-slide-overlay-dark relative bg-black text-white "
          }`}
        >
          <ShoppingBag className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Mua ngay</span>
        </button>
        <button
          onClick={onAddToCart}
          disabled={!isInStock || isAddingToCart || !showPrice}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold overflow-hidden transition-shadow focus:outline-none focus:ring-0 focus-visible:outline-none ${
            !isInStock || !showPrice
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "btn-slide-overlay relative border border-black text-black bg-white"
          }`}
        >
          {isAddingToCart ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin relative z-10 btn-slide-overlay-icon" />
              <span className="relative z-10">Đang thêm...</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 relative z-10 btn-slide-overlay-icon" />
              <span className="relative z-10">Thêm vào giỏ hàng</span>
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
};
