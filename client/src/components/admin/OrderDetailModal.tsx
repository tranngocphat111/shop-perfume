import type { OrderResponse } from "../../types";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderResponse | null;
}

export const OrderDetailModal = ({
  isOpen,
  onClose,
  order,
}: OrderDetailModalProps) => {
  if (!isOpen || !order) return null;

  const paymentStatusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    FAILED: "bg-red-100 text-red-800",
  };

  const paymentMethodColors: Record<string, string> = {
    COD: "bg-blue-100 text-blue-800",
    BANK_TRANSFER: "bg-purple-100 text-purple-800",
    VNPAY: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg">
          <div>
            <h3 className="text-xl font-bold text-white">Order Details</h3>
            <p className="text-blue-100 text-sm mt-1">Order #{order.orderId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 text-2xl transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Customer, Payment & Shipment Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-800 border-b pb-2">
                <i className="fas fa-user mr-2"></i>Customer Information
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Name
                  </label>
                  <p className="text-base font-semibold text-gray-900">
                    {order.guestName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <p className="text-base text-gray-900">{order.guestEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Phone
                  </label>
                  <p className="text-base text-gray-900">{order.guestPhone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Address
                  </label>
                  <p className="text-base text-gray-900">
                    {order.guestAddress}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-800 border-b pb-2">
                <i className="fas fa-credit-card mr-2"></i>Payment Information
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Payment Method
                  </label>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                      paymentMethodColors[order.payment?.method || ""] ||
                      "bg-gray-100 text-gray-800"
                    }`}>
                    {order.payment?.method || "N/A"}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Payment Status
                  </label>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                      paymentStatusColors[order.payment?.status || "PENDING"]
                    }`}>
                    {order.payment?.status || "PENDING"}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Payment Amount
                  </label>
                  <p className="text-lg font-bold text-green-600">
                    {(
                      order.payment?.amount || order.totalAmount
                    ).toLocaleString("vi-VN")}{" "}
                    đ
                  </p>
                </div>
                {order.payment?.paymentDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Payment Date
                    </label>
                    <p className="text-base text-gray-900">
                      {new Date(order.payment.paymentDate).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Order Date
                  </label>
                  <p className="text-base text-gray-900">
                    {new Date(order.orderDate).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-800 border-b pb-2">
                <i className="fas fa-shipping-fast mr-2"></i>Shipment
                Information
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Shipment Status
                  </label>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                      order.shipment?.status === "DELIVERED"
                        ? "bg-green-100 text-green-800"
                        : order.shipment?.status === "SHIPPED"
                        ? "bg-purple-100 text-purple-800"
                        : order.shipment?.status === "PROCESSING"
                        ? "bg-blue-100 text-blue-800"
                        : order.shipment?.status === "CANCELLED"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                    {order.shipment?.status || "PENDING"}
                  </span>
                </div>
                {order.shipment?.trackingNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Tracking Number
                    </label>
                    <p className="text-base font-mono text-gray-900">
                      {order.shipment.trackingNumber}
                    </p>
                  </div>
                )}
                {order.shipment?.carrier && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Carrier
                    </label>
                    <p className="text-base text-gray-900">
                      {order.shipment.carrier}
                    </p>
                  </div>
                )}
                {order.shipment?.shippedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Shipped Date
                    </label>
                    <p className="text-base text-gray-900">
                      {new Date(order.shipment.shippedDate).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                )}
                {order.shipment?.deliveredDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Delivered Date
                    </label>
                    <p className="text-base text-green-600 font-semibold">
                      {new Date(order.shipment.deliveredDate).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-800">
                <i className="fas fa-box-open mr-2"></i>Order Items
              </h4>
              <span className="text-sm text-gray-600">
                Total: {order.orderItems.length} item(s)
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
                      Unit Price (đ)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sub Total (đ)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.orderItems.map((item, index) => (
                    <tr key={item.orderItemId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-gray-500">
                            ID: {item.productId}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {item.unitPrice.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-blue-600">
                        {item.subTotal.toLocaleString("vi-VN")}
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
                      {order.totalAmount.toLocaleString("vi-VN")} đ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
            <i className="fas fa-times mr-2"></i>Close
          </button>
        </div>
      </div>
    </div>
  );
};
