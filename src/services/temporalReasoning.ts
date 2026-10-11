/**
 * AEROVUE Temporal Reasoning Engine
 *
 * Tracks anomalies across multiple temporal scan epochs.
 * Converts isolated image observations into longitudinal discrepancy intelligence.
 * Identifies: NEW, INTERMITTENT, PERSISTENT, and RESOLVED states.
 *
 * Core Equation:
 * CURRENT SCAN + PREVIOUS SCANS → TEMPORAL DISCREPANCY INTELLIGENCE
 *
 * REASONING DIMENSIONS:
 * TIME + LOCATION + INVENTORY + OBSERVATION
 */

import {
  DiscrepancyRecord,
  TemporalLifecycle,
  TimelineEpoch,
  LocationTimeline,
  HistoricalScanRecord,
} from '../types';

export interface TemporalPersistenceReport {
  binId: string;
  sku: string;
  consecutiveScanCount: number;
  totalHistoricalOccurrences: number;
  isPersistent: boolean;
  historyScanIds: string[];
  firstObservedTimestamp: string;
  temporalDeltaTrend: number[]; // e.g. [-4, -4, -4]
  lifecycle: TemporalLifecycle;
  persistenceScore: number; // 0 - 100
  explanation: string;
  disclaimer: string;
}

export class TemporalReasoningEngine {
  /**
   * Prototype Persistence Score calculation
   * Based on repeated observations across scans.
   *
   * Scoring Rules:
   * - RESOLVED: 0 (No active discrepancy detected in latest epoch)
   * - NEW: 35 (Single epoch observation; low temporal confidence bonus)
   * - INTERMITTENT: 45 - 65 (Discrepancy appears non-continuously across epochs)
   * - PERSISTENT:
   *     2 consecutive scans: 70
   *     3 consecutive scans: 90
   *     4+ consecutive scans: 98
   */
  public calculatePersistenceScore(
    consecutiveCount: number,
    totalOccurrences: number,
    lifecycle: TemporalLifecycle
  ): number {
    if (lifecycle === 'RESOLVED') return 0;
    if (lifecycle === 'NEW') return 35;
    if (lifecycle === 'INTERMITTENT') {
      return Math.min(65, Math.max(40, Math.round((totalOccurrences / 4) * 60)));
    }
    // PERSISTENT
    if (consecutiveCount >= 4) return 98;
    if (consecutiveCount === 3) return 90;
    if (consecutiveCount === 2) return 70;
    return 50;
  }

  /**
   * Generate formal operator explanation and honesty disclaimer
   */
  public getPersistenceExplanation(consecutiveCount: number, lifecycle: TemporalLifecycle): {
    explanation: string;
    disclaimer: string;
  } {
    const disclaimer =
      'This increases prioritization confidence but does not independently establish the root cause.';

    if (lifecycle === 'PERSISTENT') {
      return {
        explanation: `Similar discrepancy observed in ${consecutiveCount} consecutive scans.`,
        disclaimer,
      };
    }
    if (lifecycle === 'INTERMITTENT') {
      return {
        explanation: `Discrepancy observed intermittently across multiple scan sessions (${consecutiveCount} occurrences). Potential fluctuating inventory or intermittent sensor occlusion.`,
        disclaimer,
      };
    }
    if (lifecycle === 'RESOLVED') {
      return {
        explanation: `Prior discrepancy resolved. Latest scan observation matches expected inventory ledger.`,
        disclaimer: 'Anomaly cleared by cycle count or automated replenishment.',
      };
    }
    // NEW
    return {
      explanation: `First detected in current scan epoch. Temporal baseline initializing.`,
      disclaimer: 'Single scan observation requires subsequent epoch or human verification.',
    };
  }

  /**
   * Correlates current scan discrepancy against historical discrepancy records
   */
  public evaluatePersistence(
    currentDiscrepancy: {
      locationId: string;
      sku: string | null;
      qtyDelta: number;
      scanId: string;
      timestamp: string;
    },
    historicalDiscrepancies: DiscrepancyRecord[]
  ): TemporalPersistenceReport {
    // Find matching prior discrepancies in the same bin
    const matchingPrior = historicalDiscrepancies
      .filter((d) => {
        const sameBin =
          d.location.binDisplay === currentDiscrepancy.locationId ||
          d.location.bin === currentDiscrepancy.locationId;
        return sameBin;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const priorScanIds = matchingPrior.map((d) => d.scanId);
    const historyScanIds = Array.from(new Set([...priorScanIds, currentDiscrepancy.scanId]));
    const consecutiveCount = matchingPrior.length + 1;

    const firstTimestamp =
      matchingPrior.length > 0 ? matchingPrior[0].timestamp : currentDiscrepancy.timestamp;

    const deltaTrend = [...matchingPrior.map((d) => d.quantityDelta), currentDiscrepancy.qtyDelta];

    // Classification rule: 2 or more scans with uncorrected discrepancy is PERSISTENT
    let lifecycle: TemporalLifecycle = 'NEW';
    if (consecutiveCount >= 2) {
      lifecycle = 'PERSISTENT';
    }

    const persistenceScore = this.calculatePersistenceScore(
      consecutiveCount,
      historyScanIds.length,
      lifecycle
    );

    const { explanation, disclaimer } = this.getPersistenceExplanation(consecutiveCount, lifecycle);

    return {
      binId: currentDiscrepancy.locationId,
      sku: currentDiscrepancy.sku || 'UNKNOWN',
      consecutiveScanCount: consecutiveCount,
      totalHistoricalOccurrences: historyScanIds.length,
      isPersistent: lifecycle === 'PERSISTENT',
      historyScanIds,
      firstObservedTimestamp: firstTimestamp,
      temporalDeltaTrend: deltaTrend,
      lifecycle,
      persistenceScore,
      explanation,
      disclaimer,
    };
  }

  /**
   * Compute temporal confidence score (0.0 to 1.0)
   */
  public calculateTemporalConfidence(
    consecutiveScanCount: number,
    lifecycle: TemporalLifecycle = 'NEW'
  ): number {
    if (lifecycle === 'RESOLVED') return 0.95;
    if (consecutiveScanCount === 1) return 0.75;
    if (consecutiveScanCount === 2) return 0.88;
    if (consecutiveScanCount >= 3) return 0.96;
    return 0.70;
  }
}
