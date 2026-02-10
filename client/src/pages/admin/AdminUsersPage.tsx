import { useEffect, useMemo, useState } from "react";
import { adminUsersApi } from "@/lib/api";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

type EditForm = {
  name?: string;
  phone?: string;
  password?: string;
};

export default function AdminUsersPage() {
  const { t } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EditForm>({});

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await adminUsersApi.getAll();
      setUsers(data);
    } catch (e: any) {
      setErr(e?.message ?? t("adminUsers.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ sort by id for nicer display (optional)
  const sortedUsers = useMemo(() => {
    return [...users].sort((a: any, b: any) => Number(a.id) - Number(b.id));
  }, [users]);

  const startEdit = (u: User) => {
    setEditingId(Number((u as any).id));
    setForm({
      name: (u as any).name ?? "",
      phone: (u as any).phone ?? "",
      password: "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const save = async (id: number) => {
    try {
      // ✅ only send fields BE allows
      const payload: any = {
        name: form.name,
        phone: form.phone,
      };

      if (form.password && form.password.trim().length > 0) {
        payload.password = form.password;
      }

      await adminUsersApi.update(id, payload);
      await load();
      cancelEdit();
    } catch (e: any) {
      alert(e?.message ?? t("adminUsers.errors.updateFailed"));
    }
  };

  const remove = async (u: User) => {
    const idNum = Number((u as any).id);

    // ✅ FE guard if user has rentals
    const rentalsCount = Array.isArray((u as any).rentals) ? (u as any).rentals.length : 0;
    if (rentalsCount > 0) {
      alert(t("adminUsers.errors.cannotDeleteHasRentals"));
      return;
    }

    if (!confirm(t("adminUsers.confirm.deleteUser", { id: idNum }))) return;

    try {
      await adminUsersApi.delete(idNum);
      await load();
    } catch (e: any) {
      alert(e?.message ?? t("adminUsers.errors.deleteFailed"));
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t("adminUsers.title")}</h1>

        <Button variant="outline" onClick={load}>
          {t("adminUsers.buttons.refresh")}
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">{t("common.loading")}</p>}
      {err && <p className="text-red-500">{err}</p>}

      {!loading && !err && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="p-3">{t("adminUsers.table.id")}</th>
                <th className="p-3">{t("adminUsers.table.name")}</th>
                <th className="p-3">{t("adminUsers.table.email")}</th>
                <th className="p-3">{t("adminUsers.table.phone")}</th>
                <th className="p-3">{t("adminUsers.table.rentals")}</th>
                <th className="p-3 w-[260px]">{t("adminUsers.table.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {sortedUsers.map((u: any) => {
                const idNum = Number(u.id);
                const isEdit = editingId === idNum;

                const rentalsCount = Array.isArray(u.rentals) ? u.rentals.length : 0;
                const cannotDelete = rentalsCount > 0;

                return (
                  <tr key={u.id} className="border-t align-top">
                    <td className="p-3">{u.id}</td>

                    <td className="p-3">
                      {isEdit ? (
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={form.name ?? ""}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder={t("adminUsers.placeholders.name")}
                        />
                      ) : (
                        u.name
                      )}
                    </td>

                    {/* ✅ Email: display only */}
                    <td className="p-3">{u.email}</td>

                    <td className="p-3">
                      {isEdit ? (
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={form.phone ?? ""}
                          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                          placeholder={t("adminUsers.placeholders.phone")}
                        />
                      ) : (
                        u.phone ?? t("common.na")
                      )}
                    </td>

                    <td className="p-3">{rentalsCount}</td>

                    <td className="p-3">
                      {isEdit ? (
                        <>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => save(idNum)}>
                              {t("common.save")}
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              {t("common.cancel")}
                            </Button>
                          </div>

                          <div className="mt-2">
                            <input
                              className="w-full border rounded px-2 py-1"
                              placeholder={t("adminUsers.placeholders.newPasswordOptional")}
                              value={form.password ?? ""}
                              onChange={(e) =>
                                setForm((p) => ({ ...p, password: e.target.value }))
                              }
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("adminUsers.hints.keepPasswordIfEmpty")}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(u)}>
                              {t("common.edit")}
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={cannotDelete}
                              onClick={() => remove(u)}
                              title={
                                cannotDelete
                                  ? t("adminUsers.tooltips.cannotDeleteHasRentals")
                                  : t("adminUsers.tooltips.deleteUser")
                              }
                            >
                              {t("common.delete")}
                            </Button>
                          </div>

                          {cannotDelete && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("adminUsers.hints.cannotDeleteHasRentals")}
                            </p>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}

              {sortedUsers.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                    {t("adminUsers.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
