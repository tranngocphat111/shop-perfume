import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import type { Supplier, PurchaseInvoiceFormData } from "../../types";
import type { ProductSummary } from "../../services/product.service";

interface PurchaseInvoiceAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PurchaseInvoiceFormData) => Promise<void>;
  suppliers: Supplier[];
  products: ProductSummary[];
}

interface InvoiceDetail {
  productId: number;
  productName?: string;
  quantity: number;
  importPrice: number;
  subTotal: number;
}

export const PurchaseInvoiceAddModal = ({
  isOpen,
  onClose,
  onSubmit,
  suppliers,
  products,
}: PurchaseInvoiceAddModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<PurchaseInvoiceFormData>({
    supplierId: 0,
    email: "",
    status: "PENDING",
    details: [],
  });

  const [details, setDetails] = useState<InvoiceDetail[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug: Log products when modal opens
  if (isOpen) {
    console.log("🛒 Modal received products:", products);
    console.log("📊 Products count:", products?.length || 0);
    console.log("👥 Suppliers count:", suppliers?.length || 0);
    if (products && products.length > 0) {
      console.log("📋 First 3 products:", products.slice(0, 3));
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.supplierId === 0) {
      newErrors.supplierId = "Please select a supplier";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (details.length === 0) {
      newErrors.details = "At least one product detail is required";
    }

    // Validate each detail
    details.forEach((detail, index) => {
      if (detail.productId === 0) {
        newErrors[`detail_${index}_product`] = "Please select a product";
      }
      if (detail.quantity <= 0) {
        newErrors[`detail_${index}_quantity`] =
          "Quantity must be greater than 0";
      }
      if (detail.importPrice <= 0) {
        newErrors[`detail_${index}_price`] = "Price must be greater than 0";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddDetail = () => {
    setDetails([
      ...details,
      {
        productId: 0,
        productName: "",
        quantity: 1,
        importPrice: 0,
        subTotal: 0,
      },
    ]);
  };

  const handleRemoveDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleDetailChange = (
    index: number,
    field: keyof InvoiceDetail,
    value: number | string
  ) => {
    const newDetails = [...details];

    if (field === "productId") {
      const productId = Number(value);
      const product = products.find((p) => p.productId === productId);
      newDetails[index] = {
        ...newDetails[index],
        productId,
        productName: product?.name || "",
      };
    } else {
      newDetails[index] = {
        ...newDetails[index],
        [field]: value,
      };
    }

    // Recalculate subtotal
    newDetails[index].subTotal =
      newDetails[index].quantity * newDetails[index].importPrice;

    setDetails(newDetails);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<{
        ProductID: number;
        Quantity: number;
        ImportPrice: number;
      }>(worksheet);

      const importedDetails: InvoiceDetail[] = [];
      const invalidProducts: number[] = [];

      jsonData.forEach((row) => {
        const product = products.find((p) => p.productId === row.ProductID);
        const quantity = row.Quantity || 0;
        const importPrice = row.ImportPrice || 0;

        if (!product) {
          // Product không tồn tại hoặc không ACTIVE
          // Vẫn thêm vào table nhưng productId = 0 (chưa chọn)
          invalidProducts.push(row.ProductID);
          importedDetails.push({
            productId: 0, // Set to 0 to show "Select Product" in dropdown
            productName: "",
            quantity,
            importPrice,
            subTotal: quantity * importPrice,
          });
        } else {
          // Product hợp lệ
          importedDetails.push({
            productId: row.ProductID,
            productName: product.name,
            quantity,
            importPrice,
            subTotal: quantity * importPrice,
          });
        }
      });

      setDetails(importedDetails);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Show results
      let message = "";
      if (invalidProducts.length > 0) {
        message += `⚠️ Warning: ${invalidProducts.length} product(s) not found or INACTIVE:\n`;
        message += `Product IDs: ${invalidProducts.join(", ")}\n`;
        message += `These rows were imported but need product selection.\n\n`;
      }

      const validCount = importedDetails.length - invalidProducts.length;
      message += `✅ Imported ${importedDetails.length} row(s) total:\n`;
      message += `   - ${validCount} valid product(s)\n`;
      message += `   - ${invalidProducts.length} need product selection`;

      alert(message);
    } catch (error) {
      console.error("Error importing Excel:", error);
      alert("❌ Failed to import Excel file. Please check the file format.");
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        ProductID: 1,
        Quantity: 10,
        ImportPrice: 500000,
      },
      {
        ProductID: 2,
        Quantity: 20,
        ImportPrice: 750000,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Invoice");
    XLSX.writeFile(workbook, "purchase_invoice_template.xlsx");
  };

  const calculateTotal = () => {
    return details.reduce((sum, detail) => sum + detail.subTotal, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        const submitData: PurchaseInvoiceFormData = {
          ...formData,
          details: details.map((detail) => ({
            productId: detail.productId,
            quantity: detail.quantity,
            importPrice: detail.importPrice,
          })),
        };
        await onSubmit(submitData);

        // Reset form on success
        setFormData({
          supplierId: 0,
          email: "",
          status: "PENDING",
          details: [],
        });
        setDetails([]);
        setErrors({});
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  const totalAmount = calculateTotal();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 my-8 relative">
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-3"></i>
              <p className="text-gray-700 font-medium">Creating invoice...</p>
              <p className="text-sm text-gray-500 mt-1">Please wait</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-green-600 to-green-700 rounded-t-lg">
          <div>
            <h3 className="text-xl font-bold text-white">
              <i className="fas fa-plus-circle mr-2"></i>
              Add Purchase Invoice
            </h3>
            <p className="text-green-100 text-sm mt-1">
              Create a new purchase invoice
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white hover:text-green-100 text-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => {
                  const selectedSupplierId = Number(e.target.value);
                  const selectedSupplier = suppliers.find(
                    (s) => s.supplierId === selectedSupplierId
                  );
                  setFormData({
                    ...formData,
                    supplierId: selectedSupplierId,
                    email: selectedSupplier?.email || "",
                  });
                }}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.supplierId ? "border-red-500" : "border-gray-300"
                }`}>
                <option value={0}>Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.supplierId} value={supplier.supplierId}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <p className="mt-1 text-sm text-red-500">{errors.supplierId}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="supplier@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as
                      | "PENDING"
                      | "COMPLETED"
                      | "CANCELLED",
                  })
                }
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed">
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-800">
                Product Details <span className="text-red-500">*</span>
              </h4>
              <div className="flex gap-2">
                {/* Download Template */}
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={isSubmitting}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <i className="fas fa-download mr-2"></i>
                  Download Template
                </button>

                {/* Import Excel */}
                <label className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <i className="fas fa-file-excel mr-2"></i>
                  Import Excel
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelImport}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                </label>

                {/* Add Product */}
                <button
                  type="button"
                  onClick={handleAddDetail}
                  disabled={isSubmitting}
                  className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <i className="fas fa-plus mr-2"></i>
                  Add Product
                </button>
              </div>
            </div>

            {errors.details && (
              <p className="mb-3 text-sm text-red-500">{errors.details}</p>
            )}

            {/* Details Table */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      #
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Quantity
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Import Price (đ)
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Sub Total (đ)
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {details.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-8 text-center text-gray-500">
                        <i className="fas fa-box-open text-4xl mb-3 block text-gray-300"></i>
                        No products added yet. Click "Add Product" or "Import
                        Excel" to start.
                      </td>
                    </tr>
                  ) : (
                    details.map((detail, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={detail.productId}
                            onChange={(e) =>
                              handleDetailChange(
                                index,
                                "productId",
                                Number(e.target.value)
                              )
                            }
                            disabled={
                              isSubmitting || !products || products.length === 0
                            }
                            className={`w-full px-2 py-1 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
                              errors[`detail_${index}_product`]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}>
                            <option value={0}>
                              {!products || products.length === 0
                                ? "No products available"
                                : "Select Product"}
                            </option>
                            {products &&
                              products.length > 0 &&
                              products.map((product) => (
                                <option
                                  key={product.productId}
                                  value={product.productId}>
                                  {product.productId} - {product.name}
                                </option>
                              ))}
                          </select>
                          {errors[`detail_${index}_product`] && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors[`detail_${index}_product`]}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={detail.quantity}
                            onChange={(e) =>
                              handleDetailChange(
                                index,
                                "quantity",
                                Number(e.target.value)
                              )
                            }
                            min="1"
                            disabled={isSubmitting}
                            className={`w-full px-2 py-1 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
                              errors[`detail_${index}_quantity`]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {errors[`detail_${index}_quantity`] && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors[`detail_${index}_quantity`]}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={detail.importPrice}
                            onChange={(e) =>
                              handleDetailChange(
                                index,
                                "importPrice",
                                Number(e.target.value)
                              )
                            }
                            min="0"
                            disabled={isSubmitting}
                            className={`w-full px-2 py-1 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
                              errors[`detail_${index}_price`]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {errors[`detail_${index}_price`] && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors[`detail_${index}_price`]}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-blue-600 text-right">
                          {detail.subTotal.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveDetail(index)}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove">
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {details.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-4 text-right text-sm font-bold text-gray-900">
                        Total: {details.length} item(s)
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-lg font-bold text-green-600">
                        {totalAmount.toLocaleString("vi-VN")} đ
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-white rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || details.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium">
            {isSubmitting && <i className="fas fa-spinner fa-spin"></i>}
            <i className="fas fa-check mr-2"></i>
            {isSubmitting ? "Creating..." : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
};
