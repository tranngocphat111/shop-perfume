import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProductsFilterProvider } from "./contexts/ProductsFilterContext";
import { SearchProvider } from "./contexts/SearchContext";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { Products as CustomerProducts } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Payment } from "./pages/Payment";
import { MyOrders } from "./pages/MyOrders";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminLogin from "./pages/auth/AdminLogin";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Profile from "./pages/Profile";
import { About } from "./pages/About";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import {
  GuestRoute,
  CustomerRoute,
  AdminRoute,
  UnauthenticatedRoute,
} from "./components/ProtectedRoute";
import "./App.css";
import { Dashboard } from "./pages/admin/Dashboard";
import { StockAdjustments } from "./pages/admin/StockAdjustment";
import { Products as AdminProducts } from "./pages/admin/Products";
import { Footer } from "./components/Footer";
import { Suppliers } from "./pages/admin/Suppliers";
import { PurchaseInvoices } from "./pages/admin/PurchaseInvoices";
import { ScrollToTop } from "./components/ScrollToTop";
import { ErrorBoundary } from "./components/ErrorBoundary";

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/admin/login" ||
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password");

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAdminRoute && !isAuthRoute && <Header />}
      <main
        className={`min-h-[calc(100vh-80px)] ${
          isHomePage || isAdminRoute || isAuthRoute ? "" : "pt-16 bg-gray-50"
        }`}
      >
        <Routes>
          {/* GUEST ROUTES - Public access, anyone can view */}
          <Route
            path="/"
            element={
              <GuestRoute>
                <Home />
              </GuestRoute>
            }
          />
          <Route
            path="/products"
            element={
              <GuestRoute>
                <CustomerProducts />
              </GuestRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <GuestRoute>
                <ProductDetail />
              </GuestRoute>
            }
          />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/admin/login"
            element={
              <UnauthenticatedRoute>
                <AdminLogin />
              </UnauthenticatedRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPassword />
              </GuestRoute>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <GuestRoute>
                <ResetPassword />
              </GuestRoute>
            }
          />
          <Route
            path="/about"
            element={
              <GuestRoute>
                <About />
              </GuestRoute>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <GuestRoute>
                <PrivacyPolicy />
              </GuestRoute>
            }
          />
          <Route
            path="/brands"
            element={
              <GuestRoute>
                <div className="p-8 text-center">Brands Page - Coming Soon</div>
              </GuestRoute>
            }
          />
          <Route
            path="/contact"
            element={
              <GuestRoute>
                <div className="p-8 text-center">
                  Contact Page - Coming Soon
                </div>
              </GuestRoute>
            }
          />

          {/* GUEST ROUTES - Cart, Checkout, Payment (Guest can also order) */}
          <Route
            path="/cart"
            element={
              <GuestRoute>
                <Cart />
              </GuestRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <GuestRoute>
                <Checkout />
              </GuestRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <GuestRoute>
                <Payment />
              </GuestRoute>
            }
          />

          {/* CUSTOMER ROUTES - Requires authentication (Customer or Admin can access) */}
          <Route
            path="/my-orders"
            element={
              <CustomerRoute>
                <MyOrders />
              </CustomerRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <CustomerRoute>
                <Profile />
              </CustomerRoute>
            }
          />

          {/* ADMIN ROUTES - Requires admin role */}
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
                <AdminProducts />
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
        </Routes>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}

// Google OAuth Client ID - should be set via environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function App() {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <ProductsFilterProvider>
                <SearchProvider>
                  <AppContent />
                </SearchProvider>
              </ProductsFilterProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
