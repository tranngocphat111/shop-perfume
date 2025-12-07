import { useEffect, useState } from "react";
import type { CouponRequest } from "../../services/coupon.service";

export interface CouponFormData {
  couponId?: number;
  code: string;
  description?: string;
  discountPercent: number;
  requiredPoints?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CouponRequest) => Promise<void>;
  initialData?: CouponFormData;
  mode: "add" | "edit";
}

export const CouponModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: CouponModalProps) => {
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    description: "",
    discountPercent: 5,
    requiredPoints: 0,
    startDate: "",
    endDate: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Format dates for datetime-local input
        const formatDateForInput = (dateStr: string) => {
          if (!dateStr) return "";
          const date = new Date(dateStr);
          return date.toISOString().slice(0, 16);
        };

        setFormData({
          ...initialData,
          startDate: formatDateForInput(initialData.startDate),
          endDate: formatDateForInput(initialData.endDate),
        });
      } else {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        setFormData({
          code: "",
          description: "",
          discountPercent: 5,
          requiredPoints: 0,
          startDate: tomorrow.toISOString().slice(0, 16),
          endDate: nextMonth.toISOString().slice(0, 16),
          isActive: true,
        });
      }
      setErrors({});
    }
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Validate code
    if (!formData.code.trim()) {
      newErrors.code = "Coupon code is required";
    } else if (formData.code.length < 3 || formData.code.length > 50) {
      newErrors.code = "Coupon code must be 3-50 characters";
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code =
        "Coupon code must contain only uppercase letters, numbers, underscores and hyphens";
    }

    // Validate discount percent
    if (
      formData.discountPercent === undefined ||
      formData.discountPercent === null
    ) {
      newErrors.discountPercent = "Discount percent is required";
    } else if (
      formData.discountPercent <= 0 ||
      formData.discountPercent > 100
    ) {
      newErrors.discountPercent = "Discount percent must be between 0 and 100";
    }

    // Validate required points
    if (formData.requiredPoints !== undefined && formData.requiredPoints < 0) {
      newErrors.requiredPoints = "Required points must be at least 0";
    }

    // Validate dates
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    // Validate description length
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must not exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        // Convert to ISO format for backend
        const submitData: CouponRequest = {
          code: formData.code.trim().toUpperCase(),
          description: formData.description?.trim() || undefined,
          discountPercent: formData.discountPercent,
          requiredPoints: formData.requiredPoints || 0,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          isActive: formData.isActive,
        };
        await onSubmit(submitData);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4"
      style={{ margin: 0 }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8 relative">
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-3"></i>
              <p className="text-gray-700 font-medium">
                {mode === "add" ? "Adding coupon..." : "Saving changes..."}
              </p>
              <p className="text-sm text-gray-500 mt-1">Please wait</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-600 rounded-t-lg">
          <h3 className="text-xl font-bold text-white">
            {mode === "add" ? "Add New Coupon" : "Edit Coupon"}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white hover:text-blue-100 text-2xl transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Coupon Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.code ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., SUMMER2024"
                disabled={isSubmitting}
              />
              {errors.code && (
                <p className="text-red-500 text-sm mt-1">{errors.code}</p>
              )}
            </div>

            {/* Discount Percent */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Discount Percent (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discountPercent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountPercent: parseFloat(e.target.value),
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.discountPercent ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 10"
                disabled={isSubmitting}
              />
              {errors.discountPercent && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.discountPercent}
                </p>
              )}
            </div>

            {/* Required Points */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Required Points
              </label>
              <input
                type="number"
                min="0"
                value={formData.requiredPoints}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requiredPoints: parseInt(e.target.value),
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.requiredPoints ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 100"
                disabled={isSubmitting}
              />
              {errors.requiredPoints && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.requiredPoints}
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.startDate}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.endDate ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter coupon description"
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <label
                htmlFor="isActive"
                className="ml-2 text-sm font-semibold text-gray-700"
              >
                Active
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
