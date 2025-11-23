import { motion } from 'framer-motion';

interface EmptyCartProps {}

export const EmptyCart = ({}: EmptyCartProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16"
    >
      <i className="fas fa-shopping-cart text-6xl text-gray-400 mb-4"></i>
      <h3 className="text-2xl font-medium text-gray-700 mb-4">
        Giỏ hàng của bạn đang trống
      </h3>
      <p className="text-gray-500 mb-8">
        Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
      </p>
      <a
        href="/products"
        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors"
      >
        <i className="fas fa-shopping-bag text-xl"></i>
        <span>Tiếp tục mua sắm</span>
      </a>
    </motion.div>
  );
};
