import React, { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { authService } from "../../services/auth.service";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { usePageTitle } from "../../hooks/usePageTitle";

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object" && "message" in error) {
    return (error as { message: string }).message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.";
};

// Lightweight types to avoid `any` and satisfy ESLint
type GoogleWindow = {
  accounts?: {
    id?: {
      cancel?: () => void;
      disableAutoSelect?: () => void;
    };
  };
};

type CredentialResponse = {
  credential?: string;
};

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const { mergeCartOnLogin } = useCart();

  // Auto scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Best-effort: cancel Google One Tap / credential prompt if it's present
    try {
      const g = (window as unknown as GoogleWindow).accounts?.id;
      if (g) {
        if (typeof g.disableAutoSelect === "function") {
          try {
            g.disableAutoSelect();
          } catch (err) {
            console.debug("disableAutoSelect failed:", err);
          }
        }
        if (typeof g.cancel === "function") {
          try {
            g.cancel();
          } catch (err) {
            console.debug("g.cancel failed:", err);
          }
        }
      }
    } catch (err) {
      console.debug("Google One Tap cancellation failed:", err);
    }
  }, []);

  usePageTitle({
    title: "Đăng nhập - STPN Perfume",
    description: "Đăng nhập vào tài khoản của bạn để mua sắm và quản lý đơn hàng.",
    image: "https://res.cloudinary.com/piin/image/upload/v1762171215/banner.zip-2_gdvc0y.jpg"
  });

  // Redirect if already logged in - always to home page for client login
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Email không hợp lệ");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "email") {
      validateEmail(value);
    }

    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(formData.email)) {
      setError("Vui lòng nhập email hợp lệ");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(formData);

      // Always merge cart and navigate to home for client login page
      await login(response.token, response, () =>
        mergeCartOnLogin(response.userId)
      );
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError("Không thể lấy thông tin từ Google. Vui lòng thử lại.");
      return;
    }

    setGoogleLoading(true);
    setError("");

    try {
      const response = await authService.signInWithGoogle(
        credentialResponse.credential
      );

      // Always merge cart and navigate to home for client login page
      await login(response.token, response, () =>
        mergeCartOnLogin(response.userId)
      );
      navigate("/");
    } catch (err) {
      console.error("Google Sign-In error:", err);
      setError(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Đăng nhập bằng Google thất bại. Vui lòng thử lại.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200/50"
      >
        {/* Header with gradient accent */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-center"
        >
          <div className="absolute top-0 left-0 right-0 h-1 "></div>
          <Link to="/" className="inline-block ">
            <motion.img
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              src="https://res.cloudinary.com/piin/image/upload/v1763985017/logo/SPTN-BLACK.png"
              alt="STPN Perfume"
              className="h-16 mx-auto brightness-0 invert"
            />
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Đăng nhập
          </h2>
          <p className="text-gray-300 mt-1.5 text-sm">
            Chào mừng bạn quay trở lại
          </p>
        </motion.div>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-6"
        >
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg"
              >
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-red-800 flex-1">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className={`h-5 w-5 transition-colors ${
                      emailError ? "text-red-400" : "text-gray-400"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => validateEmail(formData.email)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${
                    emailError
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/50"
                      : "border-gray-300 focus:ring-gray-900 focus:border-gray-900 bg-gray-50/50"
                  }`}
                  placeholder="Nhập địa chỉ email"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <AnimatePresence>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-1 text-xs text-red-600"
                  >
                    {emailError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition bg-gray-50/50 text-sm"
                  placeholder="Nhập mật khẩu"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              className={`w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-2.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${
                loading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:from-gray-800 hover:to-gray-700"
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center text-sm">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center justify-center text-sm">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Đăng nhập
                </span>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="mt-5 mb-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500 font-medium">Hoặc</span>
              </div>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`mb-5 ${loading || googleLoading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <button
              type="button"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md group"
              onClick={() => {
                // Google login will be triggered by GoogleLogin component
                const googleBtn = document.querySelector('[role="button"]') as HTMLElement;
                if (googleBtn) googleBtn.click();
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Đăng nhập bằng Google
              </span>
            </button>
            {/* Hidden Google Login */}
            <div className="hidden">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
              />
            </div>
          </motion.div>

          <div className="mt-5 text-center space-y-2.5">
            <Link
              to="/forgot-password"
              className="text-xs text-gray-600 hover:text-gray-900 font-medium transition inline-block"
            >
              Quên mật khẩu?
            </Link>
            <p className="text-xs text-gray-600">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-gray-900 font-semibold hover:underline transition"
              >
                Đăng ký ngay
              </Link>
            </p>
            <Link
              to="/"
              className="inline-flex items-center text-xs text-gray-500 hover:text-gray-900 transition"
            >
              <svg
                className="w-3.5 h-3.5 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Quay về trang chủ
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
