/**
 * Background Check Dashboard
 * 
 * Enterprise dashboard showing:
 * - All background check cases
 * - Individual case status and overall score
 * - SLA risk indicators
 * - Filterable by status, date range, owner
 * - Sterling-style status badges
 */

import React, { useEffect, useState } from "react";
import { api } from "../api";
import { BackgroundCheckCase, BackgroundCheckStatus, CheckType } from "../types";

interface DashboardFilters {
  status?: BackgroundCheckStatus;
  owner?: string;
  startDateFrom?: string;
  startDateTo?: string;
}

interface VerificationReviewState {
  checkType: CheckType;
  isReviewed: boolean;
  verdict?: "CLEAR" | "NOT_CLEAR";
  comment?: string;
}

interface ModalState {
  isOpen: boolean;
  selectedCase: BackgroundCheckCase | null;
  reviewState: Record<string, VerificationReviewState>;
  isSubmitting?: boolean;
  submitSuccess?: boolean;
}

export const BackgroundCheckDashboard: React.FC = () => {
  const [cases, setCases] = useState<BackgroundCheckCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [selectedStatus, setSelectedStatus] = useState<BackgroundCheckStatus | "ALL">("ALL");
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    selectedCase: null,
    reviewState: {},
    isSubmitting: false,
    submitSuccess: false,
  });

  useEffect(() => {
    loadCases();
  }, [filters]);

  const loadCases = async () => {
    try {
      setLoading(true);
      const response = await api.getCases(filters);
      setCases(response);
    } catch (error) {
      console.error("Failed to load cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status: BackgroundCheckStatus | "ALL") => {
    setSelectedStatus(status);
    if (status === "ALL") {
      setFilters({ ...filters, status: undefined });
    } else {
      setFilters({ ...filters, status });
    }
  };

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

  const getScoreBadgeColor = (score: string): string => {
    switch (score) {
      case "CLEAR":
        return "bg-green-50 border-green-200";
      case "NEEDS_REVIEW":
        return "bg-orange-50 border-orange-200";
      case "PENDING":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSLARiskLabel = (slaRisk: boolean, startDate: string): string => {
    if (!slaRisk) return "✓ On Track";
    const daysUntilStart = Math.ceil(
      (new Date(startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilStart <= 0) return "⚠ Overdue";
    if (daysUntilStart <= 3) return "⚠ Critical";
    return "✓ On Track";
  };

  const openVerificationReview = (caseData: BackgroundCheckCase) => {
    const initialReviewState: Record<string, VerificationReviewState> = {};
    caseData.checks.forEach((check) => {
      initialReviewState[check.checkType] = {
        checkType: check.checkType,
        isReviewed: false,
        verdict: undefined,
        comment: undefined,
      };
    });
    setModalState({
      isOpen: true,
      selectedCase: caseData,
      reviewState: initialReviewState,
    });
  };

  const closeVerificationReview = () => {
    setModalState({ isOpen: false, selectedCase: null, reviewState: {} });
  };

  const handleCheckboxChange = (checkType: CheckType) => {
    setModalState({
      ...modalState,
      reviewState: {
        ...modalState.reviewState,
        [checkType]: {
          ...modalState.reviewState[checkType],
          isReviewed: !modalState.reviewState[checkType].isReviewed,
          verdict: !modalState.reviewState[checkType].isReviewed ? undefined : modalState.reviewState[checkType].verdict,
          comment: !modalState.reviewState[checkType].isReviewed ? undefined : modalState.reviewState[checkType].comment,
        },
      },
    });
  };

  const handleVerdictChange = (checkType: CheckType, verdict: "CLEAR" | "NOT_CLEAR") => {
    setModalState({
      ...modalState,
      reviewState: {
        ...modalState.reviewState,
        [checkType]: {
          ...modalState.reviewState[checkType],
          verdict,
          comment: verdict === "NOT_CLEAR" ? modalState.reviewState[checkType].comment || "" : undefined,
        },
      },
    });
  };

  const handleCommentChange = (checkType: CheckType, comment: string) => {
    setModalState({
      ...modalState,
      reviewState: {
        ...modalState.reviewState,
        [checkType]: {
          ...modalState.reviewState[checkType],
          comment,
        },
      },
    });
  };

  const getCheckTypeLabel = (checkType: CheckType): string => {
    const labels: Record<CheckType, string> = {
      IDENTITY_VERIFICATION: "Identity Verification",
      CRIMINAL_HISTORY_CHECK: "Criminal History Check",
      EMPLOYMENT_VERIFICATION: "Employment Verification",
      EDUCATION_VERIFICATION: "Education Verification",
      RIGHT_TO_WORK: "Right to Work Eligibility (I-9)",
    };
    return labels[checkType] || checkType;
  };

  const isSubmitValid = (): boolean => {
    // Submit is valid if no items are checked, or all checked items have verdicts and required comments
    const reviewState = modalState.reviewState;
    for (const [_checkType, state] of Object.entries(reviewState)) {
      if (state.isReviewed) {
        if (!state.verdict) return false; // Verdict required if checkbox checked
        if (state.verdict === "NOT_CLEAR" && !state.comment?.trim()) return false; // Comment required for "Not Clear"
      }
    }
    return true;
  };

  const handleSubmitReview = async () => {
    if (!modalState.selectedCase) return;

    const verifications = modalState.selectedCase.checks
      .map((check) => ({
        type: getCheckTypeLabel(check.checkType),
        status: modalState.reviewState[check.checkType]?.verdict || "Clear",
        comment: modalState.reviewState[check.checkType]?.verdict === "NOT_CLEAR" 
          ? modalState.reviewState[check.checkType]?.comment 
          : null,
      }))
      .filter((v) => modalState.reviewState[v.type.split(" ")[0]]?.isReviewed);

    const submission = {
      caseId: modalState.selectedCase.caseId,
      submittedAt: new Date().toISOString(),
      submittedBy: "admin@company.com",
      verifications,
    };

    setModalState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const response = await fetch("http://localhost:5002/api/cases/verification-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });

      if (response.ok) {
        setModalState((prev) => ({
          ...prev,
          isSubmitting: false,
          submitSuccess: true,
        }));

        // Auto-close after 2 seconds
        setTimeout(() => {
          closeVerificationReview();
        }, 2000);
      } else {
        alert("Failed to submit review");
        setModalState((prev) => ({ ...prev, isSubmitting: false }));
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Error submitting review");
      setModalState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Background Checks</h1>
        <p className="text-gray-600">Manage and monitor candidate verification status</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {(["ALL", "NEW", "INVITED", "PENDING", "IN_PROGRESS", "COMPLETED_CLEAR", "COMPLETED_REVIEW", "ERROR"] as const).map((status) => (
          <button
            key={status}
            onClick={() => handleStatusFilter(status as any)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedStatus === status
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {status === "ALL" ? "All Cases" : getStatusLabel(status as BackgroundCheckStatus)}
          </button>
        ))}
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No cases found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Candidate</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Start Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SLA Risk</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Owner</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Updated</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cases.map((caseData) => (
                <tr key={caseData.caseId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{caseData.candidateName}</p>
                      <p className="text-sm text-gray-500">{caseData.candidateEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{caseData.orderId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(caseData.startDate)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(caseData.overallStatus)}`}>
                      {getStatusLabel(caseData.overallStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-lg text-xs font-medium border ${getScoreBadgeColor(caseData.overallScore)}`}
                    >
                      {caseData.overallScore}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${caseData.slaRisk ? "text-orange-600" : "text-green-600"}`}>
                      {getSLARiskLabel(caseData.slaRisk, caseData.startDate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{caseData.owner}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(caseData.updatedAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openVerificationReview(caseData)}
                      className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary Stats */}
      {cases.length > 0 && (
        <div className="mt-8 grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Total Cases</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{cases.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Approved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {cases.filter((c) => c.overallStatus === "COMPLETED_CLEAR").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">Needs Review</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {cases.filter((c) => c.overallStatus === "COMPLETED_REVIEW").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">SLA At Risk</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{cases.filter((c) => c.slaRisk).length}</p>
          </div>
        </div>
      )}

      {/* Verification Review Modal */}
      {modalState.isOpen && modalState.selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Verification Review</h2>
                <p className="text-sm text-gray-600 mt-1">{modalState.selectedCase.candidateName}</p>
              </div>
              <button
                onClick={closeVerificationReview}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              <p className="text-sm text-gray-700 mb-6">
                Review each verification item. Select an option from the dropdown for items being reviewed.
              </p>

              {/* Verification Items List */}
              <div className="space-y-6">
                {modalState.selectedCase.checks.map((check) => (
                  <div key={check.checkId} className="border border-gray-200 rounded-lg p-4">
                    {/* Checkbox and Label */}
                    <div className="flex items-start gap-3 mb-4">
                      <input
                        type="checkbox"
                        id={`check-${check.checkId}`}
                        checked={modalState.reviewState[check.checkType]?.isReviewed || false}
                        onChange={() => handleCheckboxChange(check.checkType)}
                        className="w-5 h-5 rounded border-gray-300 mt-1 cursor-pointer"
                      />
                      <label htmlFor={`check-${check.checkId}`} className="flex-1 cursor-pointer">
                        <p className="font-medium text-gray-900">{getCheckTypeLabel(check.checkType)}</p>
                        <p className="text-xs text-gray-500 mt-1">Mark as reviewed to select a verdict</p>
                      </label>
                    </div>

                    {/* Dropdown - Only shown when checkbox is checked */}
                    {modalState.reviewState[check.checkType]?.isReviewed && (
                      <div className="ml-8 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Verdict <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={modalState.reviewState[check.checkType]?.verdict || ""}
                            onChange={(e) => handleVerdictChange(check.checkType, e.target.value as "CLEAR" | "NOT_CLEAR")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">-- Select verdict --</option>
                            <option value="CLEAR">Clear</option>
                            <option value="NOT_CLEAR">Not Clear</option>
                          </select>
                        </div>

                        {/* Comment Field - Only shown when "Not Clear" is selected */}
                        {modalState.reviewState[check.checkType]?.verdict === "NOT_CLEAR" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Comment / Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={modalState.reviewState[check.checkType]?.comment || ""}
                              onChange={(e) => handleCommentChange(check.checkType, e.target.value)}
                              placeholder="Enter the reason why this verification could not be confirmed..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              rows={3}
                            />
                            <p className="text-xs text-gray-500 mt-1">This comment will help document the review decision.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Info Banner */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                  <span className="font-semibold">Note:</span> Click "Submit" to save your verification review.
                </p>
              </div>

              {/* Success Message */}
              {modalState.submitSuccess && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-900">
                    <span className="font-semibold">✓ Success!</span> Your review has been submitted and saved.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={closeVerificationReview}
                disabled={modalState.isSubmitting}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-sm disabled:opacity-50"
              >
                Close
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={!isSubmitValid() || modalState.isSubmitting}
                className={`px-4 py-2 text-white rounded-lg font-medium text-sm ${
                  isSubmitValid() && !modalState.isSubmitting
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {modalState.isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
