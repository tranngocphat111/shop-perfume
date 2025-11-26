import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import type { Supplier, Product, PurchaseInvoiceFormData } from "../../types";

interface PurchaseInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PurchaseInvoiceFormData) => Promise<void>;
  initialData?: PurchaseInvoiceFormData;
  mode: "add" | "edit" | "view";
  suppliers: Supplier[];
  products: Product[];
  isSubmitting?: boolean;
}

interface InvoiceDetail {
  productId: number;
  productName?: string;
  quantity: number;
  importPrice: number;
  subTotal: number;
}

export const PurchaseInvoiceModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  suppliers,
  products,
}: PurchaseInvoiceModalProps) => {
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

  const isReadOnly = mode === "view";

  useEffect(() => {
    if (initialData && mode !== "add") {
      setFormData(initialData);
      // Convert initialData.details to InvoiceDetail format with product names
      const mappedDetails = initialData.details.map((detail) => {
        const product = products.find((p) => p.productId === detail.productId);
        return {
          ...detail,
          productName: product?.name || "",
          subTotal: detail.quantity * detail.importPrice,
        };
      });
      setDetails(mappedDetails);
    } else {
      setFormData({
        supplierId: 0,
        email: "",
        status: "PENDING",
        details: [],
      });
      setDetails([]);
    }
    setErrors({});
  }, [initialData, isOpen, mode, products]);

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

      const importedDetails: InvoiceDetail[] = jsonData.map((row) => {
        const product = products.find((p) => p.productId === row.ProductID);
        const quantity = row.Quantity || 0;
        const importPrice = row.ImportPrice || 0;

        return {
          productId: row.ProductID || 0,
          productName: product?.name || "",
          quantity,
          importPrice,
          subTotal: quantity * importPrice,
        };
      });

      setDetails(importedDetails);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error importing Excel:", error);
      alert("Failed to import Excel file. Please check the file format.");
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        ProductID: 1,
        Quantity: 10,
        ImportPrice: 500000,
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
    if (isReadOnly) {
      onClose();
      return;
    }
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
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  const totalAmount = calculateTotal();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4"
      style={{ margin: 0 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 my-8 relative">
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-3"></i>
              <p className="text-gray-700 font-medium">
                {mode === "add"
                  ? "Creating purchase invoice..."
                  : "Saving changes..."}
              </p>
              <p className="text-sm text-gray-500 mt-1">Please wait</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-lg">
          <h3 className="text-xl font-bold text-gray-800">
            {mode === "add"
              ? "Add Purchase Invoice"
              : mode === "edit"
              ? "Edit Purchase Invoice"
              : "Purchase Invoice Details"}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50 disabled:cursor-not-allowed">
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
                  const supplierId = Number(e.target.value);
                  const supplier = suppliers.find(
                    (s) => s.supplierId === supplierId
                  );
                  setFormData({
                    ...formData,
                    supplierId,
                    email: supplier?.email || "",
                  });
                }}
                disabled={isSubmitting || isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
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
                disabled={isSubmitting || isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter email"
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
                disabled={isSubmitting || isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed">
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Excel Import Section */}
          {!isReadOnly && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-700">
                <i className="fas fa-file-excel text-green-600 mr-2"></i>
                Excel Import
              </h4>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={isSubmitting}
                className="text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50 disabled:cursor-not-allowed">
                <i className="fas fa-download mr-1"></i>
                Download Template
              </button>
            </div>
            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelImport}
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={handleAddDetail}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <i className="fas fa-plus mr-2"></i>
                Add Row
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Upload an Excel file with columns: ProductID, Quantity,
              ImportPrice
            </p>
            </div>
          )}

          {/* Product Details Table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-700">
                Product Details <span className="text-red-500">*</span>
              </h4>
              {details.length > 0 && (
                <span className="text-sm text-gray-600">
                  Total: {details.length} item(s)
                </span>
              )}
            </div>

            {errors.details && (
              <p className="mb-3 text-sm text-red-500">{errors.details}</p>
            )}

            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Import Price (đ)
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Sub Total (đ)
                    </th>
                    {!isReadOnly && (
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {details.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isReadOnly ? 5 : 6}
                        className="px-4 py-8 text-center text-gray-500">
                        No products added. Click "Add Row" or import from Excel.
                      </td>
                    </tr>
                  ) : (
                    details.map((detail, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={detail.productId}
                            onChange={(e) =>
                              handleDetailChange(
                                index,
                                "productId",
                                e.target.value
                              )
                            }
                            disabled={isSubmitting || isReadOnly}
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                              errors[`detail_${index}_product`]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}>
                            <option value={0}>Select Product</option>
                            {products.map((product) => (
                              <option
                                key={product.productId}
                                value={product.productId}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                          {errors[`detail_${index}_product`] && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors[`detail_${index}_product`]}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
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
                            disabled={isSubmitting || isReadOnly}
                            className={`w-24 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
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
                        <td className="px-4 py-3">
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
                            step="1000"
                            disabled={isSubmitting || isReadOnly}
                            className={`w-32 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
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
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">
                          {detail.subTotal.toLocaleString("vi-VN")}
                        </td>
                        {!isReadOnly && (
                          <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveDetail(index)}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove">
                            <i className="fas fa-trash"></i>
                          </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td
                      colSpan={isReadOnly ? 3 : 4}
                      className="px-4 py-3 text-right font-semibold text-gray-700">
                      Total Amount:
                    </td>
                    <td
                      colSpan={isReadOnly ? 2 : 3}
                      className="px-4 py-3 text-left font-bold text-lg text-blue-600">
                      {totalAmount.toLocaleString("vi-VN")} đ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isReadOnly ? "Close" : "Cancel"}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isSubmitting && <i className="fas fa-spinner fa-spin"></i>}
                {isSubmitting
                  ? "Processing..."
                  : mode === "add"
                  ? "Create Invoice"
                  : "Save Changes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
