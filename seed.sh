#!/bin/bash

# Seed script for verify-app with normalized status examples
# Demonstrates ingest endpoint with various Sterling-like status values

BASE_URL="http://localhost:5002/api"

echo "=== Verify App - Background Check Seeding Script ==="
echo ""

# Test Case 1: NEW status → creates case with normalized status
echo "📥 Ingesting Case 1: NEW (John Doe)"
curl -X POST "$BASE_URL/cases/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "case_new_001",
    "candidateName": "Jane Smith",
    "candidateEmail": "jane.smith@example.com",
    "externalStatus": "New",
    "lastUpdatedAt": "2024-01-15T08:00:00Z"
  }' | jq '.case | {caseId, candidateName, normalizedStatus, currentStatus}' 
echo ""

# Test Case 2: PENDING status
echo "📥 Ingesting Case 2: PENDING"
curl -X POST "$BASE_URL/cases/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "case_pending_001",
    "candidateName": "Robert Johnson",
    "candidateEmail": "robert.johnson@example.com",
    "externalStatus": "Pending",
    "lastUpdatedAt": "2024-01-15T09:00:00Z"
  }' | jq '.case | {caseId, candidateName, normalizedStatus, currentStatus}' 
echo ""

# Test Case 3: IN_PROGRESS status
echo "📥 Ingesting Case 3: IN_PROGRESS"
curl -X POST "$BASE_URL/cases/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "case_processing_001",
    "candidateName": "Sarah Williams",
    "candidateEmail": "sarah.williams@example.com",
    "externalStatus": "Processing",
    "lastUpdatedAt": "2024-01-15T10:00:00Z"
  }' | jq '.case | {caseId, candidateName, normalizedStatus, currentStatus}' 
echo ""

# Test Case 4: COMPLETED_CLEAR status
echo "📥 Ingesting Case 4: COMPLETED_CLEAR"
curl -X POST "$BASE_URL/cases/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "case_completed_clear_001",
    "candidateName": "Michael Brown",
    "candidateEmail": "michael.brown@example.com",
    "externalStatus": "Completed",
    "externalResult": "Clear",
    "score": 950,
    "lastUpdatedAt": "2024-01-15T11:00:00Z"
  }' | jq '.case | {caseId, candidateName, normalizedStatus, currentStatus}' 
echo ""

# Test Case 5: COMPLETED_REVIEW status
echo "📥 Ingesting Case 5: COMPLETED_REVIEW"
curl -X POST "$BASE_URL/cases/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "case_completed_review_001",
    "candidateName": "Emily Davis",
    "candidateEmail": "emily.davis@example.com",
    "externalStatus": "Completed",
    "externalResult": "Review Needed",
    "score": 650,
    "lastUpdatedAt": "2024-01-15T12:00:00Z"
  }' | jq '.case | {caseId, candidateName, normalizedStatus, currentStatus}' 
echo ""

# Test Case 6: ERROR (missing orderId)
echo "📥 Ingesting Case 6: ERROR (invalid payload)"
curl -X POST "$BASE_URL/cases/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "candidateName": "Invalid Candidate",
    "candidateEmail": "invalid@example.com"
  }' | jq '.error' 
echo ""

echo "✅ Seeding complete!"
echo ""
echo "📋 Test the UI at: http://localhost:5173/?caseId=case_new_001"
echo ""
echo "Demo flows:"
echo "1. Verify case_new_001 through admin UI (all checks → CLEARED → Lever-Lite callback)"
echo "2. Verify case_pending_001 with not-clear items (with comment → REVIEW_REQUIRED)"
echo "3. Check normalized status badges for externally ingested cases"
