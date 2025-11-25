import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
// import { apiService } from '../services/api'; // For future API integration

interface UserProfile {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
}

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [formData, setFormData] = useState<UserProfile>({
    userId: 0,
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: "",
        address: "",
        role: user.role,
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Validate phone if provided
      if (formData.phone && !/^(\+84|0)[0-9]{9,10}$/.test(formData.phone)) {
        setError("Số điện thoại không hợp lệ (VD: 0912345678)");
        setLoading(false);
        return;
      }

      // API call to update profile would go here
      // await apiService.put(`/users/${user?.userId}`, formData);

      setSuccess("Cập nhật thông tin thành công!");
      setIsEditing(false);

      // Refresh user data in context if needed
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Update profile error:", err);
      setError(err.message || "Cập nhật thông tin thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: "",
        address: "",
        role: user.role,
      });
    }
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-12 bg-gray-50 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 overflow-hidden bg-white border border-gray-100 rounded-lg shadow-sm">
          <div className="px-8 py-6 bg-gradient-to-r from-gray-900 to-gray-700">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Thông tin cá nhân
            </h1>
            <p className="mt-1 text-sm text-gray-300">
              Quản lý thông tin tài khoản của bạn
            </p>
          </div>
        </div>

        {/* Profile Content */}
        <div className="overflow-hidden bg-white border border-gray-100 rounded-lg shadow-sm">
          <div className="p-8">
            {error && (
              <div className="p-4 mb-6 border-l-4 border-red-500 rounded-r bg-red-50">
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
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 mb-6 border-l-4 border-green-500 rounded-r bg-green-50">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-green-800">{success}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center pb-6 space-x-6 border-b border-gray-200">
                <div className="flex items-center justify-center w-24 h-24 text-3xl font-semibold text-white bg-gray-900 rounded-full">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.role === "ADMIN" && (
                    <span className="inline-block px-3 py-1 mt-2 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                      Quản trị viên
                    </span>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition ${
                      !isEditing ? "bg-gray-50 cursor-not-allowed" : ""
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg cursor-not-allowed bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Email không thể thay đổi
                  </p>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition ${
                      !isEditing ? "bg-gray-50 cursor-not-allowed" : ""
                    }`}
                    placeholder="VD: 0912345678"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Vai trò
                  </label>
                  <input
                    type="text"
                    value={
                      formData.role === "ADMIN" ? "Quản trị viên" : "Khách hàng"
                    }
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg cursor-not-allowed bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Địa chỉ
                </label>
                <textarea
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  disabled={!isEditing || loading}
                  rows={3}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition resize-none ${
                    !isEditing ? "bg-gray-50 cursor-not-allowed" : ""
                  }`}
                  placeholder="Nhập địa chỉ của bạn"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex gap-3">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all active:scale-[0.98]"
                    >
                      Chỉnh sửa thông tin
                    </button>
                  ) : (
                    <>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-3 bg-black text-white rounded-lg font-medium transition-all ${
                          loading
                            ? "opacity-70 cursor-not-allowed"
                            : "hover:bg-gray-800 active:scale-[0.98]"
                        }`}
                      >
                        {loading ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all active:scale-[0.98]"
                      >
                        Hủy
                      </button>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="px-6 py-3 font-medium text-red-600 transition-all rounded-lg hover:bg-red-50"
                >
                  Đăng xuất
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Additional Information */}
        <div className="p-6 mt-6 bg-white border border-gray-100 rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Thông tin tài khoản
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mã tài khoản:</span>
              <span className="font-medium text-gray-900">#{user.userId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Loại tài khoản:</span>
              <span className="font-medium text-gray-900">
                {user.role === "ADMIN" ? "Quản trị viên" : "Khách hàng"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trạng thái:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Đang hoạt động
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
