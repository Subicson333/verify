# Step 1: Enterprise Data Models & Status Enums - COMPLETE ✅

## What Has Been Defined

### 1. **Standardized Status Enum** (BackgroundCheckStatus)
Used across ALL checks and cases - no custom statuses:

```
NEW                 // Check created, not yet invited
INVITED             // e-invite sent, candidate action pending
PENDING             // Waiting to start processing
IN_PROGRESS         // Vendor is actively processing
COMPLETED_CLEAR     // Completed and clear
COMPLETED_REVIEW    // Completed but requires human review
ERROR               // API failure, vendor error, missing data
```

### 2. **Individual Check Model** (BackgroundCheck)
Each of 5 checks stores:
- `checkId` - Unique identifier
- `checkType` - Type (IDENTITY, CRIMINAL, EMPLOYMENT, EDUCATION, RIGHT_TO_WORK)
- `status` - One of 7 statuses above
- `statusLabel` - Human-readable ("Clear", "In Progress", etc.)
- `isRequired` - Boolean (4 required, 1 optional)
- `lastUpdated` - ISO timestamp
- `vendorReferenceId` - Sterling order ID, etc.
- `notes` - Internal FCRA-safe notes
- `completedAt` - When it completed
- `estimatedCompletionDate` - Vendor's ETA

### 3. **Enterprise Case Model** (BackgroundCheckCase)

#### Identifiers
- `caseId` - Unique case ID
- `orderId` - Order ID from onboarding system
- `candidateId` - Candidate ID

#### Candidate Info
- `candidateName` - Candidate name
- `candidateEmail` - Candidate email
- `startDate` - Target start date (ISO)

#### Status Tracking
- `checks: BackgroundCheck[]` - Array of 5 checks
- `overallStatus` - Derived from checks (see rules below)
- `overallScore` - CLEAR | NEEDS_REVIEW | PENDING
- `adminDecision` - IN_PROGRESS | APPROVED | REJECTED

#### Metadata
- `owner` - PX Ops owner email
- `slaRisk` - Boolean (start date within 3 days?)
- `createdAt` - ISO timestamp
- `updatedAt` - ISO timestamp

#### Audit Trail
- `timeline: TimelineEvent[]` - Sterling-style status progression

### 4. **Timeline Event Model** (TimelineEvent)
For Sterling-style status display:
- `timestamp` - ISO timestamp
- `eventType` - CREATED | STATUS_CHANGE | SCORE_CHANGE | DECISION
- `title` - "Status: Pending" or "Score: Clear"
- `description` - Details
- `metadata` - Additional data

### 5. **Exception Case Model** (ExceptionCase)
For blocked/at-risk cases:
- `caseId` - Reference to main case
- `candidateName` - Candidate
- `reason` - Why blocked (human-readable)
- `status` - UNREVIEWED | ACKNOWLEDGED | ASSIGNED | RESOLVED
- `assignedTo` - Geoff or other resolver
- `notes` - Exception notes
- `createdAt` / `updatedAt` - Timestamps

### 6. **Overall Score Derivation Rules**

**overallStatus** logic (from StatusDerivation service):
```typescript
IF ANY check.status === "ERROR"
  → overallStatus = "ERROR"
ELSE IF ANY check.status === "COMPLETED_REVIEW"
  → overallStatus = "COMPLETED_REVIEW"
ELSE IF ALL mandatory checks === "COMPLETED_CLEAR"
  → overallStatus = "COMPLETED_CLEAR"
ELSE
  → overallStatus = "IN_PROGRESS"
```

**overallScore** logic:
```typescript
IF ANY check is "COMPLETED_REVIEW" or "ERROR"
  → overallScore = "NEEDS_REVIEW"
ELSE IF ALL mandatory checks === "COMPLETED_CLEAR"
  → overallScore = "CLEAR"
ELSE
  → overallScore = "PENDING"
```

**slaRisk** logic:
```typescript
slaRisk = (startDate - today) <= 3 days AND >= 0 days
```

### 7. **API Payloads Defined**

#### CreateBackgroundCheckPayload
```typescript
{
  orderId: string
  candidateId?: string
  candidateName: string
  candidateEmail: string
  startDate: string
  owner: string  // PX Ops owner email
}
```

#### UpdateCheckStatusPayload
```typescript
{
  checkType: CheckType
  status: BackgroundCheckStatus
  vendorReferenceId?: string
  notes?: string
  completedAt?: string
  estimatedCompletionDate?: string
}
```

#### AdminDecisionPayload
```typescript
{
  adminDecision: AdminDecision
  notes?: string
  decidedBy: string
}
```

#### VendorWebhookPayload
```typescript
{
  orderId: string
  checkType: CheckType
  status: BackgroundCheckStatus
  statusLabel: string
  score?: string
  completionDate?: string
  estimatedCompletionDate?: string
  vendorReferenceId?: string
  [key: string]: any
}
```

### 8. **Services Implemented**

#### StatusDerivation Service
- `deriveOverallStatus()` - Calculate overall case status
- `deriveOverallScore()` - Calculate overall score
- `checkSLARisk()` - Check if within N days of start date
- `getStatusLabel()` - Human-readable label
- `getStatusBadgeColor()` - Color for UI badge
- `getScoreBadgeColor()` - Color for score badge
- `isBlockingOnboarding()` - Is case blocking onboarding?

#### BackgroundCheckManager Service
- `createNewCase()` - Create case with all 5 checks
- `updateCheckStatus()` - Update individual check
- `getChecklistSummary()` - Summary for UI
- Automatically maintains timeline
- Automatically re-derives status and score

---

## File Changes Summary

### Backend
- ✅ `src/types.ts` - Complete enterprise models
- ✅ `src/services/StatusDerivation.ts` - NEW (status logic)
- ✅ `src/services/BackgroundCheckManager.ts` - NEW (case management)

### Frontend
- ✅ `frontend/src/types.ts` - Matching types

---

## Key Design Decisions

1. **Single Status Enum** - Same 7 statuses used everywhere (not multiple enums)
2. **Derived Fields** - overallStatus & overallScore calculated from checks (not stored manually)
3. **Timeline-Based** - Every status change creates timeline event (Sterling-style)
4. **FCRA-Safe** - No "fail/reject" language, only status indicators
5. **Mandatory Checks** - 4 required (Identity, Criminal, Employment, Right-to-Work), 1 optional (Education)
6. **SLA Tracking** - Start date risk automatically calculated
7. **Audit Trail** - Every event timestamped and logged

---

## Enterprise Patterns Implemented

✅ No hardcoded vendor logic (Sterling is an example)
✅ Vendor-agnostic webhook handler (VendorWebhookPayload)
✅ FCRA-safe wording (no "fail", no "reject")
✅ Timeline-based status display
✅ Derived metrics (not manual entry)
✅ Role-based authorization ready
✅ Audit trail for compliance

---

## Next Steps

Ready to proceed to:

### **Step 2: Build Dashboard UI**
Create a table showing:
- Candidate, Start Date, Status, Score, Last Updated, SLA Risk, Owner, Actions
- Filters for Status, Start Date Range, SLA Risk
- Badges for status (green/amber/red)

Would you like me to proceed with Step 2?
