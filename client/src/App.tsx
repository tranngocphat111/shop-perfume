import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { Products as CustomerProducts } from "./pages/Products";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminLogin from "./pages/auth/AdminLogin";
import { ProtectedRoute } from "./components/ProtectedRoute";
import "./App.css";
import { Dashboard } from "./pages/admin/Dashboard";
import { StockAdjustments } from "./pages/admin/StockAdjustment";
import { Products as AdminProducts } from "./pages/admin/Products";
import { Suppliers } from "./pages/admin/Suppliers";

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/admin/login";

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAdminRoute && !isAuthRoute && <Header />}
      <main className={`min-h-[calc(100vh-80px)] ${isHomePage || isAdminRoute || isAuthRoute ? "" : "pt-20"}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<CustomerProducts />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/about"
            element={
              <div className="p-8 text-center">About Page - Coming Soon</div>
            }
          />
          <Route
            path="/brands"
            element={
              <div className="p-8 text-center">Brands Page - Coming Soon</div>
            }
          />
          <Route
            path="/contact"
            element={
              <div className="p-8 text-center">Contact Page - Coming Soon</div>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/suppliers"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Suppliers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stock-adjustments"
            element={
              <ProtectedRoute requireAdmin={true}>
                <StockAdjustments />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
