/**
 * Enterprise Background Check Routes
 * 
 * Endpoints for case management, check updates, and admin actions
 */

import { Router, Request, Response } from "express";
import { CaseStorage } from "../storage";
import { BackgroundCheckManager } from "../services/BackgroundCheckManager";
import { StatusDerivation } from "../services/StatusDerivation";
import * as fs from "fs";
import * as path from "path";
import { 
  CreateBackgroundCheckPayload, 
  UpdateCheckStatusPayload,
  AdminDecisionPayload,
  VendorWebhookPayload,
  BackgroundCheckCase,
  BackgroundCheck,
  TimelineEvent
} from "../types";

const router = Router();

/**
 * POST /api/cases
 * Create a new background check case
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const payload = req.body as CreateBackgroundCheckPayload;
    
    const newCase = BackgroundCheckManager.createNewCase(payload);
    CaseStorage.saveCase(newCase);
    
    res.status(201).json(newCase);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/cases
 * List all cases with optional filters (status, owner, startDate range)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, owner, startDateFrom, startDateTo } = req.query;
    let cases = CaseStorage.getAllCases();
    
    // Filter by status
    if (status) {
      cases = cases.filter((c: BackgroundCheckCase) => c.overallStatus === status);
    }
    
    // Filter by owner
    if (owner) {
      cases = cases.filter((c: BackgroundCheckCase) => c.owner === owner);
    }
    
    // Filter by start date range
    if (startDateFrom) {
      const from = new Date(startDateFrom as string);
      cases = cases.filter((c: BackgroundCheckCase) => new Date(c.startDate) >= from);
    }
    if (startDateTo) {
      const to = new Date(startDateTo as string);
      cases = cases.filter((c: BackgroundCheckCase) => new Date(c.startDate) <= to);
    }
    
    res.json(cases);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/cases/:id
 * Get specific case with full timeline
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const backgroundCase = CaseStorage.findCaseById(id);
    
    if (!backgroundCase) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    
    res.json(backgroundCase);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/cases/:id/checks/:checkType
 * Update individual check status
 */
router.patch("/:id/checks/:checkType", async (req: Request, res: Response) => {
  try {
    const { id, checkType } = req.params;
    const payload = req.body as UpdateCheckStatusPayload;
    
    const backgroundCase = CaseStorage.findCaseById(id);
    if (!backgroundCase) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    
    const updatedCase = BackgroundCheckManager.updateCheckStatus(
      backgroundCase,
      checkType as any,
      payload.status,
      {
        vendorReferenceId: payload.vendorReference,
        notes: payload.notes,
        completedAt: payload.completedAt
      }
    );
    
    CaseStorage.saveCase(updatedCase);
    
    res.json(updatedCase);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cases/:id/admin-decision
 * Admin decision endpoint (APPROVE, NEEDS_REVIEW, BLOCK)
 */
router.post("/:id/admin-decision", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body as AdminDecisionPayload;
    
    const backgroundCase = CaseStorage.findCaseById(id);
    if (!backgroundCase) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    
    // Record admin decision
    backgroundCase.adminDecision = payload.decision;
    
    // Add timeline event
    const timelineEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: "ADMIN_DECISION",
      title: `Admin Decision: ${payload.decision}`,
      description: payload.reasoning,
      actor: payload.decidedBy,
      metadata: { decision: payload.decision }
    };
    backgroundCase.timeline.push(timelineEvent);
    
    CaseStorage.saveCase(backgroundCase);
    
    res.json(backgroundCase);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cases/webhook/vendor
 * Webhook endpoint for vendor updates (Sterling, etc.)
 */
router.post("/webhook/vendor", async (req: Request, res: Response) => {
  try {
    const payload = req.body as VendorWebhookPayload;
    
    // Find case by vendor reference
    let backgroundCase = CaseStorage.getAllCases().find(c => 
      c.checks.some(ch => ch.vendorReference === payload.vendorReference)
    );
    
    if (!backgroundCase) {
      // Create new case if not found
      const newPayload: CreateBackgroundCheckPayload = {
        candidateName: payload.vendorData?.candidateName || "Unknown",
        candidateEmail: payload.vendorData?.candidateEmail || "",
        orderId: payload.vendorData?.orderId || "",
        startDate: payload.vendorData?.startDate || new Date().toISOString(),
        owner: "system"
      };
      backgroundCase = BackgroundCheckManager.createNewCase(newPayload);
    }
    
    // Find matching check and update status
    const check = backgroundCase.checks.find(ch => ch.vendorReference === payload.vendorReference);
    if (check) {
      check.status = payload.status;
      check.updatedAt = new Date().toISOString();
      check.vendorMetadata = payload.vendorData;
      
      // Re-derive overall metrics
      backgroundCase.overallStatus = StatusDerivation.deriveOverallStatus(backgroundCase.checks);
      backgroundCase.overallScore = StatusDerivation.deriveOverallScore(backgroundCase.checks);
      backgroundCase.slaRisk = StatusDerivation.checkSLARisk(backgroundCase.startDate);
      
      // Add timeline event
      const timelineEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType: "CHECK_UPDATED",
        title: `${check.checkType} updated to ${payload.status}`,
        description: `Vendor: ${payload.vendor}`,
        actor: payload.vendor,
        metadata: { checkType: check.checkType, status: payload.status }
      };
      backgroundCase.timeline.push(timelineEvent);
      
      CaseStorage.saveCase(backgroundCase);
    }
    
    res.json({ success: true, caseId: backgroundCase.caseId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/cases/:id/checklist-summary
 * Get summary of checks (counts of completed, clear, needs_review, etc.)
 */
router.get("/:id/checklist-summary", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const backgroundCase = CaseStorage.findCaseById(id);
    
    if (!backgroundCase) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    
    const summary = BackgroundCheckManager.getChecklistSummary(backgroundCase);
    
    res.json({
      caseId: id,
      ...summary,
      overallStatus: backgroundCase.overallStatus,
      overallScore: backgroundCase.overallScore
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/verification-submissions
 * Save a verification review submission to JSON file
 * Data capture only - no workflow changes
 */
router.post("/verification-submissions", async (req: Request, res: Response) => {
  try {
    const submission = req.body;
    const dataDir = path.join(__dirname, "../..", "data");
    const submissionsFile = path.join(dataDir, "verification_submissions.json");

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Read existing submissions or create new array
    let submissions: any[] = [];
    if (fs.existsSync(submissionsFile)) {
      const content = fs.readFileSync(submissionsFile, "utf-8");
      const data = JSON.parse(content);
      submissions = data.submissions || [];
    }

    // Append new submission
    submissions.push(submission);

    // Write back to file
    fs.writeFileSync(
      submissionsFile,
      JSON.stringify({ submissions }, null, 2)
    );

    res.status(201).json({
      success: true,
      message: "Verification review submitted successfully",
      submission,
    });
  } catch (error: any) {
    console.error("Error saving verification submission:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
