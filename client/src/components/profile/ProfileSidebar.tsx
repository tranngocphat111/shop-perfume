import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@contexts/AuthContext";

interface ProfileSidebarProps {
  active: string;
  onChange: (tab: string) => void;
}

export const ProfileSidebar = ({ active, onChange }: ProfileSidebarProps) => {
  const { logout } = useAuth();

  const item = (
    label: string,
    icon: string,
    key: string,
    onClick?: () => void,
    index: number = 0
  ) => (
    <motion.button
      type="button"
      onClick={onClick || (() => onChange(key))}
      whileHover={{ 
        x: 8
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ 
        x: { 
          type: "spring", 
          stiffness: 500, 
          damping: 30
        },
        backgroundColor: {
          duration: 0.1,
          ease: "easeOut"
        }
      }}
      className={`w-full flex items-center gap-3 px-6 py-4 rounded-lg relative overflow-hidden ${
        active === key
          ? "text-black"
          : "text-gray-700"
      }`}
    >
      {/* Active indicator background */}
      {active === key && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg z-0" />
      )}
      
      {/* Hover background */}
      <motion.div
        className="absolute inset-0 bg-gray-200 rounded-lg z-[1]"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-3 w-full">
        <i className={`text-2xl bi ${icon} ${
          active === key ? "text-gray-900" : "text-gray-500"
        }`} />
        <span className={`font-medium ${active === key ? "text-gray-900" : "text-gray-700"}`}>
          {label}
        </span>
      </div>
    </motion.button>
  );

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-lg">
      <div className="space-y-1">
        {item("Thông tin tài khoản", "bi-person", "account", undefined, 0)}
        {item("Địa chỉ giao hàng", "bi-geo-alt", "addresses", undefined, 1)}
        {item("Quản lý đơn hàng", "bi-receipt", "orders", undefined, 2)}
        {item("Đổi mật khẩu", "bi-lock", "password", undefined, 3)}
        {item("Đăng Xuất", "bi-box-arrow-left", "logout", async () => {
          try {
            await logout("/");
          } catch (error) {
            console.error("Logout error:", error);
            // Fallback: clear storage and redirect
            localStorage.removeItem("auth_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user_info");
            window.location.href = "/";
          }
        }, 4)}
      </div>
    </div>
  );
};
