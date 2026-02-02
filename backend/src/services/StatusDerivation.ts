/**
 * Background Check Status Derivation Logic
 * 
 * Enterprise-level derivation for overall case status and score
 * based on individual check statuses
 */

import { BackgroundCheck, BackgroundCheckStatus, OverallScore } from "../types";

export class StatusDerivation {
  /**
   * Derive overall case status from individual checks
   * 
   * Rules:
   * - If ANY check is ERROR → overallStatus = ERROR
   * - If ANY check is COMPLETED_REVIEW → overallStatus = COMPLETED_REVIEW
   * - If ALL mandatory checks are COMPLETED_CLEAR → overallStatus = COMPLETED_CLEAR
   * - Otherwise → overallStatus = IN_PROGRESS
   */
  static deriveOverallStatus(checks: BackgroundCheck[]): BackgroundCheckStatus {
    // Get mandatory checks (all except EDUCATION_VERIFICATION)
    const mandatoryChecks = checks.filter(c => c.isRequired);

    // Rule 1: Any ERROR
    if (checks.some(c => c.status === "ERROR")) {
      return "ERROR";
    }

    // Rule 2: Any COMPLETED_REVIEW
    if (checks.some(c => c.status === "COMPLETED_REVIEW")) {
      return "COMPLETED_REVIEW";
    }

    // Rule 3: All mandatory checks are COMPLETED_CLEAR
    if (mandatoryChecks.every(c => c.status === "COMPLETED_CLEAR")) {
      return "COMPLETED_CLEAR";
    }

    // Rule 4: Otherwise IN_PROGRESS
    return "IN_PROGRESS";
  }

  /**
   * Derive overall score from check statuses
   * 
   * Rules:
   * - CLEAR: COMPLETED_CLEAR only if all mandatory checks are clear
   * - NEEDS_REVIEW: if any check requires review
   * - PENDING: otherwise
   */
  static deriveOverallScore(checks: BackgroundCheck[]): OverallScore {
    const mandatoryChecks = checks.filter(c => c.isRequired);

    // NEEDS_REVIEW if any check is COMPLETED_REVIEW or ERROR
    if (checks.some(c => c.status === "COMPLETED_REVIEW" || c.status === "ERROR")) {
      return "NEEDS_REVIEW";
    }

    // CLEAR if all mandatory checks are COMPLETED_CLEAR
    if (mandatoryChecks.every(c => c.status === "COMPLETED_CLEAR")) {
      return "CLEAR";
    }

    // Otherwise PENDING
    return "PENDING";
  }

  /**
   * Check if case has SLA risk (start date within N days)
   */
  static checkSLARisk(startDate: string, daysThreshold: number = 3): boolean {
    const start = new Date(startDate);
    const today = new Date();
    const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilStart <= daysThreshold && daysUntilStart >= 0;
  }

  /**
   * Get status label for display
   */
  static getStatusLabel(status: BackgroundCheckStatus): string {
    const labels: Record<BackgroundCheckStatus, string> = {
      NEW: "Not Started",
      INVITED: "Awaiting Candidate",
      PENDING: "Pending",
      IN_PROGRESS: "In Progress",
      COMPLETED_CLEAR: "Clear",
      COMPLETED_REVIEW: "Needs Review",
      ERROR: "Error",
    };
    return labels[status] || status;
  }

  /**
   * Get score badge color
   */
  static getScoreBadgeColor(score: OverallScore): string {
    const colors: Record<OverallScore, string> = {
      CLEAR: "green",
      NEEDS_REVIEW: "red",
      PENDING: "amber",
    };
    return colors[score];
  }

  /**
   * Get status badge color
   */
  static getStatusBadgeColor(status: BackgroundCheckStatus): string {
    switch (status) {
      case "COMPLETED_CLEAR":
        return "green";
      case "COMPLETED_REVIEW":
      case "ERROR":
        return "red";
      case "IN_PROGRESS":
      case "INVITED":
        return "amber";
      case "NEW":
      case "PENDING":
      default:
        return "gray";
    }
  }

  /**
   * Determine if case is blocking onboarding
   */
  static isBlockingOnboarding(status: BackgroundCheckStatus, score: OverallScore): boolean {
    return score !== "CLEAR" || status !== "COMPLETED_CLEAR";
  }
}
