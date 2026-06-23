import axios from "axios";
import { env } from "@/config/env";

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_BACKEND_API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? "Request failed";
    return Promise.reject(new Error(message));
  },
);
