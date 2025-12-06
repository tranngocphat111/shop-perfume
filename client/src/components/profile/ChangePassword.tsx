import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { userService } from "../../services/user.service";

export const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!currentPassword.trim()) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!newPassword.trim()) {
      setError("Vui lòng nhập mật khẩu mới");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (currentPassword === newPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setIsLoading(true);

    try {
      await userService.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      
      setSuccess("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      let errorMessage = "Có lỗi xảy ra khi đổi mật khẩu";
      
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
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
            <Lock size={20} className="text-gray-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Đổi mật khẩu</h3>
            <p className="text-xs text-gray-500 ">Bảo mật tài khoản của bạn</p>
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
              className="flex items-center gap-2 px-4 py-3 mb-4 border border-green-200 rounded-lg bg-green-50"
            >
              <CheckCircle size={18} className="flex-shrink-0 text-green-600" />
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
              className="flex items-center gap-2 px-4 py-3 mb-4 border border-red-200 rounded-lg bg-red-50"
            >
              <XCircle size={18} className="flex-shrink-0 text-red-600" />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="flex items-center block gap-2 text-xs font-semibold text-gray-700">
              Mật khẩu hiện tại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2">
                <Lock size={16} />
              </div>
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute text-gray-400 transition-colors -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="flex items-center block gap-2 text-xs font-semibold text-gray-700">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2">
                <Lock size={16} />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute text-gray-400 transition-colors -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="flex items-center block gap-2 text-xs font-semibold text-gray-700">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2">
                <Lock size={16} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute text-gray-400 transition-colors -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-slide-overlay-dark relative overflow-hidden w-full px-5 py-2.5 text-sm font-semibold text-white bg-black rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span className="relative z-index-10">Đổi mật khẩu</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
