import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, Minus, Package, Sparkles, Tag, ShoppingBag, Info, Shield, FileText, ChevronLeft } from "lucide-react";
import { productService } from "../services/perfume.service";
import { inventoryService } from "../services/inventory.service";
import { useCart } from "../contexts/CartContext";
import { PerfumeCard } from "../components/PerfumeCard";
import type { Product, Inventory } from "../types";
import {
  getPrimaryImageUrl,
  getImageUrls,
  formatCurrency,
} from "../utils/helpers";

interface ParsedNotes {
  top?: string[];
  middle?: string[];
  base?: string[];
}

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [sameCategoryProducts, setSameCategoryProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "usage" | "policy">("description");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Parse description to extract notes from the last 3 lines
  const parseNotes = (description: string): ParsedNotes => {
    const notes: ParsedNotes = {};
    
    // Split description into lines
    const lines = description
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    
    // Check if last 3 lines contain note headers
    if (lines.length >= 3) {
      const last3Lines = lines.slice(-3);
      
      // Check if these lines contain "Hương đầu", "Hương giữa", "Hương cuối"
      const hasTopNote = last3Lines.some(line => line.match(/^Hương đầu[:\s]/i));
      const hasMiddleNote = last3Lines.some(line => line.match(/^Hương giữa[:\s]/i));
      const hasBaseNote = last3Lines.some(line => line.match(/^Hương cuối[:\s]/i));
      
      // If we have note headers in last 3 lines, parse them
      if (hasTopNote || hasMiddleNote || hasBaseNote) {
        last3Lines.forEach((line) => {
          const topMatch = line.match(/^Hương đầu[:\s]+(.+)$/i);
          const middleMatch = line.match(/^Hương giữa[:\s]+(.+)$/i);
          const baseMatch = line.match(/^Hương cuối[:\s]+(.+)$/i);
          
          if (topMatch) {
            const content = topMatch[1].trim();
            notes.top = content
              .split(/[,，]/)
              .map((n) => n.trim())
              .filter((n) => n.length > 0);
          }
          
          if (middleMatch) {
            const content = middleMatch[1].trim();
            notes.middle = content
              .split(/[,，]/)
              .map((n) => n.trim())
              .filter((n) => n.length > 0);
          }
          
          if (baseMatch) {
            const content = baseMatch[1].trim();
            notes.base = content
              .split(/[,，]/)
              .map((n) => n.trim())
              .filter((n) => n.length > 0);
          }
        });
      }
    }

    return notes;
  };

  // Format description - exclude the last 3 lines if they are note lines
  const formatDescription = (description: string): string[] => {
    const lines = description
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    
    // Check if last 3 lines contain note headers
    if (lines.length >= 3) {
      const last3Lines = lines.slice(-3);
      const hasTopNote = last3Lines.some(line => line.match(/^Hương đầu[:\s]/i));
      const hasMiddleNote = last3Lines.some(line => line.match(/^Hương giữa[:\s]/i));
      const hasBaseNote = last3Lines.some(line => line.match(/^Hương cuối[:\s]/i));
      
      // If last 3 lines are notes, exclude them from description
      if (hasTopNote || hasMiddleNote || hasBaseNote) {
        return lines.slice(0, -3);
      }
    }
    
    return lines;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const productId = parseInt(id, 10);
        if (isNaN(productId)) {
          setError("ID sản phẩm không hợp lệ");
          return;
        }

        // Load product và inventory song song (parallel) - sử dụng endpoint trực tiếp để tối ưu
        const [productResult, inventoryResult] = await Promise.allSettled([
          // Fetch product
          productService.getProductById(productId),
          
          // Fetch inventory trực tiếp theo productId (nhanh hơn nhiều)
          inventoryService.getInventoryByProductId(productId)
        ]);

        // Xử lý product result
        if (productResult.status === 'fulfilled') {
          const productData = productResult.value;
          console.log("Product data:", productData); // Debug log
          console.log("Product brand:", productData.brand); // Debug log
          setProduct(productData);

          // Set inventory
          if (inventoryResult.status === 'fulfilled' && inventoryResult.value) {
            const inventoryData = inventoryResult.value;
            setInventory({
              inventoryId: inventoryData.inventoryId,
              product: productData,
              quantity: inventoryData.quantity,
            });
          } else {
            // Set default inventory nếu không tìm thấy
            setInventory({
              inventoryId: productId,
              product: productData,
              quantity: 0,
            });
          }

          // Load related products song song sau khi có product data
          const [relatedByBrand, relatedByCategory] = await Promise.allSettled([
            // Fetch related products by brand
            productData.brand && productData.brand.brandId
              ? productService.getProductsByBrand(productData.brand.brandId)
                  .then(products => products
                    .filter((p) => p.productId !== productId)
                    .slice(0, 4)
                  )
                  .catch(err => {
                    console.warn("Could not fetch related products by brand:", err);
                    return [];
                  })
              : Promise.resolve([]),
            
            // Fetch products by category
            productService.getProductsByCategory(productData.category.categoryId)
              .then(products => products
                .filter((p) => p.productId !== productId)
                .slice(0, 4)
              )
              .catch(err => {
                console.warn("Could not fetch products by category:", err);
                return [];
              })
          ]);

          // Update related products
          if (relatedByBrand.status === 'fulfilled' && relatedByBrand.value) {
            const brandProducts = Array.isArray(relatedByBrand.value) ? relatedByBrand.value : [];
            console.log("Related products by brand:", brandProducts);
            setRelatedProducts(brandProducts);
          } else {
            console.log("No related products by brand found");
            setRelatedProducts([]);
          }

          if (relatedByCategory.status === 'fulfilled' && relatedByCategory.value) {
            const categoryProducts = Array.isArray(relatedByCategory.value) ? relatedByCategory.value : [];
            console.log("Related products by category:", categoryProducts);
            setSameCategoryProducts(categoryProducts);
          } else {
            console.log("No related products by category found");
            setSameCategoryProducts([]);
          }
        } else {
          throw productResult.reason || new Error("Failed to fetch product");
        }

      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin sản phẩm"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || isAddingToCart) return;

    try {
      setIsAddingToCart(true);
      addToCart(product, quantity);

      // Show success notification
      const notification = document.createElement("div");
      notification.className =
        "fixed top-20 right-4 bg-black text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in";
      notification.textContent = `✓ Đã thêm ${quantity} "${product.name}" vào giỏ hàng`;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 3000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Có lỗi xảy ra khi thêm vào giỏ hàng");
    } finally {
      setTimeout(() => setIsAddingToCart(false), 500);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    const maxQuantity = inventory?.quantity || 999;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  // Swipe handlers for image navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && images.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % images.length);
    }
    if (isRightSwipe && images.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600 px-4">
        <p className="text-xl font-semibold mb-2">
          {error || "Không tìm thấy sản phẩm"}
        </p>
        <button
          onClick={() => navigate("/products")}
          className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
          Quay lại danh sách sản phẩm
        </button>
      </div>
    );
  }

  const images = getImageUrls(product);
  const primaryImage = getPrimaryImageUrl(product);
  const notes = parseNotes(product.description);
  const descriptionLines = formatDescription(product.description);
  const isInStock = inventory ? inventory.quantity > 0 : true;
  const showPrice = product.unitPrice > 0;

  return (
    <div className="bg-white min-h-screen pt-20">
      {/* Breadcrumb */}
      <div className=" py-3 md:py-4">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <nav className="text-xs md:text-sm flex items-center gap-2">
            <Link
              to="/"
              className="text-gray-500 font-normal hover:text-black transition-colors">
              Trang chủ
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              to="/products"
              className="text-gray-500 font-normal hover:text-black transition-colors">
              Sản phẩm
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              to={`/products?brandId=${product.brand.brandId}`}
              className="text-gray-500 font-normal hover:text-black transition-colors">
              {product.brand.name}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-black font-medium line-clamp-1">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Detail Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Left Column - Images */}
          <div className="flex flex-col gap-4">
            {/* Main Image - Swipeable */}
            <div 
              className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing"
              style={{ maxHeight: '400px' }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={images[selectedImageIndex] || primaryImage}
                alt={product.name}
                className="w-full h-auto object-contain max-h-[400px] mx-auto p-4 select-none"
                draggable={false}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/600x600/f0f0f0/333333?text=No+Image";
                }}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                    aria-label="Next image"
                  >
                    <ChevronLeft className="w-5 h-5 rotate-180" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all  ${
                      selectedImageIndex === index
                        ? "border-black shadow-sm"
                        : "border-gray-200 hover:border-gray-400"
                    }`}>
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover z"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            {/* Brand & Category - Ngang hàng, đồng bộ thiết kế */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* Brand */}
              {product.brand && (
                <Link
                  to={`/products?brandId=${product.brand.brandId}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors group">
                  <Tag className="w-4 h-4 text-gray-600 group-hover:text-black" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-black">
                    {product.brand.name}
                  </span>
                </Link>
              )}

              {/* Category (Bộ sưu tập) */}
              <Link
                to={`/products?categoryId=${product.category.categoryId}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors group">
                <Sparkles className="w-4 h-4 text-gray-600 group-hover:text-black" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-black">
                  {product.category.name}
                </span>
              </Link>
            </div>

            {/* Product Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-black leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-4">
              {showPrice ? (
                <span className="text-3xl md:text-4xl font-bold text-black">
                  {formatCurrency(product.unitPrice)} ₫
                </span>
              ) : (
                <span className="text-2xl md:text-3xl font-medium text-gray-500">
                  Liên hệ
                </span>
              )}
            </div>

            {/* Product Specs */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200">
              {product.perfumeLongevity && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Độ lưu hương</p>
                  <p className="text-base font-medium text-black">
                    {product.perfumeLongevity}
                  </p>
                </div>
              )}
              {product.perfumeConcentration && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Nồng độ</p>
                  <p className="text-base font-medium text-black">
                    {product.perfumeConcentration}
                  </p>
                </div>
              )}
              {product.releaseYear && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Năm phát hành</p>
                  <p className="text-base font-medium text-black">
                    {product.releaseYear}
                  </p>
                </div>
              )}
              {product.columeMl && product.columeMl > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Dung tích</p>
                  <p className="text-base font-medium text-black">
                    {product.columeMl} ml
                  </p>
                </div>
              )}
            </div>


            {/* Stock Status & Quantity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-y border-gray-200">
              {/* Stock Status */}
              {inventory && (
                <div className="flex items-center gap-3">
                  {isInStock ? (
                    <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-full">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-emerald-700">
                        Còn hàng
                      </span>
                      <span className="text-xs text-emerald-600 font-medium">
                        ({inventory.quantity || 0} sản phẩm)
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-full">
                      <Package className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-semibold text-red-700">
                        Hết hàng
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Selector */}
              {isInStock && showPrice && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800">Số lượng:</span>
                  <div className="flex items-center border-2 border-gray-200 rounded-full overflow-hidden bg-white hover:border-gray-300 transition-colors">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="p-2.5 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <Minus className="w-4 h-4 text-gray-700" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={inventory?.quantity || 999}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        handleQuantityChange(val);
                      }}
                      className="w-20 text-center border-0 focus:outline-none focus:ring-0 py-2.5 font-medium text-gray-900 bg-transparent flex items-center justify-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      style={{ textAlign: 'center' }}
                    />
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= (inventory?.quantity || 999)}
                      className="p-2.5 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <Plus className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row gap-2.5 pt-2">
              <button
                onClick={() => {
                  if (isInStock && showPrice) {
                    handleAddToCart();
                    navigate("/checkout");
                  }
                }}
                disabled={!isInStock || !showPrice}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold overflow-hidden transition-shadow focus:outline-none focus:ring-0 focus-visible:outline-none ${
                  !isInStock || !showPrice
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "btn-slide-overlay-dark relative bg-black text-white shadow-lg hover:shadow-2xl"
                }`}>
                <ShoppingBag className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Mua ngay</span>
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!isInStock || isAddingToCart || !showPrice}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold overflow-hidden transition-shadow focus:outline-none focus:ring-0 focus-visible:outline-none ${
                  !isInStock || !showPrice
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "btn-slide-overlay relative border border-black text-black bg-white shadow-sm hover:shadow-md"
                }`}>
                {isAddingToCart ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin relative z-10 btn-slide-overlay-icon" />
                    <span className="relative z-10">Đang thêm...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 relative z-10 btn-slide-overlay-icon" />
                    <span className="relative z-10">Thêm vào giỏ hàng</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs Section and Related Products - 2 Columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16 lg:mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-8 gap-24">
            {/* Left Column - Tabs Section */}
            <div className="lg:col-span-5">
              {/* Tabs Navigation */}
              <div className="border-b border-gray-200 mb-8">
            <nav className="flex gap-8 -mb-px">
              <button
                onClick={() => setActiveTab("description")}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-base transition-colors ${
                  activeTab === "description"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                <FileText className="w-5 h-5" />
                <span>Mô tả sản phẩm</span>
              </button>
              <button
                onClick={() => setActiveTab("usage")}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-base transition-colors ${
                  activeTab === "usage"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                <Info className="w-5 h-5" />
                <span>Sử dụng và bảo quản</span>
              </button>
              <button
                onClick={() => setActiveTab("policy")}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-base transition-colors ${
                  activeTab === "policy"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                <Shield className="w-5 h-5" />
                <span>Chính sách</span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {/* Description Tab */}
            {activeTab === "description" && (
              <div className="space-y-6">
                {/* Product Description */}
                <div className="text-gray-700">
                  {descriptionLines.length > 0 ? (
                    descriptionLines
                      .filter((line) => {
                        const isNoteHeader = line.match(/^Hương (đầu|giữa|cuối)[:\s]/i);
                        if (isNoteHeader && line.length < 50) {
                          return false;
                        }
                        return true;
                      })
                      .map((line, index) => (
                        <p key={index} className="text-base leading-relaxed mb-4 text-gray-700">
                          {line}
                        </p>
                      ))
                  ) : (
                    <p className="text-base text-gray-600 italic">
                      Chưa có mô tả cho sản phẩm này.
                    </p>
                  )}
                </div>

                {/* Fragrance Notes */}
                {(notes.top || notes.middle || notes.base) && (
                  <div className="pt-6">
                    <h3 className="text-xl font-semibold text-black mb-4">
                      Thông tin hương thơm
                    </h3>
                    <ul className="space-y-3 text-gray-700 list-none">
                      {notes.top && notes.top.length > 0 && (
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">
                            <span className="font-normal text-gray-800">Hương đầu:</span> {notes.top.join(", ")}
                          </span>
                        </li>
                      )}
                      {notes.middle && notes.middle.length > 0 && (
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">
                            <span className="font-normal text-gray-800">Hương giữa:</span> {notes.middle.join(", ")}
                          </span>
                        </li>
                      )}
                      {notes.base && notes.base.length > 0 && (
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">
                            <span className="font-normal text-gray-800">Hương cuối:</span> {notes.base.join(", ")}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Usage and Storage Tab */}
            {activeTab === "usage" && (
              <div className="space-y-8">
                {/* Usage Instructions */}
                <div>
                  <h3 className="text-xl font-semibold text-black mb-4">
                    Hướng Dẫn Sử Dụng
                  </h3>
                  <ul className="space-y-3 text-gray-700 list-none">
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                      <span className="text-base leading-relaxed flex-1">
                        Ưu tiên xịt nước hoa vào các vị trí như cổ tay, khuỷu tay, sau
                        tai, gáy và cổ trước.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                      <span className="text-base leading-relaxed flex-1">
                        Sau khi xịt nước hoa, tránh việc chà xát hoặc làm khô da bằng
                        bất kỳ vật dụng nào khác. Điều này có thể làm phá vỡ các tầng
                        hương của nước hoa, dẫn đến sự thay đổi mùi hương hoặc làm nước
                        hoa bay mùi nhanh hơn.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                      <span className="text-base leading-relaxed flex-1">
                        Xịt nước hoa từ khoảng cách 15-20 cm với một lực xịt mạnh và
                        dứt khoát để đảm bảo nước hoa phủ đều, tăng cường độ bám tỏa
                        trên da.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                      <span className="text-base leading-relaxed flex-1">
                        Hiệu quả của nước hoa có thể thay đổi tùy thuộc vào thời gian,
                        không gian, cơ địa và thói quen sinh hoạt, chế độ ăn uống của
                        bạn.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                      <span className="text-base leading-relaxed flex-1">
                        Nên mang theo nước hoa bên mình hoặc sử dụng các mẫu nhỏ tiện
                        lợi để dễ dàng bổ sung khi cần.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Storage Instructions */}
                <div>
                  <h3 className="text-xl font-semibold text-black mb-4">
                    Bảo Quản Nước Hoa
                  </h3>
                  <ul className="space-y-3 text-gray-700 list-none">
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                      <span className="text-base leading-relaxed flex-1">
                        Nước hoa thường không có hạn sử dụng cụ thể, tuy nhiên, một số
                        loại có thể có hạn sử dụng từ 24 đến 36 tháng kể từ ngày mở
                        nắp và sử dụng lần đầu.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                      <span className="text-base leading-relaxed flex-1">
                        Bảo quản nước hoa ở nơi khô ráo, thoáng mát, tránh ánh nắng mặt
                        trời, nhiệt độ cao hoặc quá lạnh. Tránh để nước hoa trong cốp
                        xe hoặc các khu vực có nhiệt độ thay đổi thất thường.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Policy Tab */}
            {activeTab === "policy" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-black mb-4">
                    Chính sách bảo hành
                  </h3>
                  <p className="text-base text-gray-700 leading-relaxed mb-4">
                    LAN Perfume sẽ hỗ trợ khách hàng đổi sản phẩm trong vòng 03 ngày kể từ ngày mua tại cửa hàng hoặc 03 ngày kể từ ngày nhận hàng online (Quý khách vui lòng quay lại video khi nhận hàng).
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-black mb-4">
                    Chính sách đổi trả
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        1. ĐIỀU KIỆN ĐỔI HÀNG
                      </h4>
                      <ul className="space-y-2 text-gray-700 list-none">
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">Sản phẩm khách hàng chưa sử dụng: còn nguyên seal, tem niêm phong của LAN Perfume hoặc hóa đơn mua hàng.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">Sản phẩm bị hư hỏng do lỗi của nhà sản xuất.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">Hư hỏng phần vòi xịt, thân chai nứt, bể trong quá trình vận chuyển.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">Nước hoa bị rò rỉ, giảm dung tích so với thực tế khi vừa nhận hàng.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">Nước hoa bị biến đổi màu hoặc mùi hương khi nhận hàng.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">Giao sai hoặc nhầm lẫn với mùi hương khác so với đơn đặt hàng.</span>
                        </li>
                      </ul>
                      <p className="text-sm text-gray-600 mt-3 font-medium">
                        LƯU Ý: Chỉ nhận đổi hàng khi có video nhận hàng
                      </p>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        2. QUY TRÌNH ĐỔI HÀNG
                      </h4>
                      <ul className="space-y-2 text-gray-700 list-none">
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">Đổi với sản phẩm khách hàng chưa sử dụng: Giá trị sản phẩm mới phải tương đương hoặc cao hơn giá trị đổi của sản phẩm cũ (nếu giá cao hơn khách hàng vui lòng thanh toán thêm phần chênh lệch).</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">Đổi với các sản phẩm bị hư hỏng do lỗi của nhà sản xuất: LAN Perfume sẽ hỗ trợ khách đổi sản phẩm, hỗ trợ 100% chi phí phát sinh.</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        3. CÁC TRƯỜNG HỢP KHÔNG HỖ TRỢ ĐỔI
                      </h4>
                      <ul className="space-y-2 text-gray-700 list-none">
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">Không áp dụng đổi hàng cho các sản phẩm chiết, gốc chiết.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">Các sản phẩm không còn nguyên seal, seal có dấu hiệu bị rách, bẩn.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">Các sản phẩm không có tem niêm phong của LAN Perfume hoặc tem có dấu hiệu bị cậy, rách.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">Các sản phẩm được LAN Perfume tặng kèm khi mua hàng tại cửa hàng hoặc qua hình thức online.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-black mr-3 mt-0.5 flex-shrink-0">•</span>
                          <span className="text-base leading-relaxed flex-1">Các sản phẩm đã quá hạn đổi trả.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
              </div>
            </div>

            {/* Right Column - Related Products */}
            <div className="lg:col-span-3">
              <div className="space-y-8">
                {/* Related Products by Brand */}
                <div>
                  <h2 className="flex items-center gap-2 font-medium text-base text-black mb-4 py-4">
                    <Tag className="w-5 h-5" />
                    <span>Sản phẩm cùng thương hiệu</span>
                  </h2>
                  {relatedProducts.length > 0 ? (
                    <div className="space-y-4">
                      {relatedProducts.map((relatedProduct) => {
                        const relatedInventory: Inventory = {
                          inventoryId: relatedProduct.productId,
                          product: relatedProduct,
                          quantity: 100,
                        };
                        return (
                          <PerfumeCard
                            key={relatedProduct.productId}
                            inventory={relatedInventory}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                      <p className="text-sm">Không có sản phẩm cùng thương hiệu</p>
                    </div>
                  )}
                </div>

                {/* Products by Category */}
                <div>
                  <h2 className="flex items-center gap-2 font-medium text-base text-black mb-4 py-4">
                    <Sparkles className="w-5 h-5" />
                    <span>Sản phẩm cùng loại</span>
                  </h2>
                  {sameCategoryProducts.length > 0 ? (
                    <div className="space-y-4">
                      {sameCategoryProducts.map((categoryProduct) => {
                        const categoryInventory: Inventory = {
                          inventoryId: categoryProduct.productId,
                          product: categoryProduct,
                          quantity: 100,
                        };
                        return (
                          <PerfumeCard
                            key={categoryProduct.productId}
                            inventory={categoryInventory}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                      <p className="text-sm">Không có sản phẩm cùng loại</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

