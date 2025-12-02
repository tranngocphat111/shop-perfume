import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import type { Inventory, Brand } from "../types";
import { useCart } from "../contexts/CartContext";
import {
  getPrimaryImageUrl,
  formatCurrency,
  getBrandLogoUrl,
} from "../utils/helpers";

interface ProductCardProps {
  inventory: Inventory;
  brands?: Brand[];
}

export const PerfumeCard = ({ inventory, brands = [] }: ProductCardProps) => {
  const product = inventory.product;
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const mouseDownPosRef = useState({ x: 0, y: 0 })[0];
  const [mouseDownTime, setMouseDownTime] = useState(0);
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });

  const imageUrl = getPrimaryImageUrl(product);

  // Get brand logo from passed brands
  const brand =
    brands.length > 0
      ? brands.find((b) => b.brandId === product.brand.brandId)
      : null;
  const brandLogoUrl = getBrandLogoUrl(brand?.url);

  // Show "Liên hệ" if price is 0, otherwise show price
  const showPrice = product.unitPrice > 0;

  // Check stock status
  const isOutOfStock = inventory.quantity === 0;
  const isLowStock = inventory.quantity > 0 && inventory.quantity <= 10;

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
      className="product-box cursor-pointer relative" // Thêm relative để overlay hoạt động chuẩn
      onMouseEnter={() => !isOutOfStock && setIsHovered(true)}
      onMouseLeave={() => !isOutOfStock && setIsHovered(false)}
      onDragStart={(e) => e.preventDefault()}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Product Image Container */}
      <div className="product-image-wrapper relative">
        {" "}
        {/* Đảm bảo wrapper là relative */}
        {/* --- PHẦN THÊM MỚI: HẾT HÀNG (Giống ảnh mẫu) --- */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <div className="bg-red-600 text-white px-6 py-2 uppercase tracking-[0.2em] text-xs font-semibold shadow-md">
              Hết hàng
            </div>
          </div>
        )}
        {/* --- PHẦN THÊM MỚI: SẮP HẾT HÀNG (Style giống mẫu) --- */}
        {!isOutOfStock && isLowStock && (
          <div className="absolute top-3 left-3 z-30">
            <div className="bg-[#FF8C42] text-white px-3 py-1 uppercase tracking-[0.15em] text-[10px] font-semibold shadow-md">
              Sắp hết
            </div>
          </div>
        )}
        {/* Brand Logo - Top Center - Larger and Better Positioned */}
        <div className="brand-logo">
          {brandLogoUrl ? (
            <img
              src={brandLogoUrl}
              alt={product.brand.name}
              loading="eager"
              fetchPriority="high"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<span>${product.brand.name}</span>`;
                }
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
        {/* Hover Overlay with Icons - Bottom Position - Chỉ hiện khi KHÔNG hết hàng */}
        {!isOutOfStock && (
          <motion.div
            className="absolute inset-0 bg-black/0 z-20 flex items-end justify-center pb-6 pointer-events-none"
            animate={{
              backgroundColor: isHovered
                ? "rgba(0, 0, 0, 0.05)"
                : "rgba(0, 0, 0, 0)",
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="product-action-buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                y: isHovered ? 0 : 20,
              }}
              transition={{ duration: 0.3 }}
            >
              {/* View Details Icon */}
              <motion.button
                onClick={handleViewDetails}
                onMouseDown={(e) => e.stopPropagation()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white hover:bg-black text-black hover:text-white hover:shadow-xl"
                aria-label="Xem chi tiết"
              >
                <Eye className="w-4 h-4 md:w-4 md:h-4" />
              </motion.button>

              {/* Add to Cart Icon */}
              <motion.button
                onClick={handleAddToCart}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={isAdding}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white hover:bg-black text-black hover:text-white hover:shadow-xl"
                aria-label="Thêm vào giỏ hàng"
              >
                {isAdding ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4 md:w-4 md:h-4" />
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Product Info */}
      <div className="product-info space-y-1">
        <h3
          className={`text-sm sm:text-base md:text-lg font-normal text-gray-900 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] leading-relaxed transition-colors ${
            isHovered ? "text-gray-600" : ""
          }`}
        >
          {product.name}
        </h3>

        <div className="product-price">
          {showPrice ? (
            <span className="text-base sm:text-lg md:text-xl font-semibold text-black">
              {formatCurrency(product.unitPrice)}&nbsp;₫
            </span>
          ) : (
            <span className="text-base sm:text-lg md:text-xl font-normal text-gray-500">
              Liên hệ
            </span>
          )}
        </div>

        {/* Stock Status Text - Phần này giữ nguyên text bên dưới để người dùng vẫn đọc được chi tiết */}
        {isLowStock ? (
          <div className="text-xs sm:text-sm text-orange-500 font-medium">
            Chỉ còn {inventory.quantity} sản phẩm
          </div>
        ) : null}
      </div>
    </div>
  );
};
