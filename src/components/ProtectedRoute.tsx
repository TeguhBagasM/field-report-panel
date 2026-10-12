import { Navigate, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types";
import Spinner from "./Spinner";

interface ProtectedRouteProps {
  roles?: Role[];
  children?: ReactNode;
}

export default function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-center">
        <Spinner label="Memuat sesi..." />
      </div>
    );
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
