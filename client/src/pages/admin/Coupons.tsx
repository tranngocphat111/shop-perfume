import { useState, useEffect } from "react";
import {
  AdminLayout,
  DataTable,
  type Column,
  ToastContainer,
} from "../../components/admin";
import { couponService, type Coupon } from "../../services/coupon.service";
import {
  CouponModal,
  type CouponFormData,
} from "../../components/admin/CouponModal";
import { CouponDetailModal } from "../../components/admin/CouponDetailModal";
import { useToast } from "../../hooks/useToast";

interface CouponData extends Record<string, unknown> {
  id: number;
  code: string;
  discountPercent: number;
  requiredPoints: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  lastUpdated: string;
  updatedBy: string;
}

export const Coupons = () => {
  const { toasts, removeToast, success, error: showError } = useToast();

  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Sort and search states
  const [sortField] = useState<string>("couponId");
  const [sortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedCoupon, setSelectedCoupon] = useState<CouponFormData | null>(
    null
  );

  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailCoupon, setDetailCoupon] = useState<Coupon | null>(null);

  const fetchCoupons = async (
    page: number,
    size: number,
    sortBy?: string,
    direction?: string,
    search?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const pageResponse = search
        ? await couponService.searchCoupons(
            search,
            page,
            size,
            sortBy,
            direction
          )
        : await couponService.getAllCoupons(page, size, sortBy, direction);

      const transformedData: CouponData[] = pageResponse.content.map(
        (item: Coupon) => ({
          id: item.couponId,
          code: item.code,
          discountPercent: item.discountPercent,
          requiredPoints: item.requiredPoints || 0,
          startDate: item.startDate,
          endDate: item.endDate,
          isActive: item.active, // Backend trả về 'active'
          lastUpdated: item.lastUpdated || "",
          updatedBy: item.lastUpdatedBy || "N/A",
        })
      );

      setCoupons(transformedData);
      setTotalElements(pageResponse.totalElements);
    } catch (err) {
      console.error("Error fetching coupons:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load coupons";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons(currentPage, pageSize, sortField, sortDirection, searchQuery);
  }, [currentPage, pageSize, sortField, sortDirection, searchQuery]);

  const handleAddNew = () => {
    setModalMode("add");
    setSelectedCoupon(null);
    setIsModalOpen(true);
  };

  const handleEdit = async (item: CouponData) => {
    try {
      const coupon = await couponService.getCouponById(item.id);
      setSelectedCoupon({
        couponId: coupon.couponId,
        code: coupon.code,
        description: coupon.description,
        discountPercent: coupon.discountPercent,
        requiredPoints: coupon.requiredPoints,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        isActive: coupon.active, // Backend trả về 'active'
      });
      setModalMode("edit");
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching coupon:", err);
      showError("Failed to load coupon details");
    }
  };

  const handleView = async (item: CouponData) => {
    try {
      const coupon = await couponService.getCouponById(item.id);
      setDetailCoupon(coupon);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error("Error fetching coupon:", err);
      showError("Failed to load coupon details");
    }
  };

  const handleDelete = async (item: CouponData) => {
    try {
      await couponService.deleteCoupon(item.id);
      success("Coupon deleted successfully");
      fetchCoupons(
        currentPage,
        pageSize,
        sortField,
        sortDirection,
        searchQuery
      );
    } catch (err: any) {
      console.error("Error deleting coupon:", err);
      const errorMessage =
        err.response?.data ||
        err.message ||
        "Failed to delete coupon. It may be used in orders.";
      showError(errorMessage);
    }
  };

  const handleModalSubmit = async (formData: CouponFormData) => {
    try {
      if (modalMode === "add") {
        await couponService.createCoupon(formData);
        success("Coupon created successfully");
      } else {
        await couponService.updateCoupon(selectedCoupon!.couponId!, formData);
        success("Coupon updated successfully");
      }

      setIsModalOpen(false);
      setSelectedCoupon(null);
      fetchCoupons(
        currentPage,
        pageSize,
        sortField,
        sortDirection,
        searchQuery
      );
    } catch (err: any) {
      console.error("Error saving coupon:", err);

      // Extract error message from response
      let errorMessage = "Failed to save coupon";
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors) {
          // Handle validation errors
          errorMessage = Object.values(errorData.errors).join(", ");
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      showError(errorMessage);
      throw err;
    }
  };

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns: Column[] = [
    {
      key: "id",
      label: "ID",
      sortable: true,
      render: (value: any) => <span className="font-medium">#{value}</span>,
    },
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (value: any) => (
        <span className="inline-flex items-center px-2 py-1 rounded text-sm font-bold bg-blue-100 text-blue-800">
          {value}
        </span>
      ),
    },
    {
      key: "discountPercent",
      label: "Discount",
      sortable: true,
      render: (value: any) => (
        <span className="text-green-600 font-semibold">{value}%</span>
      ),
    },
    {
      key: "requiredPoints",
      label: "Required Points",
      sortable: true,
      render: (value: any) => (
        <span className="text-gray-700">{value} pts</span>
      ),
    },
    {
      key: "startDate",
      label: "Start Date",
      sortable: true,
      render: (value: any) => (
        <span className="text-sm text-gray-600">
          {formatDate(value as string)}
        </span>
      ),
    },
    {
      key: "endDate",
      label: "End Date",
      sortable: true,
      render: (value: any) => (
        <span className="text-sm text-gray-600">
          {formatDate(value as string)}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (value: any) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
            value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          <i
            className={`fas fa-circle text-xs mr-1 ${
              value ? "text-green-500" : "text-red-500"
            }`}
          ></i>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "lastUpdated",
      label: "Last Updated",
      sortable: true,
      render: (value: any) => (
        <span className="text-sm text-gray-500">
          {formatDate(value as string)}
        </span>
      ),
    },
    {
      key: "updatedBy",
      label: "Updated By",
      sortable: true,
      render: (value: any) => (
        <span className="text-sm text-gray-600 truncate " title={value}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Coupons</h1>
            <p className="text-gray-600 mt-1">
              Manage promotional coupons and discount codes
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <i className="fas fa-exclamation-circle"></i>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          data={coupons}
          loading={loading}
          serverSide={true}
          totalElements={totalElements}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          sortField={sortField}
          sortDirection={sortDirection}
          onSearch={handleSearch}
          searchPlaceholder="Search by code or description..."
          onAdd={handleAddNew}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
        />

        <CouponModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCoupon(null);
          }}
          onSubmit={handleModalSubmit}
          initialData={selectedCoupon || undefined}
          mode={modalMode}
        />

        <CouponDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailCoupon(null);
          }}
          coupon={detailCoupon}
        />

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </AdminLayout>
  );
};
