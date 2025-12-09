import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100" style={{ zoom: 0.9 }}>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <div className="flex mt-9">
        <AdminSidebar isOpen={isSidebarOpen} />
        <main
          className={`flex-1 p-6 mt-6 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-0"
          }`}
          style={{ width: isSidebarOpen ? "calc(100% - 16rem)" : "100%" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
