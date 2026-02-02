# VERIFICATION-APP — COMPLETE IMPLEMENTATION

## Overview

A **demo orchestration system** for background verification where:
- ✅ NO sensitive data collection
- ✅ Admin manually verifies checks outside the system
- ✅ Admin checks simple checkboxes
- ✅ Admin explicitly submits verification
- ✅ Only on CLEARED result does Lever-Lite get notified

---

## Architecture

```
verification-app/
├── backend/           # Express server
│   ├── src/
│   │   ├── index.ts                          (main server)
│   │   ├── types.ts                          (shared types)
│   │   ├── storage.ts                        (file-based persistence)
│   │   ├── routes/
│   │   │   └── cases.ts                      (API endpoints)
│   │   └── services/
│   │       ├── VerificationDecision.ts       (decision logic)
│   │       └── LeverLiteCallback.ts          (webhook to Lever-Lite)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/          # React UI
│   ├── src/
│   │   ├── App.tsx                           (main app)
│   │   ├── main.tsx                          (entry point)
│   │   ├── index.css                         (Tailwind)
│   │   ├── types.ts                          (frontend types)
│   │   ├── api.ts                            (API client)
│   │   └── components/
│   │       └── CaseDetailPage.tsx            (main UI)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── tsconfig.node.json
│
└── data/
    └── background_check_case_*.json          (file storage)
```

---

## Data Model

### File: `/data/background_check_case_*.json`

```json
{
  "caseId": "case_001",
  "candidateId": "cand_12345",
  "candidateName": "John Doe",
  "candidateEmail": "john.doe@example.com",
  "orderId": "order_98765",
  "currentStatus": "NEW | IN_PROGRESS | SUBMITTED | COMPLETED",
  "currentResult": "PENDING | CLEARED | REVIEW_REQUIRED",
  "checks": {
    "identityVerified": false,
    "criminalHistoryChecked": false,
    "employmentVerified": false,
    "educationVerified": false,
    "rightToWorkVerified": false
  },
  "submittedBy": null,
  "submittedAt": null,
  "completedAt": null,
  "securityClassification": "SENSITIVE"
}
```

**CRITICAL:** No background check details, reports, or sensitive documents stored.

---

## API Endpoints

### 1. Get Case
```
GET /api/cases/:id
Response: BackgroundCheckCase
```

### 2. List All Cases
```
GET /api/cases
Response: BackgroundCheckCase[]
```

### 3. Update Checkboxes (STEP 2)
```
POST /api/cases/:id/checks
Body: {
  identityVerified?: boolean,
  criminalHistoryChecked?: boolean,
  employmentVerified?: boolean,
  educationVerified?: boolean,
  rightToWorkVerified?: boolean
}
Behavior:
- Updates checkboxes only
- Status stays IN_PROGRESS
- No decision logic
Response: { message, case }
```

### 4. Admin Submit (STEP 3)
```
POST /api/cases/:id/submit
Body: { submittedBy: "admin@example.com" }
Behavior:
- Admin explicitly submits
- Saves submittedBy + submittedAt
- Runs decision logic
- If CLEARED: calls Lever-Lite callback
Decision Logic:
  Required checks: identity, criminal, employment, right-to-work
  If ALL required === true:
    - currentResult = CLEARED
    - currentStatus = COMPLETED
    - Calls Lever-Lite webhook
  Else:
    - currentResult = REVIEW_REQUIRED
    - currentStatus = COMPLETED
Response: { message, case }
```

---

## Decision Logic (STEP 3)

**File:** `/backend/src/services/VerificationDecision.ts`

```typescript
// Executed ONLY when admin submits

REQUIRED_CHECKS = [
  identityVerified,
  criminalHistoryChecked,
  employmentVerified,
  rightToWorkVerified
]

if (ALL required_checks === true) {
  currentResult = "CLEARED"
  // Lever-Lite callback triggered
} else {
  currentResult = "REVIEW_REQUIRED"
  // NO Lever-Lite callback
}

currentStatus = "COMPLETED"
submittedBy = admin email
submittedAt = now
completedAt = now
```

---

## Lever-Lite Callback (STEP 4)

**File:** `/backend/src/services/LeverLiteCallback.ts`

```
POST http://localhost:3001/api/background-check/callback

{
  "candidateId": "cand_12345",
  "caseId": "case_001",
  "orderId": "order_98765",
  "status": "CLEARED",
  "submittedBy": "admin@example.com",
  "submittedAt": "2026-02-02T10:30:00.000Z"
}
```

**ONLY SENT IF:**
- currentResult === "CLEARED"
- All required checks are true

**NOT SENT IF:**
- currentResult === "REVIEW_REQUIRED"

---

## Frontend UI (STEP 5)

**File:** `/frontend/src/components/CaseDetailPage.tsx`

### Candidate Info Section
- Name, Email, Case ID, Order ID

### Verification Checklist
- ☐ Identity Verification
- ☐ Criminal History Check
- ☐ Employment Verification
- ☐ Education Verification (optional)
- ☐ Right-to-Work Eligibility (I-9)

### Admin Attestation Section (Before Submit)
- Email input field
- Submit button
- Confirmation modal with legal text:
  > "By submitting, you confirm these checks were manually verified."

### After Submit
- All checkboxes disabled
- Result badge shown (CLEARED or REVIEW_REQUIRED)
- Admin name + timestamp displayed
- No re-submission allowed

### UI Rules
- ✅ No upload controls
- ✅ No text fields for notes
- ✅ No document attachments
- ✅ Simple checkboxes only

---

## How to Run

### Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5002
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3001
```

### Create a Test Case
```bash
# Manually create a JSON file in data/
# e.g., data/background_check_case_case_001.json
# Copy from the template above
```

### Access UI
```
http://localhost:3000/?caseId=case_001
```

---

## Environment Variables

### Backend (`.env` or `.env.local`)
```
PORT=5002
LEVER_LITE_WEBHOOK_URL=http://localhost:3001/api/background-check/callback
```

### Frontend (`.env` or `.env.local`)
```
VITE_API_BASE=http://localhost:5002/api
```

---

## Security & Compliance

✅ **NO sensitive data retention** — only metadata  
✅ **All data marked SENSITIVE** — immutable classification  
✅ **Human submit required** — no auto-clearance  
✅ **Admin attestation** — email required for submit  
✅ **Lever-Lite isolation** — demo doesn't see details  
✅ **File-based storage** — simple, auditable  
✅ **No reversals** — completed cases locked  

---

## Next Steps

1. **Install dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Create test case** in `/data/background_check_case_case_001.json`

3. **Start backend:** `npm run dev`

4. **Start frontend:** `npm run dev`

5. **Test workflow:**
   - Visit UI
   - Check boxes
   - Submit with email
   - See CLEARED or REVIEW_REQUIRED result
   - Check Lever-Lite webhook (if CLEARED)

---

## Complete! ✅

All 5 steps implemented:
- ✅ STEP 1: Data Model (file-based, minimal)
- ✅ STEP 2: Checkbox Update endpoint
- ✅ STEP 3: Admin Submit endpoint + decision logic
- ✅ STEP 4: Lever-Lite callback (CLEARED only)
- ✅ STEP 5: Frontend UI (intentionally simple)
