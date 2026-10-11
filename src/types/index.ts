/**
 * AEROVUE: AI-Powered Aerial Discrepancy Intelligence
 * Core Type Definitions & Domain Models
 */

export type DiscrepancyType =
  | 'QUANTITY_MISMATCH'
  | 'MISSING_ITEM'
  | 'UNEXPECTED_ITEM'
  | 'WRONG_LOCATION'
  | 'MISPLACED_INVENTORY'
  | 'LABEL_MISMATCH'
  | 'PERSISTENT_DISCREPANCY'
  | 'NO_DISCREPANCY';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type VerificationStatus =
  | 'PENDING_REVIEW'
  | 'CONFIRMED'
  | 'DISMISSED_FALSE_POSITIVE'
  | 'REFLIGHT_REQUESTED';

export type TemporalLifecycle = 'NEW' | 'INTERMITTENT' | 'PERSISTENT' | 'RESOLVED';

export type ItemCriticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'MISSION_CRITICAL';

export interface BoundingBox {
  x: number; // percentage [0, 100] or absolute px
  y: number;
  width: number;
  height: number;
}

export interface DetectedObject {
  id: string;
  label: string;
  sku: string;
  confidence: number; // 0.0 - 1.0
  box: BoundingBox;
  visualFeatures?: {
    estimatedCount?: number;
    colorPattern?: string;
    ocrText?: string;
    barcodeRaw?: string;
  };
}

export interface InventoryItem {
  sku: string;
  name: string;
  category: string;
  expectedQuantity: number;
  location: {
    warehouse: string;
    zone: string;
    rack: string;
    shelf: number;
    bin: string;
  };
  criticality: ItemCriticality;
  unitValueUsd: number;
  reorderThreshold: number;
  lastAuditedAt?: string;
}

export interface WarehouseBin {
  id: string; // e.g., 'WH01-ZA-RA01-S1-B01'
  displayCode: string; // 'A01-01'
  zone: string;
  rack: string;
  shelf: number;
  binNumber: string;
  expectedSku: string | null;
  expectedQty: number;
  observedSku: string | null;
  observedQty: number;
  currentStatus: 'NORMAL' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL';
  activeDiscrepancyId?: string;
  spatialRegion: {
    normalizedX: number;
    normalizedY: number;
    normalizedW: number;
    normalizedH: number;
  };
}

export interface DiscrepancyRecord {
  id: string;
  discrepancyId: string; // Alias for id
  scanId: string;
  timestamp: string;
  zone: string;
  rack: string;
  shelf: number;
  bin: string;
  sku: string;
  expectedValue: number;
  observedValue: number;
  difference: number;
  type: DiscrepancyType;
  visionConfidence: number;
  spatialConfidence: number;
  temporalScore: number;
  severity: number;
  riskScore: number;
  status: string;
  requiresHumanVerification: boolean;
  location: {
    warehouse: string;
    zone: string;
    rack: string;
    shelf: number;
    bin: string;
    binDisplay: string;
  };
  expectedSku: string | null;
  observedSku: string | null;
  expectedQuantity: number;
  observedQuantity: number;
  quantityDelta: number;
  discrepancyType: DiscrepancyType;
  confidence: {
    overall: number; // 0 - 100
    visionConfidence: number;
    spatialConfidence: number;
    temporalConfidence: number;
    weights: {
      vision: number;
      spatial: number;
      temporal: number;
    };
  };
  risk: {
    level: RiskLevel;
    score: number; // 0 - 100
    severityFactor: number;
    persistenceFactor: number;
  };
  persistence: {
    scanCount: number; // consecutive scans with discrepancy
    firstObservedAt: string;
    historyScanIds: string[];
    isPersistent: boolean;
    persistenceScore?: number;
    lifecycleState?: TemporalLifecycle;
  };
  temporalLifecycle?: TemporalLifecycle;
  persistenceScore?: number;
  persistenceExplanation?: string;
  persistenceDisclaimer?: string;
  evidence: {
    imageSrc: string;
    sourceFrameId: string;
    cameraAltitudeM: number;
    gimbalAngleDeg: number;
    detectedBoxes: DetectedObject[];
    expectedRegionBox: BoundingBox;
    notes?: string;
  };
  explanation: {
    what: string;
    where: string;
    why: string;
    evidenceSummary: string;
    confidenceStatement: string;
    recommendedAction: string;
  };
  verification: {
    status: VerificationStatus;
    verifiedBy?: string;
    verifiedAt?: string;
    notes?: string;
  };
}

/**
 * Historical individual scan observation item record
 */
export interface HistoricalScanRecord {
  id: string;
  scanId: string;
  timestamp: string;
  location: {
    warehouse: string;
    zone: string;
    rack: string;
    shelf: number;
    bin: string;
    binDisplay: string;
  };
  sku: string;
  expected: number;
  observed: number;
  delta: number;
  discrepancy: string;
  confidence: number; // 0 - 100
  risk: RiskLevel;
  status: string;
  lifecycleState: TemporalLifecycle;
}

/**
 * An individual epoch observation on a location timeline
 */
export interface TimelineEpoch {
  epochId: string;
  scanId: string;
  timestamp: string;
  timeLabel: string; // e.g. '14:10', '15:20', '16:30', '17:40', '18:50'
  status: string; // 'NORMAL' | 'QUANTITY MISMATCH' | 'MISSING ITEM' | 'PERSISTENT' | 'RESOLVED'
  lifecycleState: TemporalLifecycle;
  expected: number;
  observed: number;
  delta: number;
  confidence: number;
  notes: string;
}

/**
 * Longitudinal temporal timeline across epochs for a specific warehouse location
 */
export interface LocationTimeline {
  binDisplay: string;
  location: {
    warehouse: string;
    zone: string;
    rack: string;
    shelf: number;
    bin: string;
    binDisplay: string;
  };
  sku: string;
  productName: string;
  currentLifecycle: TemporalLifecycle;
  consecutiveScanCount: number;
  persistenceScore: number; // 0 - 100 Prototype Persistence Score
  epochs: TimelineEpoch[];
  explanation: string;
  disclaimer: string;
}

export interface ScanSession {
  id: string;
  warehouseId: string;
  timestamp: string;
  triggerType: 'AUTONOMOUS_SCHEDULED' | 'MANUAL_MISSION' | 'SIMULATION_CYCLE' | 'USER_UPLOAD';
  uavId: string;
  totalBinsScanned: number;
  totalItemsScanned: number;
  discrepanciesFound: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  coveragePercentage: number;
  averageConfidence: number;
  flightDurationSeconds: number;
  imageCount: number;
}

export interface UAVTelemetry {
  droneId: string;
  status: 'ARMED_FLYING' | 'HOVERING_INSPECTING' | 'RETURNING_TO_DOCK' | 'IDLE_CHARGING';
  batteryPercentage: number;
  altitudeMeters: number;
  groundSpeedMs: number;
  gimbalPitchDegrees: number;
  gimbalYawDegrees: number;
  cameraFovDeg: number;
  coordinates: {
    x: number; // local warehouse grid meters
    y: number;
    z: number;
  };
  currentWaypointIndex: number;
  totalWaypoints: number;
  headingDegrees: number;
}

export interface ConfidenceWeightConfig {
  visionWeight: number; // e.g. 0.45
  spatialWeight: number; // e.g. 0.35
  temporalWeight: number; // e.g. 0.20
}

export type SimulationScenarioPreset =
  | 'NORMAL'
  | 'MISSING'
  | 'QUANTITY_MISMATCH'
  | 'WRONG_LOCATION'
  | 'UNEXPECTED_ITEM'
  | 'PERSISTENT'
  | 'CUSTOM';

export interface SimulationParams {
  warehouseName: string;
  rackCount: number;
  skusPerRack: number;
  binsPerRack?: number;
  discrepancyRatePct: number; // 0 - 50%
  cameraAltitudeM: number; // 2.0 - 7.0m
  cameraFovDeg: number; // 60 - 110 deg
  flightSpeedMs?: number; // 0.4 - 2.5 m/s
  scanDensity?: 'LOW' | 'STANDARD' | 'HIGH';
  scenarioPreset?: SimulationScenarioPreset;
  faults: {
    missingItems: boolean;
    unexpectedItems: boolean;
    wrongLocation: boolean;
    quantityMismatch: boolean;
    labelMismatch: boolean;
    persistentDiscrepancy?: boolean;
  };
}

/**
 * UAV Mission Planner Domain Types
 */
export type MissionState = 'PLANNED' | 'READY' | 'SIMULATING' | 'COMPLETE' | 'ABORTED';

export interface MissionWaypointNode {
  id: string;
  type: 'START' | 'WAYPOINT' | 'RETURN';
  index: number;
  label: string;
  coordinates: { x: number; y: number; z: number };
  targetZone: string;
  targetRack?: string;
  action: 'TAKEOFF' | 'SCAN_BAY' | 'TURN' | 'LAND' | 'HOVER_CAPTURE';
  cameraFootprint: {
    widthM: number;
    depthM: number;
    areaM2: number;
  };
  status: 'PENDING' | 'ACTIVE' | 'VISITED';
}

export interface MissionFlightPlan {
  missionId: string;
  missionName: string;
  state: MissionState;
  createdAt: string;
  warehouseBoundary: {
    lengthM: number;
    widthM: number;
    heightM: number;
    totalAreaM2: number;
  };
  inspectionZone: string;
  startingPoint: {
    name: string;
    x: number;
    y: number;
    z: number;
  };
  altitudeMeters: number;
  cameraFovDeg: number;
  desiredCoveragePct: number;
  flightSpeedMs: number;
  metrics: {
    totalDistanceMeters: number;
    estimatedFlightDurationSeconds: number;
    coveragePercentage: number;
    numberOfWaypoints: number;
    estimatedScanAreaM2: number;
  };
  waypoints: MissionWaypointNode[];
}

/**
 * AEROVUE Validation Center Types
 */
export type ValidationTestStatus = 'PASS' | 'FAIL' | 'REVIEW';

export interface ValidationTestCase {
  testId: string; // 'TEST-001' through 'TEST-010'
  scenario: string;
  category: 'NOMINAL' | 'DISCREPANCY_REASONING' | 'EDGE_CONDITION' | 'INTEGRATION';
  input: string;
  expectedResult: string;
  observedResult: string;
  status: ValidationTestStatus;
  notes: string;
  timestamp: string;
  // Performance telemetry
  detectionCount: number | null;
  discrepancyCount: number | null;
  confidenceScore: number | null; // Prototype confidence score
  processingLatencyMs: number | null;
  coveragePct: number | null;
  falsePositives: number | null;
  falseNegatives: number | null;
  isSimulation: boolean;
  hardwarePlatform?: string;
}

export interface ValidationPerformanceSummary {
  totalDetectionCount: number;
  totalDiscrepancyCount: number;
  averageConfidence: number;
  averageLatencyMs: number;
  averageCoveragePct: number;
  totalFalsePositives: number;
  totalFalseNegatives: number;
  isSimulation: boolean;
  fieldValidationStatus: 'NOT_YET_VALIDATED' | 'BENCHMARKED';
}

export interface KnownLimitation {
  id: string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  observedFailureMode: string;
  prototypeMitigation: string;
  roadmapNextStep: string;
  engineeringImpact: string;
}

/**
 * AEROVUE Risk & Reliability Domain Types
 */
export type RiskProbability = 'LOW' | 'MEDIUM' | 'HIGH' | 'Low' | 'Medium' | 'High';
export type RiskImpact = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'Low' | 'Medium' | 'High' | 'Critical';
export type TechnicalRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FailsafeAction = 'FLAG' | 'REVIEW' | 'SAFE_STATE' | 'RE_SCAN';

export interface TechnicalRiskItem {
  riskId: string; // 'R-01' through 'R-10'
  risk: string;
  category: 'PERCEPTION' | 'OPTICAL' | 'LOGISTICS' | 'AVIONICS' | 'COMPUTE';
  probability: RiskProbability;
  impact: RiskImpact;
  riskLevel: TechnicalRiskLevel;
  mitigation: string;
  fallback: string;
  status: 'ACTIVE' | 'MITIGATED' | 'CRITICAL';
  failsafeRule: string;
  failsafeAction: FailsafeAction;
}

export interface TelemetryDataPoint {
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
  battery: number;
  timestamp: string;
}

export interface ArchitectureNode {
  id: string;
  title: string;
  subtitle: string;
  stepNumber: number;
  type: 'INPUT' | 'PROCESSING' | 'REASONING' | 'OUTPUT';
  hardwareState: 'CURRENT_SIMULATION' | 'FUTURE_HARDWARE' | 'ACTIVE_SOFTWARE';
  description: string;
  interfacesUsed: string[];
}

