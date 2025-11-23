import { useState, useEffect } from "react";
import { AdminLayout, DataTable, type Column } from "../../components/admin";
import { productAdminService } from "../../services/product.service";
import { productService } from "../../services/perfume.service";
import type { Brand, Category, Product } from "../../types";
import {
  ProductModal,
  type ProductFormData,
} from "../../components/admin/ProductModal";
import { ProductDetailModal } from "../../components/admin/ProductDetailModal";

interface ProductData extends Record<string, unknown> {
  id: number;
  name: string;
  brand: string;
  category: string;
  columeMl: number;
  unitPrice: number;
  status: string;
  lastUpdated: string;
  updatedBy: string;
}

export const Products = () => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Sort and search states
  const [sortField, setSortField] = useState<string>("productId");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const fetchProducts = async (
    page: number,
    size: number,
    sortBy?: string,
    direction?: string,
    search?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const pageResponse = await productAdminService.getProductPage(
        page,
        size,
        sortBy,
        direction,
        search
      );

      const transformedData: ProductData[] = pageResponse.content.map(
        (item: Product) => ({
          id: item.productId,
          name: item.name,
          brand: item.brand.name,
          category: item.category.name,
          columeMl: item.columeMl,
          unitPrice: item.unitPrice,
          status: item.status,
          lastUpdated: new Date(item.lastUpdated).toLocaleDateString(),
          updatedBy: item.lastUpdatedBy || "System",
        })
      );

      setProducts(transformedData);
      setTotalElements(pageResponse.totalElements);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage, pageSize, sortField, sortDirection, searchQuery);
  }, [currentPage, pageSize, sortField, sortDirection, searchQuery]);

  // Fetch brands and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandsData, categoriesData] = await Promise.all([
          productService.getAllBrands(),
          productService.getAllCategories(),
        ]);
        setBrands(brandsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error("Error fetching brands/categories:", err);
      }
    };
    fetchData();
  }, []);

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
    productId: "id",
    name: "name",
    "brand.name": "brand",
    "category.name": "category",
    columeMl: "columeMl",
    unitPrice: "unitPrice",
    status: "status",
    lastUpdated: "lastUpdated",
    lastUpdatedBy: "updatedBy",
  };

  const handleSort = (field: string) => {
    // Map frontend field names to backend field names
    const fieldMapping: Record<string, string> = {
      id: "productId",
      name: "name",
      brand: "brand.name",
      category: "category.name",
      columeMl: "columeMl",
      unitPrice: "unitPrice",
      status: "status",
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
        <span className="whitespace-nowrap font-semibold text-blue-600">
          {value.toLocaleString()} đ
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      onSort: handleSort,
      render: (value: string) => (
        <span
          className={`inline-block whitespace-nowrap px-2 py-1 text-xs rounded font-semibold ${
            value === "ACTIVE"
              ? "bg-green-100 text-green-800"
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

  const handleView = async (item: ProductData) => {
    try {
      const productDetails = await productAdminService.getProductById(item.id);
      setDetailProduct(productDetails);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error("Error fetching product details:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      let userMessage = `❌ Không thể tải thông tin sản phẩm!\n\n`;

      if (
        errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("không tìm thấy")
      ) {
        userMessage += `Lỗi: Không tìm thấy sản phẩm với ID ${item.id}\n`;
        userMessage += `Sản phẩm này có thể đã bị xóa.`;
      } else {
        userMessage += `Chi tiết lỗi: ${errorMessage}\n`;
        userMessage += `Vui lòng thử lại sau.`;
      }

      alert(userMessage);
    }
  };

  const handleEdit = async (item: ProductData) => {
    try {
      const productDetails = await productAdminService.getProductById(item.id);

      // Map product to form data with existing images
      const formData: ProductFormData = {
        productId: productDetails.productId,
        name: productDetails.name,
        description: productDetails.description,
        perfumeLongevity: productDetails.perfumeLongevity,
        perfumeConcentration: productDetails.perfumeConcentration,
        releaseYear: productDetails.releaseYear,
        columeMl: productDetails.columeMl,
        status: productDetails.status,
        unitPrice: productDetails.unitPrice,
        brandId: productDetails.brand.brandId,
        categoryId: productDetails.category.categoryId,
        existingImages: productDetails.images.map((img) => ({
          imageId: img.imageId,
          url: img.url,
          primary: img.primary,
        })),
        images: [],
        imagesToDelete: [],
      };

      setSelectedProduct(formData);
      setModalMode("edit");
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching product for edit:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      let userMessage = `❌ Không thể tải thông tin sản phẩm để sửa!\n\n`;

      if (
        errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("không tìm thấy")
      ) {
        userMessage += `Lỗi: Không tìm thấy sản phẩm với ID ${item.id}\n`;
        userMessage += `Sản phẩm này có thể đã bị xóa.`;
      } else {
        userMessage += `Chi tiết lỗi: ${errorMessage}\n`;
        userMessage += `Vui lòng thử lại sau.`;
      }

      alert(userMessage);
    }
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: ProductFormData) => {
    try {
      console.log("Modal submit data:", data);

      if (modalMode === "add") {
        // Validate
        if (data.brandId === 0) {
          alert("⚠️ Vui lòng chọn thương hiệu!");
          return;
        }
        if (data.categoryId === 0) {
          alert("⚠️ Vui lòng chọn danh mục!");
          return;
        }
        if (!data.images || data.images.length === 0) {
          alert("⚠️ Vui lòng chọn ít nhất 1 ảnh sản phẩm!");
          return;
        }

        const payload = {
          name: data.name,
          description: data.description,
          perfumeLongevity: data.perfumeLongevity,
          perfumeConcentration: data.perfumeConcentration,
          releaseYear: data.releaseYear,
          columeMl: data.columeMl,
          status: data.status,
          unitPrice: data.unitPrice,
          brandId: data.brandId,
          categoryId: data.categoryId,
        };
        console.log("Creating product with payload:", payload);
        console.log(
          "Images:",
          data.images.length,
          "Primary index:",
          data.primaryImageIndex
        );

        await productAdminService.createProduct(
          payload,
          data.images,
          data.primaryImageIndex || 0
        );
        alert(
          `✅ Thêm sản phẩm thành công!\n\nTên sản phẩm: ${
            data.name
          }\nGiá: ${data.unitPrice.toLocaleString()} đ`
        );
      } else {
        if (!selectedProduct) {
          alert("⚠️ Không có sản phẩm nào được chọn để sửa!");
          return;
        }

        const payload = {
          name: data.name,
          description: data.description,
          perfumeLongevity: data.perfumeLongevity,
          perfumeConcentration: data.perfumeConcentration,
          releaseYear: data.releaseYear,
          columeMl: data.columeMl,
          status: data.status,
          unitPrice: data.unitPrice,
          brandId: data.brandId,
          categoryId: data.categoryId,
        };
        console.log(
          "Updating product",
          selectedProduct.productId,
          "with payload:",
          payload
        );

        // Check if there are image changes
        const hasNewImages = data.images && data.images.length > 0;
        const hasDeletedImages =
          data.imagesToDelete && data.imagesToDelete.length > 0;
        const hasPrimaryChange =
          data.existingImages && data.existingImages.some((img) => img.primary);

        if (hasNewImages || hasDeletedImages || hasPrimaryChange) {
          // Use updateProductWithImages if there are image changes
          const primaryImageId = data.existingImages?.find(
            (img) => img.primary
          )?.imageId;

          console.log("Updating with images:", {
            newImages: data.images?.length || 0,
            imagesToDelete: data.imagesToDelete?.length || 0,
            primaryImageId,
          });

          await productAdminService.updateProductWithImages(
            selectedProduct.productId,
            payload,
            data.images,
            data.imagesToDelete,
            primaryImageId
          );
        } else {
          // Use regular update if no image changes
          await productAdminService.updateProduct(
            selectedProduct.productId,
            payload
          );
        }

        alert(
          `✅ Cập nhật sản phẩm thành công!\n\nProduct ID: ${selectedProduct.productId}\nTên: ${data.name}`
        );
      }

      setIsModalOpen(false);
      setSelectedProduct(null);
      await fetchProducts(currentPage, pageSize);
    } catch (err) {
      console.error("Error saving product:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      let userMessage =
        modalMode === "add"
          ? `❌ Không thể thêm sản phẩm!\n\n`
          : `❌ Không thể cập nhật sản phẩm!\n\n`;

      if (
        errorMessage.includes("400") ||
        errorMessage.includes("Bad Request")
      ) {
        if (
          errorMessage.includes("already exists") ||
          errorMessage.includes("đã tồn tại") ||
          errorMessage.includes("duplicate")
        ) {
          userMessage += `Lỗi: Sản phẩm với tên này đã tồn tại\n`;
          userMessage += `Vui lòng sử dụng tên khác.`;
        } else if (
          errorMessage.includes("not found") ||
          errorMessage.includes("không tìm thấy")
        ) {
          userMessage += `Lỗi: Không tìm thấy brand hoặc category\n`;
          userMessage += `Vui lòng chọn brand và category hợp lệ.`;
        } else {
          userMessage += `Lỗi: Dữ liệu không hợp lệ\n`;
          userMessage += `Chi tiết: ${errorMessage}`;
        }
      } else if (errorMessage.includes("404")) {
        if (modalMode === "add") {
          userMessage += `Lỗi: Không tìm thấy brand hoặc category\n`;
          userMessage += `Vui lòng chọn lại.`;
        } else {
          userMessage += `Lỗi: Không tìm thấy sản phẩm\n`;
          userMessage += `Có thể đã bị xóa trước đó.`;
        }
      } else if (
        errorMessage.includes("500") ||
        errorMessage.includes("Internal Server Error")
      ) {
        userMessage += `Lỗi: Lỗi server nội bộ\n`;
        userMessage += `Vui lòng thử lại sau hoặc liên hệ quản trị viên.`;
      } else {
        userMessage += `Chi tiết lỗi: ${errorMessage}`;
      }

      alert(userMessage);
    }
  };

  if (loading && products.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
            <p className="text-gray-600">Loading products...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Products</h1>
            <p className="text-gray-600 mt-1">
              Manage your perfume products catalog
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
          data={products}
          pageSize={pageSize}
          title="Products"
          onAdd={handleAdd}
          onView={handleView}
          onEdit={handleEdit}
          searchPlaceholder="Search by ID, name, brand, category, status, price, volume..."
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
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
          }}
          onSubmit={handleModalSubmit}
          mode={modalMode}
          brands={brands}
          categories={categories}
          initialData={
            selectedProduct
              ? {
                  productId: selectedProduct.productId,
                  name: selectedProduct.name,
                  description: selectedProduct.description,
                  perfumeLongevity: selectedProduct.perfumeLongevity,
                  perfumeConcentration: selectedProduct.perfumeConcentration,
                  releaseYear: selectedProduct.releaseYear,
                  columeMl: selectedProduct.columeMl,
                  status: selectedProduct.status,
                  unitPrice: selectedProduct.unitPrice,
                  brandId: selectedProduct.brand.brandId,
                  categoryId: selectedProduct.category.categoryId,
                }
              : undefined
          }
        />

        {/* Detail Modal */}
        <ProductDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailProduct(null);
          }}
          product={detailProduct}
        />
      </div>
    </AdminLayout>
  );
};
