/**
 * Enterprise Background Verification System
 * 
 * ENTERPRISE PATTERNS:
 * - Status enum used across all checks and cases (no custom statuses)
 * - FCRA-safe wording (no "fail", no "reject")
 * - Timeline-based UI (Sterling-style status progression)
 * - Audit trail for all state changes
 */

/**
 * STANDARDIZED STATUS ENUM
 * Used for both individual checks and overall case status
 */
export type BackgroundCheckStatus = 
  | "NEW"                   // Check created, not yet invited
  | "INVITED"               // e-invite sent, candidate action pending
  | "PENDING"               // Waiting to start processing
  | "IN_PROGRESS"           // Vendor is actively processing
  | "COMPLETED_CLEAR"       // Completed and clear
  | "COMPLETED_REVIEW"      // Completed but requires human review
  | "ERROR";                // API failure, vendor error, missing data

/**
 * Check type enumeration
 */
export type CheckType = 
  | "IDENTITY_VERIFICATION"
  | "CRIMINAL_HISTORY_CHECK"
  | "EMPLOYMENT_VERIFICATION"
  | "EDUCATION_VERIFICATION"
  | "RIGHT_TO_WORK";

/**
 * Individual background check
 */
export interface BackgroundCheck {
  checkId: string;
  checkType: CheckType;
  status: BackgroundCheckStatus;
  statusLabel: string;                    // Human-readable status
  isRequired: boolean;
  lastUpdated: string;                    // ISO timestamp
  vendorReference?: string;               // Sterling order ID, etc. (matches payload field name)
  vendorReferenceId?: string;             // Legacy alias
  notes?: string;                         // Internal notes (FCRA-safe only)
  completedAt?: string;
  estimatedCompletionDate?: string;
  updatedAt?: string;                     // Last update timestamp
  vendorMetadata?: Record<string, any>;   // Vendor-provided metadata
}

/**
 * Overall score derived from check statuses
 */
export type OverallScore = "CLEAR" | "NEEDS_REVIEW" | "PENDING";

/**
 * Admin decision on the case
 */
export type AdminDecision = "IN_PROGRESS" | "APPROVED" | "REJECTED" | "NEEDS_REVIEW";

/**
 * Enterprise background check case
 */
export interface BackgroundCheckCase {
  // IDs
  caseId: string;
  orderId: string;
  candidateId: string;

  // Candidate info
  candidateName: string;
  candidateEmail: string;
  startDate: string;                      // Target start date (ISO)

  // Status tracking
  checks: BackgroundCheck[];              // Array of 5 checks
  overallStatus: BackgroundCheckStatus;   // Derived from checks
  overallScore: OverallScore;             // CLEAR | NEEDS_REVIEW | PENDING
  adminDecision: AdminDecision;           // IN_PROGRESS | APPROVED | REJECTED

  // Metadata
  owner: string;                          // PX Ops owner email
  slaRisk: boolean;                       // Start date within N days?
  createdAt: string;
  updatedAt: string;

  // Timeline (audit trail)
  timeline: TimelineEvent[];

  // Classification
  securityClassification: "SENSITIVE";
}

/**
 * Timeline event for audit trail (Sterling-style)
 */
export interface TimelineEvent {
  id: string;
  timestamp: string;                      // ISO timestamp
  eventType: "STATUS_CHANGE" | "CREATED" | "SCORE_CHANGE" | "DECISION" | "CHECK_UPDATED" | "ADMIN_DECISION";
  title: string;                          // e.g. "Status: Pending"
  description?: string;
  actor?: string;                         // User or system that created this event
  metadata?: Record<string, any>;
}

/**
 * Exception case (blocked or at-risk)
 */
export interface ExceptionCase {
  caseId: string;
  orderId: string;
  candidateName: string;
  reason: string;                         // Why it's blocked (human-readable)
  status: "UNREVIEWED" | "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED";
  assignedTo?: string;                    // Geoff or other resolver
  notes?: string;
  createdAt: string;
  updatedAt: string;
}


/**
 * API Payloads for Background Check Operations
 */

/**
 * Create new case request (from onboarding system)
 */
export interface CreateBackgroundCheckPayload {
  orderId: string;
  candidateId?: string;
  candidateName: string;
  candidateEmail: string;
  startDate: string;                      // Target start date
  owner: string;                          // PX Ops owner email
}

/**
 * Update check status (from Sterling webhook or manual update)
 */
export interface UpdateCheckStatusPayload {
  status: BackgroundCheckStatus;
  updatedBy: string;                      // User email or system
  notes?: string;
  vendorReference?: string;               // Vendor reference ID
  completedAt?: string;
  estimatedCompletionDate?: string;
}

/**
 * Admin decision endpoint
 */
export interface AdminDecisionPayload {
  decision: "APPROVED" | "REJECTED" | "NEEDS_REVIEW";
  reasoning: string;                      // Why this decision
  notes?: string;
  decidedBy: string;                      // Admin email
}

/**
 * Escalation/Exception creation
 */
export interface CreateExceptionPayload {
  caseId: string;
  reason: string;
  notes?: string;
  assignedTo?: string;
}

/**
 * Inbound from Sterling or other vendor
 */
export interface VendorWebhookPayload {
  orderId: string;
  checkType: CheckType;
  status: BackgroundCheckStatus;
  statusLabel: string;
  score?: string;
  completionDate?: string;
  estimatedCompletionDate?: string;
  vendorReferenceId?: string;
  [key: string]: any;
}

