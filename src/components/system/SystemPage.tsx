/**
 * AEROVUE SYSTEM, RISK & ARCHITECTURE COMMAND WORKSTATION
 *
 * Integrated Engineering Modules:
 * 1. RISK & RELIABILITY:
 *    - 10-Item Technical Risk Register (R-01 through R-10)
 *    - Restrained Warning Dashboard: ACTIVE RISKS, MITIGATED RISKS, CRITICAL RISKS
 *    - System Failsafes: Low Confidence -> FLAG, Inconsistent Data -> REVIEW,
 *      Comms Loss -> SAFE STATE, Detection Failure -> RE-SCAN.
 *    - Golden Mandate: "The system must never silently convert uncertain observations into confirmed discrepancies."
 *
 * 2. SYSTEM ARCHITECTURE & FUTURE UAV INTEGRATION:
 *    - Visual 9-Stage Architecture Diagram (Exportable for Competition Presentation)
 *    - Replaceable Interfaces: ImageSource, TelemetrySource, MissionController,
 *      PerceptionEngine, InventoryProvider, DiscrepancyEngine, RiskEngine.
 *    - SimulatedTelemetry live feed with GPS lat/lon, altitude, heading, speed, battery.
 *    - Future hardware markers: UAVCameraSource, RealTelemetrySource, UAVMissionController.
 *
 * 3. SUBSYSTEM DIAGNOSTICS & HEALTH:
 *    - Module health matrix, latency telemetry, and system uptime.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  TechnicalRiskItem,
  ArchitectureNode,
  FailsafeAction,
  TechnicalRiskLevel,
} from '../../types';
import {
  TECHNICAL_RISK_REGISTER,
  SYSTEM_ARCHITECTURE_PIPELINE,
} from '../../data/mockRiskData';
import {
  SimulatedTelemetry,
  TelemetryData,
} from '../../services/hardwareAbstraction';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Server,
  Activity,
  Cpu,
  Layers,
  ArrowRight,
  ArrowDown,
  Download,
  Copy,
  Check,
  Radio,
  Wifi,
  Compass,
  Camera,
  Play,
  RotateCcw,
  Sliders,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertOctagon,
  FileText,
  Boxes,
} from 'lucide-react';

export const SystemPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'RISK_RELIABILITY' | 'ARCHITECTURE' | 'DIAGNOSTICS'
  >('RISK_RELIABILITY');

  // Risk Register State
  const [riskList, setRiskList] = useState<TechnicalRiskItem[]>(
    () => TECHNICAL_RISK_REGISTER
  );
  const [selectedRisk, setSelectedRisk] = useState<TechnicalRiskItem | null>(
    riskList[0] || null
  );
  const [riskFilterLevel, setRiskFilterLevel] = useState<
    'ALL' | TechnicalRiskLevel
  >('ALL');
  const [riskFilterStatus, setRiskFilterStatus] = useState<
    'ALL' | 'ACTIVE' | 'MITIGATED' | 'CRITICAL'
  >('ALL');

  // Failsafe interactive testing simulator
  const [activeFailsafeTest, setActiveFailsafeTest] = useState<{
    trigger: string;
    action: FailsafeAction;
    rule: string;
    outcomeText: string;
    timestamp: string;
  } | null>(null);

  // Live Simulated Telemetry Stream
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    latitude: 37.774929,
    longitude: -122.419416,
    altitude: 3.5,
    heading: 92.4,
    speed: 0.8,
    battery: 84.5,
    timestamp: new Date().toISOString(),
    droneId: 'AeroVue-Raven-04 (Simulated)',
    status: 'ARMED_FLYING',
  });

  // Selected Architecture Node for Inspector
  const [selectedArchNode, setSelectedArchNode] = useState<ArchitectureNode>(
    SYSTEM_ARCHITECTURE_PIPELINE[0]
  );
  const [copiedArchitecture, setCopiedArchitecture] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Poll simulated telemetry gently
  useEffect(() => {
    const teleProvider = new SimulatedTelemetry();
    const interval = setInterval(async () => {
      const data = await teleProvider.getTelemetry();
      // Add subtle dynamic variance
      const jitterLat = (Math.random() - 0.5) * 0.00002;
      const jitterLon = (Math.random() - 0.5) * 0.00002;
      const jitterHead = (Math.random() - 0.5) * 0.4;
      setTelemetry((prev) => ({
        ...data,
        latitude: Number((prev.latitude + jitterLat).toFixed(6)),
        longitude: Number((prev.longitude + jitterLon).toFixed(6)),
        heading: Number((prev.heading + jitterHead).toFixed(1)),
        battery: Math.max(20, Number((prev.battery - 0.01).toFixed(1))),
        timestamp: new Date().toISOString(),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Filtered risks
  const filteredRisks = useMemo(() => {
    return riskList.filter((r) => {
      if (riskFilterLevel !== 'ALL' && r.riskLevel !== riskFilterLevel) return false;
      if (riskFilterStatus === 'CRITICAL' && r.riskLevel !== 'CRITICAL') return false;
      if (
        riskFilterStatus !== 'ALL' &&
        riskFilterStatus !== 'CRITICAL' &&
        r.status !== riskFilterStatus
      )
        return false;
      return true;
    });
  }, [riskList, riskFilterLevel, riskFilterStatus]);

  // Risk Counts
  const activeCount = useMemo(
    () => riskList.filter((r) => r.status === 'ACTIVE').length,
    [riskList]
  );
  const mitigatedCount = useMemo(
    () => riskList.filter((r) => r.status === 'MITIGATED').length,
    [riskList]
  );
  const criticalCount = useMemo(
    () => riskList.filter((r) => r.riskLevel === 'CRITICAL').length,
    [riskList]
  );

  // Toggle risk mitigation status
  const handleToggleMitigation = (riskId: string) => {
    setRiskList((prev) =>
      prev.map((r) => {
        if (r.riskId !== riskId) return r;
        const newStatus = r.status === 'MITIGATED' ? 'ACTIVE' : 'MITIGATED';
        return { ...r, status: newStatus };
      })
    );
    if (selectedRisk?.riskId === riskId) {
      setSelectedRisk((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === 'MITIGATED' ? 'ACTIVE' : 'MITIGATED',
            }
          : null
      );
    }
    showToast(`Updated mitigation status for ${riskId}.`);
  };

  // Simulate Failsafe Execution
  const handleTestFailsafe = (
    trigger: string,
    action: FailsafeAction,
    rule: string,
    outcome: string
  ) => {
    setActiveFailsafeTest({
      trigger,
      action,
      rule,
      outcomeText: outcome,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });
    showToast(`Executed deterministic failsafe: [${action}]`);
  };

  // Copy Architecture Spec to Clipboard
  const handleCopyArchitectureSpec = () => {
    const spec = `
================================================================================
AEROVUE INDUSTRIAL UAV DISCREPANCY INTELLIGENCE ARCHITECTURE
================================================================================
UAV / SIMULATION
        ↓
IMAGE + TELEMETRY
        ↓
AEROVUE INGESTION
        ↓
PERCEPTION ENGINE
        ↓
SPATIAL CORRELATION
        ↓
DISCREPANCY ENGINE
        ↓
CONFIDENCE + RISK
        ↓
EXPLAINABLE INTELLIGENCE
        ↓
OPERATOR
================================================================================
REPLACEABLE HARDWARE INTERFACES:
1. ImageSource           -> UploadedImageSource, SimulationImageSource, UAVCameraSource [FUTURE]
2. TelemetrySource       -> SimulatedTelemetry, RealTelemetrySource [FUTURE MAVLink/ROS2]
3. MissionController     -> SimulationMissionController, UAVMissionController [FUTURE]
4. PerceptionEngine      -> detectObjects(), estimateConfidence()
5. InventoryProvider     -> getLedger(), getExpectedByLocation(), reconcile()
6. DiscrepancyEngine     -> correlateEvidence()
7. RiskEngine            -> calculateRisk()
================================================================================
FAILSAFE MANDATE:
"The system must never silently convert uncertain observations into confirmed discrepancies."
- If confidence is low:       FLAG
- If data is inconsistent:    REVIEW
- If communication fails:     SAFE STATE
- If detection fails:         RE-SCAN
================================================================================
    `.trim();

    navigator.clipboard.writeText(spec);
    setCopiedArchitecture(true);
    showToast('Architecture specification copied to clipboard for presentation.');
    setTimeout(() => setCopiedArchitecture(false), 3000);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 font-mono select-none">
      {/* 1. Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#24364A] pb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F7FA] font-display">
              AEROVUE RELIABILITY &amp; ARCHITECTURE
            </h1>
            <span className="text-[10px] uppercase bg-[#122438] text-[#4DA3FF] px-2 py-0.5 rounded border border-[#24364A] font-bold">
              ENGINEERING SOUNDNESS
            </span>
          </div>
          <p className="text-xs text-[#8FA4B8] mt-1">
            Technical risk register, deterministic system failsafes, and modular UAV architecture interfaces
          </p>
        </div>

        {/* Top Tab Bar */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0D1B2A] border border-[#24364A] text-xs">
          <button
            onClick={() => setActiveTab('RISK_RELIABILITY')}
            className={`px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'RISK_RELIABILITY'
                ? 'bg-[#122438] text-[#4DA3FF] border border-[#24364A] shadow-sm'
                : 'text-[#8FA4B8] hover:text-[#F4F7FA]'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>RISK &amp; RELIABILITY</span>
          </button>

          <button
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'ARCHITECTURE'
                ? 'bg-[#122438] text-[#4DA3FF] border border-[#24364A] shadow-sm'
                : 'text-[#8FA4B8] hover:text-[#F4F7FA]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>UAV ARCHITECTURE</span>
          </button>

          <button
            onClick={() => setActiveTab('DIAGNOSTICS')}
            className={`px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'DIAGNOSTICS'
                ? 'bg-[#122438] text-[#4DA3FF] border border-[#24364A] shadow-sm'
                : 'text-[#8FA4B8] hover:text-[#F4F7FA]'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>DIAGNOSTICS</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-2.5 rounded border border-[#39D98A]/50 bg-[#39D98A]/10 text-xs text-[#39D98A] flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{toastMessage}</span>
          </div>
          <span className="text-[10px] text-[#8FA4B8]">SYSTEM LOGGED</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: RISK & RELIABILITY MODULE                               */}
      {/* ============================================================== */}
      {activeTab === 'RISK_RELIABILITY' && (
        <div className="space-y-6">
          {/* Top Mandate Banner */}
          <div className="rounded-lg border border-[#24364A] bg-[#0D1B2A] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-start md:items-center gap-3">
              <div className="p-2.5 rounded bg-[#122438] border border-[#24364A] text-[#4DA3FF] shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[#F4F7FA] font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span>CORE FAILSAFE POLICY MANDATE</span>
                  <span className="text-[9px] bg-[#39D98A]/20 text-[#39D98A] px-1.5 py-0.2 rounded border border-[#39D98A]/40 font-mono">
                    VERIFIED
                  </span>
                </div>
                <p className="text-[#8FA4B8] text-[11px] mt-0.5 leading-relaxed">
                  &ldquo;<span className="text-[#F4F7FA] font-semibold">The system must never silently convert uncertain observations into confirmed discrepancies.</span>&rdquo;
                  All variance assertions require minimum confidence thresholds and deterministic failsafe routing.
                </p>
              </div>
            </div>

            {/* Restrained Warning Status Counts */}
            <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-[#24364A] pt-2 md:pt-0 md:pl-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#F5B942]" />
                <span className="text-[#8FA4B8]">ACTIVE RISKS:</span>
                <strong className="text-[#F5B942] tabular-nums">{activeCount}</strong>
              </div>
              <span className="text-[#24364A]">|</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#39D98A]" />
                <span className="text-[#8FA4B8]">MITIGATED:</span>
                <strong className="text-[#39D98A] tabular-nums">{mitigatedCount}</strong>
              </div>
              <span className="text-[#24364A]">|</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FF5C6C]" />
                <span className="text-[#8FA4B8]">CRITICAL:</span>
                <strong className="text-[#FF5C6C] tabular-nums">{criticalCount}</strong>
              </div>
            </div>
          </div>

          {/* Three Restrained Risk Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* 1. ACTIVE RISKS */}
            <div
              onClick={() => setRiskFilterStatus(riskFilterStatus === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
              className={`p-3.5 rounded-lg border bg-[#0D1B2A] cursor-pointer transition-colors space-y-1.5 ${
                riskFilterStatus === 'ACTIVE'
                  ? 'border-[#F5B942] ring-1 ring-[#F5B942]/30'
                  : 'border-[#24364A] hover:border-[#F5B942]/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8FA4B8] uppercase font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#F5B942]" />
                  ACTIVE RISKS
                </span>
                <span className="text-[9px] bg-[#122438] text-[#8FA4B8] px-1.5 py-0.2 rounded border border-[#24364A]">
                  RESTRAINED
                </span>
              </div>
              <div className="text-2xl font-bold text-[#F5B942] tabular-nums">
                {activeCount}
              </div>
              <p className="text-[10px] text-[#8FA4B8] leading-tight">
                Risks under active operational monitoring in warehouse environments
              </p>
            </div>

            {/* 2. MITIGATED RISKS */}
            <div
              onClick={() => setRiskFilterStatus(riskFilterStatus === 'MITIGATED' ? 'ALL' : 'MITIGATED')}
              className={`p-3.5 rounded-lg border bg-[#0D1B2A] cursor-pointer transition-colors space-y-1.5 ${
                riskFilterStatus === 'MITIGATED'
                  ? 'border-[#39D98A] ring-1 ring-[#39D98A]/30'
                  : 'border-[#24364A] hover:border-[#39D98A]/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8FA4B8] uppercase font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#39D98A]" />
                  MITIGATED RISKS
                </span>
                <span className="text-[9px] bg-[#122438] text-[#8FA4B8] px-1.5 py-0.2 rounded border border-[#24364A]">
                  CONTROLLED
                </span>
              </div>
              <div className="text-2xl font-bold text-[#39D98A] tabular-nums">
                {mitigatedCount}
              </div>
              <p className="text-[10px] text-[#8FA4B8] leading-tight">
                Software controls, physical limits, and temporal filters active
              </p>
            </div>

            {/* 3. CRITICAL RISKS */}
            <div
              onClick={() => setRiskFilterStatus(riskFilterStatus === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
              className={`p-3.5 rounded-lg border bg-[#0D1B2A] cursor-pointer transition-colors space-y-1.5 ${
                riskFilterStatus === 'CRITICAL'
                  ? 'border-[#FF5C6C] ring-1 ring-[#FF5C6C]/30'
                  : 'border-[#24364A] hover:border-[#FF5C6C]/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8FA4B8] uppercase font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#FF5C6C]" />
                  CRITICAL RISKS
                </span>
                <span className="text-[9px] bg-[#FF5C6C]/20 text-[#FF5C6C] px-1.5 py-0.2 rounded border border-[#FF5C6C]/40">
                  FAILSAFE PROTECTED
                </span>
              </div>
              <div className="text-2xl font-bold text-[#FF5C6C] tabular-nums">
                {criticalCount}
              </div>
              <p className="text-[10px] text-[#8FA4B8] leading-tight">
                Avionics comms loss, GPS drift &amp; corrupted inventory ledger records
              </p>
            </div>
          </div>

          {/* SYSTEM FAILSAFE STATE MACHINE MATRIX */}
          <div className="rounded-lg border border-[#24364A] bg-[#0D1B2A] p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#24364A] pb-2.5">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-[#4DA3FF]" />
                <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider">
                  SYSTEM FAILSAFE EXECUTION MATRIX
                </h3>
              </div>
              <span className="text-[10px] text-[#8FA4B8]">
                DETERMINISTIC BEHAVIORAL SPECIFICATION
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
              {/* 1. Low Confidence -> FLAG */}
              <div className="p-3 rounded border border-[#24364A] bg-[#07111F] space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8FA4B8] uppercase font-bold">CONDITION</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#4DA3FF]/20 text-[#4DA3FF] border border-[#4DA3FF]/40">
                      ACTION: FLAG
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#F4F7FA]">If confidence is low (&lt; 85%)</div>
                  <p className="text-[11px] text-[#8FA4B8] leading-tight">
                    Never auto-write off. Locks autonomous reconciliation and routes to human operator.
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleTestFailsafe(
                      'Low Confidence Detection (< 70%)',
                      'FLAG',
                      'Confidence threshold violation',
                      'Automated ledger write-off locked. Finding flagged for operator visual audit.'
                    )
                  }
                  className="w-full mt-2 py-1 bg-[#122438] hover:bg-[#18314d] text-[#4DA3FF] rounded border border-[#24364A] text-[10px] font-bold transition-colors"
                >
                  SIMULATE: TEST FLAG
                </button>
              </div>

              {/* 2. Inconsistent Data -> REVIEW */}
              <div className="p-3 rounded border border-[#24364A] bg-[#07111F] space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8FA4B8] uppercase font-bold">CONDITION</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/40">
                      ACTION: REVIEW
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#F4F7FA]">If data is inconsistent</div>
                  <p className="text-[11px] text-[#8FA4B8] leading-tight">
                    WMS ledger key mismatches or negative balances quarantined for supervisor review.
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleTestFailsafe(
                      'Corrupt WMS Record (Negative Stock)',
                      'REVIEW',
                      'Ledger inconsistency detected',
                      'Inventory record quarantined with WMS_INCONSISTENCY tag. Prevented database corruption.'
                    )
                  }
                  className="w-full mt-2 py-1 bg-[#122438] hover:bg-[#18314d] text-[#F5B942] rounded border border-[#24364A] text-[10px] font-bold transition-colors"
                >
                  SIMULATE: TEST REVIEW
                </button>
              </div>

              {/* 3. Communication Loss -> SAFE STATE */}
              <div className="p-3 rounded border border-[#24364A] bg-[#07111F] space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8FA4B8] uppercase font-bold">CONDITION</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FF5C6C]/20 text-[#FF5C6C] border border-[#FF5C6C]/40">
                      ACTION: SAFE STATE
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#F4F7FA]">If communication fails (&gt; 3s)</div>
                  <p className="text-[11px] text-[#8FA4B8] leading-tight">
                    Onboard PX4 flight controller executes 5s hover hold, climbs to clearance altitude, and RTHs.
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleTestFailsafe(
                      'Telemetry Heartbeat Dropout (> 3.0s)',
                      'SAFE_STATE',
                      'Wireless link interruption',
                      'Autonomous flight stopped. Hover-hold established at Z=4.5m. Return-to-Dock triggered.'
                    )
                  }
                  className="w-full mt-2 py-1 bg-[#122438] hover:bg-[#18314d] text-[#FF5C6C] rounded border border-[#24364A] text-[10px] font-bold transition-colors"
                >
                  SIMULATE: SAFE STATE
                </button>
              </div>

              {/* 4. Detection Fails -> RE-SCAN */}
              <div className="p-3 rounded border border-[#24364A] bg-[#07111F] space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8FA4B8] uppercase font-bold">CONDITION</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#39D98A]/20 text-[#39D98A] border border-[#39D98A]/40">
                      ACTION: RE-SCAN
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#F4F7FA]">If detection fails (Blur / Occlusion)</div>
                  <p className="text-[11px] text-[#8FA4B8] leading-tight">
                    Optical blur or occlusion triggers waypoint hold and schedules multi-view angle re-sweep.
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleTestFailsafe(
                      'Optical Motion Blur Exceeded Threshold',
                      'RE_SCAN',
                      'Image gradient blur detection',
                      'Frame rejected. Drone flight path inserted 0.5s hover hold with 15° oblique re-capture.'
                    )
                  }
                  className="w-full mt-2 py-1 bg-[#122438] hover:bg-[#18314d] text-[#39D98A] rounded border border-[#24364A] text-[10px] font-bold transition-colors"
                >
                  SIMULATE: TEST RE-SCAN
                </button>
              </div>
            </div>

            {/* Active Failsafe Test Trace Banner */}
            {activeFailsafeTest && (
              <div className="p-3 rounded border border-[#4DA3FF]/50 bg-[#07111F] text-xs space-y-1 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#4DA3FF] font-bold uppercase">
                    ACTIVE FAILSAFE EXECUTION TRACE
                  </span>
                  <span className="text-[10px] text-[#8FA4B8]">{activeFailsafeTest.timestamp}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#8FA4B8]">TRIGGER:</span>
                  <strong className="text-[#F4F7FA]">{activeFailsafeTest.trigger}</strong>
                  <span className="text-[#8FA4B8]">→ ACTION:</span>
                  <span className="px-1.5 py-0.2 bg-[#4DA3FF]/20 text-[#4DA3FF] rounded border border-[#4DA3FF]/40 font-bold">
                    {activeFailsafeTest.action}
                  </span>
                </div>
                <p className="text-[11px] text-[#39D98A] pt-0.5">
                  &bull; {activeFailsafeTest.outcomeText}
                </p>
              </div>
            )}
          </div>

          {/* TECHNICAL RISK REGISTER (R-01 TO R-10) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#4DA3FF]" />
                <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider">
                  TECHNICAL RISK REGISTER (R-01 THROUGH R-10)
                </h3>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={riskFilterLevel}
                  onChange={(e) => setRiskFilterLevel(e.target.value as any)}
                  className="bg-[#0D1B2A] border border-[#24364A] text-[#8FA4B8] hover:text-[#F4F7FA] px-2 py-1 rounded text-xs focus:outline-none"
                >
                  <option value="ALL">ALL RISK LEVELS</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>

                <select
                  value={riskFilterStatus}
                  onChange={(e) => setRiskFilterStatus(e.target.value as any)}
                  className="bg-[#0D1B2A] border border-[#24364A] text-[#8FA4B8] hover:text-[#F4F7FA] px-2 py-1 rounded text-xs focus:outline-none"
                >
                  <option value="ALL">ALL STATUSES</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="MITIGATED">MITIGATED</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            {/* Risk Register Table */}
            <div className="rounded-lg border border-[#24364A] bg-[#0D1B2A] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#07111F] border-b border-[#24364A] text-[#8FA4B8] uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">RISK ID</th>
                      <th className="py-2.5 px-3">TECHNICAL RISK</th>
                      <th className="py-2.5 px-3">PROBABILITY</th>
                      <th className="py-2.5 px-3">IMPACT</th>
                      <th className="py-2.5 px-3">RISK LEVEL</th>
                      <th className="py-2.5 px-3">FAILSAFE</th>
                      <th className="py-2.5 px-3">STATUS</th>
                      <th className="py-2.5 px-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#24364A]/60 font-mono">
                    {filteredRisks.map((item) => {
                      const isSelected = selectedRisk?.riskId === item.riskId;
                      const isCritical = item.riskLevel === 'CRITICAL';
                      const isHigh = item.riskLevel === 'HIGH';
                      const isMedium = item.riskLevel === 'MEDIUM';

                      return (
                        <tr
                          key={item.riskId}
                          onClick={() => setSelectedRisk(item)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#122438] border-l-2 border-l-[#4DA3FF]'
                              : 'hover:bg-[#122438]/50'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-bold text-[#4DA3FF]">
                            {item.riskId}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-[#F4F7FA]">{item.risk}</div>
                            <div className="text-[10px] text-[#8FA4B8] truncate max-w-xs">
                              {item.category} &bull; {item.mitigation}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-[#8FA4B8]">{item.probability}</td>
                          <td className="py-2.5 px-3 text-[#8FA4B8]">{item.impact}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                isCritical
                                  ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border-[#FF5C6C]/40'
                                  : isHigh
                                  ? 'bg-[#F5B942]/20 text-[#F5B942] border-[#F5B942]/40'
                                  : isMedium
                                  ? 'bg-[#4DA3FF]/20 text-[#4DA3FF] border-[#4DA3FF]/40'
                                  : 'bg-[#8FA4B8]/20 text-[#8FA4B8] border-[#8FA4B8]/40'
                              }`}
                            >
                              {item.riskLevel}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold text-[#F4F7FA] bg-[#07111F] px-1.5 py-0.5 rounded border border-[#24364A]">
                              {item.failsafeAction}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[10px] font-bold ${
                                item.status === 'MITIGATED'
                                  ? 'text-[#39D98A]'
                                  : 'text-[#F5B942]'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td
                            className="py-2.5 px-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleToggleMitigation(item.riskId)}
                              className="px-2 py-0.5 rounded bg-[#07111F] border border-[#24364A] hover:border-[#4DA3FF] text-[10px] text-[#8FA4B8] hover:text-[#F4F7FA] transition-colors"
                            >
                              {item.status === 'MITIGATED' ? 'MARK ACTIVE' : 'MARK MITIGATED'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Risk Detailed Card */}
            {selectedRisk && (
              <div className="rounded-lg border border-[#24364A] bg-[#0D1B2A] p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#24364A] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#4DA3FF]">
                      {selectedRisk.riskId}: {selectedRisk.risk}
                    </span>
                    <span className="text-[10px] bg-[#122438] text-[#8FA4B8] px-2 py-0.5 rounded border border-[#24364A]">
                      CATEGORY: {selectedRisk.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#8FA4B8]">
                      PROBABILITY: <strong className="text-[#F4F7FA]">{selectedRisk.probability}</strong>
                    </span>
                    <span>&bull;</span>
                    <span className="text-[#8FA4B8]">
                      IMPACT: <strong className="text-[#FF5C6C]">{selectedRisk.impact}</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded bg-[#07111F] border border-[#24364A] space-y-1">
                    <span className="text-[10px] text-[#39D98A] uppercase font-bold block">
                      ENGINEERING MITIGATION:
                    </span>
                    <p className="text-[11px] text-[#F4F7FA] leading-relaxed">
                      {selectedRisk.mitigation}
                    </p>
                  </div>

                  <div className="p-3 rounded bg-[#07111F] border border-[#24364A] space-y-1">
                    <span className="text-[10px] text-[#F5B942] uppercase font-bold block">
                      FAILSAFE FALLBACK PROCEDURE:
                    </span>
                    <p className="text-[11px] text-[#F4F7FA] leading-relaxed">
                      {selectedRisk.fallback}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SYSTEM ARCHITECTURE & FUTURE UAV INTEGRATION            */}
      {/* ============================================================== */}
      {activeTab === 'ARCHITECTURE' && (
        <div className="space-y-6">
          {/* Top Banner with Export Button */}
          <div className="rounded-lg border border-[#24364A] bg-[#0D1B2A] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#4DA3FF]" />
                <h2 className="text-sm font-bold text-[#F4F7FA] font-display uppercase tracking-wider">
                  END-TO-END SYSTEM ARCHITECTURE PIPELINE
                </h2>
              </div>
              <p className="text-xs text-[#8FA4B8] mt-0.5">
                9-stage processing chain from UAV perception to human operator decision. Fully modularized with replaceable interfaces.
              </p>
            </div>

            <button
              onClick={handleCopyArchitectureSpec}
              className="px-3.5 py-1.5 bg-[#4DA3FF] hover:bg-[#3d8ee6] text-[#07111F] font-bold rounded transition-colors flex items-center gap-1.5 shrink-0 shadow-md shadow-[#4DA3FF]/20"
            >
              {copiedArchitecture ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>SPEC COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>EXPORT FOR PRESENTATION</span>
                </>
              )}
            </button>
          </div>

          {/* VISUAL ARCHITECTURE FLOW DIAGRAM */}
          <div className="rounded-lg border border-[#24364A] bg-[#0D1B2A] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#24364A] pb-2 text-xs">
              <span className="font-bold text-[#F4F7FA] uppercase tracking-wider">
                ARCHITECTURE FLOW: SENSE → DETECT → CORRELATE → ASSESS → DECIDE
              </span>
              <span className="text-[10px] text-[#8FA4B8]">
                CLICK ANY NODE TO INSPECT CONTRACT INTERFACES
              </span>
            </div>

            {/* Vertical Flow Diagram with Connecting Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-2">
              {SYSTEM_ARCHITECTURE_PIPELINE.map((node, idx) => {
                const isSelected = selectedArchNode.id === node.id;
                const isFuture = node.hardwareState === 'FUTURE_HARDWARE';
                const isSimulation = node.hardwareState === 'CURRENT_SIMULATION';

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedArchNode(node)}
                    className={`p-2.5 rounded border bg-[#07111F] cursor-pointer transition-all flex flex-col justify-between relative group ${
                      isSelected
                        ? 'border-[#4DA3FF] ring-1 ring-[#4DA3FF]/40 bg-[#122438]'
                        : 'border-[#24364A] hover:border-[#4DA3FF]/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-[#4DA3FF] bg-[#122438] px-1 rounded">
                          0{node.stepNumber}
                        </span>
                        <span
                          className={`text-[8px] font-bold px-1 py-0.2 rounded border ${
                            isFuture
                              ? 'bg-[#F5B942]/20 text-[#F5B942] border-[#F5B942]/40'
                              : isSimulation
                              ? 'bg-[#4DA3FF]/20 text-[#4DA3FF] border-[#4DA3FF]/40'
                              : 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/40'
                          }`}
                        >
                          {node.type}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-[#F4F7FA] truncate mt-1">
                        {node.title}
                      </div>
                      <div className="text-[10px] text-[#8FA4B8] line-clamp-2">
                        {node.subtitle}
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-[#24364A]/60 flex items-center justify-between text-[9px] text-[#8FA4B8]">
                      <span>{node.interfacesUsed[0]}</span>
                      {idx < SYSTEM_ARCHITECTURE_PIPELINE.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-[#4DA3FF] hidden lg:block opacity-60" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Node Inspector */}
            <div className="p-3.5 rounded border border-[#24364A] bg-[#07111F] text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#24364A] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#4DA3FF]">
                    STAGE 0{selectedArchNode.stepNumber}: {selectedArchNode.title}
                  </span>
                  <span className="text-[10px] text-[#8FA4B8] bg-[#122438] px-2 py-0.5 rounded border border-[#24364A]">
                    {selectedArchNode.subtitle}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    selectedArchNode.hardwareState === 'CURRENT_SIMULATION'
                      ? 'bg-[#4DA3FF]/20 text-[#4DA3FF] border-[#4DA3FF]/40'
                      : 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/40'
                  }`}
                >
                  STATE: {selectedArchNode.hardwareState}
                </span>
              </div>

              <p className="text-[11px] text-[#F4F7FA] leading-relaxed">
                {selectedArchNode.description}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-[#8FA4B8]">
                <span>CORRESPONDING CONTRACT INTERFACES:</span>
                {selectedArchNode.interfacesUsed.map((iface) => (
                  <span
                    key={iface}
                    className="bg-[#122438] text-[#4DA3FF] px-2 py-0.5 rounded border border-[#24364A] font-bold"
                  >
                    {iface}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* REPLACEABLE HARDWARE INTERFACES & LIVE TELEMETRY FEED */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left: 7 Replaceable Interface Cards (8 cols) */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F4F7FA] uppercase tracking-wider">
                  REPLACEABLE HARDWARE INTERFACES MATRIX
                </span>
                <span className="text-[10px] text-[#8FA4B8]">
                  LOOSELY COUPLED CONTRACT ABSTRACTIONS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. ImageSource */}
                <div className="p-3 rounded-lg border border-[#24364A] bg-[#0D1B2A] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F4F7FA] flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-[#4DA3FF]" />
                      ImageSource
                    </span>
                    <span className="text-[9px] bg-[#39D98A]/20 text-[#39D98A] px-1.5 py-0.2 rounded border border-[#39D98A]/40">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8FA4B8]">
                    Asynchronous capture adapter decoupling raw camera payloads from inference engines.
                  </p>
                  <div className="pt-2 border-t border-[#24364A]/60 space-y-1 text-[10px]">
                    <div className="text-[#39D98A]">&bull; UploadedImageSource (User demo files)</div>
                    <div className="text-[#39D98A]">&bull; SimulationImageSource (Virtual sweeps)</div>
                    <div className="text-[#F5B942]">
                      &bull; UAVCameraSource{' '}
                      <span className="bg-[#F5B942]/20 text-[#F5B942] px-1 py-0.2 rounded text-[8px] border border-[#F5B942]/40">
                        FUTURE HARDWARE INTEGRATION
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. TelemetrySource */}
                <div className="p-3 rounded-lg border border-[#24364A] bg-[#0D1B2A] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F4F7FA] flex items-center gap-1.5">
                      <Compass className="h-3.5 w-3.5 text-[#4DA3FF]" />
                      TelemetrySource
                    </span>
                    <span className="text-[9px] bg-[#39D98A]/20 text-[#39D98A] px-1.5 py-0.2 rounded border border-[#39D98A]/40">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8FA4B8]">
                    Provides millisecond position [Lat, Lon, Alt], heading, speed, and battery metrics.
                  </p>
                  <div className="pt-2 border-t border-[#24364A]/60 space-y-1 text-[10px]">
                    <div className="text-[#39D98A]">&bull; SimulatedTelemetry (PX4 SITL simulator)</div>
                    <div className="text-[#F5B942]">
                      &bull; RealTelemetrySource{' '}
                      <span className="bg-[#F5B942]/20 text-[#F5B942] px-1 py-0.2 rounded text-[8px] border border-[#F5B942]/40">
                        FUTURE HARDWARE INTEGRATION
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. MissionController */}
                <div className="p-3 rounded-lg border border-[#24364A] bg-[#0D1B2A] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F4F7FA] flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 text-[#4DA3FF]" />
                      MissionController
                    </span>
                    <span className="text-[9px] bg-[#39D98A]/20 text-[#39D98A] px-1.5 py-0.2 rounded border border-[#39D98A]/40">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8FA4B8]">
                    Generates autonomous lawnmower sweeping paths, arming state, and RTH abort logic.
                  </p>
                  <div className="pt-2 border-t border-[#24364A]/60 space-y-1 text-[10px]">
                    <div className="text-[#39D98A]">&bull; SimulationMissionController (Virtual)</div>
                    <div className="text-[#F5B942]">
                      &bull; UAVMissionController{' '}
                      <span className="bg-[#F5B942]/20 text-[#F5B942] px-1 py-0.2 rounded text-[8px] border border-[#F5B942]/40">
                        FUTURE HARDWARE INTEGRATION
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. PerceptionEngine */}
                <div className="p-3 rounded-lg border border-[#24364A] bg-[#0D1B2A] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F4F7FA] flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-[#4DA3FF]" />
                      PerceptionEngine
                    </span>
                    <span className="text-[9px] bg-[#39D98A]/20 text-[#39D98A] px-1.5 py-0.2 rounded border border-[#39D98A]/40">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8FA4B8]">
                    detectObjects() &amp; estimateConfidence() extracting bounding boxes and SKU barcodes.
                  </p>
                  <div className="pt-2 border-t border-[#24364A]/60 text-[10px] text-[#39D98A]">
                    &bull; ONNX / TensorRT FP16 quantization architecture ready
                  </div>
                </div>

                {/* 5. InventoryProvider */}
                <div className="p-3 rounded-lg border border-[#24364A] bg-[#0D1B2A] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F4F7FA] flex items-center gap-1.5">
                      <Boxes className="h-3.5 w-3.5 text-[#4DA3FF]" />
                      InventoryProvider
                    </span>
                    <span className="text-[9px] bg-[#39D98A]/20 text-[#39D98A] px-1.5 py-0.2 rounded border border-[#39D98A]/40">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8FA4B8]">
                    Provides WMS enterprise inventory records and receives operator audit reconcile actions.
                  </p>
                  <div className="pt-2 border-t border-[#24364A]/60 text-[10px] text-[#39D98A]">
                    &bull; Decoupled from physical observations to prevent corrupt syncs
                  </div>
                </div>

                {/* 6. DiscrepancyEngine & RiskEngine */}
                <div className="p-3 rounded-lg border border-[#24364A] bg-[#0D1B2A] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F4F7FA] flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-[#4DA3FF]" />
                      Discrepancy &amp; Risk Engines
                    </span>
                    <span className="text-[9px] bg-[#39D98A]/20 text-[#39D98A] px-1.5 py-0.2 rounded border border-[#39D98A]/40">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8FA4B8]">
                    Fuses Visual + Spatial + Inventory + Temporal evidence into explainable findings.
                  </p>
                  <div className="pt-2 border-t border-[#24364A]/60 text-[10px] text-[#39D98A]">
                    &bull; Classifies across 8 variance types with Prototype Confidence score
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Simulated Telemetry Stream HUD (4 cols) */}
            <div className="lg:col-span-4 rounded-lg border border-[#24364A] bg-[#0D1B2A] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#24364A] pb-2 text-xs">
                <div className="flex items-center gap-2">
                  <Wifi className="h-3.5 w-3.5 text-[#39D98A]" />
                  <span className="font-bold text-[#F4F7FA]">SIMULATED TELEMETRY FEED</span>
                </div>
                <span className="text-[9px] bg-[#39D98A]/20 text-[#39D98A] px-1.5 py-0.2 rounded border border-[#39D98A]/40">
                  LIVE (2 Hz)
                </span>
              </div>

              {/* Drone ID and Status */}
              <div className="p-2.5 rounded bg-[#07111F] border border-[#24364A] space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8FA4B8]">DRONE ID:</span>
                  <span className="font-bold text-[#F4F7FA]">{telemetry.droneId}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8FA4B8]">FLIGHT STATE:</span>
                  <span className="text-[#39D98A] font-bold">{telemetry.status}</span>
                </div>
              </div>

              {/* 7 Required Telemetry Fields Grid */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between p-1.5 rounded bg-[#07111F] border border-[#24364A]/60">
                  <span className="text-[#8FA4B8] text-[10px]">LATITUDE:</span>
                  <span className="text-[#F4F7FA] font-bold">{telemetry.latitude}° N</span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-[#07111F] border border-[#24364A]/60">
                  <span className="text-[#8FA4B8] text-[10px]">LONGITUDE:</span>
                  <span className="text-[#F4F7FA] font-bold">{telemetry.longitude}° W</span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-[#07111F] border border-[#24364A]/60">
                  <span className="text-[#8FA4B8] text-[10px]">ALTITUDE:</span>
                  <span className="text-[#4DA3FF] font-bold">{telemetry.altitude} m</span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-[#07111F] border border-[#24364A]/60">
                  <span className="text-[#8FA4B8] text-[10px]">HEADING:</span>
                  <span className="text-[#F4F7FA] font-bold">{telemetry.heading}°</span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-[#07111F] border border-[#24364A]/60">
                  <span className="text-[#8FA4B8] text-[10px]">GROUND SPEED:</span>
                  <span className="text-[#F4F7FA] font-bold">{telemetry.speed} m/s</span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-[#07111F] border border-[#24364A]/60">
                  <span className="text-[#8FA4B8] text-[10px]">BATTERY:</span>
                  <span className="text-[#39D98A] font-bold">{telemetry.battery}%</span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-[#07111F] border border-[#24364A]/60 text-[10px]">
                  <span className="text-[#8FA4B8]">TIMESTAMP:</span>
                  <span className="text-[#8FA4B8] truncate max-w-[180px]">{telemetry.timestamp}</span>
                </div>
              </div>

              {/* Future Hardware Notice */}
              <div className="p-2 rounded bg-[#07111F] border border-[#F5B942]/40 text-[10px] text-[#F5B942] leading-tight">
                <strong>NOTE:</strong> Telemetry is simulated via SITL flight controller. Real hardware MAVLink commands disabled in prototype.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: SUBSYSTEM DIAGNOSTICS & HEALTH                          */}
      {/* ============================================================== */}
      {activeTab === 'DIAGNOSTICS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#24364A] pb-2 text-xs">
            <span className="font-bold text-[#F4F7FA] uppercase tracking-wider">
              REAL-TIME MODULE HEALTH &amp; SUBSYSTEM TELEMETRY
            </span>
            <span className="text-[10px] text-[#39D98A]">ALL SUBSYSTEMS NOMINAL</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                name: 'VISION ENGINE',
                status: 'READY',
                version: 'v2.4-UAV-HEURISTIC (FP16 Ready)',
                subtext: 'Bbox segmentation and barcode crop pipelines verified.',
                color: '#39D98A',
              },
              {
                name: 'DISCREPANCY ENGINE',
                status: 'READY',
                version: 'v3.1-REASONER',
                subtext: 'Cross-correlates WMS ledger with observed aerial coordinates.',
                color: '#39D98A',
              },
              {
                name: 'RISK ENGINE',
                status: 'READY',
                version: 'v1.8-MULTIFACTOR',
                subtext: 'Severity × Confidence × Persistence normalization active.',
                color: '#39D98A',
              },
              {
                name: 'DATABASE ADAPTER',
                status: 'CONNECTED',
                version: 'IN-MEMORY / REST API',
                subtext: 'Facility WH-01 loaded with 11 monitored warehouse bays.',
                color: '#39D98A',
              },
              {
                name: 'UAV SITL SIMULATOR',
                status: 'READY',
                version: 'MAVLINK PX4-SIM',
                subtext: 'Simulated telemetry stream delivering lat, lon, altitude, speed.',
                color: '#39D98A',
              },
              {
                name: 'HARDWARE ABSTRACTION LAYER',
                status: 'CONNECTED',
                version: '7 INTERFACE CONTRACTS',
                subtext: 'Replaceable ImageSource, TelemetrySource, MissionController active.',
                color: '#39D98A',
              },
            ].map((m) => (
              <div
                key={m.name}
                className="p-3.5 rounded border border-[#24364A] bg-[#0D1B2A] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F4F7FA]">{m.name}</span>
                  <span
                    className="text-[11px] font-bold flex items-center gap-1.5"
                    style={{ color: m.color }}
                  >
                    <span
                      className="h-2 w-2 rounded-full animate-pulse"
                      style={{ backgroundColor: m.color }}
                    />
                    <span>{m.status}</span>
                  </span>
                </div>
                <div className="text-[10px] text-[#4DA3FF]">{m.version}</div>
                <div className="text-[11px] text-[#8FA4B8] leading-relaxed pt-1 border-t border-[#24364A]/60">
                  {m.subtext}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
