/**
 * Tipe frontend mengikuti bentuk JSON backend apa adanya.
 * - Auth: POST /auth/login -> { token, user }, GET /auth/me -> { user }
 * - Users: GET /users -> { users }, POST/PATCH -> { user }
 * - Reports: POST/GET by id -> objek laporan langsung,
 *   GET /reports -> { data, meta }.
 */

export type Role = "admin" | "pelapor" | "approver";

export type ReportStatus = "pending" | "approved" | "rejected";

/** Keputusan approval tidak pernah "pending". */
export type Decision = Exclude<ReportStatus, "pending">;

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface DecisionInfo {
  approver: { id: number; name: string };
  decision: Decision;
  note: string | null;
  decidedAt: string;
}

export interface Report {
  id: number;
  name: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  reporter: { id: number; name: string };
  lastDecision: DecisionInfo | null;
}

export interface Approval {
  id: number;
  approver: { id: number; name: string };
  decision: Decision;
  note: string | null;
  decidedAt: string;
}

export interface ReportDetail extends Report {
  approvals: Approval[];
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginResponse {
  token: string;
  user: User;
}
