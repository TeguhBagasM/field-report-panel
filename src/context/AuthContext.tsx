import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { TOKEN_KEY } from "../api/client";
import * as authApi from "../api/auth";
import { AuthContext } from "./auth-context";
import type { User } from "../types";

export const USER_KEY = "user";

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Optimasi: tampilkan user dari cache sinkron agar shell/layout bisa
  // langsung dirender tanpa menunggu /auth/me (non-blocking).
  const [user, setUser] = useState<User | null>(() => readCachedUser());
  const [loading, setLoading] = useState(() => localStorage.getItem(TOKEN_KEY) !== null);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const current = await authApi.me();
        if (!cancelled) {
          setUser(current);
          try {
            localStorage.setItem(USER_KEY, JSON.stringify(current));
          } catch {
            /* abaikan, cache hanya tambahan */
          }
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        try {
          localStorage.removeItem(USER_KEY);
        } catch {
          /* abaikan */
        }
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Kontrak API: POST /auth/login -> { token, user }.
    // Langsung pakai user dari respons, tanpa panggil /auth/me lagi.
    const result = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, result.token);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    } catch {
      /* abaikan, cache hanya tambahan */
    }
    setUser(result.user);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      /* abaikan */
    }
    setUser(null);
    setLoading(false);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
