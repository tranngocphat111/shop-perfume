import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  const handleProductClick = () => {
    navigate(`/products/${item.product.productId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <div className="p-3 md:p-4">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div 
              onClick={handleProductClick}
              className="relative w-full md:w-24 h-24 md:h-24 rounded-lg overflow-hidden bg-gray-100 group cursor-pointer"
            >
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
          <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-3">
            {/* Product Details */}
            <div 
              onClick={handleProductClick}
              className="flex-1 min-w-0 cursor-pointer"
            >
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight hover:text-gray-600 transition-colors">
                {item.product.name}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 mb-1.5">
                SKU: <span className="font-mono">{formatSKU(item.product)}</span>
              </p>
              
              {/* Mobile: Price & Stock */}
              <div className="md:hidden flex items-center justify-between">
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
                <p className="text-lg font-semibold text-gray-900 mb-0.5">
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
            <div className="flex items-center gap-3 md:gap-4">
              {/* Desktop: Quantity - Rounded full style like product detail */}
              <div className="hidden md:flex items-center">
                <div className="flex items-center border-2 border-gray-200 rounded-full overflow-hidden bg-white hover:border-gray-300 transition-colors">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(item.quantity - 1);
                    }}
                    disabled={isMinQuantity}
                    className={`p-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
                    type="button"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-4 h-4 text-gray-700" />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      handleQuantityChange(value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-16 text-center border-0 focus:outline-none focus:ring-0 py-1 text-base font-semibold text-gray-900 bg-transparent flex items-center justify-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="1"
                    max={maxQuantity !== Infinity ? maxQuantity : undefined}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(item.quantity + 1);
                    }}
                    disabled={isMaxQuantity}
                    className={`p-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
                    type="button"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Mobile: Quantity - Rounded full style */}
              <div className="md:hidden flex items-center">
                <div className="flex items-center border-2 border-gray-200 rounded-full overflow-hidden bg-white hover:border-gray-300 transition-colors">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(item.quantity - 1);
                    }}
                    disabled={isMinQuantity}
                    className={`p-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
                    type="button"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-3.5 h-3.5 text-gray-700" />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      handleQuantityChange(value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-12 text-center border-0 focus:outline-none focus:ring-0 py-0.5 text-sm font-semibold text-gray-900 bg-transparent flex items-center justify-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="1"
                    max={maxQuantity !== Infinity ? maxQuantity : undefined}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(item.quantity + 1);
                    }}
                    disabled={isMaxQuantity}
                    className={`p-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
                    type="button"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-3.5 h-3.5 text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Subtotal */}
              <div className="text-right min-w-[100px] md:min-w-[120px]">
                <p className="text-lg md:text-xl font-bold text-gray-900">
                  {formatCurrency(subtotal)}
                </p>
              </div>

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.product.productId);
                }}
                className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 active:scale-95"
                type="button"
                title="Xóa sản phẩm"
                aria-label="Xóa sản phẩm"
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
