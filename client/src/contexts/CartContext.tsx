import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Cart, CartItem, Product } from '../types';

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'perfume_shop_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Cart>(() => {
    // Initialize from localStorage
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch {
        return { items: [], total: 0, totalItems: 0 };
      }
    }
    return { items: [], total: 0, totalItems: 0 };
  });

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

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
    return cart.totalItems;
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
