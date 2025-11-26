import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Cart, CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { cartService } from '../services/cart.service';

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity: number) => void;
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

  const loadCartFromDB = async (userId: number) => {
    try {
      isSyncingRef.current = true; // Prevent sync when loading from DB
      const cartResponse = await cartService.getOrCreateCart(userId);
      // Convert CartResponse to Cart format
      const dbCart: Cart = {
        items: cartResponse.items || [],
        total: (cartResponse.items || []).reduce((sum, item) => sum + (item.product?.unitPrice || 0) * item.quantity, 0),
        totalItems: (cartResponse.items || []).reduce((sum, item) => sum + item.quantity, 0),
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
      
      // Convert merged cart to Cart format
      const mergedCartFormatted: Cart = {
        items: mergedCart.items || [],
        total: (mergedCart.items || []).reduce((sum, item) => sum + (item.product?.unitPrice || 0) * item.quantity, 0),
        totalItems: (mergedCart.items || []).reduce((sum, item) => sum + item.quantity, 0),
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

  const addToCart = (product: Product, quantity: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.items.find(
        (item) => item.product.productId === product.productId
      );

      let newItems: CartItem[];
      if (existingItem) {
        newItems = prevCart.items.map((item) =>
          item.product.productId === product.productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [...prevCart.items, { product, quantity }];
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
