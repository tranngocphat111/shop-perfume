import type { Product } from "@/types";
import { CLOUDINARY_BASE_URL } from "../../utils/helpers";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ProductDetailModal = ({
  isOpen,
  onClose,
  product,
}: ProductDetailModalProps) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <h3 className="text-xl font-bold">Product Details</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Product ID */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Product ID
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  #{product.productId}
                </p>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Product Name
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {product.name}
                </p>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Brand
                </label>
                <p className="text-base text-gray-900">{product.brand.name}</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Category
                </label>
                <p className="text-base text-gray-900">
                  {product.category.name}
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Status
                </label>
                <span
                  className={`inline-block px-3 py-1 text-sm font-semibold rounded ${
                    product.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                  {product.status}
                </span>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Unit Price
                </label>
                <p className="text-xl font-bold text-blue-600">
                  {product.unitPrice.toLocaleString()} đ
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Volume */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Volume
                </label>
                <p className="text-base text-gray-900">{product.columeMl} ml</p>
              </div>

              {/* Longevity */}
              {product.perfumeLongevity && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Longevity
                  </label>
                  <p className="text-base text-gray-900">
                    {product.perfumeLongevity}
                  </p>
                </div>
              )}

              {/* Concentration */}
              {product.perfumeConcentration && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Concentration
                  </label>
                  <p className="text-base text-gray-900">
                    {product.perfumeConcentration}
                  </p>
                </div>
              )}

              {/* Release Year */}
              {product.releaseYear && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Release Year
                  </label>
                  <p className="text-base text-gray-900">
                    {product.releaseYear}
                  </p>
                </div>
              )}

              {/* Created By */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Created By
                </label>
                <p className="text-base text-gray-900">
                  {product.createdBy || "System"}
                </p>
              </div>

              {/* Last Updated By */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Last Updated By
                </label>
                <p className="text-base text-gray-900">
                  {product.lastUpdatedBy || "System"}
                </p>
              </div>
            </div>

            {/* Description - Full Width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Description
              </label>
              <p className="text-base text-gray-900 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Timestamps - Full Width */}
            <div className="md:col-span-2 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Created At
                  </label>
                  <p className="text-sm text-gray-700">
                    {new Date(product.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Last Updated
                  </label>
                  <p className="text-sm text-gray-700">
                    {new Date(product.lastUpdated).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Images */}
            {product.images && product.images.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Product Images
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {product.images.map((image) => {
                    console.log(image.primary);
                    return (
                      <div
                        key={image.imageId}
                        className={`relative rounded-lg overflow-hidden border-2 ${
                          image.primary ? "border-blue-500" : "border-gray-200"
                        }`}>
                        <img
                          src={`${CLOUDINARY_BASE_URL}${image.url}`}
                          alt={`Product ${product.name}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/300x360/f0f0f0/333333?text=No+Image";
                          }}
                        />
                        {image.primary && (
                          <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Primary
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
