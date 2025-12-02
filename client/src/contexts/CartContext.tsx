import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Cart, CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { cartService } from '../services/cart.service';
import { productService } from '../services/perfume.service';

interface CartContextType {
  cart: Cart;
  isCartLoading: boolean; // Track if cart is still loading
  addToCart: (product: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  mergeCartOnLogin: (userId: number) => Promise<void>;
  // Coupon
  appliedCouponId: number | null;
  discount: number;
  setAppliedCouponId: (id: number | null) => void;
  setDiscount: (amount: number) => void;
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
  
  // Track if cart is still loading (from DB or fetching stock)
  const [isCartLoading, setIsCartLoading] = useState(true);
  
  // Coupon state
  const [appliedCouponId, setAppliedCouponId] = useState<number | null>(null);
  const [discount, setDiscount] = useState<number>(0);

  // Save to sessionStorage whenever cart changes (only if not authenticated)
  useEffect(() => {
    if (!isAuthenticated) {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isAuthenticated]);

  // Track if we've already loaded/merged cart for this user
  const hasLoadedCartRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);

  // Load cart from DB when user is authenticated (only once on mount or when user changes)
  useEffect(() => {
    if (isAuthenticated && user) {
      // Only load if we haven't loaded for this user yet
      // mergeCartOnLogin will handle the merge, so we only load if no merge happened
      if (hasLoadedCartRef.current !== user.userId) {
        setIsCartLoading(true); // Set loading when starting to load
        const hasSessionCart = sessionStorage.getItem(CART_STORAGE_KEY);
        if (hasSessionCart) {
          // If there's a session cart, mergeCartOnLogin should be called from login
          // But if it wasn't (e.g., page refresh), we should merge now
          mergeCartOnLogin(user.userId).then(() => {
            hasLoadedCartRef.current = user.userId;
            isInitialLoadRef.current = false;
          });
        } else {
          // No session cart, just load from DB
          loadCartFromDB(user.userId).then(() => {
            hasLoadedCartRef.current = user.userId;
            isInitialLoadRef.current = false;
          });
        }
      } else {
        // Already loaded for this user, cart is ready
        isInitialLoadRef.current = false;
        setIsCartLoading(false);
      }
    } else if (!isAuthenticated) {
      // User logged out - clear cart state and sessionStorage
      // Cart is already saved in DB, so it will be restored when user logs back in
      setCart({ items: [], total: 0, totalItems: 0 });
      sessionStorage.removeItem(CART_STORAGE_KEY);
      lastCartRef.current = '';
      // Reset the loaded cart ref so we can load again on next login
      hasLoadedCartRef.current = null;
      isInitialLoadRef.current = true;
      // For guest users, check if cart from sessionStorage is ready
      const savedCart = sessionStorage.getItem(CART_STORAGE_KEY);
      if (!savedCart) {
        setIsCartLoading(false);
      }
      // Otherwise, let the stock fetching effect handle it
    }
  }, [isAuthenticated, user?.userId]);

  // Fetch inventory for cart items that don't have stockQuantity (for sessionStorage cart)
  const hasFetchedStockRef = useRef<Set<number>>(new Set());
  
  // Helper function to get available stock (takes into account pending QR orders)
  const getAvailableStock = async (productId: number): Promise<number | undefined> => {
    try {
      const { inventoryService } = await import('../services/inventory.service');
      return await inventoryService.getAvailableStock(productId);
    } catch (error) {
      console.error(`Error fetching available stock for product ${productId}:`, error);
      // Fallback to regular inventory
      try {
        const inventory = await productService.getInventoryByProductId(productId);
        return inventory?.quantity;
      } catch (fallbackError) {
        console.error(`Error fetching inventory for product ${productId}:`, fallbackError);
        return undefined;
      }
    }
  };
  
  useEffect(() => {
    if (isAuthenticated) {
      // For authenticated users, cart loading is handled by loadCartFromDB/mergeCartOnLogin
      // Don't set loading to false here - let loadCartFromDB/mergeCartOnLogin handle it
      // This prevents showing empty cart before DB cart is loaded
      return;
    }
    
    // For guest users, fetch stock for sessionStorage cart
    if (cart.items.length === 0) {
      setIsCartLoading(false);
      return;
    }
    
    const itemsNeedingStock = cart.items.filter(
      item => item.stockQuantity === undefined && !hasFetchedStockRef.current.has(item.product.productId)
    );
    
    if (itemsNeedingStock.length === 0) {
      setIsCartLoading(false);
      return;
    }

    // Fetch inventory for items that don't have stockQuantity
    const fetchStockForItems = async () => {
      setIsCartLoading(true);
      const itemsWithStock = await Promise.all(
        cart.items.map(async (item) => {
          if (item.stockQuantity !== undefined || hasFetchedStockRef.current.has(item.product.productId)) {
            return item;
          }
          hasFetchedStockRef.current.add(item.product.productId);
          const availableStock = await getAvailableStock(item.product.productId);
          return {
            ...item,
            stockQuantity: availableStock,
          };
        })
      );

      setCart((prevCart) => ({
        ...prevCart,
        items: itemsWithStock,
      }));
      setIsCartLoading(false);
    };

    fetchStockForItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.items.map(item => item.product.productId).join(','), isAuthenticated]); // Run when product IDs change

  const loadCartFromDB = async (userId: number) => {
    try {
      setIsCartLoading(true);
      isSyncingRef.current = true; // Prevent sync when loading from DB
      const cartResponse = await cartService.getOrCreateCart(userId);
      
      // Fetch available stock for each product
      const itemsWithStock = await Promise.all(
        (cartResponse.items || []).map(async (item) => {
          const availableStock = await getAvailableStock(item.product.productId);
          hasFetchedStockRef.current.add(item.product.productId);
          return {
            ...item,
            stockQuantity: availableStock,
          };
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
      setIsCartLoading(false);
    } catch (error) {
      console.error('Error loading cart from DB:', error);
      isSyncingRef.current = false;
      setIsCartLoading(false);
    }
  };

  const mergeCartOnLogin = async (userId: number) => {
    try {
      setIsCartLoading(true);
      isSyncingRef.current = true; // Prevent sync during merge
      
      // Get session cart items
      const savedCart = sessionStorage.getItem(CART_STORAGE_KEY);
      if (!savedCart) {
        // No session cart, just load from DB
        await loadCartFromDB(userId);
        hasLoadedCartRef.current = userId;
        return;
      }

      const sessionCart: Cart = JSON.parse(savedCart);
      if (sessionCart.items.length === 0) {
        // Empty session cart, just load from DB
        await loadCartFromDB(userId);
        hasLoadedCartRef.current = userId;
        return;
      }

      // Convert session cart items to CartItemRequest format
      const sessionCartItems = sessionCart.items.map(item => ({
        productId: item.product.productId,
        quantity: item.quantity,
      }));

      // Merge with DB cart
      const mergedCart = await cartService.mergeCart(userId, sessionCartItems);
      
      // Fetch available stock for each product
      const itemsWithStock = await Promise.all(
        (mergedCart.items || []).map(async (item) => {
          const availableStock = await getAvailableStock(item.product.productId);
          hasFetchedStockRef.current.add(item.product.productId);
          return {
            ...item,
            stockQuantity: availableStock,
          };
        })
      );
      
      // Convert merged cart to Cart format
      const mergedCartFormatted: Cart = {
        items: itemsWithStock,
        total: itemsWithStock.reduce((sum, item) => sum + (item.product?.unitPrice || 0) * item.quantity, 0),
        totalItems: itemsWithStock.reduce((sum, item) => sum + item.quantity, 0),
      };
      
      // Update lastCartRef to prevent sync trigger
      const cartString = JSON.stringify(mergedCartFormatted.items.map(item => ({
        productId: item.product.productId,
        quantity: item.quantity,
      })));
      lastCartRef.current = cartString;
      
      setCart(mergedCartFormatted);
      // Clear sessionStorage after merge
      sessionStorage.removeItem(CART_STORAGE_KEY);
      hasLoadedCartRef.current = userId;
      isSyncingRef.current = false;
      setIsCartLoading(false);
    } catch (error) {
      console.error('Error merging cart on login:', error);
      // Fallback: just load from DB
      await loadCartFromDB(userId);
      hasLoadedCartRef.current = userId;
      isSyncingRef.current = false;
      setIsCartLoading(false);
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
    // Fetch available stock for the product
    const stockQuantity = await getAvailableStock(product.productId);

    // Không cho phép thêm vào cart nếu hết hàng
    if (stockQuantity !== undefined && stockQuantity === 0) {
      console.warn(`Cannot add product ${product.productId} to cart: out of stock`);
      return;
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
    if (!isAuthenticated || !user) {
      console.log('[CartContext] Skipping sync: user not authenticated');
      return;
    }
    
    try {
      // Convert current cart items to CartItemRequest format
      const cartItems = cart.items.map(item => ({
        productId: item.product.productId,
        quantity: item.quantity,
      }));
      
      console.log(`[CartContext] Syncing cart to DB for user ${user.userId} with ${cartItems.length} items:`, cartItems);
      
      // Use sync to replace all items (not merge, to handle deletions)
      const response = await cartService.syncCart(user.userId, cartItems);
      console.log(`[CartContext] Cart sync successful. Response:`, response);
    } catch (error) {
      console.error('[CartContext] Error syncing entire cart to DB:', error);
    }
  };

  // Sync cart to DB when cart changes and user is authenticated
  // Use a ref to prevent infinite loops
  const isSyncingRef = useRef(false);
  const lastCartRef = useRef<string>('');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log('[CartContext] Skipping sync: user not authenticated');
      return;
    }
    
    if (isSyncingRef.current) {
      console.log('[CartContext] Skipping sync: already syncing');
      return;
    }
    
    // Create a string representation of cart items to detect changes
    const cartString = JSON.stringify(cart.items.map(item => ({
      productId: item.product.productId,
      quantity: item.quantity,
    })));
    
    // Only sync if cart actually changed
    if (cartString !== lastCartRef.current) {
      console.log('[CartContext] Cart changed, triggering sync. Old:', lastCartRef.current, 'New:', cartString);
      lastCartRef.current = cartString;
      isSyncingRef.current = true;
      
      syncEntireCartToDB().finally(() => {
        isSyncingRef.current = false;
        console.log('[CartContext] Sync completed');
      });
    } else {
      console.log('[CartContext] Cart unchanged, skipping sync');
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
      
      // Nếu hết hàng, không cho phép update quantity
      if (item && item.stockQuantity !== undefined && item.stockQuantity === 0) {
        console.warn(`Cannot update quantity for product ${productId}: out of stock`);
        return prevCart;
      }
      
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
    setAppliedCouponId(null);
    setDiscount(0);
  };

  const getCartTotal = () => {
    // Tính lại từ items để đảm bảo chính xác
    return calculateTotal(cart.items);
  };

  const getCartCount = () => {
    // Return number of unique products (items.length) instead of total quantity
    return cart.items.length;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        mergeCartOnLogin,
        appliedCouponId,
        discount,
        setAppliedCouponId,
        setDiscount,
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
