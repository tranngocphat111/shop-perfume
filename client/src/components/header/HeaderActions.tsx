import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../../contexts/CartContext";
import { UserMenu } from "./UserMenu";
import { type UserInfo } from "../../services/user.service";

interface HeaderActionsProps {
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
  setOpenDropdown: (value: string | null) => void;
  clearSearch: () => void;
  setSearchQuery: (value: string) => void;
  isAuthenticated: boolean;
  user: { name: string; email: string; role: string } | null;
  userInfo: UserInfo | null;
  showUserMenu: boolean;
  setShowUserMenu: (value: boolean) => void;
  isScrolled: boolean;
}

export const HeaderActions = ({
  showSearch,
  setShowSearch,
  setOpenDropdown,
  clearSearch,
  setSearchQuery,
  isAuthenticated,
  user,
  userInfo,
  showUserMenu,
  setShowUserMenu,
  isScrolled,
}: HeaderActionsProps) => {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  const textColor = isScrolled ? "text-gray-700" : "text-white";
  const hoverTextColor = isScrolled ? "hover:text-black" : "hover:text-gray-200";

  return (
    <div className="flex items-center space-x-4 md:space-x-6">
      {/* Search Icon */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setShowSearch(!showSearch);
          setOpenDropdown(null); // Close any open dropdowns
          if (!showSearch) {
            // Opening search, clear previous results
            clearSearch();
          } else {
            // Closing search
            setSearchQuery("");
            clearSearch();
          }
        }}
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
      <UserMenu
        isAuthenticated={isAuthenticated}
        user={user}
        userInfo={userInfo}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        isScrolled={isScrolled}
      />

      {/* Cart Icon with Badge */}


      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setShowSearch(!showSearch);
          setOpenDropdown(null); // Close any open dropdowns
          if (!showSearch) {
            // Opening search, clear previous results
            clearSearch();
          } else {
            // Closing search
            setSearchQuery("");
            clearSearch();
          }
        }}
        className={`transition-colors p-2 rounded-full ${textColor} ${hoverTextColor}`}>
       <Link
          to="/cart"
          className={`transition-colors p-2 rounded-full ${textColor} ${hoverTextColor} flex items-center justify-center`}>
          <div className="relative">
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
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="absolute -top-2 -right-2 pointer-events-none">
                  <span
                    className="flex items-center justify-center h-4 min-w-[16px] px-[3px] rounded-full bg-black text-white text-[9px] font-bold ring-2 ring-white leading-none shadow-sm"
                    style={{ fontFamily: "var(--font-family-sans)" }}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>
        
      </motion.button>

      {/* Tra cứu đơn hàng Button */}
      <Link
        to="/my-orders"
        className={`overflow-hidden btn-slide-overlay-dark relative px-4 py-2 rounded-full font-normal text-sm transition-all duration-300 ${isScrolled
            ? "bg-black text-white hover:bg-gray-800"
            : " bg-white text-gray-900 hover:bg-gray-100"
          }`}
      >
        <span className="relative z-10"> Tra cứu đơn hàng</span>
      </Link>
    </div>
  );
};

