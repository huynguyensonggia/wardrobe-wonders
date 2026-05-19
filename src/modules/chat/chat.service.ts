import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "../products/entities/product.entity";
import { ProductStatus } from "../products/enums/product-status.enum";
import { ChatDto } from "./dto/chat.dto";

const FAQ: Record<string, string> = {
  vi: `Quy trình thuê đồ Wardrobe Wonders:
- Khách hàng tự chọn sản phẩm, size và ngày thuê trực tiếp trên website.
- Đặt đơn xong, admin xác nhận và giao hàng trong khu vực Đà Nẵng (miễn phí ship, thường trong vòng 2-3 tiếng).
- Thanh toán tiền thuê và tiền cọc trực tiếp khi giao/nhận hàng (tiền mặt).
- Tiền cọc hoàn trả sau khi trả hàng, hàng không hư hỏng.
- Trả trễ: chỉ tính phí theo ngày, không liên quan đến tiền cọc.
- Hỗ trợ: Facebook https://web.facebook.com/share/18n4kf3A4A/`,
  en: `Wardrobe Wonders rental process:
- Customers self-select products, size and rental dates directly on the website.
- After placing the order, admin confirms and delivers within Da Nang area (free shipping, usually within 2-3 hours).
- Payment (rental fee + deposit) is made in cash upon delivery/pickup.
- Deposit refunded after on-time return in good condition.
- Late return: daily fee applies. Items must be undamaged.
- Support: Facebook https://web.facebook.com/share/18n4kf3A4A/`,
  ja: `Wardrobe Wondersレンタルの流れ:
- お客様はウェブサイトで直接商品・サイズ・レンタル日を選択できます。
- 注文後、管理者が確認してダナンエリア内に配送します（送料無料、通常2〜3時間以内）。
- 支払い（レンタル料＋デポジット）は配送時に現金払い。
- デポジットは期日通り良好な状態で返却後に返金。
- 延滞: 1日ごと追加料金。商品は破損・汚損なしで返却。
- サポート: Facebook https://web.facebook.com/share/18n4kf3A4A/`,
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.0-flash-lite";

  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (groqKey) {
      this.logger.log("✅ Provider: Groq (GROQ_API_KEY configured)");
    } else if (geminiKey) {
      this.logger.log(`✅ Provider: Gemini (model=${this.geminiModel})`);
    } else {
      this.logger.warn("⚠️  No AI key set (GROQ_API_KEY or GEMINI_API_KEY) — chat will return fallback");
    }
  }

  async chat(dto: ChatDto) {
    const lang = (["vi", "en", "ja"].includes(dto.language ?? "") ? dto.language : "vi") as string;
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      this.logger.warn("[chat] No AI provider configured");
      return { message: this.fallbackMessage(lang), products: [] };
    }

    const products = await this.productsRepo.find({
      where: { status: ProductStatus.AVAILABLE },
      relations: ["category", "variants"],
      order: { id: "DESC" },
      take: 40,
    });

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
      const reply = groqKey
        ? await this.callGroq(groqKey, systemPrompt, dto.messages)
        : await this.callGeminiWithRetry(geminiKey!, systemPrompt, dto.messages, 0);

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
      this.logger.error(`[chat] Failed: ${err?.message ?? err}`);
      return { message: this.fallbackMessage(lang), products: [] };
    }
  }

  // ─── Groq (primary — OpenAI-compatible, generous free tier) ─────────────────
  private async callGroq(
    apiKey: string,
    systemPrompt: string,
    messages: { role: string; content: string }[],
  ): Promise<string> {
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const body = {
      model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      ],
      temperature: 0.6,
      max_tokens: 512,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`[callGroq] HTTP ${res.status}: ${err.slice(0, 300)}`);
      throw new Error(`Groq HTTP ${res.status}`);
    }

    const data = await res.json() as any;
    return data?.choices?.[0]?.message?.content ?? "";
  }

  // ─── Gemini (fallback — kept for when GROQ_API_KEY not available) ─────────────
  private async callGeminiWithRetry(
    apiKey: string,
    systemPrompt: string,
    messages: { role: string; content: string }[],
    attempt: number,
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${apiKey}`;

    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    if (!contents.length || contents[0].role !== "user") {
      contents.unshift({ role: "user", parts: [{ text: "Xin chào" }] });
    }

    // Merge consecutive same-role turns to prevent Gemini 400 errors
    const deduped: typeof contents = [];
    for (const turn of contents) {
      if (deduped.length > 0 && deduped[deduped.length - 1].role === turn.role) {
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
      if (res.status === 429 && attempt === 0) {
        this.logger.warn("[callGemini] Rate limited — retrying after 3s");
        await new Promise((r) => setTimeout(r, 3000));
        return this.callGeminiWithRetry(apiKey, systemPrompt, messages, 1);
      }
      throw new Error(`Gemini HTTP ${res.status}`);
    }

    const data = await res.json() as any;
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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

When recommending outfits, you MUST end your message with EXACTLY this format (no spaces, no variations):
PRODUCTS:[id1,id2,id3]
Example: PRODUCTS:[422,425,428]
For FAQ questions, just answer in plain text — no PRODUCTS block.
Never invent products not in the list above.
IMPORTANT: Never mention product IDs, numbers, or any technical identifiers (like "ID: 442", "#442", "PRODUCTS: 422, 425") in your message text. The PRODUCTS:[...] line is hidden from users — only product cards will be shown.`;
  }

  private parseReply(raw: string): { message: string; suggestedIds: number[] } {
    // Match both PRODUCTS:[1,2,3] and PRODUCTS: 1, 2, 3 variants
    const match = raw.match(/PRODUCTS:\s*\[?([0-9, ]+)\]?/i);
    if (!match) return { message: raw.trim(), suggestedIds: [] };

    const ids = match[1]
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    const cleaned = raw.replace(/PRODUCTS:\s*\[?[0-9, ]+\]?/i, "").trim();
    return { message: cleaned, suggestedIds: ids };
  }

  private fallbackMessage(lang: string): string {
    if (lang === "ja") return "申し訳ありませんが、現在AIアシスタントが利用できません。Facebookページよりお問い合わせください。";
    if (lang === "en") return "Sorry, the AI assistant is temporarily unavailable. Please contact us via Facebook.";
    return "Xin lỗi, trợ lý AI tạm thời không khả dụng. Vui lòng liên hệ qua Facebook để được hỗ trợ.";
  }
}
