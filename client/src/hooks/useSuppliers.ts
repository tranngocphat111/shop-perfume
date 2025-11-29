import { useState, useEffect } from "react";
// import { apiService } from "../services/api";
import type { Supplier } from "../types";
import { supplierService } from "@/services/supplier.service";

export const useSuppliers = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                setLoading(true);
                const suppliers = await supplierService.getAllSuppliers();
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
