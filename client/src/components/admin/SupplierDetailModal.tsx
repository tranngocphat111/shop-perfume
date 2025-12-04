import type { Supplier } from "../../types";

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

export const SupplierDetailModal = ({
  isOpen,
  onClose,
  supplier,
}: SupplierDetailModalProps) => {
  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 my-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-blue-600 rounded-t-lg">
          <h3 className="text-xl font-bold text-white">Supplier Details</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 text-2xl transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supplier ID */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Supplier ID
              </label>
              <p className="text-base font-normal text-gray-900">
                #{supplier.supplierId}
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Supplier Name
              </label>
              <p className="text-base font-normal text-gray-900">
                {supplier.name}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">Email</label>
              <p className="text-base font-normal text-gray-900">
                <a
                  href={`mailto:${supplier.email}`}
                  className="text-blue-600 hover:underline">
                  {supplier.email}
                </a>
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Phone Number
              </label>
              <p className="text-base font-normal text-gray-900">
                <a
                  href={`tel:${supplier.phone}`}
                  className="text-blue-600 hover:underline">
                  {supplier.phone}
                </a>
              </p>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-500 mb-1">
                Address
              </label>
              <p className="text-base font-normal text-gray-900">
                {supplier.address}
              </p>
            </div>

            {/* Created At */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Created At
              </label>
              <p className="text-base font-normal text-gray-900">
                {new Date(supplier.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Created By */}
            {supplier.createdBy && (
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Created By
                </label>
                <p className="text-base font-normal text-gray-900">
                  {supplier.createdBy}
                </p>
              </div>
            )}

            {/* Last Updated */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Last Updated
              </label>
              <p className="text-base font-normal text-gray-900">
                {new Date(supplier.lastUpdated).toLocaleString()}
              </p>
            </div>

            {/* Last Updated By */}
            {supplier.lastUpdatedBy && (
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Last Updated By
                </label>
                <p className="text-base font-normal text-gray-900">
                  {supplier.lastUpdatedBy}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-white rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
