import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import TableSkeleton from "../components/TableSkeleton";
import StatusBadge from "../components/StatusBadge";
import DecisionModal from "../components/DecisionModal";
import ReportFormModal from "../components/ReportFormModal";
import { getErrorMessage } from "../api/client";
import { getReport } from "../api/reports";
import { formatDateTimeFull } from "../utils/format";
import type { Decision, ReportDetail } from "../types";

export default function ReportDetailPage() {
  useDocumentTitle("Detail Laporan");
  const { id } = useParams<{ id: string }>();
  const reportId = Number(id);
  const { user } = useAuth();
  const toast = useToast();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [decision, setDecision] = useState<Decision | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function fetchDetail() {
      if (!Number.isInteger(reportId) || reportId <= 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const detail = await getReport(reportId);
        if (!cancelled) setReport(detail);
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, reportId]);

  const handleDecided = useCallback(
    (outcome: "decided" | "stale") => {
      if (outcome === "decided") {
        toast.success(decision === "approved" ? "Laporan disetujui." : "Laporan ditolak.");
        setDecision(null);
      }
      reload();
    },
    [decision, reload, toast],
  );

  const handleEdited = useCallback(
    (outcome: "saved" | "stale") => {
      if (outcome === "saved") {
        toast.success("Laporan berhasil diubah.");
        setShowEdit(false);
      }
      reload();
    },
    [reload, toast],
  );

  if (loading) {
    return (
      <section>
        <div className="card table-card">
          <TableSkeleton rows={4} />
        </div>
      </section>
    );
  }

  if (notFound) {
    return (
      <section>
        <div className="page-center">
          <div className="card forbidden">
            <h1>Laporan tidak ditemukan</h1>
            <p className="muted">Laporan tidak ada atau Anda tidak berhak melihatnya.</p>
            <Link className="btn btn-primary" to="/reports">
              Kembali ke daftar
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (error || report == null) {
    return (
      <section>
        <div className="card state-card">
          <p className="alert alert-error">{error ?? "Gagal memuat laporan."}</p>
          <div className="detail-actions">
            <button type="button" className="btn btn-primary" onClick={reload}>
              Coba lagi
            </button>
            <Link className="btn btn-ghost" to="/reports">
              Kembali ke daftar
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const isApprover = user?.role === "approver";
  const canEdit = user?.role === "pelapor" && report.reporter.id === user.id && report.status === "pending";

  return (
    <section>
      <nav className="crumbs" aria-label="Navigasi">
        <Link to="/reports">Laporan</Link>
        <span aria-hidden="true">/</span>
        <span>Detail</span>
      </nav>
      <div className="page-head">
        <h1 className="page-title">Detail Laporan</h1>
        <Link className="btn btn-ghost btn-sm" to="/reports">
          Kembali ke daftar
        </Link>
      </div>

      <div className="detail-grid">
        <div className="card detail-card">
        <div className="detail-head">
          <h2 className="detail-name">{report.name}</h2>
          <StatusBadge status={report.status} />
        </div>
        <p className="detail-description">{report.description}</p>
        <dl className="detail-meta">
          <div>
            <dt>Pelapor</dt>
            <dd>{report.reporter.name}</dd>
          </div>
          <div>
            <dt>Dibuat pada</dt>
            <dd>{formatDateTimeFull(report.createdAt)}</dd>
          </div>
          <div>
            <dt>Diubah pada</dt>
            <dd>{formatDateTimeFull(report.updatedAt)}</dd>
          </div>
        </dl>
        <div className="detail-actions">
          {isApprover && (
            <>
              <button
                type="button"
                className="btn btn-success btn-sm"
                disabled={report.status === "approved"}
                onClick={() => setDecision("approved")}
              >
                Approve
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={report.status === "rejected"}
                onClick={() => setDecision("rejected")}
              >
                Reject
              </button>
            </>
          )}
          {canEdit && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)}>
              Edit
            </button>
          )}
        </div>
      </div>

      <div>
        <h2 className="section-title">Riwayat Persetujuan</h2>
        {report.approvals.length === 0 ? (
          <div className="card state-card">
            <p className="muted">Belum ada keputusan.</p>
          </div>
        ) : (
          <ol className="history-list">
            {report.approvals.map((item) => (
              <li key={item.id} className={`history-item tl-${item.decision}`}>
                <div className="history-head">
                  <strong>{item.approver.name}</strong>
                  <StatusBadge status={item.decision} />
                </div>
                <p className="history-note">{item.note ?? "-"}</p>
                <span className="muted history-time">{formatDateTimeFull(item.decidedAt)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      </div>

      {decision && (
        <DecisionModal
          key={`${report.id}-${decision}`}
          reportId={report.id}
          reportName={report.name}
          decision={decision}
          onClose={() => setDecision(null)}
          onDecided={handleDecided}
        />
      )}

      {showEdit && (
        <ReportFormModal
          key={report.id}
          mode="edit"
          initial={{ id: report.id, name: report.name, description: report.description }}
          onClose={() => setShowEdit(false)}
          onSaved={handleEdited}
        />
      )}
    </section>
  );
}
