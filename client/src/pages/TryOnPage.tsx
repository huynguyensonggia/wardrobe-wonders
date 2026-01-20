import { useState, useRef, useCallback, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { productsApi } from "@/lib/api";
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

export default function TryOnPage() {
  const [searchParams] = useSearchParams();
  const preselectedProduct = searchParams.get("product"); // /try-on?product=3

  const [selectedProduct] = useState(preselectedProduct || ""); // không cho chọn nữa

  const [userImage, setUserImage] = useState<string | null>(null); // preview base64
  const [userFile, setUserFile] = useState<File | null>(null); // file gửi BE

  // ✅ Step1 outputs (new)
  const [jobId, setJobId] = useState<string | null>(null);
  const [maskPreviewUrl, setMaskPreviewUrl] = useState<string | null>(null);

  // Step 2 output
  const [resultImage, setResultImage] = useState<string | null>(null);

  const [isMasking, setIsMasking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch product detail để lấy ảnh garment
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
    const imgs = (product as any)?.images ?? [];
    return imgs?.[0]?.url ?? null;
  }, [product]);

  // Preview khung bên phải:
  // ưu tiên: result -> maskPreview -> garment
  const previewUrl = useMemo(() => {
    if (resultImage) return resultImage;
    if (maskPreviewUrl) return maskPreviewUrl;
    return garmentUrl;
  }, [resultImage, maskPreviewUrl, garmentUrl]);

  const previewLabel = useMemo(() => {
    if (resultImage) return "Result";
    if (maskPreviewUrl) return "Mask Preview (Step 1)";
    if (garmentUrl) return "Selected Product";
    return "Preview";
  }, [resultImage, maskPreviewUrl, garmentUrl]);

  const clearOutputs = () => {
    setJobId(null);
    setMaskPreviewUrl(null);
    setResultImage(null);
  };

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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

    const reader = new FileReader();
    reader.onload = (event) => {
      setUserImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // ✅ STEP 1: Run Mask (new response shape)
  const handleRunMask = async () => {
    if (!userFile || !selectedProduct) return;

    setIsMasking(true);
    setError(null);
    clearOutputs();

    try {
      const fd = new FormData();
      fd.append("productId", selectedProduct);
      fd.append("person", userFile);

      const res = await fetch("http://localhost:3000/api/tryon/fitdit/mask", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to run mask. Please try again.");
      }

      const data = await res.json();

      const id = data?.jobId ?? null;
      const mUrl = data?.preview?.maskUrl ?? null;

      if (!id || !mUrl) {
        console.log("mask response =", data);
        throw new Error("Mask preview/jobId not returned from server");
      }

      setJobId(id);
      setMaskPreviewUrl(mUrl);
    } catch (err: any) {
      setError(err?.message || "Failed to run mask. Please try again.");
    } finally {
      setIsMasking(false);
    }
  };

  // ✅ STEP 2: Run Try-On (send jobId)
  const handleRunTryOn = async () => {
    if (!userFile || !selectedProduct || !jobId) return;

    setIsProcessing(true);
    setError(null);
    setResultImage(null);

    try {
      const fd = new FormData();
      fd.append("productId", selectedProduct);
      fd.append("person", userFile);
      fd.append("jobId", jobId);

      const res = await fetch("http://localhost:3000/api/tryon/fitdit/process", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to generate try-on image. Please try again.");
      }

      const data = await res.json();
      const url = data?.resultUrl ?? data?.outputs?.[0] ?? null;

      if (!url) {
        console.log("process response =", data);
        throw new Error("No resultUrl returned from server");
      }

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
    clearOutputs();
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canRunMask = !!userFile && !!selectedProduct && !isMasking && !isProcessing;
  const canRunTryOn = !!userFile && !!selectedProduct && !!jobId && !isMasking && !isProcessing;

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
            Step 1 generates a mask preview. Step 2 generates your final try-on.
          </p>
        </div>

        {/* Instructions */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: 1, title: "Upload Photo", desc: "Full-body photo with good lighting" },
              { step: 2, title: "Step 1: Run Mask", desc: "Preview the mask to ensure it looks correct" },
              { step: 3, title: "Step 2: Try-On", desc: "Generate the final try-on result" },
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
                    !userImage && "cursor-pointer",
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
              <div className="aspect-[3/4] rounded-lg bg-secondary overflow-hidden relative">
                {(isMasking || isProcessing) ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                      <Sparkles className="w-6 h-6 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="mt-4 font-medium">
                      {isMasking ? "Running mask..." : "Generating try-on..."}
                    </p>
                    <p className="text-sm text-muted-foreground">This may take a few seconds</p>
                  </div>
                ) : previewUrl ? (
                  <>
                    <img src={previewUrl} alt={previewLabel} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 rounded-md bg-background/80 backdrop-blur px-3 py-2">
                      <div className="text-xs text-muted-foreground">{previewLabel}</div>
                      <div className="text-sm font-medium truncate max-w-[220px]">
                        {(product as any)?.name ?? `Product #${selectedProduct}`}
                      </div>
                    </div>

                    {/* Save button chỉ khi có result */}
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

              {/* Step Buttons */}
              <div className="space-y-3">
                <Button
                  variant="hero-outline"
                  size="xl"
                  className="w-full"
                  onClick={handleRunMask}
                  disabled={!canRunMask}
                >
                  {isMasking ? "Running Mask..." : "Step 1: Run Mask"}
                </Button>

                <Button
                  variant="hero"
                  size="xl"
                  className="w-full"
                  onClick={handleRunTryOn}
                  disabled={!canRunTryOn}
                >
                  {isProcessing ? "Processing..." : "Step 2: Generate Try-On"}
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
