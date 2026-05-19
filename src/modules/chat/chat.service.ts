import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "../products/entities/product.entity";
import { ProductStatus } from "../products/enums/product-status.enum";
import { ChatDto } from "./dto/chat.dto";

// Concise FAQ — shorter = fewer tokens per request
const FAQ: Record<string, string> = {
  vi: `Chính sách thuê đồ Wardrobe Wonders:
- Đặt cọc: hoàn trả sau khi trả hàng đúng hạn, nguyên vẹn.
- Giao hàng TP.HCM, 1–2 ngày làm việc, phí ship theo quãng cách.
- Trả trễ: tính phí theo ngày. Hàng phải không rách/bẩn nặng.
- Thanh toán: chuyển khoản TPBank qua QR. SePay tự động xác nhận.
- Đổi size: liên hệ admin trước khi giao.
- Hỗ trợ: Facebook https://web.facebook.com/share/18n4kf3A4A/`,

  en: `Wardrobe Wonders rental policy:
- Deposit refunded after on-time return in good condition.
- Delivery in HCMC, 1–2 business days, distance-based fee.
- Late return: daily fee. Items must be undamaged.
- Payment: TPBank QR transfer. SePay auto-confirmation.
- Size swap: contact admin before delivery.
- Support: Facebook https://web.facebook.com/share/18n4kf3A4A/`,

  ja: `Wardrobe Wondersレンタルポリシー:
- デポジット: 期日通り良好な状態で返却後に返金。
- ホーチミン市内配送、1〜2営業日、距離に応じた送料。
- 延滞: 1日ごと追加料金。商品は破損・汚損なしで返却。
- 支払い: TPBank QR振込。SePay自動確認対応。
- サイズ交換: 配送前に管理者に連絡。
- サポート: Facebook https://web.facebook.com/share/18n4kf3A4A/`,
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  // Override via GEMINI_MODEL env var on Render if needed
  private readonly model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash-lite";

  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {
    if (!process.env.GEMINI_API_KEY) {
      this.logger.warn("⚠️  GEMINI_API_KEY is NOT set — all chat requests will return fallback");
    } else {
      this.logger.log(`✅ GEMINI_API_KEY configured, model=${this.model}`);
    }
  }

  async chat(dto: ChatDto) {
    const lang = (["vi", "en", "ja"].includes(dto.language ?? "") ? dto.language : "vi") as string;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      this.logger.warn("[chat] GEMINI_API_KEY missing — returning fallback");
      return { message: this.fallbackMessage(lang), products: [] };
    }

    const products = await this.productsRepo.find({
      where: { status: ProductStatus.AVAILABLE },
      relations: ["category", "variants"],
      take: 25, // reduced from 60 to cut token usage
    });

    // Slim product shape — only fields AI needs for recommendations
    const productSummary = products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category?.name ?? "",
      occasion: p.occasion ?? "",
      color: p.color ?? "",
      rentPricePerDay: p.rentPricePerDay,
      sizes: p.variants?.filter((v) => v.stock > 0).map((v) => v.size) ?? [],
    }));

    const systemPrompt = this.buildSystemPrompt(lang, productSummary);

    try {
      const reply = await this.callGeminiWithRetry(geminiKey, systemPrompt, dto.messages, lang);
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
    } catch (err: any) {
      this.logger.error(`[chat] Final error after retries: ${err?.message ?? err}`);
      return { message: this.fallbackMessage(lang), products: [] };
    }
  }

  private buildSystemPrompt(lang: string, products: any[]): string {
    const langInstruction: Record<string, string> = {
      vi: "Trả lời CHỈ bằng tiếng Việt.",
      en: "Reply ONLY in English.",
      ja: "日本語のみで返答してください。",
    };

    return `You are a friendly fashion consultant for Wardrobe Wonders, a Vietnamese clothing rental platform.
${langInstruction[lang] ?? langInstruction.vi}
Keep replies to 2–4 sentences.

RENTAL POLICY:
${FAQ[lang] ?? FAQ.vi}

AVAILABLE PRODUCTS (JSON):
${JSON.stringify(products)}

When recommending outfits, end your message with:
PRODUCTS:[id1,id2,id3]
For FAQ questions, just answer in plain text — no PRODUCTS block.
Never invent products not in the list above.`;
  }

  /** Calls Gemini, retries once after delay on 429 rate-limit. */
  private async callGeminiWithRetry(
    apiKey: string,
    systemPrompt: string,
    messages: { role: string; content: string }[],
    lang: string,
    attempt = 0,
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;

    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Gemini requires contents to start with a user turn
    if (!contents.length || contents[0].role !== "user") {
      contents.unshift({ role: "user", parts: [{ text: "Xin chào" }] });
    }

    // Ensure alternating turns: if two consecutive same roles, remove duplicates
    const deduped: typeof contents = [];
    for (const turn of contents) {
      if (deduped.length > 0 && deduped[deduped.length - 1].role === turn.role) {
        // Merge content into previous turn instead of creating consecutive same-role turns
        deduped[deduped.length - 1].parts[0].text += "\n" + turn.parts[0].text;
      } else {
        deduped.push(turn);
      }
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: deduped,
        generationConfig: { temperature: 0.6, maxOutputTokens: 512 },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`[callGemini] attempt=${attempt} HTTP ${res.status}: ${body.slice(0, 300)}`);

      // Retry once on rate limit
      if (res.status === 429 && attempt === 0) {
        this.logger.warn("[callGemini] Rate limited (429) — retrying after 3s");
        await new Promise((r) => setTimeout(r, 3000));
        return this.callGeminiWithRetry(apiKey, systemPrompt, messages, lang, 1);
      }

      throw new Error(`Gemini HTTP ${res.status}`);
    }

    const data = await res.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      this.logger.warn(`[callGemini] Empty response from Gemini. Full response: ${JSON.stringify(data).slice(0, 400)}`);
    }

    return text;
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
