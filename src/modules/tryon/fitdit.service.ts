import { BadRequestException, Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { CloudinaryService } from "../../common/cloudinary/cloudinary.service";
import { VtonCategory } from "../../modules/categories/enums/vton-category.enum";

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
  const root = client?.config?.root_url || client?.root_url || "https://boyuanjiang-fitdit.hf.space";
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

@Injectable()
export class FitditService {
  private clientPromise: Promise<any> | null = null;

  // ✅ cache job cho Step1 -> Step2 (giữ đúng object preMask/pose)
  private maskJobs = new Map<string, { preMask: any; pose: any; createdAt: number }>();

  constructor(private readonly cloudinary: CloudinaryService) {}

  private pruneJobs(ttlMs = 10 * 60 * 1000) {
    const now = Date.now();
    for (const [id, v] of this.maskJobs.entries()) {
      if (now - v.createdAt > ttlMs) this.maskJobs.delete(id);
    }
  }

  private async getClient() {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const { Client } = await import("@gradio/client");
        return Client.connect("BoyuanJiang/FitDiT");
      })();
    }
    return this.clientPromise;
  }

  // ✅ STEP 1: generate mask (trả jobId + mask preview url)
  async generateMask(args: {
    person: Express.Multer.File;
    category: VtonCategory;
    offsets: { top: number; bottom: number; left: number; right: number };
  }) {
    this.pruneJobs();

    const personUp = await this.cloudinary.uploadBuffer(args.person.buffer, {
      folder: "smartdress/inputs/person",
    });

    const client = await this.getClient();
    const vtonBlob = fileToBlob(args.person);

    const maskRes = await client.predict("/generate_mask", [
      vtonBlob,
      args.category,
      args.offsets.top,
      args.offsets.bottom,
      args.offsets.left,
      args.offsets.right,
    ]);

    const preMaskRaw = maskRes?.data?.[0]; // ImageEditor object
    const poseRaw = maskRes?.data?.[1];    // FileData

    const maskPreviewUrl =
      preMaskRaw?.composite?.url ||
      preMaskRaw?.layers?.[0]?.url ||
      preMaskRaw?.background?.url ||
      null;

    const posePreviewUrl = poseRaw?.url ?? resolveGradioFileUrl(client, poseRaw);

    if (!maskPreviewUrl || !posePreviewUrl) {
      console.log("maskRes.data =", maskRes?.data);
      console.log("preMaskRaw =", preMaskRaw);
      console.log("poseRaw =", poseRaw);
      throw new BadRequestException("FitDiT did not return mask/pose urls");
    }

    const jobId = crypto.randomUUID();
    this.maskJobs.set(jobId, { preMask: preMaskRaw, pose: poseRaw, createdAt: Date.now() });

    return {
      jobId,
      inputs: { personUrl: personUp.url },
      preview: { maskUrl: maskPreviewUrl, poseUrl: posePreviewUrl },
    };
  }

  // ✅ STEP 2: process (nhận jobId, lấy object cached)
  async process(args: {
    jobId: string;
    person: Express.Multer.File;
    garmentUrl: string;

    nSteps: number;
    imageScale: number;
    seed: number;
    numImages: number;
    resolution: "768x1024" | "1152x1536" | "1536x2048";
  }) {
    this.pruneJobs();

    const job = this.maskJobs.get(args.jobId);
    if (!job) throw new BadRequestException("Mask job expired/not found. Run Step 1 again.");
    if (!args.garmentUrl) throw new BadRequestException("Missing garmentUrl");

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

    const preMask = job.preMask; // ImageEditor object
    const poseImage = job.pose;  // FileData object

    const outRes = await client.predict("/process", [
      vtonBlob,
      garmBlob,
      preMask,
      poseImage,
      args.nSteps,
      args.imageScale,
      args.seed,
      args.numImages,
      args.resolution,
    ]);

    // xong thì xoá job cho sạch RAM
    this.maskJobs.delete(args.jobId);

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
      outputs: outputUrls,
      resultUrl: outputUrls[0] ?? null,
      raw: { gallery },
    };
  }
}
