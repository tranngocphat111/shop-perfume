import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ProfileSidebar } from "@components/profile/ProfileSidebar";
import { AccountInfo } from "@components/profile/AccountInfo";
import { Addresses } from "@components/profile/Addresses";
import { Orders } from "@components/profile/Orders";
import { ChangePassword } from "@components/profile/ChangePassword";

const Profile: React.FC = () => {
  const { isAuthenticated } = useAuth();
  // Default to "orders" if authenticated, otherwise "account"
  const [active, setActive] = useState<string>(isAuthenticated ? "orders" : "account");
  
  // Update active tab when authentication status changes
  useEffect(() => {
    if (isAuthenticated && active === "account") {
      setActive("orders");
    }
  }, [isAuthenticated]);
  return (
    <div className="px-4 py-12 min-h-screen bg-gray-50 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 mx-auto max-w-6xl md:grid-cols-3">
        <div>
          <ProfileSidebar active={active} onChange={setActive} />
        </div>
        <div className="md:col-span-2">
          {active === "account" && <AccountInfo />}
          {active === "addresses" && <Addresses />}
          {active === "orders" && <Orders />}
          {active === "password" && <ChangePassword />}
        </div>
      </div>
    </div>
  );
};

export default Profile;
