import type { ReportStatus } from "../types";

const LABEL: Record<ReportStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export default function StatusBadge({ status }: { status: ReportStatus }) {
  return <span className={`badge badge-${status}`}>{LABEL[status]}</span>;
}
