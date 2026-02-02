# Verify App - Background Check Verification System

## 🎯 What's New

Your `verify-app` has been fully extended with a comprehensive background check verification system that integrates securely with `lever-lite` onboarding.

---

## 📚 Quick Navigation

### For First-Time Users
Start here → **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)**
- What was added
- How to test it
- API examples

### For Detailed API Docs
Go here → **[IMPLEMENTATION_FEATURES.md](./IMPLEMENTATION_FEATURES.md)**
- Complete API reference
- All status mappings
- Error handling
- Environment variables

### For Integration Flows
See this → **[INTEGRATION_FLOW.md](./INTEGRATION_FLOW.md)**
- High-level architecture
- Decision flows (CLEARED vs REVIEW_REQUIRED)
- Data flows
- State machines
- Integration checkpoints

### For Implementation Details
Check list → **[VALIDATION_CHECKLIST.md](./VALIDATION_CHECKLIST.md)**
- All requirements completed
- Files changed
- Feature matrix
- Code quality checklist

---

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd backend
npm run dev
# → Listening on http://localhost:5002
```

### 2. Start the Frontend
```bash
cd frontend
npm run dev
# → Available at http://localhost:5173
```

### 3. Seed Test Cases
```bash
chmod +x seed.sh
./seed.sh
```

### 4. Open the UI
```
http://localhost:5173/?caseId=case_new_001
```

---

## 🔑 Key Features

### ✅ Status Normalization
- Converts external providers (Sterling, BI, etc.) into 6 internal states
- Endpoint: `POST /api/cases/ingest`
- Stores only safe metadata (no criminal details)

### ✅ Admin Verification UI
- 5-item checklist (4 required, 1 optional)
- Checkbox-based decisions: Clear or Not Clear
- Mandatory comments for Not Clear items

### ✅ Smart Decision Logic
- **All items Clear** → CLEARED (Lever-Lite callback sent)
- **Any item Not Clear** → REVIEW_REQUIRED (NO callback, paused)

### ✅ Lever-Lite Integration
- Automatic webhook only when fully cleared
- Candidate onboarding unpaused on CLEARED
- Remains paused on REVIEW_REQUIRED

### ✅ Security & Audit
- No sensitive data stored
- Complete audit trail
- Demo-safe (no real criminal processing)

---

## 📋 Testing Scenarios

### Scenario 1: All Clear → Onboarding
1. Open case
2. Check all 4 required items ✓✓✓✓
3. Submit
4. **Result**: Green "✓ Cleared", Lever-Lite callback sent ✓

### Scenario 2: Not Clear → Review Required
1. Open case
2. Check 3 items, leave 1 unchecked
3. Enter comment (required)
4. Submit
5. **Result**: Yellow "⚠ Review Required", NO Lever-Lite callback

### Scenario 3: External Status Ingested
1. POST /api/cases/ingest with external status
2. Frontend shows normalized status badge
3. Admin manually verifies
4. If all clear, sends callback

---

## 🔗 API Endpoints

### Ingest External Background Check
```bash
POST /api/cases/ingest
{
  "orderId": "order_123",
  "candidateName": "John Doe",
  "candidateEmail": "john@example.com",
  "externalStatus": "Completed",
  "externalResult": "Clear",
  "score": 950
}
```

### Update Checkboxes
```bash
POST /api/cases/:id/checks
{
  "identityVerified": true,
  "criminalHistoryChecked": true,
  "employmentVerified": true,
  "rightToWorkVerified": true
}
```

### Submit Decision
```bash
POST /api/cases/:id/submit
{
  "submittedBy": "admin@example.com",
  "adminComment": "Optional reason if not all items clear"
}
```

### Get Case
```bash
GET /api/cases/:id
GET /api/cases
```

---

## 📊 Data Model

### BackgroundCheckCase
```typescript
{
  caseId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  orderId: string;
  
  currentStatus: "NEW" | "IN_PROGRESS" | "COMPLETED";
  currentResult: "PENDING" | "CLEARED" | "REVIEW_REQUIRED";
  normalizedStatus?: "NEW" | "PENDING" | "IN_PROGRESS" | 
                    "COMPLETED_CLEAR" | "COMPLETED_REVIEW" | "ERROR";
  
  checks: {
    identityVerified: boolean;
    criminalHistoryChecked: boolean;
    employmentVerified: boolean;
    educationVerified: boolean;
    rightToWorkVerified: boolean;
  };
  
  adminComment?: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  
  securityClassification: "SENSITIVE";
}
```

---

## 🔐 What's NOT Stored

✗ Criminal history details
✗ Drug test results
✗ Medical information
✗ Full background check reports
✗ Sensitive findings

### What IS Stored (Only)
✓ orderId
✓ candidateName
✓ candidateEmail
✓ normalizedStatus
✓ score (numeric)
✓ adminComment (only if Not Clear)
✓ Decision metadata (submittedBy, timestamp)

---

## 🌐 Integration with Lever-Lite

### Event: BACKGROUND_CHECK_CLEARED

**Sent when:** Admin submits case with all items Clear

**Webhook URL:** `http://localhost:3001/api/background-check/callback`
(Configurable via `LEVER_LITE_WEBHOOK_URL`)

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

### NO Event: REVIEW_REQUIRED
When admin marks any item as Not Clear:
- Case is saved with comment
- **NO webhook sent** to Lever-Lite
- Candidate onboarding remains **paused**
- Requires manual intervention

---

## 📝 Environment Variables

### Backend (.env or process.env)
```bash
LEVER_LITE_WEBHOOK_URL=http://localhost:3001/api/background-check/callback
PORT=5002
```

### Frontend (vite.config.ts or .env.local)
```bash
VITE_API_BASE=http://localhost:5002/api
```

---

## 🛠️ What Changed

### New Files
- `src/services/BackgroundStatusNormalizer.ts` - Normalization logic
- `seed.sh` - Test data seeding script
- `IMPLEMENTATION_FEATURES.md` - Complete API documentation
- `IMPLEMENTATION_SUMMARY.md` - Quick reference guide
- `INTEGRATION_FLOW.md` - Architecture diagrams
- `VALIDATION_CHECKLIST.md` - Implementation verification

### Modified Files
- `src/types.ts` - Added normalized status types
- `src/services/VerificationDecision.ts` - Added comment handling
- `src/services/LeverLiteCallback.ts` - Added comment to payload
- `src/routes/cases.ts` - Added ingest endpoint
- `frontend/src/types.ts` - Added normalized status types
- `frontend/src/api.ts` - Added comment parameter
- `frontend/src/components/CaseDetailPage.tsx` - Enhanced UI
- `data/background_check_case.json` - Updated seed data

### Unchanged
- ✓ File-based storage mechanism
- ✓ Build/deployment process
- ✓ Tailwind styling
- ✓ Type safety

---

## ✅ Implementation Status

**All requirements complete:**
- [x] Status normalization (6 states)
- [x] Admin verification UI (5-item checklist)
- [x] Decision logic (CLEARED or REVIEW_REQUIRED)
- [x] Lever-Lite integration (CLEARED only)
- [x] Comment field (conditional, mandatory for Not Clear)
- [x] Security guardrails (no sensitive data)
- [x] Audit logging (all transitions)
- [x] UI status display (badges, comments, timeline)
- [x] API endpoints (ingest, checks, submit)
- [x] Documentation (complete)

**Ready for testing and deployment.**

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Clear node_modules and reinstall
rm -rf backend/node_modules
cd backend && npm install && npm run dev
```

### Frontend won't connect
```bash
# Check API_BASE is correct in frontend/src/api.ts
# Default: http://localhost:5002/api
```

### Webhook not sending
```bash
# Check LEVER_LITE_WEBHOOK_URL env var
# Check Lever-Lite backend is running on port 3001
# Check logs: [LeverLite] Sending CLEARED callback...
```

### Case not updating
```bash
# Check backend is running
# Check case ID is correct
# Check backend logs for errors
```

---

## 📞 Support

For detailed information, refer to:
1. **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Overview & testing
2. **[IMPLEMENTATION_FEATURES.md](./IMPLEMENTATION_FEATURES.md)** - Complete API reference
3. **[INTEGRATION_FLOW.md](./INTEGRATION_FLOW.md)** - Architecture & flows
4. **[VALIDATION_CHECKLIST.md](./VALIDATION_CHECKLIST.md)** - Implementation verification

---

## 🎓 Learning Path

**Day 1: Understand the Feature**
- Read: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- Watch: Test flows in UI

**Day 2: Deep Dive**
- Read: [IMPLEMENTATION_FEATURES.md](./IMPLEMENTATION_FEATURES.md)
- Test: All API endpoints with curl

**Day 3: Integration**
- Read: [INTEGRATION_FLOW.md](./INTEGRATION_FLOW.md)
- Setup: Lever-Lite integration
- Test: End-to-end flow

**Day 4: Verification**
- Read: [VALIDATION_CHECKLIST.md](./VALIDATION_CHECKLIST.md)
- Review: All code changes
- Verify: All requirements met

---

**Everything is ready to go. Start with [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for the quickest path to understanding and testing the new features.**
