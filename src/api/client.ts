import axios from "axios";
import type { AxiosError } from "axios";

export const TOKEN_KEY = "token";

const baseURL = import.meta.env.VITE_API_URL as string | undefined;

export const api = axios.create({
  baseURL: baseURL ?? "http://localhost:4000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = (error.config?.url ?? "") as string;
    const isLoginRequest = url.includes("/auth/login");
    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem(TOKEN_KEY);
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
