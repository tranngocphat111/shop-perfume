import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (inventoryId: number, quantity: number) => void;
  inventoryId: number;
  productName: string;
  currentQuantity: number;
}

export const StockAdjustmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  inventoryId,
  productName,
  currentQuantity,
}: StockAdjustmentModalProps) => {
  const [quantity, setQuantity] = useState(currentQuantity);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setQuantity(currentQuantity);
      setError("");
    }
  }, [isOpen, currentQuantity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity < 0) {
      setError("Số lượng không được âm");
      return;
    }

    onSubmit(inventoryId, quantity);
  };

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1);
    setError("");
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      setQuantity((prev) => prev - 1);
      setError("");
    }
  };

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
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
                <h2 className="text-xl font-semibold text-white">
                  Điều chỉnh số lượng tồn kho
                </h2>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Product Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Sản phẩm</p>
                  <p className="text-base font-normal text-gray-900">
                    {productName}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Số lượng hiện tại:{" "}
                    <span className="font-semibold text-gray-700">
                      {currentQuantity}
                    </span>
                  </p>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    Số lượng mới <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors">
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setQuantity(value);
                        setError("");
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-center text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleIncrement}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors">
                      +
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>

                {/* Change Indicator */}
                {quantity !== currentQuantity && (
                  <div
                    className={`p-3 rounded-lg ${
                      quantity > currentQuantity
                        ? "bg-green-50 border border-green-200"
                        : quantity < currentQuantity
                        ? "bg-red-50 border border-red-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}>
                    <p
                      className={`text-sm font-medium ${
                        quantity > currentQuantity
                          ? "text-green-800"
                          : quantity < currentQuantity
                          ? "text-red-800"
                          : "text-gray-800"
                      }`}>
                      Thay đổi: {quantity > currentQuantity ? "+" : ""}
                      {quantity - currentQuantity}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
