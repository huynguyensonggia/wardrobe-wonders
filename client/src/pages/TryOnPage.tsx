import { useState, useRef, useCallback, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { productsApi, tryOnApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

import {
  Upload,
  Sparkles,
  ImageIcon,
  ArrowRight,
  RefreshCw,
  Download,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const n = String(catName || "").toLowerCase().trim();
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

async function urlToFile(url: string, fileName = "result.png"): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Cannot fetch result image to mix");
  const blob = await res.blob();
  return new File([blob], fileName, { type: blob.type || "image/png" });
}

export default function TryOnPage() {
  const [searchParams] = useSearchParams();
  const preselectedProduct = searchParams.get("product"); // /try-on?product=3

  // base product (khóa, không cho chọn nữa)
  const [selectedProduct] = useState(preselectedProduct || "");

  const [userImage, setUserImage] = useState<string | null>(null);
  const [userFile, setUserFile] = useState<File | null>(null);

  // output
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [baseResultImage, setBaseResultImage] = useState<string | null>(null);

  // mix state
  const [mixProductId, setMixProductId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
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
    if (resultImage) return "Result";
    if (garmentUrl) return "Selected Product";
    return "Preview";
  }, [resultImage, garmentUrl]);

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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be less than 10MB");
        return;
      }

      setError(null);
      setUserFile(file);
      clearOutputs();
      setBaseResultImage(null);

      const reader = new FileReader();
      reader.onload = (event) => setUserImage(event.target?.result as string);
      reader.readAsDataURL(file);
    },
    []
  );

  // ✅ ONE STEP: base try-on hoặc mix try-on
  const handleRunTryOn = async () => {
    if (!selectedProduct) return;

    const isFirstRun = !resultImage;
    if (isFirstRun && !userFile) return;

    const isMixRun = !!resultImage;
    if (isMixRun && !mixProductId) {
      setError("Please select an item to mix");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let personToSend: File;

      if (isFirstRun) {
        personToSend = userFile!;
      } else {
        personToSend = await urlToFile(resultImage!, "person_from_result.png");
      }

      const productIdToUse = isFirstRun ? selectedProduct : mixProductId;

      // ✅ FIX: runTryOn chỉ nhận 1 argument => truyền object
      const resp = await tryOnApi.runTryOn({
        person: personToSend,
        productId: String(productIdToUse),
      });

      const url = (resp as any)?.resultUrl ?? (resp as any)?.outputs?.[0] ?? null;
      if (!url) throw new Error("No resultUrl returned from server");

      if (isFirstRun) setBaseResultImage(url);
      setResultImage(url);
    } catch (err: any) {
      setError(err?.message || "Failed to generate try-on image. Please try again.");
    } finally {
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

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-gold" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            AI Virtual Try-On
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Upload your photo and generate the final try-on in one step.
          </p>
        </div>

        {/* Instructions */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: 1, title: "Upload Photo", desc: "Full-body photo with good lighting" },
              { step: 2, title: "Generate Try-On", desc: "AI will process and generate result" },
              { step: 3, title: "Save & Rent", desc: "Save result and rent the piece you love" },
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
                    userImage ? "border-accent" : "border-border hover:border-accent/50",
                    !userImage && "cursor-pointer"
                  )}
                  onClick={() => !userImage && fileInputRef.current?.click()}
                >
                  {userImage ? (
                    <>
                      <img src={userImage} alt="Your photo" className="w-full h-full object-cover" />
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
                        Change
                      </Button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="font-medium mb-1">Upload your photo</p>
                      <p className="text-sm text-muted-foreground">
                        Full-body photo, front-facing, arms visible
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
                <h4 className="font-medium text-sm mb-2">Tips for best results:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Stand in a well-lit area</li>
                  <li>• Wear form-fitting clothing</li>
                  <li>• Face the camera directly</li>
                  <li>• Ensure full body is visible</li>
                </ul>
              </div>
            </div>

            {/* Result Section */}
            <div className="space-y-6">
              {/* Preview */}
              <div className="relative aspect-[3/4] rounded-lg bg-secondary overflow-hidden">
                {isProcessing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                      <Sparkles className="w-6 h-6 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="mt-4 font-medium">Generating try-on...</p>
                    <p className="text-sm text-muted-foreground">This may take a few seconds</p>
                  </div>
                ) : previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt={previewLabel}
                      className={cn("w-full h-full bg-secondary", "object-cover object-bottom")}
                    />
                    <div className="absolute top-3 left-3 rounded-md bg-background/80 backdrop-blur px-3 py-2">
                      <div className="text-xs text-muted-foreground">{previewLabel}</div>
                      <div className="text-sm font-medium truncate max-w-[220px]">
                        {(product as any)?.name ?? `Product #${selectedProduct}`}
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
                          Save
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {isLoadingProduct
                        ? "Loading product..."
                        : isProductError
                        ? "Failed to load product"
                        : "No product image"}
                    </p>
                    {!selectedProduct && (
                      <Button variant="secondary" size="sm" asChild className="mt-4">
                        <Link to="/products">Browse products</Link>
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
                      <div className="font-medium">Mix & Match</div>
                      <div className="text-sm text-muted-foreground">
                        {targetVton
                          ? targetVton === "upper-body"
                            ? "You tried on a lower-body item. Pick a Top/Outerwear to mix."
                            : "You tried on an upper-body item. Pick a Pant to mix."
                          : "Mix is unavailable for this category (e.g. Dresses)."}
                      </div>
                    </div>

                    {!!baseResultImage && baseResultImage !== resultImage && (
                      <Button variant="outline" size="sm" onClick={restoreBaseResult}>
                        Restore base
                      </Button>
                    )}
                  </div>

                  {targetVton ? (
                    <>
                      {mixCandidates.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          Chưa thấy sản phẩm phù hợp để mix.
                          <div className="text-xs mt-1">
                            Gợi ý: kiểm tra API <code>/products</code> có trả{" "}
                            <code>category.vtonCategory</code> hoặc category.name đúng (Tops/Pants/Outerwear).
                          </div>
                        </div>
                      ) : (
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
                                  active ? "border-primary ring-2 ring-primary/20" : "border-border"
                                )}
                              >
                                <div className="aspect-square bg-muted overflow-hidden">
                                  <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-2">
                                  <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                                  <div className="text-xs text-muted-foreground line-clamp-1">
                                    {p.catName || (p.vton ? p.vton : "Category")}
                                  </div>
                                  {active && (
                                    <div className="mt-1 text-xs font-medium text-primary">Selected</div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Chọn 1 item ở trên rồi bấm <b>Mix & Generate Again</b>.
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Currently, we only recommend mixing <b>Upper-body ↔ Lower-body</b>.
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
                  {isProcessing ? "Processing..." : !resultImage ? "Generate Try-On" : "Mix & Generate Again"}
                </Button>
              </div>

              {/* Rent CTA */}
              {resultImage && selectedProduct && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">Love how it looks?</p>
                  <Button variant="gold" asChild>
                    <Link to={`/products/${selectedProduct}`}>
                      Rent This Piece
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
