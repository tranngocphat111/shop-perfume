import type { PurchaseInvoice } from "../../types";

interface PurchaseInvoiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: PurchaseInvoice | null;
}

export const PurchaseInvoiceViewModal = ({
  isOpen,
  onClose,
  invoice,
}: PurchaseInvoiceViewModalProps) => {
  if (!isOpen || !invoice || !invoice.details) return null;

  const detailsWithNames = invoice.details.map((detail) => {
    return {
      productId: detail.product.productId,
      productName: detail.product.name,
      quantity: detail.quantity,
      importPrice: detail.importPrice,
      subTotal: detail.quantity * detail.importPrice,
    };
  });

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-600 rounded-t-lg">
          <div>
            <h3 className="text-xl font-bold text-white">
              Purchase Invoice Details
            </h3>
            <p className="text-blue-100 text-sm mt-1">
              Invoice #{invoice.purchaseInvoiceId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 text-2xl transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Supplier & Email Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm text-gray-500 mb-2">
                <i className="fas fa-building mr-2"></i>Supplier
              </label>
              <p className="text-base font-normal text-gray-900">
                {invoice.supplier.name}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm text-gray-500 mb-2">
                <i className="fas fa-envelope mr-2"></i>Email
              </label>
              <p className="text-base font-normal text-gray-900">
                {invoice.email}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm text-gray-500 mb-2">
                <i className="fas fa-info-circle mr-2"></i>Status
              </label>
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                  statusColors[invoice.status] || "bg-gray-100 text-gray-800"
                }`}>
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Product Details Table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-800">
                <i className="fas fa-box-open mr-2"></i>Product Details
              </h4>
              <span className="text-sm text-gray-600">
                Total: {detailsWithNames.length} item(s)
              </span>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Import Price (đ)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sub Total (đ)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {detailsWithNames.map((detail, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {detail.productName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {detail.quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {detail.importPrice.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-blue-600">
                        {detail.subTotal.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-4 text-right text-sm font-bold text-gray-900">
                      Total Amount:
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-lg font-bold text-green-600">
                      {invoice.totalAmount.toLocaleString("vi-VN")} đ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-white rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
