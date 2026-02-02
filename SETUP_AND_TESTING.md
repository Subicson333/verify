# Setup & Testing Guide

## Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd verify-app/backend
npm install
```

**Frontend:**
```bash
cd verify-app/frontend
npm install
```

### 2. Start Backend Server

```bash
cd verify-app/backend
npm run dev
```

Output should show:
```
Server running on port 5002
Database ready at ./data/
```

### 3. Start Frontend Server

In a new terminal:
```bash
cd verify-app/frontend
npm run dev
```

Output should show:
```
VITE v5.x.x
Local: http://localhost:5173/
```

### 4. Access the Application

Open your browser to: `http://localhost:5173`

You should see the **Background Check Dashboard** (initially empty).

---

## Testing Workflow

### Step 1: Create a Test Case

**Option A: Using cURL**

```bash
curl -X POST http://localhost:5002/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER-2026-001",
    "candidateName": "Alice Johnson",
    "candidateEmail": "alice.johnson@example.com",
    "startDate": "2026-02-10T00:00:00Z",
    "owner": "geoff@company.com"
  }'
```

**Option B: Using curl with future SLA risk**

```bash
curl -X POST http://localhost:5002/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER-2026-002",
    "candidateName": "Bob Smith",
    "candidateEmail": "bob.smith@example.com",
    "startDate": "2026-02-03T00:00:00Z",
    "owner": "geoff@company.com"
  }'
```

**Option C: Create multiple test cases**

```bash
for i in {1..5}; do
  curl -X POST http://localhost:5002/api/cases \
    -H "Content-Type: application/json" \
    -d "{
      \"orderId\": \"ORDER-2026-00$i\",
      \"candidateName\": \"Test User $i\",
      \"candidateEmail\": \"user$i@example.com\",
      \"startDate\": \"2026-02-$(printf '%02d' $((10 + i)))T00:00:00Z\",
      \"owner\": \"geoff@company.com\"
    }"
  sleep 1
done
```

### Step 2: View Dashboard

1. Refresh `http://localhost:5173`
2. You should see the created case(s) in the table
3. Columns: Candidate, Order ID, Start Date, Status (all NEW), Score (PENDING), SLA Risk (varies), Owner, Updated, Actions

### Step 3: Update a Check Status

Click "View" on any case to go to **Case Detail Screen**.

You should see:
- Header with candidate info
- 5 checks listed (all status NEW)
- Timeline with 2 events (CREATED, STATUS_CHANGE to New)
- Admin decision panel (no decision recorded yet)

Click "Update Status →" on any check:
1. Select a new status (e.g., IN_PROGRESS)
2. Click "Update"
3. Check status updates immediately
4. Timeline adds new STATUS_CHANGE event
5. Overall status recalculated in real-time

Try updating multiple checks:

```bash
# Update IDENTITY_VERIFICATION to COMPLETED_CLEAR
curl -X PATCH http://localhost:5002/api/cases/ORDER-2026-001/checks/IDENTITY_VERIFICATION \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED_CLEAR",
    "updatedBy": "geoff@company.com",
    "notes": "Passport verified"
  }'

# Update CRIMINAL_HISTORY_CHECK to IN_PROGRESS
curl -X PATCH http://localhost:5002/api/cases/ORDER-2026-001/checks/CRIMINAL_HISTORY_CHECK \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS",
    "updatedBy": "geoff@company.com"
  }'

# Update EMPLOYMENT_VERIFICATION to COMPLETED_REVIEW
curl -X PATCH http://localhost:5002/api/cases/ORDER-2026-001/checks/EMPLOYMENT_VERIFICATION \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED_REVIEW",
    "updatedBy": "geoff@company.com",
    "notes": "Employment dates need clarification"
  }'
```

Refresh the case detail screen to see:
- Updated check statuses
- Overall status might change (if all required checks complete → shows overall status)
- Timeline updates with each change
- Overall score recalculated

### Step 4: Record Admin Decision

On case detail screen, scroll to **Admin Decision Panel** on the right.

Since no decision is recorded yet, you should see three buttons:
- ✓ Approve (green)
- ⚠ Needs Review (orange)
- ✗ Reject (red)

Click one:

```bash
# Or via cURL
curl -X POST http://localhost:5002/api/cases/ORDER-2026-001/admin-decision \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "APPROVED",
    "reasoning": "All required checks completed and clear",
    "decidedBy": "geoff@company.com"
  }'
```

The case detail screen will:
- Show the recorded decision
- Add ADMIN_DECISION event to timeline
- Display decision with option to change

### Step 5: View Exception Queue

Navigate to `http://localhost:5173/exceptions`

You should see:
- Queue list on left with filter tabs
- For cases with SLA risk (start date ≤ 3 days): Listed as "SLA At Risk"
- For cases with COMPLETED_REVIEW status: Listed as "Review Needed"

Try the workflow:
1. Click an exception to select it
2. Click "Acknowledge" (if unreviewed)
3. Select assignee from dropdown
4. Click "Mark Resolved"
5. Exception disappears from queue

### Step 6: Test Dashboard Filters

Go back to dashboard (`http://localhost:5173`):

Click status filter tabs:
- **ALL** - Shows all cases
- **NEW** - Shows cases with no updates yet
- **IN_PROGRESS** - Shows cases with at least one check in progress
- **COMPLETED_CLEAR** - Shows cases approved
- **COMPLETED_REVIEW** - Shows cases needing review

Cases should filter correctly in real-time.

---

## API Reference

### Create Case
```bash
POST /api/cases
Content-Type: application/json

{
  "orderId": "string",
  "candidateId": "string (optional, auto-generated)",
  "candidateName": "string",
  "candidateEmail": "string",
  "startDate": "ISO date string",
  "owner": "string (email)"
}

Response: BackgroundCheckCase (201 Created)
```

### List Cases
```bash
GET /api/cases?status=IN_PROGRESS&owner=geoff@company.com&startDateFrom=2026-02-01&startDateTo=2026-02-28

Query Parameters:
- status: BackgroundCheckStatus (optional)
- owner: string (optional)
- startDateFrom: ISO date (optional)
- startDateTo: ISO date (optional)

Response: BackgroundCheckCase[] (200 OK)
```

### Get Single Case
```bash
GET /api/cases/:id

Response: BackgroundCheckCase (200 OK)
```

### Update Check Status
```bash
PATCH /api/cases/:id/checks/:checkType
Content-Type: application/json

{
  "status": "BackgroundCheckStatus",
  "updatedBy": "string (email)",
  "notes": "string (optional)",
  "vendorReference": "string (optional)"
}

Response: BackgroundCheckCase (200 OK)
```

### Submit Admin Decision
```bash
POST /api/cases/:id/admin-decision
Content-Type: application/json

{
  "decision": "APPROVED" | "REJECTED" | "NEEDS_REVIEW",
  "reasoning": "string",
  "decidedBy": "string (email)",
  "notes": "string (optional)"
}

Response: BackgroundCheckCase (200 OK)
```

### Vendor Webhook
```bash
POST /api/cases/webhook/vendor
Content-Type: application/json

{
  "vendor": "string (e.g. 'Sterling')",
  "vendorReference": "string",
  "status": "BackgroundCheckStatus",
  "vendorData": {
    "candidateName": "string",
    "candidateEmail": "string",
    "orderId": "string",
    "startDate": "ISO date"
  }
}

Response: { success: true, caseId: "string" } (200 OK)
```

### Get Checklist Summary
```bash
GET /api/cases/:id/checklist-summary

Response: {
  "caseId": "string",
  "total": number,
  "completed": number,
  "clear": number,
  "needsReview": number,
  "pending": number,
  "overallStatus": "BackgroundCheckStatus",
  "overallScore": "OverallScore"
}
```

---

## Troubleshooting

### Port Already in Use

If you get "EADDRINUSE" error:

**Backend (port 5002):**
```bash
# macOS/Linux
lsof -i :5002
kill -9 <PID>

# Windows
netstat -ano | findstr :5002
taskkill /PID <PID> /F
```

**Frontend (port 5173):**
```bash
# macOS/Linux
lsof -i :5173
kill -9 <PID>

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Module Not Found

If you get "Cannot find module 'react-router-dom'":

```bash
cd verify-app/frontend
npm install react-router-dom@^6.0.0
```

### Blank Dashboard

Possible causes:
1. Backend not running (check terminal, should show "Server running on port 5002")
2. No cases created yet (use curl to create one)
3. API URL wrong (check browser console for errors)

Solutions:
1. Check browser console (F12) for errors
2. Try creating case via curl
3. Check backend logs for errors
4. Verify API URL in `frontend/src/api.ts` matches backend URL

### Case Data Not Persisting

Cases are stored in `backend/data/background_check_case_*.json`. If data disappears:

1. Check directory exists: `ls backend/data/`
2. Check file permissions: `ls -la backend/data/`
3. Data is only in-memory during development; files written to disk on each save
4. Restart backend to reload from disk

---

## Testing Checklist

### Dashboard
- [ ] Cases appear in table
- [ ] Status filter tabs work
- [ ] Summary stats update correctly
- [ ] "View" button navigates to case detail
- [ ] SLA risk shows correctly
- [ ] Responsive on different screen sizes

### Case Detail
- [ ] Header shows correct candidate info
- [ ] All 5 checks listed
- [ ] Status badges colored correctly
- [ ] Timeline shows events
- [ ] Update status dropdown works
- [ ] Admin decision buttons work
- [ ] Back button returns to dashboard
- [ ] Sticky admin panel stays visible while scrolling

### Exception Queue
- [ ] SLA at risk cases surface
- [ ] Needs review cases surface
- [ ] Filter tabs work
- [ ] Can acknowledge exception
- [ ] Can assign exception
- [ ] Can mark resolved
- [ ] View full case link works

### API
- [ ] Create case returns correct fields
- [ ] List cases filters work
- [ ] Update check status updates correctly
- [ ] Admin decision persists
- [ ] Timeline events created properly
- [ ] Overall status derives correctly
- [ ] Overall score derives correctly

---

## Performance Tips

**For large datasets:**
1. Add pagination to dashboard (currently shows all cases)
2. Implement search/filter on client side
3. Use database instead of file storage
4. Add caching layer

**For production:**
1. Enable gzip compression
2. Minify frontend bundle
3. Use CDN for static assets
4. Configure CORS properly
5. Add rate limiting on API

---

## Next Steps

1. **Test thoroughly** with workflows above
2. **Add authentication** (JWT or similar)
3. **Implement authorization** (admin/PX Ops checks)
4. **Add Sterling webhook integration** (real vendor data)
5. **Migrate to database** (PostgreSQL or MongoDB)
6. **Deploy to production** (Docker, Kubernetes, AWS, etc.)
7. **Add monitoring** (error tracking, performance metrics)
8. **Set up CI/CD** (automated testing, deployment)

---

## Getting Help

Check these files for documentation:
- [STEP_1_ENTERPRISE_MODELS.md](./STEP_1_ENTERPRISE_MODELS.md) - Data models
- [STEP_2_DASHBOARD_UI.md](./STEP_2_DASHBOARD_UI.md) - Dashboard & routes
- [STEP_3_4_UI_COMPONENTS.md](./STEP_3_4_UI_COMPONENTS.md) - Case detail & exception queue
- [COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md) - System overview

Check browser console (F12) and backend logs for error messages.
