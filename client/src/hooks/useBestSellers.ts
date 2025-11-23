import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { productService } from "../services/perfume.service";
import type { Inventory } from "../types";

export const useBestSellers = () => {
  const [bestSellers, setBestSellers] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        
        // Fetch best sellers from API (calculated from order_item table)
        const bestSellersData = await apiService.get<Inventory[]>("/inventories/best-sellers?limit=20");
        
        setBestSellers(bestSellersData || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching best sellers:", err);
        // Fallback to top inventories if API fails
        try {
          const inventories = await productService.getAllInventories();
          setBestSellers(inventories.slice(0, 20));
          setError(null);
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

