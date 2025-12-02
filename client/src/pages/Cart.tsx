import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { EmptyCart } from "../components/cart/EmptyCart";
import { CartTable } from "../components/cart/CartTable";
import CartSummary from "../components/cart/CartSummary";
import { formatCurrency } from "../utils/helpers";

export const Cart = () => {
  const {
    cart,
    isCartLoading,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    appliedCouponId,
    discount,
    setAppliedCouponId,
    setDiscount
  } = useCart();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Tính tổng và số lượng chỉ từ items còn hàng (nhưng vẫn hiển thị tất cả items)
  const availableItems = useMemo(() => {
    return cart.items.filter(item => 
      item.stockQuantity === undefined || item.stockQuantity > 0
    );
  }, [cart.items]);

  // Tính tổng và số lượng chỉ từ items còn hàng
  const availableTotal = useMemo(() => {
    return availableItems.reduce(
      (sum, item) => sum + item.product.unitPrice * item.quantity,
      0
    );
  }, [availableItems]);

  const availableItemCount = useMemo(() => {
    return availableItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [availableItems]);

  // Auto scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Loading effect - wait for cart to finish loading
  useEffect(() => {
    if (!isCartLoading) {
      // Cart has finished loading, wait a bit for smooth transition
      const timer = setTimeout(() => {
        setIsLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300); // Shorter delay since cart is already loaded

      return () => clearTimeout(timer);
    }
  }, [isCartLoading]);

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemove(productId);
      return;
    }
    updateQuantity(productId, newQuantity);

    // Reset coupon when cart changes (will be re-validated by CartSummary)
    if (appliedCouponId) {
      setDiscount(0);
      setAppliedCouponId(null);
    }
  };

  const handleRemove = (productId: number) => {
    removeFromCart(productId);

    // Reset coupon when cart changes
    if (appliedCouponId) {
      setDiscount(0);
      setAppliedCouponId(null);
    }
  };

  const handleCouponApply = (couponId: number | null, discountAmount: number) => {
    setAppliedCouponId(couponId);
    setDiscount(discountAmount);
  };

  const breadcrumbs = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Giỏ hàng' },
  ];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="bg-white p-8 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải giỏ hàng...</p>
          <p className="text-gray-400 text-sm mt-2">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen  pb-8">
      {/* Header - Only show when cart is not empty */}
      {cart.items.length > 0 && (
        <motion.div
          className="bg-white rounded-lg shadow-sm py-16 px-6 mb-6"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="text-center">
            <motion.h1
              className="text-3.5xl md:text-4.5xl lg:text-5.5xl font-normal text-black mb-4 leading-tight tracking-tight"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            >
              {isAuthenticated ? 'Giỏ hàng & Ưu đãi' : 'Giỏ hàng'}
            </motion.h1>

            {/* Breadcrumb */}
            <motion.nav
              className="text-sm md:text-base flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {breadcrumbs.map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                >
                  {item.path ? (
                    <Link
                      to={item.path}
                      className="text-gray-600 font-normal hover:text-black transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-black font-medium text-base md:text-lg">{item.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <span className="text-black">{'>'}</span>
                  )}
                </motion.div>
              ))}
            </motion.nav>
          </div>
        </motion.div>
      )}
      <div className={`container mx-auto px-4 max-w-7xl ${cart.items.length === 0 ? 'pt-16' : ''}`}>


        {/* Cart Container */}
        {cart.items.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            {/* Cart Summary Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              // Bỏ bg-white, bỏ shadow, chỉ giữ border-bottom
              className="bg-transparent border-b border-gray-200 pb-4 mb-8 mt-2"
            >
              <div className="flex flex-row items-end justify-between">
                <div>
                  <h2 className="text-lg font-serif text-gray-900 ">Giỏ hàng của bạn</h2>
                  <p className="text-sm text-gray-500">
                    Hiện đang có {availableItemCount} sản phẩm
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Tổng cộng</p>
                  {/* Font Serif để đồng bộ giá tiền */}
                  <p className="text-xl font-serif text-gray-900">
                    {formatCurrency(availableTotal - discount)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Hiển thị TẤT CẢ items (kể cả hết hàng) */}
              <CartTable
                items={cart.items}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemove}
              />
            </motion.div>

            <CartSummary
              total={availableTotal}
              itemCount={availableItems.length}
              discount={discount}
              onCouponApply={handleCouponApply}
              disabled={availableItems.length === 0 || availableTotal - discount <= 0}
            />
          </>
        )}
      </div>
    </div>
  );
};
