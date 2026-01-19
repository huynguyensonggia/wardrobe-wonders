import { useEffect, useMemo, useState } from "react";
import { categoriesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/components/ui/use-toast";
import type { Category } from "@/types";
import { Pencil, Trash2 } from "lucide-react";

import { VtonCategory, VTON_CATEGORY_OPTIONS } from "@/constants/vtonCategory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Mode = "create" | "edit";

export default function AdminCategories() {
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editing, setEditing] = useState<Category | null>(null);

  // form
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [vtonCategory, setVtonCategory] = useState<VtonCategory | "">("");

  const title = useMemo(
    () => (mode === "create" ? "Create category" : "Update category"),
    [mode]
  );

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setVtonCategory("");
    setEditing(null);
    setMode("create");
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const list = await categoriesApi.getAll();
      setCategories(list || []);
    } catch (e: any) {
      toast({
        title: "Load categories failed",
        description: e?.message || "Error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    resetForm();
    setMode("create");
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setMode("edit");
    setEditing(c);

    setName((c as any).name ?? "");
    setSlug((c as any).slug ?? "");
    setDescription((c as any).description ?? "");
    setVtonCategory(((c as any).vtonCategory ?? "") as VtonCategory | "");

    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!name.trim()) {
        toast({
          title: "Missing name",
          description: "Please input category name.",
        });
        return;
      }

      // Backend của bạn: slug là REQUIRED trong DTO => nên validate ở FE
      if (!slug.trim()) {
        toast({
          title: "Missing slug",
          description: "Slug is required (CreateCategoryDto.slug).",
        });
        return;
      }

      const payload: Partial<Category> = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        vtonCategory: vtonCategory || undefined,
      };

      if (mode === "create") {
        await categoriesApi.create(payload);
        toast({ title: "Success", description: "Category created" });
      } else {
        if (!editing?.id) {
          toast({ title: "Update failed", description: "Missing category id" });
          return;
        }
        await categoriesApi.update(String(editing.id), payload);
        toast({ title: "Success", description: "Category updated" });
      }

      setOpen(false);
      resetForm();
      await fetchCategories();
    } catch (e: any) {
      toast({
        title: mode === "create" ? "Create failed" : "Update failed",
        description: e?.message || "Error",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await categoriesApi.delete(id);
      toast({ title: "Deleted", description: "Category removed" });
      await fetchCategories();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || "Error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Categories</h2>
          <p className="text-muted-foreground">Manage categories</p>
        </div>
        <Button onClick={openCreate}>Create category</Button>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            {/* slug required in BE */}
            <div className="grid gap-2">
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. dresses"
              />
              <p className="text-xs text-muted-foreground">
                DTO backend đang require slug, nên không được để trống.
              </p>
            </div>

            {/* VTON CATEGORY */}
            <div className="grid gap-2">
              <Label>VTON Category (AI Try-On)</Label>
              <Select
                value={vtonCategory || ""}
                onValueChange={(v) => setVtonCategory(v as VtonCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select VTON category" />
                </SelectTrigger>
                <SelectContent>
                  {VTON_CATEGORY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Dùng để AI biết vùng cơ thể cần mask khi Try-On.
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description..."
              />
            </div>

            <Button onClick={handleSubmit}>
              {mode === "create" ? "Submit" : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* List */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading categories...</div>
      ) : categories.length > 0 ? (
        <div className="grid gap-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="font-medium truncate">{(c as any).name}</div>
                  {(c as any).slug ? (
                    <div className="text-xs text-muted-foreground">
                      /{(c as any).slug}
                    </div>
                  ) : null}
                </div>

                {(c as any).vtonCategory ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    VTON: {(c as any).vtonCategory}
                  </div>
                ) : null}

                {(c as any).description ? (
                  <div className="text-sm text-muted-foreground mt-1">
                    {(c as any).description}
                  </div>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => openEdit(c)}
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
                      <AlertDialogTitle>Delete category?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Hành động này không thể hoàn tác. Nếu category đang được
                        dùng bởi products, backend có thể sẽ chặn xoá.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(String(c.id))}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No categories yet.</div>
      )}
    </div>
  );
}
