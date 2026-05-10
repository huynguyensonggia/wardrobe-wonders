import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "../products/entities/product.entity";
import { ProductStatus } from "../products/enums/product-status.enum";
import { RecommendDto } from "./dto/recommend.dto";

function inferSize(height: number, weight: number): string[] {
  const bmi = weight / ((height / 100) ** 2);
  if (height < 155) {
    if (bmi < 18.5) return ["XS", "S"];
    if (bmi < 23) return ["S", "M"];
    return ["M", "L"];
  }
  if (height < 163) {
    if (bmi < 18.5) return ["S"];
    if (bmi < 23) return ["S", "M"];
    if (bmi < 27) return ["M", "L"];
    return ["L", "XL"];
  }
  if (height < 170) {
    if (bmi < 18.5) return ["S", "M"];
    if (bmi < 23) return ["M"];
    if (bmi < 27) return ["M", "L"];
    return ["L", "XL"];
  }
  if (bmi < 18.5) return ["S", "M"];
  if (bmi < 23) return ["M", "L"];
  if (bmi < 27) return ["L", "XL"];
  return ["XL", "XXL"];
}

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async recommend(dto: RecommendDto) {
    const allProducts = await this.productsRepo.find({
      where: { status: ProductStatus.AVAILABLE },
      relations: ["category", "variants"],
    });

    const suggestedSizes = inferSize(dto.height, dto.weight);
    const lang = dto.language ?? "vi";

    const categoryKeywords = dto.category
      ? dto.category.toLowerCase().split(/[,،]+/).map((s) => s.trim()).filter(Boolean)
      : [];

    const occasionKeywords = dto.occasion
      ? dto.occasion.toLowerCase().split(/[,،]+/).map((s) => s.trim()).filter(Boolean)
      : [];

    let filtered = allProducts.filter((p) => {
      const hasSuitableSize =
        suggestedSizes.length === 0 ||
        p.variants?.some((v) => suggestedSizes.includes(v.size) && v.stock > 0);

      const productCatName = (p.category?.name ?? "").toLowerCase();
      const categoryMatch =
        categoryKeywords.length === 0 ||
        categoryKeywords.some((kw) => productCatName.includes(kw) || kw.includes(productCatName));

      const productOccasion = (p.occasion ?? "").toLowerCase();
      const occasionMatch =
        occasionKeywords.length === 0 ||
        occasionKeywords.some((kw) => productOccasion.includes(kw) || kw.includes(productOccasion));

      return hasSuitableSize && categoryMatch && occasionMatch;
    });

    if (filtered.length < 5) {
      filtered = allProducts.filter((p) =>
        suggestedSizes.length === 0 ||
        p.variants?.some((v) => suggestedSizes.includes(v.size) && v.stock > 0)
      );
    }

    if (filtered.length < 5) filtered = allProducts.slice(0, 50);

    const candidates = filtered.slice(0, 30);

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return candidates.slice(0, 5).map((p) => ({
        product: this.toProductLite(p),
        reason: this.fallbackReason(lang),
      }));
    }

    const productList = candidates.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category?.name ?? "",
      occasion: p.occasion,
      color: p.color,
      rentPricePerDay: p.rentPricePerDay,
      sizes: p.variants?.filter((v) => v.stock > 0).map((v) => v.size) ?? [],
    }));

    const prompt = this.buildPrompt(dto, productList, suggestedSizes, lang);

    try {
      const geminiResult = await this.callGemini(geminiKey, prompt);
      return this.parseGeminiResponse(geminiResult, candidates);
    } catch {
      return candidates.slice(0, 5).map((p) => ({
        product: this.toProductLite(p),
        reason: this.fallbackReason(lang),
      }));
    }
  }

  private fallbackReason(lang: string): string {
    if (lang === "ja") return "あなたのサイズとスタイルに合っています。";
    if (lang === "en") return "Suitable for your measurements and style preferences.";
    return "Phù hợp với số đo và phong cách của bạn.";
  }

  private buildPrompt(dto: RecommendDto, products: any[], sizes: string[], lang: string) {
    const langInstruction = {
      ja: 'Respond in Japanese. Each "reason" must be in Japanese.',
      en: 'Respond in English. Each "reason" must be in English.',
      vi: 'Respond in Vietnamese. Each "reason" must be in Vietnamese.',
    }[lang] ?? 'Respond in Vietnamese.';

    const measurements = [
      lang === "ja" ? `身長: ${dto.height}cm` : lang === "en" ? `Height: ${dto.height}cm` : `Chiều cao: ${dto.height}cm`,
      lang === "ja" ? `体重: ${dto.weight}kg` : lang === "en" ? `Weight: ${dto.weight}kg` : `Cân nặng: ${dto.weight}kg`,
      dto.bust  ? (lang === "ja" ? `バスト: ${dto.bust}cm`  : lang === "en" ? `Bust: ${dto.bust}cm`  : `Vòng ngực: ${dto.bust}cm`)  : null,
      dto.waist ? (lang === "ja" ? `ウエスト: ${dto.waist}cm` : lang === "en" ? `Waist: ${dto.waist}cm` : `Vòng eo: ${dto.waist}cm`) : null,
      dto.hips  ? (lang === "ja" ? `ヒップ: ${dto.hips}cm`  : lang === "en" ? `Hips: ${dto.hips}cm`  : `Vòng hông: ${dto.hips}cm`)  : null,
    ].filter(Boolean).join(", ");

    const noPreference = lang === "ja" ? "指定なし" : lang === "en" ? "no preference" : "không có yêu cầu";

    return `You are a professional fashion stylist. ${langInstruction}

Customer information:
- Measurements: ${measurements}
- Suggested sizes: ${sizes.join(", ")}
- Favorite colors: ${dto.favoriteColors || noPreference}
- Clothing type: ${dto.category || noPreference}
- Occasion: ${dto.occasion || noPreference}
- Style preference: ${dto.stylePreference || noPreference}

${dto.favoriteColors ? `⚠️ COLOR PRIORITY: Customer wants "${dto.favoriteColors}" tones. Prioritize products whose "color" field matches or is similar. Only pick other colors if fewer than 5 matching products exist.` : ""}
${dto.occasion ? `⚠️ OCCASION PRIORITY: Customer needs outfits for "${dto.occasion}". Prioritize products matching this occasion.` : ""}
${dto.stylePreference ? `⚠️ STYLE PRIORITY: Customer prefers "${dto.stylePreference}" style. Factor this into your selection and reasoning.` : ""}

Available products (JSON):
${JSON.stringify(products, null, 2)}

Select the 5 most suitable products. For each, write a short personalized reason (1-2 sentences) explaining WHY it suits this specific customer's body measurements, occasion, and style preferences.
Return ONLY valid JSON, no markdown:
[
  { "id": <product_id>, "reason": "<reason in the required language>" },
  ...
]`;
  }

  private async callGemini(apiKey: string, prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
    const data = await res.json() as any;
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  }

  private parseGeminiResponse(raw: string, candidates: Product[]) {
    const productMap = new Map(candidates.map((p) => [p.id, p]));
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found");
      const items: { id: number; reason: string }[] = JSON.parse(jsonMatch[0]);
      return items
        .filter((x) => productMap.has(x.id))
        .slice(0, 5)
        .map((x) => ({
          product: this.toProductLite(productMap.get(x.id)!),
          reason: x.reason,
        }));
    } catch {
      return candidates.slice(0, 5).map((p) => ({
        product: this.toProductLite(p),
        reason: "Phù hợp với số đo và phong cách của bạn.",
      }));
    }
  }

  private toProductLite(p: Product) {
    return {
      id: p.id,
      name: p.name,
      nameEn: (p as any).nameEn ?? null,
      nameJa: (p as any).nameJa ?? null,
      imageUrl: p.imageUrl,
      rentPricePerDay: p.rentPricePerDay,
      deposit: p.deposit,
      color: p.color,
      occasion: p.occasion,
      category: p.category?.name ?? "",
      sizes: p.variants?.filter((v) => v.stock > 0).map((v) => v.size) ?? [],
    };
  }
}
