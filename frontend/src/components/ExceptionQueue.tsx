/**
 * Exception Queue - Private Admin View
 * 
 * Shows:
 * - Cases that are blocked or at-risk (SLA, missing data, etc.)
 * - Filters: unreviewed, assigned to me, resolved
 * - Actions: acknowledge, assign, mark resolved
 * 
 * AUTHORIZATION: Admin/PX Ops only (implement in middleware)
 */

import React, { useEffect, useState } from "react";
import { api } from "../api";
import { BackgroundCheckCase } from "../types";

interface ExceptionCase {
  caseId: string;
  orderId: string;
  candidateName: string;
  reason: string;
  status: "UNREVIEWED" | "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED";
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const ExceptionQueue: React.FC = () => {
  const [exceptions, setExceptions] = useState<ExceptionCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "UNREVIEWED" | "ACKNOWLEDGED" | "ASSIGNED">("UNREVIEWED");
  const [selectedException, setSelectedException] = useState<ExceptionCase | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    loadExceptions();
  }, []);

  const loadExceptions = async () => {
    try {
      setLoading(true);
      // Load all cases and derive exceptions
      const cases = await api.getCases();
      const derivedExceptions = deriveExceptions(cases);
      setExceptions(derivedExceptions);
    } catch (error) {
      console.error("Failed to load exceptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const deriveExceptions = (cases: BackgroundCheckCase[]): ExceptionCase[] => {
    const exceptions: ExceptionCase[] = [];

    for (const bgCase of cases) {
      // Rule 1: SLA At Risk
      if (bgCase.slaRisk) {
        exceptions.push({
          caseId: bgCase.caseId,
          orderId: bgCase.orderId,
          candidateName: bgCase.candidateName,
          reason: "SLA at risk: start date within 3 days",
          status: bgCase.adminDecision === "IN_PROGRESS" ? "UNREVIEWED" : "ACKNOWLEDGED",
          createdAt: bgCase.createdAt,
          updatedAt: bgCase.updatedAt,
        });
      }

      // Rule 2: COMPLETED_REVIEW (needs admin review)
      if (bgCase.overallStatus === "COMPLETED_REVIEW") {
        exceptions.push({
          caseId: bgCase.caseId,
          orderId: bgCase.orderId,
          candidateName: bgCase.candidateName,
          reason: "Background check requires admin review",
          status: "ACKNOWLEDGED",
          createdAt: bgCase.createdAt,
          updatedAt: bgCase.updatedAt,
        });
      }

      // Rule 3: ERROR status
      if (bgCase.overallStatus === "ERROR") {
        exceptions.push({
          caseId: bgCase.caseId,
          orderId: bgCase.orderId,
          candidateName: bgCase.candidateName,
          reason: "Background check error: vendor or system issue",
          status: "UNREVIEWED",
          createdAt: bgCase.createdAt,
          updatedAt: bgCase.updatedAt,
        });
      }

      // Rule 4: Stalled (> 7 days in IN_PROGRESS)
      const daysSinceUpdate = Math.floor(
        (new Date().getTime() - new Date(bgCase.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (bgCase.overallStatus === "IN_PROGRESS" && daysSinceUpdate > 7) {
        exceptions.push({
          caseId: bgCase.caseId,
          orderId: bgCase.orderId,
          candidateName: bgCase.candidateName,
          reason: `Background check stalled: in-progress for ${daysSinceUpdate} days`,
          status: "ACKNOWLEDGED",
          createdAt: bgCase.createdAt,
          updatedAt: bgCase.updatedAt,
        });
      }
    }

    return exceptions;
  };

  const handleAcknowledge = async (exception: ExceptionCase) => {
    try {
      setActionInProgress(true);
      const updated = { ...exception, status: "ACKNOWLEDGED" as const };
      setExceptions((prev) => 
        prev.map((e) => (e.caseId === exception.caseId ? updated : e))
      );
      setSelectedException(updated);
    } catch (error) {
      console.error("Failed to acknowledge:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleAssign = async (exception: ExceptionCase, assignee: string) => {
    try {
      setActionInProgress(true);
      const updated = { ...exception, status: "ASSIGNED" as const, assignedTo: assignee };
      setExceptions((prev) =>
        prev.map((e) => (e.caseId === exception.caseId ? updated : e))
      );
      setSelectedException(updated);
    } catch (error) {
      console.error("Failed to assign:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleResolve = async (exception: ExceptionCase) => {
    try {
      setActionInProgress(true);
      setExceptions((prev) =>
        prev.filter((e) => e.caseId !== exception.caseId)
      );
      setSelectedException(null);
    } catch (error) {
      console.error("Failed to resolve:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  const filteredExceptions =
    filterStatus === "ALL"
      ? exceptions
      : exceptions.filter((e) => e.status === filterStatus);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getReasonBadgeColor = (reason: string): string => {
    if (reason.includes("SLA")) return "bg-red-100 text-red-800";
    if (reason.includes("review")) return "bg-orange-100 text-orange-800";
    if (reason.includes("error")) return "bg-red-100 text-red-800";
    if (reason.includes("stalled")) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exception Queue</h1>
        <p className="text-gray-600">Cases requiring admin attention (SLA at risk, needing review, errors, stalled)</p>
      </div>

      {/* Alert Banner */}
      {filteredExceptions.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-800">
            <span className="font-bold">{filteredExceptions.length}</span> cases require immediate attention
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        {(["UNREVIEWED", "ACKNOWLEDGED", "ASSIGNED", "ALL"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === status
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {status === "ALL" ? "All" : status}
          </button>
        ))}
      </div>

      {/* Queue List */}
      <div className="grid grid-cols-3 gap-8">
        {/* Queue Items */}
        <div className="col-span-2">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading exceptions...</div>
          ) : filteredExceptions.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-500">No exceptions in this category</p>
              {filterStatus !== "ALL" && (
                <button
                  onClick={() => setFilterStatus("ALL")}
                  className="mt-3 text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  View all exceptions
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExceptions.map((exception) => (
                <div
                  key={exception.caseId}
                  onClick={() => setSelectedException(exception)}
                  className={`bg-white rounded-lg p-4 border-2 cursor-pointer transition-colors ${
                    selectedException?.caseId === exception.caseId
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{exception.candidateName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{exception.orderId}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getReasonBadgeColor(exception.reason)}`}>
                      {exception.status}
                    </span>
                  </div>

                  <p className="text-sm text-orange-600 font-medium mt-2">{exception.reason}</p>

                  {exception.assignedTo && (
                    <p className="text-xs text-gray-600 mt-2">
                      <span className="font-medium">Assigned to:</span> {exception.assignedTo}
                    </p>
                  )}

                  <p className="text-xs text-gray-500 mt-2">Added: {formatDate(exception.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Panel */}
        <div>
          {selectedException ? (
            <div className="bg-white rounded-lg shadow sticky top-8">
              <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
                <h2 className="text-lg font-bold text-gray-900">Exception Details</h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Exception Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Candidate</p>
                  <p className="text-lg font-bold text-gray-900">{selectedException.candidateName}</p>
                  <p className="text-sm text-gray-600">{selectedException.orderId}</p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Reason</p>
                  <p className="text-sm text-orange-700">{selectedException.reason}</p>
                </div>

                {selectedException.assignedTo && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Currently Assigned To</p>
                    <p className="text-sm text-gray-900">{selectedException.assignedTo}</p>
                  </div>
                )}

                {selectedException.notes && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Notes</p>
                    <p className="text-sm text-gray-600">{selectedException.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  {selectedException.status === "UNREVIEWED" && (
                    <button
                      onClick={() => handleAcknowledge(selectedException)}
                      disabled={actionInProgress}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
                    >
                      Acknowledge
                    </button>
                  )}

                  {selectedException.status !== "RESOLVED" && (
                    <>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssign(selectedException, e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">Assign to...</option>
                        <option value="geoff@company.com">Geoff</option>
                        <option value="you@company.com">Me</option>
                        <option value="other@company.com">Other PX Ops</option>
                      </select>

                      <button
                        onClick={() => handleResolve(selectedException)}
                        disabled={actionInProgress}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm"
                      >
                        Mark Resolved
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => (window.location.href = `/cases/${selectedException.caseId}`)}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium text-sm"
                  >
                    View Full Case →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">Select an exception to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
