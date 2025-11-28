import { motion } from 'framer-motion';
import { Trash2, Plus, Minus } from 'lucide-react';
import type { CartItem as CartItemType } from '../../types';
import { getPrimaryImageUrl, formatCurrency, formatSKU } from '../../utils/helpers';

interface CartItemProps {
  item: CartItemType;
  index: number;
  onQuantityChange: (productId: number, newQuantity: number) => void;
  onRemove: (productId: number) => void;
}

export const CartItem = ({ 
  item, 
  index, 
  onQuantityChange, 
  onRemove 
}: CartItemProps) => {
  const maxQuantity = item.stockQuantity ?? Infinity;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="relative w-full md:w-32 h-32 md:h-32 rounded-xl overflow-hidden bg-gray-100 group">
              <img
                src={getPrimaryImageUrl(item.product)}
                alt={item.product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/200';
                }}
              />
            </div>
          </div>

          {/* Product Info & Controls */}
          <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-4">
            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                {item.product.name}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 mb-2">
                SKU: <span className="font-mono">{formatSKU(item.product)}</span>
              </p>
              
              {/* Mobile: Price & Stock */}
              <div className="md:hidden flex items-center justify-between mb-3">
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(item.product.unitPrice)}
                  </p>
                  {item.stockQuantity !== undefined && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Còn {item.stockQuantity} sản phẩm
                    </p>
                  )}
                </div>
              </div>

              {/* Desktop: Price */}
              <div className="hidden md:block">
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  {formatCurrency(item.product.unitPrice)}
                </p>
                {item.stockQuantity !== undefined && (
                  <p className="text-sm text-gray-500">
                    Còn {item.stockQuantity} sản phẩm
                  </p>
                )}
              </div>
            </div>

            {/* Quantity Control */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* Desktop: Quantity */}
              <div className="hidden md:flex flex-col items-center gap-2">
                <div className="inline-flex items-center gap-1 border-2 border-gray-200 rounded-xl bg-gray-50 px-2 py-1.5 shadow-sm">
                  <button
                    onClick={() => handleQuantityChange(item.quantity - 1)}
                    disabled={isMinQuantity}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isMinQuantity 
                        ? 'opacity-40 cursor-not-allowed' 
                        : 'hover:bg-gray-200 active:scale-95 text-gray-700'
                    }`}
                    type="button"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      handleQuantityChange(value);
                    }}
                    className="w-14 text-center border-none outline-none text-base font-semibold bg-transparent text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="1"
                    max={maxQuantity !== Infinity ? maxQuantity : undefined}
                  />
                  <button
                    onClick={() => handleQuantityChange(item.quantity + 1)}
                    disabled={isMaxQuantity}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isMaxQuantity 
                        ? 'opacity-40 cursor-not-allowed' 
                        : 'hover:bg-gray-200 active:scale-95 text-gray-700'
                    }`}
                    type="button"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile: Quantity */}
              <div className="md:hidden flex items-center gap-2">
                <div className="inline-flex items-center gap-1 border-2 border-gray-200 rounded-xl bg-gray-50 px-2 py-1.5 shadow-sm">
                  <button
                    onClick={() => handleQuantityChange(item.quantity - 1)}
                    disabled={isMinQuantity}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      isMinQuantity 
                        ? 'opacity-40 cursor-not-allowed' 
                        : 'hover:bg-gray-200 active:scale-95 text-gray-700'
                    }`}
                    type="button"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      handleQuantityChange(value);
                    }}
                    className="w-12 text-center border-none outline-none text-sm font-semibold bg-transparent text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="1"
                    max={maxQuantity !== Infinity ? maxQuantity : undefined}
                  />
                  <button
                    onClick={() => handleQuantityChange(item.quantity + 1)}
                    disabled={isMaxQuantity}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      isMaxQuantity 
                        ? 'opacity-40 cursor-not-allowed' 
                        : 'hover:bg-gray-200 active:scale-95 text-gray-700'
                    }`}
                    type="button"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subtotal */}
              <div className="text-right min-w-[120px] md:min-w-[140px]">
                <p className="text-xs text-gray-500 mb-1 hidden md:block">Thành tiền</p>
                <p className="text-lg md:text-xl font-bold text-gray-900">
                  {formatCurrency(subtotal)}
                </p>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => onRemove(item.product.productId)}
                className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 active:scale-95"
                type="button"
                title="Xóa sản phẩm"
                aria-label="Xóa sản phẩm"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
