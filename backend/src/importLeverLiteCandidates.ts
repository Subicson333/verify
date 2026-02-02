import * as fs from "fs";
import * as path from "path";
import { BackgroundCheckCase, BackgroundCheckStatus, CheckType } from "./types";

// Candidate data from lever-lite1
const candidates = [
  { id: "cand-001", firstName: "John", lastName: "Smith", workEmail: "john.smith@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-002", firstName: "Sarah", lastName: "Johnson", workEmail: "sarah.johnson@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-003", firstName: "Michael", lastName: "Davis", workEmail: "michael.davis@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-004", firstName: "Kevin", lastName: "Lee", workEmail: "kevin.lee@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-005", firstName: "Emily", lastName: "Wilson", workEmail: "emily.wilson@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-006", firstName: "David", lastName: "Brown", workEmail: "david.brown@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-007", firstName: "Jessica", lastName: "Martinez", workEmail: "jessica.martinez@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-008", firstName: "Michelle", lastName: "Garcia", workEmail: "michelle.garcia@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-021", firstName: "Thomas", lastName: "Moore", workEmail: "thomas.moore@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-009", firstName: "Robert", lastName: "Taylor", workEmail: "robert.taylor@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-010", firstName: "Amanda", lastName: "Anderson", workEmail: "amanda.anderson@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-011", firstName: "Christopher", lastName: "Thomas", workEmail: "christopher.thomas@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-012", firstName: "Lisa", lastName: "Jackson", workEmail: "lisa.jackson@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-013", firstName: "William", lastName: "Robinson", workEmail: "william.robinson@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-014", firstName: "James", lastName: "White", workEmail: "james.white@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-015", firstName: "Patricia", lastName: "Harris", workEmail: "patricia.harris@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-016", firstName: "Daniel", lastName: "Martin", workEmail: "daniel.martin@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-017", firstName: "Jennifer", lastName: "Lee", workEmail: "jennifer.lee@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-018", firstName: "Brian", lastName: "Clark", workEmail: "brian.clark@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-019", firstName: "Nancy", lastName: "Rodriguez", workEmail: "nancy.rodriguez@company.com", hiringManagerEmail: "manager@company.com" },
  { id: "cand-020", firstName: "Steven", lastName: "Walker", workEmail: "steven.walker@company.com", hiringManagerEmail: "manager@company.com" },
];

const checkTypes: CheckType[] = [
  "IDENTITY_VERIFICATION",
  "CRIMINAL_HISTORY_CHECK",
  "EMPLOYMENT_VERIFICATION",
  "EDUCATION_VERIFICATION",
  "RIGHT_TO_WORK",
];

const checkTypeLabels: Record<CheckType, string> = {
  IDENTITY_VERIFICATION: "Identity Verification",
  CRIMINAL_HISTORY_CHECK: "Criminal History Check",
  EMPLOYMENT_VERIFICATION: "Employment Verification",
  EDUCATION_VERIFICATION: "Education Verification",
  RIGHT_TO_WORK: "Right to Work",
};

const requiredChecks = ["IDENTITY_VERIFICATION", "CRIMINAL_HISTORY_CHECK", "EMPLOYMENT_VERIFICATION", "RIGHT_TO_WORK"];

function createBackgroundCheckCase(index: number, candidate: typeof candidates[0]): BackgroundCheckCase {
  const now = new Date().toISOString();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30)); // Random start date 0-30 days ago

  return {
    caseId: `case-${String(index + 1).padStart(3, "0")}`,
    orderId: candidate.id,
    candidateId: candidate.id,
    candidateName: `${candidate.firstName} ${candidate.lastName}`,
    candidateEmail: candidate.workEmail,
    owner: candidate.hiringManagerEmail,
    startDate: startDate.toISOString(),
    checks: checkTypes.map((checkType) => ({
      checkId: `check-${Date.now()}-${checkType}`,
      checkType,
      status: "NEW" as BackgroundCheckStatus,
      statusLabel: "New",
      isRequired: requiredChecks.includes(checkType),
      lastUpdated: now,
      vendorReference: undefined,
      notes: undefined,
      updatedAt: now,
    })),
    overallStatus: "NEW" as BackgroundCheckStatus,
    overallScore: "PENDING" as const,
    adminDecision: "IN_PROGRESS" as const,
    slaRisk: false,
    timeline: [
      {
        id: `event-${Date.now()}-1`,
        eventType: "CREATED",
        title: "Case Created",
        timestamp: now,
        actor: "system@company.com",
        metadata: { source: "lever-lite-import" },
      },
    ],
    securityClassification: "SENSITIVE" as const,
    createdAt: now,
    updatedAt: now,
  };
}

const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log(`📝 Creating background check cases for ${candidates.length} candidates...`);

candidates.forEach((candidate, index) => {
  const caseData = createBackgroundCheckCase(index, candidate);
  const filename = `background_check_case_${caseData.caseId.replace("-", "")}.json`;
  const filepath = path.join(dataDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(caseData, null, 2));
  console.log(`✅ Created: ${filename}`);
});

console.log(`\n✨ Successfully created ${candidates.length} background check cases!`);
