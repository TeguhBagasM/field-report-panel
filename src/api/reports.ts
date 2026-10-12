import { api } from "./client";
import type { Decision, Paginated, Report, ReportDetail, ReportStatus } from "../types";

export interface ListReportsParams {
  status?: ReportStatus;
  page?: number;
  limit?: number;
}

export interface ReportBody {
  name: string;
  description: string;
}

export interface ChangeStatusBody {
  status: Decision;
  note?: string;
}

export async function listReports(params: ListReportsParams = {}): Promise<Paginated<Report>> {
  const query: Record<string, string | number> = {};
  if (params.status !== undefined) query.status = params.status;
  if (params.page !== undefined) query.page = params.page;
  if (params.limit !== undefined) query.limit = params.limit;
  const res = await api.get<Paginated<Report>>("/reports", { params: query });
  return res.data;
}

export async function getReport(id: number): Promise<ReportDetail> {
  const res = await api.get<ReportDetail>(`/reports/${id}`);
  return res.data;
}

export async function createReport(data: ReportBody): Promise<Report> {
  const res = await api.post<Report>("/reports", data);
  return res.data;
}

export async function updateReport(id: number, data: ReportBody): Promise<Report> {
  const res = await api.put<Report>(`/reports/${id}`, data);
  return res.data;
}

export async function changeReportStatus(id: number, data: ChangeStatusBody): Promise<ReportDetail> {
  const res = await api.patch<ReportDetail>(`/reports/${id}/status`, data);
  return res.data;
}
