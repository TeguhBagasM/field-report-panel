import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, Clock, FileText, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import StatusBadge from "../components/StatusBadge";
import ReportFormModal from "../components/ReportFormModal";
import DecisionModal from "../components/DecisionModal";
import { getErrorMessage } from "../api/client";
import { getDashboardSummary } from "../api/dashboard";
import { timeAgo } from "../utils/format";
import type { DashboardSummary, Decision, Report, Role } from "../types";

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

const SUBTITLE: Record<Role, string> = {
  pelapor: "Pantau laporanmu dan perbarui yang perlu perhatian.",
  approver: "Antrean persetujuan menunggumu di bawah.",
  admin: "Kesehatan laporan dan pengguna dalam sekejap.",
};

/** Angka menanjak ringan; langsung final bila reduced-motion. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function useCountUp(target: number): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  useEffect(() => {
    let raf = 0;
    if (prefersReducedMotion()) {
      raf = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(raf);
    }
    const start = performance.now();
    const dur = 600;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

function StatCard({
  to,
  label,
  value,
  icon,
  tone,
}: {
  to: string;
  label: string;
  value: number;
  icon: ReactNode;
  tone: string;
}) {
  const animated = useCountUp(value);
  return (
    <Link to={to} className="card stat-card" aria-label={`Lihat ${label.toLowerCase()}`}>
      <span className={`stat-icon ${tone}`} aria-hidden="true">
        {icon}
      </span>
      <span className="stat-num">{animated}</span>
      <span className="stat-label">{label}</span>
    </Link>
  );
}

function TrendChart({ trend }: { trend: DashboardSummary["trend"] }) {
  const max = Math.max(1, ...trend.map((d) => d.count));
  const W = 560;
  const H = 230;
  const padTop = 20;
  const padBottom = 30;
  const chartH = H - padTop - padBottom;
  const slot = W / 7;
  const barW = 44;
  const allZero = trend.every((d) => d.count === 0);

  const summary = trend
    .map((d) => {
      const day = new Date(`${d.date}T00:00:00`).toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      return `${day}: ${d.count} laporan`;
    })
    .join(", ");

  if (allZero) {
    return (
      <div className="chart-empty">
        <p className="muted">Belum ada laporan dalam 7 hari terakhir.</p>
      </div>
    );
  }

  return (
    <>
      <svg
        className="trend-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Tren laporan 7 hari terakhir. ${summary}.`}
      >
        <line
          x1="0"
          y1={padTop + chartH}
          x2={W}
          y2={padTop + chartH}
          className="trend-axis"
        />
        {trend.map((d, i) => {
          const h = Math.max(0, (d.count / max) * chartH);
          const x = i * slot + (slot - barW) / 2;
          const y = padTop + chartH - h;
          const dayShort = new Date(`${d.date}T00:00:00`).toLocaleDateString("id-ID", {
            weekday: "short",
          });
          const full = new Date(`${d.date}T00:00:00`).toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={d.count > 0 ? y : padTop + chartH - 3}
                width={barW}
                height={d.count > 0 ? Math.max(h, 4) : 3}
                rx={5}
                className="trend-bar"
                tabIndex={0}
              >
                <title>{`${full} — ${d.count} laporan`}</title>
              </rect>
              {d.count > 0 && (
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="trend-value">
                  {d.count}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={padTop + chartH + 20}
                textAnchor="middle"
                className="trend-day"
              >
                {dayShort}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>Tren laporan 7 hari terakhir</caption>
        <tbody>
          {trend.map((d) => (
            <tr key={d.date}>
              <th scope="row">{d.date}</th>
              <td>{d.count} laporan</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Composition({ totals }: { totals: DashboardSummary["totals"] }) {
  const total = totals.total;
  if (total === 0) {
    return <p className="muted">Belum ada laporan untuk dihitung.</p>;
  }
  const parts = [
    { key: "pending", label: "Menunggu", count: totals.pending, cls: "seg-pending" },
    { key: "approved", label: "Disetujui", count: totals.approved, cls: "seg-approved" },
    { key: "rejected", label: "Ditolak", count: totals.rejected, cls: "seg-rejected" },
  ];
  const W = 400;
  let x = 0;
  return (
    <>
      <svg
        className="comp-svg"
        viewBox={`0 0 ${W} 26`}
        role="img"
        aria-label={`Komposisi status: ${parts.map((p) => `${p.count} ${p.label.toLowerCase()}`).join(", ")}.`}
      >
        {parts.map((p) => {
          const w = (p.count / total) * W;
          const rect = (
            <rect key={p.key} x={x} y={0} width={w} height={26} className={p.cls}>
              <title>{`${p.label}: ${p.count} laporan`}</title>
            </rect>
          );
          x += w;
          return rect;
        })}
      </svg>
      <ul className="legend">
        {parts.map((p) => (
          <li key={p.key}>
            <span className={`legend-dot ${p.cls}`} aria-hidden="true" />
            <span>{p.label}</span>
            <strong>
              {p.count} · {Math.round((p.count / total) * 100)}%
            </strong>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function DashboardPage() {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const toast = useToast();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [decision, setDecision] = useState<{ report: Report; decision: Decision } | null>(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function fetchSummary() {
      setLoading(true);
      setError(null);
      try {
        const result = await getDashboardSummary();
        if (!cancelled) setSummary(result);
      } catch (err) {
        if (cancelled) return;
        const message = getErrorMessage(err);
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, toast]);

  const role = user?.role;
  const firstName = user ? user.name.split(" ")[0] : "";
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleSaved = useCallback(
    (outcome: "saved" | "stale") => {
      if (outcome === "saved") {
        toast.success("Laporan berhasil dibuat.");
        setShowCreate(false);
      }
      reload();
    },
    [reload, toast],
  );

  const handleDecided = useCallback(
    (outcome: "decided" | "stale") => {
      if (outcome === "decided") {
        toast.success(
          decision?.decision === "approved" ? "Laporan disetujui." : "Laporan ditolak.",
        );
        setDecision(null);
      }
      reload();
    },
    [decision?.decision, reload, toast],
  );

  if (loading) {
    return (
      <section>
        <div className="page-head">
          <div>
            <h1 className="page-title">Dashboard</h1>
          </div>
        </div>
        <div className="stat-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card stat-skel" aria-hidden="true">
              <span className="skel skel-stat" />
            </div>
          ))}
        </div>
        <div className="dash-grid">
          <div className="card d-trend" aria-hidden="true">
            <span className="skel skel-chart" />
          </div>
          <div className="card d-comp" aria-hidden="true">
            <span className="skel skel-chart-sm" />
          </div>
          <div className="card d-half" aria-hidden="true">
            <span className="skel skel-list" />
          </div>
          <div className="card d-half" aria-hidden="true">
            <span className="skel skel-list" />
          </div>
        </div>
      </section>
    );
  }

  if (error || summary == null) {
    return (
      <section>
        <div className="page-head">
          <div>
            <h1 className="page-title">Dashboard</h1>
          </div>
        </div>
        <div className="card state-card">
          <p className="alert alert-error">{error ?? "Gagal memuat dashboard."}</p>
          <button type="button" className="btn btn-primary" onClick={reload}>
            Coba lagi
          </button>
        </div>
      </section>
    );
  }

  const { totals, trend, recent, awaiting, myDecisions, users } = summary;
  const rejectedMine = recent.filter((r) => r.status === "rejected");

  return (
    <section>
      <div className="page-head dash-head">
        <div>
          <h1 className="page-title">
            {greeting()}, {firstName}
          </h1>
          {role && <p className="page-sub">{SUBTITLE[role]}</p>}
          <p className="muted small">{today}</p>
        </div>
        <div className="dash-actions">
          {role === "pelapor" && (
            <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
              Tambah Laporan
            </button>
          )}
          {role === "approver" && (
            <Link className="btn btn-primary" to="/reports?status=pending">
              Lihat antrean
            </Link>
          )}
          {role === "admin" && (
            <Link className="btn btn-primary" to="/users">
              Kelola Pengguna
            </Link>
          )}
        </div>
      </div>

      {showCreate && (
        <ReportFormModal
          key="dash-create"
          mode="create"
          initial={null}
          onClose={() => setShowCreate(false)}
          onSaved={handleSaved}
        />
      )}

      {decision && (
        <DecisionModal
          key={`${decision.report.id}-${decision.decision}`}
          reportId={decision.report.id}
          reportName={decision.report.name}
          decision={decision.decision}
          onClose={() => setDecision(null)}
          onDecided={handleDecided}
        />
      )}

      <div className="stat-grid">
        <StatCard
          to="/reports"
          label={role === "pelapor" ? "Laporan saya" : "Total laporan"}
          value={totals.total}
          icon={<FileText size={20} aria-hidden="true" />}
          tone="si-total"
        />
        <StatCard
          to="/reports?status=pending"
          label="Menunggu"
          value={totals.pending}
          icon={<Clock size={20} aria-hidden="true" />}
          tone="si-pending"
        />
        <StatCard
          to="/reports?status=approved"
          label="Disetujui"
          value={totals.approved}
          icon={<Check size={20} aria-hidden="true" />}
          tone="si-approved"
        />
        <StatCard
          to="/reports?status=rejected"
          label="Ditolak"
          value={totals.rejected}
          icon={<X size={20} aria-hidden="true" />}
          tone="si-rejected"
        />
      </div>

      <div className="dash-grid">
        <div className="card d-trend">
          <h2 className="section-title">Laporan 7 hari terakhir</h2>
          <TrendChart trend={trend} />
        </div>

        <div className="card d-comp">
          <h2 className="section-title">Komposisi status</h2>
          <Composition totals={totals} />
        </div>

        {role === "approver" && (
          <div className="card d-half">
            <h2 className="section-title">Antrean persetujuan</h2>
            {awaiting == null || awaiting.length === 0 ? (
              <p className="muted">Antrean kosong. Semua laporan sudah diputuskan.</p>
            ) : (
              <ul className="queue-list">
                {awaiting.map((r) => (
                  <li key={r.id} className="queue-item">
                    <div className="queue-info">
                      <Link to={`/reports/${r.id}`} className="queue-name">
                        {r.name}
                      </Link>
                      <span className="muted small">
                        {r.reporter.name} · {timeAgo(r.createdAt)}
                      </span>
                    </div>
                    <div className="cell-actions">
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => setDecision({ report: r, decision: "approved" })}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setDecision({ report: r, decision: "rejected" })}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {myDecisions && (
              <p className="muted small queue-mine">
                Keputusan saya: {myDecisions.total} total · {myDecisions.approved} disetujui ·{" "}
                {myDecisions.rejected} ditolak.
              </p>
            )}
          </div>
        )}

        {role === "admin" && users && (
          <div className="card d-half">
            <h2 className="section-title">Pengguna</h2>
            <p className="user-totals">
              <strong>{users.total}</strong> pengguna · {users.active} aktif · {users.inactive}{" "}
              nonaktif
            </p>
            <ul className="role-bars">
              {(
                [
                  { key: "admin", label: "Admin" },
                  { key: "pelapor", label: "Pelapor" },
                  { key: "approver", label: "Approver" },
                ] as const
              ).map((r) => (
                <li key={r.key}>
                  <span>{r.label}</span>
                  <span className="role-track" aria-hidden="true">
                    <span
                      className={`role-fill role-fill-${r.key}`}
                      style={{
                        width: users.total > 0 ? `${(users.byRole[r.key] / users.total) * 100}%` : "0%",
                      }}
                    />
                  </span>
                  <strong>{users.byRole[r.key]}</strong>
                </li>
              ))}
            </ul>
            <Link className="btn btn-ghost btn-sm" to="/users">
              Buka kelola pengguna
            </Link>
          </div>
        )}

        {role === "pelapor" && (
          <div className="card d-half">
            <h2 className="section-title">Perlu perhatian</h2>
            {rejectedMine.length === 0 ? (
              <p className="muted">Tidak ada laporan yang ditolak. Kerja bagus.</p>
            ) : (
              <ul className="queue-list">
                {rejectedMine.map((r) => (
                  <li key={r.id} className="queue-item">
                    <div className="queue-info">
                      <Link to={`/reports/${r.id}`} className="queue-name">
                        {r.name}
                      </Link>
                      <span className="muted small">
                        {r.lastDecision?.note ?? "Tanpa catatan penolakan."}
                      </span>
                    </div>
                    <Link className="btn btn-ghost btn-sm" to={`/reports/${r.id}`}>
                      Lihat detail
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="card d-half">
          <h2 className="section-title">Aktivitas terbaru</h2>
          {recent.length === 0 ? (
            <p className="muted">Belum ada aktivitas. Laporan baru akan muncul di sini.</p>
          ) : (
            <ul className="activity-list">
              {recent.map((r) => (
                <li key={r.id} className="activity-item">
                  <div className="queue-info">
                    <Link to={`/reports/${r.id}`} className="queue-name">
                      {r.name}
                    </Link>
                    <span className="muted small">
                      {role !== "pelapor" ? `${r.reporter.name} · ` : ""}
                      {timeAgo(r.createdAt)}
                    </span>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
          <Link className="activity-more" to="/reports">
            Lihat semua
          </Link>
        </div>
      </div>
    </section>
  );
}
