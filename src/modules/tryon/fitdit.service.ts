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

// =========================
// ✅ ZeroGPU retry helpers
// =========================
function isZeroGpuTimeout(err: any) {
  const msg = String(err?.message || "");
  const title = String(err?.title || "");
  const rawTitle = String(err?.original_msg?.title || "");
  return (
    title.includes("ZeroGPU queue timeout") ||
    rawTitle.includes("ZeroGPU queue timeout") ||
    msg.includes("No GPU was available after 60s") ||
    msg.includes("ZeroGPU queue timeout")
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffMs(attempt: number) {
  // 1 -> ~1500ms, 2 -> ~3000ms, 3 -> ~6000ms, 4 -> ~10000-12000ms
  const base = Math.min(1500 * Math.pow(2, attempt - 1), 12_000);
  const jitter = Math.floor(Math.random() * 700);
  return base + jitter;
}

@Injectable()
export class FitditService {
  private clientPromise: Promise<any> | null = null;

  constructor(private readonly cloudinary: CloudinaryService) { }

  private async getClient() {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const { Client } = await import("@gradio/client");

        const envToken = process.env.HF_TOKEN;

        // ✅ runtime check: token phải bắt đầu bằng "hf_"
        const token =
          envToken && envToken.startsWith("hf_")
            ? (envToken as `hf_${string}`)
            : undefined;

        return Client.connect(
          "BoyuanJiang/FitDiT",
          token ? { token } : undefined
        );
      })();
    }
    return this.clientPromise;
  }

  private async predictWithRetry<T = any>(
    client: any,
    endpoint: string,
    payload: any[],
    opts?: { maxRetries?: number }
  ): Promise<T> {
    const maxRetries = opts?.maxRetries ?? 4;

    let lastErr: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return (await client.predict(endpoint, payload)) as T;
      } catch (err: any) {
        lastErr = err;

        // ✅ chỉ retry cho lỗi queue GPU
        if (!isZeroGpuTimeout(err)) throw err;

        if (attempt === maxRetries) break;

        const wait = backoffMs(attempt);
        console.log(
          `[FitDiT] ZeroGPU timeout on ${endpoint}. Retry ${attempt}/${maxRetries} after ${wait}ms`
        );
        await sleep(wait);
      }
    }

    console.log(`[FitDiT] lastErr =`, lastErr);

    // ✅ map sang lỗi dễ hiểu cho FE
    throw new BadRequestException(
      "Hệ thống AI đang quá tải (GPU queue). Vui lòng thử lại sau 10–30 giây."
    );
  }

  // ✅ ONE-STEP: tự run mask (ẩn) -> run try-on -> trả ảnh kết quả
  // ✅ SUPPORT: person file OR personUrl
  async process(args: {
    person?: Express.Multer.File; // ✅ optional
    personUrl?: string; // ✅ NEW
    garmentUrl: string;
    category: VtonCategory;
    offsets: { top: number; bottom: number; left: number; right: number };

    nSteps: number;
    imageScale: number;
    seed: number;
    numImages: number;
    resolution: "768x1024" | "1152x1536" | "1536x2048";
  }) {
    if (!args.person && !args.personUrl) {
      throw new BadRequestException("Missing person image (file or personUrl)");
    }
    if (!args.garmentUrl) throw new BadRequestException("Missing garmentUrl");
    if (!args.category) throw new BadRequestException("Missing category");
    if (!args.offsets) throw new BadRequestException("Missing offsets");

    // =========================
    // ✅ PERSON INPUT
    // =========================
    let personInputUrl = args.personUrl || "";
    let vtonBlob: Blob;

    if (args.personUrl) {
      // Lần 2: lấy ảnh person từ URL (resultUrl lần trước)
      vtonBlob = await urlToBlob(args.personUrl);
    } else {
      // Lần 1: upload person để lưu lại url + dùng fileToBlob
      const personUp = await this.cloudinary.uploadBuffer(args.person!.buffer, {
        folder: "smartdress/inputs/person",
      });
      personInputUrl = personUp.url;

      vtonBlob = fileToBlob(args.person!);
    }

    // =========================
    // ✅ GARMENT INPUT
    // =========================
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
    const garmBlob = await urlToBlob(garmentInputUrl);

    // =========================
    // ✅ STEP 1 (ẨN): generate_mask (AUTO-FIT bottom)
    // =========================
    const bottomCandidates =
      args.category === VtonCategory.UPPER_BODY
        ? [-140, -260, -360] // ✅ giảm số lần gọi để đỡ queue
        : [args.offsets.bottom];

    const MAX_BOTTOM_RATIO = 0.62;

    let bestPreMaskRaw: any = null;
    let bestPoseRaw: any = null;
    let bestMaskPreviewUrl: string | null = null;
    let bestPosePreviewUrl: string | null = null;

    for (const bottom of bottomCandidates) {
      const maskRes = await this.predictWithRetry(client, "/generate_mask", [
        vtonBlob,
        args.category,
        args.offsets.top,
        bottom,
        args.offsets.left,
        args.offsets.right,
      ], { maxRetries: 2 }); // ✅ mask retry ít hơn

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

      if (!maskPreviewUrl) continue;

      const ratio = await getMaskBottomRatio(maskPreviewUrl);

      // không đo được thì thôi, dùng fallback hiện tại
      if (ratio === null) break;

      // ok rồi thì dừng
      if (ratio <= MAX_BOTTOM_RATIO) break;
    }

    if (!bestPreMaskRaw || !bestPoseRaw) {
      throw new BadRequestException("FitDiT did not return preMask/pose");
    }

    // =========================
    // ✅ STEP 2: process try-on
    // =========================
    const outRes = await this.predictWithRetry(client, "/process", [
      vtonBlob,
      garmBlob,
      bestPreMaskRaw,
      bestPoseRaw,
      args.nSteps,
      args.imageScale,
      args.seed,
      args.numImages,
      args.resolution,
    ], { maxRetries: 5 }); // ✅ process retry nhiều hơn

    const gallery = outRes?.data?.[0] ?? outRes?.data ?? outRes;
    const items = Array.isArray(gallery) ? gallery : [gallery];

    const outputUrls: string[] = [];

    for (const it of items) {
      const url = pickOutUrl(client, it);
      if (!url) continue;

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
      inputs: { personUrl: personInputUrl, garmentUrl: garmentInputUrl },
      preview: { maskUrl: bestMaskPreviewUrl, poseUrl: bestPosePreviewUrl },
      outputs: outputUrls,
      resultUrl: outputUrls[0] ?? null,
      raw: { gallery },
    };
  }
}
