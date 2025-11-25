import { Link } from "react-router-dom";
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
    onClick?: () => void
  ) => (
    <button
      type="button"
      onClick={onClick || (() => onChange(key))}
      className={`w-full flex items-center gap-3 px-6 py-4 rounded-lg transition-all ${
        active === key
          ? "bg-gray-100 text-black"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <i className={`text-2xl text-gray-500 bi ${icon}`}></i>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
      <div className="space-y-2">
        {item("Thông tin tài khoản", "bi-person", "account")}
        {item("Địa chỉ giao hàng", "bi-geo-alt", "addresses")}
        {item("Quản lý đơn hàng", "bi-receipt", "orders")}
        {item("Đổi mật khẩu", "bi-lock", "password")}
        {item("Đăng Xuất", "bi-box-arrow-left", "logout", () => {
          logout();
          window.location.href = "/";
        })}
      </div>
    </div>
  );
};
