import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { CloudinaryService } from "../../common/cloudinary/cloudinary.service";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

@Injectable()
export class FitditService {
  constructor(private readonly cloudinary: CloudinaryService) {}

  // Signature kept identical so the controller needs no changes.
  async process(args: {
    person?: Express.Multer.File;
    personUrl?: string;
    garmentUrl: string;
    category?: any;
    offsets?: any;
    nSteps?: number;
    imageScale?: number;
    seed?: number;
    numImages?: number;
    resolution?: string;
  }) {
    if (!args.person && !args.personUrl) {
      throw new BadRequestException("Missing person image (file or personUrl)");
    }
    if (!args.garmentUrl) throw new BadRequestException("Missing garmentUrl");

    const apiKey = process.env.FASHN_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException("Tính năng AI Try-On chưa được cấu hình.");
    }

    // ── Person — cần URL để gửi cho FASHN ────────────────────────────────────
    let personInputUrl = args.personUrl || "";
    if (!args.personUrl) {
      const up = await this.cloudinary.uploadBuffer(args.person!.buffer, {
        folder: "smartdress/inputs/person",
      });
      personInputUrl = up.url;
    }

    // ── Garment ───────────────────────────────────────────────────────────────
    let garmentInputUrl = args.garmentUrl;
    try {
      const up = await this.cloudinary.uploadFromUrl(args.garmentUrl, {
        folder: "smartdress/inputs/garment",
      });
      garmentInputUrl = up.url;
    } catch {
      // keep original URL
    }

    // ── Start FASHN job ───────────────────────────────────────────────────────
    const seed = Number.isFinite(args.seed) && (args.seed ?? -1) >= 0 ? args.seed! : 42;

    const runRes = await fetch("https://api.fashn.ai/v1/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model_name: "tryon-max",
        inputs: {
          model_image: personInputUrl,
          product_image: garmentInputUrl,
        },
        seed,
        resolution: "1k",
        output_format: "jpeg",
      }),
    });

    if (!runRes.ok) {
      const body = await runRes.text();
      console.error("[FASHN] run error:", body);
      throw new BadRequestException("Try-on service temporarily unavailable");
    }

    const { id, error: runError } = (await runRes.json()) as { id: string; error: string | null };
    if (runError) {
      console.error("[FASHN] job error:", runError);
      throw new BadRequestException("Try-on job failed, please try again");
    }

    console.log(`[FASHN] Job started: ${id}`);

    // ── Poll status ───────────────────────────────────────────────────────────
    const outputUrl = await this.pollStatus(id, apiKey);

    // ── Upload result to Cloudinary ───────────────────────────────────────────
    let finalUrl = outputUrl;
    try {
      const up = await this.cloudinary.uploadFromUrl(outputUrl, {
        folder: "smartdress/outputs/fitdit",
      });
      finalUrl = up.url;
    } catch {
      console.log("[FASHN] Cloudinary upload failed, using FASHN url:", outputUrl);
    }

    return {
      inputs: { personUrl: personInputUrl, garmentUrl: garmentInputUrl },
      preview: { maskUrl: null, poseUrl: null },
      outputs: [finalUrl],
      resultUrl: finalUrl,
      raw: {},
    };
  }

  private async pollStatus(id: string, apiKey: string): Promise<string> {
    // Max 30 attempts × 5s = 150s (FASHN max processing time is 120s)
    for (let i = 0; i < 30; i++) {
      await sleep(5_000);

      const res = await fetch(`https://api.fashn.ai/v1/status/${id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) continue;

      const data = (await res.json()) as {
        id: string;
        status: string;
        output?: string[];
        error?: string | null;
      };

      console.log(`[FASHN] status: ${data.status}`);

      if (data.status === "completed") {
        const url = data.output?.[0];
        if (!url) throw new BadRequestException("FASHN returned no output image");
        return url;
      }

      if (data.status === "failed") {
        throw new BadRequestException(`FASHN failed: ${data.error ?? "unknown error"}`);
      }

      // status: "starting" | "in-queue" | "processing" — continue polling
    }

    throw new BadRequestException(
      "Hệ thống AI xử lý quá lâu. Vui lòng thử lại."
    );
  }
}
