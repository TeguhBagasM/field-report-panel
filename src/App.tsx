import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import TableSkeleton from "./components/TableSkeleton";

// Code splitting per route: chunk awal hanya shell (App + Layout +
// ProtectedRoute), tiap halaman dimuat on-demand.
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const ReportDetailPage = lazy(() => import("./pages/ReportDetailPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function RouteFallback() {
  return (
    <section aria-label="Memuat halaman">
      <div className="page-head">
        <div>
          <h1 className="page-title">Memuat...</h1>
        </div>
      </div>
      <div className="card table-card">
        <TableSkeleton rows={5} />
      </div>
    </section>
  );
}

function withFallback(node: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={withFallback(<LoginPage />)} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={withFallback(<DashboardPage />)} />
                <Route path="/reports" element={withFallback(<ReportsPage />)} />
                <Route path="/reports/:id" element={withFallback(<ReportDetailPage />)} />
                <Route element={<ProtectedRoute roles={["admin"]} />}>
                  <Route path="/users" element={withFallback(<UsersPage />)} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={withFallback(<NotFoundPage />)} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
