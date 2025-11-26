import { useState, useEffect, useCallback, useMemo } from "react";
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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [inventoryMap, setInventoryMap] = useState<Map<number, InventoryItem>>(new Map());

  // Temporary filter states (not applied yet)
  const [tempSelectedCategories, setTempSelectedCategories] = useState<Set<number>>(new Set());
  const [tempSelectedBrands, setTempSelectedBrands] = useState<Set<number>>(new Set());
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 0]);

  // Applied filter states (actually filtering)
  const [appliedCategories, setAppliedCategories] = useState<Set<number>>(new Set());
  const [appliedBrands, setAppliedBrands] = useState<Set<number>>(new Set());
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("productId-DESC");
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const [selectedAlphabet, setSelectedAlphabet] = useState<string | null>(null);
  const [filterTrigger, setFilterTrigger] = useState(0);

  // Round to nearest 10000
  const roundToTenThousand = (value: number): number => {
    return Math.round(value / 10000) * 10000;
  };

  // Price range from all products
  const priceRange = useMemo(() => {
    if (allProducts.length === 0) return { min: 0, max: 10000000 };
    const prices = allProducts.map((p) => p.unitPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return {
      min: roundToTenThousand(minPrice),
      max: roundToTenThousand(maxPrice),
    };
  }, [allProducts]);

  // Initialize temp price range with actual min/max (rounded to 10000)
  useEffect(() => {
    if (priceRange.min !== 0 || priceRange.max !== 10000000) {
      setTempPriceRange([priceRange.min, priceRange.max]);
    }
  }, [priceRange]);

  // Alphabet letters for brand navigation
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Read URL params on mount
  useEffect(() => {
    const brandIdParam = searchParams.get("brandId");
    const categoryIdParam = searchParams.get("categoryId");
    const searchParam = searchParams.get("q");

    if (brandIdParam) {
      const brandId = Number(brandIdParam);
      setTempSelectedBrands(new Set([brandId]));
      setAppliedBrands(new Set([brandId]));
      setTempSelectedCategories(new Set());
      setAppliedCategories(new Set());
      setSearchQuery("");
    } else if (categoryIdParam) {
      const categoryId = Number(categoryIdParam);
      setTempSelectedCategories(new Set([categoryId]));
      setAppliedCategories(new Set([categoryId]));
      setTempSelectedBrands(new Set());
      setAppliedBrands(new Set());
      setSearchQuery("");
    } else if (searchParam) {
      setSearchQuery(searchParam);
      setTempSelectedBrands(new Set());
      setAppliedBrands(new Set());
      setTempSelectedCategories(new Set());
      setAppliedCategories(new Set());
    } else {
      setTempSelectedBrands(new Set());
      setAppliedBrands(new Set());
      setTempSelectedCategories(new Set());
      setAppliedCategories(new Set());
      setSearchQuery("");
    }
  }, [searchParams]);

  // Load all products to calculate price range
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        const allProds = await productService.getAllProducts();
        setAllProducts(allProds);
      } catch (err) {
        console.error("Failed to load all products:", err);
      }
    };
    loadAllProducts();
  }, []);

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
        const pageResponse = await inventoryService.getInventoryPage(0, 1000);
        const map = new Map<number, InventoryItem>();
        pageResponse.content.forEach((item) => {
          map.set(item.product.productId, item);
        });
        setInventoryMap(map);
      } catch (err) {
        console.error("Failed to load inventories:", err);
      }
    };
    loadInventories();
  }, []);

  // Filter brands by alphabet and search
  const filteredBrands = useMemo(() => {
    let filtered = brands;

    // Filter by alphabet
    if (selectedAlphabet) {
      filtered = filtered.filter((brand) =>
        brand.name.toUpperCase().startsWith(selectedAlphabet)
      );
    }

    // Filter by search query
    if (brandSearchQuery) {
      filtered = filtered.filter((brand) =>
        brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [brands, selectedAlphabet, brandSearchQuery]);

  // Handle category toggle
  const handleCategoryToggle = (categoryId: number) => {
    setTempSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Handle brand toggle
  const handleBrandToggle = (brandId: number) => {
    setTempSelectedBrands((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(brandId)) {
        newSet.delete(brandId);
      } else {
        newSet.add(brandId);
      }
      return newSet;
    });
  };

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    const newAppliedCategories = new Set(tempSelectedCategories);
    const newAppliedBrands = new Set(tempSelectedBrands);
    // Check if price range is different from full range
    const priceDiff = Math.abs(tempPriceRange[0] - priceRange.min) > 1 || 
                      Math.abs(tempPriceRange[1] - priceRange.max) > 1;
    const newAppliedPriceRange = priceDiff ? [tempPriceRange[0], tempPriceRange[1]] as [number, number] : null;
    
    setAppliedCategories(newAppliedCategories);
    setAppliedBrands(newAppliedBrands);
    setAppliedPriceRange(newAppliedPriceRange);
    setCurrentPage(0);
    setFilterTrigger(prev => prev + 1); // Trigger refetch
  }, [tempSelectedCategories, tempSelectedBrands, tempPriceRange, priceRange]);

  // Fetch products based on current page and applied filters
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [sortField, sortDirection] = sortBy.split("-");

      const brandIdsArray = appliedBrands.size > 0 ? Array.from(appliedBrands) : null;
      const categoryIdsArray = appliedCategories.size > 0 ? Array.from(appliedCategories) : null;
      const minPrice = appliedPriceRange ? appliedPriceRange[0] : null;
      const maxPrice = appliedPriceRange ? appliedPriceRange[1] : null;

      const response = await productService.getProductPage(
        currentPage,
        12,
        sortField,
        sortDirection,
        searchQuery || undefined,
        null,
        null,
        brandIdsArray,
        categoryIdsArray,
        minPrice || undefined,
        maxPrice || undefined
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
  }, [currentPage, searchQuery, sortBy, filterTrigger, 
      Array.from(appliedBrands).join(','), 
      Array.from(appliedCategories).join(','), 
      appliedPriceRange?.join(',')]);

  // Fetch products when applied filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [appliedBrands, appliedCategories, appliedPriceRange, searchQuery, sortBy]);

  // Pagination handler
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setTempSelectedCategories(new Set());
    setTempSelectedBrands(new Set());
    setTempPriceRange([priceRange.min, priceRange.max]);
    setAppliedCategories(new Set());
    setAppliedBrands(new Set());
    setAppliedPriceRange(null);
    setSearchQuery("");
    setBrandSearchQuery("");
    setSelectedAlphabet(null);
    setSortBy("productId-DESC");
    setCurrentPage(0);
  };

  // Price slider handlers
  const handlePriceRangeChange = (index: 0 | 1, value: number) => {
    setTempPriceRange((prev) => {
      const newRange: [number, number] = [...prev];
      // Round to nearest 10000
      const roundedValue = roundToTenThousand(value);
      newRange[index] = roundedValue;
      // Ensure min <= max
      if (index === 0 && newRange[0] > newRange[1]) {
        newRange[1] = newRange[0];
      } else if (index === 1 && newRange[1] < newRange[0]) {
        newRange[0] = newRange[1];
      }
      return newRange;
    });
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
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
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-20 space-y-6">
              {/* Categories Section */}
              <div>
                <h3 className="text-base font-semibold mb-4 text-black">
                  Bộ sưu tập nước hoa
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {categories.map((cat) => (
                    <CheckboxOption
                      key={cat.categoryId}
                      label={cat.name}
                      checked={tempSelectedCategories.has(cat.categoryId)}
                      onChange={() => handleCategoryToggle(cat.categoryId)}
                    />
                  ))}
                </div>
              </div>

              {/* Price Filter with Slider */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-black">Giá</h3>
                </div>
                <div className="space-y-4">
                  {/* Price Range Display */}
                  <div className="text-sm text-gray-700 font-medium">
                    Giá: {formatPrice(tempPriceRange[0])} đ - {formatPrice(tempPriceRange[1])} đ
                  </div>

                  {/* Dual Range Slider */}
                  <div className="relative h-6 py-2" id="price-slider-container">
                    {/* Background track - light gray */}
                    <div className="absolute w-full h-1 bg-gray-200 rounded-full top-1/2 -translate-y-1/2"></div>
                    
                    {/* Active range track - darker gray */}
                    <div
                      className="absolute h-1 bg-gray-400 rounded-full top-1/2 -translate-y-1/2"
                      style={{
                        left: `${((tempPriceRange[0] - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
                        width: `${((tempPriceRange[1] - tempPriceRange[0]) / (priceRange.max - priceRange.min)) * 100}%`,
                      }}
                    />
                    
                    {/* Min slider input */}
                    <input
                      type="range"
                      min={roundToTenThousand(priceRange.min)}
                      max={roundToTenThousand(priceRange.max)}
                      step={10000}
                      value={tempPriceRange[0]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val <= tempPriceRange[1]) {
                          handlePriceRangeChange(0, val);
                        }
                      }}
                      className="absolute w-full h-6 top-0 bg-transparent appearance-none cursor-pointer z-10"
                      style={{
                        WebkitAppearance: "none",
                        appearance: "none",
                        background: "transparent",
                      }}
                    />
                    
                    {/* Max slider input */}
                    <input
                      type="range"
                      min={roundToTenThousand(priceRange.min)}
                      max={roundToTenThousand(priceRange.max)}
                      step={10000}
                      value={tempPriceRange[1]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val >= tempPriceRange[0]) {
                          handlePriceRangeChange(1, val);
                        }
                      }}
                      className="absolute w-full h-6 top-0 bg-transparent appearance-none cursor-pointer z-20"
                      style={{
                        WebkitAppearance: "none",
                        appearance: "none",
                        background: "transparent",
                      }}
                    />
                  </div>

                  {/* Custom CSS for range inputs - minimalist design */}
                  <style>{`
                    #price-slider-container input[type="range"]::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: #ffffff;
                      cursor: pointer;
                      border: 1px solid #4b5563;
                      position: relative;
                      z-index: 30;
                      margin-top: -10px;
                    }
                    
                    #price-slider-container input[type="range"]::-moz-range-thumb {
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: #ffffff;
                      cursor: pointer;
                      border: 1px solid #4b5563;
                      position: relative;
                      z-index: 30;
                      box-sizing: border-box;
                    }
                    
                    #price-slider-container input[type="range"]::-webkit-slider-runnable-track {
                      background: transparent;
                      height: 1px;
                      margin-top: 10px;
                    }
                    
                    #price-slider-container input[type="range"]::-moz-range-track {
                      background: transparent;
                      height: 1px;
                    }
                    
                    #price-slider-container input[type="range"]:focus {
                      outline: none;
                    }
                    
                    #price-slider-container input[type="range"]:focus::-webkit-slider-thumb {
                      border-color: #374151;
                    }
                    
                    #price-slider-container input[type="range"]:focus::-moz-range-thumb {
                      border-color: #374151;
                    }
                    
                    #price-slider-container input[type="range"]:hover::-webkit-slider-thumb {
                      border-color: #374151;
                    }
                    
                    #price-slider-container input[type="range"]:hover::-moz-range-thumb {
                      border-color: #374151;
                    }
                  `}</style>

                  <button
                    onClick={() => {
                      setTempPriceRange([priceRange.min, priceRange.max]);
                    }}
                    className="text-sm text-gray-500 hover:text-black transition-colors">
                    Xóa bộ lọc giá
                  </button>
                </div>
              </div>

              {/* Brands Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-black">Thương hiệu</h3>
                  {(selectedAlphabet || brandSearchQuery) && (
                    <button
                      onClick={() => {
                        setSelectedAlphabet(null);
                        setBrandSearchQuery("");
                      }}
                      className="text-xs text-gray-500 hover:text-black">
                      Xóa
                    </button>
                  )}
                </div>

                {/* Alphabet Navigation */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {alphabet.map((letter) => {
                    const hasBrands = brands.some((b) =>
                      b.name.toUpperCase().startsWith(letter)
                    );
                    return (
                      <button
                        key={letter}
                        onClick={() =>
                          setSelectedAlphabet(
                            selectedAlphabet === letter ? null : letter
                          )
                        }
                        disabled={!hasBrands}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          selectedAlphabet === letter
                            ? "bg-black text-white"
                            : hasBrands
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-gray-50 text-gray-400 cursor-not-allowed"
                        }`}>
                        {letter}
                      </button>
                    );
                  })}
                </div>

                {/* Brand Search */}
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Tìm kiếm thương hiệu..."
                  value={brandSearchQuery}
                  onChange={(e) => setBrandSearchQuery(e.target.value)}
                />

                {/* Brand List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredBrands.map((brand) => (
                    <CheckboxOption
                      key={brand.brandId}
                      label={brand.name}
                      checked={tempSelectedBrands.has(brand.brandId)}
                      onChange={() => handleBrandToggle(brand.brandId)}
                    />
                  ))}
                  {filteredBrands.length === 0 && brandSearchQuery && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      Không tìm thấy thương hiệu
                    </p>
                  )}
                </div>
              </div>

              {/* Apply Filters Button */}
              <button
                onClick={handleApplyFilters}
                className="w-full px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-md text-sm font-medium transition-colors">
                Lọc
              </button>

              {/* Reset Filters Button */}
              {(appliedBrands.size > 0 ||
                appliedCategories.size > 0 ||
                appliedPriceRange ||
                searchQuery) && (
                <button
                  onClick={handleResetFilters}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-md text-sm font-medium transition-colors">
                  Đặt lại
                </button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header with Results Count and Sort */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200">
              <div className="text-sm text-gray-600">
                <strong className="text-black">
                  {pageInfo ? pageInfo.totalElements : 0}
                </strong>{" "}
                kết quả tìm kiếm
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Sắp xếp:</span>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black cursor-pointer bg-white"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}>
                  <option value="productId-DESC">Mặc định</option>
                  <option value="productId-DESC">Mới nhất</option>
                  <option value="unitPrice-ASC">Từ thấp đến cao</option>
                  <option value="unitPrice-DESC">Từ cao đến thấp</option>
                  <option value="name-ASC">Tên A-Z</option>
                  <option value="name-DESC">Tên Z-A</option>
                </select>
              </div>
            </div>

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
              <div className="mt-8 flex justify-center items-center gap-2 flex-wrap">
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

interface CheckboxOptionProps {
  label?: string;
  checked?: boolean;
  onChange?: () => void;
}

const CheckboxOption = ({ label, checked, onChange }: CheckboxOptionProps) => (
  <label className="flex items-center cursor-pointer text-sm group">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="mr-2 cursor-pointer accent-black w-4 h-4"
    />
    <span className="group-hover:text-black transition-colors text-gray-700">
      {label}
    </span>
  </label>
);
