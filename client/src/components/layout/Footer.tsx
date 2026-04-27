import { Link } from "react-router-dom";
import { Facebook } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link
              to="/"
              className="font-display text-2xl font-semibold tracking-tight"
            >
              AI CLOSET
            </Link>

            <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed">
              {t("footer.tagline")}
            </p>

            <div className="flex gap-4 mt-6">
              <a
                href="https://web.facebook.com/share/18n4kf3A4A/?mibextid=wwXIfr&_rdc=1&_rdr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-display text-lg font-medium mb-4">
              {t("footer.shop")}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/products"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {t("footer.allCollections")}
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=dresses"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {t("footer.dresses")}
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=outerwear"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {t("footer.outerwear")}
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=tops"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {t("footer.tops")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-display text-lg font-medium mb-4">
              {t("footer.help")}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/how-it-works"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {t("footer.howItWorks")}
                </Link>
              </li>
              <li>
                <Link
                  to="/size-guide"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {t("footer.sizeGuide")}
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping-returns"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {t("footer.shippingReturns")}
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {t("footer.faq")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display text-lg font-medium mb-4">
              {t("footer.company")}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/about"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {t("footer.contact")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-primary-foreground/50">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </p>

            <div className="flex gap-6">
              <Link
                to="/privacy"
                className="text-xs text-primary-foreground/50 hover:text-primary-foreground transition-colors"
              >
                {t("footer.privacy")}
              </Link>
              <Link
                to="/terms"
                className="text-xs text-primary-foreground/50 hover:text-primary-foreground transition-colors"
              >
                {t("footer.terms")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
