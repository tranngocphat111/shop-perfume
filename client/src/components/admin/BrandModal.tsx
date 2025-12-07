import { useState, useEffect } from "react";

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BrandFormData) => Promise<void>;
  initialData?: BrandFormData;
  mode: "add" | "edit";
}

export interface BrandFormData {
  brandId?: number;
  name: string;
  country: string;
  description: string;
  url?: string;
  image?: File;
}

export const BrandModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: BrandModalProps) => {
  const [formData, setFormData] = useState<BrandFormData>({
    name: "",
    country: "",
    description: "",
    url: "",
    image: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Set preview for existing image
      if (initialData.url) {
        const cloudinaryBaseUrl =
          "https://res.cloudinary.com/dmmk9dwqd/image/upload/";
        const fullUrl = initialData.url.startsWith("http")
          ? initialData.url
          : `${cloudinaryBaseUrl}${initialData.url}`;
        setImagePreview(fullUrl);
      }
    } else {
      setFormData({
        name: "",
        country: "",
        description: "",
        url: "",
        image: undefined,
      });
      setImagePreview("");
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Brand name is required";
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = "Brand name must be 2-100 characters";
    }

    if (formData.country && formData.country.length > 100) {
      newErrors.country = "Country must not exceed 100 characters";
    }

    if (formData.description && formData.description.length > 5000) {
      newErrors.description = "Description must not exceed 5000 characters";
    }

    if (formData.url && formData.url.length > 500) {
      newErrors.url = "URL must not exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
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
                {mode === "add" ? "Adding brand..." : "Saving changes..."}
              </p>
              <p className="text-sm text-gray-500 mt-1">Please wait</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-blue-600 rounded-t-lg">
          <h3 className="text-xl font-bold text-white">
            {mode === "add" ? "Add Brand" : "Edit Brand"}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white hover:text-blue-100 text-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto"
        >
          <div className="space-y-4">
            {/* Brand Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter brand name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.country ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter country"
              />
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">{errors.country}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter brand description"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Brand Logo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Brand Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, image: file });
                    // Create preview
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.image && (
                <p className="text-red-500 text-sm mt-1">{errors.image}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Upload brand logo image (PNG, JPG, etc.)
              </p>

              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Preview:
                  </p>
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Brand logo preview"
                      className="h-24 object-contain border rounded-lg p-2 bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, image: undefined });
                        setImagePreview("");
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mode === "add" ? "Add Brand" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
