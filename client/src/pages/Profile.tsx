import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
// import { apiService } from '../services/api'; // For future API integration

interface UserProfile {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface Address {
  id: number;
  recipientName: string;
  phone: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
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
    role: "",
  });

  // Address management state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<Address, "id">>({
    recipientName: "",
    phone: "",
    addressLine: "",
    ward: "",
    district: "",
    city: "",
    isDefault: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: "",
        role: user.role,
      });

      // Load addresses from API or localStorage
      // Mock data for demo
      const mockAddresses: Address[] = [
        {
          id: 1,
          recipientName: user.name,
          phone: "0912345678",
          addressLine: "123 Đường ABC",
          ward: "Phường 1",
          district: "Quận 1",
          city: "TP. Hồ Chí Minh",
          isDefault: true,
        },
      ];
      setAddresses(mockAddresses);
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
        role: user.role,
      });
    }
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  // Address management functions
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setAddressForm({
      ...addressForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      recipientName: user?.name || "",
      phone: "",
      addressLine: "",
      ward: "",
      district: "",
      city: "",
      isDefault: addresses.length === 0,
    });
    setShowAddressModal(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine: address.addressLine,
      ward: address.ward,
      district: address.district,
      city: address.city,
      isDefault: address.isDefault,
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = () => {
    // Validate
    if (
      !addressForm.recipientName ||
      !addressForm.phone ||
      !addressForm.addressLine ||
      !addressForm.ward ||
      !addressForm.district ||
      !addressForm.city
    ) {
      setError("Vui lòng điền đầy đủ thông tin địa chỉ");
      return;
    }

    if (!/^(\+84|0)[0-9]{9,10}$/.test(addressForm.phone)) {
      setError("Số điện thoại không hợp lệ");
      return;
    }

    if (editingAddress) {
      // Update existing address
      setAddresses(
        addresses.map((addr) =>
          addr.id === editingAddress.id
            ? { ...addressForm, id: editingAddress.id }
            : addressForm.isDefault
            ? { ...addr, isDefault: false }
            : addr
        )
      );
      setSuccess("Cập nhật địa chỉ thành công!");
    } else {
      // Add new address
      const newAddress: Address = {
        ...addressForm,
        id: Date.now(),
      };

      // If new address is default, set all others to non-default
      const updatedAddresses = addressForm.isDefault
        ? addresses.map((addr) => ({ ...addr, isDefault: false }))
        : addresses;

      setAddresses([...updatedAddresses, newAddress]);
      setSuccess("Thêm địa chỉ mới thành công!");
    }

    setShowAddressModal(false);
    setError("");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDeleteAddress = (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      setAddresses(addresses.filter((addr) => addr.id !== id));
      setSuccess("Xóa địa chỉ thành công!");
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleSetDefaultAddress = (id: number) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
    setSuccess("Đã đặt làm địa chỉ mặc định!");
    setTimeout(() => setSuccess(""), 3000);
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

        {/* Address Management Section */}
        <div className="mt-6 overflow-hidden bg-white border border-gray-100 rounded-lg shadow-sm">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Sổ địa chỉ</h3>
              <p className="mt-1 text-sm text-gray-500">
                Quản lý địa chỉ giao hàng của bạn
              </p>
            </div>
            <button
              onClick={handleAddAddress}
              className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Thêm địa chỉ mới
            </button>
          </div>

          <div className="p-8">
            {addresses.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-gray-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="text-gray-500 mb-4">Chưa có địa chỉ nào</p>
                <button
                  onClick={handleAddAddress}
                  className="text-gray-900 font-medium hover:underline"
                >
                  Thêm địa chỉ đầu tiên
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`border rounded-lg p-5 ${
                      address.isDefault
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {address.recipientName}
                          </h4>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {address.phone}
                        </p>
                        <p className="text-sm text-gray-700">
                          {address.addressLine}, {address.ward},{" "}
                          {address.district}, {address.city}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                        >
                          Sửa
                        </button>
                        {!address.isDefault && (
                          <>
                            <button
                              onClick={() =>
                                handleSetDefaultAddress(address.id)
                              }
                              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                            >
                              Đặt mặc định
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              Xóa
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    setError("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên người nhận <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="recipientName"
                      value={addressForm.recipientName}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Nhập tên người nhận"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={addressForm.phone}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="VD: 0912345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ cụ thể <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="addressLine"
                    value={addressForm.addressLine}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Số nhà, tên đường..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phường/Xã <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="ward"
                      value={addressForm.ward}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="VD: Phường 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quận/Huyện <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={addressForm.district}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="VD: Quận 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tỉnh/Thành phố <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={addressForm.city}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="VD: TP. HCM"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    checked={addressForm.isDefault}
                    onChange={handleAddressChange}
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <label
                    htmlFor="isDefault"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    setError("");
                  }}
                  className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveAddress}
                  className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all active:scale-[0.98]"
                >
                  {editingAddress ? "Cập nhật" : "Thêm địa chỉ"}
                </button>
              </div>
            </div>
          </div>
        )}

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
