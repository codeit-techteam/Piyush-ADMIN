import { env } from "@/config/env";

/**
 * Browser-safe backend base URL.
 * On Vercel use `/backend-api` (same-origin proxy). Locally you can use the proxy
 * or a direct `http://host:5106/api` URL.
 */
export function resolveBackendApiBaseUrl(): string {
  const raw = env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!raw) return "";

  if (raw.startsWith("/")) {
    return raw.replace(/\/$/, "");
  }

  if (typeof window === "undefined") {
    return raw.replace(/\/$/, "");
  }

  try {
    const url = new URL(raw);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      url.hostname = window.location.hostname;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return raw.replace(/\/$/, "");
  }
}
