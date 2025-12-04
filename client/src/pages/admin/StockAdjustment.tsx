import { useState, useEffect } from "react";
import { AdminLayout, DataTable, type Column } from "../../components/admin";
import {
  inventoryService,
  type InventoryItem,
} from "@/services/inventory.service";
import { StockAdjustmentModal } from "../../components/admin/StockAdjustmentModal";
import { InventoryDetailModal } from "../../components/admin/InventoryDetailModal";

interface StockAdjustment extends Record<string, unknown> {
  id: number;
  productId: number;
  productName: string;
  brand: string;
  category: string;
  quantity: number;
  columeMl: number;
  unitPrice: number;
  status: string;
  lastUpdated: string;
  updatedBy: string;
}

export const StockAdjustments = () => {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<string>("product.productId");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] =
    useState<InventoryItem | null>(null);
  const [editInventoryId, setEditInventoryId] = useState<number>(0);
  const [editProductName, setEditProductName] = useState<string>("");
  const [editCurrentQuantity, setEditCurrentQuantity] = useState<number>(0);

  const fetchInventory = async (
    page: number,
    size: number,
    sortBy?: string,
    direction?: string,
    search?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const pageResponse = await inventoryService.getInventoryPage(
        page,
        size,
        sortBy,
        direction as "ASC" | "DESC" | undefined,
        search
      );

      const transformedData: StockAdjustment[] = pageResponse.content.map(
        (item: InventoryItem) => ({
          id: item.inventoryId,
          productId: item.product.productId,
          productName: item.product.name,
          brand: item.product.brand.name,
          category: item.product.category.name,
          quantity: item.quantity,
          columeMl: item.product.columeMl,
          unitPrice: item.product.unitPrice,
          status:
            item.quantity === 0
              ? "Out of Stock"
              : item.quantity < 20
              ? "Low Stock"
              : "In Stock",
          lastUpdated: new Date(item.lastUpdated).toLocaleDateString(),
          updatedBy: item.product.lastUpdatedBy || "Admin",
        })
      );

      setAdjustments(transformedData);
      setTotalElements(pageResponse.totalElements);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError("Failed to load inventory data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory(
      currentPage,
      pageSize,
      sortField,
      sortDirection,
      searchQuery
    );
  }, [currentPage, pageSize, sortField, sortDirection, searchQuery]);

  const handlePageChange = (page: number, size: number) => {
    // Nếu size thay đổi, reset về trang đầu
    if (size !== pageSize) {
      setCurrentPage(0);
      setPageSize(size);
    } else {
      // Chỉ thay đổi page
      setCurrentPage(page);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(0); // Reset về trang đầu khi tìm kiếm
  };

  const handleSort = (field: string) => {
    // Map frontend field names to backend field names
    const fieldMapping: Record<string, string> = {
      productId: "product.productId",
      productName: "product.name",
      brand: "product.brand.name",
      category: "product.category.name",
      quantity: "quantity",
      columeMl: "product.columeMl",
      unitPrice: "product.unitPrice",
      status: "quantity", // sắp xếp theo quantity cho status
      lastUpdated: "lastUpdated",
      updatedBy: "product.lastUpdatedBy",
    };

    const backendField = fieldMapping[field] || field;

    if (sortField === backendField) {
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      setSortField(backendField);
      setSortDirection(
        backendField === "product.productId" || backendField === "lastUpdated"
          ? "DESC"
          : "ASC"
      );
    }
  };

  // Map backend field to frontend field for display
  const backendToFrontendFieldMapping: Record<string, string> = {
    "product.productId": "productId",
    "product.name": "productName",
    "product.brand.name": "brand",
    "product.category.name": "category",
    quantity: "quantity",
    "product.columeMl": "columeMl",
    "product.unitPrice": "unitPrice",
    lastUpdated: "lastUpdated",
    "product.lastUpdatedBy": "updatedBy",
  };

  const columns: Column[] = [
    {
      key: "productId",
      label: "ID",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "productName",
      label: "Product Name",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "brand",
      label: "Brand",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "quantity",
      label: "Quantity",
      sortable: true,
      onSort: handleSort,
      render: (value: number) => (
        <span
          className={`font-semibold ${
            value < 20 ? "text-red-600" : "text-green-600"
          }`}>
          {value}
        </span>
      ),
    },
    {
      key: "columeMl",
      label: "Volume (ml)",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "unitPrice",
      label: "Price",
      sortable: true,
      onSort: handleSort,
      render: (value: number) => (
        <span className="whitespace-nowrap">{`${value.toFixed(0)} đ`}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      onSort: handleSort,
      render: (value: string) => (
        <span
          className={`inline-block whitespace-nowrap px-2 py-1 text-xs rounded ${
            value === "In Stock"
              ? "bg-green-100 text-green-800"
              : value === "Low Stock"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}>
          {value}
        </span>
      ),
    },
    {
      key: "lastUpdated",
      label: "Last Updated",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "updatedBy",
      label: "Updated By",
      sortable: true,
      onSort: handleSort,
    },
  ];

  const handleView = async (item: StockAdjustment) => {
    try {
      console.log("handleView called with item:", item);
      console.log("Fetching inventory with ID:", item.id);

      // Set modal open first to show loading state
      setIsDetailModalOpen(true);

      // Now id is inventoryId, so we can directly use it
      const inventoryData = await inventoryService.getInventoryById(item.id);
      console.log("Inventory data received:", inventoryData);

      if (!inventoryData) {
        throw new Error("No data returned from API");
      }

      setSelectedInventory(inventoryData);
    } catch (err) {
      console.error("Error fetching inventory details:", err);
      setIsDetailModalOpen(false); // Close modal on error
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(`❌ Không thể tải thông tin chi tiết.\n\nLỗi: ${errorMessage}`);
    }
  };

  // const handleEdit = (item: StockAdjustment) => {
  //   setEditInventoryId(item.id);
  //   setEditProductName(item.productName);
  //   setEditCurrentQuantity(item.quantity);
  //   setIsEditModalOpen(true);
  // };

  const handleModalSubmit = async (inventoryId: number, quantity: number) => {
    try {
      await inventoryService.updateInventory(inventoryId, quantity);

      alert(
        `✅ Cập nhật số lượng tồn kho thành công!\n\nSản phẩm: ${editProductName}\nSố lượng mới: ${quantity}`
      );

      setIsEditModalOpen(false);
      setEditInventoryId(0);
      setEditProductName("");
      setEditCurrentQuantity(0);

      // Refresh data
      await fetchInventory(currentPage, pageSize);
    } catch (err) {
      console.error("Error updating inventory:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      let userMessage = `❌ Không thể cập nhật số lượng tồn kho!\n\n`;

      if (errorMessage.includes("404")) {
        userMessage += `Lỗi: Không tìm thấy inventory với ID ${inventoryId}\n`;
        userMessage += `Có thể đã bị xóa trước đó.`;
      } else if (
        errorMessage.includes("400") ||
        errorMessage.includes("Bad Request")
      ) {
        userMessage += `Lỗi: Dữ liệu không hợp lệ\n`;
        userMessage += `Chi tiết: ${errorMessage}`;
      } else {
        userMessage += `Chi tiết lỗi: ${errorMessage}`;
      }

      alert(userMessage);
    }
  };

  if (loading && adjustments.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
            <p className="text-gray-600">Loading inventory data...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">
              Stock Adjustments
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your inventory and stock levels
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
          data={adjustments}
          pageSize={pageSize}
          title="Stock Adjustments"
          onView={handleView}
          // onEdit={handleEdit}
          searchPlaceholder="Search by product name, brand, category... (For ID search: 'ID 101')"
          onSearch={handleSearch}
          serverSide={true}
          totalElements={totalElements}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          loading={loading}
          sortField={backendToFrontendFieldMapping[sortField] || sortField}
          sortDirection={sortDirection === "ASC" ? "asc" : "desc"}
        />

        {/* Edit Modal */}
        <StockAdjustmentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditInventoryId(0);
            setEditProductName("");
            setEditCurrentQuantity(0);
          }}
          onSubmit={handleModalSubmit}
          inventoryId={editInventoryId}
          productName={editProductName}
          currentQuantity={editCurrentQuantity}
        />

        {/* Detail Modal */}
        <InventoryDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedInventory(null);
          }}
          inventory={selectedInventory}
        />
      </div>
    </AdminLayout>
  );
};
