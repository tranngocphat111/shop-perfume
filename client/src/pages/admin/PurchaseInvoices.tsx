import { useState, useEffect } from "react";
import { AdminLayout, DataTable, type Column } from "../../components/admin";
import { purchaseInvoiceService } from "../../services/purchaseInvoice.service";
import { productService as productAdminService } from "../../services/product.service";
import { useSuppliers } from "../../hooks/useSuppliers";
import type {
  PurchaseInvoice,
  PurchaseInvoiceFormData,
  Product,
} from "../../types";
import { PurchaseInvoiceAddModal } from "../../components/admin/PurchaseInvoiceAddModal";
import { PurchaseInvoiceViewModal } from "../../components/admin/PurchaseInvoiceViewModal";

interface PurchaseInvoiceData extends Record<string, unknown> {
  id: number;
  supplierId: number;
  supplierName: string;
  email: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  createdBy: string;
}

export const PurchaseInvoices = () => {
  const [invoices, setInvoices] = useState<PurchaseInvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Sort and search states
  const [sortField, setSortField] = useState<string>("purchaseInvoiceId");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewInvoiceData, setViewInvoiceData] =
    useState<PurchaseInvoice | null>(null);

  // Fetch suppliers and products
  const { suppliers } = useSuppliers();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch ACTIVE products using productAdminService
  useEffect(() => {
    const fetchActiveProducts = async () => {
      try {
        setProductsLoading(true);
        console.log("🔍 Fetching products with status=ACTIVE...");

        // Fetch products with status filter
        const pageResponse = await productAdminService.getProductPage(
          0,
          1000,
          undefined,
          undefined,
          undefined,
          "ACTIVE" // Filter by ACTIVE status
        );

        console.log("✅ Products response:", pageResponse);
        console.log(
          "📦 ACTIVE products count:",
          pageResponse.content?.length || 0
        );

        const activeProducts = pageResponse.content || [];

        if (activeProducts.length > 0) {
          console.log("📋 First product:", activeProducts[0]);
          console.log("📋 Sample products:", activeProducts.slice(0, 3));
        } else {
          console.warn("⚠️ No ACTIVE products found!");
        }

        setProducts(activeProducts);
      } catch (err) {
        console.error("❌ Error fetching products:", err);
        if (err instanceof Error) {
          console.error("❌ Error message:", err.message);
        }
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchActiveProducts();
  }, []);

  const fetchInvoices = async (
    page: number,
    size: number,
    sortBy?: string,
    direction?: string,
    search?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const pageResponse = await purchaseInvoiceService.getInvoicesPaginated(
        page,
        size,
        sortBy,
        direction as "ASC" | "DESC" | undefined,
        search
      );

      const transformedData: PurchaseInvoiceData[] = pageResponse.content.map(
        (item: PurchaseInvoice) => ({
          id: item.purchaseInvoiceId,
          supplierId: item.supplier.supplierId,
          supplierName: item.supplier.name,
          email: item.email,
          totalAmount: item.totalAmount,
          status: item.status,
          createdAt: new Date(item.createdAt).toLocaleDateString(),
          createdBy: item.createdBy || "System",
        })
      );

      setInvoices(transformedData);
      setTotalElements(pageResponse.totalElements);
    } catch (err) {
      console.error("Error fetching purchase invoices:", err);
      setError("Failed to load purchase invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(currentPage, pageSize, sortField, sortDirection, searchTerm);
  }, [currentPage, pageSize, sortField, sortDirection, searchTerm]);

  const handlePageChange = (page: number, size: number) => {
    if (size !== pageSize) {
      setCurrentPage(0);
      setPageSize(size);
    } else {
      setCurrentPage(page);
    }
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(0); // Reset to first page when searching
  };

  // Map backend field to frontend field for display
  const backendToFrontendFieldMapping: Record<string, string> = {
    purchaseInvoiceId: "id",
    "supplier.name": "supplierName",
    email: "email",
    totalAmount: "totalAmount",
    status: "status",
    createdAt: "createdAt",
    createdBy: "createdBy",
  };

  const handleSort = (field: string) => {
    // Map frontend field names to backend field names
    const fieldMapping: Record<string, string> = {
      id: "purchaseInvoiceId",
      supplierName: "supplier.name",
      email: "email",
      totalAmount: "totalAmount",
      status: "status",
      createdAt: "createdAt",
      createdBy: "createdBy",
    };

    const backendField = fieldMapping[field] || field;

    if (sortField === backendField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      // New field, default to DESC for dates, ASC for others
      setSortField(backendField);
      setSortDirection(
        backendField === "purchaseInvoiceId" || backendField === "createdAt"
          ? "DESC"
          : "ASC"
      );
    }
  };

  const columns: Column[] = [
    {
      key: "id",
      label: "Invoice ID",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "supplierName",
      label: "Supplier",
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
      key: "status",
      label: "Status",
      sortable: true,
      onSort: handleSort,
      render: (value: string) => {
        const statusColors: Record<string, string> = {
          PENDING: "bg-yellow-100 text-yellow-800",
          COMPLETED: "bg-green-100 text-green-800",
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
      key: "createdAt",
      label: "Created Date",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "createdBy",
      label: "Created By",
      sortable: true,
      onSort: handleSort,
    },
  ];

  const handleView = async (item: PurchaseInvoiceData) => {
    try {
      const invoice = await purchaseInvoiceService.getInvoiceById(item.id);
      const details =
        invoice.details && invoice.details.length > 0
          ? invoice.details
          : await purchaseInvoiceService.getInvoiceDetailById(item.id);

      setViewInvoiceData({ ...invoice, details });
      setIsViewModalOpen(true);
    } catch (err) {
      console.error("Error fetching invoice details:", err);
      alert("❌ Failed to load invoice details. Please try again.");
    }
  };

  const handleAdd = () => {
    if (productsLoading) {
      alert("⏳ Please wait, products are still loading...");
      return;
    }
    if (products.length === 0) {
      alert("⚠️ No active products available. Please add products first.");
      return;
    }
    console.log("✅ Opening Add Modal with", products.length, "products");
    setIsAddModalOpen(true);
  };

  const handleAddModalSubmit = async (data: PurchaseInvoiceFormData) => {
    try {
      const { purchaseInvoiceId, ...payload } = data;
      void purchaseInvoiceId; // Explicitly mark as intentionally unused
      const created = await purchaseInvoiceService.createInvoice(payload);
      alert(
        `✅ Purchase invoice created successfully!\n\nInvoice ID: ${
          created.purchaseInvoiceId
        }\nTotal: ${created.totalAmount.toLocaleString(
          "vi-VN"
        )} đ\n\n💡 Inventory has been updated for all products.`
      );

      setIsAddModalOpen(false);
      await fetchInvoices(currentPage, pageSize, sortField, sortDirection);
    } catch (err) {
      console.error("Error creating invoice:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      let userMessage = `❌ Failed to create invoice!\n\n`;

      if (errorMessage.includes("INACTIVE")) {
        userMessage += `Error: One or more products are INACTIVE\n`;
        userMessage += `Please ensure all products have ACTIVE status.`;
      } else {
        userMessage += `Details: ${errorMessage}`;
      }

      alert(userMessage);
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
            <p className="text-gray-600">Loading purchase invoices...</p>
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
              Purchase Invoices
            </h1>
            <p className="text-gray-600 mt-1">
              Manage purchase invoices and inventory updates
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
          data={invoices}
          pageSize={pageSize}
          title="Purchase Invoices"
          onAdd={handleAdd}
          onView={handleView}
          onSearch={handleSearch}
          searchPlaceholder="Search by supplier, status, amount... (For ID search: 'ID 101')"
          serverSide={true}
          totalElements={totalElements}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          loading={loading}
          sortField={backendToFrontendFieldMapping[sortField] || sortField}
          sortDirection={sortDirection === "ASC" ? "asc" : "desc"}
        />
        {/* View Modal */}
        <PurchaseInvoiceViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewInvoiceData(null);
          }}
          invoice={viewInvoiceData}
        />

        {/* Add Modal */}
        <PurchaseInvoiceAddModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
          }}
          onSubmit={handleAddModalSubmit}
          suppliers={suppliers}
          products={products}
        />
      </div>
    </AdminLayout>
  );
};
