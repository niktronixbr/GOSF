import { api } from "./client";

export type DataRequestType =
  | "ACCESS"
  | "CORRECTION"
  | "DELETION"
  | "PORTABILITY"
  | "OPPOSITION";

export type DataRequestStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED";

export interface ConsentRecord {
  id: string;
  userId: string;
  institutionId: string;
  purpose: string;
  version: string;
  accepted: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  recordedAt: string;
}

export interface DataRequest {
  id: string;
  userId: string;
  institutionId: string;
  type: DataRequestType;
  status: DataRequestStatus;
  details: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface DataRequestWithUser extends DataRequest {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export interface CreateConsentPayload {
  purpose: string;
  version: string;
  accepted: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateDataRequestPayload {
  type: DataRequestType;
  details?: string;
}

export const privacyApi = {
  recordConsent: (payload: CreateConsentPayload) =>
    api.post<ConsentRecord>("/privacy/consent", payload),
  getMyConsents: () => api.get<ConsentRecord[]>("/privacy/consent"),
  createDataRequest: (payload: CreateDataRequestPayload) =>
    api.post<DataRequest>("/privacy/requests", payload),
  getMyDataRequests: () => api.get<DataRequest[]>("/privacy/requests/me"),
  exportMyData: () => api.get<Record<string, unknown>>("/privacy/export"),

  listDataRequests: (status?: DataRequestStatus) => {
    const qs = status ? `?status=${status}` : "";
    return api.get<DataRequestWithUser[]>(`/privacy/requests${qs}`);
  },
  updateDataRequestStatus: (id: string, status: DataRequestStatus) =>
    api.patch<DataRequest>(`/privacy/requests/${id}/status`, { status }),
};
