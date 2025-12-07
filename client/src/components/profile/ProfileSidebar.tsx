import { motion } from "framer-motion";
import { useAuth } from "@contexts/AuthContext";

interface ProfileSidebarProps {
  active: string;
  onChange: (tab: string) => void;
}

interface MenuItem {
  label: string;
  key: string;
  onClick?: () => void;
  isLogout?: boolean;
}

export const ProfileSidebar = ({ active, onChange }: ProfileSidebarProps) => {
  const { logout } = useAuth();

  const menuItems: MenuItem[] = [
    {
      label: "Thông tin tài khoản",
      key: "account",
    },
    {
      label: "Địa chỉ giao hàng",
      key: "addresses",
    },
    {
      label: "Quản lý đơn hàng",
      key: "orders",
    },
    {
      label: "Đổi mật khẩu",
      key: "password",
    },
    {
      label: "Đăng xuất",
      key: "logout",
      isLogout: true,
      onClick: async () => {
        try {
          await logout("/");
        } catch (error) {
          console.error("Logout error:", error);
          localStorage.removeItem("user_info");
          window.location.href = "/";
        }
      },
    },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      <div className="p-2">
        {menuItems.map((item, index) => {
          const isActive = active === item.key;
          const isLogout = item.isLogout;

          return (
            <motion.button
              key={item.key}
              type="button"
              onClick={item.onClick || (() => onChange(item.key))}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              transition={{
                x: { type: "spring", stiffness: 400, damping: 25 },
                scale: { duration: 0.1 },
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg relative transition-all duration-200 ${
                isActive
                  ? isLogout
                    ? "bg-red-50 text-red-700"
                    : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900"
                  : isLogout
                  ? "text-red-600 hover:bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {/* Active indicator bar */}
              {isActive && !isLogout && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-400 to-gray-600 rounded-r-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              {/* Label */}
              <span
                className={`flex-1 text-left font-medium text-sm ${
                  isActive
                    ? isLogout
                      ? "text-red-700"
                      : "text-gray-900"
                    : isLogout
                    ? "text-red-600"
                    : "text-gray-700"
                }`}
              >
                {item.label}
              </span>

              {/* Active checkmark */}
              {isActive && !isLogout && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-1.5 h-1.5 rounded-full bg-gray-600"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
