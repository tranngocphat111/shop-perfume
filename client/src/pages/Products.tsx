import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PerfumeCard } from "../components/PerfumeCard";
import { productService } from "../services/perfume.service";
import { inventoryService, type InventoryItem } from "../services/inventory.service";
import type { Brand, Category, Product, PageResponse, Inventory } from "../types";
import { formatCurrency } from "../utils/helpers";
import { Link } from "react-router-dom";

export const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // For client-side price filtering
  const [pageInfo, setPageInfo] = useState<PageResponse<Product> | null>(null);
  const [priceBoundsCache, setPriceBoundsCache] = useState<[number, number] | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [inventoryMap, setInventoryMap] = useState<Map<number, InventoryItem>>(new Map());

  // Applied filter states (used for API calls)
  const [appliedBrands, setAppliedBrands] = useState<number[]>([]);
  const [appliedCategories, setAppliedCategories] = useState<number[]>([]);
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number] | null>(null);
  const [sortBy, setSortBy] = useState("default");
  
  // Temporary filter states (UI only, not applied until button click)
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  
  // Section collapse states
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [isBrandsOpen, setIsBrandsOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  
  // Legacy support for URL params (single selection)
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Use cached price bounds - don't recalculate from allProducts to avoid changing bounds when filtering
  // This ensures the slider bounds remain stable
  const priceBounds = priceBoundsCache;

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
      const brandId = Number(brandIdParam);
      setSelectedBrand(brandId);
      setSelectedBrands([brandId]);
      setAppliedBrands([brandId]); // Auto-apply from URL
      setSelectedCategory(null);
      setSelectedCategories([]);
      setAppliedCategories([]);
      setSearchQuery("");
      setAppliedSearchQuery("");
    } else if (categoryIdParam) {
      const categoryId = Number(categoryIdParam);
      setSelectedCategory(categoryId);
      setSelectedCategories([categoryId]);
      setAppliedCategories([categoryId]); // Auto-apply from URL
      setSelectedBrand(null);
      setSelectedBrands([]);
      setAppliedBrands([]);
      setSearchQuery("");
      setAppliedSearchQuery("");
    } else if (searchParam) {
      setSearchQuery(searchParam);
      setAppliedSearchQuery(searchParam); // Auto-apply from URL
      setSelectedBrand(null);
      setSelectedBrands([]);
      setAppliedBrands([]);
      setSelectedCategory(null);
      setSelectedCategories([]);
      setAppliedCategories([]);
    } else {
      setSelectedBrand(null);
      setSelectedBrands([]);
      setAppliedBrands([]);
      setSelectedCategory(null);
      setSelectedCategories([]);
      setAppliedCategories([]);
      setSearchQuery("");
      setAppliedSearchQuery("");
    }
  }, [searchParams]);

  // Fetch price bounds once on mount (small sample to get min/max)
  const fetchPriceBounds = useCallback(async () => {
    try {
      // Fetch a small sample to get price range
      const sampleResponse = await productService.getProductPage(
        0,
        50, // Small sample to get price bounds quickly
        "unitPrice",
        "ASC",
        undefined,
        undefined,
        undefined
      );
      
      if (sampleResponse.content.length > 0) {
        const prices = sampleResponse.content
          .filter(p => p.unitPrice > 0)
          .map(p => p.unitPrice);
        if (prices.length > 0) {
          const minPrice = Math.floor(Math.min(...prices));
          // Get max price from a larger sample or use a reasonable default
          const maxSample = await productService.getProductPage(
            0,
            50,
            "unitPrice",
            "DESC",
            undefined,
            undefined,
            undefined
          );
          const maxPrices = maxSample.content
            .filter(p => p.unitPrice > 0)
            .map(p => p.unitPrice);
          if (maxPrices.length > 0) {
            const maxPrice = Math.ceil(Math.max(...maxPrices));
            setPriceBoundsCache([minPrice, maxPrice]);
            // Only set price range if not already set
            if (priceRange === null) {
              setPriceRange([minPrice, maxPrice]);
              setAppliedPriceRange([minPrice, maxPrice]);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch price bounds:", err);
      // Don't set any default values
    }
  }, [priceRange]);

  // Load brands, categories, and price bounds on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load in parallel for speed
        const [brandsRes, categoriesRes] = await Promise.all([
          productService.getAllBrands(),
          productService.getAllCategories(),
        ]);
        setBrands(brandsRes);
        setCategories(categoriesRes);
        
        // Fetch price bounds (wait for it to complete)
        await fetchPriceBounds();
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
      }
    };
    loadInitialData();
  }, [fetchPriceBounds]);

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


  // Fetch products from backend - optimized for speed
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine sort field and direction
      let sortField = "productId";
      let sortDirection = "DESC";
      
      if (sortBy === "newest" || sortBy === "default") {
        sortField = "productId";
        sortDirection = "DESC";
      } else if (sortBy === "price-asc") {
        sortField = "unitPrice";
        sortDirection = "ASC";
      } else if (sortBy === "price-desc") {
        sortField = "unitPrice";
        sortDirection = "DESC";
      }

      // Check if we need to fetch more for price filtering or multiple brand/category selection
      const needsPriceFilter = appliedPriceRange !== null && 
                              priceBoundsCache !== null &&
                              (appliedPriceRange[0] !== priceBoundsCache[0] || 
                               appliedPriceRange[1] !== priceBoundsCache[1]);
      const hasMultipleFilters = appliedBrands.length > 1 || appliedCategories.length > 1;
      const needsClientSideFilter = needsPriceFilter || hasMultipleFilters;
      
      // If price filter or multiple selections are active, fetch more items for client-side filtering
      // Otherwise, use server-side pagination for speed
      const pageSize = needsClientSideFilter ? 200 : 12;
      
      // For single selection, use backend filter; for multiple, fetch all and filter client-side
      const backendBrandId = appliedBrands.length === 1 ? appliedBrands[0] : 
                            (appliedBrands.length > 0 ? undefined : undefined);
      const backendCategoryId = appliedCategories.length === 1 ? appliedCategories[0] : 
                               (appliedCategories.length > 0 ? undefined : undefined);
      
      const response = await productService.getProductPage(
        needsClientSideFilter ? 0 : currentPage,
        pageSize,
        sortField,
        sortDirection,
        appliedSearchQuery || undefined,
        backendBrandId,
        backendCategoryId
      );

      // Store products
      setAllProducts(response.content);
      
      if (!needsPriceFilter) {
        // Use server-side pagination - much faster!
        setPageInfo(response);
        setProducts(response.content);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Không thể tải sản phẩm. Vui lòng thử lại sau.");
      setAllProducts([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [appliedBrands, appliedCategories, appliedSearchQuery, sortBy, appliedPriceRange, priceBoundsCache, currentPage]);

  // Filter products client-side (when price filter or multiple selections are active)
  const filteredAndSortedProducts = useMemo(() => {
    const needsPriceFilter = appliedPriceRange !== null && 
                            priceBoundsCache !== null &&
                            (appliedPriceRange[0] !== priceBoundsCache[0] || 
                             appliedPriceRange[1] !== priceBoundsCache[1]);
    const hasMultipleFilters = appliedBrands.length > 1 || appliedCategories.length > 1;
    const needsClientSideFilter = needsPriceFilter || hasMultipleFilters;
    
    // If no client-side filtering needed, return products as-is (server-side pagination)
    if (!needsClientSideFilter) {
      return allProducts;
    }

    // Start with all products
    let filtered = [...allProducts];

    // Apply multiple brand filter
    if (appliedBrands.length > 1) {
      filtered = filtered.filter(p => appliedBrands.includes(p.brand.brandId));
    }

    // Apply multiple category filter
    if (appliedCategories.length > 1) {
      filtered = filtered.filter(p => appliedCategories.includes(p.category.categoryId));
    }

    // Apply price filter
    if (needsPriceFilter && appliedPriceRange) {
      filtered = filtered.filter(
        (p) => p.unitPrice >= appliedPriceRange[0] && p.unitPrice <= appliedPriceRange[1]
      );
    }

    // Additional client-side sorting for options not supported by backend
    if (sortBy === "saleoff") {
      filtered.sort((a, b) => a.unitPrice - b.unitPrice);
    } else if (sortBy === "popularity") {
      filtered.sort((a, b) => b.productId - a.productId);
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.productId - a.productId);
    }

    return filtered;
  }, [allProducts, appliedPriceRange, sortBy, priceBoundsCache, appliedBrands, appliedCategories]);

  // Paginate filtered products
  const paginatedProducts = useMemo(() => {
    const itemsPerPage = 12;
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / 12);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update products when filtered/sorted list changes
  useEffect(() => {
    const needsPriceFilter = appliedPriceRange !== null && 
                            priceBoundsCache !== null &&
                            (appliedPriceRange[0] !== priceBoundsCache[0] || 
                             appliedPriceRange[1] !== priceBoundsCache[1]);
    const hasMultipleFilters = appliedBrands.length > 1 || appliedCategories.length > 1;
    const needsClientSideFilter = needsPriceFilter || hasMultipleFilters;
    
    // Update products and page info
    if (needsClientSideFilter) {
      setProducts(paginatedProducts);
      setPageInfo({
        content: paginatedProducts,
        totalPages: totalPages,
        totalElements: filteredAndSortedProducts.length,
        size: 12,
        number: currentPage,
        numberOfElements: paginatedProducts.length,
        first: currentPage === 0,
        last: currentPage >= totalPages - 1,
        empty: paginatedProducts.length === 0,
      });
    }
  }, [paginatedProducts, totalPages, currentPage, filteredAndSortedProducts.length, appliedPriceRange, priceBoundsCache, appliedBrands.length, appliedCategories.length]);

  // Reset to first page when applied filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [appliedBrands, appliedCategories, appliedSearchQuery, sortBy, appliedPriceRange]);
  
  // Apply filters when sortBy changes (sort is fast, apply immediately)
  useEffect(() => {
    if (allProducts.length > 0) {
      // Sort doesn't need API call, just re-sort existing data
      // This is handled in filteredAndSortedProducts
    }
  }, [sortBy]);

  // Toggle brand selection
  const toggleBrand = (brandId: number) => {
    setSelectedBrands(prev => {
      if (prev.includes(brandId)) {
        return prev.filter(id => id !== brandId);
      } else {
        return [...prev, brandId];
      }
    });
    setSelectedBrand(null); // Clear single selection
  };

  // Toggle category selection
  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
    setSelectedCategory(null); // Clear single selection
  };

  // Apply filters (called when user clicks "Lọc" button)
  const handleApplyFilters = () => {
    setAppliedBrands([...selectedBrands]);
    setAppliedCategories([...selectedCategories]);
    setAppliedSearchQuery(searchQuery);
    if (priceRange !== null) {
      setAppliedPriceRange([...priceRange]);
    }
    setCurrentPage(0);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedBrand(null);
    setSelectedBrands([]);
    setAppliedBrands([]);
    setSelectedCategory(null);
    setSelectedCategories([]);
    setAppliedCategories([]);
    setSearchQuery("");
    setAppliedSearchQuery("");
    setBrandSearchQuery("");
    // Reset price range to current bounds (only if bounds are available)
    if (priceBounds !== null) {
      setPriceRange([priceBounds[0], priceBounds[1]]);
      setAppliedPriceRange([priceBounds[0], priceBounds[1]]);
    } else {
      setPriceRange(null);
      setAppliedPriceRange(null);
    }
    setSortBy("default");
    setCurrentPage(0);
    window.history.pushState({}, "", "/products");
  };

  // Check if any filters are active (applied or pending)
  const hasActiveFilters = appliedBrands.length > 0 ||
    appliedCategories.length > 0 ||
    appliedSearchQuery !== "" ||
    (appliedPriceRange !== null && priceBounds !== null && 
     (appliedPriceRange[0] !== priceBounds[0] || appliedPriceRange[1] !== priceBounds[1])) ||
    sortBy !== "default";
  
  // Check if there are pending filter changes
  const hasPendingFilters = 
    JSON.stringify(selectedBrands.sort()) !== JSON.stringify(appliedBrands.sort()) ||
    JSON.stringify(selectedCategories.sort()) !== JSON.stringify(appliedCategories.sort()) ||
    searchQuery !== appliedSearchQuery ||
    (priceRange !== null && appliedPriceRange !== null && 
     (priceRange[0] !== appliedPriceRange[0] || priceRange[1] !== appliedPriceRange[1])) ||
    (priceRange !== null && appliedPriceRange === null);

  // Initialize price range when products are loaded
  useEffect(() => {
    if (priceBounds !== null && priceRange === null) {
      setPriceRange([priceBounds[0], priceBounds[1]]);
      setAppliedPriceRange([priceBounds[0], priceBounds[1]]);
    }
  }, [priceBounds, priceRange]);

  // Clamp priceRange to priceBounds only when bounds are first set
  // Không clamp lại khi priceRange thay đổi từ user interaction
  useEffect(() => {
    if (priceBounds !== null && priceRange !== null) {
      // Chỉ clamp nếu giá trị thực sự nằm ngoài bounds
      let needsUpdate = false;
      let newMin = priceRange[0];
      let newMax = priceRange[1];
      
      // Clamp min nếu cần (chỉ khi nằm ngoài bounds)
      if (newMin < priceBounds[0] || newMin > priceBounds[1]) {
        newMin = Math.max(priceBounds[0], Math.min(priceBounds[1], newMin));
        needsUpdate = true;
      }
      
      // Clamp max nếu cần (chỉ khi nằm ngoài bounds)
      if (newMax < priceBounds[0] || newMax > priceBounds[1]) {
        newMax = Math.max(priceBounds[0], Math.min(priceBounds[1], newMax));
        needsUpdate = true;
      }
      
      // Đảm bảo min <= max (chỉ khi cần)
      if (newMin > newMax) {
        // Nếu min > max sau khi clamp, đặt lại về bounds
        newMin = priceBounds[0];
        newMax = priceBounds[1];
        needsUpdate = true;
      }
      
      // Chỉ update nếu cần (giá trị thực sự nằm ngoài bounds)
      if (needsUpdate) {
        setPriceRange([newMin, newMax]);
      }
    }
  }, [priceBoundsCache]); // Chỉ chạy khi priceBoundsCache thay đổi (khi mount), không chạy khi priceRange thay đổi

  // Pagination handler
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Show loading screen until all initial data is loaded
  if ((loading && products.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 text-lg">Đang tải dữ liệu...</p>
        <p className="text-gray-400 text-sm mt-2">Vui lòng đợi trong giây lát</p>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-red-600 px-4">
        <p className="text-xl font-semibold mb-2">Lỗi: {error}</p>
        <p className="text-gray-600">Vui lòng kiểm tra kết nối backend</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="min-h-[1200px] w-full lg:w-64 bg-white rounded-lg shadow-sm">
      

            <div className="px-6 py-6">
              {/* Categories - First Section */}
              <div className={`mb-6 border-b border-gray-200 ${isCategoriesOpen ? 'pb-6' : 'pb-2'}`}>
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="w-full flex items-center justify-between text-xs font-bold mb-4 text-black uppercase tracking-wider hover:opacity-70 transition-opacity"
                >
                  <span>BỘ SƯU TẬP NƯỚC HOA</span>
                  <svg 
                    className={`w-4 h-4 text-gray-600 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {isCategoriesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="space-y-1">
                        <FilterCheckbox
                          label="Tất cả"
                          checked={selectedCategories.length === 0 && selectedCategory === null}
                          onChange={() => {
                            setSelectedCategories([]);
                            setSelectedCategory(null);
                          }}
                        />
                        {categories.map((cat) => (
                          <FilterCheckbox
                            key={cat.categoryId}
                            label={cat.name}
                            checked={selectedCategories.includes(cat.categoryId) || selectedCategory === cat.categoryId}
                            onChange={() => toggleCategory(cat.categoryId)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Brands - Second Section */}
              <div className={`mb-6 border-b border-gray-200 ${isBrandsOpen ? 'pb-6' : 'pb-3'}`}>
                <button
                  onClick={() => setIsBrandsOpen(!isBrandsOpen)}
                  className="w-full flex items-center justify-between text-xs font-bold mb-3 text-black uppercase tracking-wider hover:opacity-70 transition-opacity"
                >
                  <span>THƯƠNG HIỆU</span>
                  <svg 
                    className={`w-4 h-4 text-gray-600 transition-transform ${isBrandsOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {isBrandsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-3"
                        placeholder="Tìm kiếm nhanh"
                        value={brandSearchQuery}
                        onChange={(e) => setBrandSearchQuery(e.target.value)}
                      />
                      <div className="space-y-1 max-h-[280px] overflow-y-auto pr-2">
                        <FilterCheckbox
                          label="Tất cả"
                          checked={selectedBrands.length === 0 && selectedBrand === null}
                          onChange={() => {
                            setSelectedBrands([]);
                            setSelectedBrand(null);
                          }}
                        />
                        {brands
                          .filter((brand) =>
                            brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
                          )
                          .map((brand) => (
                            <FilterCheckbox
                              key={brand.brandId}
                              label={brand.name}
                              checked={selectedBrands.includes(brand.brandId) || selectedBrand === brand.brandId}
                              onChange={() => toggleBrand(brand.brandId)}
                            />
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Price Filter - Third Section - Only show when price bounds are loaded */}
              {priceBounds !== null && priceRange !== null && (() => {
                // Clamp priceRange values to ensure they're within bounds before rendering
                const clampedMin = Math.max(priceBounds[0], Math.min(priceBounds[1], priceRange[0]));
                const clampedMax = Math.max(priceBounds[0], Math.min(priceBounds[1], priceRange[1]));
                const safeMin = Math.min(clampedMin, clampedMax);
                const safeMax = Math.max(clampedMin, clampedMax);
                const displayRange: [number, number] = [safeMin, safeMax];
                
                return (
                <div className={`border-b border-gray-200 ${isPriceOpen ? 'pb-6' : 'pb-2'}`}>
                  <button
                    onClick={() => setIsPriceOpen(!isPriceOpen)}
                    className="w-full flex items-center justify-between text-xs font-bold mb-4 text-black uppercase tracking-wider hover:opacity-70 transition-opacity"
                  >
                    <span>GIÁ</span>
                    <svg 
                      className={`w-4 h-4 text-gray-600 transition-transform ${isPriceOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {isPriceOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="space-y-4">
                          {/* Range Slider */}
                          <div className="space-y-3">
                      <div 
                        className="relative h-6  cursor-pointer select-none mx-2"
                        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const sliderElement = e.currentTarget as HTMLElement;
                          const rect = sliderElement.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          
                          // Check if clicking on a thumb (within 20px radius)
                          // Sử dụng displayRange đã được clamp để tính toán vị trí
                          const minThumbPos = ((displayRange[0] - priceBounds[0]) / (priceBounds[1] - priceBounds[0])) * rect.width;
                          const maxThumbPos = ((displayRange[1] - priceBounds[0]) / (priceBounds[1] - priceBounds[0])) * rect.width;
                          const minThumbDistance = Math.abs(clickX - minThumbPos);
                          const maxThumbDistance = Math.abs(clickX - maxThumbPos);
                          
                          // Determine which thumb to drag (only if clicking near a thumb)
                          let activeThumb: 'min' | 'max' | null = null;
                          if (minThumbDistance < 20) {
                            activeThumb = 'min';
                          } else if (maxThumbDistance < 20) {
                            activeThumb = 'max';
                          } else {
                            // Clicking on track - move nearest thumb (but only on drag, not on click)
                            activeThumb = minThumbDistance < maxThumbDistance ? 'min' : 'max';
                          }
                          
                          if (!activeThumb) return;
                          
                          // 1. CẤU HÌNH KÍCH THƯỚC
                          const thumbWidth = 12; // w-5 = 20px
                          const pixelRange = rect.width;
                          const valueRange = priceBounds[1] - priceBounds[0];
                          
                          // 2. TÍNH STEP VÀ KHOẢNG CÁCH TỐI THIỂU (MIN GAP)
                          // Tính step để làm tròn giá trị - đơn vị nhỏ nhất là 1000
                          const step = 10000;
                          
                          // Tính khoảng cách tối thiểu giữa 2 nút (tương ứng với thumbWidth)
                          let minDistance = (thumbWidth / pixelRange) * valueRange;
                          // Làm tròn minDistance theo step để khớp với bước nhảy của slider, tối thiểu là 1000
                          minDistance = Math.max(step, Math.ceil(minDistance / step) * step);
                          
                          let hasMoved = false; // Track if mouse has actually moved
                          
                          const handleMove = (moveEvent: MouseEvent) => {
                            moveEvent.preventDefault();
                            moveEvent.stopPropagation();
                            hasMoved = true;
                            
                            const moveRect = sliderElement.getBoundingClientRect();
                            const moveX = moveEvent.clientX - moveRect.left;
                            const movePercent = Math.max(0, Math.min(1, moveX / moveRect.width));
                            const moveVal = priceBounds[0] + movePercent * valueRange;
                            
                            // Làm tròn giá trị theo step
                            let steppedMoveVal = Math.round(moveVal / step) * step;
                            
                            setPriceRange((currentRange) => {
                              if (!currentRange) {
                                // Đảm bảo giá trị nằm trong bounds và làm tròn về bội số của 1000
                                steppedMoveVal = Math.max(priceBounds[0], Math.min(priceBounds[1], steppedMoveVal));
                                steppedMoveVal = Math.round(steppedMoveVal / step) * step;
                                return [steppedMoveVal, steppedMoveVal];
                              }
                              
                              // 3. LOGIC CHẶN ĐÈ LÊN NHAU (QUAN TRỌNG NHẤT)
                              if (activeThumb === 'min') {
                                // Nút Min không được vượt quá (Max hiện tại - khoảng cách nút)
                                const maxAllowed = currentRange[1] - minDistance;
                                // Lấy giá trị nhỏ hơn giữa vị trí chuột và giới hạn cho phép
                                let finalMin = Math.min(steppedMoveVal, maxAllowed);
                                // Đảm bảo không thấp hơn giá sàn và làm tròn lại theo step
                                finalMin = Math.max(priceBounds[0], finalMin);
                                finalMin = Math.round(finalMin / step) * step;
                                finalMin = Math.max(priceBounds[0], finalMin); // Đảm bảo sau khi làm tròn vẫn >= min
                                return [finalMin, currentRange[1]];
                              } else {
                                // Nút Max không được thấp hơn (Min hiện tại + khoảng cách nút)
                                const minAllowed = currentRange[0] + minDistance;
                                // Lấy giá trị lớn hơn giữa vị trí chuột và giới hạn cho phép
                                let finalMax = Math.max(steppedMoveVal, minAllowed);
                                // Đảm bảo không cao hơn giá trần và làm tròn lại theo step
                                finalMax = Math.min(priceBounds[1], finalMax);
                                finalMax = Math.round(finalMax / step) * step;
                                finalMax = Math.min(priceBounds[1], finalMax); // Đảm bảo sau khi làm tròn vẫn <= max
                                return [currentRange[0], finalMax];
                              }
                            });
                          };
                          
                          const handleUp = (upEvent?: MouseEvent) => {
                            if (upEvent) {
                              upEvent.preventDefault();
                              upEvent.stopPropagation();
                            }
                            
                            // Logic click vào thanh trượt (nếu chưa kéo)
                            if (!hasMoved && activeThumb) {
                              const percent = Math.max(0, Math.min(1, clickX / rect.width));
                              const newVal = priceBounds[0] + percent * valueRange;
                              
                              // Làm tròn giá trị theo step
                              let steppedVal = Math.round(newVal / step) * step;
                              
                              setPriceRange((currentRange) => {
                                if (!currentRange) {
                                  // Đảm bảo giá trị nằm trong bounds và làm tròn về bội số của 1000
                                  steppedVal = Math.max(priceBounds[0], Math.min(priceBounds[1], steppedVal));
                                  steppedVal = Math.round(steppedVal / step) * step;
                                  return [steppedVal, steppedVal];
                                }
                                
                                if (activeThumb === 'min') {
                                  // Nút Min không được vượt quá (Max hiện tại - khoảng cách nút)
                                  const maxAllowed = currentRange[1] - minDistance;
                                  let finalMin = Math.min(steppedVal, maxAllowed);
                                  // Đảm bảo không thấp hơn giá sàn và làm tròn lại theo step
                                  finalMin = Math.max(priceBounds[0], finalMin);
                                  finalMin = Math.round(finalMin / step) * step;
                                  finalMin = Math.max(priceBounds[0], finalMin); // Đảm bảo sau khi làm tròn vẫn >= min
                                  return [finalMin, currentRange[1]];
                                } else {
                                  // Nút Max không được thấp hơn (Min hiện tại + khoảng cách nút)
                                  const minAllowed = currentRange[0] + minDistance;
                                  let finalMax = Math.max(steppedVal, minAllowed);
                                  // Đảm bảo không cao hơn giá trần và làm tròn lại theo step
                                  finalMax = Math.min(priceBounds[1], finalMax);
                                  finalMax = Math.round(finalMax / step) * step;
                                  finalMax = Math.min(priceBounds[1], finalMax); // Đảm bảo sau khi làm tròn vẫn <= max
                                  return [currentRange[0], finalMax];
                                }
                              });
                            }
                            
                            document.removeEventListener('mousemove', handleMove);
                            document.removeEventListener('mouseup', handleUp);
                            document.body.style.userSelect = '';
                            document.body.style.cursor = '';
                          };
                          
                          // Prevent text selection and change cursor during drag
                          document.body.style.userSelect = 'none';
                          document.body.style.cursor = 'grabbing';
                          
                          document.addEventListener('mousemove', handleMove);
                          document.addEventListener('mouseup', handleUp);
                        }}
                      >
                        {/* Background Track - Thin gray line */}
                         <div className="absolute w-full h-[6px] bg-gray-300 rounded-full top-1/2 -translate-y-1/2 pointer-events-none" />
                        {/* Active Range Track - Between the two thumbs - Thin line */}
                        <div 
                          className="absolute h-[6px] bg-gray-600 rounded-full top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ 
                            left: `${((displayRange[0] - priceBounds[0]) / (priceBounds[1] - priceBounds[0])) * 100}%`,
                            width: `${((displayRange[1] - displayRange[0]) / (priceBounds[1] - priceBounds[0])) * 100}%`
                          }}
                        />
                        {/* Slider Thumbs - White circles with gray border - Now clickable */}
                        <div 
                          className="absolute w-5 h-5 bg-white rounded-full border-2 border-gray-400 z-40 top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-sm cursor-grab active:cursor-grabbing"
                          style={{ left: `${((displayRange[0] - priceBounds[0]) / (priceBounds[1] - priceBounds[0])) * 100}%` }}
                        />
                        <div 
                          className="absolute w-5 h-5 bg-white rounded-full border-2 border-gray-400 z-40 top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-sm cursor-grab active:cursor-grabbing"
                          style={{ left: `${((displayRange[1] - priceBounds[0]) / (priceBounds[1] - priceBounds[0])) * 100}%` }}
                        />
                      </div>
                          {/* Display selected price range - Similar to reference website */}
                          <div className="text-sm text-gray-700 font-medium text-center">
                            {formatCurrency(priceRange[0])} đ - {formatCurrency(priceRange[1])} ₫
                          </div>
                        </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                );
              })()}
            </div>

            {/* Filter Buttons - Bottom */}
            <div className=" px-6 space-y-2">
              <button
                onClick={handleApplyFilters}
                disabled={!hasPendingFilters}
                className={`w-full relative overflow-hidden  py-2.5 px-4 rounded-full font-medium text-sm transition-all ${
                  hasPendingFilters
                    ? "bg-black text-white hover:bg-gray-800 cursor-pointer btn-slide-overlay-dark"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed "
                }`}>
                <span className="relative z-10">Lọc</span>
              </button>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="relative overflow-hidden btn-slide-overlay-dark btn-slide-overlay-white w-full py-2.5 px-4 rounded-full font-medium text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all">
                  <span className="relative z-10">Đặt lại</span>
                </button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Page Header - Split into two sections */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                {/* Left side: Title and Breadcrumb */}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-black mb-3 leading-tight">
                    Bộ sưu tập nước hoa
                  </h1>
                  <nav className="text-xs md:text-sm flex items-center gap-2">
                    <Link
                      to="/"
                      className="text-gray-500 font-normal hover:text-black transition-colors">
                      Trang chủ
                    </Link>
                    <span className="text-gray-400">/</span>
                    <span className="text-black font-medium">
                      Bộ sưu tập nước hoa
                    </span>
                  </nav>
                </div>

                {/* Right side: Search and Results Count */}
                <div className="flex flex-col items-start gap-3 w-full lg:w-auto lg:items-end">
                  <div className="text-base text-gray-700 leading-relaxed">
                    <strong className="text-black text-lg font-semibold">
                      {pageInfo ? pageInfo.totalElements : 0}
                    </strong>{" "}
                    <span className="font-normal">kết quả</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    <label className="text-base text-gray-700 font-medium whitespace-nowrap leading-relaxed">Sắp xếp:</label>
                    <select
                      className="px-4 py-1.5 pr-10 border border-gray-300 rounded-md text-base cursor-pointer bg-white font-normal min-w-[160px] focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23333%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-right bg-[length:18px] bg-[position:right_0.5rem_center]"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}>
                      <option value="default">Mặc định</option>
                      <option value="saleoff">Giảm giá</option>
                      <option value="popularity">Mức độ phổ biến</option>
                      <option value="rating">Đánh giá</option>
                      <option value="newest">Mới nhất</option>
                      <option value="price-asc">Từ thấp đến cao</option>
                      <option value="price-desc">Từ cao đến thấp</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Brand/Category Info Banner */}
            {(selectedBrandInfo || selectedCategoryInfo) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
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

            {/* Products Grid */}
            <AnimatePresence mode="wait">
              {products.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-lg shadow-sm p-16 text-center">
                  <i className="bi bi-inbox text-6xl text-gray-300 mb-4 block"></i>
                  <h4 className="text-xl text-gray-600 mb-2 font-semibold">
                    Không tìm thấy sản phẩm
                  </h4>
                  <p className="text-gray-500 mb-4">
                    Vui lòng thử lại với bộ lọc khác
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm">
                      Đặt lại bộ lọc
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
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
                        transition={{ delay: index * 0.03 }}
                        className="[&_.product-image-wrapper]:!p-3 [&_.product-image-wrapper]:!min-h-[180px] 
                                   sm:[&_.product-image-wrapper]:!p-4 sm:[&_.product-image-wrapper]:!min-h-[200px]
                                   lg:[&_.product-image-wrapper]:!p-4 lg:[&_.product-image-wrapper]:!min-h-[220px]
                                   xl:[&_.product-image-wrapper]:!p-5 xl:[&_.product-image-wrapper]:!min-h-[240px]
                                   [&_.product-image_img]:!max-h-[120px]
                                   sm:[&_.product-image_img]:!max-h-[130px]
                                   lg:[&_.product-image_img]:!max-h-[140px]">
                        <PerfumeCard inventory={inventory} />
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {pageInfo && pageInfo.totalPages > 1 && (
              <div className="mt-8 bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-center items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={pageInfo.first || loading}
                    className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
                    className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Sau
                    <i className="bi bi-chevron-right ml-1"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    
    </div>
  );
};

interface FilterCheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: () => void;
}

const FilterCheckbox = ({ label, checked, onChange }: FilterCheckboxProps) => (
  <label className="flex items-center cursor-pointer text-sm group py-1.5 px-1 rounded transition-colors hover:bg-gray-50">
    <div className="relative flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 cursor-pointer accent-black border-gray-300 rounded  checked:border-0 outline-none focus:outline-none"
      />
    </div>
    <span className="ml-2 text-gray-700 group-hover:text-black transition-colors">{label}</span>
  </label>
);
