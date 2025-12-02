import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { formatCurrency, getPrimaryImageUrl } from "../../utils/helpers";

interface CartDropdownProps {
  isVisible: boolean;
  onClose: () => void;
}

export const CartDropdown = ({ isVisible, onClose }: CartDropdownProps) => {
  const { cart, getCartTotal, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (cart.items.length === 0) return null;

  const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const displayedItems = cart.items.slice(0, 3);
  const remainingCount = cart.items.length - 3;
  const hasMoreItems = remainingCount > 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full right-[-250px] z-50 w-[340px]"
        >
          {/* Container */}
          <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 z-10 overflow-hidden">
            
            {/* Product List */}
            <div className="py-3 space-y-0">
              {displayedItems.map((item) => (
                <Link
                  key={item.product.productId}
                  to={`/products/${item.product.productId}`}
                  onClick={onClose}
                  className="group relative flex gap-3 px-4 py-2.5 -mx-0 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {/* Image */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border border-gray-200 bg-gray-50 group-hover:border-gray-300 transition-colors">
                    <img
                      src={getPrimaryImageUrl(item.product)}
                      alt={item.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 leading-snug group-hover:text-gray-950 transition-colors">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                      Số lượng: {item.quantity}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFromCart(item.product.productId);
                    }}
                    className="absolute top-2.5 right-4 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100 z-10"
                    title="Xóa"
                  >
                    <X size={14} />
                  </button>
                </Link>
              ))}
            </div>

            {/* More Items Notice */}
            {hasMoreItems && (
              <div className="px-4 pb-3">
                <Link
                  to="/cart"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <span>Còn {remainingCount} sản phẩm khác</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100"></div>

            {/* Summary */}
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tổng sản phẩm</span>
                <span className="font-semibold text-gray-900">{totalQuantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tổng tiền</span>
                <span className="text-base font-bold text-gray-900">
                  {formatCurrency(getCartTotal())}₫
                </span>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="p-4 pt-0 flex gap-3 ">
              <Link
                to="/cart"
                onClick={onClose}
                className="btn-slide-overlay relative flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-center"
              >
                <span className="relative z-index-10">Xem giỏ hàng</span>
              </Link>
              <button
                onClick={() => {
                  onClose();
                  navigate("/checkout");
                }}
                className="btn-slide-overlay-dark relative flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors overflow-hidden"
              >
                <span className="relative z-index-10">Thanh toán</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
