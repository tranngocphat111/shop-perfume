import { motion } from 'framer-motion';
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
  return (
    <>
      {/* Desktop Table Row - Hidden on mobile */}
      <motion.tr
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ delay: index * 0.05 }}
        className="hidden md:table-row border-b border-gray-200 align-middle hover:bg-gray-50 transition-colors"
      >
        {/* Product Info */}
        <td className="py-6 px-4">
          <div className="flex items-center gap-4 max-w-full overflow-hidden">
            <img
              src={getPrimaryImageUrl(item.product)}
              alt={item.product.name}
              className="w-[100px] h-[100px] object-cover rounded flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/100';
              }}
            />
            <div className="flex-1 min-w-0 overflow-hidden">
              <h5 className="text-base font-medium mb-1 overflow-hidden text-ellipsis line-clamp-2 leading-[1.4]">
                {item.product.name}
              </h5>
              <p className="text-sm text-gray-600 m-0 whitespace-nowrap overflow-hidden text-ellipsis">
                SKU: {formatSKU(item.product)}
              </p>
            </div>
          </div>
        </td>

        {/* Unit Price */}
        <td className="text-center py-6 px-4">
          <span className="font-medium text-lg whitespace-nowrap">
            {formatCurrency(item.product.unitPrice)} ₫
          </span>
        </td>

        {/* Quantity Control */}
        <td className="text-center py-6 px-4">
          <div className="inline-flex items-center gap-1 border-2 border-gray-300 rounded-full py-1.5 px-3 bg-white shadow-sm">
            <button
              onClick={() => onQuantityChange(item.product.productId, item.quantity - 1)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all active:scale-95"
              type="button"
            >
              <svg 
                className="w-4 h-4 text-gray-700" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) =>
                onQuantityChange(item.product.productId, parseInt(e.target.value) || 1)
              }
              className="w-12 text-center border-none outline-none text-base font-semibold bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="1"
            />
            <button
              onClick={() => onQuantityChange(item.product.productId, item.quantity + 1)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all active:scale-95"
              type="button"
            >
              <svg 
                className="w-4 h-4 text-gray-700" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </td>

        {/* Subtotal */}
        <td className="text-right py-6 px-4">
          <span className="font-medium text-lg whitespace-nowrap">
            {formatCurrency(item.product.unitPrice * item.quantity)} ₫
          </span>
        </td>

        {/* Remove Button */}
        <td className="text-center py-6 px-4">
          <button
            onClick={() => onRemove(item.product.productId)}
            className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
            type="button"
            title="Xóa sản phẩm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </td>
      </motion.tr>

      {/* Mobile Card - Hidden on desktop */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ delay: index * 0.05 }}
        className="block md:hidden border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex gap-3">
          {/* Product Image */}
          <img
            src={getPrimaryImageUrl(item.product)}
            alt={item.product.name}
            className="w-24 h-24 object-cover rounded flex-shrink-0"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/100';
            }}
          />

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h5 className="text-sm font-medium mb-1 line-clamp-2 leading-[1.4]">
              {item.product.name}
            </h5>
            <p className="text-xs text-gray-600 mb-2">
              SKU: {formatSKU(item.product)}
            </p>
            <p className="text-base font-bold text-black mb-3">
              {formatCurrency(item.product.unitPrice)} ₫
            </p>

            {/* Quantity Control & Total */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1 border-2 border-gray-300 rounded-full py-1 px-2 bg-white shadow-sm">
                <button
                  onClick={() => onQuantityChange(item.product.productId, item.quantity - 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all active:scale-95"
                  type="button"
                >
                  <svg 
                    className="w-3 h-3 text-gray-700" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    onQuantityChange(item.product.productId, parseInt(e.target.value) || 1)
                  }
                  className="w-10 text-center border-none outline-none text-sm font-semibold bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                />
                <button
                  onClick={() => onQuantityChange(item.product.productId, item.quantity + 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all active:scale-95"
                  type="button"
                >
                  <svg 
                    className="w-3 h-3 text-gray-700" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-600 mb-0.5">Thành tiền</p>
                <p className="text-base font-bold text-black">
                  {formatCurrency(item.product.unitPrice * item.quantity)} ₫
                </p>
              </div>
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(item.product.productId)}
            className="text-gray-400 hover:text-red-600 transition-colors p-1 h-fit"
            type="button"
            title="Xóa sản phẩm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </motion.div>
    </>
  );
};
