import { Injectable } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!,
      secure: true,
    });
  }

  uploadBuffer(
    buffer: Buffer,
    opts?: {
      folder?: string;
      publicId?: string;
      resourceType?: "image" | "raw" | "video";
    },
  ): Promise<{ url: string; public_id: string }> {
    const folder =
      opts?.folder ?? process.env.CLOUDINARY_FOLDER ?? "smartdress";
    const resourceType = opts?.resourceType ?? "image";

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, public_id: opts?.publicId, resource_type: resourceType },
        (err, result) => {
          if (err) return reject(err);
          resolve({ url: result!.secure_url, public_id: result!.public_id });
        },
      );
      stream.end(buffer);
    });
  }

  async uploadFromUrl(
    url: string,
    opts?: { folder?: string; publicId?: string },
  ): Promise<{ url: string; public_id: string }> {
    const folder =
      opts?.folder ?? process.env.CLOUDINARY_FOLDER ?? "smartdress";
    const res = await cloudinary.uploader.upload(url, {
      folder,
      public_id: opts?.publicId,
      resource_type: "image",
    });
    return { url: res.secure_url, public_id: res.public_id };
  }
}
