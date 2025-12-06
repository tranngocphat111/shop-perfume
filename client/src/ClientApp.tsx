import { Routes, Route, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
import { Home } from "./pages/Home";
import { Products } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Payment } from "./pages/Payment";
import { MyOrders } from "./pages/MyOrders";
import { About } from "./pages/About";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { Contact } from "./pages/Contact";
import Profile from "./pages/Profile";
import { GuestRoute, CustomerRoute } from "./components/ProtectedRoute";

export function ClientApp() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main
        className={`min-h-[calc(100vh-80px)] ${
          isHomePage ? "" : "pt-16 bg-gray-50"
        }`}>
        <Routes>
          {/* Public Routes */}
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
                <Products />
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
                <Contact />
              </GuestRoute>
            }
          />

          {/* Cart Routes */}
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

          {/* Customer Routes */}
          <Route
            path="/my-orders"
            element={
              <GuestRoute>
                <MyOrders />
              </GuestRoute>
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
        </Routes>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
