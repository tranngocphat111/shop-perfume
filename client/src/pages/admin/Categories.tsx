import { useState, useEffect } from "react";
import {
  AdminLayout,
  DataTable,
  type Column,
  ToastContainer,
} from "../../components/admin";
import {
  categoryService,
  type Category,
} from "../../services/category.service";
import {
  CategoryModal,
  type CategoryFormData,
} from "../../components/admin/CategoryModal";
import { CategoryDetailModal } from "../../components/admin/CategoryDetailModal";
import { useToast } from "../../hooks/useToast";

interface CategoryData extends Record<string, unknown> {
  id: number;
  name: string;
  gender: string;
  description: string;
  lastUpdated: string;
  updatedBy: string;
}

export const Categories = () => {
  const {
    toasts,
    removeToast,
    success,
    error: showError,
    warning,
  } = useToast();

  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Sort and search states
  const [sortField, setSortField] = useState<string>("categoryId");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFormData | null>(null);

  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailCategory, setDetailCategory] = useState<Category | null>(null);

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case "MALE":
        return "Male";
      case "FEMALE":
        return "Female";
      case "UNISEX":
        return "Unisex";
      default:
        return "N/A";
    }
  };

  const fetchCategories = async (
    page: number,
    size: number,
    sortBy?: string,
    direction?: string,
    search?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const pageResponse = await categoryService.getCategoryPage(
        page,
        size,
        sortBy,
        direction,
        search
      );

      const transformedData: CategoryData[] = pageResponse.content.map(
        (item: Category) => ({
          id: item.categoryId,
          name: item.name,
          gender: getGenderLabel(item.gender),
          description: item.description
            ? item.description.length > 50
              ? item.description.substring(0, 50) + "..."
              : item.description
            : "N/A",
          lastUpdated: item.lastUpdated
            ? new Date(item.lastUpdated).toLocaleDateString()
            : "N/A",
          updatedBy: item.lastUpdatedBy || "System",
        })
      );

      setCategories(transformedData);
      setTotalElements(pageResponse.totalElements);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(
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

  const handleSort = (field: string) => {
    // Map frontend field names to backend field names
    const fieldMapping: Record<string, string> = {
      id: "categoryId",
      name: "name",
      gender: "gender",
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
      label: "Category Name",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "gender",
      label: "Gender",
      sortable: true,
      onSort: handleSort,
    },
    {
      key: "description",
      label: "Description",
      sortable: false,
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

  const handleView = async (item: CategoryData) => {
    try {
      const categoryDetails = await categoryService.getCategoryById(item.id);
      setDetailCategory(categoryDetails);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error("Error fetching category details:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        showError(`Category #${item.id} not found. It may have been deleted.`);
      } else {
        showError(`Failed to load category details: ${errorMessage}`);
      }
    }
  };

  const handleEdit = async (item: CategoryData) => {
    try {
      const categoryDetails = await categoryService.getCategoryById(item.id);

      const formData: CategoryFormData = {
        categoryId: categoryDetails.categoryId,
        name: categoryDetails.name,
        description: categoryDetails.description || "",
        gender: categoryDetails.gender,
      };

      setSelectedCategory(formData);
      setModalMode("edit");
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching category for edit:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        showError(`Category #${item.id} not found. It may have been deleted.`);
      } else {
        showError(`Failed to load category for editing: ${errorMessage}`);
      }
    }
  };

  const handleDelete = async (item: CategoryData) => {
    const confirmDelete = window.confirm(
      `⚠️ Are you sure you want to delete this category?\n\nCategory: ${item.name}\nGender: ${item.gender}\n\nNote: This action will fail if the category is being used by any ACTIVE products.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await categoryService.deleteCategory(item.id);
      success(`Category "${item.name}" has been deleted successfully!`);
      await fetchCategories(
        currentPage,
        pageSize,
        sortField,
        sortDirection,
        searchQuery
      );
    } catch (err: any) {
      console.error("Error deleting category:", err);

      // Extract error message from different error formats
      let errorMessage = "Unknown error";
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      console.log("Extracted error message:", errorMessage);

      // Check if error is due to authentication
      if (
        errorMessage.includes("401") ||
        errorMessage.includes("Unauthorized")
      ) {
        showError(
          "You don't have permission to delete categories. Please login as ADMIN."
        );
      }
      // Check if error is due to active products
      else if (
        errorMessage.includes("ACTIVE product") ||
        errorMessage.includes("being used")
      ) {
        showError(errorMessage);
      } else {
        showError(`Failed to delete category: ${errorMessage}`);
      }
    }
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: CategoryFormData) => {
    try {
      console.log("Modal submit data:", data);

      if (modalMode === "add") {
        await categoryService.createCategory({
          name: data.name,
          description: data.description || undefined,
          gender: data.gender,
        });
        success(`Category "${data.name}" created successfully!`);
      } else {
        if (!selectedCategory || !selectedCategory.categoryId) {
          warning("No category selected for editing!");
          return;
        }

        await categoryService.updateCategory(selectedCategory.categoryId, {
          name: data.name,
          description: data.description || undefined,
          gender: data.gender,
        });
        success(`Category "${data.name}" updated successfully!`);
      }

      setIsModalOpen(false);
      await fetchCategories(
        currentPage,
        pageSize,
        sortField,
        sortDirection,
        searchQuery
      );
    } catch (err) {
      console.error("Error saving category:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      showError(`Failed to save category: ${errorMessage}`);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setDetailCategory(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
            <p className="text-gray-600 mt-1">Manage perfume categories</p>
          </div>
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
            data={categories}
            onAdd={handleAdd}
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
            searchPlaceholder="Search categories by name or description..."
          />
        </div>

        {/* Modals */}
        <CategoryModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          initialData={selectedCategory || undefined}
          mode={modalMode}
        />

        <CategoryDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleDetailModalClose}
          category={detailCategory}
        />

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </AdminLayout>
  );
};
