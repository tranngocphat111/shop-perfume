import { useState, useEffect } from "react";
import { productService } from "../services/perfume.service";
import type { Brand } from "../types";

export const useBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const brands = await productService.getAllBrands();
        console.log('✅ Fetched brands:', brands);
        console.log('Total brands:', brands?.length);
        brands?.forEach(b => {
          console.log(`Brand: ${b.name} (ID: ${b.brandId}), URL: ${b.url || 'NO URL'}`);
        });
        setBrands(brands || []);
        setError(null);
      } catch (err) {
        setError("Failed to fetch brands");
        console.error("❌ Error fetching brands:", err);
        setBrands([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  // Group brands by first letter
  const groupedBrands = (brands || []).reduce((acc, brand) => {
    const firstLetter = brand.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(brand);
    return acc;
  }, {} as Record<string, Brand[]>);

  // Get all unique first letters
  const availableLetters = Object.keys(groupedBrands).sort();

  return { brands, loading, error, groupedBrands, availableLetters };
};
