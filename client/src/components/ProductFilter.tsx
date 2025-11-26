import { useState, useEffect, useCallback } from "react";
import { useBrands } from "../hooks/useBrands";
import type { Category } from "../types";
import { productService } from "../services/perfume.service";

export interface FilterState {
  search: string;
  brandId: number | null;
  categoryId: number | null;
  sortBy: string;
  sortDirection: "ASC" | "DESC";
}

interface ProductFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

export const ProductFilter = ({ onFilterChange }: ProductFilterProps) => {
  const { brands, loading: brandsLoading } = useBrands();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    brandId: null,
    categoryId: null,
    sortBy: "productId",
    sortDirection: "DESC",
  });

  const [searchInput, setSearchInput] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productService.getAllCategories();
        setCategories(data || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        setFilters((prev) => ({ ...prev, search: value }));
      }, 500);

      setDebounceTimer(timer);
    },
    [debounceTimer]
  );

  // Notify parent when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-2">
            Tìm kiếm
          </label>
          <input
            type="text"
            id="search"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Nhập tên nước hoa..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        {/* Brand Filter */}
        <div>
          <label
            htmlFor="brand"
            className="block text-sm font-medium text-gray-700 mb-2">
            Thương hiệu
          </label>
          <select
            id="brand"
            value={filters.brandId || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                brandId: e.target.value ? Number(e.target.value) : null,
              }))
            }
            disabled={brandsLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100">
            <option value="">Tất cả thương hiệu</option>
            {brands.map((brand) => (
              <option key={brand.brandId} value={brand.brandId}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-2">
            Thể loại
          </label>
          <select
            id="category"
            value={filters.categoryId || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                categoryId: e.target.value ? Number(e.target.value) : null,
              }))
            }
            disabled={categoriesLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100">
            <option value="">Tất cả thể loại</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label
            htmlFor="sort"
            className="block text-sm font-medium text-gray-700 mb-2">
            Sắp xếp
          </label>
          <select
            id="sort"
            value={`${filters.sortBy}-${filters.sortDirection}`}
            onChange={(e) => {
              const [sortBy, sortDirection] = e.target.value.split("-");
              setFilters((prev) => ({
                ...prev,
                sortBy,
                sortDirection: sortDirection as "ASC" | "DESC",
              }));
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent">
            <option value="productId-DESC">Mới nhất</option>
            <option value="productId-ASC">Cũ nhất</option>
            <option value="name-ASC">Tên A-Z</option>
            <option value="name-DESC">Tên Z-A</option>
            <option value="unitPrice-ASC">Giá thấp đến cao</option>
            <option value="unitPrice-DESC">Giá cao đến thấp</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.search || filters.brandId || filters.categoryId) && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Bộ lọc đang áp dụng:</span>
          {filters.search && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-black text-white">
              Tìm: "{filters.search}"
              <button
                onClick={() => {
                  setSearchInput("");
                  setFilters((prev) => ({ ...prev, search: "" }));
                }}
                className="ml-2 hover:text-gray-300">
                ×
              </button>
            </span>
          )}
          {filters.brandId && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-black text-white">
              Thương hiệu:{" "}
              {brands.find((b) => b.brandId === filters.brandId)?.name}
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, brandId: null }))
                }
                className="ml-2 hover:text-gray-300">
                ×
              </button>
            </span>
          )}
          {filters.categoryId && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-black text-white">
              Thể loại:{" "}
              {
                categories.find((c) => c.categoryId === filters.categoryId)
                  ?.name
              }
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, categoryId: null }))
                }
                className="ml-2 hover:text-gray-300">
                ×
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setSearchInput("");
              setFilters({
                search: "",
                brandId: null,
                categoryId: null,
                sortBy: "productId",
                sortDirection: "DESC",
              });
            }}
            className="text-sm text-red-600 hover:text-red-800 underline">
            Xóa tất cả
          </button>
        </div>
      )}
    </div>
  );
};
