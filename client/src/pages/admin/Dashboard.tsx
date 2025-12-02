import { AdminLayout } from "../../components/admin";
import { Line, Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect, useState } from "react";
import { orderService } from "@/services/order.service";
import type { RevenueStatsResponse } from "@/services/order.service";
import { formatCurrency } from "@/utils";
import {
  dashboardService,
  type DashboardStats,
  type CategoryDistributionResponse,
  type TopBrandResponse,
} from "@/services/dashboard.service";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type PeriodType = "monthly" | "quarterly" | "yearly";

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState<PeriodType>("monthly");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [revenueStats, setRevenueStats] = useState<RevenueStatsResponse | null>(
    null
  );
  const [categoryDistribution, setCategoryDistribution] =
    useState<CategoryDistributionResponse | null>(null);
  const [topBrands, setTopBrands] = useState<TopBrandResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Handle period change
  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
  };

  // Handle year change
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };
  // Fetch stats without date filter
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await dashboardService.getDashboardStats();
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchStats();
  }, []);

  // Fetch category distribution (no date filter - show all categories)
  useEffect(() => {
    const fetchCategoryDistribution = async () => {
      try {
        const categoryData = await dashboardService.getCategoryDistribution();
        setCategoryDistribution(categoryData);
      } catch (error) {
        console.error("Error fetching category distribution:", error);
      }
    };

    fetchCategoryDistribution();
  }, []);

  // Fetch top brands without date filter
  useEffect(() => {
    const fetchTopBrands = async () => {
      try {
        const brandsData = await dashboardService.getTopBrands(10);
        setTopBrands(brandsData);
      } catch (error) {
        console.error("Error fetching top brands:", error);
      }
    };

    fetchTopBrands();
  }, []);

  useEffect(() => {
    const fetchRevenueStats = async () => {
      try {
        setLoading(true);
        const year = period === "yearly" ? undefined : selectedYear;
        const data = await orderService.getRevenueStatsByPeriod(period, year);
        setRevenueStats(data);
      } catch (error) {
        console.error("Error fetching revenue stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenueStats();
  }, [period, selectedYear]);

  const chartData = {
    labels: revenueStats?.labels || [],
    datasets: [
      {
        label: "Revenue (VND)",
        data: revenueStats?.revenues || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Order Count",
        data: revenueStats?.orderCounts || [],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: true,
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Revenue Overview - ${
          period === "monthly"
            ? `Monthly ${selectedYear}`
            : period === "quarterly"
            ? `Quarterly ${selectedYear}`
            : "Yearly"
        }`,
      },
      tooltip: {
        callbacks: {
          label: function (context: {
            dataset: { label?: string };
            parsed: { y: number | null };
          }) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              if (context.dataset.label === "Revenue (VND)") {
                label += formatCurrency(context.parsed.y) + " VND";
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Revenue (VND)",
        },
        ticks: {
          callback: function (value: string | number) {
            return formatCurrency(Number(value));
          },
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Order Count",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Global Date Filter */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back! Here's what's happening with your store.
              </p>
            </div>

            {/* Period Filter */}
            <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 w-full">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Chu kỳ:
                </label>
                <select
                  value={period}
                  onChange={(e) =>
                    handlePeriodChange(e.target.value as PeriodType)
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {period !== "yearly" && (
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => {
                  const year = new Date().getFullYear();
                  setPeriod("monthly");
                  setSelectedYear(year);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid - Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Actual sales revenue
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">VND</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <i className="fas fa-dollar-sign text-blue-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mt-1">Successful orders</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stats?.completedOrders || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">orders</p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <i className="fas fa-shopping-cart text-green-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* New Customers */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  New Customers (Last 30 days)
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stats?.newCustomers || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">customers</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-full">
                <i className="fas fa-user-plus text-purple-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Average Order Value (AOV) */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Average Order Value
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {formatCurrency(stats?.averageOrderValue || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">VND</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-full">
                <i className="fas fa-chart-line text-yellow-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* New Orders */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  New Orders (Last 30 days)
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stats?.newOrders || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">orders</p>
              </div>
              <div className="bg-indigo-100 p-4 rounded-full">
                <i className="fas fa-cart-plus text-indigo-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Refund Rate */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Refund Rate</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats?.refundRate?.toFixed(2) || 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.refundedOrders || 0} refunded
                </p>
              </div>
              <div className="bg-red-100 p-4 rounded-full">
                <i className="fas fa-undo text-red-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Payment Status Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Order Payment Status
            </h2>
            <div className="h-80 flex items-center justify-center">
              <Pie
                data={{
                  labels: ["Paid", "Pending", "Failed", "Refunded"],
                  datasets: [
                    {
                      label: "Orders",
                      data: [
                        stats?.completedOrders || 0,
                        stats?.pendingOrders || 0,
                        stats?.failedOrders || 0,
                        stats?.refundedOrders || 0,
                      ],
                      backgroundColor: [
                        "rgba(34, 197, 94, 0.8)",
                        "rgba(251, 146, 60, 0.8)",
                        "rgba(239, 68, 68, 0.8)",
                        "rgba(147, 51, 234, 0.8)",
                      ],
                      borderColor: [
                        "rgb(34, 197, 94)",
                        "rgb(251, 146, 60)",
                        "rgb(239, 68, 68)",
                        "rgb(147, 51, 234)",
                      ],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                    title: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          const label = context.label || "";
                          const value = context.parsed || 0;
                          const total = stats?.totalOrders || 0;
                          const percentage =
                            total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                          return `${label}: ${value} (${percentage}%)`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Category Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Category Distribution
            </h2>
            <div className="h-80 flex items-center justify-center">
              <Pie
                data={{
                  labels:
                    categoryDistribution?.categories.map(
                      (c) => c.categoryName
                    ) || [],
                  datasets: [
                    {
                      label: "Revenue",
                      data:
                        categoryDistribution?.categories.map(
                          (c) => c.revenue
                        ) || [],
                      backgroundColor: [
                        "rgba(59, 130, 246, 0.8)",
                        "rgba(139, 92, 246, 0.8)",
                        "rgba(236, 72, 153, 0.8)",
                        "rgba(34, 197, 94, 0.8)",
                        "rgba(234, 179, 8, 0.8)",
                        "rgba(249, 115, 22, 0.8)",
                      ],
                      borderColor: [
                        "rgb(59, 130, 246)",
                        "rgb(139, 92, 246)",
                        "rgb(236, 72, 153)",
                        "rgb(34, 197, 94)",
                        "rgb(234, 179, 8)",
                        "rgb(249, 115, 22)",
                      ],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                    title: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          const label = context.label || "";
                          const value = context.parsed || 0;
                          const category =
                            categoryDistribution?.categories.find(
                              (c) => c.categoryName === label
                            );
                          return [
                            `${label}`,
                            `Revenue: ${formatCurrency(value)} VND`,
                            `Orders: ${category?.orderCount || 0}`,
                            `Share: ${category?.percentage.toFixed(1) || 0}%`,
                          ];
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Top 10 Brands Bar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Top 10 Best-Selling Brands
          </h2>
          <div className="h-80">
            <Bar
              data={{
                labels: topBrands.map((b) => b.brandName),
                datasets: [
                  {
                    label: "Total Sold",
                    data: topBrands.map((b) => b.totalSold),
                    backgroundColor: "rgba(59, 130, 246, 0.8)",
                    borderColor: "rgb(59, 130, 246)",
                    borderWidth: 2,
                    yAxisID: "y",
                  },
                  {
                    label: "Revenue (Million VND)",
                    data: topBrands.map((b) => b.revenue / 1000000),
                    backgroundColor: "rgba(34, 197, 94, 0.8)",
                    borderColor: "rgb(34, 197, 94)",
                    borderWidth: 2,
                    yAxisID: "y1",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                  },
                  title: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const label = context.dataset.label || "";
                        const value = context.parsed.y || 0;
                        if (label === "Revenue (Million VND)") {
                          return `${label}: ${formatCurrency(
                            value * 1000000
                          )} VND`;
                        }
                        return `${label}: ${value}`;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    type: "linear" as const,
                    display: true,
                    position: "left" as const,
                    title: {
                      display: true,
                      text: "Total Sold (Units)",
                    },
                  },
                  y1: {
                    type: "linear" as const,
                    display: true,
                    position: "right" as const,
                    title: {
                      display: true,
                      text: "Revenue (Million VND)",
                    },
                    grid: {
                      drawOnChartArea: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Revenue Analytics Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Revenue Analytics
          </h2>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
