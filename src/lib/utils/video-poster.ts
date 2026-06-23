/**
 * Extract a JPEG frame from a local video file (browser) for product thumbnails.
 * Uses ~1s or the first decodable frame when duration is unknown.
 */
export async function captureVideoFrameAsJpegBlob(
  file: File,
  seekSeconds = 1,
  jpegQuality = 0.86,
): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error("Video poster capture requires a browser");
  }
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    const objectUrl = URL.createObjectURL(file);

    const teardown = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    const fail = (err: Error) => {
      teardown();
      reject(err);
    };

    video.onerror = () =>
      fail(new Error("Unable to read this video for a thumbnail"));

    video.onloadedmetadata = () => {
      const dur = Number(video.duration);
      const hasDur = Number.isFinite(dur) && dur > 0;
      const t = hasDur
        ? Math.min(seekSeconds, Math.max(0.05, dur - 0.04))
        : 0;
      try {
        video.currentTime = t;
      } catch {
        fail(new Error("Unable to seek video for thumbnail"));
      }
    };

    video.onseeked = () => {
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) {
          fail(new Error("Video has no frame dimensions"));
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          fail(new Error("Canvas unavailable"));
          return;
        }
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            teardown();
            if (blob && blob.size > 0) resolve(blob);
            else fail(new Error("Empty thumbnail"));
          },
          "image/jpeg",
          jpegQuality,
        );
      } catch (e) {
        fail(e instanceof Error ? e : new Error(String(e)));
      }
    };

    video.src = objectUrl;
  });
}
