import { api } from "./client";

export interface RegisterInstitutionPayload {
  name: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface RegisterInstitutionResponse {
  institution: { id: string; name: string; slug: string; status: string };
  admin: { id: string; email: string; fullName: string; role: string };
}

export const institutionsApi = {
  register: (data: RegisterInstitutionPayload) =>
    api.post<RegisterInstitutionResponse>("/institutions/register", data, true),
};
