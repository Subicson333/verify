# Background Check Verification System - Implementation Guide

## Overview

The `verify-app` has been extended with the following features:

1. **Status Normalization** - Converts external background check providers (e.g., Sterling) into internal standardized states
2. **Admin Manual Verification UI** - Checkbox-based decision interface with mandatory comments for "Not Clear" items
3. **Secure Decision Logic** - Enforces admin attestation before triggering onboarding
4. **Lever-Lite Integration** - Automatic callback only when verification is fully cleared

---

## 1. Status Normalization (Backend)

### Normalized States

External status values are normalized into 6 internal states:

| Internal State | Meaning | Triggers Onboarding |
|---|---|---|
| `NEW` | Case created, awaiting processing | No |
| `PENDING` | Waiting for external provider response | No |
| `IN_PROGRESS` | External provider actively processing | No |
| `COMPLETED_CLEAR` | External result indicates clear | No* |
| `COMPLETED_REVIEW` | External result needs review | No |
| `ERROR` | Missing required fields or API failure | No |

*Only triggers onboarding after admin manual verification confirms all items are clear.

### Mapping Rules

```typescript
// Implemented in BackgroundStatusNormalizer.ts

New, Initiated, Created → NEW
Pending, Queued, Awaiting → PENDING
Processing, In Progress, Running → IN_PROGRESS

Completed + (Clear) → COMPLETED_CLEAR
Completed + (Review, Not Clear, Conditional, Failed) → COMPLETED_REVIEW

Missing orderId or validation error → ERROR
```

### Security Guardrails

✓ Only stores: `orderId`, `candidateName`, `candidateEmail`, `normalizedStatus`, `score`, `lastUpdatedAt`
✗ NEVER stores: Criminal details, sensitive findings, full reports

---

## 2. Admin Manual Verification UI

### Verification Checklist

The UI displays 5 independent checklist items:

1. **Identity Verification** (required)
   - Confirmed candidate identity documents
   
2. **Criminal History Check** (required)
   - Verified criminal background status
   
3. **Employment Verification** (required)
   - Confirmed previous employment history
   
4. **Education Verification** (optional)
   - Verified educational credentials
   
5. **Right-to-Work Eligibility (I-9)** (required)
   - Confirmed work authorization status

### Decision Flow

#### Scenario 1: All Items Clear

```
Admin marks all required items as verified ✓
↓
Admin submits with email
↓
Decision: CLEARED
↓
Lever-Lite receives BACKGROUND_CHECK_CLEARED event
↓
Onboarding proceeds
```

#### Scenario 2: Any Item Not Clear

```
Admin marks 1+ items as NOT verified (unchecked)
↓
UI requires comment input: "Why was X not clear?"
↓
Admin provides comment + submits
↓
Decision: REVIEW_REQUIRED + comment stored
↓
Lever-Lite is NOT notified
↓
Onboarding paused (manual intervention required)
```

---

## 3. Backend Endpoints

### Ingest External Background Check Data

**Endpoint:** `POST /api/cases/ingest`

Normalizes and stores external background check data from Sterling, BI, or similar providers.

**Request:**
```json
{
  "orderId": "order_12345",
  "candidateName": "John Doe",
  "candidateEmail": "john.doe@example.com",
  "externalStatus": "Completed",
  "externalResult": "Clear",
  "score": 950,
  "lastUpdatedAt": "2024-01-15T10:00:00Z"
}
```

**Response:**
```json
{
  "message": "Background check data ingested",
  "case": {
    "caseId": "order_12345",
    "candidateId": "cand_xxx",
    "candidateName": "John Doe",
    "candidateEmail": "john.doe@example.com",
    "orderId": "order_12345",
    "currentStatus": "IN_PROGRESS",
    "currentResult": "PENDING",
    "normalizedStatus": "COMPLETED_CLEAR",
    "checks": {...},
    "securityClassification": "SENSITIVE"
  }
}
```

### Update Checkboxes

**Endpoint:** `POST /api/cases/:id/checks`

**Request:**
```json
{
  "identityVerified": true,
  "criminalHistoryChecked": false,
  "employmentVerified": true,
  "educationVerified": false,
  "rightToWorkVerified": true
}
```

Status remains `IN_PROGRESS` until admin submits.

### Admin Submit Decision

**Endpoint:** `POST /api/cases/:id/submit`

**Request:**
```json
{
  "submittedBy": "admin@example.com",
  "adminComment": "Identity document appears altered. Recommend secondary verification."
}
```

**Decision Logic:**
- All 4 required items checked ✓ → `CLEARED` (comment ignored)
- Any required item unchecked → `REVIEW_REQUIRED` (comment stored)

**Response:**
```json
{
  "message": "Verification submitted",
  "case": {
    "caseId": "order_12345",
    "currentStatus": "COMPLETED",
    "currentResult": "CLEARED",
    "submittedBy": "admin@example.com",
    "submittedAt": "2024-01-15T14:30:00Z",
    "adminComment": null
  }
}
```

---

## 4. Lever-Lite Integration

### Event: BACKGROUND_CHECK_CLEARED

**Triggered:** Automatically when case is submitted with `currentResult: "CLEARED"`

**Webhook URL:** `process.env.LEVER_LITE_WEBHOOK_URL` (default: `http://localhost:3001/api/background-check/callback`)

**Payload:**
```json
{
  "eventType": "BACKGROUND_CHECK_CLEARED",
  "candidateId": "cand_12345",
  "caseId": "order_98765",
  "orderId": "order_98765",
  "verificationSource": "verify-app",
  "status": "CLEARED",
  "submittedBy": "admin@example.com",
  "submittedAt": "2024-01-15T14:30:00Z",
  "adminComment": null,
  "timestamp": "2024-01-15T14:30:00Z"
}
```

### No Event for REVIEW_REQUIRED

When admin marks items as "Not Clear":
- Case is saved with `REVIEW_REQUIRED` status
- **NO callback sent** to Lever-Lite
- Onboarding remains paused until resolved
- Comment is stored for audit trail

---

## 5. API Flows

### Flow 1: Ingest → Manual Verify → Onboard

```
Sterling API sends background check
          ↓
POST /api/cases/ingest
          ↓
verify-app creates case with normalizedStatus
          ↓
Admin opens verify-app UI
          ↓
Admin marks all items as Clear
          ↓
POST /api/cases/:id/submit (submittedBy, no comment)
          ↓
Lever-Lite receives BACKGROUND_CHECK_CLEARED
          ↓
Lever-Lite triggers onboarding
          ↓
✅ Candidate proceeds to onboarding
```

### Flow 2: Ingest → Manual Verify → Review Required

```
Sterling API sends background check
          ↓
POST /api/cases/ingest
          ↓
verify-app creates case
          ↓
Admin opens verify-app UI
          ↓
Admin marks Criminal History as NOT Clear
          ↓
UI shows: "Comment required"
          ↓
Admin enters: "Pending final disposition from District Court"
          ↓
POST /api/cases/:id/submit (submittedBy, adminComment)
          ↓
Lever-Lite is NOT notified
          ↓
❌ Onboarding paused (manual intervention)
          ↓
Admin can review admin comment in verify-app
```

---

## 6. Frontend Features

### Status Display

The UI shows multiple status indicators:

**1. Normalized Status Badge** (if available)
- Blue badge showing external provider status
- Example: `PENDING`, `IN_PROGRESS`, `COMPLETED_CLEAR`

**2. Admin Decision Badge** (after submission)
- Green: ✓ Cleared
- Yellow: ⚠ Review Required

**3. Admin Comment Display** (if Not Clear)
- Yellow note: "Admin Verification Note"
- Shows the comment provided by admin

### Conditional UI Elements

**Comment Field:**
- Hidden when all items are checked
- Shown when any item is unchecked (required input)
- Hidden after submission

**Submit Button:**
- Green when all required items verified
- Blue when some items not verified (comment required)
- Disabled after submission

**Confirmation Modal:**
- Different message for CLEARED vs REVIEW_REQUIRED
- Clear attestation language for each path

---

## 7. Data Security

### What Is Stored

```typescript
{
  orderId,           // Required
  candidateName,     // Required
  candidateEmail,    // Required
  normalizedStatus,  // From external source
  score,            // Optional numeric score
  lastUpdatedAt,    // Timestamp of external update
  
  // Admin decision
  adminComment,     // Only if Not Clear
  submittedBy,      // Admin email
  submittedAt,      // Decision timestamp
}
```

### What Is Never Stored

✗ Criminal history details
✗ Felony/misdemeanor specifics
✗ Drug test results
✗ Medical information
✗ Full background check reports
✗ Sensitive findings

---

## 8. Audit Trail

All state transitions are logged:

```
[Normalization] orderId=order_12345 externalStatus="Completed" → normalizedStatus="COMPLETED_CLEAR"

[Decision] Case order_12345 → CLEARED by admin@example.com

[Decision] Case order_12345 → REVIEW_REQUIRED with comment

[LeverLite] Sending CLEARED callback for case order_12345...

[LeverLite] Callback sent successfully (200)
```

---

## 9. Testing

### Run Seeding Script

```bash
cd /Users/macbook/Downloads/sim-app/verify-app
chmod +x seed.sh
./seed.sh
```

This creates test cases with various normalized statuses.

### Test Flow

1. **Start verify-app backend:**
   ```bash
   cd backend && npm run dev
   ```

2. **Start verify-app frontend:**
   ```bash
   cd frontend && npm run dev
   ```

3. **Access UI:**
   ```
   http://localhost:5173/?caseId=case_new_001
   ```

4. **Test scenarios:**
   - Mark all items clear → CLEARED → Lever-Lite callback sent
   - Leave items unchecked + add comment → REVIEW_REQUIRED → No callback

---

## 10. Environment Variables

### Backend

```bash
# .env or process.env
LEVER_LITE_WEBHOOK_URL=http://localhost:3001/api/background-check/callback
PORT=5002
```

### Frontend

```bash
# .env.local or vite config
VITE_API_BASE=http://localhost:5002/api
```

---

## 11. Error Handling

### Ingest Errors

| Error | Status | Reason |
|---|---|---|
| `Invalid payload: orderId... required` | 400 | Missing required fields |
| `Failed to ingest background check data` | 500 | Server error |

### Decision Errors

| Error | Status | Reason |
|---|---|---|
| `submittedBy is required` | 400 | Admin email not provided |
| `Case not found` | 404 | Invalid caseId |
| `Failed to submit verification` | 500 | Server error |

### Lever-Lite Callback

- Failures are **logged but non-blocking**
- Case is saved regardless
- Admin sees success confirmation
- Error logged for ops team to investigate

---

## 12. Feature Checklist

✅ Status Normalization (NEW, PENDING, IN_PROGRESS, COMPLETED_CLEAR, COMPLETED_REVIEW, ERROR)
✅ Admin Manual Verification UI (5-item checklist)
✅ Conditional Comment Field (required for Not Clear)
✅ Decision Logic (All Clear → CLEARED, Any Not Clear → REVIEW_REQUIRED)
✅ Lever-Lite Callback (CLEARED only, with safe data)
✅ No Sensitive Data Storage (criminal, medical, details)
✅ Audit Logging (all transitions)
✅ Normalized Status Display (UI badge)
✅ Comment Display (yellow note for Not Clear)
✅ Timeline Status Display (NEW → PENDING → IN_PROGRESS → COMPLETED)

---

## 13. Next Steps (Optional Enhancements)

- [ ] History/timeline view of all status updates
- [ ] Re-review capability for REVIEW_REQUIRED cases
- [ ] Email notifications to admin
- [ ] Integration with Sterling API for auto-ingest
- [ ] Dashboard showing all cases by status
- [ ] Bulk submission for multiple cases
- [ ] Role-based access control (admin-only verification)
