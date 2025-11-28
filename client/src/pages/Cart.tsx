import { motion } from "framer-motion";
import { useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { EmptyCart } from "../components/cart/EmptyCart";
import { CartTable } from "../components/cart/CartTable";
import CartSummary from "../components/cart/CartSummary";

export const Cart = () => {
  const { isAuthenticated } = useAuth();
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    getCartTotal,
    appliedCouponId,
    discount,
    setAppliedCouponId,
    setDiscount
  } = useCart();

  // Auto scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  return (
    <div className="bg-white min-h-screen pt-20">
      {/* Breadcrumb */}
      <div className="bg-gray-100 py-3 md:py-4">
        <div className="w-11/12 lg:w-4/5 mx-auto px-2 md:px-0">
          <nav className="text-sm md:text-base">
            <Link
              to="/"
              className="text-gray-600 hover:text-black transition-colors"
            >
              Trang chủ
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-black font-medium">Giỏ hàng</span>
          </nav>
        </div>
      </div>

      {/* Cart Container */}
      <div className="w-11/12 lg:w-4/5 mx-auto py-4 md:py-8 px-2 md:px-4 mb-4">
        {cart.items.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-3">
                <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {isAuthenticated ? 'Giỏ hàng & Ưu đãi' : 'Giỏ hàng'}
              </h1>
              <p className="text-gray-500 text-base md:text-lg">
                {isAuthenticated 
                  ? 'Chọn mã giảm giá và kiểm tra lại giá trị đơn hàng'
                  : 'Kiểm tra lại thông tin đơn hàng của bạn'
                }
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CartTable
                items={cart.items}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemove}
              />
            </motion.div>

            <CartSummary 
              total={getCartTotal()} 
              itemCount={cart.items.length} 
              discount={discount}
              onCouponApply={handleCouponApply}
            />
          </>
        )}
      </div>
    </div>
  );
};
