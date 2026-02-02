# Verify App → Lever-Lite Integration Diagram

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Background Check Provider                         │
│                     (Sterling, BI, etc.)                             │
└────────────────────────────────┬────────────────────────────────────┘
                                  │
                                  │ Status + Result
                                  │ (Completed, Clear, etc.)
                                  ↓
        ┌───────────────────────────────────────────────────┐
        │         Verify App Backend                         │
        │  - Normalize Status (6 internal states)            │
        │  - Store minimal safe data                         │
        │  - Present admin UI                                │
        └───────────────┬────────────┬──────────────────────┘
                        │            │
                 Request│            │← GET /api/cases/:id
                  Data  │            │
                        │            ↓
        ┌───────────────↓────────────────────────────────────┐
        │      Verify App Frontend                            │
        │  - Display normalized status badge                  │
        │  - Show 5-item checklist                            │
        │  - Require comment if any item Not Clear            │
        │  - Display admin decision result                    │
        └───────────────┬────────────────────────────────────┘
                        │
                        │ POST /submit + decision
                        │ (all clear OR has comment)
                        ↓
        ┌───────────────────────────────────────────────────┐
        │    Decision Engine (VerificationDecision)          │
        │                                                     │
        │  IF all required items CLEAR:                      │
        │    → currentResult = "CLEARED"                     │
        │    → adminComment = null                           │
        │    → Trigger Lever-Lite callback                   │
        │                                                     │
        │  IF any required item NOT CLEAR:                   │
        │    → currentResult = "REVIEW_REQUIRED"             │
        │    → adminComment = stored                         │
        │    → DO NOT call Lever-Lite                        │
        └──────┬─────────────────────┬──────────────────────┘
               │                     │
    CLEARED    │                     │ REVIEW_REQUIRED
               ↓                     ↓
        ┌─────────────┐      ┌──────────────────┐
        │   Trigger   │      │   Store Case     │
        │Lever-Lite   │      │   with Comment   │
        │ Callback    │      │  Await Manual    │
        │(SAFE DATA)  │      │ Intervention     │
        └──────┬──────┘      └──────────────────┘
               │
               │ POST /api/background-check/callback
               │ {
               │   status: "CLEARED",
               │   candidateId, caseId, orderId,
               │   submittedBy, submittedAt,
               │   adminComment (if exists)
               │ }
               ↓
    ┌─────────────────────────────────────────┐
    │       Lever-Lite Backend                 │
    │  Receives BACKGROUND_CHECK_CLEARED      │
    │  - Marks background check as complete   │
    │  - Unpauses candidate onboarding        │
    │  - Triggers next workflow step          │
    └─────────────────────────────────────────┘
               │
               │
               ↓
    ┌─────────────────────────────────────────┐
    │    Onboarding Continues                  │
    │  - Email templates                       │
    │  - Document collection                  │
    │  - e-signature                           │
    │  - Hire completion                       │
    └─────────────────────────────────────────┘
```

## Detailed Decision Flow

### Scenario A: All Items Clear (Approved)

```
Admin Opens Case
     ↓
Admin sees 5 checklist items
     ↓
Admin checks all 4 required items ✓✓✓✓
     ↓
Admin skips optional Education item
     ↓
No comment field shown (all items clear)
     ↓
Admin enters email: admin@company.com
     ↓
Admin clicks "Submit Verification"
     ↓
Confirmation Modal shows:
"By submitting, you confirm all checks 
are verified as CLEAR and candidate 
is approved to proceed to onboarding."
     ↓
Admin confirms
     ↓
Backend Decision Logic:
  - Check: identityVerified = true
  - Check: criminalHistoryChecked = true
  - Check: employmentVerified = true
  - Check: rightToWorkVerified = true
  - All required = true → CLEARED ✓
     ↓
Save Case:
  - currentStatus = "COMPLETED"
  - currentResult = "CLEARED"
  - adminComment = null (ignored)
  - submittedBy = admin@company.com
  - submittedAt = 2024-01-15T14:30:00Z
     ↓
UI Shows: ✓ Cleared (green badge)
     ↓
Backend sends webhook:
  POST http://localhost:3001/api/background-check/callback
  {
    status: "CLEARED",
    candidateId: "cand_12345",
    caseId: "order_98765",
    orderId: "order_98765",
    submittedBy: "admin@company.com",
    submittedAt: "2024-01-15T14:30:00Z"
  }
     ↓
Lever-Lite receives callback
     ↓
Lever-Lite marks candidate cleared ✓
     ↓
Lever-Lite unpauses onboarding
     ↓
Candidate receives onboarding email
     ↓
✅ Onboarding proceeds
```

### Scenario B: Criminal History Not Clear (Review Required)

```
Admin Opens Case
     ↓
Admin sees 5 checklist items
     ↓
Admin checks:
  - Identity Verification ✓
  - Criminal History Check ✗ (unchecked)
  - Employment Verification ✓
  - Right-to-Work Eligibility ✓
     ↓
Backend detects: 1+ required items unchecked
     ↓
UI shows: ⚠️ Comment Required
"Since some items are Not Clear, 
please provide a comment"
     ↓
Admin must enter comment:
"Pending final disposition from 
District Court on pending charge. 
Recommended to follow up in 30 days."
     ↓
Admin enters email: admin@company.com
     ↓
Admin clicks "Submit Verification"
     ↓
Confirmation Modal shows:
"By submitting, you confirm that you 
have reviewed the not-clear items and 
documented the reason. This case will 
be flagged for further review."
     ↓
Admin confirms
     ↓
Backend Decision Logic:
  - Check: identityVerified = true
  - Check: criminalHistoryChecked = false ← FAILS
  - Check: employmentVerified = true
  - Check: rightToWorkVerified = true
  - Not all required = true → REVIEW_REQUIRED ⚠️
     ↓
Save Case:
  - currentStatus = "COMPLETED"
  - currentResult = "REVIEW_REQUIRED"
  - adminComment = "Pending final disposition..."
  - submittedBy = admin@company.com
  - submittedAt = 2024-01-15T14:30:00Z
     ↓
UI Shows: ⚠️ Review Required (yellow badge)
           Admin Note visible
     ↓
Backend decision: Do NOT call Lever-Lite ✗
     ↓
Lever-Lite receives NO callback
     ↓
Lever-Lite's candidate still paused
     ↓
❌ Onboarding remains paused
     ↓
Manual intervention required:
  - Hiring team reviews note
  - Follows up with candidate/court
  - Either re-submits case or marks failed
```

### Scenario C: External Provider Status Already Clear

```
Sterling sends background check:
  externalStatus = "Completed"
  externalResult = "Clear"
     ↓
Verify App ingests via /api/cases/ingest
     ↓
BackgroundStatusNormalizer converts:
  externalStatus + externalResult → COMPLETED_CLEAR
     ↓
Case created with:
  - normalizedStatus = "COMPLETED_CLEAR"
  - currentStatus = "IN_PROGRESS"
  - currentResult = "PENDING"
     ↓
Admin opens verify-app UI
     ↓
Admin sees blue badge: "COMPLETED_CLEAR" (from Sterling)
     ↓
Admin can still manually review:
  - Check all items if agrees with Sterling
  - Mark any as Not Clear if disagrees
     ↓
Admin decides to trust Sterling result
     ↓
Admin checks all 4 required items
     ↓
Admin submits
     ↓
Backend notifies Lever-Lite with CLEARED
     ↓
✅ Onboarding proceeds
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  External Provider                           │
│  (Sterling API Response)                                     │
│  {                                                           │
│    "orderId": "order_123",                                  │
│    "status": "Completed",                                   │
│    "result": "Clear",                                       │
│    "score": 950                                             │
│  }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
            POST /api/cases/ingest
                         │
    ┌────────────────────┴───────────────────┐
    │                                         │
    │  BackgroundStatusNormalizer             │
    │  .normalizeStatus()                     │
    │  .validatePayload()                     │
    │  .extractSafeFields()                   │
    │                                         │
    └────────────────────┬───────────────────┘
                         │
                         ↓ Only safe fields:
        ┌────────────────────────────────────┐
        │  BackgroundCheckCase in Storage    │
        │  {                                  │
        │    caseId: "order_123",            │
        │    orderId: "order_123",           │
        │    candidateName: "John Doe",      │
        │    candidateEmail: "john@...",     │
        │    normalizedStatus: "COMPLETED_"  │
        │                    "CLEAR",        │
        │    score: 950,                     │
        │    lastUpdatedAt: "2024-01-15..."  │
        │                                    │
        │    × NO criminal details           │
        │    × NO drug test results          │
        │    × NO sensitive findings         │
        │  }                                  │
        └────────────────────┬───────────────┘
                             │
                             ↓ GET /api/cases/:id
                  ┌──────────────────────┐
                  │  Frontend UI         │
                  │  (React Component)   │
                  │  Displays normalized │
                  │  status + checklist  │
                  └──────────┬───────────┘
                             │
                             ↓ POST /submit
            ┌────────────────────────────────┐
            │  VerificationDecision.execute  │
            │  - All items clear? CLEARED    │
            │  - Any not clear? REVIEW_REQ   │
            │  - Store comment if needed     │
            └────────┬──────────────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
    CLEARED                REVIEW_REQUIRED
         │                        │
         ↓                        ↓
    Callback to        Case stored with
    Lever-Lite         comment
    (Safe data only)   (No Lever-Lite call)
         │
         ↓ POST /api/background-check/callback
    ┌─────────────────────────────┐
    │  Lever-Lite receives:       │
    │  {                           │
    │    status: "CLEARED",       │
    │    candidateId: "cand_...", │
    │    orderId: "order_123",    │
    │    submittedBy: "admin@...",│
    │    submittedAt: "2024-..."  │
    │  }                           │
    └──────────┬──────────────────┘
               │
               ↓
        ✅ Onboarding continues
```

## Status State Machine

```
Ingest External Data
        │
        ↓
    ┌─────────────────────────────────────┐
    │ Normalization Determines Initial     │
    │ Normalized Status                   │
    │ (NEW, PENDING, IN_PROGRESS,         │
    │  COMPLETED_CLEAR, COMPLETED_REVIEW) │
    │                                      │
    │ BUT currentStatus = "IN_PROGRESS"   │
    │    currentResult = "PENDING"        │
    └────────────────┬────────────────────┘
                     │
                     ↓
            Admin Opens UI
                     │
        ┌────────────┴──────────────┐
        │                           │
        │ Checks required items     │
        │ - Identity ✓              │
        │ - Criminal ✓              │
        │ - Employment ✓            │
        │ - Right-to-Work ✓         │
        │                           │
        └────────────┬──────────────┘
                     │
                     ↓
            Click Submit
                     │
        ┌────────────┴──────────────┐
        │                           │
    ✅ CLEARED              ⚠️ REVIEW_REQUIRED
    (All items)           (Any item unchecked
    + No comment          + Comment stored)
        │                           │
        ↓                           ↓
    currentStatus         currentStatus
       = "COMPLETED"        = "COMPLETED"
    currentResult         currentResult
       = "CLEARED"          = "REVIEW_REQUIRED"
        │                           │
        ↓                           ↓
    Webhook sent          NO webhook
    to Lever-Lite        (Case paused)
        │                           │
        ↓                           ↓
    ✅ Onboarding         ❌ Awaiting
       continues           manual action
```

## Error Handling Flow

```
/api/cases/ingest Request
        │
        ↓
    Validate Payload
    (orderId, email, name required)
        │
    ┌───┴────────────────┐
    │                    │
Missing fields      Valid
    │                    │
    ↓                    ↓
400 Error          Normalize Status
"Invalid payload"       │
                        ↓
                   Create/Update Case
                        │
                  ┌─────┴──────┐
                  │            │
            Success      Save Error
                  │            │
                  ↓            ↓
              Return      500 Error
              Case      "Failed to ingest"
                         (Log details)
```

```
/api/cases/:id/submit Request
        │
        ↓
    Validate Admin Email
        │
    ┌───┴─────────┐
    │             │
  Missing      Valid
    │             │
    ↓             ↓
400 Error   Get Case
"Required"      │
           ┌────┴─────┐
           │          │
        Not Found  Found
           │          │
           ↓          ↓
        404 Error   Execute Decision
        "Case not    │
         found"  ┌───┴─────────────────┐
                │                     │
            Save Error        Save Success
                │                     │
                ↓                     ↓
            500 Error          Trigger Webhook
            "Failed to       (Async, fail silent)
             submit"              │
                             Return Success
```

## Integration Checkpoints

| Checkpoint | Status | Action |
|---|---|---|
| External data ingested | ✓ normalizedStatus set | Case ready for admin review |
| All items checked | ✓ decision logic runs | Check "all required = true" |
| Decision: CLEARED | ✓ adminComment = null | Prepare webhook payload |
| Webhook prepared | ✓ POST to Lever-Lite | Non-blocking (fire & forget) |
| Lever-Lite receives | ✓ unpauses candidate | Onboarding proceeds |
| Decision: REVIEW_REQ | ✓ adminComment stored | NO webhook sent |
| Review case pending | ✓ case paused | Await manual intervention |
| Admin re-reviews | ✓ updates checks | Can re-submit if now cleared |

---

This diagram shows the complete flow from external provider → verify-app admin decision → lever-lite callback → onboarding continuation.
