/**
 * File-based storage for background check cases
 * Treats all data as SENSITIVE
 */

import fs from "fs";
import path from "path";
import { BackgroundCheckCase } from "./types";

const CASES_DIR = path.join(__dirname, "../data");
const CASE_FILE_PATTERN = "background_check_case_*.json";

export class CaseStorage {
  /**
   * Get single case by ID
   */
  static getCase(caseId: string): BackgroundCheckCase | null {
    const filePath = this.getCaseFilePath(caseId);
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as BackgroundCheckCase;
    } catch (error) {
      console.error(`Error reading case ${caseId}:`, error);
      return null;
    }
  }

  /**
   * Find case by ID (alias for getCase for consistency)
   */
  static findCaseById(caseId: string): BackgroundCheckCase | null {
    return this.getCase(caseId);
  }

  /**
   * Save case to file
   */
  static saveCase(caseData: BackgroundCheckCase): void {
    const filePath = this.getCaseFilePath(caseData.caseId);
    
    // Ensure directory exists
    if (!fs.existsSync(CASES_DIR)) {
      fs.mkdirSync(CASES_DIR, { recursive: true });
    }

    try {
      fs.writeFileSync(filePath, JSON.stringify(caseData, null, 2), "utf-8");
    } catch (error) {
      console.error(`Error saving case ${caseData.caseId}:`, error);
      throw new Error(`Failed to save case: ${error}`);
    }
  }

  /**
   * Get all cases
   */
  static getAllCases(): BackgroundCheckCase[] {
    try {
      if (!fs.existsSync(CASES_DIR)) {
        return [];
      }

      const files = fs.readdirSync(CASES_DIR);
      const cases: BackgroundCheckCase[] = [];

      for (const file of files) {
        if (file.startsWith("background_check_case_") && file.endsWith(".json")) {
          const filePath = path.join(CASES_DIR, file);
          const content = fs.readFileSync(filePath, "utf-8");
          cases.push(JSON.parse(content) as BackgroundCheckCase);
        }
      }

      return cases;
    } catch (error) {
      console.error("Error reading cases:", error);
      return [];
    }
  }

  /**
   * Create new case
   */
  static createCase(data: Omit<BackgroundCheckCase, "securityClassification">): BackgroundCheckCase {
    const caseData: BackgroundCheckCase = {
      ...data,
      securityClassification: "SENSITIVE",
    };

    this.saveCase(caseData);
    return caseData;
  }

  private static getCaseFilePath(caseId: string): string {
    return path.join(CASES_DIR, `background_check_case_${caseId}.json`);
  }
}
