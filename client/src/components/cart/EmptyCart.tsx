import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface EmptyCartProps {}

export const EmptyCart = ({}: EmptyCartProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-gray-100 border-dashed mx-auto max-w-2xl"
    >
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        <ShoppingBag className="text-gray-300" size={48} strokeWidth={1.5} />
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        Giỏ hàng của bạn đang trống
      </h3>
      
      <p className="text-gray-500 mb-8 max-w-md text-lg">
       Hãy khám phá cửa hàng và chọn cho mình những món đồ ưng ý nhé
      </p>
      
      <a
        href="/products"
        className="group relative btn-slide-overlay-dark overflow-hidden inline-flex items-center gap-2 px-8 py-3.5 bg-black text-white rounded-full font-bold hover:bg-gray-800 hover:shadow-lg transition-all active:scale-95"
      >
        <span className="flex items-center gap-1 relative z-10">Tiếp tục mua sắm  <ArrowRight size={18} /></span>
       
      </a>
    </motion.div>
  );
};