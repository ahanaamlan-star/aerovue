/**
 * AEROVUE RISK & RELIABILITY DATA REPOSITORY
 *
 * Ground truth technical risk register (R-01 through R-10),
 * system failsafe state machines, and competition presentation architecture definitions.
 *
 * Core Engineering Mandate:
 * "The system must never silently convert uncertain observations into confirmed discrepancies."
 */

import { TechnicalRiskItem, ArchitectureNode } from '../types';

export const TECHNICAL_RISK_REGISTER: TechnicalRiskItem[] = [
  {
    riskId: 'R-01',
    risk: 'Low-confidence detection',
    category: 'PERCEPTION',
    probability: 'Medium',
    impact: 'High',
    riskLevel: 'HIGH',
    mitigation:
      'Confidence scoring thresholds enforce human verification routing when overall confidence is below 85%. Multi-epoch temporal accumulation elevates confidence on repeated identical views.',
    fallback:
      'Automated write-off locked. Finding flagged for operator visual inspection.',
    status: 'MITIGATED',
    failsafeRule: 'If confidence is low (< 85%)',
    failsafeAction: 'FLAG',
  },
  {
    riskId: 'R-02',
    risk: 'Occlusion',
    category: 'OPTICAL',
    probability: 'Medium',
    impact: 'High',
    riskLevel: 'HIGH',
    mitigation:
      'Multi-view flight trajectories sweep bays from alternating 15° oblique angles. Volumetric shelf occupancy bounds prevent false zero-count assertions.',
    fallback:
      'Flag bay as partially occluded; dispatch human warehouse clerk or order re-flight.',
    status: 'MITIGATED',
    failsafeRule: 'If detection fails due to optical obstruction',
    failsafeAction: 'RE_SCAN',
  },
  {
    riskId: 'R-03',
    risk: 'Motion blur',
    category: 'AVIONICS',
    probability: 'Medium',
    impact: 'Medium',
    riskLevel: 'MEDIUM',
    mitigation:
      'Waypoint controller restricts scanning velocity to <= 1.0 m/s with 0.4s hover-stabilize pauses prior to camera trigger. Fast electronic shutter (1/1000s).',
    fallback:
      'Blur detector filters out degraded frames; triggers automatic waypoint hover re-capture.',
    status: 'MITIGATED',
    failsafeRule: 'If frame gradient sharpness falls below blur threshold',
    failsafeAction: 'RE_SCAN',
  },
  {
    riskId: 'R-04',
    risk: 'Poor lighting',
    category: 'OPTICAL',
    probability: 'Low',
    impact: 'High',
    riskLevel: 'MEDIUM',
    mitigation:
      'Histogram dynamic range evaluation detects under-illuminated aisles (< 100 lux). Preprocessing applies adaptive CLAHE contrast normalization.',
    fallback:
      'Issue low-illumination optical alert; recommend auxiliary LED illumination flight sweep.',
    status: 'ACTIVE',
    failsafeRule: 'If lighting contrast degrades segmentation certainty',
    failsafeAction: 'FLAG',
  },
  {
    riskId: 'R-05',
    risk: 'Wrong inventory data',
    category: 'LOGISTICS',
    probability: 'Medium',
    impact: 'Critical',
    riskLevel: 'CRITICAL',
    mitigation:
      'WMS data validation layer checks for negative balances, missing SKU dimensions, and timestamps. Discrepancy engine decouples physical observation from ledger.',
    fallback:
      'Quarantine inventory record with WMS_INCONSISTENCY tag; isolate record for supervisor review.',
    status: 'ACTIVE',
    failsafeRule: 'If WMS database ledger data is inconsistent with physical observations',
    failsafeAction: 'REVIEW',
  },
  {
    riskId: 'R-06',
    risk: 'GPS uncertainty',
    category: 'AVIONICS',
    probability: 'High',
    impact: 'Critical',
    riskLevel: 'CRITICAL',
    mitigation:
      'Indoor warehouse navigation relies on optical fiducial AprilTags and Visual Inertial Odometry (VIO) rather than satellite GPS. RTK-GPS anchors at warehouse perimeter only.',
    fallback:
      'Immediate hover hold; switch to dead-reckoning ceiling fiducial grid and land if drift > 0.5m.',
    status: 'ACTIVE',
    failsafeRule: 'If spatial localization uncertainty exceeds safety boundary',
    failsafeAction: 'SAFE_STATE',
  },
  {
    riskId: 'R-07',
    risk: 'Camera calibration error',
    category: 'OPTICAL',
    probability: 'Low',
    impact: 'Medium',
    riskLevel: 'LOW',
    mitigation:
      'Pre-flight dock calibration target verifies camera focal length, principal point, and radial distortion coefficients against factory matrix.',
    fallback:
      'Apply software homography compensation; lock 3D metric bounding box calculation if residual error > 2px.',
    status: 'MITIGATED',
    failsafeRule: 'If optical distortion residual exceeds calibration envelope',
    failsafeAction: 'FLAG',
  },
  {
    riskId: 'R-08',
    risk: 'Communication loss',
    category: 'AVIONICS',
    probability: 'Low',
    impact: 'Critical',
    riskLevel: 'CRITICAL',
    mitigation:
      'Dual-band 5.8 GHz telemetry with heartbeat ping every 200ms. Onboard edge processor caches full mission flight plan and conducts autonomous local inference.',
    fallback:
      'PX4 failsafe auto-initiates 5-second hover timeout, climbs to ceiling transit clearance (4.5m), and executes Return-to-Dock (RTH).',
    status: 'MITIGATED',
    failsafeRule: 'If wireless communication heartbeat is interrupted for > 3.0 seconds',
    failsafeAction: 'SAFE_STATE',
  },
  {
    riskId: 'R-09',
    risk: 'UAV battery limitation',
    category: 'AVIONICS',
    probability: 'Medium',
    impact: 'High',
    riskLevel: 'HIGH',
    mitigation:
      'Dynamic battery reserve calculator calculates distance to dock and continuously enforces 25% minimum return threshold. Automated battery health monitoring.',
    fallback:
      'Interrupt scan sequence; compute shortest path return to dock; trigger dock recharge cycle.',
    status: 'MITIGATED',
    failsafeRule: 'If battery percentage falls below calculated return reserve threshold',
    failsafeAction: 'SAFE_STATE',
  },
  {
    riskId: 'R-10',
    risk: 'Processing latency',
    category: 'COMPUTE',
    probability: 'Medium',
    impact: 'Low',
    riskLevel: 'LOW',
    mitigation:
      'TensorRT FP16 model quantization and asynchronous multithreaded frame pipelining achieve 73ms inference. Frame ring buffer prevents backlog.',
    fallback:
      'Drop non-critical auxiliary visualization frames while preserving full-resolution primary scan capture.',
    status: 'MITIGATED',
    failsafeRule: 'If frame inference pipeline latency spikes > 250ms',
    failsafeAction: 'FLAG',
  },
];

export const SYSTEM_ARCHITECTURE_PIPELINE: ArchitectureNode[] = [
  {
    id: 'NODE-1',
    title: 'UAV / SIMULATION',
    subtitle: 'Physical Drone or Simulated SITL',
    stepNumber: 1,
    type: 'INPUT',
    hardwareState: 'CURRENT_SIMULATION',
    description:
      'Autonomously flies warehouse inspection sweeps. Currently simulated via PX4/SITL with replaceable UAV interfaces ready for physical drones.',
    interfacesUsed: ['ImageSource', 'TelemetrySource', 'MissionController'],
  },
  {
    id: 'NODE-2',
    title: 'IMAGE + TELEMETRY',
    subtitle: 'Synchronized Sensory Payloads',
    stepNumber: 2,
    type: 'INPUT',
    hardwareState: 'CURRENT_SIMULATION',
    description:
      'Captures 4K optical frames paired with millisecond telemetry (lat, lon, altitude, gimbal pitch/yaw, speed, battery).',
    interfacesUsed: ['ImageFramePayload', 'TelemetryData'],
  },
  {
    id: 'NODE-3',
    title: 'AEROVUE INGESTION',
    subtitle: 'Multi-Source Adapter Layer',
    stepNumber: 3,
    type: 'PROCESSING',
    hardwareState: 'ACTIVE_SOFTWARE',
    description:
      'Decouples physical sensors from intelligence algorithms. Normalizes uploaded images, synthetic simulator feeds, and RTSP streams.',
    interfacesUsed: ['UploadedImageSource', 'SimulationImageSource', 'UAVCameraSource'],
  },
  {
    id: 'NODE-4',
    title: 'PERCEPTION ENGINE',
    subtitle: 'Object Detection & OCR Segmentation',
    stepNumber: 4,
    type: 'PROCESSING',
    hardwareState: 'ACTIVE_SOFTWARE',
    description:
      'Executes neural bounding box detection, SKU classification, 1D/2D barcode parsing, and raw visual feature extraction.',
    interfacesUsed: ['PerceptionEngine', 'DetectedObject'],
  },
  {
    id: 'NODE-5',
    title: 'SPATIAL CORRELATION',
    subtitle: 'Digital-Twin Bay Mapping',
    stepNumber: 5,
    type: 'REASONING',
    hardwareState: 'ACTIVE_SOFTWARE',
    description:
      'Projects 2D image coordinates into 3D warehouse rack grid coordinates [Zone, Rack, Shelf, Bin] using optical camera frustum math.',
    interfacesUsed: ['SpatialOccupancyModel', 'WarehouseBin'],
  },
  {
    id: 'NODE-6',
    title: 'DISCREPANCY ENGINE',
    subtitle: 'A.U.D.I.T. Variance Reasoner',
    stepNumber: 6,
    type: 'REASONING',
    hardwareState: 'ACTIVE_SOFTWARE',
    description:
      'Cross-examines observed inventory against WMS enterprise ledger across 8 discrete variance archetypes (Missing, Quantity, Wrong Location, etc.).',
    interfacesUsed: ['DiscrepancyEngine', 'InventoryProvider', 'DiscrepancyRecord'],
  },
  {
    id: 'NODE-7',
    title: 'CONFIDENCE + RISK',
    subtitle: 'Multi-Factor Assessment Engines',
    stepNumber: 7,
    type: 'REASONING',
    hardwareState: 'ACTIVE_SOFTWARE',
    description:
      'Synthesizes Prototype Confidence Score (Vision + Spatial + Temporal) and evaluates operational Risk Score based on SKU unit value and shortage severity.',
    interfacesUsed: ['ConfidenceWeightConfig', 'RiskEngine'],
  },
  {
    id: 'NODE-8',
    title: 'EXPLAINABLE INTELLIGENCE',
    subtitle: 'Audit Evidence & Temporal Timeline',
    stepNumber: 8,
    type: 'OUTPUT',
    hardwareState: 'ACTIVE_SOFTWARE',
    description:
      'Generates natural language evidence chains, multi-epoch persistence scoring, and explicit failure boundary disclosures.',
    interfacesUsed: ['LocationTimeline', 'TemporalReasoningEngine'],
  },
  {
    id: 'NODE-9',
    title: 'OPERATOR',
    subtitle: 'Human-in-the-Loop Mission Control',
    stepNumber: 9,
    type: 'OUTPUT',
    hardwareState: 'ACTIVE_SOFTWARE',
    description:
      'Warehouse supervisor or flight commander reviews flagged variances, confirms ledger reconciliation, or orders targeted drone re-flights.',
    interfacesUsed: ['ScanAnalysisWorkspace', 'VerificationStatus'],
  },
];
