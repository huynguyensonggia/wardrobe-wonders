// CartContext.tsx
import { createContext, useContext, useMemo, useState, useEffect } from "react";

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

const CART_KEY = "ww_cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  // Sync to localStorage on every change
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const count = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0),
    [items]
  );

  // ✅ Key theo product + variant + dateRange
  const makeKey = (productId: number, variantId: number, startDate: string, endDate: string) =>
    `${productId}_${variantId}_${startDate}_${endDate}`;

  const addItem: CartContextValue["addItem"] = (item, qty = 1) => {
    setItems((prev) => {
      const key = makeKey(item.productId, item.variantId, item.startDate, item.endDate);
      const idx = prev.findIndex(
        (x) => makeKey(x.productId, x.variantId, x.startDate, x.endDate) === key
      );

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
        return copy;
      }

      return [...prev, { ...item, quantity: qty }];
    });
  };

  const updateQty: CartContextValue["updateQty"] = (productId, variantId, startDate, endDate, qty) => {
    setItems((prev) => {
      const key = makeKey(productId, variantId, startDate, endDate);
      return prev
        .map((x) =>
          makeKey(x.productId, x.variantId, x.startDate, x.endDate) === key
            ? { ...x, quantity: qty }
            : x
        )
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
