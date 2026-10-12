import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import TableSkeleton from "../components/TableSkeleton";
import UserFormModal from "../components/UserFormModal";
import type { UserFormMode } from "../components/UserFormModal";
import { getErrorMessage } from "../api/client";
import { listUsers, updateUser } from "../api/users";
import { formatDateTime, initials } from "../utils/format";
import type { User } from "../types";

export default function UsersPage() {
  useDocumentTitle("Kelola Users");
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: UserFormMode; user: User | null } | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const result = await listUsers();
        if (!cancelled) setUsers(result);
      } catch (err) {
        if (cancelled) return;
        const message = getErrorMessage(err);
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, toast]);

  const handleSaved = useCallback(() => {
    toast.success(modal?.mode === "edit" ? "User berhasil diubah." : "User berhasil dibuat.");
    setModal(null);
    reload();
  }, [modal?.mode, reload, toast]);

  const handleToggleActive = useCallback(
    async (target: User) => {
      setActingId(target.id);
      try {
        await updateUser(target.id, { isActive: !target.isActive });
        toast.success(target.isActive ? "User dinonaktifkan." : "User diaktifkan.");
        reload();
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setActingId(null);
      }
    },
    [reload, toast],
  );

  return (
    <section>
      <div className="card page-hero">
        <div className="hero-row">
          <div>
            <h1 className="page-title">Kelola Users</h1>
            <p className="page-sub">Buat akun, atur peran, dan aktifkan atau nonaktifkan akses.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModal({ mode: "create", user: null })}
          >
            Tambah User
          </button>
        </div>
      </div>

      {modal && (
        <UserFormModal
          key={modal.mode === "edit" ? modal.user?.id ?? "edit" : "create"}
          mode={modal.mode}
          initial={modal.user}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {loading ? (
        <div className="card table-card">
          <TableSkeleton rows={5} />
        </div>
      ) : error ? (
        <div className="card empty-state">
          <svg className="empty-icon empty-icon-danger" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l10 17H2z" />
            <path d="M12 10v4" />
            <circle cx="12" cy="17.2" r="0.4" fill="currentColor" />
          </svg>
          <h2>Gagal memuat users</h2>
          <p className="muted">{error}</p>
          <button type="button" className="btn btn-primary" onClick={reload}>
            Coba lagi
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="card empty-state">
          <svg className="empty-icon" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
            <path d="M18 8v6M15 11h6" />
          </svg>
          <h2>Belum ada user</h2>
          <p className="muted">Buat akun pertama agar tim bisa masuk dan bekerja.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModal({ mode: "create", user: null })}
          >
            Tambah user pertama
          </button>
        </div>
      ) : (
        <div className="card table-card">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Nama</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Dibuat</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const busy = actingId === u.id;
                  return (
                    <tr key={u.id}>
                      <td className="cell-name">
                        <span className="cell-person">
                          <span className="avatar" aria-hidden="true">
                            {initials(u.name)}
                          </span>
                          {u.name}
                        </span>
                      </td>
                      <td data-label="Email">{u.email}</td>
                      <td data-label="Role">
                        <span className={`role-badge role-${u.role}`}>{u.role}</span>
                      </td>
                      <td data-label="Status">
                        <span className={u.isActive ? "badge badge-active" : "badge badge-inactive"}>
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td data-label="Dibuat" className="cell-date">
                        {formatDateTime(u.createdAt)}
                      </td>
                      <td data-label="Aksi">
                        <div className="cell-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={busy}
                            title={`Ubah ${u.name}`}
                            onClick={() => setModal({ mode: "edit", user: u })}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={u.isActive ? "btn btn-danger btn-sm" : "btn btn-success btn-sm"}
                            disabled={busy || (isSelf && u.isActive)}
                            title={
                              isSelf && u.isActive
                                ? "Tidak bisa menonaktifkan akun sendiri"
                                : u.isActive
                                  ? `Nonaktifkan ${u.name}`
                                  : `Aktifkan ${u.name}`
                            }
                            onClick={() => void handleToggleActive(u)}
                          >
                            {busy ? "..." : u.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
