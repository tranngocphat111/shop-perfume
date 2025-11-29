import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Product } from '../types';
import { productService } from '../services/perfume.service';

interface SearchContextType {
  searchQuery: string;
  searchResults: Product[];
  isLoading: boolean;
  totalResults: number;
  searchProducts: (query: string) => Promise<void>;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const searchProducts = useCallback(async (query: string) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      setTotalResults(0);
      setSearchQuery('');
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
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setTotalResults(0);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        searchResults,
        isLoading,
        totalResults,
        searchProducts,
        clearSearch,
      }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

