import { useEffect, useMemo, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsApi, categoriesApi, fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import type { Product, Category } from "@/types";
import { ProductCard } from "@/components/products/ProductCard";
import { Pencil, Trash2, Upload } from "lucide-react";

import { useTranslation } from "react-i18next";

/* ===== ENUM MIRROR FROM BE ===== */
type ProductOccasion = "party" | "wedding" | "casual";

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

type VariantForm = {
  id: string;
  size: (typeof SIZES)[number];
  stock: string;
  conditionNote: string;
};
/* ================================= */

type Mode = "create" | "edit";

/** Generate stable id for UI rows */
const makeRowId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as any).randomUUID() as string;
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function AdminProducts() {
  const { toast } = useToast();
  const { t } = useTranslation();

  // occasions with translation
  const OCCASIONS: { value: ProductOccasion; label: string }[] = useMemo(
    () => [
      { value: "party", label: t("adminProducts.occasions.party") },
      { value: "wedding", label: t("adminProducts.occasions.wedding") },
      { value: "casual", label: t("adminProducts.occasions.casual") },
    ],
    [t]
  );

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  /* ===== IMPORT EXCEL ===== */
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  /* ===== IMAGE + PREVIEW ===== */
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  /* ===== CATEGORIES ===== */
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const list = await categoriesApi.getAll();
        setCategories(list || []);
        if ((list || []).length) setCategoryId(String((list as any[])[0]?.id));
      } catch (e: any) {
        toast({
          title: t("adminProducts.toasts.loadCategoriesFailed.title"),
          description: e?.message || t("common.error"),
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  /* ===== PRODUCTS LIST ===== */
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [detailProductId, setDetailProductId] = useState<string | null>(null);

  // Load inventory items của sản phẩm đang xem detail
  const { data: inventoryItems = [], isLoading: loadingInventory } = useQuery<any[]>({
    queryKey: ["inventory-by-product", detailProductId],
    queryFn: () => fetchApi(`/admin/inventory/product/${detailProductId}`),
    enabled: !!detailProductId,
    staleTime: 30_000,
  });

  const detailProduct = products.find((p) => String(p.id) === detailProductId);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const list = await productsApi.getAll();
      setProducts(list || []);
    } catch (e: any) {
      toast({
        title: t("adminProducts.toasts.loadProductsFailed.title"),
        description: e?.message || t("common.error"),
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===== FORM STATE ===== */
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState<ProductOccasion>("party");
  const [rentPricePerDay, setRentPricePerDay] = useState("150");
  const [deposit, setDeposit] = useState("200");
  const [color, setColor] = useState("unknown");
  const [nameEn, setNameEn] = useState("");
  const [nameJa, setNameJa] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionJa, setDescriptionJa] = useState("");

  const [variants, setVariants] = useState<VariantForm[]>([
    { id: makeRowId(), size: "M", stock: "1", conditionNote: "" },
  ]);

  const resetForm = () => {
    setImage(null);
    setName("");
    setOccasion("party");
    setRentPricePerDay("150");
    setDeposit("200");
    setColor("unknown");
    setNameEn("");
    setNameJa("");
    setDescriptionEn("");
    setDescriptionJa("");
    setVariants([{ id: makeRowId(), size: "M", stock: "1", conditionNote: "" }]);
  };

  const openCreate = () => {
    setMode("create");
    setEditingProduct(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setMode("edit");
    setEditingProduct(p);

    setImage(null);
    setName((p as any).name ?? "");
    setOccasion(((p as any).occasion ?? "party") as ProductOccasion);

    // ✅ keep only rentPricePerDay (avoid confusion)
    setRentPricePerDay(String((p as any).rentPricePerDay ?? 150));
    setDeposit(String((p as any).deposit ?? 200));

    const catId = String((p as any).category?.id ?? (p as any).categoryId ?? "");
    if (catId) setCategoryId(catId);

    setColor((p as any).color ?? "unknown");
    setNameEn((p as any).nameEn ?? "");
    setNameJa((p as any).nameJa ?? "");
    setDescriptionEn((p as any).descriptionEn ?? "");
    setDescriptionJa((p as any).descriptionJa ?? "");

    const vts = ((p as any).variants ?? []) as any[];
    if (Array.isArray(vts) && vts.length) {
      setVariants(
        vts.map((v) => ({
          id: String(v.id ?? makeRowId()),
          size: (v.size ?? "M") as any,
          stock: String(v.stock ?? 0),
          conditionNote: "",
        }))
      );
    } else {
      setVariants([{ id: makeRowId(), size: "M", stock: "1", conditionNote: "" }]);
    }

    setOpen(true);
  };

  const dialogTitle = useMemo(
    () =>
      mode === "create"
        ? t("adminProducts.dialog.createTitle")
        : t("adminProducts.dialog.updateTitle"),
    [mode, t]
  );

  const sizesDuplicate = useMemo(() => {
    const seen = new Set<string>();
    for (const v of variants) {
      if (seen.has(v.size)) return true;
      seen.add(v.size);
    }
    return false;
  }, [variants]);

  /* ===== CREATE / UPDATE ===== */
  const handleSubmit = async () => {
    try {
      if (!name.trim()) {
        toast({
          title: t("adminProducts.validation.missingName.title"),
          description: t("adminProducts.validation.missingName.desc"),
        });
        return;
      }
      if (!categoryId) {
        toast({
          title: t("adminProducts.validation.missingCategory.title"),
          description: t("adminProducts.validation.missingCategory.desc"),
        });
        return;
      }

      if (mode === "create" && !image) {
        toast({
          title: t("adminProducts.validation.missingImage.title"),
          description: t("adminProducts.validation.missingImage.desc"),
        });
        return;
      }

      if (!variants.length) {
        toast({
          title: t("adminProducts.validation.missingVariants.title"),
          description: t("adminProducts.validation.missingVariants.desc"),
        });
        return;
      }

      if (sizesDuplicate) {
        toast({
          title: t("adminProducts.validation.duplicateSize.title"),
          description: t("adminProducts.validation.duplicateSize.desc"),
        });
        return;
      }

      const invalid = variants.some((v) => {
        const n = Number(v.stock);
        return !v.size || v.stock === "" || !Number.isFinite(n) || n < 0;
      });
      if (invalid) {
        toast({
          title: t("adminProducts.validation.invalidVariants.title"),
          description: t("adminProducts.validation.invalidVariants.desc"),
        });
        return;
      }

      const form = new FormData();
      if (image) form.append("image", image);

      form.append("name", name.trim());
      form.append("categoryId", categoryId);
      form.append("occasion", occasion);
      form.append("rentPricePerDay", rentPricePerDay);
      form.append("deposit", deposit);
      form.append("color", color);
      if (nameEn.trim()) form.append("nameEn", nameEn.trim());
      if (nameJa.trim()) form.append("nameJa", nameJa.trim());
      if (descriptionEn.trim()) form.append("descriptionEn", descriptionEn.trim());
      if (descriptionJa.trim()) form.append("descriptionJa", descriptionJa.trim());

      // IMPORTANT: multipart/form-data -> variants as JSON string
      form.append(
        "variants",
        JSON.stringify(variants.map((v) => ({ size: v.size, stock: Number(v.stock), conditionNote: v.conditionNote || undefined })))
      );

      if (mode === "create") {
        await productsApi.create(form);
        toast({
          title: t("common.success"),
          description: t("adminProducts.toasts.created.desc"),
        });
      } else {
        if (!editingProduct?.id) {
          toast({
            title: t("adminProducts.toasts.updateFailedMissingId.title"),
            description: t("adminProducts.toasts.updateFailedMissingId.desc"),
          });
          return;
        }
        await productsApi.update(String(editingProduct.id), form);
        toast({
          title: t("common.success"),
          description: t("adminProducts.toasts.updated.desc"),
        });
      }

      setOpen(false);
      resetForm();
      await fetchProducts();
    } catch (e: any) {
      toast({
        title:
          mode === "create"
            ? t("adminProducts.toasts.createFailed.title")
            : t("adminProducts.toasts.updateFailed.title"),
        description: e?.message || t("common.error"),
      });
    }
  };

  /* ===== DELETE ===== */
  const handleDelete = async (id: string) => {
    try {
      await productsApi.delete(id);
      toast({
        title: t("adminProducts.toasts.deleted.title"),
        description: t("adminProducts.toasts.deleted.desc"),
      });
      await fetchProducts();
    } catch (e: any) {
      toast({
        title: t("adminProducts.toasts.deleteFailed.title"),
        description: e?.message || t("common.error"),
      });
    }
  };

  /* ===== IMPORT EXCEL ===== */
  const handleImportExcel = async (file: File) => {
    try {
      setImporting(true);

      const res = await productsApi.importExcel(file);

      toast({
        title: t("adminProducts.toasts.importDone.title"),
        description: t("adminProducts.toasts.importDone.desc", {
          imported: res?.imported ?? 0,
          failed: res?.failedCount ?? 0,
        }),
      });

      await fetchProducts();
    } catch (e: any) {
      toast({
        title: t("adminProducts.toasts.importFailed.title"),
        description: e?.message || t("common.error"),
      });
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Create + Import */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">{t("adminProducts.header.title")}</h2>
          <p className="text-muted-foreground">{t("adminProducts.header.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* ✅ Import Excel */}
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              handleImportExcel(f);
            }}
          />
          <Button
            variant="secondary"
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing ? t("adminProducts.buttons.importing") : t("adminProducts.buttons.importExcel")}
          </Button>

          {/* ✅ Create */}
          <Button onClick={openCreate}>{t("adminProducts.buttons.create")}</Button>
        </div>

        {/* Shared Dialog for Create/Update */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4">
              {/* IMAGE PREVIEW */}
              <div className="grid gap-2">
                <Label>
                  {t("adminProducts.form.image")} {mode === "edit" ? t("adminProducts.form.optional") : ""}
                </Label>

                <div className="flex gap-4 items-start">
                  <div className="w-28 h-28 border rounded-md overflow-hidden flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt={t("adminProducts.form.previewAlt")} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground">{t("adminProducts.form.noImage")}</span>
                    )}
                  </div>

                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                  />
                </div>

                {mode === "edit" && (
                  <p className="text-xs text-muted-foreground">
                    {t("adminProducts.form.keepOldImageHint")}
                  </p>
                )}
              </div>

              {/* NAME */}
              <div className="grid gap-2">
                <Label>{t("adminProducts.form.name")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              {/* CATEGORY + OCCASION */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>{t("adminProducts.form.category")}</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("adminProducts.form.selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>{t("adminProducts.form.occasion")}</Label>
                  <Select value={occasion} onValueChange={(v) => setOccasion(v as ProductOccasion)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("adminProducts.form.selectOccasion")} />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCASIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* PRICE */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>{t("adminProducts.form.rentPerDay")}</Label>
                  <Input
                    value={rentPricePerDay}
                    onChange={(e) => setRentPricePerDay(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t("adminProducts.form.deposit")}</Label>
                  <Input value={deposit} onChange={(e) => setDeposit(e.target.value)} inputMode="numeric" />
                </div>
              </div>

              {/* VARIANTS + COLOR */}
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label>{t("adminProducts.form.variants")}</Label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setVariants((prev) => [...prev, { id: makeRowId(), size: "M", stock: "0", conditionNote: "" }])
                    }
                  >
                    {t("adminProducts.buttons.addSize")}
                  </Button>
                </div>

                {sizesDuplicate && (
                  <div className="text-xs text-destructive">
                    {t("adminProducts.validation.duplicateSize.inline")}
                  </div>
                )}

                <div className="space-y-2">
                  {variants.map((v) => (
                    <div
                      key={v.id}
                      className="grid grid-cols-[120px_80px_36px] gap-2 items-center"
                    >
                      <Input
                        value={v.size}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((x) => (x.id === v.id ? { ...x, size: e.target.value as any } : x))
                          )
                        }
                        placeholder={t("adminProducts.form.size")}
                        className="uppercase"
                      />

                      <Input
                        value={v.stock}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((x) => (x.id === v.id ? { ...x, stock: e.target.value } : x))
                          )
                        }
                        inputMode="numeric"
                        placeholder={t("adminProducts.form.stock")}
                      />

                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={() => setVariants((prev) => prev.filter((x) => x.id !== v.id))}
                        disabled={variants.length === 1}
                        title={t("adminProducts.buttons.remove")}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid gap-2 max-w-[260px]">
                  <Label>{t("adminProducts.form.color")}</Label>
                  <Input value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
              </div>

              {/* Multilingual fields */}
              <div className="border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">🌐 Tên & Mô tả đa ngôn ngữ <span className="text-muted-foreground font-normal">(không bắt buộc)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs">Tên (English)</Label>
                    <Input placeholder="Product name in English" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Tên (日本語)</Label>
                    <Input placeholder="日本語の商品名" value={nameJa} onChange={(e) => setNameJa(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Mô tả (English)</Label>
                    <Input placeholder="Description in English" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Mô tả (日本語)</Label>
                    <Input placeholder="日本語の説明" value={descriptionJa} onChange={(e) => setDescriptionJa(e.target.value)} />
                  </div>
                </div>
              </div>

              <Button onClick={handleSubmit}>
                {mode === "create" ? t("adminProducts.buttons.submit") : t("adminProducts.buttons.update")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ===== GRID LIST ===== */}
      {loadingProducts ? (
        <div className="text-sm text-muted-foreground">{t("adminProducts.loadingProducts")}</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product, i) => (
            <div
              key={product.id}
              className="animate-fade-in relative group"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => setDetailProductId(String(product.id) === detailProductId ? null : String(product.id))}
                  title="Xem kho"
                >
                  <span className="text-xs">📦</span>
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => openEdit(product)}
                  title={t("common.edit")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      title={t("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("adminProducts.deleteDialog.title")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("adminProducts.deleteDialog.desc")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(String(product.id))}>
                        {t("common.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">{t("adminProducts.empty")}</div>
      )}

      {/* ===== INVENTORY DETAIL PANEL ===== */}
      {detailProductId && detailProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailProductId(null)}>
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-medium text-lg">📦 Kho vận: {(detailProduct as any).name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{inventoryItems.length} món đồ trong kho</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDetailProductId(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4">
              {loadingInventory ? (
                <div className="text-sm text-muted-foreground">Đang tải...</div>
              ) : inventoryItems.length === 0 ? (
                <div className="text-sm text-muted-foreground">Chưa có món đồ nào trong kho.</div>
              ) : (
                Array.from(new Set(inventoryItems.map((i: any) => i.variant?.size))).map((size) => {
                  const sizeItems = inventoryItems.filter((i: any) => i.variant?.size === size);
                  return (
                    <div key={size} className="border rounded-md p-3 space-y-2">
                      <div className="text-sm font-medium">Size {size} — {sizeItems.length} món</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sizeItems.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between bg-muted/40 rounded px-3 py-2 text-xs">
                            <div>
                              <span className="font-mono font-medium">{item.barcode}</span>
                              {item.conditionNote && <span className="text-muted-foreground ml-2">• {item.conditionNote}</span>}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full font-medium ${
                              item.conditionStatus === "available" ? "bg-green-100 text-green-800" :
                              item.conditionStatus === "washing" ? "bg-cyan-100 text-cyan-800" :
                              item.conditionStatus === "repairing" ? "bg-red-100 text-red-800" :
                              item.conditionStatus === "retired" ? "bg-gray-100 text-gray-500" :
                              item.conditionStatus === "rented" ? "bg-yellow-100 text-yellow-800" :
                              "bg-indigo-100 text-indigo-800"
                            }`}>
                              {item.conditionStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
