/**
 * AEROVUE Confidence Engine
 *
 * NOTE: This produces a 'Prototype Confidence Score'.
 * It is a mathematically transparent weighted combination of Vision, Spatial,
 * and Temporal indicators, designed for prototype exploration before empirical
 * calibration datasets are gathered.
 */

import { ConfidenceWeightConfig } from '../types';

export interface ConfidenceFactors {
  visionConfidence: number; // 0.0 - 1.0 (bounding box score, edge contrast, OCR clarity)
  spatialConfidence: number; // 0.0 - 1.0 (geometric alignment to expected bin bounds, camera pose)
  temporalConfidence: number; // 0.0 - 1.0 (consistency across consecutive scans)
}

export interface ComputedConfidence {
  overallScore: number; // 0 - 100
  visionScore: number;
  spatialScore: number;
  temporalScore: number;
  normalizedWeights: ConfidenceWeightConfig;
  calculationBreakdown: string;
}

export class ConfidenceEngine {
  private weights: ConfidenceWeightConfig;

  constructor(weights: ConfidenceWeightConfig) {
    this.weights = this.normalizeWeights(weights);
  }

  public setWeights(weights: ConfidenceWeightConfig): void {
    this.weights = this.normalizeWeights(weights);
  }

  public getWeights(): ConfidenceWeightConfig {
    return { ...this.weights };
  }

  private normalizeWeights(weights: ConfidenceWeightConfig): ConfidenceWeightConfig {
    const sum = weights.visionWeight + weights.spatialWeight + weights.temporalWeight;
    if (sum === 0) {
      return { visionWeight: 0.45, spatialWeight: 0.35, temporalWeight: 0.20 };
    }
    return {
      visionWeight: Number((weights.visionWeight / sum).toFixed(3)),
      spatialWeight: Number((weights.spatialWeight / sum).toFixed(3)),
      temporalWeight: Number((weights.temporalWeight / sum).toFixed(3)),
    };
  }

  public compute(factors: ConfidenceFactors): ComputedConfidence {
    const v = Math.max(0, Math.min(1, factors.visionConfidence));
    const s = Math.max(0, Math.min(1, factors.spatialConfidence));
    const t = Math.max(0, Math.min(1, factors.temporalConfidence));

    const weightedVal =
      v * this.weights.visionWeight +
      s * this.weights.spatialWeight +
      t * this.weights.temporalWeight;

    const overallScore = Math.round(weightedVal * 100);

    return {
      overallScore: Math.min(100, Math.max(0, overallScore)),
      visionScore: Math.round(v * 100),
      spatialScore: Math.round(s * 100),
      temporalScore: Math.round(t * 100),
      normalizedWeights: { ...this.weights },
      calculationBreakdown: `(${v.toFixed(2)} × ${this.weights.visionWeight}) + (${s.toFixed(2)} × ${this.weights.spatialWeight}) + (${t.toFixed(2)} × ${this.weights.temporalWeight}) = ${(weightedVal * 100).toFixed(1)}%`,
    };
  }
}
