import { useEffect, useState } from "react";
import { productsApi, categoriesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Product, Category } from "@/types";
import { ProductCard } from "@/components/products/ProductCard";

/* ===== ENUM MIRROR FROM BE ===== */
type ProductOccasion = "party" | "wedding" | "casual";
const OCCASIONS: { value: ProductOccasion; label: string }[] = [
  { value: "party", label: "Party" },
  { value: "wedding", label: "Wedding" },
  { value: "casual", label: "Casual" },
];

const SIZES = ["XS", "S", "M", "L", "XL"] as const;
/* ================================= */

export default function AdminProducts() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

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
        if ((list || []).length) setCategoryId(String(list[0].id));
      } catch (e: any) {
        toast({ title: "Load categories failed", description: e?.message || "Error" });
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
      const list = await productsApi.getAll(); // ✅ đã map BE -> mock Product
      setProducts(list || []);
    } catch (e: any) {
      toast({ title: "Load products failed", description: e?.message || "Error" });
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
  const [rentPricePerDay, setRentPricePerDay] = useState("150000");
  const [deposit, setDeposit] = useState("500000");
  const [size, setSize] = useState<(typeof SIZES)[number]>("M");
  const [quantity, setQuantity] = useState("1");
  const [color, setColor] = useState("unknown");

  const resetForm = () => {
    setImage(null);
    setName("");
    setOccasion("party");
    setRentPricePerDay("150000");
    setDeposit("500000");
    setSize("M");
    setQuantity("1");
    setColor("unknown");
  };

  const handleCreate = async () => {
    try {
      if (!image) {
        toast({ title: "Missing image", description: "Please choose an image." });
        return;
      }
      if (!name.trim()) {
        toast({ title: "Missing name", description: "Please input product name." });
        return;
      }
      if (!categoryId) {
        toast({ title: "Missing category", description: "Please select a category." });
        return;
      }

      const form = new FormData();
      form.append("image", image);
      form.append("name", name.trim());
      form.append("categoryId", categoryId);
      form.append("occasion", occasion);
      form.append("rentPricePerDay", rentPricePerDay);
      form.append("deposit", deposit);
      form.append("size", size);
      form.append("quantity", quantity);
      form.append("color", color);

      await productsApi.create(form);

      toast({ title: "Success", description: "Product created" });
      setOpen(false);
      resetForm();

      // ✅ refresh grid list ngay
      await fetchProducts();
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message || "Error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Products</h2>
          <p className="text-muted-foreground">Manage products</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create product</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Create product</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4">
              {/* IMAGE PREVIEW */}
              <div className="grid gap-2">
                <Label>Image</Label>
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
                  <Select value={occasion} onValueChange={(v) => setOccasion(v as ProductOccasion)}>
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

              {/* SIZE + QTY + COLOR */}
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label>Size</Label>
                  <Select value={size} onValueChange={(v) => setSize(v as any)}>
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
                </div>

                <div className="grid gap-2">
                  <Label>Quantity</Label>
                  <Input
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    inputMode="numeric"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Color</Label>
                  <Input value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
              </div>

              <Button onClick={handleCreate}>Submit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ===== GRID LIST (giống ProductsPage) ===== */}
      {loadingProducts ? (
        <div className="text-sm text-muted-foreground">Loading products...</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product, i) => (
            <div
              key={product.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
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
