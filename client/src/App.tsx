import { BrowserRouter, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProductsFilterProvider } from "./contexts/ProductsFilterContext";
import { SearchProvider } from "./contexts/SearchContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ClientApp } from "./ClientApp";
import { AdminApp } from "./AdminApp";
import { AuthApp } from "./AuthApp";
import "./App.css";

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/admin/login" ||
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password");

  // Render appropriate app based on route
  if (isAuthRoute) {
    return <AuthApp />;
  }

  if (isAdminRoute) {
    return <AdminApp />;
  }

  return <ClientApp />;
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
