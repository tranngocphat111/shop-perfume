import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { productService } from "../services/perfume.service";
import { inventoryService, type InventoryItem } from "../services/inventory.service";
import { useProductsFilter } from "../contexts/ProductsFilterContext";
import type { Brand, Category, Product, PageResponse } from "../types";
import {
  ProductsSidebar,
  ProductsHeader,
  ProductsGrid,
  ProductsPagination,
  ProductsToolbar,
} from "../components/products";

// Cache keys for sessionStorage
const CACHE_KEYS = {
  BRANDS: 'products_cache_brands',
  CATEGORIES: 'products_cache_categories',
  PRODUCTS: 'products_cache_products',
  ALL_PRODUCTS: 'products_cache_all_products',
  PAGE_INFO: 'products_cache_page_info',
  PRICE_BOUNDS: 'products_cache_price_bounds',
  FILTERS: 'products_cache_filters',
  CURRENT_PAGE: 'products_cache_current_page',
  INVENTORY_MAP: 'products_cache_inventory_map',
};

// Helper functions for cache
const getCachedData = <T,>(key: string): T | null => {
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error(`Failed to parse cached data for ${key}:`, err);
  }
  return null;
};

const setCachedData = <T,>(key: string, data: T): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to cache data for ${key}:`, err);
  }
};

export const Products = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Use filter context
  const {
    appliedBrands,
    appliedCategories,
    appliedSearchQuery,
    appliedPriceRange,
    sortBy,
    selectedBrands,
    selectedCategories,
    priceRange,
    brandSearchQuery,
    selectedBrand,
    selectedCategory,
    currentPage,
    setAppliedBrands,
    setAppliedCategories,
    setAppliedSearchQuery,
    setAppliedPriceRange,
    setSortBy,
    setSelectedBrands,
    setSelectedCategories,
    setSearchQuery,
    setPriceRange,
    setBrandSearchQuery,
    setSelectedBrand,
    setSelectedCategory,
    setCurrentPage,
    applyFilters,
    resetFilters,
    hasActiveFilters,
    hasPendingFilters,
  } = useProductsFilter();

  // Initialize state from cache if available
  const [products, setProducts] = useState<Product[]>(() =>
    getCachedData<Product[]>(CACHE_KEYS.PRODUCTS) || []
  );
  const [allProducts, setAllProducts] = useState<Product[]>(() =>
    getCachedData<Product[]>(CACHE_KEYS.ALL_PRODUCTS) || []
  );
  const [pageInfo, setPageInfo] = useState<PageResponse<Product> | null>(() =>
    getCachedData<PageResponse<Product>>(CACHE_KEYS.PAGE_INFO) || null
  );
  const [priceBoundsCache, setPriceBoundsCache] = useState<[number, number] | null>(() =>
    getCachedData<[number, number]>(CACHE_KEYS.PRICE_BOUNDS) || null
  );
  const [brands, setBrands] = useState<Brand[]>(() =>
    getCachedData<Brand[]>(CACHE_KEYS.BRANDS) || []
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    getCachedData<Category[]>(CACHE_KEYS.CATEGORIES) || []
  );

  // Loading states for each data source
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingPriceBounds, setLoadingPriceBounds] = useState(false);
  const [loadingInventories, setLoadingInventories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Single loading state for initial load - only false when ALL data is loaded
  // Always start with true to ensure we wait for all data to be loaded into state
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [inventoryMap, setInventoryMap] = useState<Map<number, InventoryItem>>(() => {
    const cached = getCachedData<Array<[number, InventoryItem]>>(CACHE_KEYS.INVENTORY_MAP);
    return cached ? new Map(cached) : new Map();
  });

  // Use cached price bounds - don't recalculate from allProducts to avoid changing bounds when filtering
  // This ensures the slider bounds remain stable
  const priceBounds = priceBoundsCache;

  // Track if we're restoring from URL to prevent sync loop
  const isRestoringFromUrlRef = useRef(false);

  // Restore filters from URL params on mount
  useEffect(() => {
    const brandIdParam = searchParams.get("brandId");
    const categoryIdParam = searchParams.get("categoryId");
    const searchParam = searchParams.get("q");

    // Set flag to prevent sync URL from running
    isRestoringFromUrlRef.current = true;

    // If URL has categoryId → filter by category only
    if (categoryIdParam) {
      const categoryId = Number(categoryIdParam);
      setSelectedCategory(categoryId);
      setSelectedCategories([categoryId]);
      setAppliedCategories([categoryId]); // Auto-apply from URL
      // Clear other filters
      setSelectedBrand(null);
      setSelectedBrands([]);
      setAppliedBrands([]);
      setSearchQuery("");
      setAppliedSearchQuery("");
      setBrandSearchQuery(""); // Reset brand search
      // Reset price range to bounds if available
      if (priceBounds) {
        setPriceRange([priceBounds[0], priceBounds[1]]);
        setAppliedPriceRange([priceBounds[0], priceBounds[1]]);
      } else {
        setPriceRange(null);
        setAppliedPriceRange(null);
      }
      setSortBy("newest");
      setCurrentPage(0);
    }
    // If URL has brandId → filter by brand only
    else if (brandIdParam) {
      const brandId = Number(brandIdParam);
      setSelectedBrand(brandId);
      setSelectedBrands([brandId]);
      setAppliedBrands([brandId]); // Auto-apply from URL
      // Clear other filters
      setSelectedCategory(null);
      setSelectedCategories([]);
      setAppliedCategories([]);
      setSearchQuery("");
      setAppliedSearchQuery("");
      setBrandSearchQuery(""); // Reset brand search
      // Reset price range to bounds if available
      if (priceBounds) {
        setPriceRange([priceBounds[0], priceBounds[1]]);
        setAppliedPriceRange([priceBounds[0], priceBounds[1]]);
      } else {
        setPriceRange(null);
        setAppliedPriceRange(null);
      }
      setSortBy("newest");
      setCurrentPage(0);
    }
    // If URL has search query
    else if (searchParam) {
      setSearchQuery(searchParam);
      setAppliedSearchQuery(searchParam); // Auto-apply from URL
      // Clear other filters
      setSelectedBrand(null);
      setSelectedBrands([]);
      setAppliedBrands([]);
      setSelectedCategory(null);
      setSelectedCategories([]);
      setAppliedCategories([]);
      setBrandSearchQuery(""); // Reset brand search
      // Reset price range to bounds if available
      if (priceBounds) {
        setPriceRange([priceBounds[0], priceBounds[1]]);
        setAppliedPriceRange([priceBounds[0], priceBounds[1]]);
      } else {
        setPriceRange(null);
        setAppliedPriceRange(null);
      }
      setSortBy("newest");
      setCurrentPage(0);
    }
    // If no URL params → restore from sessionStorage (handled by context)
    // Context will automatically restore from sessionStorage

    // Reset flag after a short delay to allow state updates
    setTimeout(() => {
      isRestoringFromUrlRef.current = false;
    }, 100);
  }, [searchParams, setSelectedBrand, setSelectedBrands, setAppliedBrands, setSelectedCategory, setSelectedCategories, setAppliedCategories, setSearchQuery, setAppliedSearchQuery, setBrandSearchQuery, setPriceRange, setAppliedPriceRange, setSortBy, setCurrentPage, priceBounds]);

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
            const bounds: [number, number] = [minPrice, maxPrice];
            setPriceBoundsCache(bounds);
            setCachedData(CACHE_KEYS.PRICE_BOUNDS, bounds);
            // Only set price range if not already set
            if (priceRange === null) {
              setPriceRange(bounds);
              setAppliedPriceRange(bounds);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch price bounds:", err);
      // Don't set any default values
    }
  }, [priceRange]);

  // Preload brand images (non-blocking, runs in background)
  const preloadBrandImages = useCallback(async (brandsList: Brand[]) => {
    try {
      const { getBrandLogoUrl } = await import("../utils/helpers");

      // Preload all brand images (non-blocking)
      const imagePromises = brandsList
        .map(brand => {
          const logoUrl = getBrandLogoUrl(brand.url);
          if (!logoUrl) return null;

          return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Continue even if image fails
            img.src = logoUrl;
          });
        })
        .filter(Boolean) as Promise<void>[];

      // Don't await - let it run in background
      Promise.all(imagePromises).catch(err => {
        console.error("Failed to preload brand images:", err);
      });
    } catch (err) {
      console.error("Failed to preload brand images:", err);
    }
  }, []);

  // Load brands, categories, and price bounds on mount (only once)
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        // Check if we have cached data
        const cachedBrands = getCachedData<Brand[]>(CACHE_KEYS.BRANDS);
        const cachedCategories = getCachedData<Category[]>(CACHE_KEYS.CATEGORIES);
        const hasCachedPriceBounds = getCachedData(CACHE_KEYS.PRICE_BOUNDS) !== null;

        // Set loading states - always set to track loading, even with cache
        if (!cachedBrands) setLoadingBrands(true);
        if (!cachedCategories) setLoadingCategories(true);
        if (!hasCachedPriceBounds) setLoadingPriceBounds(true);

        // Load in parallel for speed
        const [brandsRes] = await Promise.all([
          cachedBrands ? (async () => {
            // Use cached data, but ensure state is set
            if (isMounted && brands.length === 0) {
              setBrands(cachedBrands);
            }
            // Mark as loaded immediately if we have cache
            if (isMounted) setLoadingBrands(false);
            return cachedBrands;
          })() : (async () => {
            try {
              const result = await productService.getAllBrands();
              if (isMounted) {
                setBrands(result);
                setCachedData(CACHE_KEYS.BRANDS, result);
              }
              return result;
            } catch (err) {
              console.error("Failed to load brands:", err);
              return [];
            } finally {
              if (isMounted) setLoadingBrands(false);
            }
          })(),
          cachedCategories ? (async () => {
            // Use cached data, but ensure state is set
            if (isMounted && categories.length === 0) {
              setCategories(cachedCategories);
            }
            // Mark as loaded immediately if we have cache
            if (isMounted) setLoadingCategories(false);
            return cachedCategories;
          })() : (async () => {
            try {
              const result = await productService.getAllCategories();
              if (isMounted) {
                setCategories(result);
                setCachedData(CACHE_KEYS.CATEGORIES, result);
              }
              return result;
            } catch (err) {
              console.error("Failed to load categories:", err);
              return [];
            } finally {
              if (isMounted) setLoadingCategories(false);
            }
          })(),
        ]);

        // Fetch price bounds if not cached
        if (!hasCachedPriceBounds) {
          try {
            await fetchPriceBounds();
          } finally {
            if (isMounted) setLoadingPriceBounds(false);
          }
        } else {
          // Mark as loaded if we have cache
          if (isMounted) setLoadingPriceBounds(false);
        }

        // Preload brand images after brands are loaded (non-blocking)
        if (brandsRes && brandsRes.length > 0) {
          preloadBrandImages(brandsRes);
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
        if (isMounted) {
          setLoadingBrands(false);
          setLoadingCategories(false);
          setLoadingPriceBounds(false);
        }
      }
    };

    // Always load on mount to ensure data is in state
    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchPriceBounds, preloadBrandImages]); // Remove isInitialLoading dependency to always run on mount

  // Load inventories and create a map
  useEffect(() => {
    let isMounted = true;

    const loadInventories = async () => {
      try {
        // Check if we have cached inventory map
        const cachedInventory = getCachedData<Array<[number, InventoryItem]>>(CACHE_KEYS.INVENTORY_MAP);

        if (cachedInventory && cachedInventory.length > 0) {
          // Use cached data, but ensure state is set
          if (isMounted && inventoryMap.size === 0) {
            setInventoryMap(new Map(cachedInventory));
          }
          // Mark as loaded immediately if we have cache
          if (isMounted) setLoadingInventories(false);

          // Fetch fresh data in background (non-blocking)
          inventoryService.getInventoryPage(0, 1000).then((pageResponse) => {
            if (!isMounted) return;
            const map = new Map<number, InventoryItem>();
            pageResponse.content.forEach((item) => {
              map.set(item.product.productId, item);
            });
            setInventoryMap(map);
            setCachedData(CACHE_KEYS.INVENTORY_MAP, Array.from(map.entries()));
          }).catch((err) => {
            console.error("Failed to refresh inventories:", err);
          });
          return;
        }

        // Set loading state
        if (isMounted) setLoadingInventories(true);

        // Fetch all inventories (with a reasonable page size)
        const pageResponse = await inventoryService.getInventoryPage(0, 1000);
        if (!isMounted) return;

        const map = new Map<number, InventoryItem>();
        pageResponse.content.forEach((item) => {
          map.set(item.product.productId, item);
        });
        setInventoryMap(map);
        setCachedData(CACHE_KEYS.INVENTORY_MAP, Array.from(map.entries()));
      } catch (err) {
        console.error("Failed to load inventories:", err);
        // Continue with empty map if inventory fetch fails
      } finally {
        if (isMounted) setLoadingInventories(false);
      }
    };

    loadInventories();

    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount

  // Track last fetch params to avoid unnecessary refetches
  const lastFetchParamsRef = useRef<string | null>(null);
  const isInitialFetchRef = useRef(true);
  // Track if pageInfo was updated by handlePageChange to avoid double update
  const pageInfoUpdatedByHandlerRef = useRef(false);

  // Fetch products from backend - optimized for speed
  const fetchProducts = useCallback(async (force = false, page: number = 0) => {
    // Use provided page (always required)
    const pageToFetch = page;
    
    // Create a key for current fetch params (without currentPage for filter changes)
    const fetchKey = JSON.stringify({
      appliedBrands,
      appliedCategories,
      appliedSearchQuery,
      sortBy,
      appliedPriceRange,
      page: pageToFetch,
    });

    // Skip if we're fetching with the same params (unless forced or initial fetch)
    if (!force && !isInitialFetchRef.current && lastFetchParamsRef.current === fetchKey) {
      return;
    }

    lastFetchParamsRef.current = fetchKey;
    isInitialFetchRef.current = false;

    try {
      setError(null);
      setLoadingProducts(true);

      // Note: Popularity sort will be handled client-side after fetching products normally
      // We fetch products normally and then sort by sales quantity

      // Determine sort field and direction
      // Note: For popularity sort, we'll sort client-side after filtering
      let sortField = "productId";
      let sortDirection = "DESC";

      if (sortBy === "newest") {
        sortField = "productId";
        sortDirection = "DESC";
      } else if (sortBy === "oldest") {
        sortField = "productId";
        sortDirection = "ASC";
      } else if (sortBy === "price-asc") {
        sortField = "unitPrice";
        sortDirection = "ASC";
      } else if (sortBy === "price-desc") {
        sortField = "unitPrice";
        sortDirection = "DESC";
      }
      // For popularity, we don't pass sort to backend - will sort client-side

      // Check if we need to fetch more for client-side filtering/sorting
      const needsPriceFilter = appliedPriceRange !== null &&
        priceBoundsCache !== null &&
        (appliedPriceRange[0] !== priceBoundsCache[0] ||
          appliedPriceRange[1] !== priceBoundsCache[1]);
      const hasMultipleBrands = appliedBrands.length > 1;
      const hasMultipleCategories = appliedCategories.length > 1;
      const hasMultipleFilters = hasMultipleBrands || hasMultipleCategories;
      const isPopularitySort = sortBy === "popularity";
      // Need client-side processing if: price filter, multiple filters, or popularity sort
      const needsClientSideFilter = needsPriceFilter || hasMultipleFilters || isPopularitySort;

      // If we need client-side filtering/sorting, fetch more items to ensure we have all matching products
      // For popularity sort, we need all filtered products to sort them properly
      const pageSize = needsClientSideFilter ? 1000 : 9;

      // For single selection, use backend filter; for multiple, fetch all and filter client-side
      // When multiple filters, don't pass brandId/categoryId to backend, fetch all and filter client-side
      const backendBrandId = (hasMultipleBrands || hasMultipleCategories) ? undefined :
        (appliedBrands.length === 1 ? appliedBrands[0] : undefined);
      const backendCategoryId = (hasMultipleBrands || hasMultipleCategories) ? undefined :
        (appliedCategories.length === 1 ? appliedCategories[0] : undefined);

      // For popularity sort, don't pass sort to backend - we'll sort client-side after filtering
      const backendSortField = isPopularitySort ? undefined : sortField;
      const backendSortDirection = isPopularitySort ? undefined : sortDirection;
      
      const response = await productService.getProductPage(
        needsClientSideFilter ? 0 : pageToFetch,
        pageSize,
        backendSortField,
        backendSortDirection,
        appliedSearchQuery || undefined,
        backendBrandId,
        backendCategoryId
      );

      // Store products
      setAllProducts(response.content);
      setCachedData(CACHE_KEYS.ALL_PRODUCTS, response.content);

      // Only use server-side pagination if we don't need client-side processing
      if (!needsClientSideFilter) {
        // Use server-side pagination - much faster!
        setPageInfo(response);
        setCachedData(CACHE_KEYS.PAGE_INFO, response);
        setProducts(response.content);
        setCachedData(CACHE_KEYS.PRODUCTS, response.content);
      }
      // If needsClientSideFilter, products will be set in the useEffect that watches filteredAndSortedProducts
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Không thể tải sản phẩm. Vui lòng thử lại sau.");
      setAllProducts([]);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [appliedBrands, appliedCategories, appliedSearchQuery, sortBy, appliedPriceRange, priceBoundsCache]); // Removed currentPage to avoid infinite loop

  // Listen for reset filters event (must be after fetchProducts is defined)
  useEffect(() => {
    const handleResetFilters = () => {
      // Reset all filters in context
      resetFilters(priceBounds);
      // Set flag to prevent URL sync from interfering
      isRestoringFromUrlRef.current = true;
      // Navigate to /products without params
      navigate("/products", { replace: true });
      // Force fetch products after reset
      setTimeout(() => {
        fetchProducts(true); // Force fetch, reset to page 0
        isRestoringFromUrlRef.current = false;
      }, 100);
    };
    window.addEventListener('resetFilters', handleResetFilters);
    return () => window.removeEventListener('resetFilters', handleResetFilters);
  }, [resetFilters, priceBounds, navigate, fetchProducts]);

  // Fetch sales data (productId -> sales rank) for popularity sort
  const [salesRankMap, setSalesRankMap] = useState<Map<number, number>>(new Map());
  
  useEffect(() => {
    const fetchSalesRank = async () => {
      try {
        // Fetch best sellers with large limit to get sales ranking for many products
        // getBestSellers returns Product[], already sorted by sales quantity (descending)
        const bestSellers = await productService.getBestSellers(1000);
        const rankMap = new Map<number, number>();
        // Best sellers are already sorted by sales quantity (descending)
        // Use index as rank (lower index = higher sales = better rank)
        bestSellers.forEach((product: Product, index: number) => {
          rankMap.set(product.productId, index);
        });
        setSalesRankMap(rankMap);
      } catch (err) {
        console.error("Failed to fetch sales rank:", err);
        setSalesRankMap(new Map());
      }
    };
    
    if (sortBy === "popularity") {
      fetchSalesRank();
    } else {
      // Clear sales rank when not using popularity sort
      setSalesRankMap(new Map());
    }
  }, [sortBy]);

  // Filter products first, then sort (filteredAndSortedProducts)
  const filteredAndSortedProducts = useMemo(() => {
    const needsPriceFilter = appliedPriceRange !== null &&
      priceBoundsCache !== null &&
      (appliedPriceRange[0] !== priceBoundsCache[0] ||
        appliedPriceRange[1] !== priceBoundsCache[1]);
    const hasMultipleBrands = appliedBrands.length > 1;
    const hasMultipleCategories = appliedCategories.length > 1;
    const hasMultipleFilters = hasMultipleBrands || hasMultipleCategories;
    const isPopularitySort = sortBy === "popularity";
    const needsClientSideFilter = needsPriceFilter || hasMultipleFilters || isPopularitySort;

    // If no client-side filtering/sorting needed, return products as-is (server-side pagination)
    if (!needsClientSideFilter) {
      return allProducts;
    }

    // STEP 1: Start with all products and FILTER first
    let filtered = [...allProducts];

    // Apply brand filter (always filter if brands are selected and we need client-side processing)
    if (appliedBrands.length > 0) {
      if (appliedBrands.length === 1) {
        // Single brand: filter if we need client-side processing
        if (isPopularitySort || needsPriceFilter || hasMultipleCategories || hasMultipleBrands) {
          filtered = filtered.filter(p => appliedBrands.includes(p.brand.brandId));
        }
      } else {
        // Multiple brands: always filter client-side
        filtered = filtered.filter(p => appliedBrands.includes(p.brand.brandId));
      }
    }

    // Apply category filter (always filter if categories are selected and we need client-side processing)
    if (appliedCategories.length > 0) {
      if (appliedCategories.length === 1) {
        // Single category: filter if we need client-side processing
        if (isPopularitySort || needsPriceFilter || hasMultipleBrands || hasMultipleCategories) {
          filtered = filtered.filter(p => appliedCategories.includes(p.category.categoryId));
        }
      } else {
        // Multiple categories: always filter client-side
        filtered = filtered.filter(p => appliedCategories.includes(p.category.categoryId));
      }
    }

    // Apply price filter
    if (needsPriceFilter && appliedPriceRange) {
      filtered = filtered.filter(
        (p) => p.unitPrice >= appliedPriceRange[0] && p.unitPrice <= appliedPriceRange[1]
      );
    }

    // Apply search filter (always filter if search query exists and we need client-side processing)
    if (appliedSearchQuery && (isPopularitySort || needsPriceFilter || hasMultipleFilters)) {
      const query = appliedSearchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.brand.name.toLowerCase().includes(query) ||
        p.category.name.toLowerCase().includes(query)
      );
    }

    // STEP 2: After filtering, SORT the filtered list
    if (isPopularitySort) {
      // Sort by sales rank (products with sales data first, sorted by rank)
      // Products not in best sellers will be placed at the end
      filtered.sort((a, b) => {
        const aRank = salesRankMap.get(a.productId);
        const bRank = salesRankMap.get(b.productId);
        
        // Both have sales data - sort by rank (lower rank = higher sales)
        if (aRank !== undefined && bRank !== undefined) {
          return aRank - bRank;
        }
        
        // Only a has sales data - a comes first
        if (aRank !== undefined && bRank === undefined) {
          return -1;
        }
        
        // Only b has sales data - b comes first
        if (aRank === undefined && bRank !== undefined) {
          return 1;
        }
        
        // Neither has sales data - keep original order
        return 0;
      });
    } else if (sortBy === "price-asc") {
      // Sort by price ascending
      filtered.sort((a, b) => a.unitPrice - b.unitPrice);
    } else if (sortBy === "price-desc") {
      // Sort by price descending
      filtered.sort((a, b) => b.unitPrice - a.unitPrice);
    } else if (sortBy === "newest") {
      // Sort by productId descending (newest first)
      filtered.sort((a, b) => b.productId - a.productId);
    } else if (sortBy === "oldest") {
      // Sort by productId ascending (oldest first)
      filtered.sort((a, b) => a.productId - b.productId);
    }
    // Default (newest) is handled above

    return filtered;
  }, [allProducts, appliedPriceRange, sortBy, priceBoundsCache, appliedBrands, appliedCategories, appliedSearchQuery, salesRankMap]);

  // Note: paginatedProducts is now calculated directly in handlePageChange and useEffect
  // to avoid race conditions and ensure consistency

  // Calculate totalPages correctly (always >= 1, even if no products)
  const totalPages = useMemo(() => {
    const itemsPerPage = 9;
    const total = filteredAndSortedProducts.length;
    return total === 0 ? 1 : Math.ceil(total / itemsPerPage);
  }, [filteredAndSortedProducts.length]);

  // Cache current page when it changes
  useEffect(() => {
    setCachedData(CACHE_KEYS.CURRENT_PAGE, currentPage);
  }, [currentPage]);

  // Note: Filter state caching is now handled by ProductsFilterContext

  // Track if component has mounted
  const hasMountedRef = useRef(false);
  
  // Fetch products when filters change (but not on initial mount)
  useEffect(() => {
    // Skip on initial mount - initial products are loaded separately
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    // Only fetch if not in initial loading (to avoid double fetch)
    if (!isInitialLoading) {
      fetchProducts(false, 0); // Reset to page 0 when filters change
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedBrands, appliedCategories, appliedSearchQuery, sortBy, appliedPriceRange, isInitialLoading]);

  // Initial products fetch - must complete before showing page
  useEffect(() => {
    let isMounted = true;

    const loadInitialProducts = async () => {
      // Check if we have cached products
      const cachedProducts = getCachedData<Product[]>(CACHE_KEYS.PRODUCTS);
      const cachedAllProducts = getCachedData<Product[]>(CACHE_KEYS.ALL_PRODUCTS);
      const cachedPageInfo = getCachedData<PageResponse<Product>>(CACHE_KEYS.PAGE_INFO);

      if (cachedProducts && cachedProducts.length > 0) {
        // Use cached data, but ensure state is set
        if (isMounted && products.length === 0) {
          setProducts(cachedProducts);
        }
        if (isMounted && cachedAllProducts && allProducts.length === 0) {
          setAllProducts(cachedAllProducts);
        }
        if (isMounted && cachedPageInfo && !pageInfo) {
          setPageInfo(cachedPageInfo);
        }
        // Mark as loaded immediately if we have cache
        if (isMounted) setLoadingProducts(false);
      } else {
        // No cache, fetch from API (force initial fetch)
        try {
          await fetchProducts(true, currentPage);
        } finally {
          if (isMounted) setLoadingProducts(false);
        }
      }
    };

    // Always load initial products on mount
    loadInitialProducts();

    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount

  // Update products and pageInfo when filtered/sorted list changes (for client-side pagination)
  // This effect handles filter/sort changes for client-side pagination
  // Note: page changes are handled directly in handlePageChange to avoid race conditions and double updates
  useEffect(() => {
    // Skip if pageInfo was just updated by handlePageChange to avoid double update
    if (pageInfoUpdatedByHandlerRef.current) {
      // Reset flag after skipping
      pageInfoUpdatedByHandlerRef.current = false;
      return;
    }
    
    const needsPriceFilter = appliedPriceRange !== null &&
      priceBoundsCache !== null &&
      (appliedPriceRange[0] !== priceBoundsCache[0] ||
        appliedPriceRange[1] !== priceBoundsCache[1]);
    const hasMultipleFilters = appliedBrands.length > 1 || appliedCategories.length > 1;
    const isPopularitySort = sortBy === "popularity";
    const needsClientSideFilter = needsPriceFilter || hasMultipleFilters || isPopularitySort;

    // Update products and page info for client-side pagination
    // Only run when filters/sort change, not when currentPage changes (that's handled in handlePageChange)
    if (needsClientSideFilter) {
      // Use currentPage from closure - it will be the latest value when filters change
      // Ensure currentPage is within valid range
      const validCurrentPage = Math.max(0, Math.min(currentPage, totalPages - 1));
      if (validCurrentPage !== currentPage) {
        setCurrentPage(validCurrentPage);
        return; // Will re-run after currentPage is updated
      }
      
      // Calculate paginated products for current page
      const itemsPerPage = 9;
      const startIndex = validCurrentPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentPaginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex);
      
      // Update products and pageInfo
      setProducts(currentPaginatedProducts);
      const newPageInfo = {
        content: currentPaginatedProducts,
        totalPages: totalPages,
        totalElements: filteredAndSortedProducts.length,
        size: 9,
        number: validCurrentPage,
        numberOfElements: currentPaginatedProducts.length,
        first: validCurrentPage === 0,
        last: validCurrentPage >= totalPages - 1,
        empty: currentPaginatedProducts.length === 0,
      };
      setPageInfo(newPageInfo);
      setCachedData(CACHE_KEYS.PAGE_INFO, newPageInfo);
      setCachedData(CACHE_KEYS.PRODUCTS, currentPaginatedProducts);
    }
  }, [filteredAndSortedProducts, totalPages, appliedPriceRange, priceBoundsCache, appliedBrands, appliedCategories, sortBy]); // Removed currentPage - page changes are handled in handlePageChange, this only runs when filters/sort change

  // Reset to first page and scroll to top when applied filters change
  useEffect(() => {
    // Only reset if not already on page 0
    if (currentPage !== 0) {
      setCurrentPage(0);
    }
    // Scroll to top when filters change (only if not loading)
    if (!loadingProducts) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [appliedBrands, appliedCategories, appliedSearchQuery, sortBy, appliedPriceRange, loadingProducts, currentPage]);
  
  // Scroll to top after loading completes
  useEffect(() => {
    if (!loadingProducts && !isInitialLoading) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [loadingProducts, isInitialLoading]);

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

  // Sync URL with context state (only when not restoring from URL)
  useEffect(() => {
    // Skip if we're currently restoring from URL
    if (isRestoringFromUrlRef.current) {
      return;
    }

    // Check if URL params match current context state
    const brandIdParam = searchParams.get("brandId");
    const categoryIdParam = searchParams.get("categoryId");
    
    // Determine what URL should be based on context
    let targetUrl = "/products";
    
    if (appliedCategories.length === 1 && appliedBrands.length === 0) {
      // 1 category, no brands → /products?categoryId=X
      targetUrl = `/products?categoryId=${appliedCategories[0]}`;
    } else if (appliedBrands.length === 1 && appliedCategories.length === 0) {
      // 1 brand, no categories → /products?brandId=X
      targetUrl = `/products?brandId=${appliedBrands[0]}`;
    }
    // Otherwise → /products (no params)
    
    // Only update if URL is different
    const currentUrl = brandIdParam 
      ? `/products?brandId=${brandIdParam}`
      : categoryIdParam 
      ? `/products?categoryId=${categoryIdParam}`
      : "/products";
    
    if (currentUrl !== targetUrl) {
      navigate(targetUrl, { replace: true });
    }
  }, [appliedCategories, appliedBrands, navigate, searchParams]);

  // Apply filters (called when user clicks "Lọc" button)
  const handleApplyFilters = () => {
    applyFilters();
    // Scroll to top immediately when filters are applied (before loading starts)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset all filters
  const handleResetFilters = () => {
    resetFilters(priceBounds);
    window.history.pushState({}, "", "/products");
    // Scroll to top when filters are reset
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
  const handlePageChange = useCallback((newPage: number) => {
    // Validate page number
    const needsPriceFilter = appliedPriceRange !== null &&
      priceBoundsCache !== null &&
      (appliedPriceRange[0] !== priceBoundsCache[0] ||
        appliedPriceRange[1] !== priceBoundsCache[1]);
    const hasMultipleFilters = appliedBrands.length > 1 || appliedCategories.length > 1;
    const isPopularitySort = sortBy === "popularity";
    const needsClientSideFilter = needsPriceFilter || hasMultipleFilters || isPopularitySort;
    
    if (needsClientSideFilter) {
      // Client-side pagination: validate against totalPages
      // Ensure we have the latest totalPages value
      const itemsPerPage = 9;
      const calculatedTotalPages = filteredAndSortedProducts.length === 0 
        ? 1 
        : Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
      const maxPage = Math.max(0, calculatedTotalPages - 1);
      const validPage = Math.max(0, Math.min(newPage, maxPage));
      
      // Calculate paginated products for the new page immediately
      const startIndex = validPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const newPaginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex);
      
      // Mark that we're updating pageInfo so useEffect doesn't update it again
      pageInfoUpdatedByHandlerRef.current = true;
      
      // Update state immediately
      setCurrentPage(validPage);
      setProducts(newPaginatedProducts);
      
      // Update pageInfo immediately so ProductsPagination component gets the correct page number
      const newPageInfo = {
        content: newPaginatedProducts,
        totalPages: calculatedTotalPages,
        totalElements: filteredAndSortedProducts.length,
        size: itemsPerPage,
        number: validPage,
        numberOfElements: newPaginatedProducts.length,
        first: validPage === 0,
        last: validPage >= maxPage,
        empty: newPaginatedProducts.length === 0,
      };
      setPageInfo(newPageInfo);
      setCachedData(CACHE_KEYS.PAGE_INFO, newPageInfo);
      setCachedData(CACHE_KEYS.PRODUCTS, newPaginatedProducts);
      
      // Flag will be reset in useEffect when it checks and skips
    } else {
      // Server-side pagination: validate against pageInfo
      let validPage = Math.max(0, newPage);
      if (pageInfo) {
        const maxPage = Math.max(0, pageInfo.totalPages - 1);
        validPage = Math.max(0, Math.min(newPage, maxPage));
      }
      setCurrentPage(validPage);
      // Fetch immediately for server-side pagination (always fetch, don't check conditions)
      fetchProducts(false, validPage);
    }
    // Scroll to top immediately when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [appliedPriceRange, priceBoundsCache, appliedBrands, appliedCategories, sortBy, filteredAndSortedProducts, totalPages, pageInfo, fetchProducts]);
  
  // Calculate hasActiveFilters with price range check (needs priceBoundsCache)
  const hasActiveFiltersWithPrice = useMemo(() => {
    const hasPriceFilter = appliedPriceRange !== null &&
      priceBoundsCache !== null &&
      (appliedPriceRange[0] !== priceBoundsCache[0] ||
        appliedPriceRange[1] !== priceBoundsCache[1]);
    return hasActiveFilters || hasPriceFilter;
  }, [hasActiveFilters, appliedPriceRange, priceBoundsCache]);

  // Dynamic title and breadcrumbs based on filters
  const getPageTitle = () => {
    // Check URL params first (highest priority)
    const brandIdParam = searchParams.get("brandId");
    const categoryIdParam = searchParams.get("categoryId");
    
    // Nếu có categoryId trong URL
    if (categoryIdParam) {
      const categoryId = Number(categoryIdParam);
      const category = categories.find(c => c.categoryId === categoryId);
      if (category) return category.name;
      return "Danh mục"; // Fallback
    }
    
    // Nếu có brandId trong URL
    if (brandIdParam) {
      const brandId = Number(brandIdParam);
      const brand = brands.find(b => b.brandId === brandId);
      if (brand) return brand.name;
      return "Thương hiệu"; // Fallback
    }

    // Nếu không có filter nào (tất cả danh mục và tất cả thương hiệu)
    if (appliedCategories.length === 0 && appliedBrands.length === 0) {
      return "Danh sách nước hoa";
    }

    // Nếu lọc cả danh mục và thương hiệu
    if (appliedCategories.length > 0 && appliedBrands.length > 0) {
      return "Danh sách nước hoa";
    }

    // Nếu chọn 1 danh mục
    if (appliedCategories.length === 1 && appliedBrands.length === 0) {
      const category = categories.find(c => c.categoryId === appliedCategories[0]);
      if (category) return category.name;
      return "Danh mục"; // Fallback
    }

    // Nếu chọn 1 thương hiệu
    if (appliedBrands.length === 1 && appliedCategories.length === 0) {
      const brand = brands.find(b => b.brandId === appliedBrands[0]);
      if (brand) return brand.name;
      return "Thương hiệu"; // Fallback
    }

    // Nếu chọn nhiều danh mục (không có thương hiệu)
    if (appliedCategories.length > 1 && appliedBrands.length === 0) {
      return "Danh mục";
    }

    // Nếu chọn nhiều thương hiệu (không có danh mục)
    if (appliedBrands.length > 1 && appliedCategories.length === 0) {
      return "Thương hiệu";
    }

    return "Danh sách nước hoa";
  };

  const getBreadcrumbs = () => {
    // Check URL params first (highest priority)
    const brandIdParam = searchParams.get("brandId");
    const categoryIdParam = searchParams.get("categoryId");
    
    // Nếu có categoryId trong URL
    if (categoryIdParam) {
      const categoryId = Number(categoryIdParam);
      const category = categories.find(c => c.categoryId === categoryId);
      if (category) {
        return [
          { label: "Trang chủ", path: "/" },
          { label: category.name },
        ];
      }
      return [
        { label: "Trang chủ", path: "/" },
        { label: "Danh mục" },
      ];
    }
    
    // Nếu có brandId trong URL
    if (brandIdParam) {
      const brandId = Number(brandIdParam);
      const brand = brands.find(b => b.brandId === brandId);
      if (brand) {
        return [
          { label: "Trang chủ", path: "/" },
          { label: brand.name },
        ];
      }
      return [
        { label: "Trang chủ", path: "/" },
        { label: "Thương hiệu" },
      ];
    }

    // Nếu không có filter nào (tất cả danh mục và tất cả thương hiệu)
    if (appliedCategories.length === 0 && appliedBrands.length === 0) {
      return [
        { label: "Trang chủ", path: "/" },
        { label: "Danh sách nước hoa" },
      ];
    }

    // Nếu lọc cả danh mục và thương hiệu
    if (appliedCategories.length > 0 && appliedBrands.length > 0) {
      return [
        { label: "Trang chủ", path: "/" },
        { label: "Danh sách nước hoa" },
      ];
    }

    // Nếu chọn 1 danh mục: "Trang chủ > {danh mục}"
    if (appliedCategories.length === 1 && appliedBrands.length === 0) {
      const category = categories.find(c => c.categoryId === appliedCategories[0]);
      if (category) {
        return [
          { label: "Trang chủ", path: "/" },
          { label: category.name },
        ];
      }
      return [
        { label: "Trang chủ", path: "/" },
        { label: "Danh mục" },
      ];
    }

    // Nếu chọn 1 thương hiệu: "Trang chủ > {thương hiệu}"
    if (appliedBrands.length === 1 && appliedCategories.length === 0) {
      const brand = brands.find(b => b.brandId === appliedBrands[0]);
      if (brand) {
        return [
          { label: "Trang chủ", path: "/" },
          { label: brand.name },
        ];
      }
      // Fallback nếu chưa load xong brands
      return [
        { label: "Trang chủ", path: "/" },
        { label: "Thương hiệu" },
      ];
    }

    // Nếu chọn nhiều danh mục (không có thương hiệu): "Trang chủ > Danh mục"
    if (appliedCategories.length > 1 && appliedBrands.length === 0) {
      return [
        { label: "Trang chủ", path: "/" },
        { label: "Danh mục" },
      ];
    }

    // Nếu chọn nhiều thương hiệu (không có danh mục): "Trang chủ > Thương hiệu"
    if (appliedBrands.length > 1 && appliedCategories.length === 0) {
      return [
        { label: "Trang chủ", path: "/" },
        { label: "Thương hiệu" },
      ];
    }

    // Mặc định: "Trang chủ > Danh mục"
    return [
      { label: "Trang chủ", path: "/" },
      { label: "Danh mục" },
    ];
  };

  // Check if all data is loaded - this ensures we wait for ALL data before showing page
  useEffect(() => {
    // Only check if we're in initial loading state
    if (!isInitialLoading) return;

    // Check if all loading states are false AND all data is present in state
    const allDataLoaded =
      !loadingBrands &&
      !loadingCategories &&
      !loadingPriceBounds &&
      !loadingInventories &&
      !loadingProducts &&
      brands.length > 0 &&
      categories.length > 0 &&
      (products.length > 0 || allProducts.length > 0) &&
      priceBoundsCache !== null;
    // Note: inventoryMap can be empty (size >= 0), that's ok

    if (allDataLoaded) {
      setIsInitialLoading(false);
    }
  }, [isInitialLoading, loadingBrands, loadingCategories, loadingPriceBounds, loadingInventories, loadingProducts, brands.length, categories.length, products.length, allProducts.length, priceBoundsCache]);

  // // Show loading screen only on initial load
  // if (isInitialLoading && !loadingProducts) {
  //   return (
  //     <div className="fixed z inset-0 bg-white z-50 flex items-center justify-center">
  //         <div className="bg-white p-8 flex flex-col items-center">
  //           <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
  //           <p className="text-gray-600 text-lg">Đang tải dữ liệu...</p>
  //           <p className="text-gray-400 text-sm mt-2">Vui lòng đợi trong giây lát</p>
  //         </div>
  //       </div>
  //   );
  // }

  if (error && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-red-600 px-4">
        <p className="text-xl font-semibold mb-2">Lỗi: {error}</p>
        <p className="text-gray-600">Vui lòng kiểm tra kết nối backend</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen relative">
      {/* Loading overlay when fetching products (filter/pagination) */}
      {loadingProducts && !isInitialLoading && (
        <div className="fixed  inset-0 bg-white z-[99999999] flex items-center justify-center">
          <div className="bg-white p-8 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 text-lg">Đang tải dữ liệu...</p>
            <p className="text-gray-400 text-sm mt-2">Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      )}

      <ProductsHeader
        title={getPageTitle()}
        breadcrumbs={getBreadcrumbs()}
        filterKey={`${appliedBrands.join(',')}-${appliedCategories.join(',')}-${appliedSearchQuery}-${sortBy}`}
        isLoading={loadingProducts && !isInitialLoading}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header - Outside of flex container */}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <motion.aside
            key={`sidebar-${appliedBrands.join(',')}-${appliedCategories.join(',')}-${appliedSearchQuery}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <ProductsSidebar
            categories={categories}
            brands={brands}
            priceBounds={priceBounds}
            priceRange={priceRange}
            selectedBrands={selectedBrands}
            selectedCategories={selectedCategories}
            selectedBrand={selectedBrand}
            selectedCategory={selectedCategory}
            brandSearchQuery={brandSearchQuery}
            onToggleBrand={toggleBrand}
            onToggleCategory={toggleCategory}
            onClearBrands={() => {
              setSelectedBrands([]);
              setSelectedBrand(null);
            }}
            onClearCategories={() => {
              setSelectedCategories([]);
              setSelectedCategory(null);
            }}
            onBrandSearchChange={setBrandSearchQuery}
            onPriceRangeChange={setPriceRange}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            hasPendingFilters={hasPendingFilters}
            hasActiveFilters={hasActiveFiltersWithPrice}
            isLoading={loadingProducts && !isInitialLoading}
          />
          </motion.aside>

          {/* Main Content */}
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            {/* Toolbar with Sort and Results Count */}
            <ProductsToolbar
              pageInfo={pageInfo}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {/* Products Grid */}
            <ProductsGrid
              products={products}
              inventoryMap={inventoryMap}
              brands={brands}
              hasActiveFilters={hasActiveFiltersWithPrice}
              onResetFilters={handleResetFilters}
              isLoading={loadingProducts}
            />

            {/* Pagination */}
            <ProductsPagination
              pageInfo={pageInfo}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              isLoading={loadingProducts && !isInitialLoading}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
