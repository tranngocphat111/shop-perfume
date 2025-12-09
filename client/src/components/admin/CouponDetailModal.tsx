import type { Coupon } from "../../services/coupon.service";

interface CouponDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon | null;
}

export const CouponDetailModal = ({
  isOpen,
  onClose,
  coupon,
}: CouponDetailModalProps) => {
  if (!isOpen || !coupon) return null;

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4"
      style={{ margin: 0 }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-600 rounded-t-lg">
          <h3 className="text-xl font-bold text-white">Coupon Details</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Coupon ID */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">Coupon ID:</div>
              <div className="col-span-2 text-gray-900">{coupon.couponId}</div>
            </div>

            {/* Code */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">Code:</div>
              <div className="col-span-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                  {coupon.code}
                </span>
              </div>
            </div>

            {/* Discount Percent */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">
                Discount Percent:
              </div>
              <div className="col-span-2">
                <span className="text-green-600 font-bold text-lg">
                  {coupon.discountPercent}%
                </span>
              </div>
            </div>

            {/* Required Points */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">
                Required Points:
              </div>
              <div className="col-span-2 text-gray-900">
                {coupon.requiredPoints || 0} points
              </div>
            </div>

            {/* Start Date */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">Start Date:</div>
              <div className="col-span-2 text-gray-900">
                {formatDate(coupon.startDate)}
              </div>
            </div>

            {/* End Date */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">End Date:</div>
              <div className="col-span-2 text-gray-900">
                {formatDate(coupon.endDate)}
              </div>
            </div>

            {/* Active Status */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">Status:</div>
              <div className="col-span-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    coupon.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <i
                    className={`fas fa-circle text-xs mr-2 ${
                      coupon.isActive ? "text-green-500" : "text-red-500"
                    }`}
                  ></i>
                  {coupon.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Description */}
            {coupon.description && (
              <div className="grid grid-cols-3 gap-4">
                <div className="font-semibold text-gray-700">Description:</div>
                <div className="col-span-2 text-gray-900 whitespace-pre-wrap">
                  {coupon.description}
                </div>
              </div>
            )}

            {/* Created At */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">Created At:</div>
              <div className="col-span-2 text-gray-900">
                {formatDate(coupon.createdAt)}
              </div>
            </div>

            {/* Created By */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">Created By:</div>
              <div className="col-span-2 text-gray-900">
                {coupon.createdBy || "N/A"}
              </div>
            </div>

            {/* Last Updated */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">Last Updated:</div>
              <div className="col-span-2 text-gray-900">
                {formatDate(coupon.lastUpdated)}
              </div>
            </div>

            {/* Last Updated By */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">Updated By:</div>
              <div className="col-span-2 text-gray-900">
                {coupon.lastUpdatedBy || "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
