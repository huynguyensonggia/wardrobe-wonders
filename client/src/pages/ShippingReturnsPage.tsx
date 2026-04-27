import {
  Truck, Clock, Shield, RefreshCw, MapPin, Phone, AlertTriangle, CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function ShippingReturnsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("shipping");

  const deliveryZones = [
    {
      zone:  t("shippingReturns.shipping.zones.danang.name"),
      time:  t("shippingReturns.shipping.zones.danang.time"),
      fee:   t("shippingReturns.shipping.zones.danang.fee"),
      areas: t("shippingReturns.shipping.zones.danang.areas"),
    },
  ];

  const returnReasons = [
    { reason: t("shippingReturns.returns.reasons.wrongSize.reason"),     timeLimit: t("shippingReturns.returns.reasons.wrongSize.timeLimit"),     fee: t("shippingReturns.returns.reasons.wrongSize.fee"),     condition: t("shippingReturns.returns.reasons.wrongSize.condition") },
    { reason: t("shippingReturns.returns.reasons.defective.reason"),     timeLimit: t("shippingReturns.returns.reasons.defective.timeLimit"),     fee: t("shippingReturns.returns.reasons.defective.fee"),     condition: t("shippingReturns.returns.reasons.defective.condition") },
    { reason: t("shippingReturns.returns.reasons.notSuitable.reason"),   timeLimit: t("shippingReturns.returns.reasons.notSuitable.timeLimit"),   fee: t("shippingReturns.returns.reasons.notSuitable.fee"),   condition: t("shippingReturns.returns.reasons.notSuitable.condition") },
    { reason: t("shippingReturns.returns.reasons.changeOfMind.reason"),  timeLimit: t("shippingReturns.returns.reasons.changeOfMind.timeLimit"),  fee: t("shippingReturns.returns.reasons.changeOfMind.fee"),  condition: t("shippingReturns.returns.reasons.changeOfMind.condition") },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-6">
            {t("shippingReturns.title")}
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-3xl mx-auto leading-relaxed">
            {t("shippingReturns.subtitle")}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Tabs */}
          <div className="flex justify-center mb-10">
            <div className="bg-secondary rounded-xl p-1.5 flex gap-1">
              <button
                onClick={() => setActiveTab("shipping")}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === "shipping"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {t("shippingReturns.tabs.shipping")}
              </button>
              <button
                onClick={() => setActiveTab("returns")}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === "returns"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {t("shippingReturns.tabs.returns")}
              </button>
            </div>
          </div>

          {/* Shipping Tab */}
          {activeTab === "shipping" && (
            <div className="space-y-8">
              {/* Delivery Process */}
              <div className="bg-secondary rounded-2xl p-8 border border-border">
                <h2 className="font-display text-2xl font-semibold mb-8 text-center">
                  {t("shippingReturns.shipping.deliveryProcess.title")}
                </h2>
                <div className="grid md:grid-cols-4 gap-6">
                  {[
                    { icon: CheckCircle, title: t("shippingReturns.shipping.deliveryProcess.steps.confirm.title"), desc: t("shippingReturns.shipping.deliveryProcess.steps.confirm.desc") },
                    { icon: Truck,       title: t("shippingReturns.shipping.deliveryProcess.steps.prepare.title"),  desc: t("shippingReturns.shipping.deliveryProcess.steps.prepare.desc") },
                    { icon: MapPin,      title: t("shippingReturns.shipping.deliveryProcess.steps.deliver.title"),  desc: t("shippingReturns.shipping.deliveryProcess.steps.deliver.desc") },
                    { icon: Shield,      title: t("shippingReturns.shipping.deliveryProcess.steps.inspect.title"),  desc: t("shippingReturns.shipping.deliveryProcess.steps.inspect.desc") },
                  ].map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={index} className="text-center">
                        <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon className="w-7 h-7 text-primary-foreground" />
                        </div>
                        <h3 className="font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground text-sm">{step.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Zones */}
              <div className="bg-secondary rounded-2xl p-8 border border-border">
                <h2 className="font-display text-2xl font-semibold mb-8 text-center">
                  {t("shippingReturns.shipping.deliveryZones.title")}
                </h2>
                <div className="space-y-4">
                  {deliveryZones.map((zone, index) => (
                    <div key={index} className="border border-border rounded-xl p-6 bg-background">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{zone.zone}</h3>
                          <p className="text-muted-foreground text-sm">{zone.areas}</p>
                        </div>
                        <div className="flex gap-8">
                          <div className="text-center">
                            <Clock className="w-5 h-5 text-accent mx-auto mb-1" />
                            <p className="text-sm font-medium">{zone.time}</p>
                            <p className="text-xs text-muted-foreground">{t("shippingReturns.shipping.deliveryZones.timeLabel")}</p>
                          </div>
                          <div className="text-center">
                            <Truck className="w-5 h-5 text-accent mx-auto mb-1" />
                            <p className="text-sm font-medium">{zone.fee}</p>
                            <p className="text-xs text-muted-foreground">{t("shippingReturns.shipping.deliveryZones.feeLabel")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Notes */}
              <div className="bg-secondary border border-border rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">{t("shippingReturns.shipping.notes.title")}</h3>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• {t("shippingReturns.shipping.notes.note1")}</li>
                      <li>• {t("shippingReturns.shipping.notes.note2")}</li>
                      <li>• {t("shippingReturns.shipping.notes.note3")}</li>
                      <li>• {t("shippingReturns.shipping.notes.note4")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Returns Tab */}
          {activeTab === "returns" && (
            <div className="space-y-8">
              {/* Return Reasons */}
              <div className="bg-secondary rounded-2xl p-8 border border-border">
                <h2 className="font-display text-2xl font-semibold mb-8 text-center">
                  {t("shippingReturns.returns.policy.title")}
                </h2>
                <div className="space-y-4">
                  {returnReasons.map((item, index) => (
                    <div key={index} className="border border-border rounded-xl p-6 bg-background">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{item.reason}</h3>
                          <p className="text-muted-foreground text-sm">{item.condition}</p>
                        </div>
                        <div className="flex gap-8">
                          <div className="text-center">
                            <Clock className="w-5 h-5 text-accent mx-auto mb-1" />
                            <p className="text-sm font-medium">{item.timeLimit}</p>
                            <p className="text-xs text-muted-foreground">{t("shippingReturns.returns.policy.timeLimitLabel")}</p>
                          </div>
                          <div className="text-center">
                            <RefreshCw className="w-5 h-5 text-accent mx-auto mb-1" />
                            <p className="text-sm font-medium">{item.fee}</p>
                            <p className="text-xs text-muted-foreground">{t("shippingReturns.returns.policy.feeLabel")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Return Process */}
              <div className="bg-secondary rounded-2xl p-8 border border-border">
                <h2 className="font-display text-2xl font-semibold mb-8 text-center">
                  {t("shippingReturns.returns.process.title")}
                </h2>
                <div className="grid md:grid-cols-4 gap-6">
                  {[
                    { icon: Phone,      title: t("shippingReturns.returns.process.steps.contact.title"), desc: t("shippingReturns.returns.process.steps.contact.desc") },
                    { icon: RefreshCw,  title: t("shippingReturns.returns.process.steps.confirm.title"), desc: t("shippingReturns.returns.process.steps.confirm.desc") },
                    { icon: Truck,      title: t("shippingReturns.returns.process.steps.pickup.title"),  desc: t("shippingReturns.returns.process.steps.pickup.desc") },
                    { icon: CheckCircle,title: t("shippingReturns.returns.process.steps.refund.title"),  desc: t("shippingReturns.returns.process.steps.refund.desc") },
                  ].map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={index} className="text-center">
                        <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon className="w-7 h-7 text-primary-foreground" />
                        </div>
                        <h3 className="font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground text-sm">{step.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Return Conditions */}
              <div className="bg-secondary border border-border rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">{t("shippingReturns.returns.conditions.title")}</h3>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• {t("shippingReturns.returns.conditions.condition1")}</li>
                      <li>• {t("shippingReturns.returns.conditions.condition2")}</li>
                      <li>• {t("shippingReturns.returns.conditions.condition3")}</li>
                      <li>• {t("shippingReturns.returns.conditions.condition4")}</li>
                      <li>• {t("shippingReturns.returns.conditions.condition5")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-20 text-center">
        <div className="container mx-auto px-4">
          <Truck className="w-12 h-12 mx-auto mb-6 text-primary-foreground/70" />
          <h2 className="font-display text-3xl font-semibold mb-4">
            {t("shippingReturns.support.title")}
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-8 max-w-xl mx-auto">
            {t("shippingReturns.support.description")}
          </p>
          <Button asChild size="lg" variant="secondary">
            <a
              href="https://web.facebook.com/share/18n4kf3A4A/?mibextid=wwXIfr&_rdc=1&_rdr"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("shippingReturns.support.chatButton")}
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
