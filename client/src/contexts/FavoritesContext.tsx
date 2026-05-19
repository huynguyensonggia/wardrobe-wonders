import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { productWatchApi } from "@/lib/api";

type FavoritesContextValue = {
  count: number;
  refresh: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue>({ count: 0, refresh: () => {} });

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || user?.role === "ADMIN") { setCount(0); return; }
    try {
      const list = await productWatchApi.list();
      setCount(list?.length ?? 0);
    } catch {
      setCount(0);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <FavoritesContext.Provider value={{ count, refresh }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
