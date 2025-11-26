import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import type { Inventory } from "../types";
import { useBrands } from "../hooks/useBrands";
import { useCart } from "../contexts/CartContext";
import {
  getPrimaryImageUrl,
  formatCurrency,
  getBrandLogoUrl,
} from "../utils/helpers";

interface ProductCardProps {
  inventory: Inventory;
}

export const PerfumeCard = ({ inventory }: ProductCardProps) => {
  const product = inventory.product;
  const { brands } = useBrands();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const mouseDownPosRef = useState({ x: 0, y: 0 })[0];
  const [mouseDownTime, setMouseDownTime] = useState(0);
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });

  const imageUrl = getPrimaryImageUrl(product);

  // Get brand logo from brands API - handle Cloudinary URL
  const brand = brands.find((b) => b.brandId === product.brand.brandId);
  const brandLogoUrl = getBrandLogoUrl(brand?.url);


  // Show "Liên hệ" if price is 0, otherwise show price
  const showPrice = product.unitPrice > 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding) return;

    try {
      setIsAdding(true);
      await addToCart(product, 1);

      // Trigger header to show (white background) without scrolling
      const currentScrollY = window.scrollY;
      if (currentScrollY > 200) {
        // Dispatch custom event to force show header
        window.dispatchEvent(new CustomEvent("addToCart"));
      }

      // Show success notification (you can replace with toast later)
      const notification = document.createElement("div");
      notification.className =
        "fixed top-20 right-4 bg-black text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in";
      notification.textContent = `✓ Đã thêm "${product.name}" vào giỏ hàng`;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 3000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Có lỗi xảy ra khi thêm vào giỏ hàng");
    } finally {
      setTimeout(() => setIsAdding(false), 500);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products/${product.productId}`);
  };

  // Track mouse position to distinguish click from drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseDownTime(Date.now());
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    mouseDownPosRef.x = e.clientX;
    mouseDownPosRef.y = e.clientY;
  };

  const handleClick = (e: React.MouseEvent) => {
    // Calculate distance moved since mousedown
    const deltaX = Math.abs(e.clientX - mouseDownPos.x);
    const deltaY = Math.abs(e.clientY - mouseDownPos.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const timeDiff = Date.now() - mouseDownTime;

    // If moved more than 15px or took more than 500ms, it was a drag, not a click
    // Increased threshold to allow clicks in Swiper
    if (distance > 15 || timeDiff > 500) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Only navigate if it's a genuine click
    handleViewDetails(e);
  };

  return (
    <div
      className="product-box cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragStart={(e) => e.preventDefault()}
      onMouseDown={handleMouseDown}
      onClick={handleClick}>
      {/* Product Image Container */}
      <div className="product-image-wrapper">
        {/* Brand Logo - Top Center - Larger and Better Positioned */}
        <div className="brand-logo">
          {brandLogoUrl ? (
            <img
              src={brandLogoUrl}
              alt={product.brand.name}
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<span>${product.brand.name}</span>`;
                }
              }}
              onLoad={() => {
                // Image loaded successfully
              }}
            />
          ) : (
            <span>{product.brand.name}</span>
          )}
        </div>

        {/* Product Image */}
        <div className="product-image w-full h-full flex items-center justify-center relative z-0">
          <motion.img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-auto object-contain"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.5 }}
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/300x360/f0f0f0/333333?text=No+Image";
            }}
          />
        </div>

        {/* Hover Overlay with Icons - Bottom Position */}
        <motion.div
          className="absolute inset-0 bg-black/0 z-20 flex items-end justify-center pb-6 pointer-events-none"
          animate={{
            backgroundColor: isHovered
              ? "rgba(0, 0, 0, 0.05)"
              : "rgba(0, 0, 0, 0)",
          }}
          transition={{ duration: 0.3 }}>
          <motion.div
            className="product-action-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 20,
            }}
            transition={{ duration: 0.3 }}>
            {/* View Details Icon */}
            <motion.button
              onClick={handleViewDetails}
              onMouseDown={(e) => e.stopPropagation()}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white hover:bg-black text-black hover:text-white hover:shadow-xl"
              aria-label="Xem chi tiết">
              <Eye className="w-4 h-4 md:w-4 md:h-4" />
            </motion.button>

            {/* Add to Cart Icon */}
            <motion.button
              onClick={handleAddToCart}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={inventory.quantity === 0 || isAdding}
              whileHover={{ scale: inventory.quantity > 0 ? 1.1 : 1 }}
              whileTap={{ scale: inventory.quantity > 0 ? 0.95 : 1 }}
              className={`hover:shadow-xl ${
                inventory.quantity === 0 || isAdding
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-white hover:bg-black text-black hover:text-white"
              }`}
              aria-label="Thêm vào giỏ hàng">
              {isAdding ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4 md:w-4 md:h-4" />
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Product Info */}
      <div className="product-info space-y-1">
        <h3
          className={`text-[11px] sm:text-xs md:text-sm font-normal text-gray-900 line-clamp-2 min-h-[1.75rem] sm:min-h-[2rem] leading-relaxed transition-colors ${
            isHovered ? "text-gray-600" : ""
          }`}>
          {product.name}
        </h3>

        <div className="product-price">
          {showPrice ? (
            <span className="text-xs sm:text-sm md:text-base font-medium text-black">
              {formatCurrency(product.unitPrice)}&nbsp;₫
            </span>
          ) : (
            <span className="text-xs sm:text-sm md:text-base font-normal text-gray-500">
              Liên hệ
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
