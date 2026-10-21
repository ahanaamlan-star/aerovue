import React from 'react';
import { WarehouseBin, DiscrepancyRecord, UAVTelemetry, ScanSession } from '../../types';
import { RiskSummary } from '../../services/apiService';
import { AerialFacilityMap } from './AerialFacilityMap';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Scan,
  Percent,
  Clock,
  ArrowRight,
  Eye,
  Radio,
  Camera,
  Activity,
  ChevronRight,
  Cpu,
  Sparkles,
  Boxes,
  Navigation,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface OverviewPageProps {
  summary: RiskSummary;
  bins: WarehouseBin[];
  discrepancies: DiscrepancyRecord[];
  onSelectDiscrepancy: (disc: DiscrepancyRecord) => void;
  onNavigatePage: (page: any) => void;
  telemetry?: UAVTelemetry;
  onOpenJudgeTour?: () => void;
  activeSession?: ScanSession;
  isScanning?: boolean;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  summary,
  bins,
  discrepancies,
  onSelectDiscrepancy,
  onNavigatePage,
  telemetry,
  onOpenJudgeTour,
  activeSession,
  isScanning = false,
}) => {
  // Find high priority discrepancies for the right intelligence panel
  const priorityDiscrepancies = [...discrepancies]
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, 4);

  const handleSelectBin = (bin: WarehouseBin) => {
    if (bin.activeDiscrepancyId) {
      const match = discrepancies.find((d) => d.id === bin.activeDiscrepancyId);
      if (match) {
        onSelectDiscrepancy(match);
        return;
      }
    }
    const byLoc = discrepancies.find((d) => d.location.binDisplay === bin.displayCode);
    if (byLoc) {
      onSelectDiscrepancy(byLoc);
    }
  };

  const TEN_STEP_JOURNEY = [
    { num: 1, step: '1. WAREHOUSE', page: 'overview', hint: 'Digital Twin Facility Topology' },
    { num: 2, step: '2. UAV SCAN', page: 'mission-planner', hint: 'Autonomous Trajectory & Footprint' },
    { num: 3, step: '3. DETECTIONS', page: 'scan-analysis', hint: '3-Panel Computer Vision Workspace' },
    { num: 4, step: '4. DISCREPANCY', page: 'discrepancies', hint: 'Ledger vs Observation Variances' },
    { num: 5, step: '5. EVIDENCE', page: 'scan-analysis', hint: 'Visual & Spatial Sensor Audit Trail' },
    { num: 6, step: '6. REASONING', page: 'scan-analysis', hint: '6-Pillar Explainable AI Dossier' },
    { num: 7, step: '7. RISK', page: 'system', hint: 'Severity × Conf × Persistence Scoring' },
    { num: 8, step: '8. PERSISTENCE', page: 'history', hint: 'Multi-Epoch Longitudinal Tracking' },
    { num: 9, step: '9. SIMULATION', page: 'simulation-lab', hint: 'Engineering Lab & Fault Injection' },
    { num: 10, step: '10. VALIDATION', page: 'validation', hint: '10 Empirical Test Cases (TEST-001–010)' },
  ];

  return (
    <div className="space-y-5">
      {/* Title & Technical Metadata Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#24364A] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F7FA] font-display">
              MISSION OVERVIEW
            </h1>
            <span className="text-[10px] font-mono uppercase bg-[#122438] text-[#4DA3FF] px-2 py-0.5 rounded border border-[#24364A]">
              AUTONOMOUS RUN #04
            </span>
            {onOpenJudgeTour && (
              <button
                onClick={onOpenJudgeTour}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-bold text-[#4DA3FF] bg-[#4DA3FF]/15 hover:bg-[#4DA3FF]/25 border border-[#4DA3FF]/40 rounded transition-all shadow-sm shadow-[#4DA3FF]/10"
                title="Launch 30-Second Judicial Evaluation Tour"
              >
                <Sparkles className="h-3 w-3" />
                <span>30s TOUR</span>
              </button>
            )}
          </div>
          <p className="text-xs text-[#8FA4B8] mt-0.5 font-mono">
            A.U.D.I.T. Autonomous UAV Discrepancy Identification Trials · Real-time inventory intelligence
          </p>
        </div>

        {/* Subtle Technical Metadata HUD */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-mono text-[#8FA4B8]">
          <div className="px-2 py-1 rounded bg-[#0D1B2A] border border-[#24364A]">
            <span className="text-[#8FA4B8]/60">SCAN ID:</span>{' '}
            <span className="text-[#F4F7FA] font-bold">{activeSession?.id || 'SCAN-2026-10-05-A'}</span>
          </div>
          <div className="px-2 py-1 rounded bg-[#0D1B2A] border border-[#24364A]">
            <span className="text-[#8FA4B8]/60">MISSION:</span>{' '}
            <span className="text-[#F4F7FA] font-bold">{activeSession?.warehouseId || 'WH-01'}</span>
          </div>
          <div className="px-2 py-1 rounded bg-[#0D1B2A] border border-[#24364A]">
            <span className="text-[#8FA4B8]/60">ZONE:</span>{' '}
            <span className="text-[#F4F7FA] font-bold">ALL BAYS (A–C)</span>
          </div>
          <div className="px-2 py-1 rounded bg-[#0D1B2A] border border-[#24364A]">
            <span className="text-[#8FA4B8]/60">SENSOR:</span>{' '}
            <span className="text-[#4DA3FF] font-bold">RGB 4K (SIM)</span>
          </div>
          <div className="px-2 py-1 rounded bg-[#0D1B2A] border border-[#24364A]">
            <span className="text-[#8FA4B8]/60">TIME:</span>{' '}
            <span className="text-[#F4F7FA] font-bold">{summary.lastScanTimestamp.split(' ')[1] || '07:14:00'}</span>
          </div>
        </div>
      </div>

      {/* 30-Second Technical Walkthrough Strip for Reviewers & Judges (10 Steps) */}
      <div className="rounded-lg border border-[#24364A] bg-[#0D1B2A] p-2.5 px-3 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 text-xs font-mono">
        <div className="flex items-center justify-between xl:justify-start gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#4DA3FF] animate-pulse" />
            <span className="font-bold text-[#F4F7FA] text-xs uppercase tracking-wider">
              JUDGE 30-SECOND WALKTHROUGH:
            </span>
          </div>
          {onOpenJudgeTour && (
            <button
              onClick={onOpenJudgeTour}
              className="px-2 py-0.5 rounded bg-[#4DA3FF]/20 hover:bg-[#4DA3FF]/30 text-[#4DA3FF] border border-[#4DA3FF]/40 text-[10px] font-bold transition-all flex items-center gap-1"
            >
              <Sparkles className="h-2.5 w-2.5" />
              <span>INTERACTIVE TOUR</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {TEN_STEP_JOURNEY.map((item) => (
            <button
              key={item.step}
              onClick={() => onNavigatePage(item.page)}
              className="px-2 py-0.5 rounded bg-[#07111F] hover:bg-[#122438] text-[#8FA4B8] hover:text-[#4DA3FF] border border-[#24364A] hover:border-[#4DA3FF] text-[10px] font-bold transition-all flex items-center gap-0.5 whitespace-nowrap"
              title={item.hint}
            >
              <span>{item.step}</span>
              <ChevronRight className="h-2.5 w-2.5 opacity-60" />
            </button>
          ))}
        </div>
      </div>

      {/* Six Primary Technical Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1 */}
        <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 flex flex-col justify-between">
          <div className="text-[11px] font-mono uppercase text-[#8FA4B8] tracking-wider">
            TOTAL ITEMS SCANNED
          </div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-[#F4F7FA] font-mono tabular-nums">
              {summary.totalItemsScanned}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-[#39D98A]">
            <span>11 ACTIVE BAYS</span>
            <span>+100%</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 flex flex-col justify-between">
          <div className="text-[11px] font-mono uppercase text-[#8FA4B8] tracking-wider">
            DISCREPANCIES
          </div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-[#F5B942] font-mono tabular-nums">
              {summary.totalDiscrepancies < 10 ? `0${summary.totalDiscrepancies}` : summary.totalDiscrepancies}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-[#F5B942]">
            <span>VARIANCES FLAGGED</span>
            <span>UNRESOLVED</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded border border-[#FF5C6C]/40 bg-[#0D1B2A] p-3 flex flex-col justify-between">
          <div className="text-[11px] font-mono uppercase text-[#FF5C6C] tracking-wider font-semibold">
            HIGH-RISK FINDINGS
          </div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-[#FF5C6C] font-mono tabular-nums">
              0{summary.criticalCount + summary.highCount}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-[#FF5C6C]">
            <span>{summary.criticalCount} CRIT / {summary.highCount} HIGH</span>
            <span>PRIORITY</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 flex flex-col justify-between">
          <div className="text-[11px] font-mono uppercase text-[#8FA4B8] tracking-wider">
            SCAN COVERAGE
          </div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-[#F4F7FA] font-mono tabular-nums">
              {summary.scanCoveragePct}%
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-[#39D98A]">
            <span>AISLE CORRIDORS</span>
            <span>COMPLETE</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 flex flex-col justify-between">
          <div className="text-[11px] font-mono uppercase text-[#8FA4B8] tracking-wider">
            AVG CONFIDENCE
          </div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-[#4DA3FF] font-mono tabular-nums">
              {summary.averageConfidence.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-[#8FA4B8]">
            <span>PROTOTYPE MODEL</span>
            <span className="text-[#4DA3FF]">WEIGHTED</span>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 flex flex-col justify-between">
          <div className="text-[11px] font-mono uppercase text-[#8FA4B8] tracking-wider">
            LAST SCAN
          </div>
          <div className="mt-1">
            <span className="text-base font-bold text-[#F4F7FA] font-mono tabular-nums block truncate">
              {summary.lastScanTimestamp.split(' ')[1] || '07:14:00'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-[#8FA4B8]">
            <span>{summary.lastScanTimestamp.split(' ')[0] || 'TODAY'}</span>
            <span className="text-[#39D98A]">AUTO</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Aerial Facility Map (Left 8 cols) + Right Intelligence Panels (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Aerial Facility Map (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <AerialFacilityMap
            bins={bins}
            discrepancies={discrepancies}
            onSelectBin={handleSelectBin}
            uavCoordinates={telemetry?.coordinates}
            telemetry={telemetry}
          />

          {/* Conceptual Pipeline Status Banner */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#4DA3FF]" />
              <span className="text-[#8FA4B8]">INTELLIGENCE PIPELINE:</span>
              <span className="text-[#F4F7FA] font-bold">
                SENSE → DETECT → CORRELATE → ASSESS → DECIDE
              </span>
            </div>
            <button
              onClick={() => onNavigatePage('scan-analysis')}
              className="text-[#4DA3FF] hover:underline flex items-center gap-1 text-[11px] font-bold"
            >
              <span>OPEN SCAN WORKSPACE</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Scan Status & Discrepancy Intelligence (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* CURRENT SCAN Technical Panel */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-[#24364A] pb-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isScanning ? 'bg-[#F5B942] animate-ping' : 'bg-[#39D98A]'
                    }`}
                  />
                </span>
                <span className="font-bold text-[#F4F7FA] tracking-wider text-[11px] uppercase">
                  CURRENT SCAN
                </span>
              </div>
              <span className="text-[10px] text-[#4DA3FF] bg-[#122438] px-1.5 py-0.5 rounded border border-[#24364A] font-bold">
                SIMULATED SESSION
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-[#07111F] border border-[#24364A]/80">
                <span className="text-[10px] text-[#8FA4B8] block uppercase">SOURCE AIRFRAME</span>
                <span
                  className="text-[#F4F7FA] font-bold text-xs truncate block"
                  title={telemetry?.droneId || activeSession?.uavId || 'AeroVue-Raven-04'}
                >
                  {telemetry?.droneId ? telemetry.droneId.split(' ')[0] : (activeSession?.uavId || 'Raven-04')} (Sim)
                </span>
              </div>

              <div className="p-2 rounded bg-[#07111F] border border-[#24364A]/80">
                <span className="text-[10px] text-[#8FA4B8] block uppercase">UAV ALTITUDE</span>
                <span className="text-[#4DA3FF] font-bold text-xs">
                  {(telemetry?.altitudeMeters ?? telemetry?.coordinates?.z ?? 3.6).toFixed(1)} m
                </span>
              </div>

              <div className="p-2 rounded bg-[#07111F] border border-[#24364A]/80">
                <span className="text-[10px] text-[#8FA4B8] block uppercase">OPTICAL SENSOR</span>
                <span className="text-[#F4F7FA] font-bold text-xs truncate block">
                  RGB 4K · {telemetry?.cameraFovDeg ?? 84}° FOV
                </span>
              </div>

              <div className="p-2 rounded bg-[#07111F] border border-[#24364A]/80">
                <span className="text-[10px] text-[#8FA4B8] block uppercase">FACILITY COVERAGE</span>
                <span className="text-[#F4F7FA] font-bold text-xs">
                  {summary.scanCoveragePct}% ({bins.length} Bays)
                </span>
              </div>

              <div className="p-2 rounded bg-[#07111F] border border-[#24364A]/80">
                <span className="text-[10px] text-[#8FA4B8] block uppercase">OBJECTS DETECTED</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[#F4F7FA] font-bold text-xs">{summary.totalItemsScanned}</span>
                  <span className="text-[9px] text-[#4DA3FF]">units (Sim CV)</span>
                </div>
              </div>

              <div className="p-2 rounded bg-[#07111F] border border-[#24364A]/80">
                <span className="text-[10px] text-[#8FA4B8] block uppercase">SCAN STATUS</span>
                <span
                  className={`font-bold text-xs flex items-center gap-1 ${
                    isScanning ? 'text-[#F5B942]' : 'text-[#39D98A]'
                  }`}
                >
                  ● {isScanning ? 'SCANNING...' : 'COMPLETED (SIM)'}
                </span>
              </div>
            </div>
          </div>

          {/* DISCREPANCY INTELLIGENCE Panel */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-[#24364A] pb-2 text-xs">
              <span className="font-bold text-[#F4F7FA] tracking-wider text-[11px] uppercase">
                DISCREPANCY INTELLIGENCE
              </span>
              <button
                onClick={() => onNavigatePage('discrepancies')}
                className="text-[10px] text-[#4DA3FF] hover:underline"
              >
                VIEW ALL ({discrepancies.length})
              </button>
            </div>

            <div className="space-y-2">
              {priorityDiscrepancies.length === 0 ? (
                <div className="p-4 text-center rounded border border-[#24364A] bg-[#07111F] text-xs space-y-1">
                  <CheckCircle className="h-4 w-4 text-[#39D98A] mx-auto" />
                  <div className="text-[#F4F7FA] font-bold text-[11px]">ALL BAYS RECONCILED</div>
                  <div className="text-[10px] text-[#8FA4B8]">
                    No active discrepancies identified between aerial observations and WMS records.
                  </div>
                </div>
              ) : (
                priorityDiscrepancies.map((d) => {
                  const isCritical = d.risk.level === 'CRITICAL';
                  const isHigh = d.risk.level === 'HIGH';
                  const delta = d.observedQuantity - d.expectedQuantity;

                  return (
                    <div
                      key={d.id}
                      onClick={() => {
                        onSelectDiscrepancy(d);
                        onNavigatePage('scan-analysis');
                      }}
                      className="p-2.5 rounded border border-[#24364A] bg-[#07111F] hover:border-[#4DA3FF]/60 cursor-pointer transition-colors space-y-1.5 group"
                    >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isCritical
                              ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border border-[#FF5C6C]/40'
                              : isHigh
                              ? 'bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/40'
                              : 'bg-[#4DA3FF]/20 text-[#4DA3FF] border border-[#4DA3FF]/40'
                          }`}
                        >
                          {d.risk.level}
                        </span>
                        <span className="text-xs font-bold text-[#F4F7FA]">
                          {d.location.rack.replace('Rack ', '')} / {d.location.bin.replace('Bin ', 'B')}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#8FA4B8]">
                        Conf <span className="text-[#F4F7FA] font-bold">{d.confidence.overall}%</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#4DA3FF] font-semibold">{d.expectedSku || 'N/A'}</span>
                      <span className="text-[11px] text-[#8FA4B8]">{d.discrepancyType.replace(/_/g, ' ')}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8FA4B8] pt-1 border-t border-[#24364A]/60">
                      <span>EXP: {d.expectedQuantity} · OBS: {d.observedQuantity} (Δ {delta > 0 ? `+${delta}` : delta})</span>
                      <ChevronRight className="h-3.5 w-3.5 text-[#8FA4B8] group-hover:text-[#4DA3FF] transition-colors" />
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
