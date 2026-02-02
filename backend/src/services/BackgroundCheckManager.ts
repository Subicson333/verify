/**
 * Background Check Management Service
 * 
 * Handles creation, updates, and derivation of background check cases
 */

import { BackgroundCheck, BackgroundCheckCase, CheckType, BackgroundCheckStatus, CreateBackgroundCheckPayload } from "../types";
import { StatusDerivation } from "./StatusDerivation";

export class BackgroundCheckManager {
  /**
   * Create a new background check case with all 5 required checks
   */
  static createNewCase(payload: CreateBackgroundCheckPayload): BackgroundCheckCase {
    const now = new Date().toISOString();
    const caseId = payload.orderId;

    // Initialize all 5 checks
    const checks: BackgroundCheck[] = [
      this.createCheck("IDENTITY_VERIFICATION", true, now),
      this.createCheck("CRIMINAL_HISTORY_CHECK", true, now),
      this.createCheck("EMPLOYMENT_VERIFICATION", true, now),
      this.createCheck("EDUCATION_VERIFICATION", false, now),
      this.createCheck("RIGHT_TO_WORK", true, now),
    ];

    // Derive overall status and score
    const overallStatus = StatusDerivation.deriveOverallStatus(checks);
    const overallScore = StatusDerivation.deriveOverallScore(checks);

    // Check SLA risk
    const slaRisk = StatusDerivation.checkSLARisk(payload.startDate);

    // Create case
    const case_: BackgroundCheckCase = {
      caseId,
      orderId: payload.orderId,
      candidateId: payload.candidateId || `cand_${caseId}`,
      candidateName: payload.candidateName,
      candidateEmail: payload.candidateEmail,
      startDate: payload.startDate,
      checks,
      overallStatus,
      overallScore,
      adminDecision: "IN_PROGRESS",
      owner: payload.owner,
      slaRisk,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          id: `evt-${Date.now()}`,
          timestamp: now,
          eventType: "CREATED",
          title: "Background check order created",
          description: `Case created for ${payload.candidateName}`,
          actor: payload.owner,
        },
        {
          id: `evt-${Date.now() + 1}`,
          timestamp: now,
          eventType: "STATUS_CHANGE",
          title: "Status: New",
          description: "Awaiting invitations to be sent to candidate",
          actor: "system",
        },
      ],
      securityClassification: "SENSITIVE",
    };

    return case_;
  }

  /**
   * Create individual check
   */
  private static createCheck(checkType: CheckType, isRequired: boolean, now: string): BackgroundCheck {
    const checkTypeLabels: Record<CheckType, string> = {
      IDENTITY_VERIFICATION: "Identity Verification",
      CRIMINAL_HISTORY_CHECK: "Criminal History Check",
      EMPLOYMENT_VERIFICATION: "Employment Verification",
      EDUCATION_VERIFICATION: "Education Verification",
      RIGHT_TO_WORK: "Right-to-Work Eligibility (I-9)",
    };

    return {
      checkId: `${checkType}_${Date.now()}`,
      checkType,
      status: "NEW",
      statusLabel: StatusDerivation.getStatusLabel("NEW"),
      isRequired,
      lastUpdated: now,
    };
  }

  /**
   * Update a check status and refresh case-level derivations
   */
  static updateCheckStatus(
    case_: BackgroundCheckCase,
    checkType: CheckType,
    newStatus: BackgroundCheckStatus,
    metadata?: { vendorReferenceId?: string; notes?: string; completedAt?: string }
  ): BackgroundCheckCase {
    const now = new Date().toISOString();

    // Find and update the check
    const checkIndex = case_.checks.findIndex(c => c.checkType === checkType);
    if (checkIndex === -1) {
      throw new Error(`Check type ${checkType} not found`);
    }

    const oldStatus = case_.checks[checkIndex].status;
    case_.checks[checkIndex].status = newStatus;
    case_.checks[checkIndex].statusLabel = StatusDerivation.getStatusLabel(newStatus);
    case_.checks[checkIndex].lastUpdated = now;

    if (metadata?.vendorReferenceId) {
      case_.checks[checkIndex].vendorReferenceId = metadata.vendorReferenceId;
    }
    if (metadata?.notes) {
      case_.checks[checkIndex].notes = metadata.notes;
    }
    if (metadata?.completedAt) {
      case_.checks[checkIndex].completedAt = metadata.completedAt;
    }

    // Re-derive overall status and score
    const previousOverallStatus = case_.overallStatus;
    const previousOverallScore = case_.overallScore;

    case_.overallStatus = StatusDerivation.deriveOverallStatus(case_.checks);
    case_.overallScore = StatusDerivation.deriveOverallScore(case_.checks);
    case_.updatedAt = now;

    // Add timeline events if status changed
    if (oldStatus !== newStatus) {
      case_.timeline.push({
        id: `evt-${Date.now()}`,
        timestamp: now,
        eventType: "STATUS_CHANGE",
        title: `${checkType}: ${case_.checks[checkIndex].statusLabel}`,
        description: `${checkType} status changed from ${oldStatus} to ${newStatus}`,
        actor: "system",
        metadata: { checkType, oldStatus, newStatus, ...metadata },
      });
    }

    // Add score change event if score changed
    if (previousOverallScore !== case_.overallScore) {
      case_.timeline.push({
        id: `evt-${Date.now() + 1}`,
        timestamp: now,
        eventType: "SCORE_CHANGE",
        title: `Score: ${case_.overallScore}`,
        description: `Overall score changed from ${previousOverallScore} to ${case_.overallScore}`,
        actor: "system",
        metadata: { previousScore: previousOverallScore, newScore: case_.overallScore },
      });
    }

    return case_;
  }

  /**
   * Get checklist status for UI display
   */
  static getChecklistSummary(case_: BackgroundCheckCase): {
    total: number;
    completed: number;
    clear: number;
    needsReview: number;
    pending: number;
  } {
    return {
      total: case_.checks.length,
      completed: case_.checks.filter(c => c.status.startsWith("COMPLETED")).length,
      clear: case_.checks.filter(c => c.status === "COMPLETED_CLEAR").length,
      needsReview: case_.checks.filter(c => c.status === "COMPLETED_REVIEW").length,
      pending: case_.checks.filter(c => !c.status.startsWith("COMPLETED")).length,
    };
  }
}

// Add missing property to BackgroundCheck for label lookup
declare global {
  namespace Check {
    interface BackgroundCheck {
      checkTypeLabels?: Record<string, string>;
    }
  }
}
