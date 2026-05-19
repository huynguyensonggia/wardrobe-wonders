import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "../products/entities/product.entity";
import { ProductStatus } from "../products/enums/product-status.enum";
import { ChatDto } from "./dto/chat.dto";

const FAQ = {
  vi: `
## Chính sách thuê đồ – Wardrobe Wonders

**Đặt cọc:**
- Mỗi sản phẩm có mức đặt cọc riêng (hiển thị trên trang sản phẩm).
- Đặt cọc được hoàn trả sau khi trả hàng đúng hạn và nguyên vẹn.

**Giao & nhận hàng:**
- Giao hàng trong TP.HCM, phí ship tính theo quãng cách.
- Thời gian giao: 1–2 ngày làm việc sau khi xác nhận đơn.
- Khách nhận hàng, kiểm tra ngay — nếu không ưng có thể từ chối nhận (hàng sẽ được đánh dấu "Trả về khi giao").

**Trả hàng:**
- Trả đúng hạn ghi trong đơn thuê.
- Hàng phải còn nguyên vẹn, không rách/bẩn nặng.
- Trả trễ: tính thêm phí theo ngày.

**Thanh toán:**
- Chuyển khoản ngân hàng (TPBank) qua mã QR khi checkout.
- Hỗ trợ SePay tự động xác nhận.

**Đổi size:**
- Liên hệ admin trước khi giao để đổi size nếu còn hàng.

**Liên hệ hỗ trợ:**
- Facebook: https://web.facebook.com/share/18n4kf3A4A/
`,
  en: `
## Rental Policy – Wardrobe Wonders

**Deposit:**
- Each product has its own deposit amount (shown on the product page).
- Deposit is refunded after on-time return in good condition.

**Delivery:**
- Delivery within Ho Chi Minh City, shipping fee based on distance.
- Delivery time: 1–2 business days after order confirmation.
- Inspect items upon receipt — you may refuse if unsatisfied (marked as "Returned on delivery").

**Returns:**
- Return by the due date shown on your rental order.
- Items must be intact, not torn or heavily soiled.
- Late returns: additional daily fee applies.

**Payment:**
- Bank transfer (TPBank) via QR code at checkout.
- SePay auto-confirmation supported.

**Size exchange:**
- Contact admin before delivery to swap sizes if available.

**Support:**
- Facebook: https://web.facebook.com/share/18n4kf3A4A/
`,
  ja: `
## レンタルポリシー – Wardrobe Wonders

**デポジット:**
- 商品ごとにデポジット金額が異なります（商品ページに表示）。
- 期日通りに返却し、状態が良好であればデポジットは返金されます。

**配送:**
- ホーチミン市内配送。送料は距離により異なります。
- 注文確認後、1〜2営業日以内に配送。
- 受け取り時に商品を確認し、不満があれば受け取り拒否可能（「配送時返品」として記録）。

**返却:**
- レンタル注文に記載された期日までに返却。
- 商品は破損・汚損なく元の状態で返却。
- 延滞：1日ごとに追加料金が発生。

**お支払い:**
- チェックアウト時にQRコードで銀行振込（TPBank）。
- SePay自動確認対応。

**サイズ交換:**
- 配送前に在庫があればサイズ交換可能。管理者にご連絡ください。

**サポート:**
- Facebook: https://web.facebook.com/share/18n4kf3A4A/
`,
};

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async chat(dto: ChatDto) {
    const lang = dto.language ?? "vi";
    const geminiKey = process.env.GEMINI_API_KEY;

    const products = await this.productsRepo.find({
      where: { status: ProductStatus.AVAILABLE },
      relations: ["category", "variants"],
      take: 60,
    });

    const productSummary = products.map((p) => ({
      id: p.id,
      name: p.name,
      nameEn: (p as any).nameEn ?? null,
      nameJa: (p as any).nameJa ?? null,
      category: p.category?.name ?? "",
      occasion: p.occasion,
      color: p.color,
      rentPricePerDay: p.rentPricePerDay,
      deposit: p.deposit,
      sizes: p.variants?.filter((v) => v.stock > 0).map((v) => v.size) ?? [],
    }));

    const systemPrompt = this.buildSystemPrompt(lang, productSummary);

    if (!geminiKey) {
      return { message: this.fallbackMessage(lang), products: [] };
    }

    try {
      const reply = await this.callGemini(geminiKey, systemPrompt, dto.messages);
      const { message, suggestedIds } = this.parseReply(reply);

      const suggestedProducts = suggestedIds.length > 0
        ? products
            .filter((p) => suggestedIds.includes(p.id))
            .slice(0, 4)
            .map((p) => ({
              id: p.id,
              name: p.name,
              nameEn: (p as any).nameEn ?? null,
              nameJa: (p as any).nameJa ?? null,
              imageUrl: p.imageUrl,
              rentPricePerDay: p.rentPricePerDay,
              deposit: p.deposit,
              occasion: p.occasion,
            }))
        : [];

      return { message, products: suggestedProducts };
    } catch {
      return { message: this.fallbackMessage(lang), products: [] };
    }
  }

  private buildSystemPrompt(lang: string, products: any[]): string {
    const langMap: Record<string, string> = {
      vi: "Respond ONLY in Vietnamese.",
      en: "Respond ONLY in English.",
      ja: "Respond ONLY in Japanese.",
    };

    return `You are a friendly fashion consultant for Wardrobe Wonders, a Vietnamese clothing rental platform.
${langMap[lang] ?? langMap.vi}

Your role:
1. Help users find suitable clothing from the catalog based on their needs (occasion, body type, style, budget).
2. Answer questions about rental policies, delivery, returns, deposits, and payments.
3. Be warm, helpful, and concise (2–4 sentences per reply max).

RENTAL POLICY KNOWLEDGE:
${FAQ[lang as keyof typeof FAQ] ?? FAQ.vi}

AVAILABLE PRODUCTS (JSON):
${JSON.stringify(products)}

RESPONSE FORMAT:
- For outfit recommendations: include product suggestions by ending your message with a JSON block on its own line:
  PRODUCTS:[1,2,3]
  (use actual product IDs from the catalog above)
- For FAQ/policy questions: just answer in plain text, no PRODUCTS block needed.
- Never make up products that aren't in the catalog.
- If asked about a specific product not in catalog, say it's not currently available.`;
  }

  private async callGemini(
    apiKey: string,
    systemPrompt: string,
    messages: { role: string; content: string }[],
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I'm ready to help customers of Wardrobe Wonders." }] },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ];

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 512 },
      }),
    });

    if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
    const data = await res.json() as any;
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  private parseReply(raw: string): { message: string; suggestedIds: number[] } {
    const match = raw.match(/PRODUCTS:\[([^\]]*)\]/);
    if (!match) return { message: raw.trim(), suggestedIds: [] };

    const ids = match[1]
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    const message = raw.replace(/PRODUCTS:\[[^\]]*\]/, "").trim();
    return { message, suggestedIds: ids };
  }

  private fallbackMessage(lang: string): string {
    if (lang === "ja") return "申し訳ありませんが、現在AIアシスタントが利用できません。Facebookページよりお問い合わせください。";
    if (lang === "en") return "Sorry, the AI assistant is temporarily unavailable. Please contact us via Facebook.";
    return "Xin lỗi, trợ lý AI tạm thời không khả dụng. Vui lòng liên hệ qua Facebook để được hỗ trợ.";
  }
}
