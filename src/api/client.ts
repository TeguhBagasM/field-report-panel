import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

export const TOKEN_KEY = "token";

const baseURL = import.meta.env.VITE_API_URL as string | undefined;

export const api = axios.create({
  baseURL: baseURL ?? "http://localhost:4000/api",
  // Cold-start backend (free tier) bisa tidur; beri waktu 30 detik.
  timeout: 30000,
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  __retried?: boolean;
}

function shouldRetry(error: AxiosError): boolean {
  const config = error.config as RetriableConfig | undefined;
  if (!config) return false;
  // Satu retry otomatis, hanya untuk GET (idempoten).
  if (config.method?.toLowerCase() !== "get") return false;
  if (config.__retried) return false;
  // Jaringan/timeout (tanpa respons) atau galat server 5xx.
  if (error.response === undefined) return true;
  const status = error.response.status;
  return status >= 500 && status < 600;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    if (config && shouldRetry(error)) {
      config.__retried = true;
      return api.request(config);
    }
    const status = error.response?.status;
    const url = (error.config?.url ?? "") as string;
    const isLoginRequest = url.includes("/auth/login");
    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem(TOKEN_KEY);
      try {
        localStorage.removeItem("user");
      } catch {
        /* abaikan */
      }
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

interface BackendErrorBody {
  message?: string;
  errors?: Array<{ field?: string; message?: string }>;
}

/** Ambil pesan error yang ramah dari respons backend `{ message, errors? }`. */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<BackendErrorBody>;
    if (axiosErr.code === "ERR_NETWORK" || axiosErr.response === undefined) {
      return "Tidak dapat terhubung ke server. Pastikan backend berjalan.";
    }
    const data = axiosErr.response?.data;
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const first = data.errors[0];
      if (first?.message) return first.message;
    }
    if (data?.message) return data.message;
    if (axiosErr.message) return axiosErr.message;
  }
  if (err instanceof Error) return err.message;
  return "Terjadi kesalahan. Silakan coba lagi.";
}

export default api;
