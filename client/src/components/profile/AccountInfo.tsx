import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Edit2, Check, X, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { userService } from "../../services/user.service";

export const AccountInfo = () => {
  const { user, refreshUser } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEditName = () => {
    setIsEditingName(true);
    setName(user?.name || "");
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setName(user?.name || "");
    setError("");
    setSuccess("");
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      setError("Họ và tên không được để trống");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (name.trim() === user?.name) {
      setIsEditingName(false);
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await userService.updateProfile({ name: name.trim() });
      setSuccess("Cập nhật họ tên thành công!");
      await refreshUser(); // Refresh user data in context
      setIsEditingName(false);
      setTimeout(() => setSuccess(""), 2000);
    } catch (error: any) {
      // Extract error message properly
      let errorMessage = "Có lỗi xảy ra khi cập nhật thông tin";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      setTimeout(() => setError(""), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <User size={20} className="text-gray-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Thông tin tài khoản</h3>
            <p className="text-xs text-gray-500 mt-0.5">Quản lý thông tin cá nhân của bạn</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium text-green-700">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <XCircle size={18} className="text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Account Information */}
        <div className="space-y-4">
          {/* Name Field */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                Họ và tên
              </label>
              {!isEditingName && (
                <button
                  type="button"
                  onClick={handleEditName}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Edit2 size={12} />
                  <span>Sửa</span>
                </button>
              )}
            </div>
            {isEditingName ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="Nhập họ và tên"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={12} />
                    <span>Lưu</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={12} />
                    <span>Hủy</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-900 font-medium">{user?.name || "N/A"}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-2 mb-2">
              <Mail size={14} className="text-gray-400" />
              Email
            </label>
            <p className="text-sm text-gray-900 font-medium">{user?.email || "N/A"}</p>
            <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
          </div>
        </div>

       
      </div>
    </div>
  );
};
