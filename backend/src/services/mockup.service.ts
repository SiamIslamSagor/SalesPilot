/**
 * Mockup Generation Service
 *
 * Uses the Vercel AI Gateway to route requests to Google Gemini image models
 * (Nano Banana / gemini-2.5-flash-image) for product mockup generation.
 * The model receives the product image + logo/design image and composites
 * the logo onto the product realistically.
 *
 * Required environment variable:
 *   AI_GATEWAY_API_KEY – Vercel AI Gateway key (vck_...)
 */

import { createGateway, generateText } from "ai";
import { uploadToCloudinary } from "../utils/cloudinary";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

interface MockupRequest {
  /** URL of the product image */
  productImageUrl: string;
  /** Base64-encoded logo/design image (data URI or raw base64) */
  logoImage: string;
}

interface MockupResponse {
  success: boolean;
  /** The generated mockup image URL (hosted on Cloudinary) */
  mockupImageUrl?: string;
  message?: string;
}

interface MockupBatchItem {
  /** Index to correlate results back to the original item */
  index: number;
  /** URL of the product image */
  productImageUrl: string;
}

interface MockupBatchRequest {
  /** Base64-encoded logo/design image (shared across all items) */
  logoImage: string;
  /** Product items to generate mockups for */
  items: MockupBatchItem[];
}

interface MockupBatchResultItem {
  index: number;
  success: boolean;
  mockupImageUrl?: string;
  message?: string;
}

interface MockupBatchResponse {
  success: boolean;
  results: MockupBatchResultItem[];
  message?: string;
}

class MockupService {
  /**
   * Validate that a URL is safe to fetch (not an internal/private resource).
   * Prevents SSRF attacks.
   */
  private validateExternalUrl(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("Invalid image URL");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Only HTTP(S) image URLs are allowed");
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block private/internal IP ranges and metadata endpoints
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./, // AWS metadata
      /^0\./,
      /^\[::1\]$/,
      /^metadata\.google/i,
      /^metadata\.internal/i,
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        throw new Error("Fetching internal or private URLs is not allowed");
      }
    }
  }

  /**
   * Fetch a remote image and return it as a Buffer.
   */
  private async fetchImageAsBuffer(url: string): Promise<Buffer> {
    this.validateExternalUrl(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "error",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch image from URL: ${res.status}`);
      }
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        throw new Error("URL did not return an image");
      }
      return Buffer.from(await res.arrayBuffer());
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Parse a data-URI or raw base64 string into a Buffer.
   */
  private parseBase64ToBuffer(input: string): Buffer {
    const dataUriMatch = input.match(/^data:image\/[a-z+]+;base64,(.+)$/i);
    if (dataUriMatch) {
      return Buffer.from(dataUriMatch[1], "base64");
    }
    return Buffer.from(input, "base64");
  }

  /**
   * Read width/height from a PNG or JPEG buffer.
   */
  private getImageDimensions(
    buf: Buffer,
  ): { width: number; height: number } | null {
    // PNG: bytes 16-23 contain width (4 bytes) and height (4 bytes) in IHDR
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      return { width, height };
    }
    // JPEG: scan for SOF0 (0xFFC0) or SOF2 (0xFFC2) marker
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let offset = 2;
      while (offset < buf.length - 9) {
        if (buf[offset] !== 0xff) break;
        const marker = buf[offset + 1];
        if (marker === 0xc0 || marker === 0xc2) {
          const height = buf.readUInt16BE(offset + 5);
          const width = buf.readUInt16BE(offset + 7);
          return { width, height };
        }
        const segLen = buf.readUInt16BE(offset + 2);
        offset += 2 + segLen;
      }
    }
    return null;
  }

  /**
   * Find the closest Gemini-supported aspect ratio for the given dimensions.
   * Supported: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
   */
  private getClosestAspectRatio(width: number, height: number): string {
    const supported = [
      { label: "1:1", ratio: 1 },
      { label: "2:3", ratio: 2 / 3 },
      { label: "3:2", ratio: 3 / 2 },
      { label: "3:4", ratio: 3 / 4 },
      { label: "4:3", ratio: 4 / 3 },
      { label: "4:5", ratio: 4 / 5 },
      { label: "5:4", ratio: 5 / 4 },
      { label: "9:16", ratio: 9 / 16 },
      { label: "16:9", ratio: 16 / 9 },
      { label: "21:9", ratio: 21 / 9 },
    ];
    const imageRatio = width / height;
    let best = supported[0];
    let bestDiff = Math.abs(imageRatio - best.ratio);
    for (const entry of supported) {
      const diff = Math.abs(imageRatio - entry.ratio);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = entry;
      }
    }
    return best.label;
  }

  /**
   * Generates a mockup image by sending the product image and logo to
   * Google Gemini via the Vercel AI Gateway using generateText (multimodal).
   */
  async generateMockup(request: MockupRequest): Promise<MockupResponse> {
    if (!process.env.AI_GATEWAY_API_KEY) {
      console.error("[MockupService] AI_GATEWAY_API_KEY is not configured");
      return {
        success: false,
        message:
          "Mockup service is not configured. Please set the AI_GATEWAY_API_KEY environment variable.",
      };
    }

    if (!request.productImageUrl) {
      return { success: false, message: "Product image URL is required" };
    }
    if (!request.logoImage) {
      return { success: false, message: "Logo image is required" };
    }

    try {
      const productImageBuffer = await this.fetchImageAsBuffer(
        request.productImageUrl,
      );
      // Logo can be a URL (e.g. Cloudinary-hosted) or base64/data URI
      const logoBuffer = request.logoImage.startsWith("http")
        ? await this.fetchImageAsBuffer(request.logoImage)
        : this.parseBase64ToBuffer(request.logoImage);

      // Detect product image dimensions and pick the closest supported ratio
      const dims = this.getImageDimensions(productImageBuffer);
      const aspectRatio = dims
        ? this.getClosestAspectRatio(dims.width, dims.height)
        : "1:1";

      console.log(
        `[MockupService] Product image dimensions: ${dims ? `${dims.width}x${dims.height}` : "unknown"}, using aspect ratio: ${aspectRatio}`,
      );

      const result = await generateText({
        model: gateway("google/gemini-2.5-flash-image"),
        abortSignal: AbortSignal.timeout(300_000),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  "You are a professional mockup designer.",
                  "I am providing two images:",
                  "1) A product photo",
                  "2) A logo / design image",
                  "",
                  "Generate a realistic product mockup by placing the logo/design",
                  "onto the most appropriate visible surface of the product.",
                  "The logo should look naturally printed/embroidered on the product.",
                  "Keep the product perspective, lighting, and shadows realistic.",
                  `The output image MUST have the same aspect ratio as the product photo (${aspectRatio}).`,
                  "Return ONLY the final mockup image, nothing else.",
                ].join("\n"),
              },
              { type: "image", image: productImageBuffer },
              { type: "image", image: logoBuffer },
            ],
          },
        ],
        providerOptions: {
          google: {
            responseModalities: ["IMAGE"],
            imageConfig: {
              aspectRatio,
            },
          },
        },
      });

      // Extract generated image from files
      const imageFile = result.files?.find((f) =>
        f.mediaType.startsWith("image/"),
      );

      if (!imageFile) {
        return {
          success: false,
          message: "No mockup image was returned by the model",
        };
      }

      // Upload to Cloudinary for permanent hosting instead of storing base64
      const cloudinaryUrl = await uploadToCloudinary(imageFile.base64);
      if (!cloudinaryUrl) {
        return {
          success: false,
          message: "Failed to upload mockup image to hosting service",
        };
      }

      return { success: true, mockupImageUrl: cloudinaryUrl };
    } catch (error) {
      console.error("[MockupService] Error generating mockup:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to generate mockup",
      };
    }
  }

  /**
   * Generate a single mockup given pre-parsed logo buffer.
   * Used internally by batch processing to avoid re-parsing the logo.
   */
  private async generateSingleWithLogo(
    productImageUrl: string,
    logoBuffer: Buffer,
  ): Promise<MockupResponse> {
    try {
      const productImageBuffer = await this.fetchImageAsBuffer(productImageUrl);

      const dims = this.getImageDimensions(productImageBuffer);
      const aspectRatio = dims
        ? this.getClosestAspectRatio(dims.width, dims.height)
        : "1:1";

      const result = await generateText({
        model: gateway("google/gemini-2.5-flash-image"),
        abortSignal: AbortSignal.timeout(300_000),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  "You are a professional mockup designer.",
                  "I am providing two images:",
                  "1) A product photo",
                  "2) A logo / design image",
                  "",
                  "Generate a realistic product mockup by placing the logo/design",
                  "onto the most appropriate visible surface of the product.",
                  "The logo should look naturally printed/embroidered on the product.",
                  "Keep the product perspective, lighting, and shadows realistic.",
                  `The output image MUST have the same aspect ratio as the product photo (${aspectRatio}).`,
                  "Return ONLY the final mockup image, nothing else.",
                ].join("\n"),
              },
              { type: "image", image: productImageBuffer },
              { type: "image", image: logoBuffer },
            ],
          },
        ],
        providerOptions: {
          google: {
            responseModalities: ["IMAGE"],
            imageConfig: {
              aspectRatio,
            },
          },
        },
      });

      const imageFile = result.files?.find((f) =>
        f.mediaType.startsWith("image/"),
      );

      if (!imageFile) {
        return {
          success: false,
          message: "No mockup image was returned by the model",
        };
      }

      const cloudinaryUrl = await uploadToCloudinary(imageFile.base64);
      if (!cloudinaryUrl) {
        return {
          success: false,
          message: "Failed to upload mockup image to hosting service",
        };
      }

      return { success: true, mockupImageUrl: cloudinaryUrl };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to generate mockup",
      };
    }
  }

  /**
   * Generate mockups for multiple products in parallel.
   * The logo is parsed once and reused for all items.
   * Processes up to MAX_CONCURRENCY items concurrently.
   */
  async generateMockupBatch(
    request: MockupBatchRequest,
  ): Promise<MockupBatchResponse> {
    const MAX_CONCURRENCY = 3;

    if (!process.env.AI_GATEWAY_API_KEY) {
      return {
        success: false,
        results: [],
        message: "Mockup service is not configured.",
      };
    }

    if (!request.logoImage) {
      return {
        success: false,
        results: [],
        message: "Logo image is required",
      };
    }

    if (!request.items || request.items.length === 0) {
      return {
        success: false,
        results: [],
        message: "At least one item is required",
      };
    }

    // Parse logo once for all items
    const logoBuffer = request.logoImage.startsWith("http")
      ? await this.fetchImageAsBuffer(request.logoImage)
      : this.parseBase64ToBuffer(request.logoImage);

    const results: MockupBatchResultItem[] = [];
    const items = [...request.items];

    // Process in chunks of MAX_CONCURRENCY
    while (items.length > 0) {
      const chunk = items.splice(0, MAX_CONCURRENCY);
      const chunkResults = await Promise.allSettled(
        chunk.map(async (item) => {
          const result = await this.generateSingleWithLogo(
            item.productImageUrl,
            logoBuffer,
          );
          return { index: item.index, ...result };
        }),
      );

      for (const settled of chunkResults) {
        if (settled.status === "fulfilled") {
          results.push(settled.value);
        } else {
          // Extract index from the rejected promise context
          results.push({
            index: -1,
            success: false,
            message: "Generation failed unexpectedly",
          });
        }
      }
    }

    return {
      success: true,
      results,
    };
  }
}

export default new MockupService();
