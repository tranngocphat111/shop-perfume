import { useState } from "react";
import type { Brand } from "../../services/brand.service";

interface BrandDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand | null;
}

export const BrandDetailModal = ({
  isOpen,
  onClose,
  brand,
}: BrandDetailModalProps) => {
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !brand) return null;

  // Handle logo URL
  const getLogoUrl = () => {
    if (!brand.url) return null;

    // If it's a full URL, use it directly
    if (brand.url.startsWith("http://") || brand.url.startsWith("https://")) {
      return brand.url;
    }

    // If it's a Cloudinary path, construct the full URL
    const cloudinaryBaseUrl = "https://res.cloudinary.com/piin/image/upload/brand/";
    return `${cloudinaryBaseUrl}${brand.url}`;
  };

  const logoUrl = getLogoUrl();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4"
      style={{ margin: 0 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-600 rounded-t-lg">
          <h3 className="text-xl font-bold text-white">Brand Details</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Logo */}
          {logoUrl && (
            <div className="mb-6 flex justify-center">
              {!imageError ? (
                <img
                  src={logoUrl}
                  alt={brand.name}
                  className="max-h-32 object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <i className="fas fa-image text-4xl text-gray-400"></i>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {/* Brand ID */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">Brand ID:</div>
              <div className="col-span-2 text-gray-900">#{brand.brandId}</div>
            </div>

            {/* Brand Name */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">Brand Name:</div>
              <div className="col-span-2 text-gray-900 font-medium">
                {brand.name}
              </div>
            </div>

            {/* Country */}
            {brand.country && (
              <div className="grid grid-cols-3 gap-4">
                <div className="font-semibold text-gray-700">Country:</div>
                <div className="col-span-2 text-gray-900">{brand.country}</div>
              </div>
            )}

            {/* Description */}
            {brand.description && (
              <div className="grid grid-cols-3 gap-4">
                <div className="font-semibold text-gray-700">Description:</div>
                <div className="col-span-2 text-gray-900 whitespace-pre-wrap">
                  {brand.description}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
