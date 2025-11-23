import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Inventory } from '../types';
import { useCart } from '../contexts/CartContext';
import { getPrimaryImageUrl, formatCurrency } from '../utils/helpers';

interface ProductCardProps {
  inventory: Inventory;
}

export const PerfumeCard = ({ inventory }: ProductCardProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  
  const product = inventory.product;
  const imageUrl = getPrimaryImageUrl(product);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inventory.quantity === 0 || isAdding) return;
    
    setIsAdding(true);
    try {
      addToCart(product, 1);
      alert(`Đã thêm ${product.name} vào giỏ hàng!`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inventory.quantity === 0) return;
    
    addToCart(product, 1);
    navigate('/cart');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative pt-[120%] bg-gray-100 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={product.name}
          className="absolute top-0 left-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/300x360/f0f0f0/333333?text=No+Image';
          }}
        />
        {/* Brand Badge */}
        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded shadow-sm text-xs font-semibold">
          {product.brand.name}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h5 className="text-base font-semibold mb-3 text-black min-h-[3rem] line-clamp-2">
          {product.name}
        </h5>
        
        <div className="text-xl font-bold text-black mb-4">
          {formatCurrency(product.unitPrice)} ₫
        </div>

        <div className="text-xs text-gray-600 mb-4 flex-1 space-y-1">
          <div><strong>Dung tích:</strong> {product.columeMl}ml</div>
          <div><strong>Danh mục:</strong> {product.category.name}</div>
          {inventory.quantity > 0 ? (
            <div className="text-green-600 flex items-center gap-1">
              <i className="bi bi-check-circle"></i> 
              <span>Còn hàng ({inventory.quantity})</span>
            </div>
          ) : (
            <div className="text-red-600 flex items-center gap-1">
              <i className="bi bi-x-circle"></i>
              <span>Hết hàng</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-white text-black border-2 border-black px-2.5 py-2.5 rounded-md font-semibold text-sm transition-all hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            onClick={handleAddToCart}
            disabled={inventory.quantity === 0 || isAdding}
          >
            <i className="bi bi-cart-plus"></i> 
            {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-black text-white px-2.5 py-2.5 rounded-md font-semibold text-sm transition-all hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleBuyNow}
            disabled={inventory.quantity === 0}
          >
            Mua ngay
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
