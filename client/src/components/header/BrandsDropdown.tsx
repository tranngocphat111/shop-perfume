import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useProductsFilter } from "../../contexts/ProductsFilterContext";

interface Brand {
  brandId: number;
  name: string;
}

interface BrandsDropdownProps {
  allBrands: Brand[];
  groupedBrands: Record<string, Brand[]>;
  availableLetters: string[];
  loading: boolean;
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isScrolled: boolean;
  isCompact: boolean;
}

export const BrandsDropdown = ({
  allBrands,
  groupedBrands,
  availableLetters,
  loading,
  isOpen,
  onMouseEnter,
  onMouseLeave,
  isScrolled,
  isCompact,
}: BrandsDropdownProps) => {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { resetFilters } = useProductsFilter();

  const textColor = isScrolled ? "text-gray-700" : "text-white";
  const hoverTextColor = isScrolled
    ? "hover:text-black"
    : "hover:text-gray-200";

  return (
    <div
      className="relative group"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Link
        to="/products"
        onClick={(e) => {
          // Reset filters directly from context when clicking on "Thương hiệu"
          // Try to get priceBounds from sessionStorage if available
          let priceBounds: [number, number] | null = null;
          try {
            const cached = sessionStorage.getItem(
              "products_cache_price_bounds"
            );
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
        className={`transition-all font-normal duration-300 text-sm md:text-base ${textColor} ${hoverTextColor} flex items-center gap-1`}
      >
        Thương hiệu
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
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
            <div className="absolute top-full left-0 right-0 h-4" />
            <motion.div
              key="brands-dropdown"
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.96 }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 30,
                mass: 0.9,
              }}
              className="fixed font-normal left-0 right-0 mt-4 mx-auto w-[90vw] max-w-5xl bg-white backdrop-blur-md shadow-md rounded-sm py-8 px-10 border border-gray-200/50 z-50"
            >
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Đang tải thương hiệu...
                </div>
              ) : (
                <>
                  {/* Alphabet filter */}
                  <div className="flex flex-nowrap justify-start gap-1.5 pb-5 border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide min-w-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedLetter(null);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-full transition-colors font-normal whitespace-nowrap flex-shrink-0 ${
                        selectedLetter === null
                          ? "bg-black text-white"
                          : "border border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-700"
                      }`}
                    >
                      All
                    </button>
                    {[
                      "A",
                      "B",
                      "C",
                      "D",
                      "E",
                      "F",
                      "G",
                      "H",
                      "I",
                      "J",
                      "K",
                      "L",
                      "M",
                      "N",
                      "O",
                      "P",
                      "Q",
                      "R",
                      "S",
                      "T",
                      "U",
                      "V",
                      "W",
                      "X",
                      "Y",
                      "Z",
                    ].map((letter) => {
                      const hasBrands = availableLetters.includes(letter);
                      return (
                        <button
                          key={letter}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (hasBrands) {
                              setSelectedLetter(letter);
                            }
                          }}
                          disabled={!hasBrands}
                          className={`w-7 h-7 text-xs rounded-full transition-colors font-normal flex items-center justify-center flex-shrink-0 ${
                            selectedLetter === letter
                              ? "bg-black text-white"
                              : hasBrands
                              ? "border border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-700"
                              : "border border-gray-200 text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>

                  {/* Brand list */}
                  <div className="max-h-[350px] overflow-y-auto pr-2">
                    {selectedLetter === null ? (
                      // Show all brands grouped by letter when "All" is selected
                      <div className="space-y-6">
                        {availableLetters.sort().map((letter) => {
                          const letterBrands = groupedBrands[letter] || [];
                          if (letterBrands.length === 0) return null;

                          return (
                            <div key={letter}>
                              {/* Letter heading */}
                              <h3 className="text-xl font-normal text-gray-900 mb-3">
                                {letter}
                              </h3>
                              {/* Brands in 5 columns */}
                              <div className="grid grid-cols-5 gap-x-8 gap-y-2">
                                {letterBrands.map((brand: Brand) => (
                                  <Link
                                    key={brand.brandId}
                                    to={`/products?brandId=${brand.brandId}`}
                                    onClick={() => onMouseLeave()}
                                    className="text-sm font-normal text-gray-800 hover:text-black hover:underline py-1.5 px-2 rounded hover:bg-gray-50 transition-colors"
                                  >
                                    {brand.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Show filtered brands by selected letter
                      <div className="grid grid-cols-5 gap-x-8 gap-y-3">
                        {(groupedBrands[selectedLetter] || []).map(
                          (brand: Brand) => (
                            <Link
                              key={brand.brandId}
                              to={`/products?brandId=${brand.brandId}`}
                              onClick={() => onMouseLeave()}
                              className="text-sm font-normal text-gray-800 hover:text-black hover:underline py-2 px-3 rounded hover:bg-gray-50 transition-colors"
                            >
                              {brand.name}
                            </Link>
                          )
                        )}
                      </div>
                    )}

                    {selectedLetter !== null &&
                      (!groupedBrands[selectedLetter] ||
                        groupedBrands[selectedLetter].length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          Không có thương hiệu nào
                        </div>
                      )}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
