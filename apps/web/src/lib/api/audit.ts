import { api } from "./client";

export interface AuditLog {
  id: string;
  institutionId: string;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadataJson: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditFilters {
  resourceType?: string;
  action?: string;
  from?: string;
  to?: string;
}

export const auditApi = {
  list: (filters: AuditFilters = {}) => {
    const qs = new URLSearchParams();
    if (filters.resourceType) qs.set("resourceType", filters.resourceType);
    if (filters.action) qs.set("action", filters.action);
    if (filters.from) qs.set("from", filters.from);
    if (filters.to) qs.set("to", filters.to);
    const q = qs.toString();
    return api.get<AuditLog[]>(`/audit/logs${q ? `?${q}` : ""}`);
  },
};
