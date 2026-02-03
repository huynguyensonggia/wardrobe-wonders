import { useEffect, useMemo, useState, useRef } from "react";
import { productsApi, categoriesApi } from "@/lib/api";
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

/* ===== ENUM MIRROR FROM BE ===== */
type ProductOccasion = "party" | "wedding" | "casual";
const OCCASIONS: { value: ProductOccasion; label: string }[] = [
  { value: "party", label: "Party" },
  { value: "wedding", label: "Wedding" },
  { value: "casual", label: "Casual" },
];

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

type VariantForm = {
  id: string; // ✅ stable key for React list
  size: (typeof SIZES)[number];
  stock: string;
};
/* ================================= */

type Mode = "create" | "edit";

/** Generate stable id for UI rows */
const makeRowId = () => {
  // browser supports crypto.randomUUID in modern envs
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as any).randomUUID() as string;
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function AdminProducts() {
  const { toast } = useToast();

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
          title: "Load categories failed",
          description: e?.message || "Error",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===== PRODUCTS LIST ===== */
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const list = await productsApi.getAll();
      setProducts(list || []);
    } catch (e: any) {
      toast({
        title: "Load products failed",
        description: e?.message || "Error",
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

  const [variants, setVariants] = useState<VariantForm[]>([
    { id: makeRowId(), size: "M", stock: "1" },
  ]);

  const resetForm = () => {
    setImage(null);
    setName("");
    setOccasion("party");
    setRentPricePerDay("150");
    setDeposit("200");
    setColor("unknown");
    setVariants([{ id: makeRowId(), size: "M", stock: "1" }]);
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

    const vts = ((p as any).variants ?? []) as any[];
    if (Array.isArray(vts) && vts.length) {
      setVariants(
        vts.map((v) => ({
          id: String(v.id ?? makeRowId()), // ✅ use DB id as key
          size: (v.size ?? "M") as any,
          stock: String(v.stock ?? 0),
        })),
      );
    } else {
      setVariants([{ id: makeRowId(), size: "M", stock: "1" }]);
    }

    setOpen(true);
  };

  const dialogTitle = useMemo(
    () => (mode === "create" ? "Create product" : "Update product"),
    [mode],
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
          title: "Missing name",
          description: "Please input product name.",
        });
        return;
      }
      if (!categoryId) {
        toast({
          title: "Missing category",
          description: "Please select a category.",
        });
        return;
      }

      if (mode === "create" && !image) {
        toast({ title: "Missing image", description: "Please choose an image." });
        return;
      }

      if (!variants.length) {
        toast({ title: "Missing variants", description: "Add at least 1 size." });
        return;
      }

      if (sizesDuplicate) {
        toast({
          title: "Duplicate size",
          description: "Each size should appear once.",
        });
        return;
      }

      const invalid = variants.some((v) => {
        const n = Number(v.stock);
        return !v.size || v.stock === "" || !Number.isFinite(n) || n < 0;
      });
      if (invalid) {
        toast({
          title: "Invalid variants",
          description: "Stock must be a number >= 0.",
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

      // IMPORTANT: multipart/form-data -> variants as JSON string
      form.append(
        "variants",
        JSON.stringify(
          variants.map((v) => ({ size: v.size, stock: Number(v.stock) })),
        ),
      );

      if (mode === "create") {
        await productsApi.create(form);
        toast({ title: "Success", description: "Product created" });
      } else {
        if (!editingProduct?.id) {
          toast({ title: "Update failed", description: "Missing product id" });
          return;
        }
        await productsApi.update(String(editingProduct.id), form);
        toast({ title: "Success", description: "Product updated" });
      }

      setOpen(false);
      resetForm();
      await fetchProducts();
    } catch (e: any) {
      toast({
        title: mode === "create" ? "Create failed" : "Update failed",
        description: e?.message || "Error",
      });
    }
  };

  /* ===== DELETE ===== */
  const handleDelete = async (id: string) => {
    try {
      await productsApi.delete(id);
      toast({ title: "Deleted", description: "Product removed" });
      await fetchProducts();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || "Error" });
    }
  };

  /* ===== IMPORT EXCEL ===== */
  const handleImportExcel = async (file: File) => {
    try {
      setImporting(true);

      const res = await productsApi.importExcel(file);

      toast({
        title: "Import done",
        description: `Imported: ${res?.imported ?? 0} | Failed: ${res?.failedCount ?? 0}`,
      });

      await fetchProducts();
    } catch (e: any) {
      toast({ title: "Import failed", description: e?.message || "Error" });
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
          <h2 className="font-display text-2xl font-semibold">Products</h2>
          <p className="text-muted-foreground">Manage products</p>
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
            {importing ? "Importing..." : "Import Excel"}
          </Button>

          {/* ✅ Create */}
          <Button onClick={openCreate}>Create product</Button>
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
                <Label>Image {mode === "edit" ? "(optional)" : ""}</Label>
                <div className="flex gap-4 items-start">
                  <div className="w-28 h-28 border rounded-md overflow-hidden flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">No image</span>
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
                    Nếu không chọn ảnh mới, hệ thống sẽ giữ ảnh cũ.
                  </p>
                )}
              </div>

              {/* NAME */}
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              {/* CATEGORY + OCCASION */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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
                  <Label>Occasion</Label>
                  <Select
                    value={occasion}
                    onValueChange={(v) => setOccasion(v as ProductOccasion)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select occasion" />
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
                  <Label>Rent / Day</Label>
                  <Input
                    value={rentPricePerDay}
                    onChange={(e) => setRentPricePerDay(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Deposit</Label>
                  <Input
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
              </div>

              {/* VARIANTS + COLOR */}
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label>Variants (Size + Stock)</Label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setVariants((prev) => [
                        ...prev,
                        { id: makeRowId(), size: "M", stock: "0" },
                      ])
                    }
                  >
                    + Add size
                  </Button>
                </div>

                {sizesDuplicate && (
                  <div className="text-xs text-destructive">
                    Duplicate size detected. Please keep each size unique.
                  </div>
                )}

                <div className="space-y-2">
                  {variants.map((v) => (
                    <div
                      key={v.id} // ✅ FIX: stable key
                      className="grid grid-cols-[140px_1fr_40px] gap-2 items-center"
                    >
                      <Select
                        value={v.size}
                        onValueChange={(val) =>
                          setVariants((prev) =>
                            prev.map((x) =>
                              x.id === v.id ? { ...x, size: val as any } : x,
                            ),
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          {SIZES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        value={v.stock}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((x) =>
                              x.id === v.id ? { ...x, stock: e.target.value } : x,
                            ),
                          )
                        }
                        inputMode="numeric"
                        placeholder="Stock"
                      />

                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={() =>
                          setVariants((prev) => prev.filter((x) => x.id !== v.id))
                        }
                        disabled={variants.length === 1}
                        title="Remove"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid gap-2 max-w-[260px]">
                  <Label>Color</Label>
                  <Input value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
              </div>

              <Button onClick={handleSubmit}>
                {mode === "create" ? "Submit" : "Update"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ===== GRID LIST ===== */}
      {loadingProducts ? (
        <div className="text-sm text-muted-foreground">Loading products...</div>
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
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => openEdit(product)}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete product?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Hành động này không thể hoàn tác. Bạn chắc chắn muốn xoá sản phẩm này?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(String(product.id))}>
                        Delete
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
        <div className="text-sm text-muted-foreground">No products yet.</div>
      )}
    </div>
  );
}
