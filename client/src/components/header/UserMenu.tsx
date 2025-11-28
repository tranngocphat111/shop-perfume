import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";

interface UserMenuProps {
  isAuthenticated: boolean;
  user: { name: string; email: string; role: string } | null;
  showUserMenu: boolean;
  setShowUserMenu: (value: boolean) => void;
  isScrolled: boolean;
}

export const UserMenu = ({
  isAuthenticated,
  user,
  showUserMenu,
  setShowUserMenu,
  isScrolled,
}: UserMenuProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const textColor = isScrolled ? "text-gray-700" : "text-white";
  const hoverTextColor = isScrolled ? "hover:text-black" : "hover:text-gray-200";

  const handleLogout = () => {
    logout();
    navigate("/");
    setShowUserMenu(false);
  };

  return (
    <div className="relative user-menu-container">
      {isAuthenticated && user ? (
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
  );
};

