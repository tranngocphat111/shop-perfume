import { Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { Dashboard } from "./pages/admin/Dashboard";
import { Products } from "./pages/admin/Products";
import { Brands } from "./pages/admin/Brands";
import { Categories } from "./pages/admin/Categories";
import { Suppliers } from "./pages/admin/Suppliers";
import { StockAdjustments } from "./pages/admin/StockAdjustment";
import { PurchaseInvoices } from "./pages/admin/PurchaseInvoices";
import { Orders } from "./pages/admin/Orders";
import { Customers } from "./pages/admin/Customers";
import { AdminRoute } from "./components/ProtectedRoute";

export function AdminApp() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="min-h-screen">
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <Products />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/brands"
            element={
              <AdminRoute>
                <Brands />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <AdminRoute>
                <Categories />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/suppliers"
            element={
              <AdminRoute>
                <Suppliers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/stock-adjustments"
            element={
              <AdminRoute>
                <StockAdjustments />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/purchase-invoices"
            element={
              <AdminRoute>
                <PurchaseInvoices />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <Orders />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <AdminRoute>
                <Customers />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
      <ScrollToTop />
    </div>
  );
}
