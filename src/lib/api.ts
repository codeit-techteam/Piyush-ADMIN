import { env } from "@/config/env";
import axios, { AxiosError } from "axios";

function resolveApiBaseUrl() {
  const raw = env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!raw) return "";

  if (typeof window === "undefined") {
    return raw;
  }

  try {
    const url = new URL(raw);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      url.hostname = window.location.hostname;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const requestUrl = `${config.baseURL ?? ""}${config.url ?? ""}`;
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["x-admin-session"] = "authenticated";
    config.headers["x-admin-id"] = "platform-admin";
    console.info("[api:request]", {
      method: config.method,
      url: requestUrl,
      params: config.params,
    });
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (typeof window !== "undefined") {
      console.info("[api:response]", {
        status: response.status,
        url: response.config.url,
      });
    }
    return response;
  },
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;
    const isTimeout = error.code === "ECONNABORTED";
    const isNetwork = !error.response;

    const message =
      serverMessage ??
      (isTimeout
        ? "Request timed out. Please try again."
        : isNetwork
          ? "Network Error: unable to reach backend API"
          : error.message);

    if (typeof window !== "undefined") {
      // Use warn so Next.js dev overlay does not treat API failures as a console error.
      console.warn("[api:error]", {
        status,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        message,
      });
    }

    return Promise.reject(new Error(message));
  },
);

api.interceptors.response.use(
  undefined,
  async (error: AxiosError<{ message?: string }>) => {
    const config = error.config as
      | (typeof error.config & { __retryCount?: number })
      | undefined;
    if (!config) {
      return Promise.reject(error);
    }

    const retriableStatus = [502, 503, 504];
    const status = error.response?.status;
    const isRetriable =
      error.code === "ECONNABORTED" ||
      !error.response ||
      (typeof status === "number" && retriableStatus.includes(status));

    if (!isRetriable) {
      return Promise.reject(error);
    }

    const retryCount = (config.__retryCount ?? 0) + 1;
    config.__retryCount = retryCount;
    if (retryCount > 2) {
      return Promise.reject(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 300 * retryCount));
    return api.request(config);
  },
);
