import { Injectable } from "@nestjs/common";
import { CloudinaryService } from "../../common/cloudinary/cloudinary.service";
import { VtonCategory } from "../../modules/categories/enums/vton-category.enum";

function fileToBlob(f: Express.Multer.File) {
  return new Blob([new Uint8Array(f.buffer)], {
    type: f.mimetype || "image/png",
  });
}

function pickUrl(item: any): string | null {
  if (!item) return null;
  if (typeof item === "string") return item;
  if (typeof item?.url === "string") return item.url;
  if (typeof item?.path === "string") return item.path;
  return null;
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

  async run(args: {
    person: Express.Multer.File;
    garment: Express.Multer.File;
    category: VtonCategory;
    resolution: "768x1024" | "1152x1536" | "1536x2048";
    nSteps: number;
    imageScale: number;
    seed: number;
    numImages: number;
    offsets: { top: number; bottom: number; left: number; right: number };
  }) {
    // 1️⃣ upload inputs
    const [personUp, garmentUp] = await Promise.all([
      this.cloudinary.uploadBuffer(args.person.buffer, {
        folder: "smartdress/inputs/person",
      }),
      this.cloudinary.uploadBuffer(args.garment.buffer, {
        folder: "smartdress/inputs/garment",
      }),
    ]);

    // 2️⃣ call FitDiT
    const client = await this.getClient();

    const vtonBlob = fileToBlob(args.person);
    const garmBlob = fileToBlob(args.garment);

    const maskRes = await client.predict("/generate_mask", [
      vtonBlob,
      args.category,
      args.offsets.top,
      args.offsets.bottom,
      args.offsets.left,
      args.offsets.right,
    ]);

    const preMask = maskRes.data?.[0];
    const poseImage = maskRes.data?.[1];

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

    // 3️⃣ outputs
    const gallery = outRes.data?.[0] ?? outRes.data;
    const items = Array.isArray(gallery) ? gallery : [gallery];

    const outputUrls: string[] = [];
    for (const it of items) {
      const url = pickUrl(it);
      if (!url) continue;

      const up = await this.cloudinary.uploadFromUrl(url, {
        folder: "smartdress/outputs/fitdit",
      });
      outputUrls.push(up.url);
    }

    return {
      inputs: {
        personUrl: personUp.url,
        garmentUrl: garmentUp.url,
      },
      outputs: outputUrls,
      raw: { gallery },
    };
  }
}
