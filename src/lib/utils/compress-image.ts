const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.82;

/**
 * Lightweight client-side downscale/compress for uploads (no external deps).
 */
export async function compressImageFileIfNeeded(file: File): Promise<File> {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    !file.type.startsWith("image/")
  ) {
    return file;
  }
  if (
    file.size < 520_192 &&
    (file.type === "image/jpeg" || file.type === "image/webp")
  ) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = Math.max(bitmap.width, bitmap.height);
    const ratio = maxSide <= MAX_DIMENSION ? 1 : MAX_DIMENSION / maxSide;
    const w = Math.max(1, Math.round(bitmap.width * ratio));
    const h = Math.max(1, Math.round(bitmap.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) {
      return file;
    }
    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
