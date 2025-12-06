import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode } from "react";

interface ProductsFilterState {
  // Applied filters (used for API calls)
  appliedBrands: number[];
  appliedCategories: number[];
  appliedSearchQuery: string;
  appliedPriceRange: [number, number] | null;
  sortBy: string;

  // Temporary filter states (UI only, not applied until button click)
  selectedBrands: number[];
  selectedCategories: number[];
  searchQuery: string;
  priceRange: [number, number] | null;
  brandSearchQuery: string;

  // Legacy support for URL params (single selection)
  selectedBrand: number | null;
  selectedCategory: number | null;

  // Current page
  currentPage: number;
}

interface ProductsFilterContextType extends ProductsFilterState {
  // Setters for applied filters
  setAppliedBrands: (brands: number[] | ((prev: number[]) => number[])) => void;
  setAppliedCategories: (
    categories: number[] | ((prev: number[]) => number[])
  ) => void;
  setAppliedSearchQuery: (query: string) => void;
  setAppliedPriceRange: (
    range:
      | [number, number]
      | null
      | ((prev: [number, number] | null) => [number, number] | null)
  ) => void;
  setSortBy: (sortBy: string) => void;

  // Setters for temporary filters
  setSelectedBrands: (
    brands: number[] | ((prev: number[]) => number[])
  ) => void;
  setSelectedCategories: (
    categories: number[] | ((prev: number[]) => number[])
  ) => void;
  setSearchQuery: (query: string) => void;
  setPriceRange: (
    range:
      | [number, number]
      | null
      | ((prev: [number, number] | null) => [number, number] | null)
  ) => void;
  setBrandSearchQuery: (query: string) => void;

  // Setters for legacy
  setSelectedBrand: (brand: number | null) => void;
  setSelectedCategory: (category: number | null) => void;

  // Setter for current page
  setCurrentPage: (page: number | ((prev: number) => number)) => void;

  // Actions
  applyFilters: () => void;
  resetFilters: (priceBounds?: [number, number] | null) => void;
  hasActiveFilters: boolean;
  hasPendingFilters: boolean;
}

const ProductsFilterContext = createContext<
  ProductsFilterContextType | undefined
>(undefined);

const FILTER_STORAGE_KEY = "products_filter_state";

// Helper to save to sessionStorage
const saveFiltersToStorage = (state: ProductsFilterState) => {
  try {
    sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save filters to storage:", err);
  }
};

export const ProductsFilterProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [appliedBrands, setAppliedBrands] = useState<number[]>([]);
  const [appliedCategories, setAppliedCategories] = useState<number[]>([]);
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [appliedPriceRange, setAppliedPriceRange] = useState<
    [number, number] | null
  >(null);
  const [sortBy, setSortBy] = useState("newest");

  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [brandSearchQuery, setBrandSearchQuery] = useState("");

  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(0);

  // Flag to prevent saving on initial mount (let Products.tsx restore first)
  const [isInitialized, setIsInitialized] = useState(false);

  // Don't auto-load from storage on mount
  // Let Products.tsx handle restoration from URL or storage
  // useEffect(() => {
  //   const saved = loadFiltersFromStorage();
  //   if (saved.appliedBrands) setAppliedBrands(saved.appliedBrands);
  //   if (saved.appliedCategories) setAppliedCategories(saved.appliedCategories);
  //   if (saved.appliedSearchQuery) setAppliedSearchQuery(saved.appliedSearchQuery);
  //   if (saved.appliedPriceRange) setAppliedPriceRange(saved.appliedPriceRange);
  //   if (saved.sortBy) setSortBy(saved.sortBy);
  //   if (saved.currentPage !== undefined) setCurrentPage(saved.currentPage);
  // }, []);

  // Mark as initialized after first render (allow Products.tsx to restore first)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Save to storage whenever any filter state changes (skip on initial mount)
  useEffect(() => {
    if (!isInitialized) {
      console.log("⏸️ Skipping save: not initialized yet");
      return;
    }

    const state: ProductsFilterState = {
      appliedBrands,
      appliedCategories,
      appliedSearchQuery,
      appliedPriceRange,
      sortBy,
      selectedBrands,
      selectedCategories,
      searchQuery,
      priceRange,
      brandSearchQuery,
      selectedBrand,
      selectedCategory,
      currentPage,
    };
    console.log("💾 Saving filters to storage:", state);
    saveFiltersToStorage(state);
  }, [
    isInitialized,
    appliedBrands,
    appliedCategories,
    appliedSearchQuery,
    appliedPriceRange,
    sortBy,
    selectedBrands,
    selectedCategories,
    searchQuery,
    priceRange,
    brandSearchQuery,
    selectedBrand,
    selectedCategory,
    currentPage,
  ]);

  // Apply filters action
  const applyFilters = useCallback(() => {
    setAppliedBrands([...selectedBrands]);
    setAppliedCategories([...selectedCategories]);

    // When filtering by brands or categories, clear search query
    // Filters should work on the full product list, not on search results
    if (selectedBrands.length > 0 || selectedCategories.length > 0) {
      setAppliedSearchQuery("");
      setSearchQuery(""); // Also clear the temporary search query
    } else {
      // Only keep search query if no brands/categories are selected
      setAppliedSearchQuery(searchQuery);
    }

    if (priceRange !== null) {
      setAppliedPriceRange([...priceRange]);
    }
    setCurrentPage(0);
  }, [selectedBrands, selectedCategories, searchQuery, priceRange]);

  // Reset filters action
  const resetFilters = useCallback(
    (priceBounds?: [number, number] | null) => {
      // Reset all filter states
      setSelectedBrand(null);
      setSelectedBrands([]);
      setAppliedBrands([]);
      setSelectedCategory(null);
      setSelectedCategories([]);
      setAppliedCategories([]);
      setSearchQuery("");
      setAppliedSearchQuery("");
      setBrandSearchQuery("");

      // Reset price range - if priceBounds provided, reset to full range, otherwise null
      if (
        priceBounds !== null &&
        priceBounds !== undefined &&
        priceBounds.length === 2
      ) {
        setPriceRange([priceBounds[0], priceBounds[1]]);
        setAppliedPriceRange([priceBounds[0], priceBounds[1]]);
      } else {
        setPriceRange(null);
        setAppliedPriceRange(null);
      }

      // Reset sort to default (newest)
      setSortBy("newest");

      // Reset to first page
      setCurrentPage(0);
    },
    [
      setSelectedBrand,
      setSelectedBrands,
      setAppliedBrands,
      setSelectedCategory,
      setSelectedCategories,
      setAppliedCategories,
      setSearchQuery,
      setAppliedSearchQuery,
      setBrandSearchQuery,
      setPriceRange,
      setAppliedPriceRange,
      setSortBy,
      setCurrentPage,
    ]
  );

  // Check if any filters are active
  // Note: priceRange is considered active only if it's different from bounds (filtered)
  // We need to check this in the component that has access to priceBounds
  const hasActiveFilters = useMemo(() => {
    return (
      appliedBrands.length > 0 ||
      appliedCategories.length > 0 ||
      appliedSearchQuery !== "" ||
      sortBy !== "newest"
    ); // "newest" is the default, so it's not considered an active filter
    // Note: appliedPriceRange check is done in Products component where priceBounds is available
  }, [
    appliedBrands.length,
    appliedCategories.length,
    appliedSearchQuery,
    sortBy,
  ]);

  // Check if there are pending filter changes
  const hasPendingFilters = useMemo(() => {
    return (
      JSON.stringify(selectedBrands.sort()) !==
        JSON.stringify(appliedBrands.sort()) ||
      JSON.stringify(selectedCategories.sort()) !==
        JSON.stringify(appliedCategories.sort()) ||
      searchQuery !== appliedSearchQuery ||
      (priceRange !== null &&
        appliedPriceRange !== null &&
        (priceRange[0] !== appliedPriceRange[0] ||
          priceRange[1] !== appliedPriceRange[1])) ||
      (priceRange !== null && appliedPriceRange === null)
    );
  }, [
    selectedBrands,
    appliedBrands,
    selectedCategories,
    appliedCategories,
    searchQuery,
    appliedSearchQuery,
    priceRange,
    appliedPriceRange,
  ]);

  const value: ProductsFilterContextType = {
    // State
    appliedBrands,
    appliedCategories,
    appliedSearchQuery,
    appliedPriceRange,
    sortBy,
    selectedBrands,
    selectedCategories,
    searchQuery,
    priceRange,
    brandSearchQuery,
    selectedBrand,
    selectedCategory,
    currentPage,

    // Setters
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

    // Actions
    applyFilters,
    resetFilters,
    hasActiveFilters,
    hasPendingFilters,
  };

  return (
    <ProductsFilterContext.Provider value={value}>
      {children}
    </ProductsFilterContext.Provider>
  );
};

export const useProductsFilter = () => {
  const context = useContext(ProductsFilterContext);
  if (!context) {
    throw new Error(
      "useProductsFilter must be used within a ProductsFilterProvider"
    );
  }
  return context;
};
