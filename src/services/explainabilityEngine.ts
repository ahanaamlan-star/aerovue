/**
 * AEROVUE Explainability Engine
 *
 * Synthesizes the 6-pillar operator explanation dossier:
 * 1. WHAT happened?
 * 2. WHERE?
 * 3. WHY was it flagged?
 * 4. WHAT evidence supports it?
 * 5. HOW confident is the system?
 * 6. WHAT should the operator verify?
 */

import { DiscrepancyRecord, DiscrepancyType } from '../types';

export interface ExplanationInput {
  discrepancyType: DiscrepancyType;
  sku: string | null;
  expectedSku: string | null;
  observedSku: string | null;
  expectedQuantity: number;
  observedQuantity: number;
  locationDisplay: string;
  warehouseLocation: {
    warehouse: string;
    zone: string;
    rack: string;
    shelf: number;
    bin: string;
  };
  confidenceOverall: number;
  confidenceBreakdown: {
    vision: number;
    spatial: number;
    temporal: number;
  };
  riskLevel: string;
  persistenceCount: number;
  isPersistent: boolean;
  notes?: string;
}

export class ExplainabilityEngine {
  public generateExplanation(input: ExplanationInput): DiscrepancyRecord['explanation'] {
    const qtyDelta = input.observedQuantity - input.expectedQuantity;
    const deltaStr = qtyDelta > 0 ? `+${qtyDelta}` : `${qtyDelta}`;

    // 1. WHAT happened
    let what = '';
    switch (input.discrepancyType) {
      case 'QUANTITY_MISMATCH':
        what = `Quantity mismatch: Ledger expects ${input.expectedQuantity} units, but aerial vision detected ${input.observedQuantity} units (${deltaStr} variance).`;
        break;
      case 'MISSING_ITEM':
        what = `Missing inventory: Designated bin is completely depleted or empty. 0 units observed vs ${input.expectedQuantity} expected.`;
        break;
      case 'UNEXPECTED_ITEM':
        what = `Unexpected inventory present: Detected foreign or unallocated items alongside expected stock.`;
        break;
      case 'WRONG_LOCATION':
      case 'MISPLACED_INVENTORY':
        what = `Misplaced inventory detected: Items belonging to another zone or rack were deposited in this bin.`;
        break;
      case 'LABEL_MISMATCH':
        what = `Label mismatch: Optical character recognition (OCR) / barcode read differs from bin master assignment.`;
        break;
      case 'PERSISTENT_DISCREPANCY':
        what = `Unresolved persistent discrepancy verified across multiple consecutive UAV flight scans.`;
        break;
      default:
        what = `Discrepancy detected during aerial scan cycle.`;
    }

    // 2. WHERE
    const where = `${input.warehouseLocation.warehouse}, ${input.warehouseLocation.zone}, ${input.warehouseLocation.rack}, Shelf ${input.warehouseLocation.shelf}, ${input.warehouseLocation.bin} [Bin ${input.locationDisplay}].`;

    // 3. WHY was it flagged
    let why = '';
    if (input.discrepancyType === 'QUANTITY_MISMATCH') {
      why = `${input.expectedSku || 'Item'} was expected in ${input.locationDisplay} with ${input.expectedQuantity} units. Visual detection identified approximately ${input.observedQuantity} units. Discrepancy observed across ${input.persistenceCount} scan cycle(s). The system therefore prioritizes this as a ${input.riskLevel}-priority discrepancy.`;
    } else if (input.discrepancyType === 'MISSING_ITEM') {
      why = `${input.expectedSku || 'Item'} expected in ${input.locationDisplay}. Zero units detected within verified bin boundaries. High risk of stockout or misplaced stock.`;
    } else if (input.discrepancyType === 'WRONG_LOCATION') {
      why = `Expected SKU ${input.expectedSku || 'N/A'}, but detected packaging matches ${input.observedSku || 'misplaced item'}. Likely misplaced during manual pick/pack or inbound putaway.`;
    } else if (input.discrepancyType === 'LABEL_MISMATCH') {
      why = `Shelf tag specifies ${input.expectedSku}, but aerial image OCR detected "${input.observedSku}". Packaging or labeling misprint suspected.`;
    } else {
      why = `Observed state deviates from warehouse management system (WMS) ground-truth records.`;
    }

    // 4. EVIDENCE SUMMARY
    let evidenceSummary = `Aerial camera feed verified clear line-of-sight. `;
    if (input.persistenceCount > 1) {
      evidenceSummary += `Consistent anomaly confirmed across ${input.persistenceCount} consecutive flight passes from distinct viewpoints. `;
    } else {
      evidenceSummary += `Initial observation during current scan pass. `;
    }
    if (input.notes) {
      evidenceSummary += input.notes;
    }

    // 5. CONFIDENCE STATEMENT
    const confidenceStatement = `Prototype Confidence Score: ${input.confidenceOverall}% (Vision: ${(input.confidenceBreakdown.vision * 100).toFixed(0)}%, Spatial: ${(input.confidenceBreakdown.spatial * 100).toFixed(0)}%, Temporal: ${(input.confidenceBreakdown.temporal * 100).toFixed(0)}%).`;

    // 6. RECOMMENDED ACTION
    let recommendedAction = '';
    switch (input.discrepancyType) {
      case 'QUANTITY_MISMATCH':
        recommendedAction = `Perform physical count on Bin ${input.locationDisplay}. Check pick cart log and pending order queues for unposted inventory movements.`;
        break;
      case 'MISSING_ITEM':
        recommendedAction = `Immediate floor audit. Check adjacent bins and inbound buffer lanes. Query ERP for uncommitted work-in-progress transfers.`;
        break;
      case 'WRONG_LOCATION':
        recommendedAction = `Relocate misplaced items back to their assigned home rack. Scan item barcode with mobile terminal to reconcile inventory ledger.`;
        break;
      case 'LABEL_MISMATCH':
        recommendedAction = `Inspect carton stickers. Re-label with verified SKU barcode or quarantine batch for quality inspection.`;
        break;
      default:
        recommendedAction = `Dispatch warehouse floor lead for manual tablet verification.`;
    }

    return {
      what,
      where,
      why,
      evidenceSummary,
      confidenceStatement,
      recommendedAction,
    };
  }
}
