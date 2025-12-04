import { useState, useEffect } from "react";
import {
  AdminLayout,
  CustomerDetailModal,
  DataTable,
  type Column,
  ToastContainer,
} from "../../components/admin";
import { userService } from "../../services/user.service";
import type { UserDetailResponse } from "../../types";
import { useToast } from "../../hooks/useToast";

interface CustomerData extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
  provider: string;
  status: string;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  roles: string;
  createdAt: string;
}

export const Customers = () => {
  const { toasts, removeToast, success, error: showError } = useToast();

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Sort and search states
  const [sortField, setSortField] = useState<string>("userId");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] =
    useState<UserDetailResponse | null>(null);

  // Inline edit status states
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editingStatusValue, setEditingStatusValue] = useState<string>("");

  const fetchCustomers = async (
    page: number,
    size: number,
    sortBy?: string,
    direction?: string,
    search?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const pageResponse = await userService.getUsersPage(
        page,
        size,
        sortBy,
        direction,
        search
      );

      const transformedData: CustomerData[] = pageResponse.content.map(
        (item: UserDetailResponse) => ({
          id: item.userId,
          name: item.name,
          email: item.email,
          provider: item.provider || "LOCAL",
          status: item.status,
          loyaltyPoints: item.loyaltyPoints || 0,
          totalOrders: item.totalOrders || 0,
          totalSpent: item.totalSpent || 0,
          roles: item.roles.join(", "),
          createdAt: new Date(item.createdAt).toLocaleDateString("vi-VN"),
        })
      );

      setCustomers(transformedData);
      setTotalElements(pageResponse.totalElements);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customers data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(
      currentPage,
      pageSize,
      sortField,
      sortDirection,
      searchQuery
    );
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
    userId: "id",
    name: "name",
    email: "email",
    provider: "provider",
    status: "status",
    loyaltyPoints: "loyaltyPoints",
    createdAt: "createdAt",
  };

  const handleSort = (field: string) => {
    // Map frontend field names to backend field names
    const fieldMapping: Record<string, string> = {
      id: "userId",
      name: "name",
      email: "email",
      provider: "provider",
      status: "status",
      loyaltyPoints: "loyaltyPoints",
      totalOrders: "totalOrders",
      totalSpent: "totalSpent",
      roles: "roles",
      createdAt: "createdAt",
    };

    const backendField = fieldMapping[field] || field;

    if (sortField === backendField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      // New field, default to DESC for date/id, ASC for others
      setSortField(backendField);
      setSortDirection(
        backendField === "userId" || backendField === "createdAt"
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
      label: "ID",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "provider",
      label: "Provider",
      sortable: true,
      onSort: handleSort,
      render: (value: string) => {
        const providerColors: Record<string, string> = {
          LOCAL: "bg-blue-100 text-blue-800",
          GOOGLE: "bg-red-100 text-red-800",
        };
        return (
          <span
            className={`inline-block whitespace-nowrap px-2 py-1 text-xs rounded font-semibold ${
              providerColors[value] || "bg-gray-100 text-gray-800"
            }`}>
            {value}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      onSort: handleSort,
      render: (value: string, row: CustomerData) => {
        const statusColors: Record<string, string> = {
          ACTIVE: "bg-green-100 text-green-800",
          INACTIVE: "bg-red-100 text-red-800",
          BANNED: "bg-red-100 text-red-800",
          DELETED: "bg-gray-100 text-gray-800",
        };

        if (editingStatusId === row.id) {
          return (
            <select
              value={editingStatusValue}
              onChange={(e) => handleStatusChange(e.target.value)}
              onBlur={handleStatusBlur}
              onKeyDown={handleStatusKeyDown}
              autoFocus
              className="border border-blue-500 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ACTIVE">ACTIVE</option>
              <option value="DELETED">DELETED</option>
            </select>
          );
        }

        const isEditable = value === "ACTIVE" || value === "DELETED";

        return (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleStatusDoubleClick(row);
            }}
            className={`inline-block whitespace-nowrap px-2 py-1 text-xs rounded font-semibold ${
              isEditable
                ? "cursor-pointer hover:opacity-80"
                : "cursor-not-allowed"
            } ${statusColors[value] || "bg-gray-100 text-gray-800"}`}
            title={
              isEditable ? "Double-click to edit" : "Cannot edit this status"
            }>
            {value}
          </span>
        );
      },
    },
    {
      key: "loyaltyPoints",
      label: "Points",
      sortable: true,
      onSort: handleSort,
      render: (value: number) => (
        <span className="font-semibold text-purple-600">{value}</span>
      ),
    },
    {
      key: "totalOrders",
      label: "Orders",
      sortable: true,
      onSort: handleSort,
      render: (value: number) => (
        <span className="font-semibold text-blue-600">{value}</span>
      ),
    },
    {
      key: "totalSpent",
      label: "Total Spent",
      sortable: true,
      onSort: handleSort,
      render: (value: number) => (
        <span className="whitespace-nowrap font-semibold text-green-600">
          {value.toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      key: "roles",
      label: "Roles",
      sortable: false,
    },
    {
      key: "createdAt",
      label: "Joined Date",
      sortable: true,
      onSort: handleSort,
    },
  ];

  const handleStatusDoubleClick = (item: CustomerData) => {
    setEditingStatusId(item.id);
    setEditingStatusValue(item.status);
  };

  const handleStatusChange = (value: string) => {
    setEditingStatusValue(value);
  };

  const handleStatusBlur = async () => {
    if (editingStatusId && editingStatusValue) {
      try {
        await userService.updateUserStatus(editingStatusId, editingStatusValue);

        // Refresh the list
        await fetchCustomers(
          currentPage,
          pageSize,
          sortField,
          sortDirection,
          searchQuery
        );

        success("User status updated successfully!");
      } catch (err) {
        console.error("Error updating user status:", err);
        showError("Failed to update user status. Please try again.");
      }
    }
    setEditingStatusId(null);
    setEditingStatusValue("");
  };

  const handleStatusKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleStatusBlur();
    } else if (e.key === "Escape") {
      setEditingStatusId(null);
      setEditingStatusValue("");
    }
  };

  const handleView = async (item: CustomerData) => {
    try {
      const customerDetails = await userService.getUserById(item.id);
      setDetailCustomer(customerDetails);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error("Error fetching customer details:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      if (
        errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("không tìm thấy")
      ) {
        showError(`Customer #${item.id} not found. It may have been deleted.`);
      } else {
        showError(`Failed to load customer details: ${errorMessage}`);
      }
    }
  };

  if (loading && customers.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
            <p className="text-gray-600">Loading customers...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
            <p className="text-gray-600 mt-1">
              Manage customer accounts and information
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
          data={customers}
          pageSize={pageSize}
          title="Customers"
          onView={handleView}
          searchPlaceholder="Search by name, email... (For ID search: 'ID 101')"
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
        <CustomerDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailCustomer(null);
          }}
          customer={detailCustomer}
        />

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </AdminLayout>
  );
};
