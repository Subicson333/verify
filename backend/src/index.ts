/**
 * Background Verification App - Main Server
 * 
 * STEP 2 Endpoints:
 * - POST /api/cases/:id/checks — Update checkboxes
 * - GET /api/cases/:id — Get case
 * - GET /api/cases — List all cases
 * 
 * STEP 3 Endpoint:
 * - POST /api/cases/:id/submit — Admin submit with decision
 *   Payload: { submittedBy: "admin@example.com" }
 *   Returns: Updated case with CLEARED or REVIEW_REQUIRED result
 *   Side effect: If CLEARED, calls Lever-Lite callback
 */

import express from "express";
import cors from "cors";
import casesRouter from "./routes/cases";

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/cases", casesRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Verification App Backend running on http://localhost:${PORT}`);
  console.log(`✓ All data treated as SENSITIVE`);
});
