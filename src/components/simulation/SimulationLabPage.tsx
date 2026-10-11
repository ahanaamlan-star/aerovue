/**
 * AEROVUE SIMULATION LAB WORKSTATION
 *
 * An engineering test environment for controlled experimental validation.
 *
 * Core Pipeline:
 * UAV → SCAN → OBSERVATION → DISCREPANCY ANALYSIS → RISK
 *
 * Features:
 * - Configurable warehouse environment (size, racks, bins, SKUs)
 * - Simulated UAV with real-time trajectory, position [X, Y, Z], heading, altitude, speed
 * - Dynamic optical camera footprint frustum calculated from Altitude & FOV
 * - Scanned vs Unscanned regions, and dynamic Risk Markers over racks
 * - Controllable altitude, FOV, flight speed, scan density, and scenario presets
 * - "GENERATE SCENARIO" and "RUN SIMULATION" two-stage experimentation workflow
 * - Prominent SIMULATION METRICS strip and engineering truth disclaimer
 * - Live Findings Inspector: results visibly change with altitude & discrepancy rate
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  SimulationParams,
  SimulationScenarioPreset,
  UAVTelemetry,
  DiscrepancyRecord,
  WarehouseBin,
  InventoryItem,
} from '../../types';
import { apiService } from '../../services/apiService';
import { SimulationRunResult, UAVWaypoint } from '../../services/simulationEngine';
import {
  Compass,
  Play,
  Pause,
  Sliders,
  RotateCcw,
  SkipForward,
  Camera,
  Layers,
  Radio,
  RefreshCw,
  Cpu,
  CheckSquare,
  Square,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Eye,
  Maximize2,
  Box,
  TrendingDown,
  Navigation,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface SimulationLabPageProps {
  onRunSimulation: (
    params: SimulationParams,
    navigateToDiscrepancies?: boolean
  ) => Promise<{
    simResult: SimulationRunResult;
    discrepancies: DiscrepancyRecord[];
    bins: WarehouseBin[];
  }>;
  isLoading: boolean;
  telemetry?: UAVTelemetry;
  onSelectDiscrepancy?: (d: DiscrepancyRecord) => void;
  onNavigateToAnalysis?: () => void;
  onNavigateToPlanner?: () => void;
}

export const SimulationLabPage: React.FC<SimulationLabPageProps> = ({
  onRunSimulation,
  isLoading,
  telemetry,
  onSelectDiscrepancy,
  onNavigateToAnalysis,
  onNavigateToPlanner,
}) => {
  // Flight controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentWpIndex, setCurrentWpIndex] = useState(0);

  // Configurable Parameters
  const [altitude, setAltitude] = useState(3.5); // 2.0 to 7.0m
  const [fov, setFov] = useState(84); // 60 to 110 deg
  const [flightSpeed, setFlightSpeed] = useState(1.0); // 0.4 to 2.5 m/s
  const [scanDensity, setScanDensity] = useState<'LOW' | 'STANDARD' | 'HIGH'>('STANDARD');
  const [rackCount, setRackCount] = useState(4); // 2 to 8 racks
  const [binsPerRack, setBinsPerRack] = useState(6); // 4 to 8 bins per rack
  const [discrepancyRate, setDiscrepancyRate] = useState(30); // 0 to 50%
  const [activePreset, setActivePreset] = useState<SimulationScenarioPreset>('CUSTOM');

  // Fault Matrix
  const [faults, setFaults] = useState({
    missingItems: true,
    unexpectedItems: true,
    wrongLocation: true,
    quantityMismatch: true,
    labelMismatch: true,
    persistentDiscrepancy: false,
  });

  // Current Simulation State & Results
  const [currentSimResult, setCurrentSimResult] = useState<SimulationRunResult | null>(null);
  const [currentDiscrepancies, setCurrentDiscrepancies] = useState<DiscrepancyRecord[]>([]);
  const [currentBins, setCurrentBins] = useState<WarehouseBin[]>([]);
  const [lastExecutedParams, setLastExecutedParams] = useState<SimulationParams | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [scenarioGeneratedMessage, setScenarioGeneratedMessage] = useState<string | null>(null);

  // Generate initial simulation state on mount
  useEffect(() => {
    handleGenerateScenario();
  }, []);

  // Compute optical camera footprint
  const cameraFootprint = useMemo(() => {
    const fovRad = (fov * Math.PI) / 180;
    const width = Number((2 * altitude * Math.tan(fovRad / 2)).toFixed(2));
    const depth = Number((width * 0.65).toFixed(2));
    const area = Number((width * depth).toFixed(1));
    return { width, depth, area };
  }, [altitude, fov]);

  // Optical confidence penalty from altitude and speed
  const opticalConfidencePenalty = useMemo(() => {
    let penalty = 0;
    if (altitude > 4.5) penalty += Math.round((altitude - 4.5) * 4); // high altitude decreases resolution
    if (flightSpeed > 1.5) penalty += Math.round((flightSpeed - 1.5) * 6); // speed blur penalty
    return penalty;
  }, [altitude, flightSpeed]);

  // Construct current parameters
  const currentParams: SimulationParams = useMemo(() => ({
    warehouseName: rackCount <= 4 ? 'WH-01 (Apex Compact)' : rackCount <= 6 ? 'WH-01 (Logistics Hub)' : 'WH-01 (High-Bay Apex)',
    rackCount,
    skusPerRack: binsPerRack,
    binsPerRack,
    discrepancyRatePct: discrepancyRate,
    cameraAltitudeM: altitude,
    cameraFovDeg: fov,
    flightSpeedMs: flightSpeed,
    scanDensity,
    scenarioPreset: activePreset,
    faults,
  }), [rackCount, binsPerRack, discrepancyRate, altitude, fov, flightSpeed, scanDensity, activePreset, faults]);

  // Generate Scenario only (Step 1)
  const handleGenerateScenario = () => {
    const result = apiService.generateScenario(currentParams);
    setCurrentSimResult(result);
    setCurrentBins(result.generatedBins);
    setScenarioGeneratedMessage(
      `Scenario synthesized: ${result.generatedInventory.length} SKUs across ${result.generatedBins.length} bins · ${result.injectedDiscrepanciesCount} faults injected.`
    );
    setTimeout(() => setScenarioGeneratedMessage(null), 4000);
  };

  // Run Complete Simulation (Step 2)
  const handleExecuteSimulation = async () => {
    const res = await onRunSimulation(currentParams, false);
    if (res) {
      setCurrentSimResult(res.simResult);
      setCurrentDiscrepancies(res.discrepancies);
      setCurrentBins(res.bins);
      setLastExecutedParams(currentParams);
      if (res.discrepancies.length > 0) {
        setSelectedResultId(res.discrepancies[0].id);
      }
    }
  };

  // Switch Scenario Preset
  const handleSelectPreset = (preset: SimulationScenarioPreset) => {
    setActivePreset(preset);
    if (preset === 'NORMAL') {
      setDiscrepancyRate(0);
      setFaults({
        missingItems: false,
        unexpectedItems: false,
        wrongLocation: false,
        quantityMismatch: false,
        labelMismatch: false,
        persistentDiscrepancy: false,
      });
    } else if (preset === 'MISSING') {
      setDiscrepancyRate(25);
      setFaults({
        missingItems: true,
        unexpectedItems: false,
        wrongLocation: false,
        quantityMismatch: false,
        labelMismatch: false,
        persistentDiscrepancy: false,
      });
    } else if (preset === 'QUANTITY_MISMATCH') {
      setDiscrepancyRate(30);
      setFaults({
        missingItems: false,
        unexpectedItems: false,
        wrongLocation: false,
        quantityMismatch: true,
        labelMismatch: false,
        persistentDiscrepancy: false,
      });
    } else if (preset === 'WRONG_LOCATION') {
      setDiscrepancyRate(25);
      setFaults({
        missingItems: false,
        unexpectedItems: false,
        wrongLocation: true,
        quantityMismatch: false,
        labelMismatch: false,
        persistentDiscrepancy: false,
      });
    } else if (preset === 'UNEXPECTED_ITEM') {
      setDiscrepancyRate(25);
      setFaults({
        missingItems: false,
        unexpectedItems: true,
        wrongLocation: false,
        quantityMismatch: false,
        labelMismatch: false,
        persistentDiscrepancy: false,
      });
    } else if (preset === 'PERSISTENT') {
      setDiscrepancyRate(35);
      setFaults({
        missingItems: true,
        unexpectedItems: false,
        wrongLocation: false,
        quantityMismatch: true,
        labelMismatch: false,
        persistentDiscrepancy: true,
      });
    }
  };

  const toggleFault = (key: keyof typeof faults) => {
    setActivePreset('CUSTOM');
    setFaults((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Dynamic Waypoint Flight Path
  const waypoints: UAVWaypoint[] = useMemo(() => {
    if (currentSimResult && currentSimResult.flightWaypoints.length > 0) {
      return currentSimResult.flightWaypoints;
    }
    return [
      { id: 'WP-01', index: 1, label: 'Inspect Rack A01', coordinates: { x: 4.0, y: 4.5, z: altitude }, targetRack: 'Rack A01', status: 'SCANNING' },
      { id: 'WP-02', index: 2, label: 'Inspect Rack A02', coordinates: { x: 9.0, y: 4.5, z: altitude }, targetRack: 'Rack A02', status: 'PENDING' },
      { id: 'WP-03', index: 3, label: 'Inspect Rack B01', coordinates: { x: 14.0, y: 10.5, z: altitude }, targetRack: 'Rack B01', status: 'PENDING' },
      { id: 'WP-04', index: 4, label: 'Inspect Rack B02', coordinates: { x: 19.0, y: 10.5, z: altitude }, targetRack: 'Rack B02', status: 'PENDING' },
    ];
  }, [currentSimResult, altitude]);

  // Flight sweep timer
  useEffect(() => {
    if (!isPlaying || waypoints.length === 0) return;
    const interval = setInterval(() => {
      setCurrentWpIndex((prev) => (prev + 1) % waypoints.length);
    }, Math.max(1200, Math.round(2800 / flightSpeed)));
    return () => clearInterval(interval);
  }, [isPlaying, waypoints.length, flightSpeed]);

  const activeWp = waypoints[currentWpIndex] || waypoints[0];

  // Calculated UAV Telemetry for display
  const liveX = Number((activeWp?.coordinates?.x ?? 4.0).toFixed(1));
  const liveY = Number((activeWp?.coordinates?.y ?? 4.5).toFixed(1));
  const liveHeading = (activeWp?.index ?? 1) % 2 === 0 ? '270° WEST' : '090° EAST';

  // Area and Coverage calculations
  const totalFacilityArea = rackCount * 110;
  const areaScanned = currentSimResult
    ? currentSimResult.areaScannedSqMeters
    : Math.min(totalFacilityArea, Math.round(rackCount * cameraFootprint.area * 1.5));
  const coveragePct = Math.min(100, Math.round((areaScanned / totalFacilityArea) * 100));

  const totalDiscrepanciesCount = currentDiscrepancies.length > 0
    ? currentDiscrepancies.length
    : currentSimResult?.injectedDiscrepanciesCount ?? 0;

  const criticalHighCount = currentDiscrepancies.filter(
    (d) => d.risk.level === 'CRITICAL' || d.risk.level === 'HIGH'
  ).length;

  const simulatedAvgConfidence = Math.max(78, Math.min(98, 94 - opticalConfidencePenalty));

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#24364A] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#F4F7FA] font-display">
              AEROVUE SIMULATION LAB
            </h1>
            <span className="text-[10px] uppercase bg-[#122438] text-[#4DA3FF] px-2 py-0.5 rounded border border-[#24364A] font-bold">
              ENGINEERING TESTBED
            </span>
          </div>
          <p className="text-xs text-[#8FA4B8] mt-0.5">
            Controlled algorithmic testing across UAV → SCAN → OBSERVATION → DISCREPANCY ANALYSIS → RISK
          </p>
        </div>

        {/* Playback Controls & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded font-semibold text-xs transition-colors flex items-center gap-1.5 ${
              isPlaying
                ? 'bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/40'
                : 'bg-[#4DA3FF]/20 text-[#4DA3FF] border border-[#4DA3FF]/40'
            }`}
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
            <span>{isPlaying ? 'PAUSE SWEEP' : 'RESUME SWEEP'}</span>
          </button>

          <button
            onClick={() => setCurrentWpIndex((prev) => (prev + 1) % waypoints.length)}
            className="px-2.5 py-1.5 bg-[#0D1B2A] border border-[#24364A] hover:border-[#4DA3FF] text-[#F4F7FA] rounded text-xs transition-colors flex items-center gap-1"
            title="Step to next flight waypoint"
          >
            <SkipForward className="h-3 w-3" />
            <span className="hidden sm:inline">STEP WP</span>
          </button>

          <button
            onClick={handleGenerateScenario}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#0D1B2A] border border-[#24364A] hover:border-[#4DA3FF] text-[#4DA3FF] font-bold rounded text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className="h-3 w-3" />
            <span>GENERATE SCENARIO</span>
          </button>

          {onNavigateToPlanner && (
            <button
              onClick={onNavigateToPlanner}
              className="px-3 py-1.5 bg-[#0D1B2A] border border-[#24364A] hover:border-[#4DA3FF] text-[#8FA4B8] hover:text-[#4DA3FF] font-bold rounded text-xs transition-colors flex items-center gap-1.5"
              title="Open UAV Mission Planner Workstation"
            >
              <Navigation className="h-3 w-3" />
              <span>PLANNER</span>
            </button>
          )}

          <button
            onClick={handleExecuteSimulation}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-[#4DA3FF] hover:bg-[#3d8ee6] text-[#07111F] font-bold rounded text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-[#4DA3FF]/20"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>PROCESSING SIMULATION...</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 fill-current" />
                <span>RUN SIMULATION</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scenario Synthesized Toast Alert */}
      {scenarioGeneratedMessage && (
        <div className="p-2.5 rounded border border-[#39D98A]/60 bg-[#39D98A]/10 text-xs text-[#39D98A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{scenarioGeneratedMessage}</span>
          </div>
          <span className="text-[10px] text-[#8FA4B8]">READY FOR SIMULATION RUN</span>
        </div>
      )}

      {/* PROMINENT SIMULATION METRICS STRIP (Labeled SIMULATION) */}
      <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#F4F7FA] uppercase border-b border-[#24364A]/80 pb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[#4DA3FF] font-bold">SIMULATION METRICS</span>
            <span className="px-1.5 py-0.2 rounded bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/40 text-[9px]">
              SYNTHETIC ENVIRONMENT
            </span>
          </div>
          <span className="text-[10px] text-[#8FA4B8] hidden sm:inline">
            FACILITY: {currentParams.warehouseName} ({rackCount} RACKS · {binsPerRack} BINS/RACK)
          </span>
        </div>

        {/* 7 Metric Panels */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[9px] text-[#8FA4B8] block uppercase">AREA SCANNED</span>
            <span className="text-base font-bold text-[#4DA3FF] tabular-nums mt-0.5 block">
              {areaScanned} m²
            </span>
            <span className="text-[8px] text-[#8FA4B8]">Floor Footprint</span>
          </div>

          <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[9px] text-[#8FA4B8] block uppercase">COVERAGE</span>
            <span className="text-base font-bold text-[#39D98A] tabular-nums mt-0.5 block">
              {coveragePct}%
            </span>
            <span className="text-[8px] text-[#8FA4B8]">Optical Sweep</span>
          </div>

          <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[9px] text-[#8FA4B8] block uppercase">OBJECTS OBSERVED</span>
            <span className="text-base font-bold text-[#F4F7FA] tabular-nums mt-0.5 block">
              {currentSimResult?.totalObjectsObserved ?? rackCount * binsPerRack * 8}
            </span>
            <span className="text-[8px] text-[#8FA4B8]">Detected Units</span>
          </div>

          <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[9px] text-[#8FA4B8] block uppercase">DISCREPANCIES</span>
            <span
              className={`text-base font-bold tabular-nums mt-0.5 block ${
                totalDiscrepanciesCount > 0 ? 'text-[#F5B942]' : 'text-[#39D98A]'
              }`}
            >
              {totalDiscrepanciesCount}
            </span>
            <span className="text-[8px] text-[#8FA4B8]">Flagged Variances</span>
          </div>

          <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[9px] text-[#8FA4B8] block uppercase">HIGH-RISK FINDINGS</span>
            <span
              className={`text-base font-bold tabular-nums mt-0.5 block ${
                criticalHighCount > 0 ? 'text-[#FF5C6C]' : 'text-[#39D98A]'
              }`}
            >
              {criticalHighCount}
            </span>
            <span className="text-[8px] text-[#8FA4B8]">Crit / High Tier</span>
          </div>

          <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[9px] text-[#8FA4B8] block uppercase">AVG CONFIDENCE</span>
            <span className="text-base font-bold text-[#39D98A] tabular-nums mt-0.5 block">
              {simulatedAvgConfidence}%
            </span>
            <span className="text-[8px] text-[#8FA4B8]">
              {opticalConfidencePenalty > 0 ? `-${opticalConfidencePenalty}% Alt/Spd` : 'Optimal Res'}
            </span>
          </div>

          <div className="p-2 rounded bg-[#07111F] border border-[#24364A] col-span-2 sm:col-span-1">
            <span className="text-[9px] text-[#8FA4B8] block uppercase">SIM DURATION</span>
            <span className="text-base font-bold text-[#F4F7FA] tabular-nums mt-0.5 block">
              {currentSimResult?.estimatedFlightTimeSeconds ?? 180}s
            </span>
            <span className="text-[8px] text-[#8FA4B8]">Autonomous Sweep</span>
          </div>
        </div>

        {/* Required Simulation Disclaimer */}
        <div className="text-[10px] text-[#8FA4B8] flex items-center justify-between pt-1">
          <span className="flex items-center gap-1.5 italic text-[#8FA4B8]/80">
            <Info className="h-3 w-3 text-[#F5B942]" />
            <span>Label: SIMULATION · Do not represent them as real-world validation. Controlled synthetic algorithmic evaluation.</span>
          </span>
          <span className="text-[#39D98A] font-bold text-[9px] hidden md:inline">
            AEROVUE EXPERIMENTAL LAB
          </span>
        </div>
      </div>

      {/* Main 2-Column Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: VISUAL WAREHOUSE ENVIRONMENT & UAV MAP (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] overflow-hidden">
            {/* Viewport Control Bar */}
            <div className="px-3.5 py-2 bg-[#07111F] border-b border-[#24364A] flex flex-wrap items-center justify-between gap-2 text-xs text-[#8FA4B8]">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#4DA3FF]" />
                <span className="font-bold text-[#F4F7FA]">WAREHOUSE SPATIAL ENVIRONMENT</span>
                <span className="text-[10px] text-[#8FA4B8]">· ORTHOGRAPHIC PERSPECTIVE</span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-[#39D98A] font-bold">● SCANNED REGION</span>
                <span className="text-[#8FA4B8]">○ UNSCANNED REGION</span>
                <span className="text-[#FF5C6C] font-bold">▲ RISK MARKER</span>
              </div>
            </div>

            {/* Visual Warehouse Grid Viewport */}
            <div className="relative h-[420px] w-full bg-[#07111F] overflow-hidden select-none p-4">
              {/* Engineering Grid Background */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(#24364A 1px, transparent 1px), linear-gradient(90deg, #24364A 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Coordinate Rulers */}
              <div className="absolute top-1 left-2 text-[8px] text-[#8FA4B8]/60 font-mono">0.0m X</div>
              <div className="absolute bottom-1 right-2 text-[8px] text-[#8FA4B8]/60 font-mono">30.0m X · 20.0m Y</div>

              {/* Waypoint Trajectory Polyline */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <polyline
                  points={waypoints
                    .map((w, idx) => {
                      const px = 10 + (idx / Math.max(1, waypoints.length - 1)) * 80;
                      const py = idx % 2 === 0 ? 30 : 65;
                      return `${px}%,${py}%`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#4DA3FF"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  opacity="0.8"
                />

                {/* Waypoint Marker Dots */}
                {waypoints.map((w, idx) => {
                  const px = 10 + (idx / Math.max(1, waypoints.length - 1)) * 80;
                  const py = idx % 2 === 0 ? 30 : 65;
                  const isCurrent = idx === currentWpIndex;
                  return (
                    <g key={w.id}>
                      <circle
                        cx={`${px}%`}
                        cy={`${py}%`}
                        r={isCurrent ? 6 : 3.5}
                        fill={isCurrent ? '#4DA3FF' : '#122438'}
                        stroke={isCurrent ? '#F4F7FA' : '#4DA3FF'}
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* WAREHOUSE RACKS VISUALIZATION */}
              <div className="relative z-10 h-full flex flex-col justify-around py-3">
                {Array.from({ length: rackCount }).map((_, rIdx) => {
                  const rackName = `Rack ${String.fromCharCode(65 + Math.floor(rIdx / 2))}0${(rIdx % 2) + 1}`;
                  const zoneLetter = rIdx < 2 ? 'ZONE A' : rIdx < 4 ? 'ZONE B' : rIdx < 6 ? 'ZONE C' : 'ZONE D';
                  const isScanned = rIdx <= currentWpIndex;

                  // Find bins in this rack
                  const rackBins = currentBins.filter((b) => b.rack === rackName);
                  const hasDiscrepancy = rackBins.some((b) => b.currentStatus !== 'NORMAL');
                  const hasCritical = rackBins.some((b) => b.currentStatus === 'CRITICAL');

                  return (
                    <div
                      key={rackName}
                      className={`p-2.5 rounded border transition-all ${
                        isScanned
                          ? 'border-[#39D98A]/50 bg-[#0D1B2A]/90'
                          : 'border-[#24364A] bg-[#07111F]/70 opacity-60'
                      }`}
                    >
                      {/* Rack Title Bar */}
                      <div className="flex items-center justify-between text-[10px] mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#F4F7FA]">{rackName}</span>
                          <span className="text-[#8FA4B8]">({zoneLetter})</span>
                          {isScanned ? (
                            <span className="text-[8px] text-[#39D98A] font-bold">[SCANNED 100%]</span>
                          ) : (
                            <span className="text-[8px] text-[#8FA4B8]">[UNSCANNED]</span>
                          )}
                        </div>

                        {/* Risk Marker Pin */}
                        {hasDiscrepancy && (
                          <div
                            className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              hasCritical
                                ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border-[#FF5C6C]/50'
                                : 'bg-[#F5B942]/20 text-[#F5B942] border-[#F5B942]/50'
                            }`}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            <span>{hasCritical ? 'CRITICAL DISCREPANCY' : 'DISCREPANCY FLAGGED'}</span>
                          </div>
                        )}
                      </div>

                      {/* Bins Grid Inside Rack */}
                      <div className="grid grid-cols-6 sm:grid-cols-6 gap-1.5">
                        {rackBins.slice(0, binsPerRack).map((bin) => {
                          const isNormal = bin.currentStatus === 'NORMAL';
                          const isCrit = bin.currentStatus === 'CRITICAL';
                          const isWarn = bin.currentStatus === 'WARNING' || bin.currentStatus === 'HIGH_RISK';

                          return (
                            <div
                              key={bin.id}
                              className={`p-1.5 rounded border text-[9px] transition-all flex flex-col justify-between ${
                                isNormal
                                  ? 'border-[#39D98A]/30 bg-[#07111F]'
                                  : isCrit
                                  ? 'border-[#FF5C6C] bg-[#FF5C6C]/10 ring-1 ring-[#FF5C6C]/40'
                                  : 'border-[#F5B942] bg-[#F5B942]/10'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-[#F4F7FA]">{bin.displayCode}</span>
                                {!isNormal && (
                                  <span className={`h-1.5 w-1.5 rounded-full ${isCrit ? 'bg-[#FF5C6C] animate-ping' : 'bg-[#F5B942]'}`} />
                                )}
                              </div>
                              <div className="text-[8px] text-[#8FA4B8] truncate">{bin.expectedSku}</div>
                              <div className="flex justify-between text-[8px] font-mono pt-1 border-t border-[#24364A]/50">
                                <span className="text-[#8FA4B8]">EXP:{bin.expectedQty}</span>
                                <span className={bin.observedQty !== bin.expectedQty ? 'text-[#FF5C6C] font-bold' : 'text-[#39D98A]'}>
                                  OBS:{bin.observedQty}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DYNAMIC UAV DRONE WITH 3D PROJECTED CAMERA FOOTPRINT */}
              {waypoints.length > 0 && (
                <div
                  className="absolute z-30 pointer-events-none transition-all duration-700 flex flex-col items-center"
                  style={{
                    left: `${10 + (currentWpIndex / Math.max(1, waypoints.length - 1)) * 80}%`,
                    top: `${currentWpIndex % 2 === 0 ? 30 : 65}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Dynamic Optical Camera Footprint (expands with altitude & FOV) */}
                  <div
                    className="border-2 border-[#4DA3FF] bg-[#4DA3FF]/15 flex items-center justify-center -translate-y-2 shadow-xl shadow-[#4DA3FF]/25 backdrop-blur-xs transition-all duration-300"
                    style={{
                      width: `${Math.min(220, Math.max(80, cameraFootprint.width * 28))}px`,
                      height: `${Math.min(140, Math.max(50, cameraFootprint.depth * 28))}px`,
                      clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
                    }}
                  >
                    <span className="text-[8px] text-[#4DA3FF] font-bold tracking-tight bg-[#07111F]/70 px-1 py-0.2 rounded border border-[#4DA3FF]/40">
                      FOV {fov}° · {cameraFootprint.area}m² CONE
                    </span>
                  </div>

                  {/* Multi-Rotor Airframe Icon */}
                  <div className="h-7 w-7 rounded-full bg-[#0D1B2A] border-2 border-[#4DA3FF] -mt-10 flex items-center justify-center shadow-lg relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#4DA3FF] animate-pulse" />
                    {/* Rotor blade lines */}
                    <div className="absolute w-8 h-0.5 bg-[#4DA3FF]/60 rotate-45" />
                    <div className="absolute w-8 h-0.5 bg-[#4DA3FF]/60 -rotate-45" />
                  </div>

                  {/* Flight Telemetry Pill */}
                  <span className="text-[9px] text-[#F4F7FA] bg-[#07111F]/90 px-1.5 py-0.5 rounded border border-[#24364A] mt-1 font-bold shadow">
                    UAV-04 · {activeWp?.label || 'INSPECT'}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Real-Time UAV Telemetry Strip */}
            <div className="px-4 py-2.5 bg-[#07111F] border-t border-[#24364A] grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div>
                <span className="text-[9px] text-[#8FA4B8] block">GRID POSITION</span>
                <span className="font-bold text-[#F4F7FA] text-[11px]">
                  X={liveX}m · Y={liveY}m
                </span>
              </div>
              <div>
                <span className="text-[9px] text-[#8FA4B8] block">ALTITUDE (Z)</span>
                <span className="font-bold text-[#4DA3FF] text-[11px]">{altitude.toFixed(1)} m</span>
              </div>
              <div>
                <span className="text-[9px] text-[#8FA4B8] block">OPTICAL FOOTPRINT</span>
                <span className="font-bold text-[#39D98A] text-[11px]">{cameraFootprint.area} m²</span>
              </div>
              <div>
                <span className="text-[9px] text-[#8FA4B8] block">HEADING</span>
                <span className="font-bold text-[#F4F7FA] text-[11px]">{liveHeading}</span>
              </div>
              <div>
                <span className="text-[9px] text-[#8FA4B8] block">SPEED</span>
                <span className="font-bold text-[#F4F7FA] text-[11px]">{flightSpeed} m/s</span>
              </div>
            </div>
          </div>

          {/* SIMULATION FINDINGS INSPECTOR TABLE */}
          {currentDiscrepancies.length > 0 && (
            <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-[#24364A] pb-1.5">
                <span className="font-bold text-[#F4F7FA]">SIMULATED DISCREPANCY FINDINGS</span>
                <span className="text-[10px] text-[#4DA3FF] font-bold">
                  {currentDiscrepancies.length} FINDINGS DETECTED
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
                {currentDiscrepancies.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setSelectedResultId(d.id);
                      if (onSelectDiscrepancy) onSelectDiscrepancy(d);
                    }}
                    className={`p-2 rounded border transition-all cursor-pointer flex items-center justify-between ${
                      selectedResultId === d.id
                        ? 'border-[#4DA3FF] bg-[#122438]'
                        : 'border-[#24364A] bg-[#07111F] hover:border-[#4DA3FF]/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#4DA3FF]">{d.id}</span>
                        <span>·</span>
                        <span className="text-[#F4F7FA] font-bold">BIN {d.location.binDisplay}</span>
                        <span>·</span>
                        <span className="text-[#8FA4B8]">{d.sku}</span>
                      </div>
                      <div className="text-[10px] text-[#8FA4B8] mt-0.5 truncate max-w-md">
                        {d.explanation.what}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          d.risk.level === 'CRITICAL'
                            ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border-[#FF5C6C]/40'
                            : 'bg-[#F5B942]/20 text-[#F5B942] border-[#F5B942]/40'
                        }`}
                      >
                        {d.risk.level}
                      </span>

                      {onNavigateToAnalysis && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectDiscrepancy) onSelectDiscrepancy(d);
                            onNavigateToAnalysis();
                          }}
                          className="px-2 py-0.5 bg-[#4DA3FF] text-[#07111F] font-bold rounded text-[10px] flex items-center gap-1 hover:bg-[#3d8ee6]"
                        >
                          <span>Scan Analysis</span>
                          <ArrowRight className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SIMULATION CONTROLS & SCENARIO SELECTOR (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* SCENARIO PRESETS SELECTOR */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#24364A] pb-1.5 text-xs">
              <span className="font-bold text-[#F4F7FA] uppercase">SCENARIO PRESETS</span>
              <span className="text-[10px] text-[#4DA3FF]">SELECT TEST CASE</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {(
                [
                  { id: 'NORMAL', label: 'NORMAL BASELINE', desc: '0% Discrepancies' },
                  { id: 'MISSING', label: 'MISSING ITEM', desc: 'Empty Slots' },
                  { id: 'QUANTITY_MISMATCH', label: 'QTY MISMATCH', desc: 'Unit Variance' },
                  { id: 'WRONG_LOCATION', label: 'WRONG LOCATION', desc: 'Cross-Aisle' },
                  { id: 'UNEXPECTED_ITEM', label: 'UNEXPECTED ITEM', desc: 'Foreign Boxes' },
                  { id: 'PERSISTENT', label: 'PERSISTENT', desc: 'Multi-Scan' },
                ] as const
              ).map((preset) => {
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-2 rounded text-left transition-all border ${
                      isSelected
                        ? 'bg-[#4DA3FF] text-[#07111F] border-[#4DA3FF] font-bold shadow'
                        : 'bg-[#07111F] text-[#8FA4B8] border-[#24364A] hover:border-[#4DA3FF]/60 hover:text-[#F4F7FA]'
                    }`}
                  >
                    <div className="text-[10px] font-bold truncate">{preset.label}</div>
                    <div className={`text-[8px] ${isSelected ? 'text-[#07111F]/80' : 'text-[#8FA4B8]/70'}`}>
                      {preset.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SIMULATION SLIDERS & CONFIGURATION */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#24364A] pb-1.5 text-xs">
              <span className="font-bold text-[#F4F7FA] uppercase">FLIGHT & OPTICS CONTROLS</span>
              <Sliders className="h-3.5 w-3.5 text-[#4DA3FF]" />
            </div>

            <div className="space-y-3 text-xs">
              {/* Altitude Slider */}
              <div>
                <div className="flex justify-between text-[#8FA4B8] mb-1">
                  <span>ALTITUDE</span>
                  <span className="text-[#4DA3FF] font-bold">{altitude.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min={2.0}
                  max={7.0}
                  step={0.5}
                  value={altitude}
                  onChange={(e) => setAltitude(parseFloat(e.target.value))}
                  className="w-full accent-[#4DA3FF]"
                />
                <div className="flex justify-between text-[8px] text-[#8FA4B8]/70">
                  <span>2.0m (High Res)</span>
                  <span>Footprint: {cameraFootprint.area} m²</span>
                  <span>7.0m (Wide Area)</span>
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
                <div className="flex justify-between text-[8px] text-[#8FA4B8]/70">
                  <span>60° (Telephoto)</span>
                  <span>110° (Ultra-Wide)</span>
                </div>
              </div>

              {/* Discrepancy Rate Slider */}
              <div>
                <div className="flex justify-between text-[#8FA4B8] mb-1">
                  <span>DISCREPANCY INJECTION RATE</span>
                  <span className="text-[#F5B942] font-bold">{discrepancyRate}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={discrepancyRate}
                  onChange={(e) => {
                    setActivePreset('CUSTOM');
                    setDiscrepancyRate(parseInt(e.target.value, 10));
                  }}
                  className="w-full accent-[#F5B942]"
                />
                <div className="flex justify-between text-[8px] text-[#8FA4B8]/70">
                  <span>0% (Clean Ledger)</span>
                  <span>50% (High Fault Rate)</span>
                </div>
              </div>

              {/* Flight Speed Slider */}
              <div>
                <div className="flex justify-between text-[#8FA4B8] mb-1">
                  <span>FLIGHT SPEED</span>
                  <span className="text-[#F4F7FA] font-bold">{flightSpeed.toFixed(1)} m/s</span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={2.5}
                  step={0.2}
                  value={flightSpeed}
                  onChange={(e) => setFlightSpeed(parseFloat(e.target.value))}
                  className="w-full accent-[#4DA3FF]"
                />
                <div className="flex justify-between text-[8px] text-[#8FA4B8]/70">
                  <span>0.4 m/s (Hover Precision)</span>
                  <span>2.5 m/s (Fast Transit)</span>
                </div>
              </div>

              {/* Warehouse Size & Racks Configuration */}
              <div className="pt-2 border-t border-[#24364A]/60">
                <div className="flex justify-between text-[#8FA4B8] mb-1">
                  <span>NUMBER OF RACKS</span>
                  <span className="text-[#4DA3FF] font-bold">{rackCount} Racks</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={8}
                  step={1}
                  value={rackCount}
                  onChange={(e) => setRackCount(parseInt(e.target.value, 10))}
                  className="w-full accent-[#4DA3FF]"
                />
                <div className="flex justify-between text-[8px] text-[#8FA4B8]/70">
                  <span>2 Racks (Compact)</span>
                  <span>Total SKUs: {rackCount * binsPerRack}</span>
                  <span>8 Racks (High-Bay)</span>
                </div>
              </div>

              {/* Bins Per Rack */}
              <div>
                <div className="flex justify-between text-[#8FA4B8] mb-1">
                  <span>BINS PER RACK</span>
                  <span className="text-[#4DA3FF] font-bold">{binsPerRack} Bins</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={8}
                  step={2}
                  value={binsPerRack}
                  onChange={(e) => setBinsPerRack(parseInt(e.target.value, 10))}
                  className="w-full accent-[#4DA3FF]"
                />
              </div>

              {/* Scan Density Mode */}
              <div>
                <div className="text-[#8FA4B8] mb-1 text-[10px]">SCAN DENSITY</div>
                <div className="grid grid-cols-3 gap-1">
                  {(['LOW', 'STANDARD', 'HIGH'] as const).map((density) => (
                    <button
                      key={density}
                      onClick={() => setScanDensity(density)}
                      className={`py-1 text-[10px] font-bold rounded border transition-colors ${
                        scanDensity === density
                          ? 'bg-[#4DA3FF] text-[#07111F] border-[#4DA3FF]'
                          : 'bg-[#07111F] text-[#8FA4B8] border-[#24364A] hover:text-[#F4F7FA]'
                      }`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FAULT INJECTION MATRIX */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-2">
            <div className="text-[11px] font-bold text-[#F4F7FA] uppercase border-b border-[#24364A] pb-1.5">
              FAULT INJECTION MATRIX
            </div>
            <div className="space-y-1.5 text-xs">
              {[
                { id: 'quantityMismatch', label: 'Quantity Mismatch' },
                { id: 'missingItems', label: 'Missing Inventory' },
                { id: 'wrongLocation', label: 'Wrong Location' },
                { id: 'unexpectedItems', label: 'Unexpected Foreign Item' },
                { id: 'labelMismatch', label: 'Label / Barcode Mismatch' },
                { id: 'persistentDiscrepancy', label: 'Persistent Multi-Scan' },
              ].map((item) => {
                const key = item.id as keyof typeof faults;
                const checked = faults[key];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleFault(key)}
                    className="flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-[#122438] transition-colors"
                  >
                    {checked ? (
                      <CheckSquare className="h-3.5 w-3.5 text-[#4DA3FF]" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-[#8FA4B8]" />
                    )}
                    <span className={checked ? 'text-[#F4F7FA] font-semibold' : 'text-[#8FA4B8]'}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
