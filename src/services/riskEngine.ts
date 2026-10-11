/**
 * AEROVUE Risk Engine
 *
 * NOTE: Clearly labeled as 'Prototype Risk Model'.
 * Risk Score = Normalized(Severity × Confidence × Persistence)
 * Classification: LOW, MEDIUM, HIGH, CRITICAL
 */

import { DiscrepancyType, ItemCriticality, RiskLevel } from '../types';

export interface RiskInput {
  discrepancyType: DiscrepancyType;
  itemCriticality: ItemCriticality;
  quantityDelta: number;
  expectedQuantity: number;
  unitValueUsd?: number;
  confidenceScoreNormalized: number; // 0.0 - 1.0
  persistenceScanCount: number; // 1, 2, 3...
}

export interface ComputedRisk {
  level: RiskLevel;
  score: number; // 0 - 100
  severityFactor: number; // 0.0 - 1.0
  confidenceFactor: number; // 0.0 - 1.0
  persistenceFactor: number; // 0.0 - 1.0
  formulaDescription: string;
}

export class RiskEngine {
  /**
   * Determine intrinsic severity based on discrepancy nature, SKU criticality, and scale
   */
  public calculateSeverity(
    type: DiscrepancyType,
    criticality: ItemCriticality,
    qtyDelta: number,
    expectedQty: number,
    unitValueUsd: number = 50
  ): number {
    let baseSeverity = 0.5;

    switch (type) {
      case 'MISSING_ITEM':
        baseSeverity = 0.90;
        break;
      case 'WRONG_LOCATION':
      case 'MISPLACED_INVENTORY':
        baseSeverity = 0.75;
        break;
      case 'QUANTITY_MISMATCH':
        // Scale with percentage shortage
        const shortageRatio = expectedQty > 0 ? Math.abs(qtyDelta) / expectedQty : 0.5;
        baseSeverity = 0.60 + Math.min(0.30, shortageRatio * 0.35);
        break;
      case 'UNEXPECTED_ITEM':
        baseSeverity = 0.65;
        break;
      case 'LABEL_MISMATCH':
        baseSeverity = 0.55;
        break;
      case 'PERSISTENT_DISCREPANCY':
        baseSeverity = 0.85;
        break;
      case 'NO_DISCREPANCY':
        return 0;
    }

    // Criticality multiplier
    let critMultiplier = 1.0;
    if (criticality === 'MISSION_CRITICAL') critMultiplier = 1.25;
    else if (criticality === 'HIGH') critMultiplier = 1.15;
    else if (criticality === 'MEDIUM') critMultiplier = 1.0;
    else critMultiplier = 0.85;

    // Financial weighting
    if (unitValueUsd > 300) {
      critMultiplier *= 1.1;
    }

    return Math.min(1.0, Math.max(0.1, Number((baseSeverity * critMultiplier).toFixed(2))));
  }

  /**
   * Persistence factor elevates recurring anomalies over single-frame glitches
   */
  public calculatePersistenceFactor(scanCount: number): number {
    if (scanCount <= 1) return 0.70;
    if (scanCount === 2) return 0.85;
    if (scanCount === 3) return 0.93;
    return 1.0;
  }

  public assessRisk(input: RiskInput): ComputedRisk {
    const severityFactor = this.calculateSeverity(
      input.discrepancyType,
      input.itemCriticality,
      input.quantityDelta,
      input.expectedQuantity,
      input.unitValueUsd
    );

    const confidenceFactor = Math.max(0.2, Math.min(1.0, input.confidenceScoreNormalized));
    const persistenceFactor = this.calculatePersistenceFactor(input.persistenceScanCount);

    // Multiplicative risk with non-linear scaling for critical anomalies
    const rawRisk = severityFactor * confidenceFactor * persistenceFactor;
    // Map raw 0.0 - 1.0 to 0 - 100 with sensitivity curve
    const normalizedScore = Math.min(100, Math.round(Math.pow(rawRisk, 0.75) * 100));

    let level: RiskLevel = 'LOW';
    if (normalizedScore >= 88 || (severityFactor >= 0.92 && confidenceFactor >= 0.85)) {
      level = 'CRITICAL';
    } else if (normalizedScore >= 70) {
      level = 'HIGH';
    } else if (normalizedScore >= 42) {
      level = 'MEDIUM';
    } else {
      level = 'LOW';
    }

    return {
      level,
      score: normalizedScore,
      severityFactor,
      confidenceFactor,
      persistenceFactor,
      formulaDescription: `(${severityFactor.toFixed(2)} severity × ${confidenceFactor.toFixed(2)} confidence × ${persistenceFactor.toFixed(2)} persistence)^0.75 = ${normalizedScore}/100 [${level}]`,
    };
  }
}
