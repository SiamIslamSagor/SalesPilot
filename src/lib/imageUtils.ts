/**
 * Client-side image compression utility.
 * Resizes images using Canvas API before sending to the server,
 * reducing payload size and improving upload/processing speed.
 */

/**
 * Compress and resize an image (data URL or blob URL) to a maximum dimension.
 * Returns a compressed data URL (PNG for transparency, JPEG otherwise).
 */
export function compressImage(
  dataUrl: string,
  maxDimension: number = 512,
  quality: number = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Only resize if the image exceeds maxDimension
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Use PNG to preserve transparency (logos often need it)
      resolve(canvas.toDataURL("image/png", quality));
    };
    img.onerror = () =>
      reject(new Error("Failed to load image for compression"));
    img.src = dataUrl;
  });
}
