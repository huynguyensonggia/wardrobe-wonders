import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { productsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Upload, Sparkles, ImageIcon, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

/* ===== 4 CATEGORY ===== */
type PickCategory = {
  key: string;
  labelKey: string; // ✅ i18n key
  vton: "upper-body" | "lower-body" | "dresses";
};

const PICK_CATEGORIES: PickCategory[] = [
  { key: "upper", labelKey: "tryOnSuggest.categories.top", vton: "upper-body" },
  { key: "lower", labelKey: "tryOnSuggest.categories.pants", vton: "lower-body" },
  { key: "dress", labelKey: "tryOnSuggest.categories.dress", vton: "dresses" },
  { key: "upper2", labelKey: "tryOnSuggest.categories.outerwear", vton: "upper-body" },
];

/* ===== helpers ===== */
function normVton(s: any) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

function inferVtonFromCategoryName(catName: any) {
  const n = String(catName || "").toLowerCase();
  if (n.includes("pant") || n.includes("skirt")) return "lower-body";
  if (n.includes("top") || n.includes("outerwear")) return "upper-body";
  if (n.includes("dress")) return "dresses";
  return null;
}

function getProductVton(product: any) {
  const raw = product?.category?.vtonCategory ?? product?.category?.vton_category ?? "";
  const v = normVton(raw);
  if (v === "upper-body" || v === "lower-body" || v === "dresses") return v;
  return inferVtonFromCategoryName(product?.category?.name);
}

function pickProductImage(p: any) {
  return (
    p?.images?.[0]?.url ||
    p?.imageUrl ||
    p?.image_url ||
    "https://placehold.co/600x600?text=No+Image"
  );
}

/* ===== pick “đẹp” ===== */
function pickNiceProduct(list: any[]) {
  if (!list.length) return null;
  return list.find((p) => !pickProductImage(p).includes("placehold")) || list[0];
}

export default function TryOnSuggestPage() {
  const { t } = useTranslation();

  const [userImage, setUserImage] = useState<string | null>(null);
  const [userFile, setUserFile] = useState<File | null>(null);

  const [pickedKey, setPickedKey] = useState(PICK_CATEGORIES[0].key);

  const [resultProduct, setResultProduct] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickedCategory = useMemo(
    () => PICK_CATEGORIES.find((c) => c.key === pickedKey)!,
    [pickedKey]
  );

  /* ===== load products ===== */
  const { data: products } = useQuery({
    queryKey: ["products", "tryon-suggest"],
    queryFn: () => productsApi.getAll({}),
    staleTime: 60_000,
  });

  const candidates = useMemo(() => {
    const list = (products as any[]) || [];
    return list.filter((p) => getProductVton(p) === pickedCategory.vton);
  }, [products, pickedCategory.vton]);

  const previewUrl = useMemo(() => {
    if (resultProduct) return pickProductImage(resultProduct);
    return userImage;
  }, [resultProduct, userImage]);

  const previewLabel = resultProduct
    ? t("tryOnSuggest.preview.suggested")
    : t("tryOnSuggest.preview.yourPhoto");

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError(t("tryOnSuggest.errors.imageOnly"));
        return;
      }

      setError(null);
      setUserFile(file);
      setResultProduct(null);

      const reader = new FileReader();
      reader.onload = (ev) => setUserImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    },
    [t]
  );

  const handleGenerate = () => {
    if (!userFile) {
      setError(t("tryOnSuggest.errors.uploadYourPhoto"));
      return;
    }

    const picked = pickNiceProduct(candidates);
    if (!picked) {
      setError(t("tryOnSuggest.errors.noProductForCategory"));
      return;
    }

    setError(null);
    setResultProduct(picked);
  };

  const resetAll = () => {
    setUserImage(null);
    setUserFile(null);
    setResultProduct(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* HEADER */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-gold" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            {t("tryOnSuggest.header.title")}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t("tryOnSuggest.header.subtitle")}
          </p>
          <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
            {t("tryOnSuggest.header.note")}
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* LEFT */}
          <div className="space-y-6">
            <div
              className={cn(
                "relative aspect-[3/4] rounded-lg border-2 border-dashed overflow-hidden",
                userImage ? "border-accent" : "border-border hover:border-accent/50",
                !userImage && "cursor-pointer"
              )}
              onClick={() => !userImage && fileInputRef.current?.click()}
              role={!userImage ? "button" : undefined}
              aria-label={t("tryOnSuggest.upload.aria")}
            >
              {userImage ? (
                <>
                  <img src={userImage} alt={t("tryOnSuggest.upload.yourPhotoAlt")} className="w-full h-full object-cover" />

                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-3 right-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetAll();
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {t("tryOnSuggest.upload.change")}
                  </Button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="font-medium mb-1">{t("tryOnSuggest.upload.title")}</p>
                  <p className="text-sm text-muted-foreground">{t("tryOnSuggest.upload.hint")}</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* CATEGORY */}
            <div className="grid grid-cols-2 gap-3">
              {PICK_CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setPickedKey(c.key)}
                  className={cn(
                    "border rounded-lg p-3 text-sm",
                    pickedKey === c.key ? "border-primary bg-primary/10" : "border-border"
                  )}
                  type="button"
                >
                  {t(c.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <div className="relative aspect-[3/4] rounded-lg bg-secondary overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt={previewLabel} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">{t("tryOnSuggest.preview.empty")}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <Button variant="hero" size="xl" className="w-full" onClick={handleGenerate}>
              {t("tryOnSuggest.buttons.generate")}
            </Button>

            {resultProduct && (
              <div className="text-center">
                <Button variant="gold" asChild>
                  <Link to={`/products/${resultProduct.id}`}>
                    {t("tryOnSuggest.buttons.rentThisPiece")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
