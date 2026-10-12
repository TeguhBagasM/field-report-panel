import { useContext } from "react";
import { ToastContext } from "../components/toast-context";
import type { ToastContextValue } from "../components/toast-context";

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  return ctx;
}
