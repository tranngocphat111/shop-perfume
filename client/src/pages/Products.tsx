import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PerfumeCard } from "../components/PerfumeCard";
import { productService } from "../services/perfume.service";
import { inventoryService, type InventoryItem } from "../services/inventory.service";
import type { Brand, Category, Product, PageResponse, Inventory } from "../types";

export const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [pageInfo, setPageInfo] = useState<PageResponse<Product> | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [inventoryMap, setInventoryMap] = useState<Map<number, InventoryItem>>(new Map());

  // Filter states
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("productId-DESC");

  // Selected brand/category info for display
  const [selectedBrandInfo, setSelectedBrandInfo] = useState<Brand | null>(
    null
  );
  const [selectedCategoryInfo, setSelectedCategoryInfo] =
    useState<Category | null>(null);

  // Read URL params on mount - reset other filters when selecting from URL
  useEffect(() => {
    const brandIdParam = searchParams.get("brandId");
    const categoryIdParam = searchParams.get("categoryId");
    const searchParam = searchParams.get("q");

    if (brandIdParam) {
      setSelectedBrand(Number(brandIdParam));
      // Reset other filters when selecting brand from URL
      setSelectedCategory(null);
      setSearchQuery("");
    } else if (categoryIdParam) {
      setSelectedCategory(Number(categoryIdParam));
      // Reset other filters when selecting category from URL
      setSelectedBrand(null);
      setSearchQuery("");
    } else if (searchParam) {
      setSearchQuery(searchParam);
      // Reset other filters when searching from URL
      setSelectedBrand(null);
      setSelectedCategory(null);
    } else {
      // Reset all if no params
      setSelectedBrand(null);
      setSelectedCategory(null);
      setSearchQuery("");
    }
  }, [searchParams]);

  // Load brands and categories
  useEffect(() => {
    const loadBrandsAndCategories = async () => {
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          productService.getAllBrands(),
          productService.getAllCategories(),
        ]);
        setBrands(brandsRes);
        setCategories(categoriesRes);
      } catch (err) {
        console.error("Failed to load brands/categories:", err);
      }
    };
    loadBrandsAndCategories();
  }, []);

  // Load inventories and create a map
  useEffect(() => {
    const loadInventories = async () => {
      try {
        // Fetch all inventories (with a reasonable page size)
        const pageResponse = await inventoryService.getInventoryPage(0, 1000);
        const map = new Map<number, InventoryItem>();
        pageResponse.content.forEach((item) => {
          map.set(item.product.productId, item);
        });
        setInventoryMap(map);
      } catch (err) {
        console.error("Failed to load inventories:", err);
        // Continue with empty map if inventory fetch fails
      }
    };
    loadInventories();
  }, []);

  // Update selected brand/category info when selection or data changes
  useEffect(() => {
    if (selectedBrand && brands.length > 0) {
      const brandInfo = brands.find((b) => b.brandId === selectedBrand);
      setSelectedBrandInfo(brandInfo || null);
    } else {
      setSelectedBrandInfo(null);
    }
  }, [selectedBrand, brands]);

  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const categoryInfo = categories.find(
        (c) => c.categoryId === selectedCategory
      );
      console.log(
        "Selected Category:",
        selectedCategory,
        "Found:",
        categoryInfo
      );
      setSelectedCategoryInfo(categoryInfo || null);
    } else {
      setSelectedCategoryInfo(null);
    }
  }, [selectedCategory, categories]);

  // Fetch products based on current page and filters
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [sortField, sortDirection] = sortBy.split("-");

      const response = await productService.getProductPage(
        currentPage,
        12, // 12 items per page
        sortField,
        sortDirection,
        searchQuery || undefined,
        selectedBrand || undefined,
        selectedCategory || undefined
      );

      setProducts(response.content);
      setPageInfo(response);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Không thể tải sản phẩm. Vui lòng thử lại sau.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedBrand, selectedCategory, searchQuery, sortBy]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedBrand, selectedCategory, searchQuery, sortBy]);

  // Pagination handler
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600 px-4">
        <p className="text-xl font-semibold mb-2">Lỗi: {error}</p>
        <p className="text-gray-600">Vui lòng kiểm tra kết nối backend</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto flex mt-9">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-200 p-6 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto hidden md:block">
          {/* Categories */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4 text-black">
              Bộ sưu tập nước hoa
            </h3>
            <div className="space-y-3">
              <FilterOption
                label="Tất cả"
                checked={selectedCategory === null}
                onChange={() => setSelectedCategory(null)}
              />
              {categories.map((cat) => (
                <FilterOption
                  key={cat.categoryId}
                  label={cat.name}
                  checked={selectedCategory === cat.categoryId}
                  onChange={() => setSelectedCategory(cat.categoryId)}
                />
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4 text-black">
              Thương hiệu
            </h3>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Tìm kiếm thương hiệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="space-y-3 h-[250px] overflow-x-hidden overflow-y-auto">
              <FilterOption
                label="Tất cả"
                checked={selectedBrand === null}
                onChange={() => setSelectedBrand(null)}
              />
              {brands
                .filter((brand) =>
                  brand.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((brand) => (
                  <FilterOption
                    key={brand.brandId}
                    label={brand.name}
                    checked={selectedBrand === brand.brandId}
                    onChange={() => setSelectedBrand(brand.brandId)}
                  />
                ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Brand/Category Info Banner */}
          {(selectedBrandInfo || selectedCategoryInfo) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-gradient-to-r from-gray-50 to-white rounded-lg p-6 border border-gray-200 shadow-sm">
              {selectedBrandInfo && !selectedCategoryInfo && (
                <>
                  <h2 className="text-2xl font-bold text-black mb-2">
                    {selectedBrandInfo.name}
                  </h2>
                  {selectedBrandInfo.description && (
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {selectedBrandInfo.description}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setSelectedBrand(null);
                      window.history.pushState({}, "", "/products");
                    }}
                    className="mt-4 text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-1">
                    <i className="bi bi-x-circle"></i>
                    Xóa bộ lọc
                  </button>
                </>
              )}
              {selectedCategoryInfo && !selectedBrandInfo && (
                <>
                  <h2 className="text-2xl font-bold text-black mb-2">
                    {selectedCategoryInfo.name}
                  </h2>
                  {selectedCategoryInfo.description && (
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {selectedCategoryInfo.description}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      window.history.pushState({}, "", "/products");
                    }}
                    className="mt-4 text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-1">
                    <i className="bi bi-x-circle"></i>
                    Xóa bộ lọc
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              <strong className="text-black">
                {pageInfo ? pageInfo.totalElements : 0}
              </strong>{" "}
              kết quả tìm kiếm
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}>
              <option value="productId-DESC">Mới nhất</option>
              <option value="productId-ASC">Cũ nhất</option>
              <option value="name-ASC">Tên A-Z</option>
              <option value="name-DESC">Tên Z-A</option>
              <option value="unitPrice-ASC">Giá: Thấp đến cao</option>
              <option value="unitPrice-DESC">Giá: Cao đến thấp</option>
            </select>
          </motion.div>

          {/* Products Grid */}
          <AnimatePresence mode="wait">
            {products.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16">
                <i className="bi bi-inbox text-6xl text-gray-300 mb-4 block"></i>
                <h4 className="text-xl text-gray-600 mb-2">
                  Không tìm thấy sản phẩm
                </h4>
                <p className="text-gray-500">
                  Vui lòng thử lại với bộ lọc khác
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => {
                  // Get inventory data from map
                  const inventoryItem = inventoryMap.get(product.productId);
                  const inventory: Inventory = {
                    inventoryId: inventoryItem?.inventoryId || product.productId,
                    product: product,
                    quantity: inventoryItem?.quantity || 0,
                  };

                  return (
                    <motion.div
                      key={product.productId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}>
                      <PerfumeCard inventory={inventory} />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {pageInfo && pageInfo.totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={pageInfo.first || loading}
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <i className="bi bi-chevron-left mr-1"></i>
                Trước
              </button>

              {/* Page Numbers */}
              <div className="flex gap-2">
                {Array.from({ length: pageInfo.totalPages }, (_, i) => i).map(
                  (page) => {
                    const showPage =
                      page === 0 ||
                      page === pageInfo.totalPages - 1 ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    const showEllipsis =
                      (page === 1 && currentPage > 3) ||
                      (page === pageInfo.totalPages - 2 &&
                        currentPage < pageInfo.totalPages - 4);

                    if (showEllipsis) {
                      return (
                        <span
                          key={page}
                          className="px-3 py-2 text-gray-500 text-sm">
                          ...
                        </span>
                      );
                    }

                    if (!showPage) return null;

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={loading}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          page === currentPage
                            ? "bg-black text-white"
                            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        } disabled:opacity-50`}>
                        {page + 1}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={pageInfo.last || loading}
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Sau
                <i className="bi bi-chevron-right ml-1"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && products.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      )}
    </div>
  );
};

interface FilterOptionProps {
  label?: string;
  checked?: boolean;
  onChange?: () => void;
}

const FilterOption = ({ label, checked, onChange }: FilterOptionProps) => (
  <label className="flex items-center cursor-pointer text-sm group">
    <input
      type="radio"
      checked={checked}
      onChange={onChange}
      className="mr-2 cursor-pointer accent-black"
    />
    <span className="group-hover:text-black transition-colors">{label}</span>
  </label>
);
