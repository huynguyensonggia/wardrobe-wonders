import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const { t } = useTranslation();

  const current = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];

  const setLang = (lng: "en" | "vi" | "ja") => {
    i18n.changeLanguage(lng);
    localStorage.setItem("lang", lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("language.label")}>
          <Languages className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground">{t("language.label")}</p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setLang("en")} className="cursor-pointer">
          <span className="flex-1">{t("language.en")}</span>
          {current === "en" && <span className="text-xs text-muted-foreground">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setLang("vi")} className="cursor-pointer">
          <span className="flex-1">{t("language.vi")}</span>
          {current === "vi" && <span className="text-xs text-muted-foreground">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setLang("ja")} className="cursor-pointer">
          <span className="flex-1">{t("language.ja")}</span>
          {current === "ja" && <span className="text-xs text-muted-foreground">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
