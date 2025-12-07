import { useState, useEffect } from "react";
import {
  AdminLayout,
  DataTable,
  type Column,
  ToastContainer,
} from "../../components/admin";
import { brandService, type Brand } from "../../services/brand.service";
import {
  BrandModal,
  type BrandFormData,
} from "../../components/admin/BrandModal";
import { BrandDetailModal } from "../../components/admin/BrandDetailModal";
import { useToast } from "../../hooks/useToast";

interface BrandData extends Record<string, unknown> {
  id: number;
  name: string;
  country: string;
  description: string;
}

export const Brands = () => {
  const {
    toasts,
    removeToast,
    success,
    error: showError,
    warning,
  } = useToast();

  const [brands, setBrands] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Sort and search states
  const [sortField, setSortField] = useState<string>("brandId");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedBrand, setSelectedBrand] = useState<BrandFormData | null>(
    null
  );

  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailBrand, setDetailBrand] = useState<Brand | null>(null);

  const fetchBrands = async (
    page: number,
    size: number,
    sortBy?: string,
    direction?: string,
    search?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const pageResponse = await brandService.getBrandPage(
        page,
        size,
        sortBy,
        direction,
        search
      );

      const transformedData: BrandData[] = pageResponse.content.map(
        (item: Brand) => ({
          id: item.brandId,
          name: item.name,
          country: item.country || "N/A",
          description: item.description
            ? item.description.length > 100
              ? item.description.substring(0, 100) + "..."
              : item.description
            : "N/A",
        })
      );

      setBrands(transformedData);
      setTotalElements(pageResponse.totalElements);
    } catch (err) {
      console.error("Error fetching brands:", err);
      setError("Failed to load brands data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands(currentPage, pageSize, sortField, sortDirection, searchQuery);
  }, [currentPage, pageSize, sortField, sortDirection, searchQuery]);

  const handlePageChange = (page: number, size: number) => {
    if (size !== pageSize) {
      setCurrentPage(0);
      setPageSize(size);
    } else {
      setCurrentPage(page);
    }
  };

  const handleSort = (field: string) => {
    // Map frontend field names to backend field names
    const fieldMapping: Record<string, string> = {
      id: "brandId",
      name: "name",
      country: "country",
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
      label: "Brand Name",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "country",
      label: "Country",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "description",
      label: "Description",
      sortable: false,
    },
  ];

  const handleView = async (item: BrandData) => {
    try {
      const brandDetails = await brandService.getBrandById(item.id);
      setDetailBrand(brandDetails);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error("Error fetching brand details:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      if (
        errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("không tìm thấy")
      ) {
        showError(`Brand #${item.id} not found. It may have been deleted.`);
      } else {
        showError(`Failed to load brand details: ${errorMessage}`);
      }
    }
  };

  const handleEdit = async (item: BrandData) => {
    try {
      const brandDetails = await brandService.getBrandById(item.id);

      const formData: BrandFormData = {
        brandId: brandDetails.brandId,
        name: brandDetails.name,
        country: brandDetails.country || "",
        description: brandDetails.description || "",
        url: brandDetails.url || "",
      };

      setSelectedBrand(formData);
      setModalMode("edit");
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching brand for edit:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      if (
        errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("không tìm thấy")
      ) {
        showError(`Brand #${item.id} not found. It may have been deleted.`);
      } else {
        showError(`Failed to load brand for editing: ${errorMessage}`);
      }
    }
  };

  const handleDelete = async (item: BrandData) => {
    const confirmDelete = window.confirm(
      `⚠️ Are you sure you want to delete this brand?\n\nBrand: ${item.name}\nCountry: ${item.country}\n\nNote: This action will fail if the brand is being used by any ACTIVE products.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await brandService.deleteBrand(item.id);
      success(`Brand "${item.name}" has been deleted successfully!`);
      await fetchBrands(
        currentPage,
        pageSize,
        sortField,
        sortDirection,
        searchQuery
      );
    } catch (err) {
      console.error("Error deleting brand:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      // Check if error is due to active products
      if (errorMessage.includes("ACTIVE product")) {
        showError(errorMessage);
      } else {
        showError(`Failed to delete brand: ${errorMessage}`);
      }
    }
  };

  const handleAdd = () => {
    setSelectedBrand(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: BrandFormData) => {
    try {
      console.log("Modal submit data:", data);

      if (modalMode === "add") {
        await brandService.createBrand({
          name: data.name,
          country: data.country || undefined,
          description: data.description || undefined,
          url: data.url || undefined,
        });
        success(`Brand "${data.name}" created successfully!`);
      } else {
        if (!selectedBrand || !selectedBrand.brandId) {
          warning("No brand selected for editing!");
          return;
        }

        await brandService.updateBrand(selectedBrand.brandId, {
          name: data.name,
          country: data.country || undefined,
          description: data.description || undefined,
          url: data.url || undefined,
        });
        success(`Brand "${data.name}" updated successfully!`);
      }

      setIsModalOpen(false);
      await fetchBrands(
        currentPage,
        pageSize,
        sortField,
        sortDirection,
        searchQuery
      );
    } catch (err) {
      console.error("Error saving brand:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      showError(`Failed to save brand: ${errorMessage}`);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBrand(null);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setDetailBrand(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Brand Management
            </h1>
            <p className="text-gray-600 mt-1">Manage perfume brands</p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-md"
          >
            <i className="fas fa-plus"></i>
            <span>Add Brand</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-md">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          <DataTable
            columns={columns}
            data={brands}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
            serverSide={true}
            currentPage={currentPage}
            pageSize={pageSize}
            totalElements={totalElements}
            onPageChange={handlePageChange}
            sortField={sortField}
            sortDirection={sortDirection.toLowerCase() as "asc" | "desc"}
            onSearch={handleSearch}
            searchPlaceholder="Search brands by name or country..."
          />
        </div>

        {/* Modals */}
        <BrandModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          initialData={selectedBrand || undefined}
          mode={modalMode}
        />

        <BrandDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleDetailModalClose}
          brand={detailBrand}
        />
      </div>
    </AdminLayout>
  );
};
