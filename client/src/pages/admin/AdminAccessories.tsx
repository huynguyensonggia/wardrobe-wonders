import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Pencil, Trash2 } from "lucide-react";
import type { Product, Category } from "@/types";
import { ProductCard } from "@/components/products/ProductCard";

// Slugs được coi là phụ kiện
const ACCESSORY_SLUGS = ["bags", "jewelry", "hats", "accessories"];

const makeRowId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as any).randomUUID() as string
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type Mode = "create" | "edit";
type VariantForm = { id: string; size: string; sizeEn: string; sizeJa: string; stock: string };

export default function AdminAccessories() {
  const { toast } = useToast();
  const { t } = useTranslation();

  /* ===== CATEGORIES (chỉ phụ kiện) ===== */
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const accessoryCategories = useMemo(
    () => allCategories.filter((c) => ACCESSORY_SLUGS.includes((c as any).slug ?? "")),
    [allCategories]
  );

  useEffect(() => {
    categoriesApi.getAll().then((list) => setAllCategories(list || [])).catch(() => {});
  }, []);

  /* ===== PRODUCTS (chỉ phụ kiện) ===== */
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const accessoryProducts = useMemo(
    () =>
      products.filter((p) => {
        const slug = (p as any).category?.slug ?? "";
        return ACCESSORY_SLUGS.includes(slug);
      }),
    [products]
  );

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const list = await productsApi.getAll();
      setProducts(list || []);
    } catch (e: any) {
      toast({ title: t("common.errors.prefix"), description: e?.message });
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []); // eslint-disable-line

  /* ===== INVENTORY DETAIL ===== */
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const detailProduct = accessoryProducts.find((p) => String(p.id) === detailProductId);

  const { data: inventoryItems = [], isLoading: loadingInventory } = useQuery<any[]>({
    queryKey: ["inventory-by-product", detailProductId],
    queryFn: () => fetchApi(`/admin/inventory/product/${detailProductId}`),
    enabled: !!detailProductId,
    staleTime: 30_000,
  });

  /* ===== FORM STATE ===== */
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameJa, setNameJa] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [rentPricePerDay, setRentPricePerDay] = useState("50");
  const [deposit, setDeposit] = useState("100");
  const [color, setColor] = useState("");
  const [colorEn, setColorEn] = useState("");
  const [colorJa, setColorJa] = useState("");
  const [variants, setVariants] = useState<VariantForm[]>([
    { id: makeRowId(), size: "", sizeEn: "", sizeJa: "", stock: "1" },
  ]);

  useEffect(() => {
    if (!image) { setImagePreview(null); return; }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  // Set default categoryId khi categories load
  useEffect(() => {
    if (accessoryCategories.length && !categoryId) {
      setCategoryId(String(accessoryCategories[0].id));
    }
  }, [accessoryCategories]); // eslint-disable-line

  const resetForm = () => {
    setImage(null);
    setName("");
    setNameEn("");
    setNameJa("");
    setRentPricePerDay("50");
    setDeposit("100");
    setColor("");
    setColorEn("");
    setColorJa("");
    setVariants([{ id: makeRowId(), size: "", sizeEn: "", sizeJa: "", stock: "1" }]);
    if (accessoryCategories.length) setCategoryId(String(accessoryCategories[0].id));
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
    setNameEn((p as any).nameEn ?? "");
    setNameJa((p as any).nameJa ?? "");
    setRentPricePerDay(String((p as any).rentPricePerDay ?? 50));
    setDeposit(String((p as any).deposit ?? 100));
    setColor((p as any).color ?? "");
    setColorEn((p as any).colorEn ?? "");
    setColorJa((p as any).colorJa ?? "");
    const catId = String((p as any).category?.id ?? (p as any).categoryId ?? "");
    if (catId) setCategoryId(catId);
    const vts = ((p as any).variants ?? []) as any[];
    setVariants(
      vts.length
        ? vts.map((v) => ({ id: String(v.id ?? makeRowId()), size: v.size ?? "", sizeEn: v.sizeEn ?? "", sizeJa: v.sizeJa ?? "", stock: String(v.stock ?? 1) }))
        : [{ id: makeRowId(), size: "", sizeEn: "", sizeJa: "", stock: "1" }]
    );
    setOpen(true);
  };

  const sizesDuplicate = useMemo(() => {
    const seen = new Set<string>();
    for (const v of variants) {
      if (seen.has(v.size)) return true;
      seen.add(v.size);
    }
    return false;
  }, [variants]);

  /* ===== SUBMIT ===== */
  const handleSubmit = async () => {
    if (!name.trim()) { toast({ title: t("admin.accessories.validation.missingName") }); return; }
    if (!categoryId) { toast({ title: t("admin.accessories.validation.missingCategory") }); return; }
    if (mode === "create" && !image) { toast({ title: t("admin.accessories.validation.missingImage") }); return; }
    if (!variants.length) { toast({ title: t("admin.accessories.validation.missingVariants") }); return; }
    if (sizesDuplicate) { toast({ title: t("admin.accessories.validation.duplicateSize") }); return; }

    const form = new FormData();
    if (image) form.append("image", image);
    form.append("name", name.trim());
    if (nameEn.trim()) form.append("nameEn", nameEn.trim());
    if (nameJa.trim()) form.append("nameJa", nameJa.trim());
    form.append("categoryId", categoryId);
    form.append("occasion", "casual");
    form.append("rentPricePerDay", rentPricePerDay);
    form.append("deposit", deposit);
    form.append("color", color || "unknown");
    if (colorEn.trim()) form.append("colorEn", colorEn.trim());
    if (colorJa.trim()) form.append("colorJa", colorJa.trim());
    form.append("variants", JSON.stringify(
      variants.map((v) => ({
        size: v.size,
        sizeEn: v.sizeEn.trim() || undefined,
        sizeJa: v.sizeJa.trim() || undefined,
        stock: Number(v.stock),
      }))
    ));

    try {
      if (mode === "create") {
        await productsApi.create(form);
        toast({ title: t("admin.accessories.toastCreated") });
      } else {
        if (!editingProduct?.id) return;
        await productsApi.update(String(editingProduct.id), form);
        toast({ title: t("admin.accessories.toastUpdated") });
      }
      setOpen(false);
      resetForm();
      await fetchProducts();
    } catch (e: any) {
      toast({ title: t("common.errors.prefix"), description: e?.message });
    }
  };

  /* ===== DELETE ===== */
  const handleDelete = async (id: string) => {
    try {
      await productsApi.delete(id);
      toast({ title: t("admin.accessories.toastDeleted") });
      await fetchProducts();
    } catch (e: any) {
      toast({ title: t("common.errors.prefix"), description: e?.message });
    }
  };

  /* ===== SEARCH ===== */
  const [searchQuery, setSearchQuery] = useState("");
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return accessoryProducts;
    const kw = searchQuery.toLowerCase();
    return accessoryProducts.filter((p) =>
      String((p as any).name ?? "").toLowerCase().includes(kw) ||
      String((p as any).category?.name ?? "").toLowerCase().includes(kw)
    );
  }, [accessoryProducts, searchQuery]);

  /* ===== RENDER ===== */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">{t("admin.accessories.title")}</h2>
          <p className="text-muted-foreground">{t("admin.accessories.subtitle")}</p>
        </div>

        <Button onClick={openCreate}>{t("admin.accessories.addBtn")}</Button>

        {/* Dialog Create / Edit */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{mode === "create" ? t("admin.accessories.dialogCreate") : t("admin.accessories.dialogEdit")}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4">
              {/* Ảnh */}
              <div className="grid gap-2">
                <Label>{t("admin.accessories.form.image")} {mode === "edit" && <span className="text-muted-foreground font-normal">{t("admin.accessories.form.optional")}</span>}</Label>
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-24 border rounded-md overflow-hidden flex items-center justify-center shrink-0">
                    {imagePreview
                      ? <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
                      : <span className="text-xs text-muted-foreground">{t("admin.accessories.form.noImage")}</span>}
                  </div>
                  <Input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
                </div>
                {mode === "edit" && (
                  <p className="text-xs text-muted-foreground">{t("admin.accessories.form.keepOldImageHint")}</p>
                )}
              </div>

              {/* Tên */}
              <div className="grid gap-2">
                <Label>{t("admin.accessories.form.name")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("admin.accessories.form.namePlaceholder")} />
              </div>

              {/* Đa ngôn ngữ - Tên */}
              <div className="grid gap-2 rounded-md border border-border p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">{t("admin.accessories.form.multilingual")}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Tên (English)</Label>
                    <Input
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      placeholder="e.g. Pearl Necklace"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">名前 (日本語)</Label>
                    <Input
                      value={nameJa}
                      onChange={(e) => setNameJa(e.target.value)}
                      placeholder="例: パールネックレス"
                    />
                  </div>
                </div>
              </div>

              {/* Danh mục */}
              <div className="grid gap-2">
                <Label>{t("admin.accessories.form.category")}</Label>
                {accessoryCategories.length === 0 ? (
                  <p className="text-sm text-destructive">
                    {t("admin.accessories.noCategoryWarning")}
                  </p>
                ) : (
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.accessories.form.categoryPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {accessoryCategories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Giá + Cọc */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>{t("admin.accessories.form.rentPerDay")}</Label>
                  <Input value={rentPricePerDay} onChange={(e) => setRentPricePerDay(e.target.value)} inputMode="numeric" />
                </div>
                <div className="grid gap-2">
                  <Label>{t("admin.accessories.form.deposit")}</Label>
                  <Input value={deposit} onChange={(e) => setDeposit(e.target.value)} inputMode="numeric" />
                </div>
              </div>

              {/* Màu sắc chính */}
              <div className="grid gap-2">
                <Label>{t("admin.accessories.form.color")}</Label>
                <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder={t("admin.accessories.form.colorPlaceholder")} />
              </div>

              {/* Màu sắc & Số lượng */}
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label>{t("admin.accessories.form.variants")}</Label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setVariants((prev) => [...prev, { id: makeRowId(), size: "", sizeEn: "", sizeJa: "", stock: "1" }])}
                  >
                    {t("admin.accessories.form.addColor")}
                  </Button>
                </div>

                {sizesDuplicate && (
                  <p className="text-xs text-destructive">{t("admin.accessories.validation.duplicateSizeInline")}</p>
                )}

                <div className="space-y-3">
                  {variants.map((v) => (
                    <div key={v.id} className="border rounded-md p-2 space-y-2">
                      <div className="grid grid-cols-[1fr_80px_36px] gap-2 items-center">
                        <Input
                          value={v.size}
                          onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, size: e.target.value } : x))}
                          placeholder={t("admin.accessories.form.colorViPlaceholder")}
                        />
                        <Input
                          value={v.stock}
                          onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, stock: e.target.value } : x))}
                          inputMode="numeric"
                          placeholder="SL"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => setVariants((prev) => prev.filter((x) => x.id !== v.id))}
                          disabled={variants.length === 1}
                        >
                          ✕
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={v.sizeEn}
                          onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, sizeEn: e.target.value } : x))}
                          placeholder="EN: gold, silver..."
                          className="text-xs h-8"
                        />
                        <Input
                          value={v.sizeJa}
                          onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, sizeJa: e.target.value } : x))}
                          placeholder="JA: ゴールド..."
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSubmit}>
                {mode === "create" ? t("admin.accessories.createBtn") : t("admin.accessories.saveBtn")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <Input
          placeholder={t("admin.accessories.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Danh sách */}
      {loadingProducts ? (
        <p className="text-sm text-muted-foreground">{t("admin.accessories.loading")}</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {accessoryCategories.length === 0
            ? t("admin.accessories.noCategoryWarning")
            : t("admin.accessories.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {filteredProducts.map((product, i) => {
            const vts: any[] = (product as any).variants ?? [];
            const totalStock = vts.reduce((s, v) => s + (Number(v.stock) || 0), 0);
            const statusBadge = totalStock === 0
              ? { label: t("admin.accessories.outOfStock"), cls: "bg-red-100 text-red-800" }
              : { label: t("admin.accessories.inStock"), cls: "bg-green-100 text-green-800" };

            return (
              <div
                key={product.id}
                className="animate-fade-in relative group"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="absolute top-2 left-2 z-10 pointer-events-none">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge.cls}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => setDetailProductId(String(product.id) === detailProductId ? null : String(product.id))}
                    title={t("admin.accessories.buttons.viewInventory")}
                  >
                    <span className="text-xs">📦</span>
                  </Button>

                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => openEdit(product)}
                    title={t("admin.accessories.buttons.edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="destructive" className="h-8 w-8" title={t("admin.accessories.buttons.delete")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("admin.accessories.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("admin.accessories.deleteDesc")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(String(product.id))}>{t("common.delete")}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <ProductCard product={product} />
              </div>
            );
          })}
        </div>
      )}

      {/* Inventory detail panel */}
      {detailProductId && detailProduct && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setDetailProductId(null)}
        >
          <div
            className="bg-background rounded-lg w-full max-w-lg max-h-[70vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-medium">📦 {t("admin.accessories.inventory.title")}: {(detailProduct as any).name}</h3>
              <Button variant="ghost" size="icon" onClick={() => setDetailProductId(null)}>✕</Button>
            </div>
            <div className="p-5">
              {loadingInventory ? (
                <p className="text-sm text-muted-foreground">{t("admin.accessories.inventory.loading")}</p>
              ) : inventoryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("admin.accessories.inventory.empty")}</p>
              ) : (
                <div className="space-y-2">
                  {inventoryItems.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                      <span>{item.variant?.size ?? "One Size"}</span>
                      <span className="text-muted-foreground">{item.barcode ?? "—"}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.conditionStatus === "available" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {item.conditionStatus ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
