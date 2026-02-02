# VERIFICATION-APP — QUICK START

## 1. Install Dependencies

```bash
cd /Users/macbook/Downloads/sim-app/verification-app

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## 2. Create a Test Case

Create `/Users/macbook/Downloads/sim-app/verification-app/data/background_check_case_case_001.json`:

```json
{
  "caseId": "case_001",
  "candidateId": "cand_12345",
  "candidateName": "John Doe",
  "candidateEmail": "john.doe@example.com",
  "orderId": "order_98765",
  "currentStatus": "NEW",
  "currentResult": "PENDING",
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

## 3. Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

Output:
```
✓ Verification App Backend running on http://localhost:5002
✓ All data treated as SENSITIVE
```

## 4. Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Output:
```
  VITE v4.x.x  ready in 150 ms

  ➜  Local:   http://localhost:3001/
```

## 5. Open UI

```
http://localhost:3001/?caseId=case_001
```

## 6. Test Workflow

### Step 1: Check Boxes
- Click checkboxes for verification items
- Watch status change to "In Progress"
- Data persists (saved to file)

### Step 2: Enter Admin Email
- Type your email: `admin@example.com`

### Step 3: Submit
- Click "Submit Verification"
- Confirmation modal appears
- Click "Confirm & Submit"

### Step 4: See Result
- All checkboxes disabled
- Status badge shows:
  - **CLEARED** (green) if ALL required checks passed
  - **REVIEW_REQUIRED** (yellow) if any required check failed
- Admin name + timestamp displayed

---

## Testing Decision Logic

### Scenario 1: CLEARED
Check all required fields:
- Identity Verification ✓
- Criminal History Check ✓
- Employment Verification ✓
- Right-to-Work Eligibility ✓

Result: **CLEARED** → Lever-Lite callback sent

### Scenario 2: REVIEW_REQUIRED
Leave any required field unchecked:
- Identity Verification ✓
- Criminal History Check ✗
- Employment Verification ✓
- Right-to-Work Eligibility ✓

Result: **REVIEW_REQUIRED** → No Lever-Lite callback

---

## API Testing (curl)

### Get Case
```bash
curl http://localhost:5002/api/cases/case_001
```

### Update Checkboxes
```bash
curl -X POST http://localhost:5002/api/cases/case_001/checks \
  -H "Content-Type: application/json" \
  -d '{
    "identityVerified": true,
    "criminalHistoryChecked": true,
    "employmentVerified": true,
    "rightToWorkVerified": true
  }'
```

### Submit Verification
```bash
curl -X POST http://localhost:5002/api/cases/case_001/submit \
  -H "Content-Type: application/json" \
  -d '{
    "submittedBy": "admin@example.com"
  }'
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5002
lsof -ti:5002 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Case Not Found
- Check that `/data/background_check_case_case_001.json` exists
- Verify JSON syntax is valid

### Lever-Lite Webhook Fails
- This is expected if Lever-Lite isn't running
- Backend logs the failure but completes the case
- Production: retry logic would be added

---

## Key Files

- **Backend:** `/backend/src/index.ts`
- **Frontend:** `/frontend/src/App.tsx`
- **Decision Logic:** `/backend/src/services/VerificationDecision.ts`
- **Data Storage:** `/data/background_check_case_*.json`
- **UI Component:** `/frontend/src/components/CaseDetailPage.tsx`

---

## DONE! 🎉

The verification-app is ready to demo.

**Remember:** This is a DEMO system. It NEVER collects, uploads, stores, or displays actual background check data.
