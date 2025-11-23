import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { productService } from "../services/perfume.service";
import type { Inventory } from "../types";

interface OrderResponse {
  orderId: number;
  orderDate: string;
  totalAmount: number;
  orderItems: Array<{
    orderItemId: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    subTotal: number;
  }>;
}

export const useBestSellers = () => {
  const [bestSellers, setBestSellers] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        
        // Fetch all orders from API
        let orders: OrderResponse[] = [];
        try {
          orders = await apiService.get<OrderResponse[]>("/orders");
        } catch (err) {
          console.warn("Could not fetch orders, using fallback:", err);
        }
        
        // Calculate best sellers from orders
        const productSales: Record<number, number> = {};
        
        orders.forEach((order) => {
          order.orderItems?.forEach((item) => {
            const productId = item.productId;
            productSales[productId] = (productSales[productId] || 0) + item.quantity;
          });
        });

        // Sort by sales quantity
        const sortedProducts = Object.entries(productSales)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 20) // Top 20 best sellers
          .map(([productId]) => parseInt(productId));

        // Fetch inventories for best selling products
        const allInventories = await productService.getAllInventories();
        
        let bestSellerInventories: Inventory[];
        if (sortedProducts.length > 0) {
          bestSellerInventories = sortedProducts
            .map((productId) =>
              allInventories.find((inv) => inv.product.productId === productId)
            )
            .filter((inv): inv is Inventory => inv !== undefined);
        } else {
          // Fallback: use first 20 inventories if no orders
          bestSellerInventories = allInventories.slice(0, 20);
        }

        setBestSellers(bestSellerInventories);
        setError(null);
      } catch (err) {
        console.error("Error fetching best sellers:", err);
        // Fallback to top inventories if everything fails
        try {
          const inventories = await productService.getAllInventories();
          setBestSellers(inventories.slice(0, 20));
        } catch (fallbackErr) {
          setError("Failed to fetch best sellers");
          setBestSellers([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  return { bestSellers, loading, error };
};

