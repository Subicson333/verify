# Modal Verification Review - Quick Guide

## How to Use the New Modal

### Step 1: Open Modal
```
Dashboard → Click "View" button on any case row
```
**Result:** Modal dialog opens showing candidate name and 5 verification items

---

### Step 2: Review Each Item

For each verification that needs review:

#### A. Check the Item
```
[ ] Identity Verification
    Mark as reviewed to select a verdict
```
**Click the checkbox** → Checkbox becomes checked

#### B. Select Verdict
Once checkbox is checked, dropdown appears:

```
Checkbox: ☑️ Identity Verification

Verdict *
[-- Select verdict --▼]
├─ Clear
└─ Not Clear
```

**Click dropdown** → Select "Clear" or "Not Clear"

#### C. If "Not Clear" → Enter Comment

When you select "Not Clear", a comment field appears:

```
Verdict *: [Not Clear▼]

Comment / Reason *
┌─────────────────────────────────────────┐
│ This verification could not be confirmed│
│ because the employment dates don't match│
│ the candidate's stated history.         │
└─────────────────────────────────────────┘
```

**Type explanation** → Text is captured

---

### Step 3: Continue with Next Items

Repeat the same process for other verifications:

- Identity Verification → [Review checkbox] → [Select verdict] → [Optional comment]
- Criminal History Check → [Review checkbox] → [Select verdict] → [Optional comment]
- Employment Verification → [Review checkbox] → [Select verdict] → [Optional comment]
- Education Verification → [Review checkbox] → [Select verdict] → [Optional comment]
- Right to Work (I-9) → [Review checkbox] → [Select verdict] → [Optional comment]

---

### Step 4: Action Options

Once you've reviewed the items:

#### Option A: Close Modal
```
[Close] button → Modal closes
```
- Review selections are NOT saved
- Returns to dashboard
- You can click "View" again if needed

#### Option B: Go to Case Detail
```
[View Full Case Details] button → Navigate to /cases/{caseId}
```
- Modal closes
- Full case page opens
- Shows checklist, timeline, admin decision panel
- Use "Submit Verification" button here to finalize

---

## Important Notes

### ✅ What the Modal Does
- Shows all 5 verification items
- Allows you to mark items as reviewed
- Lets you record a verdict (Clear/Not Clear)
- Captures comments for "Not Clear" items
- NO action is triggered by selections

### ❌ What the Modal Does NOT Do
- Does NOT submit the case
- Does NOT trigger timeline events
- Does NOT change status
- Does NOT create decision
- Does NOT validate completeness

### 🔄 Submission Flow
1. Review in modal (optional)
2. Close modal or go to case detail
3. On case detail page, use **"Submit Verification"** button
4. THAT triggers the actual submission

---

## Example: Complete Review Workflow

### Scenario: Reviewing Kevin Lee (cand-004)

**Dashboard Screen:**
```
Cases Table
┌─────────────────────────────────────────────────────────┐
│ Kevin Lee │ cand-004 │ ... │ [View] │
└─────────────────────────────────────────────────────────┘
```

**Click [View]** → Modal Opens:

```
╔══════════════════════════════════════════════════════════════╗
║  Verification Review                                    × [×] ║
║  Kevin Lee                                                   ║
║──────────────────────────────────────────────────────────────║
║  Review each verification item. Select an option from the    ║
║  dropdown for items being reviewed.                          ║
║                                                              ║
║  ☐ Identity Verification                                    ║
║    Mark as reviewed to select a verdict                      ║
║                                                              ║
║  ☑ Criminal History Check                                   ║
║    Mark as reviewed to select a verdict                      ║
║    Verdict *                                                 ║
║    [Not Clear▼]                                              ║
║    Comment / Reason *                                        ║
║    ┌──────────────────────────────────────────────────────┐ ║
║    │ Found unresolved misdemeanor from 2019                │ ║
║    └──────────────────────────────────────────────────────┘ ║
║                                                              ║
║  ☐ Employment Verification                                  ║
║    Mark as reviewed to select a verdict                      ║
║                                                              ║
║  ☐ Education Verification                                   ║
║    Mark as reviewed to select a verdict                      ║
║                                                              ║
║  ☐ Right to Work Eligibility (I-9)                         ║
║    Mark as reviewed to select a verdict                      ║
║                                                              ║
║  💡 Note: Selecting verdict values does not trigger         ║
║     submission. Use "Submit Verification" to finalize.      ║
║                                                              ║
║──────────────────────────────────────────────────────────────║
║                      [Close] [View Full Case Details]       ║
╚══════════════════════════════════════════════════════════════╝
```

**Click [View Full Case Details]** → Case page opens:

```
Case Detail Screen
├─ Header: Kevin Lee | cand-004 | Status: NEW
├─ Checklist Panel (5 checks)
├─ Timeline Panel (audit trail)
└─ Admin Decision Panel (sticky)
    [Approve] [Needs Review] [Reject]
    └─ [Submit Verification] button
```

**Click [Submit Verification]** → Actually submits the case

---

## Visual States

### Verification Item - Unchecked
```
☐ Identity Verification
  Mark as reviewed to select a verdict
```

### Verification Item - Checked (No Verdict)
```
☑ Identity Verification
  Mark as reviewed to select a verdict
  
  Verdict *
  [-- Select verdict --▼]
```

### Verification Item - Clear
```
☑ Identity Verification
  Mark as reviewed to select a verdict
  
  Verdict *
  [Clear▼]
```

### Verification Item - Not Clear (No Comment)
```
☑ Identity Verification
  Mark as reviewed to select a verdict
  
  Verdict *
  [Not Clear▼]
  
  Comment / Reason *
  ┌─────────────────────────────────────────┐
  │ [Type comment here...]                   │
  └─────────────────────────────────────────┘
```

### Verification Item - Not Clear (With Comment)
```
☑ Identity Verification
  Mark as reviewed to select a verdict
  
  Verdict *
  [Not Clear▼]
  
  Comment / Reason *
  ┌─────────────────────────────────────────┐
  │ Documents do not match government records│
  └─────────────────────────────────────────┘
```

---

## Tips

💡 **Tip 1:** You don't need to review all items at once. You can review some now and come back later.

💡 **Tip 2:** Comments are only required when "Not Clear" is selected. "Clear" verdicts don't need comments.

💡 **Tip 3:** The modal is for note-taking. The actual submission happens on the case detail page.

💡 **Tip 4:** Closing the modal doesn't save anything - it's just for your review. Selections are lost when you close.

💡 **Tip 5:** Use "View Full Case Details" when you're ready to formally review and submit the case.

---

## Keyboard Navigation

- **Tab:** Move between form elements
- **Space:** Toggle checkbox
- **Enter:** Open dropdown
- **Escape:** Close modal (if supported)
- **Arrow Keys:** Navigate dropdown options

---

## Accessibility

✅ All form fields have labels  
✅ Required fields marked with `*`  
✅ Focus states visible  
✅ Color contrast meets WCAG standards  
✅ Logical tab order  
✅ Screen reader friendly  

---

## Troubleshooting

**Q: I clicked "View" but nothing happened**  
A: Make sure the backend is running on port 5002 and the modal is not already open.

**Q: My selections disappeared**  
A: Closing the modal clears all selections. Click "View" again to re-open.

**Q: Comment field won't appear**  
A: Make sure you've selected "Not Clear" from the dropdown. The comment field only appears for "Not Clear".

**Q: Where does my comment go?**  
A: Comments are captured in the modal but aren't saved anywhere until you submit the case from the case detail page.

---

## Summary

The modal provides a quick, convenient way to:
✅ See all verifications at a glance
✅ Note verdicts during review
✅ Capture concerns with comments
✅ Proceed to full case detail when ready

All without leaving the dashboard or triggering any automatic actions.
