import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("Tidak ditemukan");
  return (
    <div className="page-center">
      <div className="card forbidden">
        <h1>404 — Halaman tidak ditemukan</h1>
        <p className="muted">Periksa kembali alamat URL Anda.</p>
        <Link className="btn btn-primary" to="/reports">
          Ke Daftar Laporan
        </Link>
      </div>
    </div>
  );
}
