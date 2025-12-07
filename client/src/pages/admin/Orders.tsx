import { useState, useEffect } from "react";
import {
  AdminLayout,
  DataTable,
  type Column,
  ToastContainer,
} from "../../components/admin";
import { orderService } from "../../services/order.service";
import type { OrderResponse } from "../../types";
import { OrderDetailModal } from "../../components/admin/OrderDetailModal";
import { useToast } from "../../hooks/useToast";

interface OrderData extends Record<string, unknown> {
  id: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderDate: string;
}

export const Orders = () => {
  const {
    toasts,
    removeToast,
    success,
    error: showError,
    warning,
  } = useToast();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Sort and search states
  const [sortField, setSortField] = useState<string>("orderId");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<OrderResponse | null>(null);

  // Inline edit payment status states
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [editingPaymentValue, setEditingPaymentValue] = useState<string>("");

  const fetchOrders = async (
    page: number,
    size: number,
    sortBy?: string,
    direction?: string,
    search?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const pageResponse = await orderService.getOrdersPage(
        page,
        size,
        sortBy,
        direction,
        search
      );

      const transformedData: OrderData[] = pageResponse.content.map(
        (item: OrderResponse) => ({
          id: item.orderId,
          guestName: item.guestName,
          guestEmail: item.guestEmail,
          guestPhone: item.guestPhone,
          totalAmount: item.totalAmount,
          paymentMethod: item.payment?.method || "N/A",
          paymentStatus: item.payment?.status || "PENDING",
          orderDate: new Date(item.orderDate).toLocaleDateString("vi-VN"),
        })
      );

      setOrders(transformedData);
      setTotalElements(pageResponse.totalElements);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, pageSize, sortField, sortDirection, searchQuery);
  }, [currentPage, pageSize, sortField, sortDirection, searchQuery]);

  const handlePageChange = (page: number, size: number) => {
    if (size !== pageSize) {
      setCurrentPage(0);
      setPageSize(size);
    } else {
      setCurrentPage(page);
    }
  };

  // Map backend field to frontend field for display
  const backendToFrontendFieldMapping: Record<string, string> = {
    orderId: "id",
    guestName: "guestName",
    guestEmail: "guestEmail",
    guestPhone: "guestPhone",
    totalAmount: "totalAmount",
    "payment.method": "paymentMethod",
    "payment.status": "paymentStatus",
    orderDate: "orderDate",
  };

  const handleSort = (field: string) => {
    // Map frontend field names to backend field names
    const fieldMapping: Record<string, string> = {
      id: "orderId",
      guestName: "guestName",
      guestEmail: "guestEmail",
      guestPhone: "guestPhone",
      totalAmount: "totalAmount",
      paymentMethod: "payment.method",
      paymentStatus: "payment.status",
      orderDate: "orderDate",
    };

    const backendField = fieldMapping[field] || field;

    if (sortField === backendField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      // New field, default to DESC for date/id, ASC for others
      setSortField(backendField);
      setSortDirection(
        backendField === "orderId" || backendField === "orderDate"
          ? "DESC"
          : "ASC"
      );
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(0); // Reset to first page when searching
  };

  const columns: Column[] = [
    {
      key: "id",
      label: "Order ID",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "guestName",
      label: "Customer Name",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "guestEmail",
      label: "Email",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "guestPhone",
      label: "Phone",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "totalAmount",
      label: "Total Amount",
      sortable: true,
      onSort: handleSort,
      render: (value: number) => (
        <span className="whitespace-nowrap font-semibold text-green-600">
          {value.toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      key: "paymentMethod",
      label: "Payment Method",
      sortable: true,
      onSort: handleSort,
      render: (value: string) => {
        const methodColors: Record<string, string> = {
          COD: "bg-blue-100 text-blue-800",
          BANK_TRANSFER: "bg-purple-100 text-purple-800",
          VNPAY: "bg-orange-100 text-orange-800",
        };
        return (
          <span
            className={`inline-block whitespace-nowrap px-2 py-1 text-xs rounded font-semibold ${
              methodColors[value] || "bg-gray-100 text-gray-800"
            }`}>
            {value}
          </span>
        );
      },
    },
    {
      key: "paymentStatus",
      label: "Payment Status",
      sortable: true,
      onSort: handleSort,
      render: (value: string, row: OrderData) => {
        const statusColors: Record<string, string> = {
          PENDING: "bg-yellow-100 text-yellow-800",
          PAID: "bg-green-100 text-green-800",
          REFUNDED: "bg-purple-100 text-purple-800",
          FAILED: "bg-red-100 text-red-800",
        };

        if (editingPaymentId === row.id) {
          return (
            <select
              value={editingPaymentValue}
              onChange={(e) => handlePaymentChange(e.target.value)}
              onBlur={handlePaymentBlur}
              onKeyDown={handlePaymentKeyDown}
              autoFocus
              className="border border-blue-500 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="REFUNDED">REFUNDED</option>
            </select>
          );
        }

        const isEditable = value === "PAID";

        return (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              handlePaymentDoubleClick(row);
            }}
            className={`inline-block whitespace-nowrap px-2 py-1 text-xs rounded font-semibold ${
              isEditable
                ? "cursor-pointer hover:opacity-80"
                : "cursor-not-allowed"
            } ${statusColors[value] || "bg-gray-100 text-gray-800"}`}
            title={
              isEditable ? "Double-click to refund" : "Cannot edit this status"
            }>
            {value}
          </span>
        );
      },
    },
    {
      key: "orderDate",
      label: "Order Date",
      sortable: true,
      onSort: handleSort,
    },
  ];

  const handlePaymentDoubleClick = (item: OrderData) => {
    // Only allow editing if status is PAID
    if (item.paymentStatus !== "PAID") {
      warning("Only PAID payments can be refunded!");
      return;
    }
    setEditingPaymentId(item.id);
    setEditingPaymentValue("REFUNDED"); // Set to REFUNDED since that's the only valid transition
  };

  const handlePaymentChange = (value: string) => {
    setEditingPaymentValue(value);
  };

  const handlePaymentBlur = async () => {
    if (editingPaymentId && editingPaymentValue) {
      try {
        await orderService.updatePaymentStatus(
          editingPaymentId,
          editingPaymentValue
        );

        // Refresh the list
        await fetchOrders(
          currentPage,
          pageSize,
          sortField,
          sortDirection,
          searchQuery
        );

        success("Payment status updated successfully!");
      } catch (err) {
        console.error("Error updating payment status:", err);
        showError("Failed to update payment status. Please try again.");
      }
    }
    setEditingPaymentId(null);
    setEditingPaymentValue("");
  };

  const handlePaymentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePaymentBlur();
    } else if (e.key === "Escape") {
      setEditingPaymentId(null);
      setEditingPaymentValue("");
    }
  };

  const handleView = async (item: OrderData) => {
    try {
      const orderDetails = await orderService.getOrderById(item.id);
      setDetailOrder(orderDetails);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error("Error fetching order details:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      if (
        errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("không tìm thấy")
      ) {
        showError(`Order #${item.id} not found. It may have been deleted.`);
      } else {
        showError(`Failed to load order details: ${errorMessage}`);
      }
    }
  };

  if (loading && orders.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
            <p className="text-gray-600 mt-1">
              Manage customer orders and payment status
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm">
              Retry
            </button>
          </div>
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={orders}
          pageSize={pageSize}
          title="Orders"
          onView={handleView}
          searchPlaceholder="Search by customer name, email, phone... (For ID search: 'ID 101')"
          onSearch={handleSearch}
          serverSide={true}
          totalElements={totalElements}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          loading={loading}
          sortField={backendToFrontendFieldMapping[sortField] || sortField}
          sortDirection={sortDirection === "ASC" ? "asc" : "desc"}
        />

        {/* Detail Modal */}
        <OrderDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailOrder(null);
          }}
          order={detailOrder}
        />

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </AdminLayout>
  );
};
