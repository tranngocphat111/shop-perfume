import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, Package } from "lucide-react";
import type { CartItem as CartItemType } from "../../types";
import { getPrimaryImageUrl, formatCurrency } from "../../utils/helpers";

interface CartItemProps {
  item: CartItemType;
  index: number;
  onQuantityChange: (productId: number, newQuantity: number) => void;
  onRemove: (productId: number) => void;
}

export const CartItem = ({
  item,
  onQuantityChange,
  onRemove,
}: CartItemProps) => {
  const navigate = useNavigate();
  const maxQuantity = item.stockQuantity ?? Infinity;
  const isOutOfStock =
    item.stockQuantity !== undefined && item.stockQuantity === 0;
  const isInactive = item.product.status === 'INACTIVE'; // Kiểm tra sản phẩm inactive
  const isUnavailable = isOutOfStock || isInactive; // Không khả dụng nếu hết hàng HOẶC inactive
  const isMaxQuantity = item.quantity >= maxQuantity;
  const isMinQuantity = item.quantity <= 1;
  const subtotal = item.product.unitPrice * item.quantity;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      onQuantityChange(item.product.productId, 1);
      return;
    }
    if (maxQuantity !== undefined && newQuantity > maxQuantity) {
      onQuantityChange(item.product.productId, maxQuantity);
      return;
    }
    onQuantityChange(item.product.productId, newQuantity);
  };

  const handleItemClick = () => {
    navigate(`/products/${item.product.productId}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      onClick={handleItemClick}
      className="cursor-pointer group relative bg-white rounded-xl border border-gray-200 hover:border-gray-900 hover:shadow-md transition-all duration-200 overflow-hidden mb-3"
    >
      <div className="flex flex-col md:flex-row p-4 gap-4 md:items-stretch">
        {/* 1. IMAGE BLOCK: Full height */}
        <div className="relative w-full md:w-28 h-48 md:h-auto md:self-stretch flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
          <img
            src={getPrimaryImageUrl(item.product)}
            alt={item.product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/200";
            }}
          />
          {/* Badge số lượng tồn kho */}
          {isInactive && (
            <div className="absolute top-2 left-2 bg-gray-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
              NGỪNG BÁN
            </div>
          )}
          {!isInactive && item.stockQuantity !== undefined && item.stockQuantity === 0 && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
              HẾT HÀNG
            </div>
          )}
          {!isInactive && item.stockQuantity !== undefined &&
            item.stockQuantity > 0 &&
            item.stockQuantity < 10 && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                SẮP HẾT
              </div>
            )}
        </div>

        {/* 2. MAIN CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Header Info */}
          <div className="flex justify-between items-start">
            <div className="pr-8">
              <h3 className="text-base md:text-lg font-bold text-gray-900 hover:text-gray-600 transition-colors leading-tight">
                {item.product.name}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                {isInactive ? (
                  <span className="text-lg inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-50 text-xs font-semibold text-gray-600 border border-gray-200">
                    <Package className="w-3 h-3 " />
                    <span className="mt-[-2px]"> Không khả dụng</span>
                  </span>
                ) : item.stockQuantity !== undefined &&
                item.stockQuantity === 0 ? (
                  <span className="text-lg inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-xs font-semibold text-red-600 border border-red-200">
                    <Package className="w-3 h-3 " />
                    <span className="mt-[-2px]"> Hết hàng</span>
                  </span>
                ) : (
                  <span className="text-lg inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-xs font-semibold text-gray-600 border border-gray-200">
                    <Package className="w-3 h-3 " />
                    <span className="mt-[-2px]">
                      {" "}
                      {item.stockQuantity ?? "N/A"} sản phẩm
                    </span>
                  </span>
                )}
                <span className="text-sm font-medium text-gray-400">
                  • Đơn giá: {formatCurrency(item.product.unitPrice)}
                </span>
              </div>
            </div>

            {/* Delete Button (Desktop Top Right) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.product.productId);
              }}
              className="hidden md:flex p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* 3. CONTROL BAR: Separated distinct area */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-4 flex flex-col md:flex-row items-center justify-between bg-gray-50 rounded-lg p-2.5 gap-3 md:gap-0"
          >
            {/* Quantity Control: Rounded full style like product detail */}
            <div
              className={`flex items-center border rounded-lg overflow-hidden transition-colors w-full md:w-auto ${
                isUnavailable
                  ? "border-gray-300 bg-gray-100"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(item.quantity - 1);
                }}
                disabled={isMinQuantity || isUnavailable}
                className="p-1.5 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-5 text-gray-700" />
              </button>

              <input
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  handleQuantityChange(val);
                }}
                onClick={(e) => e.stopPropagation()}
                disabled={isUnavailable}
                className="w-12 text-center border-0 focus:outline-none focus:ring-0 py-1.5 text-sm font-semibold text-gray-900 bg-transparent flex items-center justify-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                min="1"
                max={maxQuantity !== Infinity ? maxQuantity : undefined}
              />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(item.quantity + 1);
                }}
                disabled={isMaxQuantity || isUnavailable}
                className="p-1.5 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-5 text-gray-700" />
              </button>
            </div>

            {/* Price & Mobile Delete */}
            <div className="flex items-center justify-between w-full md:w-auto px-2">
              {/* Mobile Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.product.productId);
                }}
                className="md:hidden p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Thành tiền
                </span>
                <span className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
