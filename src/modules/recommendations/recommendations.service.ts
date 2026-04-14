import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "../products/entities/product.entity";
import { ProductStatus } from "../products/enums/product-status.enum";
import { RecommendDto } from "./dto/recommend.dto";

// ─── Size mapping theo chiều cao + cân nặng ───────────────────────────────────
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
  // >= 170
  if (bmi < 18.5) return ["S", "M"];
  if (bmi < 23) return ["M", "L"];
  if (bmi < 27) return ["L", "XL"];
  return ["XL", "XXL"];
}

// ─── Occasion mapping ─────────────────────────────────────────────────────────
function mapOccasion(input: string): string[] {
  const s = input.toLowerCase();
  const result: string[] = [];
  if (s.includes("tiệc") || s.includes("party") || s.includes("event")) result.push("party");
  if (s.includes("cưới") || s.includes("wedding")) result.push("wedding");
  if (s.includes("casual") || s.includes("thường") || s.includes("ngày")) result.push("casual");
  return result.length ? result : [];
}

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async recommend(dto: RecommendDto) {
    // 1. Lấy tất cả sản phẩm available, kèm category + variants
    const allProducts = await this.productsRepo.find({
      where: { status: ProductStatus.AVAILABLE },
      relations: ["category", "variants"],
    });

    // 2. Rule-based filter
    const suggestedSizes = inferSize(dto.height, dto.weight);
    const occasionFilter = dto.occasion ? mapOccasion(dto.occasion) : [];
    const colorKeywords = dto.favoriteColors
      ? dto.favoriteColors.toLowerCase().split(/[,،\s]+/).filter(Boolean)
      : [];

    let filtered = allProducts.filter((p) => {
      // Có size phù hợp trong variants
      const hasSuitableSize =
        suggestedSizes.length === 0 ||
        p.variants?.some((v) => suggestedSizes.includes(v.size) && v.stock > 0);

      // Occasion khớp (nếu có filter)
      const occasionMatch =
        occasionFilter.length === 0 ||
        occasionFilter.includes(p.occasion?.toLowerCase());

      // Màu sắc khớp (nếu có filter) — so sánh loose
      const productColor = (p.color ?? "").toLowerCase();
      const colorMatch =
        colorKeywords.length === 0 ||
        colorKeywords.some((kw) => productColor.includes(kw) || kw.includes(productColor));

      return hasSuitableSize && occasionMatch && colorMatch;
    });

    // Nếu filter màu quá chặt (< 5 kết quả) → bỏ filter màu, giữ size + occasion
    if (filtered.length < 5) {
      filtered = allProducts.filter((p) => {
        const hasSuitableSize =
          suggestedSizes.length === 0 ||
          p.variants?.some((v) => suggestedSizes.includes(v.size) && v.stock > 0);
        const occasionMatch =
          occasionFilter.length === 0 ||
          occasionFilter.includes(p.occasion?.toLowerCase());
        return hasSuitableSize && occasionMatch;
      });
    }

    // Fallback cuối: lấy tất cả nếu vẫn < 5
    if (filtered.length < 5) filtered = allProducts.slice(0, 50);

    // Sắp xếp: ưu tiên sản phẩm khớp màu lên đầu
    if (colorKeywords.length > 0) {
      filtered.sort((a, b) => {
        const aMatch = colorKeywords.some((kw) =>
          (a.color ?? "").toLowerCase().includes(kw) || kw.includes((a.color ?? "").toLowerCase())
        );
        const bMatch = colorKeywords.some((kw) =>
          (b.color ?? "").toLowerCase().includes(kw) || kw.includes((b.color ?? "").toLowerCase())
        );
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    }

    // Giới hạn 30 sản phẩm gửi lên Gemini
    const candidates = filtered.slice(0, 30);

    // 3. Gọi Gemini để rank + giải thích
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      // Fallback: trả về rule-based kết quả không có giải thích
      return candidates.slice(0, 5).map((p) => ({
        product: this.toProductLite(p),
        reason: "Phù hợp với số đo và phong cách của bạn.",
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

    const prompt = this.buildPrompt(dto, productList, suggestedSizes);

    try {
      const geminiResult = await this.callGemini(geminiKey, prompt);
      const parsed = this.parseGeminiResponse(geminiResult, candidates);
      return parsed;
    } catch {
      // Nếu Gemini lỗi → fallback rule-based
      return candidates.slice(0, 5).map((p) => ({
        product: this.toProductLite(p),
        reason: "Phù hợp với số đo và phong cách của bạn.",
      }));
    }
  }

  // ─── Build prompt ────────────────────────────────────────────────────────────
  private buildPrompt(dto: RecommendDto, products: any[], sizes: string[]) {
    const measurements = [
      `Chiều cao: ${dto.height}cm`,
      `Cân nặng: ${dto.weight}kg`,
      dto.bust ? `Vòng ngực: ${dto.bust}cm` : null,
      dto.waist ? `Vòng eo: ${dto.waist}cm` : null,
      dto.hips ? `Vòng hông: ${dto.hips}cm` : null,
    ]
      .filter(Boolean)
      .join(", ");

    return `Bạn là chuyên gia tư vấn thời trang. Khách hàng có thông tin sau:
- Số đo: ${measurements}
- Size phù hợp: ${sizes.join(", ")}
- Màu yêu thích: ${dto.favoriteColors || "không có yêu cầu"}
- Dịp mặc: ${dto.occasion || "không có yêu cầu"}
- Phong cách: ${dto.style || "không có yêu cầu"}

${dto.favoriteColors ? `⚠️ QUAN TRỌNG: Khách hàng yêu cầu màu "${dto.favoriteColors}". Hãy ưu tiên chọn sản phẩm có màu này trước. Chỉ chọn màu khác nếu không còn lựa chọn nào phù hợp.` : ""}

Danh sách sản phẩm có sẵn (JSON):
${JSON.stringify(products, null, 2)}

Hãy chọn ra 5 sản phẩm phù hợp nhất và giải thích ngắn gọn lý do (1-2 câu mỗi sản phẩm).
Trả về JSON theo đúng format sau, không thêm gì khác:
[
  { "id": <product_id>, "reason": "<lý do bằng tiếng Việt>" },
  ...
]`;
  }

  // ─── Gọi Gemini Flash API ────────────────────────────────────────────────────
  private async callGemini(apiKey: string, prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    });

    if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
    const data = await res.json() as any;
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  }

  // ─── Parse response Gemini ───────────────────────────────────────────────────
  private parseGeminiResponse(raw: string, candidates: Product[]) {
    const productMap = new Map(candidates.map((p) => [p.id, p]));

    try {
      // Tách JSON ra khỏi markdown code block nếu có
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
