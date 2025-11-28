import { useLocation } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useBrands } from "../hooks/useBrands";
import { useCategories } from "../hooks/useCategories";
import { useSearch } from "../contexts/SearchContext";
import { HeaderLogo } from "./header/HeaderLogo";
import { HeaderNavigation } from "./header/HeaderNavigation";
import { HeaderSearch } from "./header/HeaderSearch";
import { HeaderActions } from "./header/HeaderActions";

/**
 * Header Component - Combines dynamic scrolling effects and auth management.
 */
export const Header = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    brands: allBrands,
    groupedBrands,
    availableLetters,
    loading: brandsLoading,
  } = useBrands();
  const { categories } = useCategories();
  const { clearSearch } = useSearch();
  const location = useLocation();

  const isHomePage = location.pathname === "/";

  // Scroll/Motion States
  const [isScrolled, setIsScrolled] = useState(false); // Controls background color
  const [hasScrolled, setHasScrolled] = useState(false); // Controls shadow (only when scrolling)
  const [isCompact, setIsCompact] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [forceShowHeader, setForceShowHeader] = useState(false);

  // Menu/Dropdown States
  const [openDropdown, setOpenDropdown] = useState<string | null>(null); // "products", "brands", or null
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);
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
    const firstScroll = latest > 100; // Compact threshold
    const secondScroll = latest > 200; // Hide/show threshold

    // Shadow only appears when scrolling (for both home and other pages)
    setHasScrolled(!isAtTop);

    // 1. Update background (transparent at top only on home page, always white on other pages)
    if (isHomePage) {
      setIsScrolled(!isAtTop); // Change color at 50px
    } else {
      setIsScrolled(true); // Always white on non-home pages
    }

    // 2. Compact header (smaller padding/font) - happens at 100px
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
      setIsCompact(false); // Always start not compact, need to scroll to compact
    } else {
      // Reset to transparent when returning to home page
      setIsScrolled(false);
      setHasScrolled(false);
      setIsCompact(false);
    }
    setLastScrollY(window.scrollY);
  }, [isHomePage]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showUserMenu]);

  // Close search when pressing ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showSearch) {
        setShowSearch(false);
        setSearchQuery("");
        clearSearch();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showSearch, clearSearch]);

  // Close search and blur input when header is hidden
  useEffect(() => {
    if (!isVisible && showSearch) {
      // Blur input if it's focused - this needs to be handled in HeaderSearch component
      // Reset focus state
      setIsSearchInputFocused(false);
      // Close search
      setShowSearch(false);
      setSearchQuery("");
      clearSearch();
    }
  }, [isVisible, showSearch, clearSearch]);

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
          <HeaderLogo isScrolled={isScrolled} isCompact={isCompact} />

          {/* Navigation and Search Bar - Animated */}
          <AnimatePresence mode="wait">
            {!showSearch && (
              <HeaderNavigation
                key="navigation"
                categories={categories}
                allBrands={allBrands}
                groupedBrands={groupedBrands}
                availableLetters={availableLetters}
                brandsLoading={brandsLoading}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                showSearch={showSearch}
                isScrolled={isScrolled}
                isCompact={isCompact}
              />
            )}

            {showSearch && (
              <HeaderSearch
                key="search"
                showSearch={showSearch}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                setShowSearch={setShowSearch}
                isScrolled={isScrolled}
                isCompact={isCompact}
                isSearchInputFocused={isSearchInputFocused}
                setIsSearchInputFocused={setIsSearchInputFocused}
                isVisible={isVisible}
              />
            )}
          </AnimatePresence>

          {/* Actions */}
          <HeaderActions
            showSearch={showSearch}
            setShowSearch={setShowSearch}
            setOpenDropdown={setOpenDropdown}
            clearSearch={clearSearch}
            setSearchQuery={setSearchQuery}
            isAuthenticated={isAuthenticated}
            user={user}
            showUserMenu={showUserMenu}
            setShowUserMenu={setShowUserMenu}
            isScrolled={isScrolled}
          />
        </div>
      </div>
    </motion.header>
  );
};
