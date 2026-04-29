import { useTranslation } from "react-i18next";
import { MapPin, Facebook, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const FB_URL = "https://web.facebook.com/share/18n4kf3A4A/?mibextid=wwXIfr&_rdc=1&_rdr";

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
            {t("contact.title")}
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto">
            {t("contact.subtitle")}
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-2xl space-y-4">

          {/* Facebook */}
          <div className="border border-border rounded-2xl p-6 flex items-start gap-5">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Facebook className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg mb-1">{t("contact.facebook.title")}</p>
              <p className="text-muted-foreground text-sm mb-4">
                {t("contact.facebook.desc")}
              </p>
              <Button asChild size="sm">
                <a href={FB_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t("contact.facebook.cta")}
                </a>
              </Button>
            </div>
          </div>

          {/* Address */}
          <div className="border border-border rounded-2xl p-6 flex items-start gap-5">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg mb-1">{t("contact.address.title")}</p>
              <p className="text-muted-foreground text-sm">
                14 Doãn Uẩn, Quận Ngũ Hành Sơn, Đà Nẵng
              </p>
            </div>
          </div>

          {/* Hours */}
          <div className="border border-border rounded-2xl p-6 flex items-start gap-5">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg mb-1">{t("contact.hours.title")}</p>
              <p className="text-muted-foreground text-sm">{t("contact.hours.value")}</p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
