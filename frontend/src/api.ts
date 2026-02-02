import axios from "axios";
import { BackgroundCheckCase, BackgroundCheckStatus } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5002/api";

const client = axios.create({
  baseURL: API_BASE,
});

interface GetCasesFilters {
  status?: BackgroundCheckStatus;
  owner?: string;
  startDateFrom?: string;
  startDateTo?: string;
}

export const api = {
  /**
   * Get all cases with optional filters
   */
  getCases: async (filters?: GetCasesFilters) => {
    const { data } = await client.get<BackgroundCheckCase[]>(`/cases`, { params: filters });
    return data;
  },

  /**
   * Get case by ID
   */
  getCase: async (caseId: string) => {
    const { data } = await client.get<BackgroundCheckCase>(`/cases/${caseId}`);
    return data;
  },

  /**
   * Update check status
   */
  updateCheckStatus: async (
    caseId: string,
    checkType: string,
    status: BackgroundCheckStatus,
    updatedBy: string,
    notes?: string,
    vendorReference?: string
  ) => {
    const { data } = await client.patch<BackgroundCheckCase>(
      `/cases/${caseId}/checks/${checkType}`,
      { status, updatedBy, notes, vendorReference }
    );
    return data;
  },

  /**
   * Submit admin decision
   */
  submitAdminDecision: async (
    caseId: string,
    decision: "APPROVED" | "REJECTED" | "NEEDS_REVIEW",
    reasoning: string,
    decidedBy: string,
    notes?: string
  ) => {
    const { data } = await client.post<BackgroundCheckCase>(
      `/cases/${caseId}/admin-decision`,
      { decision, reasoning, decidedBy, notes }
    );
    return data;
  },

  /**
   * Get checklist summary
   */
  getChecklistSummary: async (caseId: string) => {
    const { data } = await client.get(`/cases/${caseId}/checklist-summary`);
    return data;
  },
};
