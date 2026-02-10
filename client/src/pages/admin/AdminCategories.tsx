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

import { useTranslation } from "react-i18next";

type Mode = "create" | "edit";

export default function AdminCategories() {
  const { toast } = useToast();
  const { t } = useTranslation();

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
    () =>
      mode === "create"
        ? t("adminCategories.dialog.createTitle")
        : t("adminCategories.dialog.updateTitle"),
    [mode, t]
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
        title: t("adminCategories.toasts.loadFailed.title"),
        description: e?.message || t("common.error"),
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
          title: t("adminCategories.validation.missingName.title"),
          description: t("adminCategories.validation.missingName.desc"),
        });
        return;
      }

      // Backend: slug REQUIRED
      if (!slug.trim()) {
        toast({
          title: t("adminCategories.validation.missingSlug.title"),
          description: t("adminCategories.validation.missingSlug.desc"),
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
        toast({
          title: t("common.success"),
          description: t("adminCategories.toasts.created.desc"),
        });
      } else {
        if (!editing?.id) {
          toast({
            title: t("adminCategories.toasts.updateFailedMissingId.title"),
            description: t("adminCategories.toasts.updateFailedMissingId.desc"),
          });
          return;
        }
        await categoriesApi.update(String(editing.id), payload);
        toast({
          title: t("common.success"),
          description: t("adminCategories.toasts.updated.desc"),
        });
      }

      setOpen(false);
      resetForm();
      await fetchCategories();
    } catch (e: any) {
      toast({
        title:
          mode === "create"
            ? t("adminCategories.toasts.createFailed.title")
            : t("adminCategories.toasts.updateFailed.title"),
        description: e?.message || t("common.error"),
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await categoriesApi.delete(id);
      toast({
        title: t("adminCategories.toasts.deleted.title"),
        description: t("adminCategories.toasts.deleted.desc"),
      });
      await fetchCategories();
    } catch (e: any) {
      toast({
        title: t("adminCategories.toasts.deleteFailed.title"),
        description: e?.message || t("common.error"),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            {t("adminCategories.header.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("adminCategories.header.subtitle")}
          </p>
        </div>
        <Button onClick={openCreate}>
          {t("adminCategories.buttons.create")}
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("adminCategories.form.name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            {/* slug required in BE */}
            <div className="grid gap-2">
              <Label>{t("adminCategories.form.slug")}</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={t("adminCategories.form.slugPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">
                {t("adminCategories.form.slugHint")}
              </p>
            </div>

            {/* VTON CATEGORY */}
            <div className="grid gap-2">
              <Label>{t("adminCategories.form.vtonLabel")}</Label>
              <Select
                value={vtonCategory || ""}
                onValueChange={(v) => setVtonCategory(v as VtonCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("adminCategories.form.vtonPlaceholder")} />
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
                {t("adminCategories.form.vtonHint")}
              </p>
            </div>

            <div className="grid gap-2">
              <Label>{t("adminCategories.form.descriptionOptional")}</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("adminCategories.form.descriptionPlaceholder")}
              />
            </div>

            <Button onClick={handleSubmit}>
              {mode === "create"
                ? t("adminCategories.buttons.submit")
                : t("adminCategories.buttons.update")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* List */}
      {loading ? (
        <div className="text-sm text-muted-foreground">
          {t("adminCategories.loading")}
        </div>
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
                    {t("adminCategories.list.vton")}: {(c as any).vtonCategory}
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
                      <AlertDialogTitle>
                        {t("adminCategories.deleteDialog.title")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("adminCategories.deleteDialog.desc")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("common.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(String(c.id))}
                      >
                        {t("common.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          {t("adminCategories.empty")}
        </div>
      )}
    </div>
  );
}
