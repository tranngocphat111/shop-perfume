import { useState } from "react";
import { authService } from "@services/auth.service";

export const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!currentPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới tối thiểu 6 ký tự");
      return;
    }

    if (!newPassword.trim()) {
      setError("Vui lòng nhập mật khẩu mới");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setIsLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccess("Đổi mật khẩu thành công");
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Có lỗi xảy ra khi đổi mật khẩu";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-100 rounded-lg shadow-sm">
      <h3 className="mb-4 text-lg font-medium">Đổi mật khẩu</h3>
      {error && (
        <div className="p-3 mb-3 text-red-700 border-l-4 border-red-500 rounded bg-red-50">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 mb-3 text-green-700 border-l-4 border-green-500 rounded bg-green-50">
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label
            htmlFor="current-password"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Mật khẩu hiện tại <span className="text-red-500">*</span>
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Nhập mật khẩu hiện tại"
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            required
          />
        </div>
        <div>
          <label
            htmlFor="new-password"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Mật khẩu mới <span className="text-red-500">*</span>
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            required
          />
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Xác nhận mật khẩu mới <span className="text-red-500">*</span>
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            required
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 text-white transition-colors bg-black rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading && <i className="bi bi-arrow-repeat animate-spin"></i>}
          {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
        </button>
      </form>
    </div>
  );
};
