# STEP 1 COMPLETE — DATA MODEL (FILE-BASED)

## What Was Built

### 1. **Sample Data File**
- **Location:** `/data/background_check_case.json`
- **Purpose:** Template for case structure
- **Fields Only:**
  - `caseId`, `candidateId`, `candidateName`, `candidateEmail`, `orderId`
  - `currentStatus` (NEW | IN_PROGRESS | SUBMITTED | COMPLETED)
  - `currentResult` (PENDING | CLEARED | REVIEW_REQUIRED)
  - `checks` (5 boolean fields for verification checkboxes)
  - `submittedBy`, `submittedAt`, `completedAt`
  - `securityClassification` = "SENSITIVE" (fixed)

### 2. **TypeScript Types**
- **Location:** `/backend/src/types.ts`
- **Includes:**
  - `BackgroundCheckCase` interface
  - `CheckboxGroup` interface
  - `CheckboxUpdatePayload`
  - `AdminSubmitPayload`
  - Enums for Status and Result

### 3. **File Storage Layer**
- **Location:** `/backend/src/storage.ts`
- **Methods:**
  - `getCase(caseId)` — retrieve by ID
  - `getAllCases()` — list all cases
  - `createCase(data)` — create new case
  - `saveCase(caseData)` — persist to disk

### 4. **Backend Setup**
- **package.json** with Express, CORS, Axios
- **tsconfig.json** with strict TypeScript config

---

## Key Design Decisions

✅ **NO sensitive data fields** — only metadata for demo  
✅ **File-based storage** — no database complexity  
✅ **Case ID segregation** — each case in separate file  
✅ **SENSITIVE classification** — applied to all cases  
✅ **Immutable submit data** — once submitted, cannot be changed  

---

## Ready for STEP 2?

STEP 2 will implement the checkbox update endpoint:
- `POST /api/cases/:id/checks`
- Updates checkboxes only
- Status stays IN_PROGRESS
- No decision logic yet

**Should I proceed?**
