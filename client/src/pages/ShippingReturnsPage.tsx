import {
  Truck,
  Clock,
  Shield,
  RefreshCw,
  MapPin,
  Phone,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ShippingReturnsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("shipping");

  const deliveryZones = [
    {
      zone: t("shippingReturns.shipping.zones.danang.name"),
      time: t("shippingReturns.shipping.zones.danang.time"),
      fee: t("shippingReturns.shipping.zones.danang.fee"),
      areas: t("shippingReturns.shipping.zones.danang.areas"),
    },
  ];

  const returnReasons = [
    {
      reason: t("shippingReturns.returns.reasons.wrongSize.reason"),
      timeLimit: t("shippingReturns.returns.reasons.wrongSize.timeLimit"),
      fee: t("shippingReturns.returns.reasons.wrongSize.fee"),
      condition: t("shippingReturns.returns.reasons.wrongSize.condition"),
    },
    {
      reason: t("shippingReturns.returns.reasons.defective.reason"),
      timeLimit: t("shippingReturns.returns.reasons.defective.timeLimit"),
      fee: t("shippingReturns.returns.reasons.defective.fee"),
      condition: t("shippingReturns.returns.reasons.defective.condition"),
    },
    {
      reason: t("shippingReturns.returns.reasons.notSuitable.reason"),
      timeLimit: t("shippingReturns.returns.reasons.notSuitable.timeLimit"),
      fee: t("shippingReturns.returns.reasons.notSuitable.fee"),
      condition: t("shippingReturns.returns.reasons.notSuitable.condition"),
    },
    {
      reason: t("shippingReturns.returns.reasons.changeOfMind.reason"),
      timeLimit: t("shippingReturns.returns.reasons.changeOfMind.timeLimit"),
      fee: t("shippingReturns.returns.reasons.changeOfMind.fee"),
      condition: t("shippingReturns.returns.reasons.changeOfMind.condition"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t("shippingReturns.title")}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t("shippingReturns.subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-2xl p-2 shadow-lg">
            <button
              onClick={() => setActiveTab("shipping")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "shipping"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-gray-600 hover:text-amber-500"
              }`}
            >
              {t("shippingReturns.tabs.shipping")}
            </button>
            <button
              onClick={() => setActiveTab("returns")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "returns"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-gray-600 hover:text-amber-500"
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
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-8 text-center">
                {t("shippingReturns.shipping.deliveryProcess.title")}
              </h2>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  {
                    icon: CheckCircle,
                    title: t(
                      "shippingReturns.shipping.deliveryProcess.steps.confirm.title"
                    ),
                    desc: t(
                      "shippingReturns.shipping.deliveryProcess.steps.confirm.desc"
                    ),
                  },
                  {
                    icon: Truck,
                    title: t(
                      "shippingReturns.shipping.deliveryProcess.steps.prepare.title"
                    ),
                    desc: t(
                      "shippingReturns.shipping.deliveryProcess.steps.prepare.desc"
                    ),
                  },
                  {
                    icon: MapPin,
                    title: t(
                      "shippingReturns.shipping.deliveryProcess.steps.deliver.title"
                    ),
                    desc: t(
                      "shippingReturns.shipping.deliveryProcess.steps.deliver.desc"
                    ),
                  },
                  {
                    icon: Shield,
                    title: t(
                      "shippingReturns.shipping.deliveryProcess.steps.inspect.title"
                    ),
                    desc: t(
                      "shippingReturns.shipping.deliveryProcess.steps.inspect.desc"
                    ),
                  },
                ].map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-8 h-8 text-amber-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Zones */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-8 text-center">
                {t("shippingReturns.shipping.deliveryZones.title")}
              </h2>
              <div className="space-y-4">
                {deliveryZones.map((zone, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-6 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-2">
                          {zone.zone}
                        </h3>
                        <p className="text-gray-600 text-sm">{zone.areas}</p>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-center">
                          <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                          <p className="text-sm font-medium text-gray-900">
                            {zone.time}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t(
                              "shippingReturns.shipping.deliveryZones.timeLabel"
                            )}
                          </p>
                        </div>
                        <div className="text-center">
                          <Truck className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                          <p className="text-sm font-medium text-gray-900">
                            {zone.fee}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t(
                              "shippingReturns.shipping.deliveryZones.feeLabel"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Notes */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-2">
                    {t("shippingReturns.shipping.notes.title")}
                  </h3>
                  <ul className="text-amber-700 space-y-1 text-sm">
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
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-8 text-center">
                {t("shippingReturns.returns.policy.title")}
              </h2>
              <div className="space-y-4">
                {returnReasons.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-6 hover:border-orange-300 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-2">
                          {item.reason}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {item.condition}
                        </p>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-center">
                          <Clock className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                          <p className="text-sm font-medium text-gray-900">
                            {item.timeLimit}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t("shippingReturns.returns.policy.timeLimitLabel")}
                          </p>
                        </div>
                        <div className="text-center">
                          <RefreshCw className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                          <p className="text-sm font-medium text-gray-900">
                            {item.fee}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t("shippingReturns.returns.policy.feeLabel")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Return Process */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-8 text-center">
                {t("shippingReturns.returns.process.title")}
              </h2>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  {
                    icon: Phone,
                    title: t(
                      "shippingReturns.returns.process.steps.contact.title"
                    ),
                    desc: t(
                      "shippingReturns.returns.process.steps.contact.desc"
                    ),
                  },
                  {
                    icon: RefreshCw,
                    title: t(
                      "shippingReturns.returns.process.steps.confirm.title"
                    ),
                    desc: t(
                      "shippingReturns.returns.process.steps.confirm.desc"
                    ),
                  },
                  {
                    icon: Truck,
                    title: t(
                      "shippingReturns.returns.process.steps.pickup.title"
                    ),
                    desc: t(
                      "shippingReturns.returns.process.steps.pickup.desc"
                    ),
                  },
                  {
                    icon: CheckCircle,
                    title: t(
                      "shippingReturns.returns.process.steps.refund.title"
                    ),
                    desc: t(
                      "shippingReturns.returns.process.steps.refund.desc"
                    ),
                  },
                ].map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-8 h-8 text-orange-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Return Conditions */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">
                    {t("shippingReturns.returns.conditions.title")}
                  </h3>
                  <ul className="text-red-700 space-y-1 text-sm">
                    <li>
                      • {t("shippingReturns.returns.conditions.condition1")}
                    </li>
                    <li>
                      • {t("shippingReturns.returns.conditions.condition2")}
                    </li>
                    <li>
                      • {t("shippingReturns.returns.conditions.condition3")}
                    </li>
                    <li>
                      • {t("shippingReturns.returns.conditions.condition4")}
                    </li>
                    <li>
                      • {t("shippingReturns.returns.conditions.condition5")}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-12 text-white">
            <Truck className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="font-display text-3xl font-bold mb-4">
              {t("shippingReturns.support.title")}
            </h2>
            <p className="text-xl mb-8 opacity-90">
              {t("shippingReturns.support.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://web.facebook.com/share/18n4kf3A4A/?mibextid=wwXIfr&_rdc=1&_rdr"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-amber-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-colors"
              >
                {t("shippingReturns.support.chatButton")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
