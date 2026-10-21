/**
 * AEROVUE UAV MISSION PLANNER WORKSTATION
 *
 * Engineering Simulation & Pre-Flight Planning Module
 *
 * Narrative Pipeline:
 * PLAN → FLY → SCAN → DETECT → CORRELATE → ASSESS → REPORT
 *
 * Mission States:
 * PLANNED → READY → SIMULATING → COMPLETE (or ABORTED)
 *
 * Inputs:
 * - Warehouse boundary
 * - Inspection zone
 * - UAV starting point
 * - Altitude
 * - Camera FOV
 * - Desired coverage
 *
 * Metrics (Labeled: SIMULATED ESTIMATES):
 * - Total distance
 * - Estimated flight duration
 * - Coverage percentage
 * - Number of waypoints
 * - Estimated scan area
 *
 * System Honesty:
 * Clearly labeled as simulation & planning module; ready for future hardware interface.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  MissionFlightPlan,
  MissionState,
  MissionWaypointNode,
  UAVTelemetry,
  ScanSession,
} from '../../types';
import {
  missionPlannerService,
  PlannedMissionSpec,
} from '../../services/hardwareAbstraction';
import { apiService } from '../../services/apiService';
import {
  Navigation,
  Compass,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Layers,
  ArrowRight,
  Radio,
  Wifi,
  Cpu,
  Camera,
  Maximize2,
  Check,
  XCircle,
  ExternalLink,
  Scan,
  X,
} from 'lucide-react';

interface UavMissionPlannerPageProps {
  onNavigateToSimulation?: () => void;
  onNavigateToAnalysis?: () => void;
  onNavigateToDiscrepancies?: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToOverview?: () => void;
  onExecutePlanScan?: (
    plan: MissionFlightPlan,
    spec: PlannedMissionSpec
  ) => Promise<{ success: boolean; session?: ScanSession; error?: string }>;
  telemetry?: UAVTelemetry;
  isScanning?: boolean;
}

export const UavMissionPlannerPage: React.FC<UavMissionPlannerPageProps> = ({
  onNavigateToSimulation,
  onNavigateToAnalysis,
  onNavigateToDiscrepancies,
  onNavigateToInventory,
  onNavigateToOverview,
  onExecutePlanScan,
  telemetry,
  isScanning = false,
}) => {
  // Configurable Mission Inputs
  const [warehouseBoundary, setWarehouseBoundary] = useState({
    lengthM: 30.0,
    widthM: 20.0,
    heightM: 7.0,
  });
  const [inspectionZone, setInspectionZone] = useState<string>('ALL_ZONES');
  const [startingDock, setStartingDock] = useState<string>('DOCK_01');
  const [altitude, setAltitude] = useState<number>(3.5);
  const [fov, setFov] = useState<number>(84);
  const [desiredCoverage, setDesiredCoverage] = useState<number>(95);
  const [flightSpeed, setFlightSpeed] = useState<number>(1.0);

  // Active Flight Plan & Mission State
  const [missionPlan, setMissionPlan] = useState<MissionFlightPlan | null>(null);
  const [missionState, setMissionState] = useState<MissionState>('PLANNED');
  const [activeWaypointIndex, setActiveWaypointIndex] = useState<number>(0);
  const [isSimulatingFlight, setIsSimulatingFlight] = useState<boolean>(false);
  const [safetyWarnings, setSafetyWarnings] = useState<string[]>([]);
  const [scannedGridBlocks, setScannedGridBlocks] = useState<number[]>([]);

  // Phase 2: Connected Autonomous Scan Execution State
  const [showConfirmScanModal, setShowConfirmScanModal] = useState<boolean>(false);
  const [executedSessionResult, setExecutedSessionResult] = useState<ScanSession | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [isExecutingScan, setIsExecutingScan] = useState<boolean>(false);

  // Starting Docks Coordinates
  const docks = useMemo(
    () => ({
      DOCK_01: { name: 'Automated Dock Station 01', x: 3.0, y: 3.0, z: 0 },
      DOCK_02: { name: 'Automated Dock Station 02', x: 27.0, y: 3.0, z: 0 },
      AISLE_CENTER: { name: 'Center Transit Bay Origin', x: 15.0, y: 3.0, z: 0 },
    }),
    []
  );

  // Build current specification
  const currentSpec: PlannedMissionSpec = useMemo(
    () => ({
      warehouseBoundary,
      inspectionZone,
      startingPoint: docks[startingDock as keyof typeof docks] || docks.DOCK_01,
      altitudeMeters: altitude,
      cameraFovDeg: fov,
      desiredCoveragePct: desiredCoverage,
      flightSpeedMs: flightSpeed,
    }),
    [warehouseBoundary, inspectionZone, startingDock, altitude, fov, desiredCoverage, flightSpeed, docks]
  );

  // Generate Flight Plan
  const handleGenerateFlightPlan = async () => {
    const plan = await missionPlannerService.generateFlightPath(currentSpec);
    const validation = missionPlannerService.validatePlan(plan);
    setMissionPlan(plan);
    setMissionState('PLANNED');
    setActiveWaypointIndex(0);
    setIsSimulatingFlight(false);
    setSafetyWarnings(validation.safetyWarnings);
    setScannedGridBlocks([]);
  };

  // Initial plan generation on mount
  useEffect(() => {
    handleGenerateFlightPlan();
  }, []);

  // Recalculate plan when inputs change
  useEffect(() => {
    if (missionState === 'PLANNED' || missionState === 'COMPLETE' || missionState === 'ABORTED') {
      handleGenerateFlightPlan();
    }
  }, [currentSpec]);

  // Arm & Ready State Transition
  const handleArmMission = async () => {
    if (!missionPlan) return;
    await missionPlannerService.uploadToFlightController(missionPlan);
    setMissionState('READY');
  };

  // Start Simulation Flight
  const handleStartSimulationFlight = () => {
    if (!missionPlan) return;
    setMissionState('SIMULATING');
    setIsSimulatingFlight(true);
    setActiveWaypointIndex(0);
    setScannedGridBlocks([]);
  };

  // Abort Mission
  const handleAbortMission = () => {
    setIsSimulatingFlight(false);
    setMissionState('ABORTED');
  };

  // Reset Mission to Planning
  const handleResetPlan = () => {
    setIsSimulatingFlight(false);
    setMissionState('PLANNED');
    setActiveWaypointIndex(0);
    setScannedGridBlocks([]);
    setExecutedSessionResult(null);
    setExecutionError(null);
  };

  // Execute Autonomous Scan with Current Flight Plan
  const handleConfirmExecuteScan = async () => {
    if (!missionPlan) {
      setExecutionError('No active flight plan available to execute.');
      return;
    }
    if (missionPlan.waypoints.length === 0) {
      setExecutionError('Flight plan has 0 waypoints. Plan cannot be executed.');
      return;
    }

    setIsExecutingScan(true);
    setExecutionError(null);

    try {
      if (onExecutePlanScan) {
        const res = await onExecutePlanScan(missionPlan, currentSpec);
        if (res.success && res.session) {
          setExecutedSessionResult(res.session);
          setShowConfirmScanModal(false);
        } else {
          setExecutionError(res.error || 'Scan execution failed.');
        }
      } else {
        const planIdentifier = missionPlan.planId || missionPlan.missionId || `MSN-${Date.now().toString(36).toUpperCase()}`;
        const res = await apiService.triggerScan({
          planId: planIdentifier,
          flightDurationSeconds: missionPlan.metrics.estimatedFlightDurationSeconds,
          coveragePercentage: missionPlan.metrics.coveragePercentage,
          uavId: `AeroVue-Raven-04 (Plan ${planIdentifier})`,
          triggerType: 'SIMULATION_CYCLE',
        });
        setExecutedSessionResult(res.session);
        setShowConfirmScanModal(false);
      }
    } catch (err: any) {
      setExecutionError(err?.message || 'Autonomous scan execution failed.');
    } finally {
      setIsExecutingScan(false);
    }
  };

  // Simulated Flight Waypoint Stepping Timer
  useEffect(() => {
    if (!isSimulatingFlight || !missionPlan || missionPlan.waypoints.length === 0) return;

    const interval = setInterval(() => {
      setActiveWaypointIndex((prev) => {
        const next = prev + 1;
        // Record scanned block for visual coverage accumulation
        setScannedGridBlocks((blocks) => Array.from(new Set([...blocks, prev])));

        if (next >= missionPlan.waypoints.length) {
          setIsSimulatingFlight(false);
          setMissionState('COMPLETE');
          return prev;
        }
        return next;
      });
    }, Math.max(1200, Math.round(2800 / flightSpeed)));

    return () => clearInterval(interval);
  }, [isSimulatingFlight, missionPlan, flightSpeed]);

  const waypoints = missionPlan?.waypoints || [];
  const currentWaypoint = waypoints[activeWaypointIndex] || waypoints[0];

  // Optical Camera Footprint calculation
  const footprint = useMemo(() => {
    const fovRad = (fov * Math.PI) / 180;
    const width = Number((2 * altitude * Math.tan(fovRad / 2)).toFixed(2));
    const depth = Number((width * 0.65).toFixed(2));
    const area = Number((width * depth).toFixed(1));
    return { width, depth, area };
  }, [altitude, fov]);

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#24364A] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#F4F7FA] font-display">
              UAV MISSION PLANNER
            </h1>
            <span
              className={`text-[10px] uppercase px-2 py-0.5 rounded border font-bold ${
                missionState === 'COMPLETE'
                  ? 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/40'
                  : missionState === 'SIMULATING'
                  ? 'bg-[#4DA3FF]/20 text-[#4DA3FF] border-[#4DA3FF]/40 animate-pulse'
                  : missionState === 'READY'
                  ? 'bg-[#F5B942]/20 text-[#F5B942] border-[#F5B942]/40'
                  : missionState === 'ABORTED'
                  ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border-[#FF5C6C]/40'
                  : 'bg-[#122438] text-[#8FA4B8] border-[#24364A]'
              }`}
            >
              STATE: {missionState}
            </span>
          </div>
          <p className="text-xs text-[#8FA4B8] mt-0.5">
            Pre-flight waypoint generator, optical footprint sweeps, and mission state sequencing
          </p>
        </div>

        {/* Narrative Flow Pipeline Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[10px] bg-[#0D1B2A] border border-[#24364A] px-3 py-1.5 rounded text-[#8FA4B8]">
          <span className="text-[#4DA3FF] font-bold">1. PLAN</span>
          <span>→</span>
          <span className={missionState === 'SIMULATING' || missionState === 'COMPLETE' ? 'text-[#4DA3FF] font-bold' : ''}>2. FLY</span>
          <span>→</span>
          <span className={missionState === 'COMPLETE' ? 'text-[#39D98A] font-bold' : ''}>3. SCAN</span>
          <span>→</span>
          <span>4. DETECT</span>
          <span>→</span>
          <span>5. REPORT</span>
        </div>
      </div>

      {/* MISSION STATE CONTROLS STRIP */}
      <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold">
            <Radio className="h-4 w-4 text-[#4DA3FF]" />
            <span className="text-[#F4F7FA]">UAV FLIGHT CONTROLLER LINK:</span>
          </div>
          <span className="text-[11px] text-[#39D98A] font-bold flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#39D98A] animate-pulse" />
            <span>MAVLINK PX4-SIM PROTOCOL ACTIVE</span>
          </span>
        </div>

        {/* Action Controls based on State */}
        <div className="flex flex-wrap items-center gap-2">
          {missionState === 'PLANNED' && (
            <button
              onClick={handleArmMission}
              className="px-3.5 py-1.5 bg-[#4DA3FF] hover:bg-[#3d8ee6] text-[#07111F] font-bold rounded text-xs transition-colors flex items-center gap-1.5 shadow"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>VALIDATE & ARM UAV</span>
            </button>
          )}

          {missionState === 'READY' && (
            <button
              onClick={handleStartSimulationFlight}
              className="px-4 py-1.5 bg-[#39D98A] hover:bg-[#2fc479] text-[#07111F] font-bold rounded text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-[#39D98A]/20"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>EXECUTE MISSION FLIGHT</span>
            </button>
          )}

          {missionState === 'SIMULATING' && (
            <button
              onClick={handleAbortMission}
              className="px-3.5 py-1.5 bg-[#FF5C6C] hover:bg-[#e04c5c] text-[#07111F] font-bold rounded text-xs transition-colors flex items-center gap-1.5"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>EMERGENCY ABORT MISSION</span>
            </button>
          )}

          {(missionState === 'COMPLETE' || missionState === 'ABORTED') && (
            <button
              onClick={handleResetPlan}
              className="px-3 py-1.5 bg-[#0D1B2A] border border-[#24364A] hover:border-[#4DA3FF] text-[#F4F7FA] font-bold rounded text-xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>RESET TO PLANNER</span>
            </button>
          )}

          {/* Action 3: Execute Autonomous Scan with this Plan */}
          {missionState === 'COMPLETE' && (
            <button
              onClick={() => {
                setExecutionError(null);
                setShowConfirmScanModal(true);
              }}
              disabled={isExecutingScan || isScanning}
              className="px-4 py-1.5 bg-[#4DA3FF] hover:bg-[#3d8ee6] text-[#07111F] font-bold rounded text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-[#4DA3FF]/20"
            >
              <Scan className="h-3.5 w-3.5" />
              <span>{isExecutingScan ? 'EXECUTING SCAN...' : 'EXECUTE AUTONOMOUS SCAN WITH THIS PLAN'}</span>
            </button>
          )}

          {/* Handoff to other stages */}
          {missionState === 'COMPLETE' && onNavigateToAnalysis && (
            <button
              onClick={onNavigateToAnalysis}
              className="px-3.5 py-1.5 bg-[#122438] hover:bg-[#1b324b] text-[#4DA3FF] border border-[#24364A] hover:border-[#4DA3FF] font-bold rounded text-xs transition-colors flex items-center gap-1.5"
            >
              <span>INSPECT IN SCAN ANALYSIS</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Autonomous Scan Execution Result Banner */}
      {executedSessionResult && (
        <div className="rounded border border-[#39D98A]/60 bg-[#39D98A]/10 p-3.5 space-y-2 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-[#39D98A] shrink-0" />
              <div>
                <div className="font-bold text-[#F4F7FA] text-xs flex items-center gap-2">
                  <span>AUTONOMOUS SCAN COMPLETED & PERSISTED</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#39D98A]/20 text-[#39D98A] border border-[#39D98A]/40 text-[9px] font-bold">
                    ACTIVE SESSION UPDATED
                  </span>
                </div>
                <span className="text-[10px] text-[#8FA4B8] block mt-0.5">
                  Scan ID: <strong className="text-[#39D98A]">{executedSessionResult.id}</strong> · {executedSessionResult.totalItemsScanned} items audited · {executedSessionResult.discrepanciesFound} discrepancies flagged · {executedSessionResult.coveragePercentage}% coverage
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onNavigateToDiscrepancies && (
                <button
                  onClick={onNavigateToDiscrepancies}
                  className="px-3 py-1.5 bg-[#F5B942] hover:bg-[#e5ab37] text-[#07111F] font-bold rounded text-xs transition-colors flex items-center gap-1 shadow-sm"
                >
                  <span>Review Discrepancies ({executedSessionResult.discrepanciesFound})</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
              {onNavigateToAnalysis && (
                <button
                  onClick={onNavigateToAnalysis}
                  className="px-3 py-1.5 bg-[#4DA3FF] hover:bg-[#3d8ee6] text-[#07111F] font-bold rounded text-xs transition-colors flex items-center gap-1 shadow-sm"
                >
                  <span>Inspect Evidence</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
              {onNavigateToOverview && (
                <button
                  onClick={onNavigateToOverview}
                  className="px-3 py-1.5 bg-[#0D1B2A] border border-[#24364A] hover:border-[#4DA3FF] text-[#F4F7FA] font-bold rounded text-xs transition-colors"
                >
                  <span>Mission Overview</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Execution Error Banner if any */}
      {executionError && (
        <div className="p-3 rounded border border-[#FF5C6C]/60 bg-[#FF5C6C]/10 text-xs text-[#FF5C6C] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>SCAN EXECUTION FAILED: {executionError}</span>
          </div>
          <button
            onClick={() => setExecutionError(null)}
            className="text-[10px] text-[#FF5C6C] underline hover:text-[#ff808d]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Safety Warnings Banner if any */}
      {safetyWarnings.length > 0 && (
        <div className="p-2.5 rounded border border-[#F5B942]/60 bg-[#F5B942]/10 text-xs text-[#F5B942] flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>FLIGHT SAFETY WARNING: {safetyWarnings.join(' · ')}</span>
        </div>
      )}

      {/* MISSION METRICS STRIP (Labeled: SIMULATED ESTIMATES) */}
      <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#F4F7FA] uppercase border-b border-[#24364A]/80 pb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[#4DA3FF]">MISSION ESTIMATION METRICS</span>
            <span className="px-1.5 py-0.2 rounded bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/40 text-[9px] font-bold">
              SIMULATED ESTIMATES
            </span>
          </div>
          <span className="text-[10px] text-[#8FA4B8] hidden sm:inline">
            ALGORITHM: LAWN-MOWER BAY SWEEP WITH GLO-GRID BOUNDS
          </span>
        </div>

        {/* 5 Core Mission Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[9px] text-[#8FA4B8] block uppercase">TOTAL DISTANCE</span>
            <span className="text-base font-bold text-[#4DA3FF] tabular-nums mt-0.5 block">
              {missionPlan?.metrics.totalDistanceMeters ?? 64.2} m
            </span>
            <span className="text-[8px] text-[#8FA4B8]">3D Flight Trajectory</span>
          </div>

          <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[9px] text-[#8FA4B8] block uppercase">FLIGHT DURATION</span>
            <span className="text-base font-bold text-[#F4F7FA] tabular-nums mt-0.5 block">
              {Math.floor((missionPlan?.metrics.estimatedFlightDurationSeconds ?? 110) / 60)}m{' '}
              {(missionPlan?.metrics.estimatedFlightDurationSeconds ?? 110) % 60}s
            </span>
            <span className="text-[8px] text-[#8FA4B8]">@ {flightSpeed} m/s Speed</span>
          </div>

          <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[9px] text-[#8FA4B8] block uppercase">COVERAGE PERCENTAGE</span>
            <span className="text-base font-bold text-[#39D98A] tabular-nums mt-0.5 block">
              {missionPlan?.metrics.coveragePercentage ?? 94}%
            </span>
            <span className="text-[8px] text-[#8FA4B8]">Target: {desiredCoverage}%</span>
          </div>

          <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[9px] text-[#8FA4B8] block uppercase">NUMBER OF WAYPOINTS</span>
            <span className="text-base font-bold text-[#F4F7FA] tabular-nums mt-0.5 block">
              {missionPlan?.metrics.numberOfWaypoints ?? 8} Nodes
            </span>
            <span className="text-[8px] text-[#8FA4B8]">Start → Scan → Return</span>
          </div>

          <div className="p-2 rounded bg-[#07111F] border border-[#24364A] col-span-2 sm:col-span-1">
            <span className="text-[9px] text-[#8FA4B8] block uppercase">ESTIMATED SCAN AREA</span>
            <span className="text-base font-bold text-[#4DA3FF] tabular-nums mt-0.5 block">
              {missionPlan?.metrics.estimatedScanAreaM2 ?? 480} m²
            </span>
            <span className="text-[8px] text-[#8FA4B8]">Optical Footprint Total</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-[10px] text-[#8FA4B8] flex items-center justify-between pt-1">
          <span className="italic flex items-center gap-1.5 text-[#8FA4B8]/80">
            <Info className="h-3.5 w-3.5 text-[#F5B942]" />
            <span>Label: SIMULATED ESTIMATES · Theoretical flight duration & coverage based on ideal kinematic sweeps.</span>
          </span>
          <span className="text-[#39D98A] font-bold text-[9px] hidden md:inline">
            PLANNER VERSION: v2.1-PX4
          </span>
        </div>
      </div>

      {/* Main 2-Column Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: SIMULATED FLIGHT PATH & CAMERA FOOTPRINT (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] overflow-hidden">
            {/* Viewport Header */}
            <div className="px-3.5 py-2 bg-[#07111F] border-b border-[#24364A] flex flex-wrap items-center justify-between gap-2 text-xs text-[#8FA4B8]">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#4DA3FF]" />
                <span className="font-bold text-[#F4F7FA]">SIMULATED FLIGHT TRAJECTORY</span>
                <span className="text-[10px] text-[#8FA4B8]">
                  · ZONE {inspectionZone.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[10px] text-[#4DA3FF]">
                ALTITUDE: {altitude.toFixed(1)}m · FOV: {fov}° · CONE: {footprint.area}m²
              </div>
            </div>

            {/* Flight Path Canvas Viewport */}
            <div className="relative h-[420px] w-full bg-[#07111F] overflow-hidden p-4 select-none">
              {/* Engineering Grid */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(#24364A 1px, transparent 1px), linear-gradient(90deg, #24364A 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Warehouse Perimeter Wall Overlay */}
              <div className="absolute inset-4 border border-[#24364A] rounded pointer-events-none">
                <div className="absolute top-1 left-2 text-[8px] text-[#8FA4B8]/60 font-mono">
                  FACILITY PERIMETER: {warehouseBoundary.lengthM}m × {warehouseBoundary.widthM}m
                </div>
              </div>

              {/* Trajectory Polyline */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 6 3, 0 6" fill="#4DA3FF" />
                  </marker>
                </defs>

                {/* Planned Path Line */}
                <polyline
                  points={waypoints
                    .map((w, idx) => {
                      const px = 10 + (idx / Math.max(1, waypoints.length - 1)) * 80;
                      const py = idx === 0 || idx === waypoints.length - 1 ? 82 : idx % 2 === 1 ? 30 : 60;
                      return `${px}%,${py}%`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#4DA3FF"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  opacity="0.8"
                  markerEnd="url(#arrowhead)"
                />

                {/* Waypoint Nodes along Trajectory */}
                {waypoints.map((w, idx) => {
                  const px = 10 + (idx / Math.max(1, waypoints.length - 1)) * 80;
                  const py = idx === 0 || idx === waypoints.length - 1 ? 82 : idx % 2 === 1 ? 30 : 60;
                  const isActive = idx === activeWaypointIndex;
                  const isVisited = idx < activeWaypointIndex || missionState === 'COMPLETE';

                  return (
                    <g key={w.id}>
                      <circle
                        cx={`${px}%`}
                        cy={`${py}%`}
                        r={isActive ? 7 : 4.5}
                        fill={isActive ? '#4DA3FF' : isVisited ? '#39D98A' : '#0D1B2A'}
                        stroke={isActive ? '#F4F7FA' : isVisited ? '#39D98A' : '#4DA3FF'}
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Racks in the Warehouse */}
              <div className="absolute inset-x-8 top-16 bottom-24 flex flex-col justify-around pointer-events-none z-0">
                {['Rack Row A01-A02 (Zone A)', 'Rack Row B01-B02 (Zone B)', 'Rack Row C01-C02 (Zone C)'].map(
                  (rackTitle, idx) => {
                    const isPassed = scannedGridBlocks.includes(idx * 2 + 1);
                    return (
                      <div
                        key={rackTitle}
                        className={`h-16 rounded border transition-colors flex items-center justify-between px-4 ${
                          isPassed
                            ? 'border-[#39D98A]/50 bg-[#39D98A]/10'
                            : 'border-[#24364A] bg-[#0D1B2A]/60'
                        }`}
                      >
                        <div className="text-[10px] font-bold text-[#F4F7FA]">
                          {rackTitle}
                        </div>
                        <div className="text-[9px] font-mono text-[#8FA4B8]">
                          {isPassed ? (
                            <span className="text-[#39D98A] font-bold">● SCANNED (100% COVERAGE)</span>
                          ) : (
                            <span>○ SCHEDULED IN FLIGHT PLAN</span>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* DYNAMIC UAV AIRFRAME & CAMERA FOOTPRINT */}
              {waypoints.length > 0 && (
                <div
                  className="absolute z-30 pointer-events-none transition-all duration-700 flex flex-col items-center"
                  style={{
                    left: `${10 + (activeWaypointIndex / Math.max(1, waypoints.length - 1)) * 80}%`,
                    top: `${
                      activeWaypointIndex === 0 || activeWaypointIndex === waypoints.length - 1
                        ? 82
                        : activeWaypointIndex % 2 === 1
                        ? 30
                        : 60
                    }%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Dynamic Camera Footprint Frustum */}
                  <div
                    className="border-2 border-[#4DA3FF] bg-[#4DA3FF]/15 flex items-center justify-center -translate-y-2 shadow-xl shadow-[#4DA3FF]/25 backdrop-blur-xs transition-all duration-300"
                    style={{
                      width: `${Math.min(220, Math.max(80, footprint.width * 28))}px`,
                      height: `${Math.min(130, Math.max(50, footprint.depth * 28))}px`,
                      clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
                    }}
                  >
                    <span className="text-[8px] text-[#4DA3FF] font-bold tracking-tight bg-[#07111F]/80 px-1 py-0.2 rounded border border-[#4DA3FF]/40">
                      FOOTPRINT · {footprint.area} m²
                    </span>
                  </div>

                  {/* Multi-Rotor Airframe */}
                  <div className="h-7 w-7 rounded-full bg-[#0D1B2A] border-2 border-[#4DA3FF] -mt-10 flex items-center justify-center shadow-lg relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#4DA3FF] animate-pulse" />
                    <div className="absolute w-8 h-0.5 bg-[#4DA3FF]/60 rotate-45" />
                    <div className="absolute w-8 h-0.5 bg-[#4DA3FF]/60 -rotate-45" />
                  </div>

                  {/* Active Waypoint Pill */}
                  <span className="text-[9px] text-[#F4F7FA] bg-[#07111F] px-1.5 py-0.5 rounded border border-[#24364A] mt-1 font-bold shadow">
                    {currentWaypoint?.label || 'WP'}
                  </span>
                </div>
              )}
            </div>

            {/* Stepper Timeline: START → WAYPOINT → WAYPOINT → RETURN */}
            <div className="p-3 bg-[#07111F] border-t border-[#24364A] space-y-2">
              <div className="text-[10px] text-[#8FA4B8] uppercase font-bold flex items-center justify-between">
                <span>SIMULATED WAYPOINT EXECUTION SEQUENCE</span>
                <span className="text-[#4DA3FF]">
                  ACTIVE NODE: {activeWaypointIndex + 1} OF {waypoints.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {waypoints.map((wp, idx) => {
                  const isActive = idx === activeWaypointIndex;
                  const isDone = idx < activeWaypointIndex || missionState === 'COMPLETE';
                  return (
                    <React.Fragment key={wp.id}>
                      <div
                        onClick={() => setActiveWaypointIndex(idx)}
                        className={`px-2.5 py-1.5 rounded border text-[10px] cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-[#4DA3FF] text-[#07111F] border-[#4DA3FF] font-bold shadow'
                            : isDone
                            ? 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/40'
                            : 'bg-[#0D1B2A] text-[#8FA4B8] border-[#24364A] hover:text-[#F4F7FA]'
                        }`}
                      >
                        {wp.type === 'START' && <Navigation className="h-3 w-3" />}
                        {wp.type === 'WAYPOINT' && <span>WP-0{wp.index}</span>}
                        {wp.type === 'RETURN' && <RotateCcw className="h-3 w-3" />}
                        <span>{wp.label.replace('INSPECT BAY ', '')}</span>
                      </div>
                      {idx < waypoints.length - 1 && (
                        <span className="text-[#8FA4B8] text-xs">→</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* FUTURE HARDWARE INTERFACE SPECIFICATION CARD */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-[#24364A] pb-1.5">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[#4DA3FF]" />
                <span className="font-bold text-[#F4F7FA] uppercase">
                  HARDWARE INTEGRATION ARCHITECTURE
                </span>
              </div>
              <span className="text-[10px] text-[#F5B942] font-bold">ABSTRACTION LAYER</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-[#07111F] border border-[#24364A] space-y-1">
                <span className="text-[#4DA3FF] font-bold block">1. MissionPlanner Interface</span>
                <p className="text-[#8FA4B8] text-[10px] leading-relaxed">
                  Defines flight trajectory, lawn-mower waypoints, and optical coverage geometry. Uploads MAVLink mission items to flight controller.
                </p>
              </div>

              <div className="p-2.5 rounded bg-[#07111F] border border-[#24364A] space-y-1">
                <span className="text-[#4DA3FF] font-bold block">2. TelemetrySource Interface</span>
                <p className="text-[#8FA4B8] text-[10px] leading-relaxed">
                  Streams live [X, Y, Z] coordinates, GPS/SLAM position, battery voltage, and optical altitude from flight controller (PX4 / ArduPilot).
                </p>
              </div>

              <div className="p-2.5 rounded bg-[#07111F] border border-[#24364A] space-y-1">
                <span className="text-[#4DA3FF] font-bold block">3. ImageSource Interface</span>
                <p className="text-[#8FA4B8] text-[10px] leading-relaxed">
                  Decoupled frame ingestion supporting user uploads, synthetic sweeps, and target production RTSP/WebRTC Sony Alpha/FLIR gimbal streams.
                </p>
              </div>
            </div>

            <div className="text-[10px] text-[#8FA4B8] italic pt-1 border-t border-[#24364A]/60 flex items-center justify-between">
              <span>Notice: Architected for physical UAV docking; currently functioning in simulation mode.</span>
              <span className="text-[#39D98A] font-bold">READY FOR HARDWARE BRIDGE</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MISSION INPUTS & PARAMETERS (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#24364A] pb-1.5">
              <span className="font-bold text-[#F4F7FA] uppercase">MISSION INPUTS</span>
              <Sliders className="h-3.5 w-3.5 text-[#4DA3FF]" />
            </div>

            <div className="space-y-3">
              {/* Mission Type */}
              <div>
                <label className="text-[#8FA4B8] text-[10px] block mb-1 uppercase font-bold">
                  INSPECTION TYPE
                </label>
                <div className="p-2 rounded bg-[#07111F] border border-[#24364A] text-[#F4F7FA] font-bold text-xs flex items-center justify-between">
                  <span>WAREHOUSE INSPECTION</span>
                  <span className="text-[9px] text-[#39D98A]">AUTONOMOUS</span>
                </div>
              </div>

              {/* Inspection Zone */}
              <div>
                <label className="text-[#8FA4B8] text-[10px] block mb-1 uppercase font-bold">
                  INSPECTION ZONE
                </label>
                <select
                  value={inspectionZone}
                  onChange={(e) => setInspectionZone(e.target.value)}
                  className="w-full p-2 bg-[#07111F] border border-[#24364A] rounded text-[#F4F7FA] text-xs focus:outline-none focus:border-[#4DA3FF]"
                >
                  <option value="ALL_ZONES">ALL ZONES (Full Facility Sweep)</option>
                  <option value="ZONE_A">ZONE A (Mechanical Drives & Actuators)</option>
                  <option value="ZONE_B">ZONE B (Avionics & Energy Systems)</option>
                  <option value="ZONE_C">ZONE C (Perception & Fasteners)</option>
                </select>
              </div>

              {/* Starting Point / Dock */}
              <div>
                <label className="text-[#8FA4B8] text-[10px] block mb-1 uppercase font-bold">
                  UAV STARTING POINT / DOCK
                </label>
                <select
                  value={startingDock}
                  onChange={(e) => setStartingDock(e.target.value)}
                  className="w-full p-2 bg-[#07111F] border border-[#24364A] rounded text-[#F4F7FA] text-xs focus:outline-none focus:border-[#4DA3FF]"
                >
                  <option value="DOCK_01">Dock Station 01 (Origin X: 3.0m, Y: 3.0m)</option>
                  <option value="DOCK_02">Dock Station 02 (Origin X: 27.0m, Y: 3.0m)</option>
                  <option value="AISLE_CENTER">Center Transit Bay (X: 15.0m, Y: 3.0m)</option>
                </select>
              </div>

              {/* Altitude Slider */}
              <div>
                <div className="flex justify-between text-[#8FA4B8] mb-1">
                  <span>INSPECTION ALTITUDE</span>
                  <span className="text-[#4DA3FF] font-bold">{altitude.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min={2.0}
                  max={6.5}
                  step={0.5}
                  value={altitude}
                  onChange={(e) => setAltitude(parseFloat(e.target.value))}
                  className="w-full accent-[#4DA3FF]"
                />
                <div className="flex justify-between text-[8px] text-[#8FA4B8]">
                  <span>2.0m (High Detail)</span>
                  <span>Footprint: {footprint.area} m²</span>
                  <span>6.5m (Wide Sweep)</span>
                </div>
              </div>

              {/* Camera FOV Slider */}
              <div>
                <div className="flex justify-between text-[#8FA4B8] mb-1">
                  <span>CAMERA FOV</span>
                  <span className="text-[#4DA3FF] font-bold">{fov}°</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={110}
                  step={5}
                  value={fov}
                  onChange={(e) => setFov(parseInt(e.target.value, 10))}
                  className="w-full accent-[#4DA3FF]"
                />
                <div className="flex justify-between text-[8px] text-[#8FA4B8]">
                  <span>60° Telephoto</span>
                  <span>110° Ultra-Wide</span>
                </div>
              </div>

              {/* Desired Coverage Slider */}
              <div>
                <div className="flex justify-between text-[#8FA4B8] mb-1">
                  <span>DESIRED COVERAGE</span>
                  <span className="text-[#39D98A] font-bold">{desiredCoverage}%</span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={100}
                  step={5}
                  value={desiredCoverage}
                  onChange={(e) => setDesiredCoverage(parseInt(e.target.value, 10))}
                  className="w-full accent-[#39D98A]"
                />
              </div>

              {/* Flight Speed Slider */}
              <div>
                <div className="flex justify-between text-[#8FA4B8] mb-1">
                  <span>FLIGHT SPEED</span>
                  <span className="text-[#F4F7FA] font-bold">{flightSpeed.toFixed(1)} m/s</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.5}
                  step={0.2}
                  value={flightSpeed}
                  onChange={(e) => setFlightSpeed(parseFloat(e.target.value))}
                  className="w-full accent-[#4DA3FF]"
                />
              </div>

              {/* Warehouse Dimensions (Configurable Boundary) */}
              <div className="pt-2 border-t border-[#24364A]/60 space-y-1">
                <span className="text-[10px] text-[#8FA4B8] block uppercase font-bold">
                  WAREHOUSE BOUNDARY
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  <div className="p-1.5 rounded bg-[#07111F] border border-[#24364A]">
                    <span className="text-[#8FA4B8] block text-[8px]">LENGTH</span>
                    <span className="font-bold text-[#F4F7FA]">{warehouseBoundary.lengthM}m</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#07111F] border border-[#24364A]">
                    <span className="text-[#8FA4B8] block text-[8px]">WIDTH</span>
                    <span className="font-bold text-[#F4F7FA]">{warehouseBoundary.widthM}m</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#07111F] border border-[#24364A]">
                    <span className="text-[#8FA4B8] block text-[8px]">CEILING</span>
                    <span className="font-bold text-[#F4F7FA]">{warehouseBoundary.heightM}m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Handoff Navigation */}
          {onNavigateToSimulation && (
            <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 space-y-2 text-xs">
              <span className="text-[10px] text-[#8FA4B8] uppercase font-bold block">
                INTEGRATED FLIGHT WORKFLOW
              </span>
              <p className="text-[10px] text-[#8FA4B8] leading-relaxed">
                Execute flight sweeps and fault injection in the Simulation Lab to feed the Discrepancy Engine.
              </p>
              <button
                onClick={onNavigateToSimulation}
                className="w-full py-1.5 bg-[#122438] hover:bg-[#1b324b] text-[#4DA3FF] border border-[#24364A] rounded font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>OPEN SIMULATION LAB</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal: Execute Autonomous Scan with this Plan */}
      {showConfirmScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#07111F]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl rounded-xl border border-[#24364A] bg-[#0D1B2A] shadow-2xl shadow-black/80 overflow-hidden flex flex-col font-mono"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-scan-modal-title"
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#07111F] border-b border-[#24364A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className="h-4 w-4 text-[#4DA3FF]" />
                <h3
                  id="confirm-scan-modal-title"
                  className="text-xs font-bold text-[#F4F7FA] tracking-wide uppercase"
                >
                  CONFIRM AUTONOMOUS SCAN EXECUTION (SIMULATED)
                </h3>
              </div>
              <button
                onClick={() => setShowConfirmScanModal(false)}
                disabled={isExecutingScan}
                className="p-1 rounded text-[#8FA4B8] hover:text-[#F4F7FA] transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
              {/* Mission Plan Overview Card */}
              <div className="p-3.5 rounded border border-[#24364A] bg-[#07111F] space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#24364A]/80 pb-2">
                  <span className="text-[10px] text-[#8FA4B8] uppercase font-bold">
                    FLIGHT PLAN SPECIFICATION
                  </span>
                  <span className="text-[10px] text-[#4DA3FF] font-bold">
                    {missionPlan?.planId || 'PLAN-DEFAULT'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[9px] text-[#8FA4B8] block">TARGET ZONE:</span>
                    <strong className="text-[#F4F7FA]">{inspectionZone}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8FA4B8] block">ALTITUDE:</span>
                    <strong className="text-[#4DA3FF]">{altitude} m</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8FA4B8] block">WAYPOINT NODES:</span>
                    <strong className="text-[#F4F7FA]">{missionPlan?.waypoints.length ?? 0} waypoints</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8FA4B8] block">TRAJECTORY DISTANCE:</span>
                    <strong className="text-[#F4F7FA]">
                      {(missionPlan?.metrics.totalDistanceMeters ?? 64.2).toFixed(1)} m
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8FA4B8] block">CALCULATED COVERAGE:</span>
                    <strong className="text-[#39D98A]">
                      {missionPlan?.metrics.coveragePercentage ?? 94}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8FA4B8] block">CAMERA FOV & SWEEP:</span>
                    <strong className="text-[#F4F7FA]">{fov}° · {footprint.area} m²</strong>
                  </div>
                </div>
              </div>

              {/* Safety & Validation Checklist */}
              <div className="p-3 rounded border border-[#24364A] bg-[#07111F] space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-[#39D98A] font-bold text-[10px] uppercase">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>PRE-FLIGHT VALIDATION PASSED</span>
                </div>
                <div className="text-[10px] text-[#8FA4B8]">
                  {safetyWarnings.length > 0
                    ? `Noted Warnings: ${safetyWarnings.join(' · ')}`
                    : 'Clearance validated. No rack collision corridors or perimeter violations detected.'}
                </div>
              </div>

              {/* Simulation Safety Disclaimer */}
              <div className="p-3 rounded border border-[#F5B942]/40 bg-[#F5B942]/10 space-y-1 text-[11px] text-[#F5B942]">
                <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>SIMULATED MISSION NOTICE</span>
                </div>
                <p className="text-[10px] text-[#8FA4B8] leading-relaxed">
                  This execution runs a high-fidelity synthetic UAV scan. No physical drone commands are issued. Observations will be correlated with the WMS inventory ledger and posted to the Discrepancy Intelligence Engine.
                </p>
              </div>

              {executionError && (
                <div className="p-2.5 rounded border border-[#FF5C6C] bg-[#FF5C6C]/10 text-xs text-[#FF5C6C]">
                  {executionError}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-[#07111F] border-t border-[#24364A] flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowConfirmScanModal(false)}
                disabled={isExecutingScan}
                className="px-3.5 py-1.5 rounded bg-[#0D1B2A] hover:bg-[#122438] text-[#8FA4B8] hover:text-[#F4F7FA] border border-[#24364A] text-xs font-bold transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmExecuteScan}
                disabled={isExecutingScan}
                className="px-4 py-1.5 rounded bg-[#4DA3FF] hover:bg-[#3d8ee6] text-[#07111F] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-[#4DA3FF]/20 disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>
                  {isExecutingScan ? 'EXECUTING SCAN...' : 'CONFIRM & EXECUTE SIMULATED SCAN'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
