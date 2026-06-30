"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItemType {
  id: string; // cart item database ID or local ID
  menu_item_id: string; // ID of the menu item
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  image_url: string;
  special_note: string | null;
}

interface CartContextProps {
  cartItems: CartItemType[];
  cartCount: number;
  cartOpen: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  user: any;
  setCartOpen: (open: boolean) => void;
  addToCart: (menuItem: any, quantity?: number, specialNote?: string) => Promise<void>;
  updateQty: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshAuth: () => Promise<any>;
  syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Map API cart item response into unified CartItemType structure
  const mapApiCartItem = (item: any): CartItemType => {
    const menu = item.menu_items || {};
    return {
      id: item.id,
      menu_item_id: menu.id || item.menu_item_id || "",
      name: menu.name || item.name || "Unknown Item",
      price: Number(menu.price || item.price || 0),
      quantity: Number(item.quantity || 1),
      isVeg: menu.is_veg !== undefined ? menu.is_veg : (item.isVeg || false),
      image_url: menu.image_url || menu.image || item.image_url || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=400",
      special_note: item.special_note || null,
    };
  };

  const refreshAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        setUser(data.user);
        return data.user;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        return null;
      }
    } catch (e) {
      setIsAuthenticated(false);
      setUser(null);
      return null;
    }
  };

  const syncCart = async () => {
    setLoading(true);
    const authed = await refreshAuth();
    
    if (authed) {
      try {
        // Sync local storage items to database if any exist
        const local = localStorage.getItem("rasoi_cart");
        if (local) {
          const localItems = JSON.parse(local) as CartItemType[];
          if (localItems.length > 0) {
            for (const item of localItems) {
              await fetch("/api/cart/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  menu_item_id: item.menu_item_id,
                  quantity: item.quantity,
                  special_note: item.special_note,
                }),
              });
            }
          }
          localStorage.removeItem("rasoi_cart");
        }

        // Fetch synced cart from DB
        const res = await fetch("/api/cart");
        const json = await res.json();
        if (res.ok && json.success) {
          const apiItems = (json.data.items || []).map(mapApiCartItem);
          setCartItems(apiItems);
        }
      } catch (e) {
        console.error("Failed to sync cart with db", e);
      }
    } else {
      // Load from localStorage
      const local = localStorage.getItem("rasoi_cart");
      if (local) {
        try {
          setCartItems(JSON.parse(local));
        } catch (e) {
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    syncCart();
  }, [isAuthenticated]);

  const addToCart = async (menuItem: any, quantity = 1, specialNote = "") => {
    if (isAuthenticated) {
      try {
        const res = await fetch("/api/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            menu_item_id: menuItem.id,
            quantity,
            special_note: specialNote || null,
          }),
        });
        if (res.ok) {
          // Refetch synced DB items
          const fetchRes = await fetch("/api/cart");
          const json = await fetchRes.json();
          if (fetchRes.ok && json.success) {
            setCartItems((json.data.items || []).map(mapApiCartItem));
          }
        }
      } catch (e) {
        console.error("Failed to add item to DB cart", e);
      }
    } else {
      // Local cart addition
      const existingIdx = cartItems.findIndex((i) => i.menu_item_id === menuItem.id);
      let updated = [...cartItems];
      if (existingIdx >= 0) {
        updated[existingIdx].quantity += quantity;
        if (specialNote) updated[existingIdx].special_note = specialNote;
      } else {
        const localItemId = "local_" + Math.random().toString(36).substr(2, 9);
        updated.push({
          id: localItemId,
          menu_item_id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity,
          isVeg: menuItem.isVeg !== undefined ? menuItem.isVeg : (menuItem.is_veg || false),
          image_url: menuItem.image || menuItem.image_url || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=400",
          special_note: specialNote || null,
        });
      }
      setCartItems(updated);
      localStorage.setItem("rasoi_cart", JSON.stringify(updated));
    }
    setCartOpen(true); // Open drawer as positive visual confirmation
  };

  const updateQty = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(cartItemId);
      return;
    }

    if (isAuthenticated) {
      try {
        const res = await fetch(`/api/cart/items/${cartItemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });
        if (res.ok) {
          const fetchRes = await fetch("/api/cart");
          const json = await fetchRes.json();
          if (fetchRes.ok && json.success) {
            setCartItems((json.data.items || []).map(mapApiCartItem));
          }
        }
      } catch (e) {
        console.error("Failed to update cart quantity", e);
      }
    } else {
      const updated = cartItems.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      );
      setCartItems(updated);
      localStorage.setItem("rasoi_cart", JSON.stringify(updated));
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (isAuthenticated) {
      try {
        const res = await fetch(`/api/cart/items/${cartItemId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          const fetchRes = await fetch("/api/cart");
          const json = await fetchRes.json();
          if (fetchRes.ok && json.success) {
            setCartItems((json.data.items || []).map(mapApiCartItem));
          }
        }
      } catch (e) {
        console.error("Failed to delete cart item", e);
      }
    } else {
      const updated = cartItems.filter((item) => item.id !== cartItemId);
      setCartItems(updated);
      localStorage.setItem("rasoi_cart", JSON.stringify(updated));
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        const res = await fetch("/api/cart", {
          method: "DELETE",
        });
        if (res.ok) {
          setCartItems([]);
        }
      } catch (e) {
        console.error("Failed to clear DB cart", e);
      }
    } else {
      setCartItems([]);
      localStorage.removeItem("rasoi_cart");
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartOpen,
        loading,
        isAuthenticated,
        user,
        setCartOpen,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        refreshAuth,
        syncCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
