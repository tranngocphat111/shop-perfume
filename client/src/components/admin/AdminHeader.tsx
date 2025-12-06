import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export const AdminHeader = ({ onToggleSidebar }: AdminHeaderProps) => {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      // Call logout
      logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, redirect to admin login
      window.location.href = "/admin/login";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-blue-800 text-white shadow-lg z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="text-2xl hover:bg-blue-700 p-2 rounded transition-colors"
            title="Toggle Sidebar">
            <i className="fas fa-bars"></i>
          </button>
          <Link to="/admin" className="text-2xl font-bold">
            <i className="fas fa-store mr-2"></i>
            Shop Perfume Admin
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* User Info - Hiển thị thông tin người dùng đang đăng nhập */}
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-700/50 rounded-lg">
            <i className="fas fa-user-circle text-xl"></i>
            <div className="text-sm hidden md:block">
              <div className="font-semibold">{user?.name || "Admin User"}</div>
              <div className="text-blue-200 text-xs truncate max-w-[180px]">
                {user?.email || "admin@gmail.com"}
              </div>
            </div>
          </div>

          {/* View Store Button - Chuyển sang trang web bán hàng */}
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white font-medium"
            title="Xem trang web bán hàng">
            <i className="fas fa-store"></i>
            <span className="hidden sm:inline">Xem cửa hàng</span>
          </Link>

          {/* Logout Button - Đăng xuất */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
            title="Đăng xuất">
            <i className="fas fa-sign-out-alt"></i>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
