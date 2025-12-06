import { useState, useEffect } from "react";
import {
  AdminLayout,
  DataTable,
  type Column,
  ToastContainer,
} from "../../components/admin";
import { supplierService } from "../../services/supplier.service";
import type { Supplier } from "../../types";
import {
  SupplierModal,
  type SupplierFormData,
} from "../../components/admin/SupplierModal";
import { SupplierDetailModal } from "../../components/admin/SupplierDetailModal";
import { useToast } from "../../hooks/useToast";

interface SupplierData extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  lastUpdated: string;
  updatedBy: string;
}

export const Suppliers = () => {
  const { toasts, success, error: showError, warning, removeToast } =
    useToast();
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Sort and search states
  const [sortField, setSortField] = useState<string>("supplierId");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedSupplier, setSelectedSupplier] =
    useState<SupplierFormData | null>(null);

  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);

  const fetchSuppliers = async (
    page: number,
    size: number,
    sortBy?: string,
    direction?: string,
    search?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const pageResponse = await supplierService.getSupplierPage(
        page,
        size,
        sortBy,
        direction,
        search
      );

      const transformedData: SupplierData[] = pageResponse.content.map(
        (item: Supplier) => ({
          id: item.supplierId,
          name: item.name,
          email: item.email,
          phone: item.phone,
          address: item.address,
          lastUpdated: new Date(item.lastUpdated).toLocaleDateString(),
          updatedBy: item.lastUpdatedBy || "System",
        })
      );

      setSuppliers(transformedData);
      setTotalElements(pageResponse.totalElements);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError("Failed to load suppliers data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers(
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
    supplierId: "id",
    name: "name",
    email: "email",
    phone: "phone",
    address: "address",
    lastUpdated: "lastUpdated",
    lastUpdatedBy: "updatedBy",
  };

  const handleSort = (field: string) => {
    // Map frontend field names to backend field names
    const fieldMapping: Record<string, string> = {
      id: "supplierId",
      name: "name",
      email: "email",
      phone: "phone",
      address: "address",
      lastUpdated: "lastUpdated",
      updatedBy: "lastUpdatedBy",
    };

    const backendField = fieldMapping[field] || field;

    if (sortField === backendField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      // New field, default to ASC
      setSortField(backendField);
      setSortDirection("ASC");
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
      label: "Supplier Name",
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
      key: "phone",
      label: "Phone",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "address",
      label: "Address",
      sortable: true,
      onSort: handleSort,
      render: (value: string) => (
        <span className="line-clamp-2" title={value}>
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

  const handleView = async (item: SupplierData) => {
    try {
      const supplierDetails = await supplierService.getSupplierById(item.id);
      setDetailSupplier(supplierDetails);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error("Error fetching supplier details:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      if (
        errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("không tìm thấy")
      ) {
        showError(`Supplier #${item.id} not found. It may have been deleted.`);
      } else {
        showError(`Failed to load supplier details: ${errorMessage}`);
      }
    }
  };

  const handleEdit = async (item: SupplierData) => {
    try {
      const supplierDetails = await supplierService.getSupplierById(item.id);

      // Map supplier to form data
      const formData: SupplierFormData = {
        supplierId: supplierDetails.supplierId,
        name: supplierDetails.name,
        email: supplierDetails.email,
        phone: supplierDetails.phone,
        address: supplierDetails.address,
      };

      setSelectedSupplier(formData);
      setModalMode("edit");
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching supplier for edit:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      if (
        errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("không tìm thấy")
      ) {
        showError(`Supplier #${item.id} not found. It may have been deleted.`);
      } else {
        showError(`Failed to load supplier for editing: ${errorMessage}`);
      }
    }
  };

  const handleAdd = () => {
    setSelectedSupplier(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  // const handleDelete = async (item: SupplierData) => {
  //   try {
  //     await supplierService.deleteSupplier(item.id);
  //     alert(
  //       `✅ Xóa nhà cung cấp thành công!\n\nSupplier ID: ${item.id}\nTên: ${item.name}`
  //     );
  //     await fetchSuppliers(
  //       currentPage,
  //       pageSize,
  //       sortField,
  //       sortDirection,
  //       searchQuery
  //     );
  //   } catch (err) {
  //     console.error("Error deleting supplier:", err);
  //     const errorMessage = err instanceof Error ? err.message : "Unknown error";

  //     let userMessage = `❌ Không thể xóa nhà cung cấp!\n\n`;

  //     if (errorMessage.includes("404")) {
  //       userMessage += `Lỗi: Không tìm thấy nhà cung cấp\n`;
  //       userMessage += `Có thể đã bị xóa trước đó.`;
  //     } else if (
  //       errorMessage.includes("constraint") ||
  //       errorMessage.includes("foreign key") ||
  //       errorMessage.includes("referenced")
  //     ) {
  //       userMessage += `Lỗi: Không thể xóa nhà cung cấp này\n`;
  //       userMessage += `Nhà cung cấp đang được sử dụng trong hệ thống (có đơn nhập hàng liên quan).`;
  //     } else if (
  //       errorMessage.includes("500") ||
  //       errorMessage.includes("Internal Server Error")
  //     ) {
  //       userMessage += `Lỗi: Lỗi server nội bộ\n`;
  //       userMessage += `Vui lòng thử lại sau hoặc liên hệ quản trị viên.`;
  //     } else {
  //       userMessage += `Chi tiết lỗi: ${errorMessage}`;
  //     }

  //     alert(userMessage);
  //   }
  // };

  const handleModalSubmit = async (data: SupplierFormData) => {
    try {
      console.log("Modal submit data:", data);

      if (modalMode === "add") {
        await supplierService.createSupplier({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
        });
        success(
          `Supplier "${data.name}" created successfully! Email: ${data.email}`
        );
      } else {
        if (!selectedSupplier || !selectedSupplier.supplierId) {
          warning("No supplier selected for editing!");
          return;
        }

        await supplierService.updateSupplier(selectedSupplier.supplierId, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
        });

        success(
          `Supplier "${data.name}" (ID: ${selectedSupplier.supplierId}) updated successfully!`
        );
      }

      setIsModalOpen(false);
      setSelectedSupplier(null);
      await fetchSuppliers(
        currentPage,
        pageSize,
        sortField,
        sortDirection,
        searchQuery
      );
    } catch (err) {
      console.error("Error saving supplier:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      if (
        errorMessage.includes("400") ||
        errorMessage.includes("Bad Request")
      ) {
        if (
          errorMessage.includes("already exists") ||
          errorMessage.includes("đã tồn tại") ||
          errorMessage.includes("duplicate")
        ) {
          showError(
            "Supplier with this email or name already exists. Please use different information."
          );
        } else {
          showError(`Invalid data: ${errorMessage}`);
        }
      } else if (errorMessage.includes("404")) {
        showError("Supplier not found. It may have been deleted.");
      } else if (
        errorMessage.includes("500") ||
        errorMessage.includes("Internal Server Error")
      ) {
        showError(
          "Internal server error. Please try again or contact administrator."
        );
      } else {
        showError(
          modalMode === "add"
            ? `Failed to create supplier: ${errorMessage}`
            : `Failed to update supplier: ${errorMessage}`
        );
      }
    }
  };

  if (loading && suppliers.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
            <p className="text-gray-600">Loading suppliers...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
            <p className="text-gray-600 mt-1">
              Manage your supplier information
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
          data={suppliers}
          pageSize={pageSize}
          title="Suppliers"
          onAdd={handleAdd}
          onView={handleView}
          onEdit={handleEdit}
          // onDelete={handleDelete}
          searchPlaceholder="Search by name, email, phone, address... (For ID search: 'ID 101')"
          onSearch={handleSearch}
          serverSide={true}
          totalElements={totalElements}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          loading={loading}
          sortField={backendToFrontendFieldMapping[sortField] || sortField}
          sortDirection={sortDirection === "ASC" ? "asc" : "desc"}
        />

        {/* Add/Edit Modal */}
        <SupplierModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSupplier(null);
          }}
          onSubmit={handleModalSubmit}
          mode={modalMode}
          initialData={selectedSupplier || undefined}
        />

        {/* Detail Modal */}
        <SupplierDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailSupplier(null);
          }}
          supplier={detailSupplier}
        />

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </AdminLayout>
  );
};
