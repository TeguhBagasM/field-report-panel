import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { formatDateTime, initials } from "../utils/format";
import type { Decision, Report } from "../types";

interface ReportTableProps {
  reports: Report[];
  showReporter: boolean;
  onEdit?: (report: Report) => void;
  canEdit?: (report: Report) => boolean;
  onDecide?: (report: Report, decision: Decision) => void;
}

export default function ReportTable({ reports, showReporter, onEdit, canEdit, onDecide }: ReportTableProps) {
  return (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Laporan</th>
            {showReporter && <th scope="col">Pelapor</th>}
            <th scope="col">Status</th>
            <th scope="col">Dibuat</th>
            <th scope="col">Diputuskan oleh</th>
            <th scope="col">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td className="cell-name">
                {report.name}
                <span className="cell-sub" title={report.description}>
                  {report.description}
                </span>
              </td>
              {showReporter && (
                <td data-label="Pelapor">
                  <span className="cell-person">
                    <span className="avatar" aria-hidden="true">
                      {initials(report.reporter.name)}
                    </span>
                    {report.reporter.name}
                  </span>
                </td>
              )}
              <td data-label="Status">
                <StatusBadge status={report.status} />
              </td>
              <td data-label="Dibuat" className="cell-date">
                {formatDateTime(report.createdAt)}
              </td>
              <td data-label="Diputuskan oleh">
                {report.lastDecision ? (
                  <span className="cell-decision">
                    <strong>{report.lastDecision.approver.name}</strong>
                    <span className="muted small cell-nowrap">
                      {formatDateTime(report.lastDecision.decidedAt)}
                    </span>
                  </span>
                ) : (
                  <span className="muted">-</span>
                )}
              </td>
              <td data-label="Aksi">
                <div className="cell-actions">
                  <Link
                    className="btn btn-ghost btn-sm"
                    to={`/reports/${report.id}`}
                    title={`Buka detail ${report.name}`}
                  >
                    Detail
                  </Link>
                  {onEdit && canEdit?.(report) && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      title={`Ubah ${report.name}`}
                      onClick={() => onEdit(report)}
                    >
                      Edit
                    </button>
                  )}
                  {onDecide && (
                    <>
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        disabled={report.status === "approved"}
                        title={
                          report.status === "approved"
                            ? "Sudah disetujui"
                            : `Setujui ${report.name}`
                        }
                        onClick={() => onDecide(report, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={report.status === "rejected"}
                        title={
                          report.status === "rejected" ? "Sudah ditolak" : `Tolak ${report.name}`
                        }
                        onClick={() => onDecide(report, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
