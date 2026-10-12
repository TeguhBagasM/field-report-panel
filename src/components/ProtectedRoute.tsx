import { Navigate, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { TOKEN_KEY } from "../api/client";
import type { Role } from "../types";
import Layout from "./Layout";
import TableSkeleton from "./TableSkeleton";

interface ProtectedRouteProps {
  roles?: Role[];
  children?: ReactNode;
}

/**
 * Non-blocking: saat sesi dipulihkan (loading) dan token ada,
 * langsung tampilkan shell Layout + skeleton (bukan spinner penuh).
 * Tanpa token, langsung arahkan ke /login tanpa menunggu.
 */
export default function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    // Cache user tersedia: render rute langsung selagi revalidasi berjalan.
    if (user) {
      if (roles && roles.length > 0 && !roles.includes(user.role)) {
        return (
          <div className="page-center">
            <div className="card forbidden">
              <h1>Tidak punya akses</h1>
              <p>Akun Anda ({user.role}) tidak berhak membuka halaman ini.</p>
              <a className="btn btn-primary" href="/dashboard">
                Kembali ke Laporan
              </a>
            </div>
          </div>
        );
      }
      return <>{children ?? <Outlet />}</>;
    }
    const hasToken =
      typeof window !== "undefined" && localStorage.getItem(TOKEN_KEY) !== null;
    if (hasToken) {
      return (
        <Layout>
          <section aria-label="Memuat sesi">
            <div className="page-head">
              <div>
                <h1 className="page-title">Memuat...</h1>
              </div>
            </div>
            <div className="card table-card">
              <TableSkeleton rows={5} />
            </div>
          </section>
        </Layout>
      );
    }
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="page-center">
        <div className="card forbidden">
          <h1>Tidak punya akses</h1>
          <p>Akun Anda ({user.role}) tidak berhak membuka halaman ini.</p>
          <a className="btn btn-primary" href="/dashboard">
            Kembali ke Laporan
          </a>
        </div>
      </div>
    );
  }

  return <>{children ?? <Outlet />}</>;
}
