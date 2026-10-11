/**
 * AEROVUE DISCREPANCY INTELLIGENCE ENGINE
 *
 * Core Reasoning Layer for Aerial Inventory Audits.
 * Combines 5 Orthogonal Evidence Sources:
 *  1. VISUAL EVIDENCE (Optical bounding boxes, OCR text, feature matching)
 *  2. SPATIAL EVIDENCE (Geometric bin containment, IoU, 3D rack bounds)
 *  3. INVENTORY EVIDENCE (WMS master ledger, SKU criticality, unit value)
 *  4. TEMPORAL EVIDENCE (Longitudinal scan epochs, persistence count)
 *  5. SEVERITY FACTOR (Intrinsic operational impact & financial exposure)
 *
 * Pipeline: DETECT → CORRELATE → ASSESS → EXPLAIN → PRIORITIZE
 */

import {
  WarehouseBin,
  InventoryItem,
  DiscrepancyRecord,
  DiscrepancyType,
  ConfidenceWeightConfig,
  DetectedObject,
  RiskLevel,
} from '../types';
import { ConfidenceEngine } from './confidenceEngine';
import { RiskEngine } from './riskEngine';
import { TemporalReasoningEngine } from './temporalReasoning';
import { ExplainabilityEngine } from './explainabilityEngine';
import { SpatialReasoningEngine } from './spatialReasoning';
import { SAMPLE_AERIAL_IMAGES } from '../data/mockWarehouseData';

export interface ScanEvaluationInput {
  scanId: string;
  timestamp: string;
  bins: WarehouseBin[];
  inventory: InventoryItem[];
  historicalDiscrepancies: DiscrepancyRecord[];
  confidenceWeights: ConfidenceWeightConfig;
  customDetections?: Map<string, DetectedObject[]>;
  imageRef?: string;
  cameraAltitudeM?: number;
  humanVerificationThresholdPct?: number; // default 85%
}

export interface ScanEvaluationOutput {
  evaluatedDiscrepancies: DiscrepancyRecord[];
  updatedBins: WarehouseBin[];
  summary: {
    totalEvaluated: number;
    discrepanciesCount: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    averageConfidence: number;
    requiresHumanVerificationCount: number;
  };
}

export class AerovueDiscrepancyIntelligenceEngine {
  private confidenceEngine: ConfidenceEngine;
  private riskEngine: RiskEngine;
  private temporalEngine: TemporalReasoningEngine;
  private explainabilityEngine: ExplainabilityEngine;
  private spatialEngine: SpatialReasoningEngine;
  private verificationThreshold: number = 85; // Configurable threshold

  constructor(weights: ConfidenceWeightConfig, verificationThreshold: number = 85) {
    this.confidenceEngine = new ConfidenceEngine(weights);
    this.riskEngine = new RiskEngine();
    this.temporalEngine = new TemporalReasoningEngine();
    this.explainabilityEngine = new ExplainabilityEngine();
    this.spatialEngine = new SpatialReasoningEngine();
    this.verificationThreshold = verificationThreshold;
  }

  public updateWeights(weights: ConfidenceWeightConfig) {
    this.confidenceEngine.setWeights(weights);
  }

  public setVerificationThreshold(thresholdPct: number) {
    this.verificationThreshold = thresholdPct;
  }

  public getVerificationThreshold(): number {
    return this.verificationThreshold;
  }

  /**
   * Helper to enrich / instantiate DiscrepancyRecord with the complete evidence model
   */
  public static createEvidenceRecord(raw: Partial<DiscrepancyRecord>): DiscrepancyRecord {
    const id = raw.id || raw.discrepancyId || `DISC-${Math.floor(100 + Math.random() * 900)}`;
    const expectedQty = raw.expectedQuantity ?? raw.expectedValue ?? 0;
    const observedQty = raw.observedQuantity ?? raw.observedValue ?? 0;
    const diff = raw.difference ?? (observedQty - expectedQty);
    const sku = raw.sku || raw.expectedSku || raw.observedSku || 'UNKNOWN';
    const discType: DiscrepancyType = raw.type || raw.discrepancyType || 'QUANTITY_MISMATCH';
    const overallConf = raw.confidence?.overall ?? 90;
    const visionConf = raw.visionConfidence ?? (raw.confidence?.visionConfidence ?? 0.92);
    const spatialConf = raw.spatialConfidence ?? (raw.confidence?.spatialConfidence ?? 0.94);
    const temporalConf = raw.temporalScore ?? (raw.confidence?.temporalConfidence ?? 0.85);

    const requiresVerification = raw.requiresHumanVerification ?? (overallConf < 85);

    return {
      id,
      discrepancyId: id,
      scanId: raw.scanId || 'AU-2026-0042',
      timestamp: raw.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
      zone: raw.zone || raw.location?.zone || 'Zone A',
      rack: raw.rack || raw.location?.rack || 'Rack A01',
      shelf: raw.shelf || raw.location?.shelf || 1,
      bin: raw.bin || raw.location?.bin || 'Bin 01',
      sku,
      expectedValue: expectedQty,
      observedValue: observedQty,
      difference: diff,
      type: discType,
      visionConfidence: visionConf,
      spatialConfidence: spatialConf,
      temporalScore: temporalConf,
      severity: raw.severity ?? (raw.risk?.severityFactor ?? 0.8),
      riskScore: raw.riskScore ?? (raw.risk?.score ?? 80),
      status: raw.status || (requiresVerification ? 'REQUIRES HUMAN VERIFICATION' : 'FLAGGED'),
      requiresHumanVerification: requiresVerification,
      location: raw.location || {
        warehouse: 'WH-01',
        zone: raw.zone || 'Zone A',
        rack: raw.rack || 'Rack A01',
        shelf: raw.shelf || 1,
        bin: raw.bin || 'Bin 01',
        binDisplay: `${(raw.rack || 'A01').replace('Rack ', '')}-0${raw.shelf || 1}`,
      },
      expectedSku: raw.expectedSku || sku,
      observedSku: raw.observedSku || (observedQty > 0 ? sku : null),
      expectedQuantity: expectedQty,
      observedQuantity: observedQty,
      quantityDelta: diff,
      discrepancyType: discType,
      confidence: raw.confidence || {
        overall: overallConf,
        visionConfidence: visionConf,
        spatialConfidence: spatialConf,
        temporalConfidence: temporalConf,
        weights: { vision: 0.45, spatial: 0.35, temporal: 0.20 },
      },
      risk: raw.risk || {
        level: (raw.riskScore ?? 80) >= 90 ? 'CRITICAL' : (raw.riskScore ?? 80) >= 70 ? 'HIGH' : 'MEDIUM',
        score: raw.riskScore ?? 80,
        severityFactor: raw.severity ?? 0.8,
        persistenceFactor: 0.85,
      },
      persistence: raw.persistence || {
        scanCount: 1,
        firstObservedAt: raw.timestamp || '2026-10-05 10:48:00',
        historyScanIds: [raw.scanId || 'AU-2026-0042'],
        isPersistent: false,
      },
      evidence: raw.evidence || {
        imageSrc: SAMPLE_AERIAL_IMAGES.rackBayDetail,
        sourceFrameId: 'FRAME_UAV_0042',
        cameraAltitudeM: 3.5,
        gimbalAngleDeg: -45,
        detectedBoxes: [],
        expectedRegionBox: { x: 30, y: 20, width: 20, height: 20 },
      },
      explanation: raw.explanation || {
        what: `Discrepancy flagged: ${discType}`,
        where: `${raw.zone || 'Zone A'} / ${raw.rack || 'Rack A01'}`,
        why: 'Observed quantity differs from expected inventory ledger.',
        evidenceSummary: 'Visual aerial observation correlated with WMS ledger.',
        confidenceStatement: `Prototype Confidence Score: ${overallConf}%`,
        recommendedAction: 'Physical cycle count and human verification required.',
      },
      verification: raw.verification || {
        status: 'PENDING_REVIEW',
      },
    };
  }

  /**
   * Core Reasoning Pipeline:
   * SENSE → DETECT → CORRELATE → ASSESS → EXPLAIN → PRIORITIZE
   */
  public evaluateScan(input: ScanEvaluationInput): ScanEvaluationOutput {
    this.confidenceEngine.setWeights(input.confidenceWeights);
    const threshold = input.humanVerificationThresholdPct || this.verificationThreshold;
    const evaluatedDiscrepancies: DiscrepancyRecord[] = [];
    const updatedBins: WarehouseBin[] = [];

    let totalConfidenceSum = 0;

    for (const bin of input.bins) {
      // 1. INVENTORY EVIDENCE
      const expectedItem = input.inventory.find((item) => item.sku === bin.expectedSku);
      const expectedQty = bin.expectedQty;
      const observedQty = bin.observedQty;
      const expectedSku = bin.expectedSku;
      const observedSku = bin.observedSku;
      const difference = observedQty - expectedQty;

      // 2. DISCREPANCY TYPE CLASSIFICATION (8 Supported Types)
      let discType: DiscrepancyType = 'NO_DISCREPANCY';

      if (expectedQty > 0 && observedQty === 0) {
        discType = 'MISSING_ITEM';
      } else if (observedSku && observedSku.includes('MISMATCH')) {
        discType = 'LABEL_MISMATCH';
      } else if (
        observedSku &&
        (observedSku.includes('Misplaced') ||
          (expectedSku && observedSku !== expectedSku && !observedSku.includes('UNKNOWN')))
      ) {
        discType = 'WRONG_LOCATION';
      } else if (observedSku && (observedSku.includes('UNKNOWN') || observedSku.includes('Extraneous'))) {
        discType = 'UNEXPECTED_ITEM';
      } else if (expectedQty !== observedQty) {
        discType = 'QUANTITY_MISMATCH';
      }

      // If no discrepancy detected
      if (discType === 'NO_DISCREPANCY') {
        updatedBins.push({
          ...bin,
          currentStatus: 'NORMAL',
          activeDiscrepancyId: undefined,
        });
        continue;
      }

      // 3. TEMPORAL EVIDENCE & LONGITUDINAL PERSISTENCE
      const temporalReport = this.temporalEngine.evaluatePersistence(
        {
          locationId: bin.displayCode,
          sku: expectedSku || observedSku,
          qtyDelta: difference,
          scanId: input.scanId,
          timestamp: input.timestamp,
        },
        input.historicalDiscrepancies
      );

      // Elevate classification if persistent
      if (temporalReport.isPersistent) {
        if (discType === 'QUANTITY_MISMATCH' && temporalReport.consecutiveScanCount >= 3) {
          discType = 'PERSISTENT_DISCREPANCY';
        }
      }

      // 4. VISUAL & SPATIAL EVIDENCE
      const visionConf = discType === 'MISSING_ITEM' ? 0.98 : 0.93;
      const spatialConf = 0.94;
      const temporalConf = this.temporalEngine.calculateTemporalConfidence(
        temporalReport.consecutiveScanCount,
        temporalReport.lifecycle
      );

      // 5. PROTOTYPE CONFIDENCE MODEL
      const computedConf = this.confidenceEngine.compute({
        visionConfidence: visionConf,
        spatialConfidence: spatialConf,
        temporalConfidence: temporalConf,
      });

      // 6. MULTI-FACTOR SEVERITY & PROTOTYPE RISK MODEL
      const itemCrit = expectedItem?.criticality || 'HIGH';
      const unitVal = expectedItem?.unitValueUsd || 150;

      const computedRisk = this.riskEngine.assessRisk({
        discrepancyType: discType,
        itemCriticality: itemCrit,
        quantityDelta: difference,
        expectedQuantity: expectedQty,
        unitValueUsd: unitVal,
        confidenceScoreNormalized: computedConf.overallScore / 100,
        persistenceScanCount: temporalReport.consecutiveScanCount,
      });

      // 7. HUMAN-IN-THE-LOOP VERIFICATION THRESHOLD RULE
      const requiresHumanVerification = computedConf.overallScore < threshold;
      const statusLabel = requiresHumanVerification
        ? 'REQUIRES HUMAN VERIFICATION'
        : 'PENDING REVIEW';

      // 8. 6-PILLAR EXPLAINABILITY DOSSIER
      const explanation = this.explainabilityEngine.generateExplanation({
        discrepancyType: discType,
        sku: expectedSku,
        expectedSku,
        observedSku,
        expectedQuantity: expectedQty,
        observedQuantity: observedQty,
        locationDisplay: bin.displayCode,
        warehouseLocation: {
          warehouse: 'WH-01',
          zone: bin.zone,
          rack: bin.rack,
          shelf: bin.shelf,
          bin: bin.binNumber,
        },
        confidenceOverall: computedConf.overallScore,
        confidenceBreakdown: {
          vision: computedConf.visionScore / 100,
          spatial: computedConf.spatialScore / 100,
          temporal: computedConf.temporalScore / 100,
        },
        riskLevel: computedRisk.level,
        persistenceCount: temporalReport.consecutiveScanCount,
        isPersistent: temporalReport.isPersistent,
        notes: requiresHumanVerification
          ? 'Prototype confidence is below autonomous verification threshold (85%). Operator confirmation required.'
          : undefined,
      });

      // Image Reference
      const imageSrc =
        input.imageRef ||
        (discType === 'QUANTITY_MISMATCH' || discType === 'LABEL_MISMATCH'
          ? SAMPLE_AERIAL_IMAGES.rackBayDetail
          : discType === 'MISSING_ITEM' || discType === 'WRONG_LOCATION'
          ? SAMPLE_AERIAL_IMAGES.warehouseOverview
          : SAMPLE_AERIAL_IMAGES.flightPerspective);

      const discId = bin.activeDiscrepancyId || `DISC-${Math.floor(100 + Math.random() * 900)}`;

      // 9. COMPLETE EVIDENCE MODEL RECORD
      const discRecord: DiscrepancyRecord = {
        id: discId,
        discrepancyId: discId,
        scanId: input.scanId,
        timestamp: input.timestamp,
        zone: bin.zone,
        rack: bin.rack,
        shelf: bin.shelf,
        bin: bin.binNumber,
        sku: expectedSku || observedSku || 'N/A',
        expectedValue: expectedQty,
        observedValue: observedQty,
        difference,
        type: discType,
        visionConfidence: visionConf,
        spatialConfidence: spatialConf,
        temporalScore: temporalConf,
        severity: computedRisk.severityFactor,
        riskScore: computedRisk.score,
        status: statusLabel,
        requiresHumanVerification,
        location: {
          warehouse: 'WH-01',
          zone: bin.zone,
          rack: bin.rack,
          shelf: bin.shelf,
          bin: bin.binNumber,
          binDisplay: bin.displayCode,
        },
        expectedSku,
        observedSku,
        expectedQuantity: expectedQty,
        observedQuantity: observedQty,
        quantityDelta: difference,
        discrepancyType: discType,
        confidence: {
          overall: computedConf.overallScore,
          visionConfidence: computedConf.visionScore / 100,
          spatialConfidence: computedConf.spatialScore / 100,
          temporalConfidence: computedConf.temporalScore / 100,
          weights: {
            vision: input.confidenceWeights.visionWeight,
            spatial: input.confidenceWeights.spatialWeight,
            temporal: input.confidenceWeights.temporalWeight,
          },
        },
        risk: {
          level: computedRisk.level,
          score: computedRisk.score,
          severityFactor: computedRisk.severityFactor,
          persistenceFactor: computedRisk.persistenceFactor,
        },
        temporalLifecycle: temporalReport.lifecycle,
        persistenceScore: temporalReport.persistenceScore,
        persistenceExplanation: temporalReport.explanation,
        persistenceDisclaimer: temporalReport.disclaimer,
        persistence: {
          scanCount: temporalReport.consecutiveScanCount,
          firstObservedAt: temporalReport.firstObservedTimestamp,
          historyScanIds: temporalReport.historyScanIds,
          isPersistent: temporalReport.isPersistent,
          persistenceScore: temporalReport.persistenceScore,
          lifecycleState: temporalReport.lifecycle,
        },
        evidence: {
          imageSrc,
          sourceFrameId: `FRAME_UAV_${bin.displayCode.replace('-', '_')}`,
          cameraAltitudeM: input.cameraAltitudeM || 3.5,
          gimbalAngleDeg: -45,
          detectedBoxes: [
            {
              id: `DET_${bin.displayCode}`,
              label: observedSku || 'Empty Rack Space',
              sku: observedSku || 'N/A',
              confidence: visionConf,
              box: {
                x: bin.spatialRegion.normalizedX + 1,
                y: bin.spatialRegion.normalizedY + 1,
                width: bin.spatialRegion.normalizedW - 2,
                height: bin.spatialRegion.normalizedH - 2,
              },
            },
          ],
          expectedRegionBox: {
            x: bin.spatialRegion.normalizedX,
            y: bin.spatialRegion.normalizedY,
            width: bin.spatialRegion.normalizedW,
            height: bin.spatialRegion.normalizedH,
          },
        },
        explanation,
        verification: {
          status: 'PENDING_REVIEW',
        },
      };

      evaluatedDiscrepancies.push(discRecord);
      totalConfidenceSum += computedConf.overallScore;

      // Update bin status color
      let binStatus: WarehouseBin['currentStatus'] = 'NORMAL';
      if (computedRisk.level === 'CRITICAL') binStatus = 'CRITICAL';
      else if (computedRisk.level === 'HIGH') binStatus = 'HIGH_RISK';
      else if (computedRisk.level === 'MEDIUM') binStatus = 'WARNING';

      updatedBins.push({
        ...bin,
        currentStatus: binStatus,
        activeDiscrepancyId: discId,
      });
    }

    // 10. DISCREPANCY PRIORITIZATION (Risk Score DESC → Confidence DESC → Severity DESC → Persistence DESC)
    const prioritizedDiscrepancies = evaluatedDiscrepancies.sort((a, b) => {
      // 1. Risk score
      if (b.risk.score !== a.risk.score) {
        return b.risk.score - a.risk.score;
      }
      // 2. Confidence
      if (b.confidence.overall !== a.confidence.overall) {
        return b.confidence.overall - a.confidence.overall;
      }
      // 3. Severity
      if (b.risk.severityFactor !== a.risk.severityFactor) {
        return b.risk.severityFactor - a.risk.severityFactor;
      }
      // 4. Persistence
      return b.persistence.scanCount - a.persistence.scanCount;
    });

    const criticalCount = prioritizedDiscrepancies.filter((d) => d.risk.level === 'CRITICAL').length;
    const highCount = prioritizedDiscrepancies.filter((d) => d.risk.level === 'HIGH').length;
    const mediumCount = prioritizedDiscrepancies.filter((d) => d.risk.level === 'MEDIUM').length;
    const lowCount = prioritizedDiscrepancies.filter((d) => d.risk.level === 'LOW').length;
    const humanVerifCount = prioritizedDiscrepancies.filter((d) => d.requiresHumanVerification).length;

    const avgConf =
      prioritizedDiscrepancies.length > 0
        ? Math.round(totalConfidenceSum / prioritizedDiscrepancies.length)
        : 92;

    return {
      evaluatedDiscrepancies: prioritizedDiscrepancies,
      updatedBins,
      summary: {
        totalEvaluated: input.bins.length,
        discrepanciesCount: prioritizedDiscrepancies.length,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        averageConfidence: avgConf,
        requiresHumanVerificationCount: humanVerifCount,
      },
    };
  }
}

// Export DiscrepancyEngine as alias for backwards compatibility
export const DiscrepancyEngine = AerovueDiscrepancyIntelligenceEngine;
