import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center py-20">
      <div className="container mx-auto px-4 text-center max-w-lg">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-10 h-10 text-muted-foreground" />
        </div>

        <p className="font-display text-8xl font-semibold text-accent mb-4">404</p>

        <h1 className="font-display text-2xl font-semibold mb-3">
          {t("notFound.title")}
        </h1>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          {t("notFound.desc")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("notFound.backHome")}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/products">{t("notFound.browseCollection")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
