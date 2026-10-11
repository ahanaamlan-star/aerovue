/**
 * AEROVUE Validation Center Mock Data & Empirical Test Bench
 *
 * Ground truth test cases (TEST-001 through TEST-010),
 * simulated performance metrics, and documented engineering failure modes.
 *
 * Systemic Discipline:
 * - Real experimental records from simulation harness.
 * - Explicit SIMULATION labeling.
 * - Explicit NOT YET VALIDATED indicators where hardware testing is pending.
 * - Frank disclosure of failure cases and edge degradation.
 */

import {
  ValidationTestCase,
  ValidationPerformanceSummary,
  KnownLimitation,
} from '../types';

export const INITIAL_VALIDATION_TEST_CASES: ValidationTestCase[] = [
  {
    testId: 'TEST-001',
    scenario: 'Normal inventory',
    category: 'NOMINAL',
    input:
      'Synthetic 4K aerial frame over Rack A01-01. Nominal warehouse lighting (550 lux). 6 units SKU-A101 expected in ledger. Camera nadir (0° gimbal pitch, 3.5m altitude).',
    expectedResult:
      'Detect 6 units of SKU-A101. Reconcile with WMS ledger. Zero discrepancy flagged. Confidence score > 85%.',
    observedResult:
      'Detected 6 bounding boxes with 92% average vision confidence. Reconciled with ledger. Classified as NO_DISCREPANCY. Prototype Confidence: 91%.',
    status: 'PASS',
    notes:
      'Nominal baseline verified under controlled conditions. High contrast packaging against matte shelf liner aids segmentation accuracy.',
    timestamp: '2026-10-05 08:15:22',
    detectionCount: 6,
    discrepancyCount: 0,
    confidenceScore: 91,
    processingLatencyMs: 64,
    coveragePct: 100,
    falsePositives: 0,
    falseNegatives: 0,
    isSimulation: true,
    hardwarePlatform: 'Simulated Jetson AGX Orin (FP16 TensorRT)',
  },
  {
    testId: 'TEST-002',
    scenario: 'Missing item',
    category: 'DISCREPANCY_REASONING',
    input:
      'Synthetic aerial frame over Rack A01-02. 4 units of SKU-A102 expected in ledger. Physical slot completely vacant in optical view. 3.5m altitude, 84° FOV.',
    expectedResult:
      'Detect 0 units. Compare with ledger expected 4 units. Flag MISSING_ITEM with delta -4. Assign HIGH risk due to $450 unit value.',
    observedResult:
      'Detected 0 units. Visual evidence corroborated slot vacancy. Classified as MISSING_ITEM (Delta: -4). Prototype Confidence: 94%. Risk: HIGH.',
    status: 'PASS',
    notes:
      'Spatial occupancy logic confirms empty shelf boundary. Correctly suppresses false object hallucinations in vacant slots.',
    timestamp: '2026-10-05 08:18:40',
    detectionCount: 0,
    discrepancyCount: 1,
    confidenceScore: 94,
    processingLatencyMs: 58,
    coveragePct: 100,
    falsePositives: 0,
    falseNegatives: 0,
    isSimulation: true,
    hardwarePlatform: 'Simulated Jetson AGX Orin (FP16 TensorRT)',
  },
  {
    testId: 'TEST-003',
    scenario: 'Quantity mismatch',
    category: 'DISCREPANCY_REASONING',
    input:
      'Synthetic aerial frame over Rack B01-01. 12 units of SKU-B201 expected in ledger. Physical stack contains only 8 boxes in single-tier formation.',
    expectedResult:
      'Segment 8 individual units. Compute discrepancy delta (-4 units). Classify as QUANTITY_MISMATCH.',
    observedResult:
      'Segmented 8 bounding boxes. Delta: -4. Classified as QUANTITY_MISMATCH. Prototype Confidence: 89%. Risk: MEDIUM.',
    status: 'PASS',
    notes:
      'Single-layer arrangement avoided internal occlusion. For multi-layer pallets, system relies on volumetric bounding extrapolation.',
    timestamp: '2026-10-05 08:22:15',
    detectionCount: 8,
    discrepancyCount: 1,
    confidenceScore: 89,
    processingLatencyMs: 72,
    coveragePct: 98,
    falsePositives: 0,
    falseNegatives: 0,
    isSimulation: true,
    hardwarePlatform: 'Simulated Jetson AGX Orin (FP16 TensorRT)',
  },
  {
    testId: 'TEST-004',
    scenario: 'Wrong location',
    category: 'DISCREPANCY_REASONING',
    input:
      'Synthetic aerial frame over Rack A02-01 (Zone A). SKU-C301 observed in bin; ledger assigns SKU-C301 exclusively to Zone C (Dock staging).',
    expectedResult:
      'Identify SKU-C301 package profile. Cross-reference master catalog home location. Flag WRONG_LOCATION and suggest home zone Rack C01.',
    observedResult:
      'Detected SKU-C301 in Rack A02-01. Spatial correlation engine matched catalog ID and flagged WRONG_LOCATION. Prototype Confidence: 88%. Risk: MEDIUM.',
    status: 'PASS',
    notes:
      'Correctly decoupled visual classification from local bin ledger, looking up global master catalog location.',
    timestamp: '2026-10-05 08:26:50',
    detectionCount: 2,
    discrepancyCount: 1,
    confidenceScore: 88,
    processingLatencyMs: 79,
    coveragePct: 100,
    falsePositives: 0,
    falseNegatives: 0,
    isSimulation: true,
    hardwarePlatform: 'Simulated Jetson AGX Orin (FP16 TensorRT)',
  },
  {
    testId: 'TEST-005',
    scenario: 'Unexpected item',
    category: 'DISCREPANCY_REASONING',
    input:
      'Synthetic aerial frame over Rack B02-02. Bin designated as EMPTY in WMS ledger. Physical view contains 3 unlabeled cardboard boxes.',
    expectedResult:
      'Detect extraneous objects. Compare against 0 expected units. Flag UNEXPECTED_ITEM. Recommend operator physical inspection.',
    observedResult:
      'Detected 3 objects with generic carton class. Flagged UNEXPECTED_ITEM (Delta: +3). Recommended physical check. Prototype Confidence: 82%. Risk: MEDIUM.',
    status: 'PASS',
    notes:
      'System generated bounding boxes despite missing SKU barcode metadata, classifying objects as foreign inventory.',
    timestamp: '2026-10-05 08:31:05',
    detectionCount: 3,
    discrepancyCount: 1,
    confidenceScore: 82,
    processingLatencyMs: 76,
    coveragePct: 100,
    falsePositives: 0,
    falseNegatives: 0,
    isSimulation: true,
    hardwarePlatform: 'Simulated Jetson AGX Orin (FP16 TensorRT)',
  },
  {
    testId: 'TEST-006',
    scenario: 'Occlusion',
    category: 'EDGE_CONDITION',
    input:
      'Synthetic aerial frame over Rack A01-03. Structural rack upright and hanging stretch-wrap film obstruct 35% of front carton faces.',
    expectedResult:
      'Detect visible cartons without hallucinating obscured units. If occlusion obscures key SKU features, penalize confidence and flag for operator review.',
    observedResult:
      'Detected 3 fully visible units with 86% confidence. 2 occluded units caused confidence to degrade to 61%. Overall confidence 64% dropped below 85% threshold, triggering REQUIRES_HUMAN_VERIFICATION.',
    status: 'REVIEW',
    notes:
      'System degraded gracefully: rather than falsely asserting a complete count, it dropped confidence and recommended human review. Operator confirmation pending.',
    timestamp: '2026-10-05 08:36:12',
    detectionCount: 3,
    discrepancyCount: 1,
    confidenceScore: 64,
    processingLatencyMs: 88,
    coveragePct: 75,
    falsePositives: 1,
    falseNegatives: 1,
    isSimulation: true,
    hardwarePlatform: 'Simulated Jetson AGX Orin (FP16 TensorRT)',
  },
  {
    testId: 'TEST-007',
    scenario: 'Low lighting',
    category: 'EDGE_CONDITION',
    input:
      'Synthetic aerial frame over Rack C01-03. Simulated power conservation lighting (~35 lux vs 500 lux nominal). High image noise and shadow depth.',
    expectedResult:
      'Identify optical degradation. Apply low-light preprocessing or issue sensor illumination warning. Avoid confident false deductions.',
    observedResult:
      'Detector missed 1 dark-colored unit on bottom shelf (False Negative). Vision confidence dropped to 52%. System generated optical warning and recommended re-flight with auxiliary illumination.',
    status: 'FAIL',
    notes:
      'Observed Failure Case: Low contrast resulted in missed unit. This failure is documented honestly. Current mitigation: system flagged low confidence and requested re-flight.',
    timestamp: '2026-10-05 08:41:48',
    detectionCount: 2,
    discrepancyCount: 1,
    confidenceScore: 52,
    processingLatencyMs: 95,
    coveragePct: 82,
    falsePositives: 0,
    falseNegatives: 1,
    isSimulation: true,
    hardwarePlatform: 'Simulated Jetson AGX Orin (FP16 TensorRT)',
  },
  {
    testId: 'TEST-008',
    scenario: 'Repeated discrepancy',
    category: 'DISCREPANCY_REASONING',
    input:
      'Longitudinal multi-scan data stream over Rack A01-02. Same missing-item discrepancy observed across 3 consecutive flight epochs (14:10, 15:20, 16:30).',
    expectedResult:
      'Correlate observations across time. Elevate discrepancy lifecycle from NEW to PERSISTENT. Escalate Prototype Persistence Score to >= 70%.',
    observedResult:
      'Temporal reasoning engine matched location key. Lifecycle updated to PERSISTENT. Persistence score calculated at 75%. Overall risk elevated. Prototype Confidence: 96%.',
    status: 'PASS',
    notes:
      'Temporal evidence accumulation verified. System clearly stated persistence is an indicator of repeated observation, not proof of root cause.',
    timestamp: '2026-10-05 08:46:30',
    detectionCount: 0,
    discrepancyCount: 1,
    confidenceScore: 96,
    processingLatencyMs: 51,
    coveragePct: 100,
    falsePositives: 0,
    falseNegatives: 0,
    isSimulation: true,
    hardwarePlatform: 'Simulated Jetson AGX Orin (FP16 TensorRT)',
  },
  {
    testId: 'TEST-009',
    scenario: 'Low-confidence detection',
    category: 'EDGE_CONDITION',
    input:
      'Synthetic aerial frame captured at steep oblique angle (55° pitch) and high altitude (6.5m). Small form-factor SKU-A103 connectors.',
    expectedResult:
      'Calculate prototype confidence score incorporating optical geometry penalties. If below threshold (< 70%), mandate human review before write-off.',
    observedResult:
      'Vision confidence scored 58%, spatial 71%, yielding Prototype Confidence 63%. System locked automated reconciliation and flagged REQUIRES_HUMAN_VERIFICATION.',
    status: 'PASS',
    notes:
      'Safety interlock passed. The prototype proved it prevents automated ledger corruptions when visual evidence lacks sufficient certainty.',
    timestamp: '2026-10-05 08:51:19',
    detectionCount: 4,
    discrepancyCount: 1,
    confidenceScore: 63,
    processingLatencyMs: 84,
    coveragePct: 88,
    falsePositives: 0,
    falseNegatives: 0,
    isSimulation: true,
    hardwarePlatform: 'Simulated Jetson AGX Orin (FP16 TensorRT)',
  },
  {
    testId: 'TEST-010',
    scenario: 'Incorrect inventory record',
    category: 'INTEGRATION',
    input:
      'Simulated WMS database synchronization defect. Ledger reports negative quantity (-2 units) and mismatched product SKU tag for Rack B01-02.',
    expectedResult:
      'Detect ledger anomaly during pre-flight correlation. Flag LABEL_MISMATCH / LEDGER_INCONSISTENCY. Prevent automated overwrite.',
    observedResult:
      'Detected visual barcode SKU-B202 with 4 units. Cross-checked with corrupt ledger. Flagged LABEL_MISMATCH and WMS_SYNCHRONIZATION_FAULT. Prototype Confidence: 87%.',
    status: 'PASS',
    notes:
      'Robustness test verified. System safely handles corrupt WMS inputs by isolating discrepancies rather than propagating database corruptions.',
    timestamp: '2026-10-05 08:57:04',
    detectionCount: 4,
    discrepancyCount: 1,
    confidenceScore: 87,
    processingLatencyMs: 67,
    coveragePct: 100,
    falsePositives: 0,
    falseNegatives: 0,
    isSimulation: true,
    hardwarePlatform: 'Simulated Jetson AGX Orin (FP16 TensorRT)',
  },
];

export const INITIAL_PERFORMANCE_SUMMARY: ValidationPerformanceSummary = {
  totalDetectionCount: 33,
  totalDiscrepancyCount: 8,
  averageConfidence: 81.4, // Mean across 10 simulation test runs
  averageLatencyMs: 73.8, // Mean latency on simulated Jetson TensorRT pipeline
  averageCoveragePct: 94.3, // Coverage across test scenarios
  totalFalsePositives: 1, // Observed in TEST-006 (Occlusion edge case)
  totalFalseNegatives: 2, // Observed in TEST-006 (Occlusion) & TEST-007 (Low lighting)
  isSimulation: true,
  fieldValidationStatus: 'NOT_YET_VALIDATED', // Explicitly stating real physical fleet tests are pending
};

export const KNOWN_LIMITATIONS: KnownLimitation[] = [
  {
    id: 'LIM-01',
    title: 'Occlusion',
    severity: 'HIGH',
    observedFailureMode:
      'Cartons stacked 2 or 3 deep on standard 1.2m warehouse pallet racks cannot be directly imaged from single nadir or oblique UAV viewpoints. Structural vertical rack pillars obstruct side labels.',
    prototypeMitigation:
      'Occluded boundary logic penalizes visual confidence score (< 70%) and triggers human verification workflow. Volumetric rack occupancy models provide coarse presence estimation.',
    roadmapNextStep:
      'Multi-angle oblique stereo sweeping and LiDAR depth point-cloud fusion to map multi-depth pallet volumes.',
    engineeringImpact:
      'Prototype cannot guarantee 100% item counts for deep multi-row pallet positions without physical de-stacking.',
  },
  {
    id: 'LIM-02',
    title: 'Motion Blur',
    severity: 'MEDIUM',
    observedFailureMode:
      'When UAV ground speed exceeds 1.4 m/s or during rapid yaw rotation maneuvers, optical frame edge sharpness degrades, reducing barcode readability and fine feature segmentation.',
    prototypeMitigation:
      'Mission planner enforces maximum 1.0 m/s transit speed during active scanning bays and introduces 0.5s hover-stabilize pauses prior to exposure trigger.',
    roadmapNextStep:
      'Global mechanical shutter camera payloads with flash LED strobe synchronization triggered via PX4 flight controller.',
    engineeringImpact:
      'Requires conservative flight speed envelopes, increasing total flight duration by approximately 22%.',
  },
  {
    id: 'LIM-03',
    title: 'Poor Lighting',
    severity: 'HIGH',
    observedFailureMode:
      'Warehouse bay sections with disabled overhead luminaires or high rack shadow casting (< 50 lux) yield high sensor ISO noise, clipping histogram dynamic range.',
    prototypeMitigation:
      'System detects low-contrast histograms, lowers vision confidence by up to 30%, flags optical warnings, and recommends manual re-flight with illumination.',
    roadmapNextStep:
      'Integrated high-CRI active LED illuminators on drone gimbal or onboard HDR multi-exposure bracketing.',
    engineeringImpact:
      'Low-light bays cannot achieve autonomous verification status and require human re-flight.',
  },
  {
    id: 'LIM-04',
    title: 'Small Objects',
    severity: 'MEDIUM',
    observedFailureMode:
      'Small aerospace sub-components (fasteners, fittings, connectors < 40mm) occupy fewer than 20x20 pixels when flying at safe standoff altitudes (> 3.5m).',
    prototypeMitigation:
      'Minimum bounding dimension filter classifies detections under 30px as indeterminate and routes to human operator rather than guessing.',
    roadmapNextStep:
      'Optical telephoto zoom secondary camera or specialized micro-drone inspection attachments for bin-level closeups.',
    engineeringImpact:
      'Current prototype is validated primarily for carton, bin, and pallet-level inventory rather than individual loose hardware.',
  },
  {
    id: 'LIM-05',
    title: 'Similar-Looking Objects',
    severity: 'MEDIUM',
    observedFailureMode:
      'Standardized industrial brown corrugated cartons with identical dimensions and only minor 1D/2D alphanumeric text variations produce visual confusion without clear barcode crops.',
    prototypeMitigation:
      'Fuses OCR text verification with spatial rack slot bounds; requires both visual barcode match and expected bay slot match.',
    roadmapNextStep:
      'Onboard high-speed 2D DataMatrix / QR decoder running in parallel with object segmentation pipeline.',
    engineeringImpact:
      'Cases with torn, rotated, or absent barcode labels require manual physical barcode scanning.',
  },
  {
    id: 'LIM-06',
    title: 'Camera Angle & Perspective Distortion',
    severity: 'LOW',
    observedFailureMode:
      'Steep oblique angles (> 50° off-nadir) cause geometric keystoning and vertical foreshortening, distorting bounding box aspect ratios and metric scale calculations.',
    prototypeMitigation:
      'Affine perspective rectification applied using UAV IMU gimbal pitch and yaw telemetry before running bounding box feature extraction.',
    roadmapNextStep:
      'Dense photogrammetric mesh generation and orthophoto projection across full warehouse aisles.',
    engineeringImpact:
      'Edge bays inspected at maximum oblique angles exhibit 6-10% lower spatial confidence scores.',
  },
  {
    id: 'LIM-07',
    title: 'Incomplete / Stale Inventory Records',
    severity: 'MEDIUM',
    observedFailureMode:
      'Enterprise WMS databases containing laggy batch updates, unrecorded bin transfers, or missing SKU master dimensions cause false discrepancy flags.',
    prototypeMitigation:
      'Discrepancy engine flags discrepancies with explicit "WMS Inconsistency" tag and provides audit log reconciliation tools rather than blindly updating ledger.',
    roadmapNextStep:
      'Bidirectional API webhooks with SAP/Manhattan WMS featuring transaction timestamp reconciliation.',
    engineeringImpact:
      'Visual observations can only detect physical state; true discrepancy resolution requires reconciling operational paperwork.',
  },
];
