import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout, DataTable, type Column } from "../../components/admin";
import {
  inventoryService,
  type InventoryItem,
} from "@/services/inventory.service";

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
  const navigate = useNavigate();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const fetchInventory = async (page: number, size: number) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from API - returns PageResponse with content array
      const pageResponse = await inventoryService.getInventoryPage(page, size);

      // Transform InventoryItem to StockAdjustment from content array
      const transformedData: StockAdjustment[] = pageResponse.content.map(
        (item: InventoryItem) => ({
          id: item.inventoryId || item.product.productId,
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
    fetchInventory(currentPage, pageSize);
  }, [currentPage, pageSize]);

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

  const columns: Column[] = [
    {
      key: "productId",
      label: "ID",
      sortable: true,
    },
    {
      key: "productName",
      label: "Product Name",
      sortable: true,
    },
    {
      key: "brand",
      label: "Brand",
      sortable: true,
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
    },
    {
      key: "quantity",
      label: "Quantity",
      sortable: true,
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
    },
    {
      key: "unitPrice",
      label: "Price",
      sortable: true,
      render: (value: number) => (
        <span className="whitespace-nowrap">{`${value.toFixed(0)} đ`}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
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
    },
    {
      key: "updatedBy",
      label: "Updated By",
      sortable: true,
    },
  ];

  const handleView = (item: StockAdjustment) => {
    console.log("View:", item);
    // Navigate to view page or show modal
  };

  const handleEdit = (item: StockAdjustment) => {
    console.log("Edit:", item);
    navigate(`/admin/stock-adjustments/edit/${item.id}`);
  };

  const handleDelete = (item: StockAdjustment) => {
    console.log("Delete:", item);
    // Call API to delete
    setAdjustments(adjustments.filter((adj) => adj.id !== item.id));
  };

  const handleAdd = () => {
    navigate("/admin/stock-adjustments/add");
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
          onAdd={handleAdd}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Search products..."
          serverSide={true}
          totalElements={totalElements}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </div>
    </AdminLayout>
  );
};
