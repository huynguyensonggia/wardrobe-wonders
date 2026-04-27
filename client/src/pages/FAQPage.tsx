import { ChevronDown, ChevronUp, HelpCircle, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function FAQPage() {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const faqCategories = [
    {
      title: t("faq.categories.service.title"),
      questions: [
        { question: t("faq.categories.service.questions.whatIsAiCloset.question"), answer: t("faq.categories.service.questions.whatIsAiCloset.answer") },
        { question: t("faq.categories.service.questions.rentalDuration.question"), answer: t("faq.categories.service.questions.rentalDuration.answer") },
        { question: t("faq.categories.service.questions.howToRent.question"),      answer: t("faq.categories.service.questions.howToRent.answer") },
        { question: t("faq.categories.service.questions.deposit.question"),        answer: t("faq.categories.service.questions.deposit.answer") },
      ],
    },
    {
      title: t("faq.categories.sizeQuality.title"),
      questions: [
        { question: t("faq.categories.sizeQuality.questions.sizeSelection.question"), answer: t("faq.categories.sizeQuality.questions.sizeSelection.answer") },
        { question: t("faq.categories.sizeQuality.questions.cleanliness.question"),   answer: t("faq.categories.sizeQuality.questions.cleanliness.answer") },
        { question: t("faq.categories.sizeQuality.questions.damage.question"),        answer: t("faq.categories.sizeQuality.questions.damage.answer") },
        { question: t("faq.categories.sizeQuality.questions.tryBefore.question"),     answer: t("faq.categories.sizeQuality.questions.tryBefore.answer") },
      ],
    },
    {
      title: t("faq.categories.deliveryPayment.title"),
      questions: [
        { question: t("faq.categories.deliveryPayment.questions.deliveryArea.question"),    answer: t("faq.categories.deliveryPayment.questions.deliveryArea.answer") },
        { question: t("faq.categories.deliveryPayment.questions.deliveryTime.question"),    answer: t("faq.categories.deliveryPayment.questions.deliveryTime.answer") },
        { question: t("faq.categories.deliveryPayment.questions.paymentMethods.question"),  answer: t("faq.categories.deliveryPayment.questions.paymentMethods.answer") },
        { question: t("faq.categories.deliveryPayment.questions.notHome.question"),         answer: t("faq.categories.deliveryPayment.questions.notHome.answer") },
      ],
    },
    {
      title: t("faq.categories.returnsPolicy.title"),
      questions: [
        { question: t("faq.categories.returnsPolicy.questions.returnCases.question"),   answer: t("faq.categories.returnsPolicy.questions.returnCases.answer") },
        { question: t("faq.categories.returnsPolicy.questions.returnProcess.question"), answer: t("faq.categories.returnsPolicy.questions.returnProcess.answer") },
        { question: t("faq.categories.returnsPolicy.questions.lateFee.question"),       answer: t("faq.categories.returnsPolicy.questions.lateFee.answer") },
        { question: t("faq.categories.returnsPolicy.questions.insurance.question"),     answer: t("faq.categories.returnsPolicy.questions.insurance.answer") },
      ],
    },
    {
      title: t("faq.categories.promotionsMembership.title"),
      questions: [
        { question: t("faq.categories.promotionsMembership.questions.promotions.question"),        answer: t("faq.categories.promotionsMembership.questions.promotions.answer") },
        { question: t("faq.categories.promotionsMembership.questions.vipMembership.question"),     answer: t("faq.categories.promotionsMembership.questions.vipMembership.answer") },
        { question: t("faq.categories.promotionsMembership.questions.referral.question"),          answer: t("faq.categories.promotionsMembership.questions.referral.answer") },
        { question: t("faq.categories.promotionsMembership.questions.styleConsultation.question"), answer: t("faq.categories.promotionsMembership.questions.styleConsultation.answer") },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-6">
            {t("faq.title")}
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-3xl mx-auto leading-relaxed">
            {t("faq.subtitle")}
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="space-y-8">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-secondary rounded-2xl p-8 border border-border">
                <h2 className="font-display text-2xl font-semibold mb-6 text-center">
                  {category.title}
                </h2>
                <div className="space-y-3">
                  {category.questions.map((faq, faqIndex) => {
                    const itemIndex = categoryIndex * 100 + faqIndex;
                    const isOpen = openItems.includes(itemIndex);
                    return (
                      <div key={faqIndex} className="border border-border rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleItem(itemIndex)}
                          className="w-full px-6 py-4 text-left bg-background hover:bg-muted transition-colors flex items-center justify-between"
                        >
                          <h3 className="font-medium pr-4">{faq.question}</h3>
                          {isOpen
                            ? <ChevronUp className="w-5 h-5 text-accent flex-shrink-0" />
                            : <ChevronDown className="w-5 h-5 text-accent flex-shrink-0" />
                          }
                        </button>
                        {isOpen && (
                          <div className="px-6 py-4 bg-secondary border-t border-border">
                            <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-20 text-center">
        <div className="container mx-auto px-4">
          <HelpCircle className="w-12 h-12 mx-auto mb-6 text-primary-foreground/70" />
          <h2 className="font-display text-3xl font-semibold mb-4">{t("faq.cta.title")}</h2>
          <p className="text-primary-foreground/70 text-lg mb-8 max-w-xl mx-auto">
            {t("faq.cta.subtitle")}
          </p>
          <Button asChild size="lg" variant="secondary">
            <a
              href="https://web.facebook.com/share/18n4kf3A4A/?mibextid=wwXIfr&_rdc=1&_rdr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              {t("faq.cta.chatFacebook")}
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
