import type { UserDetailResponse } from "../../types";

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: UserDetailResponse | null;
}

export const CustomerDetailModal = ({
  isOpen,
  onClose,
  customer,
}: CustomerDetailModalProps) => {
  if (!isOpen || !customer) return null;

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-red-100 text-red-800",
    BANNED: "bg-red-100 text-red-800",
  };

  const providerColors: Record<string, string> = {
    LOCAL: "bg-blue-100 text-blue-800",
    GOOGLE: "bg-red-100 text-red-800",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg">
          <div>
            <h3 className="text-xl font-bold text-white">Customer Details</h3>
            <p className="text-blue-100 text-sm mt-1">ID: {customer.userId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 text-2xl transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-800 border-b pb-2">
                <i className="fas fa-user mr-2"></i>Personal Information
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {customer.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <p className="text-base text-gray-900">{customer.email}</p>
                </div>
                {customer.avatar && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Avatar
                    </label>
                    <img
                      src={customer.avatar}
                      alt={customer.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-800 border-b pb-2">
                <i className="fas fa-info-circle mr-2"></i>Account Information
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Provider
                  </label>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                      providerColors[customer.provider] ||
                      "bg-gray-100 text-gray-800"
                    }`}>
                    {customer.provider}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Status
                  </label>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                      statusColors[customer.status]
                    }`}>
                    {customer.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Roles
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {customer.roles.map((role, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs rounded bg-indigo-100 text-indigo-800 font-semibold">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Joined Date
                  </label>
                  <p className="text-base text-gray-900">
                    {new Date(customer.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Last Updated
                  </label>
                  <p className="text-base text-gray-900">
                    {new Date(customer.lastUpdated).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="mb-6">
            <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">
              <i className="fas fa-chart-line mr-2"></i>Statistics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">
                      Loyalty Points
                    </p>
                    <p className="text-2xl font-bold text-purple-700 mt-1">
                      {customer.loyaltyPoints.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-200 p-3 rounded-full">
                    <i className="fas fa-star text-purple-600 text-xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">
                      Total Orders
                    </p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                      {customer.totalOrders}
                    </p>
                  </div>
                  <div className="bg-blue-200 p-3 rounded-full">
                    <i className="fas fa-shopping-cart text-blue-600 text-xl"></i>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">
                      Total Spent
                    </p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                      {customer.totalSpent.toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                  <div className="bg-green-200 p-3 rounded-full">
                    <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
            <i className="fas fa-times mr-2"></i>Close
          </button>
        </div>
      </div>
    </div>
  );
};
