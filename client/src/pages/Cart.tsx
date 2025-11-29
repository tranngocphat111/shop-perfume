import { motion } from "framer-motion";
import { useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { Link } from "react-router-dom";
import { EmptyCart } from "../components/cart/EmptyCart";
import { CartTable } from "../components/cart/CartTable";
import CartSummary from "../components/cart/CartSummary";
import { formatCurrency } from "../utils/helpers";

export const Cart = () => {
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

  const breadcrumbs = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Giỏ hàng' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen  pb-8">
      {/* Header */}
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
            Giỏ hàng & Ưu đãi
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
      <div className="container mx-auto px-4 max-w-7xl">


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
                    Hiện đang có {cart.items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Tổng cộng</p>
                  {/* Font Serif để đồng bộ giá tiền */}
                  <p className="text-xl font-serif text-gray-900">
                    {formatCurrency(getCartTotal() - discount)}
                  </p>
                </div>
              </div>
            </motion.div>

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
