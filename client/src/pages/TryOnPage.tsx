import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { productsApi, tryOnApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  Upload,
  Sparkles,
  ImageIcon,
  ArrowRight,
  RefreshCw,
  Download,
  AlertCircle,
  Ruler,
} from "lucide-react";
import { getLocalizedProductName } from "@/utils/i18n";
import { useTranslation } from "react-i18next";

// Fix EXIF orientation: vẽ lại ảnh lên canvas theo đúng hướng
async function fixOrientation(
  file: File
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        canvas.toBlob(
          (blob) => resolve({ dataUrl, blob: blob! }),
          "image/jpeg",
          0.92
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

type MixVton = "upper-body" | "lower-body" | "dresses";

type ProductLite = {
  id: string;
  name: string;
  img: string;
  catName?: string;
  vton?: MixVton | null;
};

function normVton(s: any) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

function inferVtonFromCategoryName(catName: any): MixVton | null {
  const n = String(catName || "")
    .toLowerCase()
    .trim();
  if (n.includes("pant")) return "lower-body";
  if (n.includes("top")) return "upper-body";
  if (n.includes("outerwear")) return "upper-body";
  if (n.includes("dress")) return "dresses";
  return null;
}

function getProductVton(product: any): MixVton | null {
  if (!product) return null;

  const raw =
    product?.category?.vtonCategory ??
    product?.category?.vton_category ??
    product?.category?.vton_category_name ??
    "";

  const v = normVton(raw);
  if (v === "upper-body" || v === "lower-body" || v === "dresses") return v;

  return inferVtonFromCategoryName(product?.category?.name);
}

function pickProductImage(p: any): string {
  const imgs = p?.images ?? [];
  return (
    imgs?.[0]?.url ||
    p?.imageUrl ||
    p?.image_url ||
    "https://placehold.co/600x600?text=No+Image"
  );
}

export default function TryOnPage() {
  const { t } = useTranslation();

  const [searchParams] = useSearchParams();
  const preselectedProduct = searchParams.get("product"); // /try-on?product=3

  // base product (khóa, không cho chọn nữa)
  const [selectedProduct] = useState(preselectedProduct || "");

  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const [userImage, setUserImage] = useState<string | null>(null);
  const [userFile, setUserFile] = useState<File | null>(null);

  // output
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [baseResultImage, setBaseResultImage] = useState<string | null>(null);

  // mix state
  const [mixProductId, setMixProductId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== Product detail (base)
  const {
    data: product,
    isLoading: isLoadingProduct,
    isError: isProductError,
  } = useQuery({
    queryKey: ["product", selectedProduct],
    queryFn: () => productsApi.getById(selectedProduct),
    enabled: !!selectedProduct,
    staleTime: 60_000,
  });

  const garmentUrl = useMemo(() => {
    return product ? pickProductImage(product as any) : null;
  }, [product]);

  // base vton
  const baseVton = useMemo(() => getProductVton(product as any), [product]);

  const targetVton = useMemo<MixVton | null>(() => {
    if (!baseVton) return null;
    if (baseVton === "lower-body") return "upper-body";
    if (baseVton === "upper-body") return "lower-body";
    return null; // dresses => không mix
  }, [baseVton]);

  // ===== Fetch all products for mix
  const API_BASE = (import.meta as any).env?.VITE_API_BASE || "/api";

  const { data: allProductsRaw } = useQuery({
    queryKey: ["products", "mix-list"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/products?page=1&pageSize=200`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
    enabled: !!selectedProduct,
  });

  const allProducts: any[] = useMemo(() => {
    const raw: any = allProductsRaw;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;

    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    if (Array.isArray(raw?.data?.data)) return raw.data.data;
    if (Array.isArray(raw?.data?.items)) return raw.data.items;

    return [];
  }, [allProductsRaw]);

  const mixCandidates: ProductLite[] = useMemo(() => {
    if (!targetVton) return [];

    const list = allProducts
      .filter((p: any) => {
        const pid = String(p?.id ?? "");
        if (pid && pid === String(selectedProduct)) return false;

        const v = getProductVton(p);
        return v === targetVton;
      })
      .map((p: any) => {
        const id = String(p?.id ?? "");
        const name = String(p?.name ?? `Product #${id}`);
        const img = pickProductImage(p);
        const catName = p?.category?.name ? String(p.category.name) : undefined;
        const vton = getProductVton(p);
        return { id, name, img, catName, vton };
      });

    return list;
  }, [allProducts, selectedProduct, targetVton]);

  // Preview bên phải
  const previewUrl = useMemo(() => {
    if (resultImage) return resultImage;
    return garmentUrl;
  }, [resultImage, garmentUrl]);

  const previewLabel = useMemo(() => {
    if (resultImage) return t("tryOn.preview.result");
    if (garmentUrl) return t("tryOn.preview.selectedProduct");
    return t("tryOn.preview.preview");
  }, [resultImage, garmentUrl, t]);

  const clearOutputs = () => {
    setResultImage(null);
    setMixProductId("");
  };

  const restoreBaseResult = () => {
    if (!baseResultImage) return;
    setResultImage(baseResultImage);
    setMixProductId("");
  };

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError(t("tryOn.errors.imageOnly"));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t("tryOn.errors.imageTooLarge"));
        return;
      }

      setError(null);
      clearOutputs();
      setBaseResultImage(null);

      // Fix EXIF orientation trước khi hiển thị và upload
      const { dataUrl, blob } = await fixOrientation(file);
      const fixedFile = new File([blob], file.name, { type: "image/jpeg" });

      setUserFile(fixedFile);
      setUserImage(dataUrl);
    },
    [t]
  );

  // ✅ ONE STEP: base try-on hoặc mix try-on
  const handleRunTryOn = async () => {
    if (!selectedProduct) return;

    const isFirstRun = !resultImage;
    if (isFirstRun && !userFile) return;

    const isMixRun = !!resultImage;
    if (isMixRun && !mixProductId) {
      setError(t("tryOn.errors.selectMixItem"));
      return;
    }

    setIsProcessing(true);
    setError(null);
    setElapsed(0);

    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);

    try {
      const productIdToUse = isFirstRun ? selectedProduct : mixProductId;

      const resp = await tryOnApi.runTryOn({
        productId: String(productIdToUse),
        person: isFirstRun ? userFile! : undefined,
        personUrl: !isFirstRun ? resultImage! : undefined,
      });

      const url =
        (resp as any)?.resultUrl ?? (resp as any)?.outputs?.[0] ?? null;
      if (!url) throw new Error(t("tryOn.errors.noResultUrl"));

      if (isFirstRun) setBaseResultImage(url);
      setResultImage(url);
    } catch (err: any) {
      setError(err?.message || t("tryOn.errors.generateFailed"));
    } finally {
      clearInterval(timer);
      setIsProcessing(false);
    }
  };

  const resetTryOn = () => {
    setUserImage(null);
    setUserFile(null);
    setResultImage(null);
    setBaseResultImage(null);
    setMixProductId("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canRunTryOn =
    !!selectedProduct &&
    !isProcessing &&
    ((!resultImage && !!userFile) || (!!resultImage && !!mixProductId));

  const mixHintText = useMemo(() => {
    if (!targetVton) return t("tryOn.mix.unavailable");
    if (targetVton === "upper-body") return t("tryOn.mix.hintPickUpper");
    return t("tryOn.mix.hintPickLower");
  }, [targetVton, t]);

  return (
    <div className="min-h-screen py-8">
      {/* Disclaimer Dialog */}
      <AlertDialog open={!disclaimerAccepted}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">
              {t("tryOn.disclaimer.title")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-foreground/80">
                {t("tryOn.disclaimer.body")
                  .split("\n")
                  .map((line, i) =>
                    line.trim() === "" ? null : <p key={i}>{line}</p>
                  )}
                <div className="pt-1">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-primary underline underline-offset-2 text-sm font-medium"
                    onClick={() => window.open("/size-chart.png", "_blank")}
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    {t("tryOn.disclaimer.sizeGuideLink")}
                  </button>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="w-full"
              onClick={() => setDisclaimerAccepted(true)}
            >
              {t("tryOn.disclaimer.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-gold" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            {t("tryOn.header.title")}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t("tryOn.header.subtitle")}
          </p>
        </div>

        {/* Instructions */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: 1,
                title: t("tryOn.steps.1.title"),
                desc: t("tryOn.steps.1.desc"),
              },
              {
                step: 2,
                title: t("tryOn.steps.2.title"),
                desc: t("tryOn.steps.2.desc"),
              },
              {
                step: 3,
                title: t("tryOn.steps.3.title"),
                desc: t("tryOn.steps.3.desc"),
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                  {item.step}
                </div>
                <h3 className="font-medium mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="space-y-6">
              <div>
                <div
                  className={cn(
                    "relative aspect-[3/4] rounded-lg border-2 border-dashed transition-colors overflow-hidden",
                    userImage
                      ? "border-accent"
                      : "border-border hover:border-accent/50",
                    !userImage && "cursor-pointer"
                  )}
                  onClick={() => !userImage && fileInputRef.current?.click()}
                >
                  {userImage ? (
                    <>
                      <img
                        src={userImage}
                        alt={t("tryOn.upload.yourPhotoAlt")}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-3 right-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetTryOn();
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        {t("tryOn.upload.change")}
                      </Button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="font-medium mb-1">
                        {t("tryOn.upload.title")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("tryOn.upload.subtitle")}
                      </p>
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
              </div>

              {/* Photo Tips */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">
                  {t("tryOn.tips.title")}
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>{t("tryOn.tips.1")}</li>
                  <li>{t("tryOn.tips.2")}</li>
                  <li>{t("tryOn.tips.3")}</li>
                  <li>{t("tryOn.tips.4")}</li>
                </ul>
              </div>
            </div>

            {/* Result Section */}
            <div className="space-y-6">
              {/* Preview */}
              <div className="relative aspect-[3/4] rounded-lg bg-secondary overflow-hidden">
                {isProcessing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                      <Sparkles className="w-6 h-6 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="mt-4 font-medium">
                      {t("tryOn.processing.title")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {elapsed < 10
                        ? t("tryOn.processing.wakeUp")
                        : t("tryOn.processing.hint")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 tabular-nums">
                      {elapsed}s
                    </p>
                  </div>
                ) : previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt={previewLabel}
                      className={cn(
                        "w-full h-full bg-secondary",
                        "object-cover object-bottom [image-orientation:from-image]"
                      )}
                    />

                    <div className="absolute top-3 left-3 rounded-md bg-background/80 backdrop-blur px-3 py-2">
                      <div className="text-xs text-muted-foreground">
                        {previewLabel}
                      </div>
                      <div className="text-sm font-medium truncate max-w-[220px]">
                        {getLocalizedProductName(
                          product as any,
                          i18n.language,
                          t("tryOn.preview.productFallback", {
                            id: selectedProduct,
                          })
                        )}
                      </div>
                    </div>

                    {resultImage && (
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(resultImage, "_blank")}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          {t("tryOn.actions.save")}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {isLoadingProduct
                        ? t("tryOn.preview.loadingProduct")
                        : isProductError
                          ? t("tryOn.preview.failedProduct")
                          : t("tryOn.preview.noProductImage")}
                    </p>

                    {!selectedProduct && (
                      <Button
                        variant="secondary"
                        size="sm"
                        asChild
                        className="mt-4"
                      >
                        <Link to="/products">
                          {t("tryOn.preview.browseProducts")}
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* ✅ MIX & MATCH (CARDS) */}
              {resultImage && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{t("tryOn.mix.title")}</div>
                      <div className="text-sm text-muted-foreground">
                        {mixHintText}
                      </div>
                    </div>

                    {!!baseResultImage && baseResultImage !== resultImage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={restoreBaseResult}
                      >
                        {t("tryOn.mix.restoreBase")}
                      </Button>
                    )}
                  </div>

                  {targetVton ? (
                    <>
                      {mixCandidates.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          {t("tryOn.mix.noCandidates")}
                          <div className="text-xs mt-1">
                            {t("tryOn.mix.noCandidatesHint")}{" "}
                            <code>/products</code>{" "}
                            {t("tryOn.mix.noCandidatesHint2")}{" "}
                            <code>category.vtonCategory</code>{" "}
                            {t("tryOn.mix.noCandidatesHint3")}
                          </div>
                        </div>
                      ) : (
                        <div className="max-h-[420px] sm:max-h-[520px] overflow-y-auto pr-1">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {mixCandidates.map((p) => {
                              const active = mixProductId === p.id;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => setMixProductId(p.id)}
                                  className={cn(
                                    "text-left rounded-lg border overflow-hidden transition hover:bg-secondary/40",
                                    active
                                      ? "border-primary ring-2 ring-primary/20"
                                      : "border-border"
                                  )}
                                >
                                  <div className="aspect-square bg-muted overflow-hidden">
                                    <img
                                      src={p.img}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>

                                  <div className="p-2">
                                    <div className="text-sm font-medium line-clamp-1">
                                      {p.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                      {p.catName ||
                                        (p.vton
                                          ? p.vton
                                          : t("tryOn.mix.category"))}
                                    </div>
                                    {active && (
                                      <div className="mt-1 text-xs font-medium text-primary">
                                        {t("tryOn.mix.selected")}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        {t("tryOn.mix.footerHint")}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {t("tryOn.mix.onlyUpperLower")}
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full"
                  onClick={handleRunTryOn}
                  disabled={!canRunTryOn}
                >
                  {isProcessing
                    ? t("tryOn.buttons.processing")
                    : !resultImage
                      ? t("tryOn.buttons.generate")
                      : t("tryOn.buttons.mixGenerate")}
                </Button>
              </div>

              {/* Rent CTA */}
              {resultImage && selectedProduct && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("tryOn.rentCta.question")}
                  </p>
                  <Button variant="gold" asChild>
                    <Link to={`/products/${selectedProduct}`}>
                      {t("tryOn.rentCta.button")}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
