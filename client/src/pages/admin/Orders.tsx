import { useState, useEffect } from "react";
import { AdminLayout, DataTable, type Column } from "../../components/admin";
import { orderService } from "../../services/order.service";
import type { OrderResponse } from "../../types";
import { OrderDetailModal } from "../../components/admin/OrderDetailModal";

interface OrderData extends Record<string, unknown> {
  id: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  shipmentStatus: string;
  orderDate: string;
}

export const Orders = () => {
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
          shipmentStatus: item.shipment?.status || "PENDING",
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
    "shipment.status": "shipmentStatus",
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
      shipmentStatus: "shipment.status",
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
      render: (value: string) => {
        const statusColors: Record<string, string> = {
          PENDING: "bg-yellow-100 text-yellow-800",
          COMPLETED: "bg-green-100 text-green-800",
          CANCELLED: "bg-red-100 text-red-800",
          FAILED: "bg-red-100 text-red-800",
        };
        return (
          <span
            className={`inline-block whitespace-nowrap px-2 py-1 text-xs rounded font-semibold ${
              statusColors[value] || "bg-gray-100 text-gray-800"
            }`}>
            {value}
          </span>
        );
      },
    },
    {
      key: "shipmentStatus",
      label: "Shipment Status",
      sortable: true,
      onSort: handleSort,
      render: (value: string) => {
        const statusColors: Record<string, string> = {
          PENDING: "bg-yellow-100 text-yellow-800",
          PROCESSING: "bg-blue-100 text-blue-800",
          SHIPPED: "bg-purple-100 text-purple-800",
          DELIVERED: "bg-green-100 text-green-800",
          CANCELLED: "bg-red-100 text-red-800",
        };
        return (
          <span
            className={`inline-block whitespace-nowrap px-2 py-1 text-xs rounded font-semibold ${
              statusColors[value] || "bg-gray-100 text-gray-800"
            }`}>
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

  const handleView = async (item: OrderData) => {
    try {
      const orderDetails = await orderService.getOrderById(item.id);
      setDetailOrder(orderDetails);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error("Error fetching order details:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      let userMessage = `❌ Không thể tải thông tin đơn hàng!\n\n`;

      if (
        errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("không tìm thấy")
      ) {
        userMessage += `Lỗi: Không tìm thấy đơn hàng với ID ${item.id}\n`;
        userMessage += `Đơn hàng này có thể đã bị xóa.`;
      } else {
        userMessage += `Chi tiết lỗi: ${errorMessage}\n`;
        userMessage += `Vui lòng thử lại sau.`;
      }

      alert(userMessage);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
      </div>
    </AdminLayout>
  );
};
