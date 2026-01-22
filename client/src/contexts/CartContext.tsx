import { createContext, useContext, useMemo, useState } from "react";

export type CartItem = {
  productId: number;
  name: string;
  imageUrl?: string;
  rentPricePerDay: number;
  quantity: number;

  // ✅ LƯU NGÀY THUÊ THEO ITEM
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
  days: number;      // số ngày thuê
};

type CartContextValue = {
  items: CartItem[];
  count: number;

  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  updateQty: (productId: number, startDate: string, endDate: string, qty: number) => void;
  removeItem: (productId: number, startDate: string, endDate: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // ✅ count = tổng quantity
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  // ✅ Key theo product + dateRange (để cùng product nhưng khác ngày vẫn là 2 dòng)
  const makeKey = (productId: number, startDate: string, endDate: string) =>
    `${productId}_${startDate}_${endDate}`;

  const addItem: CartContextValue["addItem"] = (item, qty = 1) => {
    setItems((prev) => {
      const key = makeKey(item.productId, item.startDate, item.endDate);
      const idx = prev.findIndex((x) => makeKey(x.productId, x.startDate, x.endDate) === key);

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
        return copy;
      }

      return [...prev, { ...item, quantity: qty }];
    });
  };

  const updateQty: CartContextValue["updateQty"] = (productId, startDate, endDate, qty) => {
    setItems((prev) => {
      const key = makeKey(productId, startDate, endDate);
      return prev
        .map((x) =>
          makeKey(x.productId, x.startDate, x.endDate) === key ? { ...x, quantity: qty } : x
        )
        .filter((x) => x.quantity > 0);
    });
  };

  const removeItem: CartContextValue["removeItem"] = (productId, startDate, endDate) => {
    const key = makeKey(productId, startDate, endDate);
    setItems((prev) => prev.filter((x) => makeKey(x.productId, x.startDate, x.endDate) !== key));
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
