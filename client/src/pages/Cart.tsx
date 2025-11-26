import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { Link } from "react-router-dom";
import { EmptyCart } from "../components/cart/EmptyCart";
import { CartTable } from "../components/cart/CartTable";
import { CartSummary } from "../components/cart/CartSummary";
import type { Coupon } from "../services/coupon.service";

export const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

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
    
    // Re-validate coupon if applied
    if (appliedCoupon) {
      const total = getCartTotal();
      if (total < appliedCoupon.minOrderValue) {
        setDiscount(0);
        setAppliedCoupon(null);
      }
    }
  };

  const handleRemove = (productId: number) => {
    removeFromCart(productId);
    
    // Re-validate coupon if applied
    if (appliedCoupon) {
      const total = getCartTotal();
      if (total < appliedCoupon.minOrderValue) {
        setDiscount(0);
        setAppliedCoupon(null);
      }
    }
  };

  const handleCouponApply = (coupon: Coupon | null, discountAmount: number) => {
    setAppliedCoupon(coupon);
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
