import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useBrands } from "../hooks/useBrands";

/**
 * NavLink Component - Dynamically styles links based on header scroll state.
 */
interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  isScrolled: boolean;
  isCompact?: boolean;
}

const NavLink = ({
  to,
  children,
  isScrolled,
  isCompact = false,
}: NavLinkProps) => (
  <Link
    to={to}
    className={`font-normal transition-all duration-300 relative group ${
      isCompact ? "text-sm" : "text-base"
    } ${
      isScrolled
        ? "text-gray-700 hover:text-black"
        : "text-white hover:text-gray-200"
    }`}>
    {children}
    <span
      className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full ${
        isScrolled ? "bg-black" : "bg-white"
      }`}></span>
  </Link>
);

/**
 * Header Component - Combines dynamic scrolling effects and auth management.
 */
export const Header = () => {
  const { getCartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const {
    brands: allBrands,
    groupedBrands,
    availableLetters,
    loading,
  } = useBrands();
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = getCartCount();
  const isHomePage = location.pathname === "/";

  // Scroll/Motion States (from V1)
  const [isScrolled, setIsScrolled] = useState(false); // Controls background color
  const [hasScrolled, setHasScrolled] = useState(false); // Controls shadow (only when scrolling)
  const [isCompact, setIsCompact] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [forceShowHeader, setForceShowHeader] = useState(false);

  // Menu/Dropdown States (from V1 and V2)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null); // "products", "brands", or null
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { scrollY } = useScroll();

  // Listen for add to cart event to force show header
  useEffect(() => {
    const handleAddToCart = () => {
      setForceShowHeader(true);
      setIsVisible(true);
      setIsScrolled(true); // Force white background
      // Reset after animation
      setTimeout(() => {
        setForceShowHeader(false);
      }, 1000);
    };

    window.addEventListener("addToCart", handleAddToCart);
    return () => window.removeEventListener("addToCart", handleAddToCart);
  }, []);

  // Scroll Effect Logic
  useMotionValueEvent(scrollY, "change", (latest) => {
    // Don't update visibility if header is forced to show
    if (forceShowHeader) {
      setLastScrollY(latest);
      return;
    }

    const isAtTop = latest < 50;
    const isScrollingDown = latest > lastScrollY;
    const firstScroll = latest > 100;
    const secondScroll = latest > 200;

    // Shadow only appears when scrolling (for both home and other pages)
    setHasScrolled(!isAtTop);

    // 1. Update background (transparent at top only on home page, always white on other pages)
    if (isHomePage) {
      setIsScrolled(!isAtTop);
    } else {
      setIsScrolled(true); // Always white on non-home pages
    }

    // 2. Compact header (smaller padding/font)
    setIsCompact(firstScroll);

    // 3. Hide header when scrolling down past a threshold
    if (secondScroll) {
      setIsVisible(!isScrollingDown);
    } else {
      setIsVisible(true);
    }

    setLastScrollY(latest);
  });

  // Reset header state when navigating to/from home page
  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(true);
      setHasScrolled(false); // No shadow initially on other pages
    } else {
      // Reset to transparent when returning to home page
      setIsScrolled(false);
      setHasScrolled(false);
      setIsCompact(false);
    }
  }, [isHomePage]);

  const handleLogout = () => {
    logout();
    navigate("/");
    setShowUserMenu(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // Simple logic to close menus on click outside. For production, use a ref.
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showUserMenu]);

  // Determine text color based on scroll state
  const textColor = isScrolled ? "text-gray-700" : "text-white";
  const hoverTextColor = isScrolled
    ? "hover:text-black"
    : "hover:text-gray-200";

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{
        y: isVisible ? 0 : -100,
        backgroundColor: isScrolled
          ? "rgba(255, 255, 255, 1)"
          : "rgba(255, 255, 255, 0)",
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 ${
        hasScrolled ? "shadow-md" : ""
      }`}
      // The backdropFilter logic is kept for potential future use, though currently 'none'
      style={{
        backdropFilter: isScrolled ? "blur(8px)" : "none",
        WebkitBackdropFilter: isScrolled ? "blur(8px)" : "none",
      }}>
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
          isCompact ? "py-0" : "py-3"
        }`}>
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => {
              if (location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="transition-all duration-300 hover:opacity-80">
            <img
              src={
                isScrolled
                  ? "https://res.cloudinary.com/piin/image/upload/v1763985017/logo/SPTN-BLACK.png"
                  : "https://res.cloudinary.com/piin/image/upload/v1763985017/logo/SPTN-WHITE.png"
              }
              alt="LAN Perfume Logo"
              className={`transition-all duration-300 ${
                isCompact ? "h-20 md:h-22" : "h-22 md:h-24"
              }`}
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link
              to="/"
              onClick={() => {
                if (location.pathname === "/") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className={`font-normal transition-all duration-300 relative group text-sm md:text-base ${
                isScrolled
                  ? "text-gray-700 hover:text-black"
                  : "text-white hover:text-gray-200"
              }`}>
              Trang chủ
              <span
                className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full ${
                  isScrolled ? "bg-black" : "bg-white"
                }`}></span>
            </Link>
            <NavLink to="/about" isScrolled={isScrolled} isCompact={isCompact}>
              Về SPTN Perfume
            </NavLink>

            {/* Dropdown: Bộ sưu tập nước hoa */}
            <div className="relative group">
              <button
                onMouseEnter={() => setOpenDropdown("products")}
                className={`transition-all font-normal duration-300 text-sm md:text-base ${textColor} ${hoverTextColor} flex items-center gap-1`}>
                Bộ sưu tập nước hoa
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
              </button>

              {openDropdown === "products" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onMouseEnter={() => setOpenDropdown("products")}
                  onMouseLeave={() => setOpenDropdown(null)}
                  className="absolute top-full left-0 mt-2 w-56 bg-white shadow-lg rounded-sm py-2 border border-gray-100 z-50">
                  <Link
                    to="/products"
                    onClick={() => setOpenDropdown(null)}
                    className="block font-normal px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors">
                    Tất cả sản phẩm
                  </Link>
                  <Link
                    to="/products?q=nam"
                    onClick={() => setOpenDropdown(null)}
                    className="block font-normal px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors">
                    Nước hoa nam
                  </Link>
                  <Link
                    to="/products?q=nữ"
                    onClick={() => setOpenDropdown(null)}
                    className="block font-normal px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors">
                    Nước hoa nữ
                  </Link>
                  <Link
                    to="/products?q=unisex"
                    onClick={() => setOpenDropdown(null)}
                    className="block font-normal px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors">
                    Nước hoa unisex
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Dropdown: Thương hiệu */}
            <div className="relative group">
              <button
                onMouseEnter={() => setOpenDropdown("brands")}
                className={`transition-all font-normal duration-300 text-sm md:text-base ${textColor} ${hoverTextColor} flex items-center gap-1`}>
                Thương hiệu
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
              </button>

              {openDropdown === "brands" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onMouseEnter={() => setOpenDropdown("brands")}
                  onMouseLeave={() => setOpenDropdown(null)}
                  className="fixed font-normal left-0 right-0 top-[80px] mx-auto w-[90vw] max-w-5xl bg-white shadow-2xl rounded-lg py-8 px-10 border border-gray-200 z-50">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">
                      Đang tải thương hiệu...
                    </div>
                  ) : (
                    <>
                      {/* Alphabet filter */}
                      <div className="flex flex-wrap justify-center gap-2 pb-5 border-b border-gray-200 mb-6">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedLetter(null);
                          }}
                          className={`px-4 py-2 text-sm rounded-full transition-colors font-normal ${
                            selectedLetter === null
                              ? "bg-black text-white"
                              : "border border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-700"
                          }`}>
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
                              className={`px-4 py-2 text-sm rounded-full transition-colors font-normal ${
                                selectedLetter === letter
                                  ? "bg-black text-white"
                                  : hasBrands
                                  ? "border border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-700"
                                  : "border border-gray-200 text-gray-300 cursor-not-allowed"
                              }`}>
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
                              const letterBrands =
                                (
                                  groupedBrands as Record<
                                    string,
                                    typeof allBrands
                                  >
                                )[letter] || [];
                              if (letterBrands.length === 0) return null;

                              return (
                                <div key={letter}>
                                  {/* Letter heading */}
                                  <h3 className="text-xl font-normal text-gray-900 mb-3">
                                    {letter}
                                  </h3>
                                  {/* Brands in 5 columns */}
                                  <div className="grid grid-cols-5 gap-x-8 gap-y-2">
                                    {letterBrands.map(
                                      (brand: (typeof allBrands)[0]) => (
                                        <Link
                                          key={brand.brandId}
                                          to={`/products?brandId=${brand.brandId}`}
                                          onClick={() => setOpenDropdown(null)}
                                          className="text-sm font-normal text-gray-800 hover:text-black hover:underline py-1.5 px-2 rounded hover:bg-gray-50 transition-colors">
                                          {brand.name}
                                        </Link>
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          // Show filtered brands by selected letter
                          <div className="grid grid-cols-5 gap-x-8 gap-y-3">
                            {(
                              (
                                groupedBrands as Record<
                                  string,
                                  typeof allBrands
                                >
                              )[selectedLetter] || []
                            ).map((brand: (typeof allBrands)[0]) => (
                              <Link
                                key={brand.brandId}
                                to={`/products?brandId=${brand.brandId}`}
                                onClick={() => setOpenDropdown(null)}
                                className="text-sm font-normal text-gray-800 hover:text-black hover:underline py-2 px-3 rounded hover:bg-gray-50 transition-colors">
                                {brand.name}
                              </Link>
                            ))}
                          </div>
                        )}

                        {selectedLetter !== null &&
                          (!(groupedBrands as Record<string, typeof allBrands>)[
                            selectedLetter
                          ] ||
                            (groupedBrands as Record<string, typeof allBrands>)[
                              selectedLetter
                            ].length === 0) && (
                            <div className="text-center py-8 text-gray-500">
                              Không có thương hiệu nào
                            </div>
                          )}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </div>

            <NavLink
              to="/contact"
              isScrolled={isScrolled}
              isCompact={isCompact}>
              Liên hệ
            </NavLink>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4 md:space-x-6">
            {/* Search Icon */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSearch(!showSearch)}
              className={`transition-colors p-2 rounded-full ${textColor} ${hoverTextColor}`}>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </motion.button>

            {/* User Menu / Login */}
            <div className="relative user-menu-container">
              {isAuthenticated && user ? (
                // Authenticated User Menu (from V2)
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`transition-colors p-2 rounded-full ${textColor} ${hoverTextColor}`}>
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </motion.button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                        {user.role === "ADMIN" && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}>
                        <i className="bi bi-person mr-2"></i> Thông tin cá nhân
                      </Link>
                      <Link
                        to="/my-orders"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}>
                        <i className="bi bi-bag mr-2"></i> Đơn hàng của tôi
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}>
                          <i className="bi bi-speedometer2 mr-2"></i> Quản trị
                        </Link>
                      )}
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <i className="bi bi-box-arrow-right mr-2"></i> Đăng xuất
                      </button>
                    </motion.div>
                  )}
                </>
              ) : (
                // Unauthenticated Login Link (adapted from V1/V2)
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/login"
                    className={`transition-colors p-2 rounded-full ${textColor} ${hoverTextColor}`}>
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Cart Icon with Badge (from V1 and V2) */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative">
              <Link
                to="/cart"
                className={`transition-colors rounded-full ${textColor} ${hoverTextColor}`}>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium">
                    {cartCount}
                  </motion.span>
                )}
              </Link>
            </motion.div>

            {/* Tra cứu đơn hàng Button */}
            <Link
              to="/my-orders"
              className={`px-4 py-2 rounded-full font-normal text-sm transition-all duration-300 ${
                isScrolled
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-white text-gray-900 hover:bg-gray-100"
              }`}
            >
              Tra cứu đơn hàng
            </Link>
          </div>
        </div>

        {/* Search Bar - appears below header when clicked */}
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 mt-2 overflow-hidden ">
            <div className="max-w-3xl mx-auto py-4 px-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      navigate(`/products?q=${searchQuery.trim()}`);
                      setShowSearch(false);
                      setSearchQuery("");
                    }
                  }}
                  placeholder="Tìm kiếm nước hoa, thương hiệu..."
                  className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:outline-none transition-shadow"
                  autoFocus
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};
