import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-medium">{t("settings.title")}</h2>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.notifications.title")}</CardTitle>
          <CardDescription>{t("settings.notifications.desc")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications">
                {t("settings.notifications.email.title")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.notifications.email.desc")}
              </p>
            </div>
            <Switch id="email-notifications" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-notifications">
                {t("settings.notifications.sms.title")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.notifications.sms.desc")}
              </p>
            </div>
            <Switch id="sms-notifications" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketing">{t("settings.notifications.marketing.title")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.notifications.marketing.desc")}
              </p>
            </div>
            <Switch id="marketing" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.privacy.title")}</CardTitle>
          <CardDescription>{t("settings.privacy.desc")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="profile-visibility">{t("settings.privacy.publicProfile.title")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.privacy.publicProfile.desc")}
              </p>
            </div>
            <Switch id="profile-visibility" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
