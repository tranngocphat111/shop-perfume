import { motion } from "framer-motion";
import { useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { Link } from "react-router-dom";
import { EmptyCart } from "../components/cart/EmptyCart";
import { CartTable } from "../components/cart/CartTable";
import CartSummary from "../components/cart/CartSummary";

export const Cart = () => {
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    getCartTotal,
    appliedUserCouponId,
    discount,
    setAppliedUserCouponId,
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
    if (appliedUserCouponId) {
      setDiscount(0);
      setAppliedUserCouponId(null);
    }
  };

  const handleRemove = (productId: number) => {
    removeFromCart(productId);
    
    // Reset coupon when cart changes
    if (appliedUserCouponId) {
      setDiscount(0);
      setAppliedUserCouponId(null);
    }
  };

  const handleCouponApply = (userCouponId: number | null, discountAmount: number) => {
    setAppliedUserCouponId(userCouponId);
    setDiscount(discountAmount);
  };

  return (
    <div className="bg-white min-h-screen pt-20">
      {/* Breadcrumb */}
      <div className="bg-gray-100 py-3 md:py-4">
        <div className="w-11/12 lg:w-4/5 mx-auto px-2 md:px-0">
          <nav className="text-xs md:text-sm">
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
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Giỏ hàng & Ưu đãi
                </h1>
                <p className="text-gray-500 mt-1">Chọn mã giảm giá và kiểm tra lại giá trị đơn hàng</p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm text-gray-500">Tổng tạm tính ({cart.items.length} món)</p>
                <p className="text-xl font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getCartTotal())}</p>
              </div>
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
