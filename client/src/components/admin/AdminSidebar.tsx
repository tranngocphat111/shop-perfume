import { Link, useLocation } from "react-router-dom";

interface AdminSidebarProps {
  isOpen: boolean;
}

export const AdminSidebar = ({ isOpen }: AdminSidebarProps) => {
  const location = useLocation();

  const menuItems = [
    {
      path: "/admin",
      icon: "fa-chart-line",
      label: "Dashboard",
      exact: true,
    },
    {
      path: "/admin/products",
      icon: "fa-box",
      label: "Products",
    },
    {
      path: "/admin/brands",
      icon: "fa-tag",
      label: "Brands",
    },
    {
      path: "/admin/categories",
      icon: "fa-th-large",
      label: "Categories",
    },
    {
      path: "/admin/suppliers",
      icon: "fa-truck",
      label: "Suppliers",
    },
    {
      path: "/admin/purchase-invoices",
      icon: "fa-file-invoice",
      label: "Purchase Invoices",
    },
    {
      path: "/admin/stock-adjustments",
      icon: "fa-warehouse",
      label: "Stock Adjustments",
    },
    {
      path: "/admin/orders",
      icon: "fa-shopping-cart",
      label: "Orders",
    },
    {
      path: "/admin/customers",
      icon: "fa-users",
      label: "Customers",
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg overflow-y-auto transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <nav className="p-4 mt-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path, item.exact)
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <i className={`fas ${item.icon} w-5`}></i>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}

          {/* Divider */}
          <li className="pt-4 mt-4 border-t border-gray-200">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Cửa hàng
            </div>
          </li>

          {/* View Store Link */}
          <li>
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-green-50 hover:text-green-700 border border-green-200 hover:border-green-400"
            >
              <i className="fas fa-store w-5 text-green-600"></i>
              <span className="font-medium">Xem cửa hàng</span>
              <i className="fas fa-external-link-alt ml-auto text-xs text-green-600"></i>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};
