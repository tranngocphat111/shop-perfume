import { motion } from "framer-motion";
import { useAuth } from "@contexts/AuthContext";

export const AccountInfo = () => {
  const { user } = useAuth();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white rounded-xl border border-gray-200 shadow-lg"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Thông tin tài khoản
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Họ và tên</p>
            <p className="text-lg font-medium text-gray-900">{user?.name || "N/A"}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Email</p>
            <p className="text-lg font-medium text-gray-900">{user?.email || "N/A"}</p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Nếu không phải bạn, hãy đăng xuất và đăng nhập bằng tài khoản đúng.
          </p>
        </div>
        <p className="mt-4 text-base leading-relaxed text-gray-700">
          Tại trang này, bạn có thể theo dõi đơn hàng gần đây, quản lý sổ địa chỉ,
          thiết lập phương thức thanh toán và cập nhật thông tin cá nhân cùng mật
          khẩu.
        </p>
      </motion.div>
    </motion.div>
  );
};
