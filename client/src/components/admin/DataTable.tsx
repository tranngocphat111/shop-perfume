import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import "jspdf-autotable";

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, row: any) => React.ReactNode;
  hidden?: boolean;
  onSort?: (key: string) => void;
}

interface DataTableProps<T> {
  columns: Column[];
  data: T[];
  pageSize?: number;
  title?: string;
  onAdd?: () => void;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  serverSide?: boolean;
  totalElements?: number;
  currentPage?: number;
  onPageChange?: (page: number, size: number) => void;
  loading?: boolean;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize = 25,
  title = "Data Table",
  onAdd,
  onView,
  onEdit,
  onDelete,
  searchPlaceholder = "Search...",
  onSearch,
  serverSide = false,
  totalElements = 0,
  currentPage: externalCurrentPage,
  onPageChange,
  loading = false,
  sortField: externalSortField,
  sortDirection: externalSortDirection,
}: DataTableProps<T>) {
  const [internalCurrentPage, setInternalCurrentPage] = useState(0);
  const [entriesPerPage, setEntriesPerPage] = useState(pageSize);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const visibleColumns = columns.map((col) => col.key);

  // Use external currentPage if provided (server-side), otherwise use internal state
  const currentPage =
    serverSide && externalCurrentPage !== undefined
      ? externalCurrentPage
      : internalCurrentPage;

  // Handle search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // For client-side, search immediately
    if (!serverSide && onSearch) {
      onSearch(value);
    }
    if (!serverSide) {
      setInternalCurrentPage(0);
    }
  };

  // Handle search submit (for server-side)
  const handleSearchSubmit = () => {
    if (onSearch) {
      onSearch(searchTerm);
    }
    if (serverSide) {
      // Reset to first page when searching
      if (onPageChange) {
        onPageChange(0, entriesPerPage);
      }
    }
  };

  // Handle Enter key press
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm || serverSide) return data;

    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm, serverSide]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig || serverSide) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key] as string | number;
      const bValue = b[sortConfig.key] as string | number;

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig, serverSide]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (serverSide) {
      return data;
    }
    const start = internalCurrentPage * entriesPerPage;
    const end = start + entriesPerPage;
    return sortedData.slice(start, end);
  }, [serverSide, data, sortedData, internalCurrentPage, entriesPerPage]);

  const totalPages = serverSide
    ? Math.ceil(totalElements / entriesPerPage)
    : Math.ceil(sortedData.length / entriesPerPage);

  const displayLength = serverSide ? totalElements : sortedData.length;

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const exportToCSV = () => {
    const visibleCols = columns.filter((col) =>
      visibleColumns.includes(col.key)
    );
    const headers = visibleCols.map((col) => col.label);
    const rows = sortedData.map((row) =>
      visibleCols.map((col) => String(row[col.key] || ""))
    );

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}-${Date.now()}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    const visibleCols = columns.filter((col) =>
      visibleColumns.includes(col.key)
    );
    const headers = visibleCols.map((col) => col.label);
    const rows = sortedData.map((row) =>
      visibleCols.map((col) => row[col.key] || "")
    );

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${title}-${Date.now()}.xlsx`);
  };

  const printTable = () => {
    const visibleCols = columns.filter((col) =>
      visibleColumns.includes(col.key)
    );
    const headers = visibleCols.map((col) => col.label);
    const rows = sortedData.map((row) =>
      visibleCols.map((col) => String(row[col.key] || ""))
    );

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print - ${title}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; }
          h1 { font-size: 20pt; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #1e40af; color: white; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Records:</strong> ${rows.length}</p>
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) =>
                  `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Show</label>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              setEntriesPerPage(newSize);
              setInternalCurrentPage(0);
              if (serverSide && onPageChange) {
                onPageChange(0, newSize);
              }
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm">
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <label className="text-sm text-gray-700">entries</label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-64"
            />
            <button
              onClick={handleSearchSubmit}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
              <i className="fas fa-search mr-1"></i> Search
            </button>
          </div>

          {/* Export Buttons */}
          <button
            onClick={exportToCSV}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
            <i className="fas fa-file-csv mr-1"></i> CSV
          </button>
          <button
            onClick={exportToExcel}
            className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700">
            <i className="fas fa-file-excel mr-1"></i> Excel
          </button>

          <button
            onClick={printTable}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
            <i className="fas fa-print mr-1"></i> Print
          </button>

          {/* Add Button */}
          {onAdd && (
            <button
              onClick={onAdd}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
              <i className="fas fa-plus mr-1"></i> Add
            </button>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center my-4 gap-3 text-sm">
        {/* Info */}
        <div className="text-gray-600">
          Showing {displayLength > 0 ? currentPage * entriesPerPage + 1 : 0} to{" "}
          {Math.min((currentPage + 1) * entriesPerPage, displayLength)} of{" "}
          {displayLength} entries
        </div>

        {/* Page Controls */}
        <div className="flex items-center gap-1">
          {/* Previous Button */}
          <button
            onClick={() => {
              if (currentPage > 0) {
                const newPage = currentPage - 1;
                if (!serverSide) {
                  setInternalCurrentPage(newPage);
                }
                if (serverSide && onPageChange) {
                  onPageChange(newPage, entriesPerPage);
                }
              }
            }}
            disabled={currentPage === 0 || loading}
            className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            title="Previous">
            <i className="fas fa-chevron-left text-xs"></i>
          </button>

          {/* Page Numbers */}
          {(() => {
            const maxVisible = 5;
            let startPage = Math.max(
              0,
              currentPage - Math.floor(maxVisible / 2)
            );
            const endPage = Math.min(
              totalPages - 1,
              startPage + maxVisible - 1
            );

            // Adjust if we're near the end
            if (endPage - startPage < maxVisible - 1) {
              startPage = Math.max(0, endPage - maxVisible + 1);
            }

            const pages = [];

            // First page
            if (startPage > 0) {
              pages.push(
                <button
                  key={0}
                  onClick={() => {
                    if (!serverSide) {
                      setInternalCurrentPage(0);
                    }
                    if (serverSide && onPageChange) {
                      onPageChange(0, entriesPerPage);
                    }
                  }}
                  disabled={loading}
                  className="px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                  1
                </button>
              );
              if (startPage > 1) {
                pages.push(
                  <span key="dots-start" className="px-1">
                    ...
                  </span>
                );
              }
            }

            // Visible pages
            for (let i = startPage; i <= endPage; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => {
                    if (!serverSide) {
                      setInternalCurrentPage(i);
                    }
                    if (serverSide && onPageChange) {
                      onPageChange(i, entriesPerPage);
                    }
                  }}
                  disabled={loading}
                  className={`px-2.5 py-1 border rounded transition-colors ${
                    currentPage === i
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 hover:bg-gray-50"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
                  {i + 1}
                </button>
              );
            }

            // Last page
            if (endPage < totalPages - 1) {
              if (endPage < totalPages - 2) {
                pages.push(
                  <span key="dots-end" className="px-1">
                    ...
                  </span>
                );
              }
              pages.push(
                <button
                  key={totalPages - 1}
                  onClick={() => {
                    const lastPage = totalPages - 1;
                    if (!serverSide) {
                      setInternalCurrentPage(lastPage);
                    }
                    if (serverSide && onPageChange) {
                      onPageChange(lastPage, entriesPerPage);
                    }
                  }}
                  disabled={loading}
                  className="px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                  {totalPages}
                </button>
              );
            }

            return pages;
          })()}

          {/* Next Button */}
          <button
            onClick={() => {
              if (currentPage < totalPages - 1) {
                const newPage = currentPage + 1;
                if (!serverSide) {
                  setInternalCurrentPage(newPage);
                }
                if (serverSide && onPageChange) {
                  onPageChange(newPage, entriesPerPage);
                }
              }
            }}
            disabled={currentPage >= totalPages - 1 || loading}
            className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            title="Next">
            <i className="fas fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-blue-800 text-white">
            <tr>
              {columns
                .filter((col) => visibleColumns.includes(col.key))
                .map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      {col.label}
                      {col.sortable !== false && (
                        <button
                          onClick={() => {
                            if (col.onSort) {
                              col.onSort(col.key);
                            } else {
                              handleSort(col.key);
                            }
                          }}
                          className="text-white hover:text-gray-200">
                          <i
                            className={`fas ${
                              // Use external sort state if available (server-side), otherwise use internal
                              serverSide && externalSortField === col.key
                                ? externalSortDirection === "asc"
                                  ? "fa-sort-up"
                                  : "fa-sort-down"
                                : !serverSide && sortConfig?.key === col.key
                                ? sortConfig.direction === "asc"
                                  ? "fa-sort-up"
                                  : "fa-sort-down"
                                : "fa-sort"
                            }`}></i>
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              {(onView || onEdit || onDelete) && (
                <th className="px-4 py-3 text-left">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={
                    columns.length + (onView || onEdit || onDelete ? 1 : 0)
                  }
                  className="px-4 py-8 text-center text-gray-500">
                  <i className="fas fa-spinner fa-spin text-2xl"></i>
                  <p className="mt-2">Loading...</p>
                </td>
              </tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-gray-50">
                  {columns
                    .filter((col) => visibleColumns.includes(col.key))
                    .map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        {col.render
                          ? col.render(row[col.key], row)
                          : String(row[col.key] ?? "")}
                      </td>
                    ))}
                  {(onView || onEdit || onDelete) && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View">
                            <i className="fas fa-eye"></i>
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="text-yellow-600 hover:text-yellow-800"
                            title="Edit">
                            <i className="fas fa-edit"></i>
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this item?"
                                )
                              ) {
                                onDelete(row);
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Delete">
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={
                    columns.length + (onView || onEdit || onDelete ? 1 : 0)
                  }
                  className="px-4 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
