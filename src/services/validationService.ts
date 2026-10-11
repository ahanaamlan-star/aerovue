/**
 * AEROVUE Validation Service
 *
 * Manages empirical test suite execution, performance metrics calculation,
 * and operator audit notes for the Validation Center.
 */

import {
  ValidationTestCase,
  ValidationPerformanceSummary,
  KnownLimitation,
  ValidationTestStatus,
} from '../types';
import {
  INITIAL_VALIDATION_TEST_CASES,
  INITIAL_PERFORMANCE_SUMMARY,
  KNOWN_LIMITATIONS,
} from '../data/mockValidationData';

class ValidationService {
  private testCases: ValidationTestCase[] = [...INITIAL_VALIDATION_TEST_CASES];
  private limitations: KnownLimitation[] = [...KNOWN_LIMITATIONS];

  getTestCases(): ValidationTestCase[] {
    return [...this.testCases];
  }

  getKnownLimitations(): KnownLimitation[] {
    return [...this.limitations];
  }

  getPerformanceSummary(): ValidationPerformanceSummary {
    return this.calculateSummary(this.testCases);
  }

  private calculateSummary(cases: ValidationTestCase[]): ValidationPerformanceSummary {
    let totalDetections = 0;
    let totalDiscrepancies = 0;
    let sumConfidence = 0;
    let validConfidenceCount = 0;
    let sumLatency = 0;
    let validLatencyCount = 0;
    let sumCoverage = 0;
    let validCoverageCount = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (const tc of cases) {
      if (tc.detectionCount !== null) totalDetections += tc.detectionCount;
      if (tc.discrepancyCount !== null) totalDiscrepancies += tc.discrepancyCount;
      if (tc.confidenceScore !== null) {
        sumConfidence += tc.confidenceScore;
        validConfidenceCount++;
      }
      if (tc.processingLatencyMs !== null) {
        sumLatency += tc.processingLatencyMs;
        validLatencyCount++;
      }
      if (tc.coveragePct !== null) {
        sumCoverage += tc.coveragePct;
        validCoverageCount++;
      }
      if (tc.falsePositives !== null) falsePositives += tc.falsePositives;
      if (tc.falseNegatives !== null) falseNegatives += tc.falseNegatives;
    }

    return {
      totalDetectionCount: totalDetections,
      totalDiscrepancyCount: totalDiscrepancies,
      averageConfidence:
        validConfidenceCount > 0
          ? Number((sumConfidence / validConfidenceCount).toFixed(1))
          : 0,
      averageLatencyMs:
        validLatencyCount > 0
          ? Number((sumLatency / validLatencyCount).toFixed(1))
          : 0,
      averageCoveragePct:
        validCoverageCount > 0
          ? Number((sumCoverage / validCoverageCount).toFixed(1))
          : 0,
      totalFalsePositives: falsePositives,
      totalFalseNegatives: falseNegatives,
      isSimulation: true,
      fieldValidationStatus: 'NOT_YET_VALIDATED',
    };
  }

  async runSingleTest(testId: string): Promise<ValidationTestCase | null> {
    const idx = this.testCases.findIndex((t) => t.testId === testId);
    if (idx === -1) return null;

    // Simulate harness execution delay (120ms to 240ms)
    await new Promise((resolve) => setTimeout(resolve, 180));

    const existing = this.testCases[idx];
    const jitter = Math.floor(Math.random() * 7) - 3;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const updated: ValidationTestCase = {
      ...existing,
      timestamp: now,
      processingLatencyMs: Math.max(45, (existing.processingLatencyMs || 65) + jitter),
      isSimulation: true,
    };

    this.testCases[idx] = updated;
    return updated;
  }

  async runAllTests(
    onProgress?: (completed: number, total: number) => void
  ): Promise<ValidationTestCase[]> {
    for (let i = 0; i < this.testCases.length; i++) {
      const tc = this.testCases[i];
      await new Promise((resolve) => setTimeout(resolve, 80));
      const jitter = Math.floor(Math.random() * 5) - 2;
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

      this.testCases[i] = {
        ...tc,
        timestamp: now,
        processingLatencyMs: Math.max(45, (tc.processingLatencyMs || 65) + jitter),
        isSimulation: true,
      };

      if (onProgress) {
        onProgress(i + 1, this.testCases.length);
      }
    }

    return [...this.testCases];
  }

  updateTestCase(
    testId: string,
    updates: {
      status?: ValidationTestStatus;
      notes?: string;
    }
  ): ValidationTestCase | null {
    const idx = this.testCases.findIndex((t) => t.testId === testId);
    if (idx === -1) return null;

    const existing = this.testCases[idx];
    const updated: ValidationTestCase = {
      ...existing,
      status: updates.status ?? existing.status,
      notes: updates.notes ?? existing.notes,
    };

    this.testCases[idx] = updated;
    return updated;
  }

  resetToDefaults(): ValidationTestCase[] {
    this.testCases = [...INITIAL_VALIDATION_TEST_CASES];
    return [...this.testCases];
  }
}

export const validationService = new ValidationService();
