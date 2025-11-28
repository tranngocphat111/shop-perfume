import { useState, useEffect } from "react";
import { productService } from "../services/perfume.service";
import type { Category } from "../types";

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categories = await productService.getAllCategories();
        setCategories(categories || []);
        setError(null);
      } catch (err) {
        setError("Failed to fetch categories");
        console.error("Error fetching categories:", err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

