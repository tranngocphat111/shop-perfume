import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { Product, Inventory } from "../types";
import { productService } from "../services/perfume.service";
import { inventoryService } from "../services/inventory.service";

interface SearchContextType {
  searchQuery: string;
  searchResults: Product[];
  inventories: Map<number, Inventory>;
  isLoading: boolean;
  totalResults: number;
  searchProducts: (query: string) => Promise<void>;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [inventories, setInventories] = useState<Map<number, Inventory>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const searchProducts = useCallback(async (query: string) => {
    if (!query || query.trim() === "") {
      setSearchResults([]);
      setTotalResults(0);
      setSearchQuery("");
      return;
    }

    setIsLoading(true);
    setSearchQuery(query.trim());

    try {
      // Search products by name using pagination endpoint
      // We'll get first page with size 10 to show at least 3 products
      const response = await productService.getProductPage(
        0, // page
        10, // size - get 10 to have enough for dropdown
        undefined, // sortBy
        undefined, // direction
        query.trim(), // search query
        undefined, // brandId
        undefined // categoryId
      );

      setSearchResults(response.content);
      setTotalResults(response.totalElements);

      // Fetch inventories for search results
      if (response.content.length > 0) {
        try {
          const inventoryPromises = response.content.slice(0, 10).map((p) =>
            inventoryService
              .getInventoryByProductId(p.productId)
              .then((inv) => ({ productId: p.productId, inventory: inv }))
              .catch(() => ({ productId: p.productId, inventory: null }))
          );

          const inventoryResults = await Promise.all(inventoryPromises);
          const inventoryMap = new Map<number, Inventory>();

          inventoryResults.forEach(({ productId, inventory: inv }) => {
            if (inv) {
              inventoryMap.set(productId, {
                inventoryId: inv.inventoryId,
                product: response.content.find(
                  (p) => p.productId === productId
                )!,
                quantity: inv.quantity,
              });
            }
          });

          setInventories(inventoryMap);
        } catch (err) {
          console.warn("Failed to fetch search inventories:", err);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setInventories(new Map());
    setTotalResults(0);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        searchResults,
        inventories,
        isLoading,
        totalResults,
        searchProducts,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};
