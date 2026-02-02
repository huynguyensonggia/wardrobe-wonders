import { BadRequestException, Injectable } from "@nestjs/common";
import { CloudinaryService } from "../../common/cloudinary/cloudinary.service";
import { VtonCategory } from "../../modules/categories/enums/vton-category.enum";
import sharp from "sharp";

function fileToBlob(f: Express.Multer.File) {
  return new Blob([new Uint8Array(f.buffer)], { type: f.mimetype || "image/png" });
}

async function urlToBlob(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new BadRequestException(`Cannot fetch url: ${url}`);
  const contentType = res.headers.get("content-type") || "image/png";
  const ab = await res.arrayBuffer();
  return new Blob([new Uint8Array(ab)], { type: contentType });
}

function getRootUrl(client: any) {
  const root =
    client?.config?.root_url ||
    client?.root_url ||
    "https://boyuanjiang-fitdit.hf.space";
  return String(root).replace(/\/$/, "");
}

// fallback: nếu url relative hoặc chỉ có path
function resolveGradioFileUrl(client: any, item: any): string | null {
  if (!item) return null;
  const root = getRootUrl(client);

  if (typeof item === "string") {
    if (item.startsWith("http")) return item;
    if (item.startsWith("/")) return root + item;
    return root + "/" + item;
  }

  const u = typeof item?.url === "string" ? item.url : null;
  if (u) {
    if (u.startsWith("http")) return u;
    if (u.startsWith("/")) return root + u;
    return root + "/" + u;
  }

  const p = typeof item?.path === "string" ? item.path : null;
  if (p) {
    // hf space hay có dạng /gradio_api/file=...
    return `${root}/gradio_api/file=${p}`;
  }

  return null;
}

function firstOfTuple(x: any) {
  // Gradio đôi khi trả [file, caption] hoặc [file, ...]
  return Array.isArray(x) ? x[0] : x;
}

function pickOutUrl(client: any, item: any): string | null {
  const x = firstOfTuple(item);
  if (!x) return null;

  // direct string
  if (typeof x === "string") return resolveGradioFileUrl(client, x) ?? x;

  // common shapes
  const u =
    x?.url ||
    x?.image?.url ||
    x?.data?.url ||
    x?.data?.[0]?.url ||
    x?.value?.url ||
    x?.value?.[0]?.url;

  if (typeof u === "string") return resolveGradioFileUrl(client, u) ?? u;

  const p =
    x?.path ||
    x?.image?.path ||
    x?.data?.[0]?.path ||
    x?.value?.path ||
    x?.value?.[0]?.path;

  if (typeof p === "string") return resolveGradioFileUrl(client, { path: p });

  return null;
}

// ✅ lấy mask preview url từ ImageEditor object (robust)
function pickMaskPreviewUrl(client: any, preMaskRaw: any): string | null {
  if (!preMaskRaw) return null;

  const maybe =
    preMaskRaw?.composite?.url ||
    preMaskRaw?.composite?.path ||
    preMaskRaw?.layers?.[0]?.url ||
    preMaskRaw?.layers?.[0]?.path ||
    preMaskRaw?.background?.url ||
    preMaskRaw?.background?.path ||
    null;

  if (!maybe) return null;

  // nếu string thì resolve
  if (typeof maybe === "string") return resolveGradioFileUrl(client, maybe) ?? maybe;

  // nếu object {url/path}
  return resolveGradioFileUrl(client, maybe);
}

// ✅ đo mask “dính xuống thấp” hay không bằng alpha bottom
async function getMaskBottomRatio(maskUrl: string): Promise<number | null> {
  try {
    const res = await fetch(maskUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());

    const img = sharp(buf).ensureAlpha();
    const meta = await img.metadata();
    if (!meta.width || !meta.height) return null;

    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;

    let bottomY = -1;

    // tìm pixel thấp nhất có alpha > 10
    for (let y = h - 1; y >= 0; y--) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const a = data[idx + 3];
        if (a > 10) {
          bottomY = y;
          break;
        }
      }
      if (bottomY !== -1) break;
    }

    if (bottomY === -1) return 0;
    return bottomY / h; // 0..1
  } catch {
    return null;
  }
}

@Injectable()
export class FitditService {
  private clientPromise: Promise<any> | null = null;

  constructor(private readonly cloudinary: CloudinaryService) {}

  private async getClient() {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const { Client } = await import("@gradio/client");
        return Client.connect("BoyuanJiang/FitDiT");
      })();
    }
    return this.clientPromise;
  }

  // ✅ ONE-STEP: tự run mask (ẩn) -> run try-on -> trả ảnh kết quả
  async process(args: {
    person: Express.Multer.File;
    garmentUrl: string;
    category: VtonCategory;
    offsets: { top: number; bottom: number; left: number; right: number };

    nSteps: number;
    imageScale: number;
    seed: number;
    numImages: number;
    resolution: "768x1024" | "1152x1536" | "1536x2048";
  }) {
    if (!args.person) throw new BadRequestException("Missing person image");
    if (!args.garmentUrl) throw new BadRequestException("Missing garmentUrl");
    if (!args.category) throw new BadRequestException("Missing category");
    if (!args.offsets) throw new BadRequestException("Missing offsets");

    // ✅ upload person 1 lần
    const personUp = await this.cloudinary.uploadBuffer(args.person.buffer, {
      folder: "smartdress/inputs/person",
    });

    // optional: ổn định garmentUrl (upload cloudinary)
    let garmentInputUrl = args.garmentUrl;
    try {
      const garmentUp = await this.cloudinary.uploadFromUrl(args.garmentUrl, {
        folder: "smartdress/inputs/garment",
      });
      garmentInputUrl = garmentUp.url;
    } catch {
      garmentInputUrl = args.garmentUrl;
    }

    const client = await this.getClient();

    const vtonBlob = fileToBlob(args.person);
    const garmBlob = await urlToBlob(garmentInputUrl);

    // =========================
    // ✅ STEP 1 (ẨN): generate_mask (AUTO-FIT bottom)
    // =========================

    // ✅ chỉ auto-loop cho Upper-body (vì lỗi quần/đùi thường xảy ra ở đây)
    const bottomCandidates =
      args.category === VtonCategory.UPPER_BODY
        ? [-140, -220, -300, -380] // bạn có thể tăng/giảm tuỳ dataset
        : [args.offsets.bottom];

    // ✅ nếu mask xuống quá 62% chiều cao => coi là dính quần/đùi
    const MAX_BOTTOM_RATIO = 0.62;

    let bestPreMaskRaw: any = null;
    let bestPoseRaw: any = null;
    let bestMaskPreviewUrl: string | null = null;
    let bestPosePreviewUrl: string | null = null;

    for (const bottom of bottomCandidates) {
      const maskRes = await client.predict("/generate_mask", [
        vtonBlob,
        args.category,
        args.offsets.top,
        bottom,
        args.offsets.left,
        args.offsets.right,
      ]);

      const preMaskRaw = maskRes?.data?.[0]; // ImageEditor object
      const poseRaw = maskRes?.data?.[1]; // FileData object

      if (!preMaskRaw || !poseRaw) continue;

      const maskPreviewUrl = pickMaskPreviewUrl(client, preMaskRaw);
      const posePreviewUrl = poseRaw?.url ?? resolveGradioFileUrl(client, poseRaw);

      // lưu fallback
      bestPreMaskRaw = preMaskRaw;
      bestPoseRaw = poseRaw;
      bestMaskPreviewUrl = maskPreviewUrl;
      bestPosePreviewUrl = posePreviewUrl;

      // nếu không lấy được mask url thì thôi, thử candidate khác
      if (!maskPreviewUrl) continue;

      const ratio = await getMaskBottomRatio(maskPreviewUrl);

      // ratio null => không đo được => tạm accept (để không fail)
      if (ratio === null) {
        break;
      }

      // ✅ nếu mask không dính xuống quá thấp -> chọn và dừng
      if (ratio <= MAX_BOTTOM_RATIO) {
        break;
      }

      // nếu ratio > MAX_BOTTOM_RATIO => dính quần/đùi -> thử bottom âm hơn
    }

    if (!bestPreMaskRaw || !bestPoseRaw) {
      throw new BadRequestException("FitDiT did not return preMask/pose");
    }

    // =========================
    // ✅ STEP 2: process try-on
    // =========================
    const outRes = await client.predict("/process", [
      vtonBlob,
      garmBlob,
      bestPreMaskRaw,
      bestPoseRaw,
      args.nSteps,
      args.imageScale,
      args.seed,
      args.numImages,
      args.resolution,
    ]);

    // ✅ robust parse output
    const gallery = outRes?.data?.[0] ?? outRes?.data ?? outRes;
    const items = Array.isArray(gallery) ? gallery : [gallery];

    const outputUrls: string[] = [];

    for (const it of items) {
      const url = pickOutUrl(client, it);
      if (!url) continue;

      // ✅ upload cloudinary fail thì fallback hf url để FE vẫn hiển thị
      try {
        const up = await this.cloudinary.uploadFromUrl(url, {
          folder: "smartdress/outputs/fitdit",
        });
        outputUrls.push(up.url);
      } catch (e) {
        console.log("Cloudinary uploadFromUrl failed, fallback to hf url:", url);
        outputUrls.push(url);
      }
    }

    if (outputUrls.length === 0) {
      console.log("outRes.data =", outRes?.data);
      throw new BadRequestException("FitDiT returned empty outputs");
    }

    return {
      inputs: { personUrl: personUp.url, garmentUrl: garmentInputUrl },

      // optional debug (FE có thể bỏ qua)
      preview: { maskUrl: bestMaskPreviewUrl, poseUrl: bestPosePreviewUrl },

      outputs: outputUrls,
      resultUrl: outputUrls[0] ?? null,
      raw: { gallery },
    };
  }
}
