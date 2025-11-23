import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventories } from '../hooks/usePerfumes';
import { PerfumeCard } from '../components/PerfumeCard';
import { productService } from '../services/perfume.service';
import type { Brand, Category } from '../types';

export const Products = () => {
  const { inventories, loading, error } = useInventories();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBrandsAndCategories();
  }, []);

  const loadBrandsAndCategories = async () => {
    try {
      const [brandsRes, categoriesRes] = await Promise.all([
        productService.getAllBrands(),
        productService.getAllCategories(),
      ]);
      setBrands(brandsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Failed to load brands/categories:', err);
    }
  };

  // Filter và sort inventories
  const filteredInventories = inventories
    .filter((inv) => {
      if (selectedCategory && inv.product.category.categoryId !== selectedCategory) {
        return false;
      }
      if (selectedBrand && inv.product.brand.brandId !== selectedBrand) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return inv.product.name.toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.product.unitPrice - b.product.unitPrice;
        case 'price-desc':
          return b.product.unitPrice - a.product.unitPrice;
        case 'name':
          return a.product.name.localeCompare(b.product.name);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600 px-4">
        <p className="text-xl font-semibold mb-2">Lỗi: {error}</p>
        <p className="text-gray-600">
          Vui lòng kiểm tra kết nối backend tại http://localhost:8080
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto flex">
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
            <h3 className="text-base font-semibold mb-4 text-black">Thương hiệu</h3>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Tìm kiếm thương hiệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="space-y-3">
              <FilterOption
                label="Tất cả"
                checked={selectedBrand === null}
                onChange={() => setSelectedBrand(null)}
              />
              {brands.slice(0, 10).map((brand) => (
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
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200"
          >
            <div className="text-sm text-gray-600">
              <strong className="text-black">{filteredInventories.length}</strong> kết quả tìm kiếm
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Sắp xếp</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
              <option value="name">Tên A-Z</option>
            </select>
          </motion.div>

          {/* Products Grid */}
          <AnimatePresence mode="wait">
            {filteredInventories.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <i className="bi bi-inbox text-6xl text-gray-300 mb-4 block"></i>
                <h4 className="text-xl text-gray-600 mb-2">Không tìm thấy sản phẩm</h4>
                <p className="text-gray-500">Vui lòng thử lại với bộ lọc khác</p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredInventories.slice(0, 20).map((inventory, index) => (
                  <motion.div
                    key={inventory.inventoryId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PerfumeCard inventory={inventory} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

interface FilterOptionProps {
  label: string;
  checked: boolean;
  onChange: () => void;
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
