import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User as UserIcon } from "lucide-react";
import { authApi } from "@/lib/api";
import { useTranslation } from "react-i18next";

export default function Profile() {
  const { t } = useTranslation(); // ✅ giống MyRentals: không truyền namespace
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const res = await authApi.updateProfile({ name, phone });
      const updatedUser = (res as any)?.data ?? res;

      updateUser({
        name: updatedUser?.name ?? name,
        phone: updatedUser?.phone ?? phone,
      });

      toast({
        title: t("common.profile2.toast.success.title"),
        description: t("common.profile2.toast.success.desc"),
      });
    } catch (error: any) {
      toast({
        title: t("common.profile2.toast.error.title"),
        description: error?.message || t("common.profile2.toast.error.desc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-medium">
        {t("common.profile2.title")}
      </h2>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "avatar"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-8 h-8 text-muted-foreground" />
              )}
            </div>

            <div>
              <CardTitle>{user?.name || t("common.dash")}</CardTitle>
              <CardDescription>{user?.email || t("common.dash")}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("common.profile2.form.fullName")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder={t("common.profile2.form.fullNamePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("common.profile2.form.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("common.profile2.form.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("common.profile2.form.phonePlaceholder")}
                  autoComplete="tel"
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading || !user}>
              {isLoading
                ? t("common.profile2.button.saving")
                : t("common.profile2.button.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
