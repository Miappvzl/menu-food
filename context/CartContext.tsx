"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type CartItem = {
  id: string; 
  product: any;
  qty: number;
  mods: string[];
  unitPrice: number;
};

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  cartTotal: number;
  cartCount: number;
  rateVES: number;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (val: boolean) => void;
  storeSettings: any;
  setStoreData: (data: any) => void;
  storeModifiers: any[]; // <-- NUEVO
  setStoreModifiers: (mods: any[]) => void; // <-- NUEVO
}

const CartContext = createContext<CartContextType | undefined>(undefined);
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [rateVES, setRateVES] = useState(0);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  
  const [storeModifiers, setStoreModifiers] = useState<any[]>([]); // <-- NUEVO

  // NUEVA FUNCION: La página dinámica llamará a esto
  const setStoreData = (data: any) => {
    setStoreSettings(data);
    setRateVES(data.rate_ves || 0);
  };

  const addToCart = (newItem: Omit<CartItem, "id">) => {
    const modsString = [...newItem.mods].sort().join("-");
    const uniqueId = `${newItem.product.id}-${modsString}`;

    setCart((prev) => {
      const existing = prev.find((i) => i.id === uniqueId);
      if (existing) {
        return prev.map((i) => i.id === uniqueId ? { ...i, qty: i.qty + newItem.qty } : i);
      }
      return [...prev, { ...newItem, id: uniqueId }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const newCart = prev.filter((i) => i.id !== id);
      if (newCart.length === 0) setIsCheckoutOpen(false); 
      return newCart;
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.unitPrice * item.qty, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
   <CartContext.Provider value={{ cart, addToCart, removeFromCart, cartTotal, cartCount, rateVES, isCheckoutOpen, setIsCheckoutOpen, storeSettings, setStoreData, storeModifiers, setStoreModifiers }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de un CartProvider");
  return context;
};