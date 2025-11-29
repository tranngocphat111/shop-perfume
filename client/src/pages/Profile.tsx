import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { ProfileSidebar } from "@components/profile/ProfileSidebar";
import { AccountInfo } from "@components/profile/AccountInfo";
import { Addresses } from "@components/profile/Addresses";
import { Orders } from "@components/profile/Orders";
import { ChangePassword } from "@components/profile/ChangePassword";

const Profile: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  // Default to "orders" if authenticated, otherwise "account"
  const [active, setActive] = useState<string>(isAuthenticated ? "orders" : "account");
  
  // Scroll to top when component mounts or location changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);
  
  // Check if navigating with activeTab state
  useEffect(() => {
    const state = location.state as { activeTab?: string; action?: string } | null;
    if (state?.activeTab) {
      if (state.activeTab === 'account' || state.activeTab === 'addresses' || state.activeTab === 'orders' || state.activeTab === 'password') {
        setActive(state.activeTab);
      }
    }
  }, [location]);
  
  // Update active tab when authentication status changes
  useEffect(() => {
    if (isAuthenticated && active === "account") {
      setActive("orders");
    }
  }, [isAuthenticated]);
  return (
    <div className="px-4 py-12 min-h-screen bg-white sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 max-w-6xl mx-auto"
      >
        <nav className="text-xs md:text-sm flex items-center gap-2">
          <Link
            to="/"
            className="text-gray-500 font-normal hover:text-black transition-colors"
          >
            Trang chủ
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-black font-medium">
            Tài khoản
          </span>
        </nav>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 mx-auto max-w-6xl md:grid-cols-3">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <ProfileSidebar active={active} onChange={setActive} />
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="md:col-span-2"
        >
          <AnimatePresence mode="wait">
            {active === "account" && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <AccountInfo />
              </motion.div>
            )}
            {active === "addresses" && (
              <motion.div
                key="addresses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Addresses />
              </motion.div>
            )}
            {active === "orders" && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Orders />
              </motion.div>
            )}
            {active === "password" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ChangePassword />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
