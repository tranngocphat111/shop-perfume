import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useProductsFilter } from "../../contexts/ProductsFilterContext";

interface CategoriesDropdownProps {
  categories: Array<{ categoryId: number; name: string }>;
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isScrolled: boolean;
  isCompact: boolean;
}

export const CategoriesDropdown = ({
  categories,
  isOpen,
  onMouseEnter,
  onMouseLeave,
  isScrolled,
  isCompact,
}: CategoriesDropdownProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetFilters } = useProductsFilter();

  const textColor = isScrolled ? "text-gray-700" : "text-white";
  const hoverTextColor = isScrolled ? "hover:text-black" : "hover:text-gray-200";

  return (
    <div
      className="relative group "
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Link
        to="/products"
        onClick={(e) => {
          // Reset filters directly from context when clicking on "Danh mục"
          // Try to get priceBounds from sessionStorage if available
          let priceBounds: [number, number] | null = null;
          try {
            const cached = sessionStorage.getItem('products_cache_price_bounds');
            if (cached) {
              priceBounds = JSON.parse(cached);
            }
          } catch (err) {
            // Ignore error, use null
          }
          
          // Reset filters in context
          resetFilters(priceBounds);
          
          // Always navigate to /products without params
          if (location.pathname === "/products") {
            e.preventDefault();
            // Force navigation to /products without params
            navigate("/products", { replace: true });
          }
          // Otherwise, let Link handle navigation normally
        }}
        className={`transition-all font-normal duration-300 text-sm md:text-base ${textColor} ${hoverTextColor} flex items-center gap-1`}>
        Danh mục
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Link>

      {/* Bridge element to connect parent and dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="absolute top-full left-0 w-full h-4" />
            <motion.div
              key="products-dropdown"
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.96 }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 30,
                mass: 0.9
              }}
              className="absolute top-full left-0 mt-4 w-52 bg-white shadow-md rounded-sm py-3 p-2 border border-gray-200/50 z-50">
              {categories.map((category) => (
                <Link
                  key={category.categoryId}
                  to={`/products?categoryId=${category.categoryId}`}
                  onClick={() => {
                    onMouseLeave();
                  }}
                  className="block font-normal px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors">
                  {category.name}
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

