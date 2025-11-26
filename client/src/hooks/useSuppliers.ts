import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import type { Supplier } from "../types";

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const suppliers = await apiService.get<Supplier[]>("/admin/suppliers");
        setSuppliers(suppliers || []);
        setError(null);
      } catch (err) {
        setError("Failed to fetch suppliers");
        console.error("Error fetching suppliers:", err);
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  return { suppliers, loading, error };
};
