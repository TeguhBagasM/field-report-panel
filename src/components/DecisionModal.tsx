import { useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import axios from "axios";
import { getErrorMessage } from "../api/client";
import { changeReportStatus } from "../api/reports";
import { useFocusTrap } from "../hooks/useFocusTrap";
import StatusBadge from "./StatusBadge";
import type { Decision } from "../types";

interface DecisionModalProps {
  reportId: number;
  reportName: string;
  decision: Decision;
  onClose: () => void;
  /** "decided" = sukses (parent: toast + tutup + refresh). "stale" = 409/404 (parent: refresh saja, modal tetap terbuka). */
  onDecided: (outcome: "decided" | "stale") => void;
}

const MAX_NOTE = 500;

const TITLE: Record<Decision, string> = {
  approved: "Approve Laporan",
  rejected: "Reject Laporan",
};

export default function DecisionModal({ reportId, reportName, decision, onClose, onDecided }: DecisionModalProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const trimmed = note.trim();
      await changeReportStatus(reportId, {
        status: decision,
        note: trimmed === "" ? undefined : trimmed,
      });
      onDecided("decided");
    } catch (err) {
      setError(getErrorMessage(err));
      if (
        axios.isAxiosError(err) &&
        (err.response?.status === 409 || err.response?.status === 404)
      ) {
        onDecided("stale");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdropClick}>
      <div
        className="modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${TITLE[decision]}: ${reportName}`}
      >
        <div className={`modal-head decision-head-${decision}`}>
          <span className="decision-icon" aria-hidden="true">
            {decision === "approved" ? (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8.5l3.5 3.5L13 5" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            )}
          </span>
          <h2 className="modal-title">{TITLE[decision]}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup dialog"
          >
            ×
          </button>
        </div>
        <p className="modal-report">
          <span className="muted">Laporan:</span> <strong>{reportName}</strong>{" "}
          <StatusBadge status={decision} />
        </p>
        <form onSubmit={handleSubmit} className="form" noValidate>
          <label className="field">
            <span>
              Catatan <span className="muted small">(opsional, maks {MAX_NOTE} karakter)</span>
            </span>
            <textarea
              value={note}
              rows={3}
              maxLength={MAX_NOTE}
              autoFocus
              onChange={(e) => {
                setNote(e.target.value);
                setError(null);
              }}
              placeholder="Alasan keputusan (opsional)"
            />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Batal
            </button>
            <button
              type="submit"
              className={decision === "approved" ? "btn btn-success" : "btn btn-danger"}
              disabled={saving}
            >
              {saving && <span className="spinner spinner-xs" aria-hidden="true" />}
              {saving ? "Menyimpan..." : "Konfirmasi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
