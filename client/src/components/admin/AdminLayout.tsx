import { useState } from "react";
import type { ReactNode } from "react";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <div className="flex">
        <AdminSidebar isOpen={isSidebarOpen} />
        <main
          className={`flex-1 p-6 mt-6 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-0"
          }`}>
          {children}
        </main>
      </div>
    </div>
  );
};
