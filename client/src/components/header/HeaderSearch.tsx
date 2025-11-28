import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect } from "react";
import { useSearch } from "../../contexts/SearchContext";
import { getPrimaryImageUrl, formatCurrency } from "../../utils/helpers";

interface HeaderSearchProps {
  showSearch: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  setShowSearch: (value: boolean) => void;
  isScrolled: boolean;
  isCompact: boolean;
  isSearchInputFocused: boolean;
  setIsSearchInputFocused: (value: boolean) => void;
  isVisible: boolean;
}

export const HeaderSearch = ({
  showSearch,
  searchQuery,
  setSearchQuery,
  setShowSearch,
  isScrolled,
  isCompact,
  isSearchInputFocused,
  setIsSearchInputFocused,
  isVisible,
}: HeaderSearchProps) => {
  const navigate = useNavigate();
  const { searchProducts, searchResults, isLoading: isSearchLoading, totalResults, clearSearch } = useSearch();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Listen for clearSearch event (when filters are applied)
  useEffect(() => {
    const handleClearSearch = () => {
      setSearchQuery("");
      clearSearch();
      setShowSearch(false);
      setIsSearchInputFocused(false);
    };
    window.addEventListener('clearSearch', handleClearSearch);
    return () => window.removeEventListener('clearSearch', handleClearSearch);
  }, [setSearchQuery, clearSearch, setShowSearch, setIsSearchInputFocused]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() && showSearch) {
        searchProducts(searchQuery);
      } else if (!searchQuery.trim()) {
        clearSearch();
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, showSearch, searchProducts, clearSearch]);

  // Blur input when header is hidden
  useEffect(() => {
    if (!isVisible && showSearch) {
      // Blur input if it's focused
      if (searchInputRef.current && document.activeElement === searchInputRef.current) {
        searchInputRef.current.blur();
      }
    }
  }, [isVisible, showSearch]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }}
      className="hidden lg:flex flex-1 justify-center items-center mx-6 relative z-50"
    >
      <div ref={searchContainerRef} className={`w-full transition-all duration-300 ${isCompact ? 'max-w-xl' : 'max-w-2xl'} relative group`}>
        
        {/* Search Input Container */}
        <div className="relative rounded-full transition-all duration-300 group">
          {/* Search Icon Left */}
          <svg
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
              isCompact ? "w-4 h-4" : "w-5 h-5"
            } ${
              !isScrolled 
                ? "text-white/70 group-focus-within:text-gray-500" 
                : "text-gray-400 group-focus-within:text-gray-500"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          
          <input
            ref={searchInputRef}
            name="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                navigate(`/products?q=${searchQuery.trim()}`);
                setShowSearch(false);
                setSearchQuery("");
                clearSearch();
              }
            }}
            onFocus={() => {
              setIsSearchInputFocused(true);
              if (searchQuery.trim()) searchProducts(searchQuery);
            }}
            onBlur={(e) => {
              // Close dropdown when input loses focus
              setTimeout(() => {
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (!searchContainerRef.current?.contains(relatedTarget)) {
                  setIsSearchInputFocused(false);
                  clearSearch();
                }
              }, 200);
            }}
            placeholder="Tìm kiếm"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className={`w-full rounded-full border px-10 transition-all duration-300 focus:outline-none 
              ${isCompact ? "py-2 text-sm" : "py-3 text-base"}
              ${
                !isScrolled 
                  ? "bg-white/10 border-white/30 text-white placeholder-white/70 focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 focus:border-transparent" 
                  : "bg-gray-50  border-gray-200 text-gray-800 placeholder-gray-400 focus:bg-white"
              }
               focus:shadow-md 
            `}
            autoFocus
            style={{ fontFamily: "var(--font-family-base)" }}
          />

          {/* Clear/Close Button */}
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
              clearSearch();
            }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all duration-200 group-focus-within:text-gray-500   ${
                !isScrolled ? "text-white/70 hover:text-white hover:bg-white/20 group-focus-within:hover:bg-gray-200" : "text-gray-500 hover:text-gray-500 hover:bg-gray-100 hover:focus:bg-gray-200"
            }`}
          >
            <svg className={`${isCompact ? "w-4 h-4" : "w-5 h-5"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {searchQuery.trim() && isSearchInputFocused && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
            >
              {isSearchLoading ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-black mb-2"></div>
                  <p className="text-sm font-medium tracking-wide uppercase">Đang tìm kiếm</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="flex flex-col">
                  <div className="px-5 py-2.5 border-b border-gray-50 bg-gray-50/50">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sản phẩm gợi ý</span>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar py-1 px-4">
                    {searchResults.slice(0, 4).map((product) => (
                      <Link
                        key={product.productId}
                        to={`/products/${product.productId}`}
                        onClick={() => {
                          setShowSearch(false);
                          setSearchQuery("");
                          clearSearch();
                          setIsSearchInputFocused(false);
                        }}
                        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200 mb-1 last:mb-0"
                      >
                        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-white border border-gray-100 group-hover:border-gray-200 transition-colors flex-shrink-0">
                          <img
                            src={getPrimaryImageUrl(product)}
                            alt={product.name}
                            className="w-full h-full object-cover mix-blend-multiply"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="text-base font-medium text-gray-900 truncate group-hover:text-black transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5 truncate">
                            {product.brand.name}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 pl-2">
                          {product.unitPrice > 0 ? (
                            <span className="text-base font-semibold text-gray-900">
                              {formatCurrency(product.unitPrice)}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                              Liên hệ
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {totalResults > 4 && (
                    <Link
                      to={`/products?q=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery("");
                        clearSearch();
                        setIsSearchInputFocused(false);
                      }}
                      className="block py-3 text-center text-sm font-semibold text-gray-600 hover:text-black hover:bg-gray-50 border-t border-gray-100 transition-colors"
                    >
                      Xem tất cả <span className="font-bold">{totalResults}</span> kết quả
                    </Link>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-base text-gray-900 font-medium">Không tìm thấy kết quả</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

