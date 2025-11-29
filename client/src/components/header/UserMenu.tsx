import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
    <div 
      className="relative user-menu-container"
      onMouseEnter={() => setShowUserMenu(true)}
      onMouseLeave={() => setShowUserMenu(false)}
    >
      {isAuthenticated && user ? (
        <>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
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
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                
                {/* User Info Section */}
                <div className="px-3 pt-3 pb-2.5 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-900 truncate mb-0.5">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate mb-2">
                    {user.email}
                  </p>
                  
                  {/* Loyalty Points Display */}
                  {userInfo && (
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200/50 rounded-md">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                        <Coins size={12} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-amber-900 leading-tight">
                          {userInfo.loyaltyPoints.toLocaleString('vi-VN')} điểm
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Admin Badge */}
                  {user.role === "ADMIN" && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-0.5 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-200/50">
                        Admin
                      </span>
                    </div>
                  )}
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate("/profile", { state: { activeTab: "account" } });
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className="font-medium hover:text-gray-900">Thông tin tài khoản</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate("/profile", { state: { activeTab: "orders" } });
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className="font-medium hover:text-gray-900">Đơn hàng của tôi</span>
                  </button>
                  
                  {user.role === "ADMIN" && (
                    <Link
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                      <span className="font-medium hover:text-gray-900">Quản trị</span>
                    </Link>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100"></div>

                {/* Logout Button */}
                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <span className="hover:text-red-700">Đăng xuất</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

