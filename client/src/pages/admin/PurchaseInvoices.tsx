import { useState, useEffect } from "react";
import { AdminLayout, DataTable, type Column } from "../../components/admin";
import { purchaseInvoiceService } from "../../services/purchaseInvoice.service";
import { useSuppliers } from "../../hooks/useSuppliers";
import { useProducts } from "../../hooks/usePerfumes";
import type { PurchaseInvoice, PurchaseInvoiceFormData } from "../../types";
import { PurchaseInvoiceModal } from "../../components/admin/PurchaseInvoiceModal";

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

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedInvoice, setSelectedInvoice] =
    useState<PurchaseInvoiceFormData | null>(null);

  // Fetch suppliers and products
  const { suppliers } = useSuppliers();
  const { products } = useProducts();

  const fetchInvoices = async (
    page: number,
    size: number,
    sortBy?: string,
    direction?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const pageResponse = await purchaseInvoiceService.getInvoicesPaginated(
        page,
        size,
        sortBy,
        direction as "ASC" | "DESC" | undefined
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
    fetchInvoices(currentPage, pageSize, sortField, sortDirection);
  }, [currentPage, pageSize, sortField, sortDirection]);

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

  const getInvoiceDetailsForModal = async (id: number) => {
    const invoice = await purchaseInvoiceService.getInvoiceById(id);
    const details =
      invoice.details && invoice.details.length > 0
        ? invoice.details
        : await purchaseInvoiceService.getInvoiceDetailById(id);

    return {
      purchaseInvoiceId: invoice.purchaseInvoiceId,
      supplierId: invoice.supplier.supplierId,
      email: invoice.email,
      status: invoice.status,
      details: details.map((detail) => ({
        productId: detail.product.productId,
        quantity: detail.quantity,
        importPrice: detail.importPrice,
      })),
    } as PurchaseInvoiceFormData;
  };

  const handleView = async (item: PurchaseInvoiceData) => {
    try {
      const formData = await getInvoiceDetailsForModal(item.id);
      setSelectedInvoice(formData);
      setModalMode("view");
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching invoice details:", err);
      alert("❌ Failed to load invoice details. Please try again.");
    }
  };

  const handleEdit = async (item: PurchaseInvoiceData) => {
    try {
      const formData = await getInvoiceDetailsForModal(item.id);
      setSelectedInvoice(formData);
      setModalMode("edit");
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching invoice for edit:", err);
      alert("❌ Failed to load invoice for editing. Please try again.");
    }
  };

  const handleAdd = () => {
    setSelectedInvoice(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: PurchaseInvoiceFormData) => {
    try {
      if (modalMode === "view") {
        setIsModalOpen(false);
        setSelectedInvoice(null);
        return;
      }
      if (modalMode === "add") {
        // Validate
        if (data.supplierId === 0) {
          alert("⚠️ Please select a supplier!");
          return;
        }
        if (!data.email.trim()) {
          alert("⚠️ Please enter email!");
          return;
        }
        if (data.details.length === 0) {
          alert("⚠️ Please add at least one product!");
          return;
        }

        const { purchaseInvoiceId: _unused, ...payload } = data;
        const created = await purchaseInvoiceService.createInvoice(payload);
        alert(
          `✅ Purchase invoice created successfully!\n\nInvoice ID: ${
            created.purchaseInvoiceId
          }\nTotal: ${created.totalAmount.toLocaleString("vi-VN")} đ`
        );
      } else {
        const invoiceId =
          data.purchaseInvoiceId || selectedInvoice?.purchaseInvoiceId;
        if (!invoiceId) {
          alert("⚠️ No invoice selected for editing!");
          return;
        }
        const { purchaseInvoiceId: _unused, ...payload } = data;
        await purchaseInvoiceService.updateInvoice(invoiceId, payload);
        alert("✅ Invoice updated successfully!");
      }
      setIsModalOpen(false);
      setSelectedInvoice(null);
      await fetchInvoices(currentPage, pageSize, sortField, sortDirection);
    } catch (err) {
      console.error("Error saving invoice:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      let userMessage =
        modalMode === "add"
          ? `❌ Failed to create invoice!\n\n`
          : `❌ Failed to update invoice!\n\n`;

      userMessage += `Details: ${errorMessage}`;
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
          onEdit={handleEdit}
          searchPlaceholder="Search by invoice ID, supplier, email, status..."
          serverSide={true}
          totalElements={totalElements}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          loading={loading}
          sortField={backendToFrontendFieldMapping[sortField] || sortField}
          sortDirection={sortDirection === "ASC" ? "asc" : "desc"}
        />

        Add/Edit Modal
        <PurchaseInvoiceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedInvoice(null);
          }}
          onSubmit={handleModalSubmit}
          mode={modalMode}
          suppliers={suppliers}
          products={products}
          initialData={selectedInvoice || undefined}
        />
      </div>
    </AdminLayout>
  );
};
