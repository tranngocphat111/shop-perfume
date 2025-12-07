import type { Category } from "../../services/category.service";

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
}

export const CategoryDetailModal = ({
  isOpen,
  onClose,
  category,
}: CategoryDetailModalProps) => {
  if (!isOpen || !category) return null;

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case "MALE":
        return "Male";
      case "FEMALE":
        return "Female";
      case "UNISEX":
        return "Unisex";
    }
  };

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
          <h3 className="text-xl font-bold text-white">Category Details</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-4">
            {/* Category ID */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">Category ID:</div>
              <div className="col-span-2 text-gray-900">
                #{category.categoryId}
              </div>
            </div>

            {/* Category Name */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">Category Name:</div>
              <div className="col-span-2 text-gray-900 font-medium">
                {category.name}
              </div>
            </div>

            {/* Gender */}
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-700">Gender:</div>
              <div className="col-span-2 text-gray-900">
                {getGenderLabel(category.gender)}
              </div>
            </div>

            {/* Description */}
            {category.description && (
              <div className="grid grid-cols-3 gap-4">
                <div className="font-semibold text-gray-700">Description:</div>
                <div className="col-span-2 text-gray-900 whitespace-pre-wrap">
                  {category.description}
                </div>
              </div>
            )}

            {/* Created At */}
            {category.createdAt && (
              <div className="grid grid-cols-3 gap-4">
                <div className="font-semibold text-gray-700">Created At:</div>
                <div className="col-span-2 text-gray-900">
                  {new Date(category.createdAt).toLocaleString()}
                </div>
              </div>
            )}

            {/* Created By */}
            {category.createdBy && (
              <div className="grid grid-cols-3 gap-4">
                <div className="font-semibold text-gray-700">Created By:</div>
                <div className="col-span-2 text-gray-900">
                  {category.createdBy}
                </div>
              </div>
            )}

            {/* Last Updated */}
            {category.lastUpdated && (
              <div className="grid grid-cols-3 gap-4">
                <div className="font-semibold text-gray-700">Last Updated:</div>
                <div className="col-span-2 text-gray-900">
                  {new Date(category.lastUpdated).toLocaleString()}
                </div>
              </div>
            )}

            {/* Last Updated By */}
            {category.lastUpdatedBy && (
              <div className="grid grid-cols-3 gap-4">
                <div className="font-semibold text-gray-700">Updated By:</div>
                <div className="col-span-2 text-gray-900">
                  {category.lastUpdatedBy}
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
