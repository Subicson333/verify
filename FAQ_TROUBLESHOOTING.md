# Verify App - FAQ & Troubleshooting

## ❓ Frequently Asked Questions

### Q: How does background check status normalization work?
**A:** The system receives status values from external providers (like "Completed") and converts them into 6 internal states:
- NEW (just created)
- PENDING (waiting)
- IN_PROGRESS (being processed)
- COMPLETED_CLEAR (provider says clear)
- COMPLETED_REVIEW (provider says needs review)
- ERROR (missing data)

The endpoint `POST /api/cases/ingest` handles this conversion using `BackgroundStatusNormalizer`.

---

### Q: What's the difference between "All Clear" and "Review Required"?
**A:**

| All Clear | Review Required |
|---|---|
| All 4 required items checked ✓ | Any required item unchecked |
| Admin submits | Admin must provide comment |
| Result: CLEARED | Result: REVIEW_REQUIRED |
| Lever-Lite callback sent ✓ | NO Lever-Lite callback |
| Onboarding proceeds ✓ | Onboarding paused ⏸ |
| No comment needed | Comment mandatory |

---

### Q: Why do I have to provide a comment when items are Not Clear?
**A:** Comments create an audit trail explaining why verification is being delayed. This ensures:
- Compliance visibility
- Consistent decision-making
- Clear communication to HR/hiring teams
- Demo safety (shows human oversight)

---

### Q: Where does the admin comment go?
**A:**
1. Stored in the case data: `adminComment` field
2. Displayed in verify-app UI as "Admin Verification Note" (yellow box)
3. Sent to lever-lite (if callback triggers later after case is re-reviewed)
4. NOT exposed to public channels

---

### Q: Can I change my decision after submitting?
**A:** Currently, once submitted, the case is locked (checkboxes disabled). If you need to change:
1. Contact your database/system admin to reset the case
2. Or create a new case with updated decision

In a future version, we could add a "re-review" capability.

---

### Q: What happens if Lever-Lite webhook fails?
**A:** Good news - it's non-blocking:
1. Case is saved successfully
2. Webhook failure is logged
3. Admin sees success confirmation
4. Ops team can see error in logs and retry manually

---

### Q: How do I test the Lever-Lite callback?
**A:** 
1. Ensure lever-lite is running on `http://localhost:3001`
2. Check environment variable: `LEVER_LITE_WEBHOOK_URL`
3. Submit a verified case (all items clear)
4. Check backend logs:
   ```
   [LeverLite] Sending CLEARED callback for case case_001...
   [LeverLite] Callback sent successfully (200)
   ```

---

### Q: What data is safe to store in this demo?
**A:** SAFE:
- ✓ Names, emails
- ✓ Normalized status
- ✓ Admin decision timestamp
- ✓ Admin comments (text only)
- ✓ Numeric scores

NEVER STORE:
- ✗ Criminal history details
- ✗ Drug test results
- ✗ Medical information
- ✗ Full reports

---

### Q: Can I ingest data from multiple providers?
**A:** Yes! The `POST /api/cases/ingest` endpoint normalizes from any provider:
```bash
# From Sterling
curl -X POST http://localhost:5002/api/cases/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_123",
    "candidateName": "John",
    "candidateEmail": "john@example.com",
    "externalStatus": "Completed",
    "externalResult": "Clear"
  }'

# From Checkr (would use different status values)
# From BI (would use different status values)
# All normalize to same internal states ✓
```

---

### Q: How do I view the normalized status in the UI?
**A:** The normalized status appears as a blue badge below the candidate info when the case was ingested from an external provider. Example: "COMPLETED_CLEAR" or "IN_PROGRESS".

---

### Q: What if a case is in ERROR status?
**A:** ERROR means:
- Missing orderId (required)
- Missing candidateName (required)
- Missing candidateEmail (required)
- Invalid email format

Fix: Re-ingest with complete, valid data.

---

### Q: Can admin comments be edited after submission?
**A:** No, once submitted, the case is locked. Comments are immutable for audit compliance.

---

### Q: How do I reset a case to start over?
**A:** Currently requires direct database access:
```bash
# Remove the case file
rm /path/to/verify-app/backend/data/background_check_case_case_001.json

# Then re-ingest or create new
```

---

## 🔧 Troubleshooting

### Problem: Backend won't start

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
cd backend
npm install
npm run dev
```

---

### Problem: Frontend can't connect to backend

**Error:** `Network error` or `Failed to fetch`

**Cause:** API_BASE URL mismatch

**Solution:**
```bash
# Check frontend/src/api.ts
# Should be: http://localhost:5002/api

# Or set in vite.config.ts:
export default defineConfig({
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify('http://localhost:5002/api')
  }
})

# Restart frontend: npm run dev
```

---

### Problem: Cases not updating after checkbox changes

**Error:** UI shows change but backend doesn't save

**Cause:** Backend not running or case ID mismatch

**Solution:**
1. Confirm backend is running: `npm run dev` in backend/
2. Check browser console for errors
3. Verify case ID in URL: `?caseId=case_001`
4. Check backend logs for error messages

---

### Problem: Lever-Lite webhook not being sent

**Error:** Case shows CLEARED but no webhook logs

**Cause:** Environment variable not set or Lever-Lite not running

**Solution:**
```bash
# Set env var (backend/.env or shell)
export LEVER_LITE_WEBHOOK_URL=http://localhost:3001/api/background-check/callback

# Confirm Lever-Lite is running
curl http://localhost:3001/health

# Restart backend
npm run dev

# Check logs for: [LeverLite] Sending CLEARED callback...
```

---

### Problem: Comment field not appearing when items unchecked

**Error:** UI shows all checkboxes, no comment box

**Cause:** React state not updating correctly

**Solution:**
1. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Check console for JavaScript errors
3. Verify any required items are actually unchecked

---

### Problem: Seed script fails

**Error:** `curl: (7) Failed to connect`

**Cause:** Backend not running

**Solution:**
```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Run seed script
cd verify-app
chmod +x seed.sh
./seed.sh
```

---

### Problem: TypeScript compilation errors

**Error:** `Type 'NormalizedBackgroundStatus' does not exist`

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Or for backend
cd backend && rm -rf node_modules package-lock.json && npm install
```

---

### Problem: Cases file is corrupted

**Error:** `SyntaxError: Unexpected token` when loading case

**Solution:**
```bash
# Delete corrupted case file
rm /path/to/backend/data/background_check_case_*.json

# Re-seed with valid data
./seed.sh
```

---

## 🧪 Testing Checklist

Before deploying, verify:

- [ ] Backend starts without errors
- [ ] Frontend loads without errors
- [ ] Can fetch case: GET /api/cases/case_001
- [ ] Can update checkboxes: POST /api/cases/case_001/checks
- [ ] Can submit decision: POST /api/cases/case_001/submit
- [ ] Can ingest new case: POST /api/cases/ingest
- [ ] UI displays normalized status badge
- [ ] UI shows comment field when items unchecked
- [ ] Lever-Lite webhook logs show success
- [ ] Admin comment saves correctly
- [ ] REVIEW_REQUIRED cases don't trigger webhook

---

## 📊 Common Status Flow

```
Backend receives external status: "Completed", "Clear"
           ↓
Normalizer converts: "Completed" + "Clear" → "COMPLETED_CLEAR"
           ↓
Case created with normalizedStatus: "COMPLETED_CLEAR"
           ↓
Admin opens UI, sees blue badge: "COMPLETED_CLEAR"
           ↓
Admin marks all items verified ✓✓✓✓
           ↓
Admin clicks "Submit"
           ↓
Backend decides: All required items = true → "CLEARED"
           ↓
Webhook sent to Lever-Lite
           ↓
UI shows green badge: "✓ Cleared"
           ↓
Lever-Lite unpauses onboarding
           ↓
✅ Success!
```

---

## 🔍 Debug Logging

### Enable detailed logs (backend):

**File:** `src/services/BackgroundStatusNormalizer.ts`

Already logs on every normalization:
```
[Normalization] orderId=order_123 externalStatus="Completed" → normalizedStatus="COMPLETED_CLEAR"
```

**File:** `src/services/VerificationDecision.ts`

Logs every decision:
```
[Decision] Case case_001 → CLEARED by admin@example.com
[Decision] Case case_001 → REVIEW_REQUIRED with comment
```

**File:** `src/services/LeverLiteCallback.ts`

Logs webhook events:
```
[LeverLite] Sending CLEARED callback for case case_001...
[LeverLite] Callback sent successfully (200)
[LeverLite] Failed to send callback for case case_001: Error: connect ECONNREFUSED
```

### Enable frontend debug:

Add to `src/components/CaseDetailPage.tsx`:
```typescript
console.log('Case Data:', caseData);
console.log('All Required Verified:', allRequiredVerified());
console.log('Any Not Verified:', anyNotVerified());
```

---

## 💡 Best Practices

### For Admins
1. ✓ Always provide specific comments for "Not Clear" items
2. ✓ Double-check all items before submitting
3. ✓ Use consistent language in comments (helps compliance team)
4. ✓ Note court status if criminal history pending

### For Developers
1. ✓ Keep comment text under 500 characters
2. ✓ Log all state changes for audit
3. ✓ Never store sensitive details
4. ✓ Validate input on both frontend and backend
5. ✓ Test webhook connectivity before deployment

### For Operations
1. ✓ Monitor Lever-Lite webhook failures
2. ✓ Regularly backup case data files
3. ✓ Set up alerts for ERROR status cases
4. ✓ Review admin comment patterns for consistency
5. ✓ Archive completed cases periodically

---

## 🚨 Known Limitations

1. **No case editing after submission** - Cases are locked (by design)
2. **No bulk operations** - Submit one at a time
3. **File-based storage** - Not suitable for high volume
4. **No email notifications** - Manual check required
5. **No dashboard view** - View cases individually by ID

Future versions could add these enhancements.

---

## 📞 Getting Help

1. Check this FAQ first
2. Review logs in terminal where backend is running
3. Check browser console (F12 → Console tab)
4. Verify all environment variables are set
5. Ensure all services (backend, frontend, lever-lite) are running

---

**For more details, see:**
- [IMPLEMENTATION_FEATURES.md](./IMPLEMENTATION_FEATURES.md) - Complete API reference
- [INTEGRATION_FLOW.md](./INTEGRATION_FLOW.md) - Architecture diagrams
- [VALIDATION_CHECKLIST.md](./VALIDATION_CHECKLIST.md) - What's implemented
