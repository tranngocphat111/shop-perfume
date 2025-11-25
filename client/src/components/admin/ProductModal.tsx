import { useState, useEffect } from "react";
import type { Brand, Category } from "../../types";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  initialData?: ProductFormData;
  mode: "add" | "edit";
  brands: Brand[];
  categories: Category[];
  isSubmitting?: boolean;
}

export interface ProductFormData {
  productId?: number;
  name: string;
  description: string;
  perfumeLongevity: string;
  perfumeConcentration: string;
  releaseYear: string;
  columeMl: number;
  status: "ACTIVE" | "INACTIVE";
  unitPrice: number;
  brandId: number;
  categoryId: number;
  images?: File[];
  primaryImageIndex?: number;
  existingImages?: { imageId: number; url: string; primary: boolean }[];
  imagesToDelete?: number[];
}

export const ProductModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  brands,
  categories,
}: ProductModalProps) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    perfumeLongevity: "",
    perfumeConcentration: "",
    releaseYear: new Date().getFullYear().toString(),
    columeMl: 0,
    status: "ACTIVE",
    unitPrice: 0,
    brandId: 0,
    categoryId: 0,
    images: [],
    primaryImageIndex: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState<
    { imageId: number; url: string; primary: boolean }[]
  >([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Load existing images for edit mode
      if (mode === "edit" && initialData.existingImages) {
        setExistingImages(initialData.existingImages);
        setImagesToDelete([]);
      } else {
        setExistingImages([]);
        setImagesToDelete([]);
      }
    } else {
      setFormData({
        name: "",
        description: "",
        perfumeLongevity: "",
        perfumeConcentration: "",
        releaseYear: new Date().getFullYear().toString(),
        columeMl: 0,
        status: "ACTIVE",
        unitPrice: 0,
        brandId: 0,
        categoryId: 0,
        images: [],
        primaryImageIndex: 0,
      });
      setExistingImages([]);
      setImagesToDelete([]);
    }
    setErrors({});
    setImagePreviews([]);
  }, [initialData, isOpen, mode]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.brandId === 0) {
      newErrors.brandId = "Please select a brand";
    }

    if (formData.categoryId === 0) {
      newErrors.categoryId = "Please select a category";
    }

    if (formData.columeMl <= 0) {
      newErrors.columeMl = "Volume must be greater than 0";
    }

    if (formData.unitPrice <= 0) {
      newErrors.unitPrice = "Price must be greater than 0";
    }

    // Validate images for both add and edit mode
    if (mode === "add" && (!formData.images || formData.images.length === 0)) {
      newErrors.images = "At least 1 image is required";
    }

    // For edit mode, check if there's at least one image (existing or new)
    if (mode === "edit") {
      const remainingExisting = existingImages.filter(
        (img) => !imagesToDelete.includes(img.imageId)
      ).length;
      const newImages = formData.images?.length || 0;
      if (remainingExisting + newImages === 0) {
        newErrors.images = "At least 1 image is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setFormData({ ...formData, images: fileArray, primaryImageIndex: 0 });

      // Create preview URLs
      const previewUrls = fileArray.map((file) => URL.createObjectURL(file));
      setImagePreviews(previewUrls);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images?.filter((_, i) => i !== index) || [];
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Revoke old URL
    if (imagePreviews[index]) {
      URL.revokeObjectURL(imagePreviews[index]);
    }

    // Adjust primary index if needed
    let newPrimaryIndex = formData.primaryImageIndex || 0;
    if (newPrimaryIndex >= newImages.length) {
      newPrimaryIndex = Math.max(0, newImages.length - 1);
    }

    setFormData({
      ...formData,
      images: newImages,
      primaryImageIndex: newPrimaryIndex,
    });
    setImagePreviews(newPreviews);
  };

  const handleSetPrimary = (index: number) => {
    setFormData({ ...formData, primaryImageIndex: index });
  };

  const handleRemoveExistingImage = (imageId: number) => {
    setImagesToDelete([...imagesToDelete, imageId]);
  };

  const handleRestoreExistingImage = (imageId: number) => {
    setImagesToDelete(imagesToDelete.filter((id) => id !== imageId));
  };

  const handleSetExistingPrimary = (imageId: number) => {
    const updatedExisting = existingImages.map((img) => ({
      ...img,
      primary: img.imageId === imageId,
    }));
    setExistingImages(updatedExisting);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        const submitData = {
          ...formData,
          existingImages,
          imagesToDelete,
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
      style={{ margin: 0 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 my-8 relative">
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-3"></i>
              <p className="text-gray-700 font-medium">
                {mode === "add" ? "Adding product..." : "Saving changes..."}
              </p>
              <p className="text-sm text-gray-500 mt-1">Please wait</p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-lg">
          <h3 className="text-xl font-bold text-gray-800">
            {mode === "add" ? "Add New Product" : "Edit Product"}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50 disabled:cursor-not-allowed">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter product description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.brandId}
                onChange={(e) =>
                  setFormData({ ...formData, brandId: Number(e.target.value) })
                }
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.brandId ? "border-red-500" : "border-gray-300"
                }`}>
                <option value={0}>Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand.brandId} value={brand.brandId}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {errors.brandId && (
                <p className="mt-1 text-sm text-red-500">{errors.brandId}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    categoryId: Number(e.target.value),
                  })
                }
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.categoryId ? "border-red-500" : "border-gray-300"
                }`}>
                <option value={0}>Select Category</option>
                {categories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>
              )}
            </div>

            {/* Perfume Longevity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longevity
              </label>
              <input
                type="text"
                value={formData.perfumeLongevity}
                onChange={(e) =>
                  setFormData({ ...formData, perfumeLongevity: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="e.g., Long lasting, Moderate"
              />
            </div>

            {/* Perfume Concentration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concentration
              </label>
              <input
                type="text"
                value={formData.perfumeConcentration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    perfumeConcentration: e.target.value,
                  })
                }
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="e.g., EDP, EDT, EAU"
              />
            </div>

            {/* Release Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Release Year
              </label>
              <input
                type="text"
                value={formData.releaseYear}
                onChange={(e) =>
                  setFormData({ ...formData, releaseYear: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="e.g., 2024"
              />
            </div>

            {/* Volume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume (ml) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.columeMl}
                onChange={(e) =>
                  setFormData({ ...formData, columeMl: Number(e.target.value) })
                }
                min="0"
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.columeMl ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter volume"
              />
              {errors.columeMl && (
                <p className="mt-1 text-sm text-red-500">{errors.columeMl}</p>
              )}
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Price (đ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unitPrice: Number(e.target.value),
                  })
                }
                min="0"
                step="1000"
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.unitPrice ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter price"
              />
              {errors.unitPrice && (
                <p className="mt-1 text-sm text-red-500">{errors.unitPrice}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "ACTIVE" | "INACTIVE",
                  })
                }
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Images Upload - For Both Add and Edit Mode */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images <span className="text-red-500">*</span>
              </label>

              {/* Existing Images for Edit Mode */}
              {mode === "edit" && existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {existingImages.map((image) => {
                      const isDeleted = imagesToDelete.includes(image.imageId);
                      return (
                        <div
                          key={image.imageId}
                          className={`relative border-2 rounded-lg overflow-hidden ${
                            isDeleted
                              ? "border-red-300 opacity-50"
                              : image.primary
                              ? "border-blue-500"
                              : "border-gray-200"
                          }`}>
                          <img
                            src={`https://res.cloudinary.com/piin/image/upload/${image.url}`}
                            alt="Product"
                            className="w-full h-32 object-cover"
                          />
                          {image.primary && !isDeleted && (
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1">
                              Primary
                            </div>
                          )}
                          {isDeleted && (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1">
                              Deleted
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 flex justify-around p-1">
                            {!isDeleted && (
                              <>
                                {!image.primary && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSetExistingPrimary(image.imageId)
                                    }
                                    disabled={isSubmitting}
                                    className="text-white text-xs hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Set as primary">
                                    <i className="fas fa-star"></i>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveExistingImage(image.imageId)
                                  }
                                  disabled={isSubmitting}
                                  className="text-white text-xs hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Mark for deletion">
                                  <i className="fas fa-trash"></i>
                                </button>
                              </>
                            )}
                            {isDeleted && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRestoreExistingImage(image.imageId)
                                }
                                disabled={isSubmitting}
                                className="text-white text-xs hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Restore image">
                                <i className="fas fa-undo"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload New Images */}
              {
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {mode === "edit" ? "Add New Images:" : "Upload Images:"}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.images ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.images && (
                    <p className="mt-1 text-sm text-red-500">{errors.images}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {mode === "edit"
                      ? "Upload additional images for this product."
                      : "Select at least 1 image. First image will be set as primary."}
                  </p>

                  {/* New Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">New Images:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {imagePreviews.map((preview, index) => (
                          <div
                            key={index}
                            className={`relative border-2 rounded-lg overflow-hidden ${
                              formData.primaryImageIndex === index
                                ? "border-green-500"
                                : "border-gray-200"
                            }`}>
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            {formData.primaryImageIndex === index && (
                              <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1">
                                New Primary
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 flex justify-around p-1">
                              {mode === "add" &&
                                formData.primaryImageIndex !== index && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimary(index)}
                                    disabled={isSubmitting}
                                    className="text-white text-xs hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Set as primary">
                                    <i className="fas fa-star"></i>
                                  </button>
                                )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                disabled={isSubmitting}
                                className="text-white text-xs hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove image">
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              }
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isSubmitting && <i className="fas fa-spinner fa-spin"></i>}
              {isSubmitting
                ? "Processing..."
                : mode === "add"
                ? "Add Product"
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
