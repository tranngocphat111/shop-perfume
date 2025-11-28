import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { type UserInfo } from "../../services/user.service";

interface UserMenuProps {
  isAuthenticated: boolean;
  user: { name: string; email: string; role: string } | null;
  userInfo: UserInfo | null;
  showUserMenu: boolean;
  setShowUserMenu: (value: boolean) => void;
  isScrolled: boolean;
}

export const UserMenu = ({
  isAuthenticated,
  user,
  userInfo,
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
              className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1.5 z-50">
              <div className="px-3 py-2.5 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate mb-0.5">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate mb-2">
                  {user.email}
                </p>
                
                {/* Loyalty Points Display */}
                {userInfo && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-md">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                      <Coins size={12} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-900 leading-tight">
                        {userInfo.loyaltyPoints.toLocaleString('vi-VN')} điểm
                      </p>
                    </div>
                  </div>
                )}
                
                {user.role === "ADMIN" && (
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <Link
                to="/profile"
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setShowUserMenu(false)}>
                <i className="bi bi-person text-xs mr-2 w-4"></i> Thông tin cá nhân
              </Link>
              <Link
                to="/my-orders"
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setShowUserMenu(false)}>
                <i className="bi bi-bag text-xs mr-2 w-4"></i> Đơn hàng của tôi
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  to="/admin"
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowUserMenu(false)}>
                  <i className="bi bi-speedometer2 text-xs mr-2 w-4"></i> Quản trị
                </Link>
              )}
              <hr className="my-1 border-gray-100" />
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <i className="bi bi-box-arrow-right text-xs mr-2 w-4"></i> Đăng xuất
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

