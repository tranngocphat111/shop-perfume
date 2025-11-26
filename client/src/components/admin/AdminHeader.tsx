import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export const AdminHeader = ({ onToggleSidebar }: AdminHeaderProps) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Logout will handle navigation
    } catch (error) {
      console.error('Logout failed:', error);
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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <i className="fas fa-user-circle text-2xl"></i>
            <div className="text-sm">
              <div className="font-semibold">{user?.name || 'Admin User'}</div>
              <div className="text-blue-200 text-xs">{user?.email || 'admin@gmail.com'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors">
            <i className="fas fa-sign-out-alt mr-2"></i>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
