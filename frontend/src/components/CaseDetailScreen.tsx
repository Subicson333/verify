/**
 * Case Detail Screen - Enterprise Background Check
 * 
 * Shows:
 * - Case header with candidate info, start date, owner
 * - Checklist panel with 5 checks and status badges
 * - Timeline panel (Sterling-style audit trail)
 * - Admin decision panel
 * - Action buttons (update check status, admin decision)
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { BackgroundCheckCase, BackgroundCheckStatus } from "../types";

export const CaseDetailScreen: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<BackgroundCheckCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedCheckType, setSelectedCheckType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BackgroundCheckStatus | null>(null);

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const loadCase = async () => {
    try {
      setLoading(true);
      const data = await api.getCase(caseId!);
      setCaseData(data);
    } catch (error) {
      console.error("Failed to load case:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCheckStatus = async () => {
    if (!selectedCheckType || !selectedStatus || !caseData) return;

    try {
      setUpdating(true);
      const updated = await api.updateCheckStatus(
        caseData.caseId,
        selectedCheckType,
        selectedStatus,
        "current-user@company.com" // TODO: Get from auth context
      );
      setCaseData(updated);
      setSelectedCheckType(null);
      setSelectedStatus(null);
    } catch (error) {
      console.error("Failed to update check status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAdminDecision = async (decision: "APPROVED" | "REJECTED" | "NEEDS_REVIEW") => {
    if (!caseData) return;

    try {
      setUpdating(true);
      const updated = await api.submitAdminDecision(
        caseData.caseId,
        decision,
        `Background checks reviewed and decision made: ${decision}`,
        "current-user@company.com" // TODO: Get from auth context
      );
      setCaseData(updated);
    } catch (error) {
      console.error("Failed to submit admin decision:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading case...</div>;
  }

  if (!caseData) {
    return <div className="min-h-screen flex items-center justify-center">Case not found</div>;
  }

  const getStatusBadgeColor = (status: BackgroundCheckStatus): string => {
    switch (status) {
      case "NEW":
        return "bg-gray-100 text-gray-800";
      case "INVITED":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-amber-100 text-amber-800";
      case "COMPLETED_CLEAR":
        return "bg-green-100 text-green-800";
      case "COMPLETED_REVIEW":
        return "bg-orange-100 text-orange-800";
      case "ERROR":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: BackgroundCheckStatus): string => {
    const labels: Record<BackgroundCheckStatus, string> = {
      NEW: "New",
      INVITED: "Invited",
      PENDING: "Pending",
      IN_PROGRESS: "In Progress",
      COMPLETED_CLEAR: "Approved",
      COMPLETED_REVIEW: "Needs Review",
      ERROR: "Error",
    };
    return labels[status] || status;
  };

  const getCheckTypeLabel = (checkType: string): string => {
    const labels: Record<string, string> = {
      IDENTITY_VERIFICATION: "Identity Verification",
      CRIMINAL_HISTORY_CHECK: "Criminal History Check",
      EMPLOYMENT_VERIFICATION: "Employment Verification",
      EDUCATION_VERIFICATION: "Education Verification (Optional)",
      RIGHT_TO_WORK: "Right-to-Work Eligibility (I-9)",
    };
    return labels[checkType] || checkType;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const daysUntilStart = Math.ceil(
    (new Date(caseData.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-900 mb-4 text-sm font-medium"
          >
            ← Back
          </button>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{caseData.candidateName}</h1>
              <p className="text-gray-600 mt-1">{caseData.candidateEmail}</p>
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <span className="font-medium text-gray-700">Order ID:</span>{" "}
                  <span className="text-gray-600">{caseData.orderId}</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700">Case ID:</span>{" "}
                  <span className="text-gray-600">{caseData.caseId}</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700">Owner:</span>{" "}
                  <span className="text-gray-600">{caseData.owner}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Overall Status</p>
                <span className={`inline-block mt-2 px-4 py-2 rounded-full text-sm font-bold ${getStatusBadgeColor(caseData.overallStatus)}`}>
                  {getStatusLabel(caseData.overallStatus)}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Overall Score:</span> {caseData.overallScore}
                </p>
                <p className={`text-sm font-medium ${caseData.slaRisk ? "text-red-600" : "text-green-600"}`}>
                  {caseData.slaRisk ? "⚠ SLA At Risk" : "✓ On Track"}
                </p>
                {caseData.slaRisk && (
                  <p className="text-xs text-red-500">Start date in {daysUntilStart} days</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-8">
          {/* Left Column: Checklist */}
          <div className="col-span-2">
            {/* Checklist Panel */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Background Check Checklist</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {caseData.checks.filter((c) => c.status.startsWith("COMPLETED")).length} of {caseData.checks.length} completed
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {caseData.checks.map((check) => (
                  <div key={check.checkId} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{getCheckTypeLabel(check.checkType)}</h3>
                          {!check.isRequired && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">Optional</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {check.checkType}
                        </p>

                        {check.vendorReference && (
                          <p className="text-xs text-gray-500 mt-2">
                            <span className="font-medium">Vendor Ref:</span> {check.vendorReference}
                          </p>
                        )}

                        {check.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            "{check.notes}"
                          </p>
                        )}

                        {check.completedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Completed: {formatDateTime(check.completedAt)}
                          </p>
                        )}
                      </div>

                      <div className="ml-4 text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(check.status)}`}>
                          {getStatusLabel(check.status)}
                        </span>
                      </div>
                    </div>

                    {/* Update Control */}
                    {selectedCheckType === check.checkType ? (
                      <div className="mt-4 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-4 px-6 py-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          New Status
                        </label>
                        <select
                          value={selectedStatus || ""}
                          onChange={(e) => setSelectedStatus(e.target.value as BackgroundCheckStatus)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                        >
                          <option value="">Select status...</option>
                          <option value="NEW">New</option>
                          <option value="INVITED">Invited</option>
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED_CLEAR">Approved</option>
                          <option value="COMPLETED_REVIEW">Needs Review</option>
                          <option value="ERROR">Error</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateCheckStatus}
                            disabled={updating || !selectedStatus}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                          >
                            {updating ? "Updating..." : "Update"}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCheckType(null);
                              setSelectedStatus(null);
                            }}
                            className="flex-1 px-3 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedCheckType(check.checkType)}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Update Status →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Panel */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Timeline</h2>
              </div>

              <div className="p-6">
                {caseData.timeline.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No timeline events yet</p>
                ) : (
                  <div className="space-y-6">
                    {caseData.timeline.map((event, idx) => (
                      <div key={event.id} className="flex gap-4">
                        {/* Timeline Connector */}
                        {idx !== caseData.timeline.length - 1 && (
                          <div className="absolute left-[31px] top-[calc(100%)] w-0.5 h-6 bg-gray-300"></div>
                        )}

                        {/* Timeline Dot */}
                        <div className="relative flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full mt-1.5 ${
                            event.eventType === "STATUS_CHANGE"
                              ? "bg-blue-500"
                              : event.eventType === "SCORE_CHANGE"
                              ? "bg-purple-500"
                              : event.eventType === "DECISION"
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`} />
                        </div>

                        {/* Event Content */}
                        <div className="flex-1 pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{event.title}</p>
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                              {formatDateTime(event.timestamp)}
                            </span>
                          </div>
                          {event.actor && (
                            <p className="text-xs text-gray-500 mt-2">
                              By: <span className="font-medium">{event.actor}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Admin Decision */}
          <div>
            <div className="bg-white rounded-lg shadow sticky top-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Admin Decision</h2>
              </div>

              <div className="p-6 space-y-4">
                {caseData.adminDecision && caseData.adminDecision !== "IN_PROGRESS" ? (
                  <>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-600 font-medium">Decision</p>
                      <p className={`text-lg font-bold mt-1 ${
                        caseData.adminDecision === "APPROVED"
                          ? "text-green-600"
                          : caseData.adminDecision === "REJECTED"
                          ? "text-red-600"
                          : "text-orange-600"
                      }`}>
                        {caseData.adminDecision === "APPROVED"
                          ? "Approved"
                          : caseData.adminDecision === "REJECTED"
                          ? "Rejected"
                          : "Needs Review"}
                      </p>
                    </div>
                    <button
                      onClick={() => setCaseData({ ...caseData, adminDecision: "IN_PROGRESS" })}
                      className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      Change Decision
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      No final decision recorded yet. Record a decision below.
                    </p>

                    <button
                      onClick={() => handleAdminDecision("APPROVED")}
                      disabled={updating}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm"
                    >
                      ✓ Approve
                    </button>

                    <button
                      onClick={() => handleAdminDecision("NEEDS_REVIEW")}
                      disabled={updating}
                      className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium text-sm"
                    >
                      ⚠ Needs Review
                    </button>

                    <button
                      onClick={() => handleAdminDecision("REJECTED")}
                      disabled={updating}
                      className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-sm"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Key Info */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-xs font-semibold text-gray-700 mb-2">Quick Info</p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>
                    <span className="font-medium">Start Date:</span> {formatDate(caseData.startDate)}
                  </li>
                  <li>
                    <span className="font-medium">Days Until:</span> {daysUntilStart}
                  </li>
                  <li>
                    <span className="font-medium">Created:</span> {formatDate(caseData.createdAt)}
                  </li>
                  <li>
                    <span className="font-medium">Updated:</span> {formatDate(caseData.updatedAt)}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
