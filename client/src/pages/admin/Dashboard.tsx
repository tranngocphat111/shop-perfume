import { AdminLayout } from "../../components/admin";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect, useState } from "react";
import { productService } from "@/services/product.service";
import { orderService } from "@/services/order.service";
import { formatCurrency } from "@/utils";
import { inventoryService } from "@/services/inventory.service";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface statsProps {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockItems: number;
  totalCustomers: number;
  pendingOrders: number;
}

export const Dashboard = () => {
  const [stats, setStats] = useState<statsProps | null>(null);
  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue (VND)",
        data: [12000000, 19000000, 15000000, 25000000, 22000000, 30000000],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
    ],
  };
  useEffect(() => {
    const fetchStats = async () => {
      const totalSizeProduct = await productService.getTotalSize();
      const totalSizeOrder = await orderService.getTotalSize();
      const totalRevenue = await orderService.getTotalRevenue();
      const lowStockItems = await inventoryService.getLowStockItem();
      setStats(() => {
        return {
          totalProducts: totalSizeProduct,
          totalOrders: totalSizeOrder,
          totalRevenue: totalRevenue,
          lowStockItems: lowStockItems,
          totalCustomers: 0,
          pendingOrders: 0,
        };
      });
    };
    fetchStats();
  }, []);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Revenue Overview",
      },
    },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Products */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Products</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stats?.totalProducts || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <i className="fas fa-box text-blue-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stats?.totalOrders || 0}
                </p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <i className="fas fa-shopping-cart text-green-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {formatCurrency(stats?.totalRevenue || 0)} VND
                </p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-full">
                <i className="fas fa-dollar-sign text-yellow-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Low Stock Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Low Stock Items</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats?.lowStockItems || 0}
                </p>
              </div>
              <div className="bg-red-100 p-4 rounded-full">
                <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Total Customers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Customers</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stats?.totalCustomers || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-4 rounded-full">
                <i className="fas fa-users text-purple-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Orders</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats?.pendingOrders || 0}
                </p>
              </div>
              <div className="bg-orange-100 p-4 rounded-full">
                <i className="fas fa-clock text-orange-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </AdminLayout>
  );
};
