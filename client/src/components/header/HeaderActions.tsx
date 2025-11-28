import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "../../contexts/CartContext";
import { UserMenu } from "./UserMenu";

interface HeaderActionsProps {
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
  setOpenDropdown: (value: string | null) => void;
  clearSearch: () => void;
  setSearchQuery: (value: string) => void;
  isAuthenticated: boolean;
  user: { name: string; email: string; role: string } | null;
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
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        isScrolled={isScrolled}
      />

      {/* Cart Icon with Badge */}
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
  );
};

