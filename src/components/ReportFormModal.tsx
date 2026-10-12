import { useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import axios from "axios";
import { getErrorMessage } from "../api/client";
import { createReport, updateReport } from "../api/reports";
import { useFocusTrap } from "../hooks/useFocusTrap";

export type ReportFormMode = "create" | "edit";

export interface ReportFormInitial {
  id: number;
  name: string;
  description: string;
}

interface ReportFormModalProps {
  mode: ReportFormMode;
  initial?: ReportFormInitial | null;
  onClose: () => void;
  /** "saved" = sukses (parent: toast + tutup + refresh). "stale" = 409 (parent: refresh saja, modal tetap terbuka). */
  onSaved: (outcome: "saved" | "stale") => void;
}

interface FieldErrors {
  name?: string;
  description?: string;
}

const MAX_NAME = 150;

export default function ReportFormModal({ mode, initial, onClose, onSaved }: ReportFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
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

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = "Nama laporan wajib diisi.";
    } else if (trimmedName.length > MAX_NAME) {
      errors.name = `Nama maksimal ${MAX_NAME} karakter.`;
    }
    if (!description.trim()) {
      errors.description = "Deskripsi wajib diisi.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSaving(true);
    try {
      const body = { name: name.trim(), description: description.trim() };
      if (mode === "create") {
        await createReport(body);
      } else {
        if (initial == null) {
          setServerError("Data laporan tidak ditemukan.");
          return;
        }
        await updateReport(initial.id, body);
      }
      onSaved("saved");
    } catch (err) {
      setServerError(getErrorMessage(err));
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        // Data di server sudah berubah (mis. sudah diputuskan).
        onSaved("stale");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdropClick}>
      <div className="modal" ref={dialogRef} role="dialog" aria-modal="true" aria-label={mode === "create" ? "Tambah Laporan" : "Edit Laporan"}>
        <div className="modal-head">
          <h2 className="modal-title">{mode === "create" ? "Tambah Laporan" : "Edit Laporan"}</h2>
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
        <form onSubmit={handleSubmit} className="form" noValidate>
          <label className="field">
            <span>Nama</span>
            <input
              type="text"
              value={name}
              maxLength={MAX_NAME}
              autoFocus
              onChange={(e) => {
                setName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
                setServerError(null);
              }}
              placeholder="Nama laporan"
            />
            {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
          </label>
          <label className="field">
            <span>Deskripsi</span>
            <textarea
              value={description}
              rows={4}
              onChange={(e) => {
                setDescription(e.target.value);
                setFieldErrors((prev) => ({ ...prev, description: undefined }));
                setServerError(null);
              }}
              placeholder="Deskripsi laporan lapangan"
            />
            {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
          </label>
          {serverError && <div className="alert alert-error">{serverError}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <span className="spinner spinner-xs" aria-hidden="true" />}
              {saving ? "Menyimpan..." : mode === "create" ? "Simpan" : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
