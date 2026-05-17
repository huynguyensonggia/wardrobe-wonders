// CartContext.tsx
import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type CartItem = {
  productId: number;
  variantId: number;
  size?: string;
  name: string;
  nameEn?: string | null;
  nameJa?: string | null;
  imageUrl?: string;
  rentPricePerDay: number;
  deposit: number;
  stock: number;        // tồn kho thực tế của variant
  quantity: number;
  startDate: string;
  endDate: string;
  days: number;
  categorySlug?: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;

  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;

  // ✅ update theo product + variant + dateRange
  updateQty: (
    productId: number,
    variantId: number,
    startDate: string,
    endDate: string,
    qty: number
  ) => void;

  removeItem: (
    productId: number,
    variantId: number,
    startDate: string,
    endDate: string
  ) => void;

  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function getCartKey(userId?: string) {
  return `ww_cart_${userId ?? "guest"}`;
}

function loadCartForUser(userId?: string): CartItem[] {
  try {
    const raw = localStorage.getItem(getCartKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [items, setItems] = useState<CartItem[]>(() => loadCartForUser(userId));

  // Reload cart when user changes (login / logout / account switch)
  useEffect(() => {
    setItems(loadCartForUser(userId));
  }, [userId]);

  // Sync to localStorage on every change
  useEffect(() => {
    localStorage.setItem(getCartKey(userId), JSON.stringify(items));
  }, [items, userId]);

  const count = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0),
    [items]
  );

  // ✅ Key theo product + variant + dateRange
  const makeKey = (productId: number, variantId: number, startDate: string, endDate: string) =>
    `${productId}_${variantId}_${startDate}_${endDate}`;

  const doOverlap = (s1: string, e1: string, s2: string, e2: string) =>
    s1 <= e2 && s2 <= e1;

  const addItem: CartContextValue["addItem"] = (item, qty = 1) => {
    setItems((prev) => {
      const key = makeKey(item.productId, item.variantId, item.startDate, item.endDate);
      const idx = prev.findIndex(
        (x) => makeKey(x.productId, x.variantId, x.startDate, x.endDate) === key
      );

      // Tính tổng số lượng các entry cùng variant có ngày trùng nhau
      const overlappingQty = prev
        .filter((x) => x.variantId === item.variantId && doOverlap(x.startDate, x.endDate, item.startDate, item.endDate))
        .reduce((s, x) => s + x.quantity, 0);

      if (idx >= 0) {
        const current = prev[idx];
        if (overlappingQty + qty > item.stock) return prev;
        const copy = [...prev];
        copy[idx] = { ...current, quantity: current.quantity + qty };
        return copy;
      }

      if (overlappingQty + qty > item.stock) return prev;
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const updateQty: CartContextValue["updateQty"] = (productId, variantId, startDate, endDate, qty) => {
    setItems((prev) => {
      const key = makeKey(productId, variantId, startDate, endDate);
      return prev
        .map((x) => {
          if (makeKey(x.productId, x.variantId, x.startDate, x.endDate) !== key) return x;
          // Cap tại stock
          const safeQty = Math.min(qty, x.stock);
          return { ...x, quantity: safeQty };
        })
        .filter((x) => x.quantity > 0);
    });
  };

  const removeItem: CartContextValue["removeItem"] = (productId, variantId, startDate, endDate) => {
    const key = makeKey(productId, variantId, startDate, endDate);
    setItems((prev) =>
      prev.filter((x) => makeKey(x.productId, x.variantId, x.startDate, x.endDate) !== key)
    );
  };

  const clear = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, count, addItem, updateQty, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
