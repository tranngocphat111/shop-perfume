import { motion, AnimatePresence } from "framer-motion";
import type { InventoryItem } from "../../services/inventory.service";

interface InventoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem | null;
}

export const InventoryDetailModal = ({
  isOpen,
  onClose,
  inventory,
}: InventoryDetailModalProps) => {
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Hết hàng", color: "red" };
    if (quantity < 20) return { label: "Sắp hết", color: "yellow" };
    return { label: "Còn hàng", color: "green" };
  };

  const status = inventory ? getStockStatus(inventory.quantity) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 overflow-y-auto"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {!inventory ? (
                <>
                  {/* Loading State */}
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Chi tiết tồn kho
                    </h2>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 transition-colors">
                      <i className="fas fa-times text-xl"></i>
                    </button>
                  </div>
                  <div className="p-6 flex items-center justify-center min-h-[300px]">
                    <div className="text-center">
                      <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                      <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Header */}
                  <div className="sticky top-0 bg-blue-600 px-6 py-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-xl font-semibold text-white">
                      Chi tiết tồn kho
                    </h2>
                    <button
                      onClick={onClose}
                      className="text-white hover:text-blue-100 transition-colors text-2xl">
                      ✕
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-6">
                    {/* Product Information */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Thông tin sản phẩm
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">ID</p>
                          <p className="text-base font-normal text-gray-900">
                            #{inventory.product.productId}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Tên sản phẩm
                          </p>
                          <p className="text-base font-normal text-gray-900">
                            {inventory.product.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Thương hiệu
                          </p>
                          <p className="text-base font-normal text-gray-900">
                            {inventory.product.brand.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Danh mục</p>
                          <p className="text-base font-normal text-gray-900">
                            {inventory.product.category.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Dung tích
                          </p>
                          <p className="text-base font-normal text-gray-900">
                            {inventory.product.columeMl} ml
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Giá bán</p>
                          <p className="text-base font-normal text-gray-900">
                            {inventory.product.unitPrice.toLocaleString()} đ
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Inventory Information */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Thông tin tồn kho
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            ID Inventory
                          </p>
                          <p className="text-base font-normal text-gray-900">
                            #{inventory.inventoryId}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Số lượng</p>
                          <p
                            className={`font-bold text-2xl ${
                              inventory.quantity < 20
                                ? "text-red-600"
                                : "text-green-600"
                            }`}>
                            {inventory.quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Trạng thái
                          </p>
                          <span
                            className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${
                              status?.color === "green"
                                ? "bg-green-100 text-green-800"
                                : status?.color === "yellow"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                            {status?.label || "N/A"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Cập nhật lần cuối
                          </p>
                          <p className="text-base font-normal text-gray-900">
                            {new Date(inventory.lastUpdated).toLocaleString(
                              "vi-VN"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Thông tin khác
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Giá trị tồn kho
                          </p>
                          <p className="font-bold text-lg text-blue-600">
                            {(
                              inventory.quantity * inventory.product.unitPrice
                            ).toLocaleString()}{" "}
                            đ
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Người cập nhật
                          </p>
                          <p className="font-medium text-gray-900">
                            {inventory.product.lastUpdatedBy || "Admin"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-gray-200 bg-white rounded-b-lg">
                    <button
                      onClick={onClose}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Đóng
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
