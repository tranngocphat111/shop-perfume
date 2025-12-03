import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { productService } from "../services/perfume.service";
import { inventoryService } from "../services/inventory.service";
import { useCart } from "../contexts/CartContext";
import type { Product, Inventory } from "../types";
import { ProductBreadcrumb } from "../components/productDetail/ProductBreadcrumb";
import { ProductImages } from "../components/productDetail/ProductImages";
import { ProductInfo } from "../components/productDetail/ProductInfo";
import { ProductTabs } from "../components/productDetail/ProductTabs";
import { usePageTitle } from "../hooks/usePageTitle";
import { getPrimaryImageUrl } from "../utils/helpers";
import { RelatedProducts } from "../components/productDetail/RelatedProducts";

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [sameCategoryProducts, setSameCategoryProducts] = useState<Product[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [relatedInventories, setRelatedInventories] = useState<
    Map<number, Inventory>
  >(new Map());
  const [quantity, setQuantity] = useState(1);

  // Scroll to top when component mounts or id changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  // Set page title and meta tags
  usePageTitle({
    title: product ? `${product.name} - STPN Perfume` : "Chi tiết sản phẩm - STPN Perfume",
    description: product 
      ? `${product.name} - ${product.brand?.name || ''} ${product.category?.name || ''}. ${product.description || 'Nước hoa chính hãng chất lượng cao.'}`
      : "Chi tiết sản phẩm nước hoa chính hãng",
    image: product ? getPrimaryImageUrl(product) : "https://res.cloudinary.com/piin/image/upload/v1762171215/banner.zip-2_gdvc0y.jpg"
  });

  // Fetch main product data (critical - hiển thị ngay)
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const productId = parseInt(id, 10);
        if (isNaN(productId)) {
          setError("ID sản phẩm không hợp lệ");
          setLoading(false);
          return;
        }

        // CHỈ fetch product và inventory - hiển thị ngay, không đợi related products
        const [productResult, inventoryResult] = await Promise.allSettled([
          productService.getProductById(productId),
          inventoryService.getInventoryByProductId(productId),
        ]);

        // Xử lý product result
        if (productResult.status === "fulfilled") {
          const productData = productResult.value;
          setProduct(productData);

          // Set inventory
          if (inventoryResult.status === "fulfilled" && inventoryResult.value) {
            const inventoryData = inventoryResult.value;
            setInventory({
              inventoryId: inventoryData.inventoryId,
              product: productData,
              quantity: inventoryData.quantity,
            });
          } else {
            setInventory({
              inventoryId: productId,
              product: productData,
              quantity: 0,
            });
          }

          // HIỂN THỊ NGAY - không đợi related products
          setLoading(false);
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
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Load related products sau khi product chính đã hiển thị (không block UI)
  useEffect(() => {
    if (!product || loading) return;

    const fetchRelatedProducts = async () => {
      setLoadingRelated(true);
      const productId = product.productId;

      try {
        // Fetch best sellers để có thông tin bán chạy
        const [relatedByBrand, relatedByCategory, bestSellers] =
          await Promise.allSettled([
            // Fetch related products by brand (lấy tất cả để sort)
            product.brand && product.brand.brandId
              ? productService
                  .getProductsByBrand(product.brand.brandId)
                  .catch((err) => {
                    console.warn(
                      "Could not fetch related products by brand:",
                      err
                    );
                    return [];
                  })
              : Promise.resolve([]),

            // Fetch products by category (lấy tất cả để sort)
            productService
              .getProductsByCategory(product.category.categoryId)
              .catch((err) => {
                console.warn("Could not fetch products by category:", err);
                return [];
              }),

            // Fetch best sellers để sort theo popularity
            productService.getBestSellers(100).catch((err) => {
              console.warn("Could not fetch best sellers:", err);
              return [];
            }),
          ]);

        // Tạo map để tra cứu rank của bestsellers (index càng nhỏ = bán chạy hơn)
        const bestSellersData =
          bestSellers.status === "fulfilled" && bestSellers.value
            ? Array.isArray(bestSellers.value)
              ? bestSellers.value
              : []
            : [];

        const salesRankMap = new Map<number, number>();
        bestSellersData.forEach((product, index) => {
          salesRankMap.set(product.productId, index);
        });

        // Process brand products - sort theo bestseller
        const brandProducts =
          relatedByBrand.status === "fulfilled" && relatedByBrand.value
            ? Array.isArray(relatedByBrand.value)
              ? relatedByBrand.value
              : []
            : [];

        const relatedByBrandFiltered = brandProducts
          .filter((p) => p.productId !== productId)
          .sort((a, b) => {
            const aRank = salesRankMap.get(a.productId);
            const bRank = salesRankMap.get(b.productId);

            // Cả 2 đều là bestseller - sort theo rank
            if (aRank !== undefined && bRank !== undefined) {
              return aRank - bRank;
            }
            // Chỉ a là bestseller - a lên trước
            if (aRank !== undefined) return -1;
            // Chỉ b là bestseller - b lên trước
            if (bRank !== undefined) return 1;
            // Không ai là bestseller - giữ nguyên
            return 0;
          })
          .slice(0, 3);

        setRelatedProducts(relatedByBrandFiltered);

        // Process category products - sort theo bestseller
        const categoryProducts =
          relatedByCategory.status === "fulfilled" && relatedByCategory.value
            ? Array.isArray(relatedByCategory.value)
              ? relatedByCategory.value
              : []
            : [];

        const relatedByCategoryFiltered = categoryProducts
          .filter((p) => p.productId !== productId)
          .sort((a, b) => {
            const aRank = salesRankMap.get(a.productId);
            const bRank = salesRankMap.get(b.productId);

            if (aRank !== undefined && bRank !== undefined) {
              return aRank - bRank;
            }
            if (aRank !== undefined) return -1;
            if (bRank !== undefined) return 1;
            return 0;
          })
          .slice(0, 3);

        setSameCategoryProducts(relatedByCategoryFiltered);

        // Fetch inventories for all related products
        const allRelatedProducts = [
          ...relatedByBrandFiltered,
          ...relatedByCategoryFiltered,
        ];
        if (allRelatedProducts.length > 0) {
          try {
            const inventoryPromises = allRelatedProducts.map((p) =>
              inventoryService
                .getInventoryByProductId(p.productId)
                .then((inv) => ({ productId: p.productId, inventory: inv }))
                .catch(() => ({ productId: p.productId, inventory: null }))
            );

            const inventoryResults = await Promise.all(inventoryPromises);
            const inventoryMap = new Map<number, Inventory>();

            console.log("[ProductDetail] Inventory results:", inventoryResults);

            inventoryResults.forEach(({ productId, inventory: inv }) => {
              if (inv) {
                console.log(
                  `[ProductDetail] Setting inventory for product ${productId}: quantity=${inv.quantity}`
                );
                inventoryMap.set(productId, {
                  inventoryId: inv.inventoryId,
                  product: allRelatedProducts.find(
                    (p) => p.productId === productId
                  )!,
                  quantity: inv.quantity,
                });
              } else {
                console.warn(
                  `[ProductDetail] No inventory data for product ${productId}`
                );
              }
            });

            console.log(
              "[ProductDetail] Final inventoryMap size:",
              inventoryMap.size
            );
            setRelatedInventories(inventoryMap);
          } catch (err) {
            console.warn("Failed to fetch related inventories:", err);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch related products:", err);
        // Set empty arrays on error
        setRelatedProducts([]);
        setSameCategoryProducts([]);
      } finally {
        setLoadingRelated(false);
      }
    };

    // Delay nhỏ để ưu tiên render product chính trước
    const timeoutId = setTimeout(fetchRelatedProducts, 50);
    return () => clearTimeout(timeoutId);
  }, [product, loading]);

  const handleAddToCart = async () => {
    if (!product || isAddingToCart) return;

    try {
      setIsAddingToCart(true);
      await addToCart(product, quantity);

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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="bg-white p-8 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải sản phẩm...</p>
          <p className="text-gray-400 text-sm mt-2">
            Vui lòng đợi trong giây lát
          </p>
        </div>
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
          className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Quay lại danh sách sản phẩm
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-10">
      {/* Breadcrumb */}
      <ProductBreadcrumb product={product} />

      {/* Product Detail Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16"
        >
          {/* Left Column - Images */}
          <ProductImages product={product} />

          {/* Right Column - Product Info */}
          <ProductInfo
            product={product}
            inventory={inventory}
            quantity={quantity}
            isAddingToCart={isAddingToCart}
            onQuantityChange={handleQuantityChange}
            onAddToCart={handleAddToCart}
          />
        </motion.div>

        {/* Tabs Section and Related Products - 2 Columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="mb-16 lg:mt-0"
        >
          <div className="grid grid-cols-1 lg:grid-cols-8 gap-24">
            {/* Left Column - Tabs Section */}
            <div className="lg:col-span-5">
              <ProductTabs product={product} />
            </div>

            {/* Right Column - Related Products */}
            <RelatedProducts
              relatedProducts={relatedProducts}
              sameCategoryProducts={sameCategoryProducts}
              inventories={relatedInventories}
              isLoading={loadingRelated}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
