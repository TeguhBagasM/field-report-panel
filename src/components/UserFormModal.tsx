import { useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { getErrorMessage } from "../api/client";
import { createUser, updateUser } from "../api/users";
import { useFocusTrap } from "../hooks/useFocusTrap";
import type { Role, User } from "../types";

export type UserFormMode = "create" | "edit";

interface UserFormModalProps {
  mode: UserFormMode;
  initial?: User | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

const MAX_NAME = 100;
const MIN_PASSWORD = 8;

const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "pelapor", label: "Pelapor" },
  { value: "approver", label: "Approver" },
];

function isEmailValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function UserFormModal({ mode, initial, onClose, onSaved }: UserFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(initial?.role ?? "pelapor");
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
      errors.name = "Nama wajib diisi.";
    } else if (trimmedName.length > MAX_NAME) {
      errors.name = `Nama maksimal ${MAX_NAME} karakter.`;
    }
    if (mode === "create") {
      if (!email.trim()) {
        errors.email = "Email wajib diisi.";
      } else if (!isEmailValid(email.trim())) {
        errors.email = "Email tidak valid.";
      }
      if (!password) {
        errors.password = "Password wajib diisi.";
      } else if (password.length < MIN_PASSWORD) {
        errors.password = `Password minimal ${MIN_PASSWORD} karakter.`;
      }
    } else if (password !== "" && password.length < MIN_PASSWORD) {
      errors.password = `Password minimal ${MIN_PASSWORD} karakter.`;
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
      if (mode === "create") {
        await createUser({ name: name.trim(), email: email.trim(), password, role });
      } else {
        if (initial == null) {
          setServerError("Data user tidak ditemukan.");
          return;
        }
        await updateUser(initial.id, {
          name: name.trim(),
          role,
          ...(password !== "" ? { password } : {}),
        });
      }
      onSaved();
    } catch (err) {
      setServerError(getErrorMessage(err));
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
        aria-label={mode === "create" ? "Tambah User" : "Edit User"}
      >
        <div className="modal-head">
          <h2 className="modal-title">{mode === "create" ? "Tambah User" : "Edit User"}</h2>
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
              placeholder="Nama lengkap"
            />
            {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
          </label>
          {mode === "create" && (
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  setServerError(null);
                }}
                placeholder="nama@demo.com"
                autoComplete="off"
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </label>
          )}
          <label className="field">
            <span>
              Password{" "}
              {mode === "edit" && (
                <span className="muted small">(kosongkan jika tidak diubah)</span>
              )}
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
                setServerError(null);
              }}
              placeholder={mode === "create" ? "Minimal 8 karakter" : "Kosongkan = tidak diubah"}
              autoComplete="new-password"
            />
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </label>
          <label className="field">
            <span>Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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
