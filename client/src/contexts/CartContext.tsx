import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Cart, CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { cartService } from '../services/cart.service';
import { productService } from '../services/perfume.service';

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  mergeCartOnLogin: (userId: number) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'perfume_shop_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState<Cart>(() => {
    // Initialize from sessionStorage
    const savedCart = sessionStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch {
        return { items: [], total: 0, totalItems: 0 };
      }
    }
    return { items: [], total: 0, totalItems: 0 };
  });

  // Save to sessionStorage whenever cart changes (only if not authenticated)
  useEffect(() => {
    if (!isAuthenticated) {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isAuthenticated]);

  // Load cart from DB when user is authenticated (only once on mount or when user changes)
  useEffect(() => {
    if (isAuthenticated && user) {
      // Only load if sessionStorage doesn't have cart (meaning we haven't loaded from DB yet)
      const hasSessionCart = sessionStorage.getItem(CART_STORAGE_KEY);
      if (!hasSessionCart) {
        loadCartFromDB(user.userId);
      }
    } else if (!isAuthenticated) {
      // User logged out, clear cart and sessionStorage
      setCart({ items: [], total: 0, totalItems: 0 });
      sessionStorage.removeItem(CART_STORAGE_KEY);
      lastCartRef.current = '';
    }
  }, [isAuthenticated, user?.userId]);

  // Fetch inventory for cart items that don't have stockQuantity (for sessionStorage cart)
  const hasFetchedStockRef = useRef<Set<number>>(new Set());
  
  useEffect(() => {
    if (cart.items.length === 0 || isAuthenticated) return; // Skip if authenticated (DB cart already has stock)
    
    const itemsNeedingStock = cart.items.filter(
      item => item.stockQuantity === undefined && !hasFetchedStockRef.current.has(item.product.productId)
    );
    if (itemsNeedingStock.length === 0) return;

    // Fetch inventory for items that don't have stockQuantity
    const fetchStockForItems = async () => {
      const itemsWithStock = await Promise.all(
        cart.items.map(async (item) => {
          if (item.stockQuantity !== undefined || hasFetchedStockRef.current.has(item.product.productId)) {
            return item;
          }
          hasFetchedStockRef.current.add(item.product.productId);
          try {
            const inventory = await productService.getInventoryByProductId(item.product.productId);
            return {
              ...item,
              stockQuantity: inventory.quantity,
            };
          } catch (error) {
            console.error(`Error fetching inventory for product ${item.product.productId}:`, error);
            return item;
          }
        })
      );

      setCart((prevCart) => ({
        ...prevCart,
        items: itemsWithStock,
      }));
    };

    fetchStockForItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.items.map(item => item.product.productId).join(',')]); // Run when product IDs change

  const loadCartFromDB = async (userId: number) => {
    try {
      isSyncingRef.current = true; // Prevent sync when loading from DB
      const cartResponse = await cartService.getOrCreateCart(userId);
      
      // Fetch inventory for each product
      const itemsWithStock = await Promise.all(
        (cartResponse.items || []).map(async (item) => {
          try {
            const inventory = await productService.getInventoryByProductId(item.product.productId);
            return {
              ...item,
              stockQuantity: inventory.quantity,
            };
          } catch (error) {
            console.error(`Error fetching inventory for product ${item.product.productId}:`, error);
            return {
              ...item,
              stockQuantity: undefined,
            };
          }
        })
      );
      
      // Convert CartResponse to Cart format
      const dbCart: Cart = {
        items: itemsWithStock,
        total: itemsWithStock.reduce((sum, item) => sum + (item.product?.unitPrice || 0) * item.quantity, 0),
        totalItems: itemsWithStock.reduce((sum, item) => sum + item.quantity, 0),
      };
      
      // Update lastCartRef to prevent sync trigger
      const cartString = JSON.stringify(dbCart.items.map(item => ({
        productId: item.product.productId,
        quantity: item.quantity,
      })));
      lastCartRef.current = cartString;
      
      setCart(dbCart);
      // Clear sessionStorage after loading from DB
      sessionStorage.removeItem(CART_STORAGE_KEY);
      isSyncingRef.current = false;
    } catch (error) {
      console.error('Error loading cart from DB:', error);
      isSyncingRef.current = false;
    }
  };

  const mergeCartOnLogin = async (userId: number) => {
    try {
      // Get session cart items
      const savedCart = sessionStorage.getItem(CART_STORAGE_KEY);
      if (!savedCart) {
        // No session cart, just load from DB
        await loadCartFromDB(userId);
        return;
      }

      const sessionCart: Cart = JSON.parse(savedCart);
      if (sessionCart.items.length === 0) {
        // Empty session cart, just load from DB
        await loadCartFromDB(userId);
        return;
      }

      // Convert session cart items to CartItemRequest format
      const sessionCartItems = sessionCart.items.map(item => ({
        productId: item.product.productId,
        quantity: item.quantity,
      }));

      // Merge with DB cart
      const mergedCart = await cartService.mergeCart(userId, sessionCartItems);
      
      // Fetch inventory for each product
      const itemsWithStock = await Promise.all(
        (mergedCart.items || []).map(async (item) => {
          try {
            const inventory = await productService.getInventoryByProductId(item.product.productId);
            return {
              ...item,
              stockQuantity: inventory.quantity,
            };
          } catch (error) {
            console.error(`Error fetching inventory for product ${item.product.productId}:`, error);
            return {
              ...item,
              stockQuantity: undefined,
            };
          }
        })
      );
      
      // Convert merged cart to Cart format
      const mergedCartFormatted: Cart = {
        items: itemsWithStock,
        total: itemsWithStock.reduce((sum, item) => sum + (item.product?.unitPrice || 0) * item.quantity, 0),
        totalItems: itemsWithStock.reduce((sum, item) => sum + item.quantity, 0),
      };
      
      // Update lastCartRef to prevent sync trigger
      isSyncingRef.current = true;
      const cartString = JSON.stringify(mergedCartFormatted.items.map(item => ({
        productId: item.product.productId,
        quantity: item.quantity,
      })));
      lastCartRef.current = cartString;
      
      setCart(mergedCartFormatted);
      // Clear sessionStorage after merge
      sessionStorage.removeItem(CART_STORAGE_KEY);
      isSyncingRef.current = false;
    } catch (error) {
      console.error('Error merging cart on login:', error);
      // Fallback: just load from DB
      await loadCartFromDB(userId);
    }
  };

  const calculateTotal = (items: CartItem[]) => {
    return items.reduce(
      (sum, item) => sum + item.product.unitPrice * item.quantity,
      0
    );
  };

  const calculateTotalItems = (items: CartItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const addToCart = async (product: Product, quantity: number) => {
    // Fetch inventory for the product
    let stockQuantity: number | undefined;
    try {
      const inventory = await productService.getInventoryByProductId(product.productId);
      stockQuantity = inventory.quantity;
    } catch (error) {
      console.error(`Error fetching inventory for product ${product.productId}:`, error);
    }

    setCart((prevCart) => {
      const existingItem = prevCart.items.find(
        (item) => item.product.productId === product.productId
      );

      let newItems: CartItem[];
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        // Validate against stock
        const finalQuantity = stockQuantity !== undefined && newQuantity > stockQuantity 
          ? stockQuantity 
          : newQuantity;
        
        newItems = prevCart.items.map((item) =>
          item.product.productId === product.productId
            ? { ...item, quantity: finalQuantity, stockQuantity }
            : item
        );
      } else {
        // Validate initial quantity against stock
        const finalQuantity = stockQuantity !== undefined && quantity > stockQuantity 
          ? stockQuantity 
          : quantity;
        
        newItems = [...prevCart.items, { product, quantity: finalQuantity, stockQuantity }];
      }

      return {
        items: newItems,
        total: calculateTotal(newItems),
        totalItems: calculateTotalItems(newItems),
      };
    });
  };

  const syncEntireCartToDB = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Convert current cart items to CartItemRequest format
      const cartItems = cart.items.map(item => ({
        productId: item.product.productId,
        quantity: item.quantity,
      }));
      
      // Use merge to sync (it will handle add/update)
      await cartService.mergeCart(user.userId, cartItems);
    } catch (error) {
      console.error('Error syncing entire cart to DB:', error);
    }
  };

  // Sync cart to DB when cart changes and user is authenticated
  // Use a ref to prevent infinite loops
  const isSyncingRef = useRef(false);
  const lastCartRef = useRef<string>('');

  useEffect(() => {
    if (!isAuthenticated || !user || isSyncingRef.current) return;
    
    // Create a string representation of cart items to detect changes
    const cartString = JSON.stringify(cart.items.map(item => ({
      productId: item.product.productId,
      quantity: item.quantity,
    })));
    
    // Only sync if cart actually changed
    if (cartString !== lastCartRef.current) {
      lastCartRef.current = cartString;
      isSyncingRef.current = true;
      
      syncEntireCartToDB().finally(() => {
        isSyncingRef.current = false;
      });
    }
  }, [cart.items, isAuthenticated, user?.userId]);

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter(
        (item) => item.product.productId !== productId
      );
      return {
        items: newItems,
        total: calculateTotal(newItems),
        totalItems: calculateTotalItems(newItems),
      };
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) => {
      const item = prevCart.items.find((item) => item.product.productId === productId);
      // Validate quantity against stock
      if (item && item.stockQuantity !== undefined && quantity > item.stockQuantity) {
        // Limit to stock quantity
        quantity = item.stockQuantity;
      }

      const newItems = prevCart.items.map((item) =>
        item.product.productId === productId ? { ...item, quantity } : item
      );
      return {
        items: newItems,
        total: calculateTotal(newItems),
        totalItems: calculateTotalItems(newItems),
      };
    });
  };

  const clearCart = () => {
    setCart({ items: [], total: 0, totalItems: 0 });
  };

  const getCartTotal = () => {
    return cart.total;
  };

  const getCartCount = () => {
    // Return number of unique products (items.length) instead of total quantity
    return cart.items.length;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        mergeCartOnLogin,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
