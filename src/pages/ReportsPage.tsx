import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import TableSkeleton from "../components/TableSkeleton";
import ReportTable from "../components/ReportTable";
import ReportFormModal from "../components/ReportFormModal";
import DecisionModal from "../components/DecisionModal";
import { getErrorMessage } from "../api/client";
import { listReports } from "../api/reports";
import type { Decision, Report, ReportStatus } from "../types";

type StatusFilter = "" | ReportStatus;

const PAGE_SIZE = 10;

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

interface StatusCounts {
  pending: number;
  approved: number;
  rejected: number;
}

export default function ReportsPage() {
  useDocumentTitle("Laporan");
  const { user } = useAuth();
  const toast = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<StatusCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal tambah/edit laporan (hanya untuk pelapor).
  const [modal, setModal] = useState<{ mode: "create" | "edit"; report: Report | null } | null>(null);
  const handleOpenCreate = useCallback(() => {
    setModal({ mode: "create", report: null });
  }, []);
  const handleOpenEdit = useCallback((report: Report) => {
    setModal({ mode: "edit", report });
  }, []);
  const handleCloseModal = useCallback(() => {
    setModal(null);
  }, []);

  // Modal konfirmasi keputusan (hanya untuk approver).
  const [decisionModal, setDecisionModal] = useState<{ report: Report; decision: Decision } | null>(null);
  const handleOpenDecide = useCallback((report: Report, decision: Decision) => {
    setDecisionModal({ report, decision });
  }, []);
  const handleCloseDecide = useCallback(() => {
    setDecisionModal(null);
  }, []);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function fetchReports() {
      setLoading(true);
      setError(null);
      try {
        const result = await listReports({
          status: statusFilter === "" ? undefined : statusFilter,
          page,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;
        setReports(result.data);
        setTotalPages(result.meta.totalPages);
        setTotal(result.meta.total);
        try {
          const [pending, approved, rejected] = await Promise.all([
            listReports({ status: "pending", page: 1, limit: 1 }),
            listReports({ status: "approved", page: 1, limit: 1 }),
            listReports({ status: "rejected", page: 1, limit: 1 }),
          ]);
          if (!cancelled) {
            setCounts({
              pending: pending.meta.total,
              approved: approved.meta.total,
              rejected: rejected.meta.total,
            });
          }
        } catch {
          if (!cancelled) setCounts(null);
        }
      } catch (err) {
        if (cancelled) return;
        const message = getErrorMessage(err);
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchReports();
    return () => {
      cancelled = true;
    };
  }, [page, reloadKey, statusFilter, toast]);

  const handleFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const isPelapor = user?.role === "pelapor";
  const isApprover = user?.role === "approver";

  const handleSaved = useCallback(
    (outcome: "saved" | "stale") => {
      if (outcome === "saved") {
        toast.success(modal?.mode === "edit" ? "Laporan berhasil diubah." : "Laporan berhasil dibuat.");
        setModal(null);
      }
      // "stale" (409): pesan sudah tampil di modal, cukup refresh daftar.
      reload();
    },
    [modal?.mode, reload, toast],
  );

  const canEdit = useCallback(
    (report: Report) => {
      if (user == null || user.role !== "pelapor") return false;
      return report.reporter.id === user.id && report.status === "pending";
    },
    [user],
  );

  const handleDecided = useCallback(
    (outcome: "decided" | "stale") => {
      if (outcome === "decided") {
        toast.success(
          decisionModal?.decision === "approved" ? "Laporan disetujui." : "Laporan ditolak.",
        );
        setDecisionModal(null);
      }
      // "stale" (409/404): pesan sudah tampil di modal, cukup refresh daftar.
      reload();
    },
    [decisionModal?.decision, reload, toast],
  );

  const countFor = (value: StatusFilter): number | null => {
    if (value === "") return total;
    return counts ? counts[value] : null;
  };

  return (
    <section>
      <div className="card page-hero">
        <div className="hero-row">
          <div>
            <h1 className="page-title">Laporan</h1>
            <p className="page-sub">Catat temuan lapangan, pantau statusnya, dan ketok keputusan.</p>
          </div>
          {isPelapor && (
            <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
              Tambah Laporan
            </button>
          )}
        </div>
        <hr className="hero-divider" />
        <div className="seg" role="tablist" aria-label="Saring status laporan">
          {STATUS_OPTIONS.map((opt) => {
            const count = countFor(opt.value);
            return (
              <button
                key={opt.label}
                type="button"
                role="tab"
                aria-selected={statusFilter === opt.value}
                className={statusFilter === opt.value ? "seg-btn active" : "seg-btn"}
                onClick={() => handleFilterChange(opt.value)}
              >
                {opt.label}
                {count !== null && <span className="seg-count">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {modal && (
        <ReportFormModal
          key={modal.mode === "edit" ? modal.report?.id ?? "edit" : "create"}
          mode={modal.mode}
          initial={
            modal.report
              ? { id: modal.report.id, name: modal.report.name, description: modal.report.description }
              : null
          }
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      )}

      {decisionModal && (
        <DecisionModal
          key={`${decisionModal.report.id}-${decisionModal.decision}`}
          reportId={decisionModal.report.id}
          reportName={decisionModal.report.name}
          decision={decisionModal.decision}
          onClose={handleCloseDecide}
          onDecided={handleDecided}
        />
      )}

      {loading ? (
      <div className="card table-card">
        <TableSkeleton rows={6} />
      </div>
      ) : error ? (
        <div className="card empty-state">
          <svg className="empty-icon empty-icon-danger" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l10 17H2z" />
            <path d="M12 10v4" />
            <circle cx="12" cy="17.2" r="0.4" fill="currentColor" />
          </svg>
          <h2>Gagal memuat laporan</h2>
          <p className="muted">{error}</p>
          <button type="button" className="btn btn-primary" onClick={reload}>
            Coba lagi
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="card empty-state">
          <svg className="empty-icon" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="4" width="14" height="17" rx="2" />
            <path d="M9 4a2 2 0 0 1 6 0" />
            <path d="M9 11l2 2 4-4" />
          </svg>
          <h2>Belum ada laporan</h2>
          <p className="muted">
            {isPelapor
              ? "Buat laporan pertamamu dan pantau statusnya di sini."
              : "Belum ada laporan yang bisa ditampilkan untuk saringan ini."}
          </p>
          {isPelapor && (
            <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
              Buat laporan pertama
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="card table-card">
            <ReportTable
              reports={reports}
              showReporter={!isPelapor}
              onEdit={isPelapor ? handleOpenEdit : undefined}
              canEdit={isPelapor ? canEdit : undefined}
              onDecide={isApprover ? handleOpenDecide : undefined}
            />
          </div>
          <div className="pagination">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="muted small">
              Halaman {page} dari {Math.max(1, totalPages)} • Total {total} laporan
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={page >= Math.max(1, totalPages)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
