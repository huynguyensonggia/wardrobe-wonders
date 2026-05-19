import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { productWatchApi } from "@/lib/api";
import { mapBEProductToMock } from "@/lib/mappers";
import { ProductCard } from "@/components/products/ProductCard";
import { useFavorites } from "@/contexts/FavoritesContext";

export default function Favorites() {
  const { t } = useTranslation();
  const { refresh: refreshFavorites } = useFavorites();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const raw = await productWatchApi.list();
      setProducts((raw ?? []).map(mapBEProductToMock));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (productId: number) => {
    try {
      await productWatchApi.unwatch(productId);
      setProducts((prev) => prev.filter((p) => Number(p.id) !== productId));
      refreshFavorites();
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <Heart className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">{t("favorites.empty")}</p>
        <Button asChild variant="outline">
          <Link to="/products">
            <ShoppingBag className="w-4 h-4 mr-2" />
            {t("favorites.browse")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-6">
        {t("favorites.title")} ({products.length})
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="relative group">
            <ProductCard product={product} />
            <button
              onClick={() => handleRemove(Number(product.id))}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={t("favorites.remove")}
            >
              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
