import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Scan,
  ShieldAlert,
  Percent,
  Clock,
  ArrowRight,
  Eye,
  Crosshair,
  GitCompare,
  Cpu,
  CheckCheck,
} from 'lucide-react';
import { RiskSummary } from '../../services/apiService';

interface OverviewMetricsProps {
  summary: RiskSummary;
  onNavigate: (tab: string) => void;
  onTriggerScan: () => void;
  isScanning: boolean;
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({
  summary,
  onNavigate,
  onTriggerScan,
  isScanning,
}) => {
  const pipelineSteps = [
    {
      id: 'sense',
      name: 'Sense',
      desc: 'Aerial camera ingestion & sensor telemetry',
      icon: Eye,
      status: 'Nominal',
    },
    {
      id: 'detect',
      name: 'Detect',
      desc: 'Bbox localization & OCR label extraction',
      icon: Crosshair,
      status: 'Active',
    },
    {
      id: 'correlate',
      name: 'Correlate',
      desc: 'Spatial mapping to rack bins & WMS ledger',
      icon: GitCompare,
      status: 'Active',
    },
    {
      id: 'assess',
      name: 'Assess',
      desc: 'Temporal persistence & multi-factor risk',
      icon: Cpu,
      status: 'Active',
    },
    {
      id: 'decide',
      name: 'Decide',
      desc: 'Explainable intelligence & human verification',
      icon: CheckCheck,
      status: 'Ready',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Mission Context */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
              <span>A.U.D.I.T. Challenge</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Autonomous UAV Discrepancy Identification Trials</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AEROVUE Discrepancy Intelligence
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Converting raw elevated drone observations into actionable discrepancy records through spatial-temporal correlation and multi-factor risk assessment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('discrepancies')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Review Discrepancies</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onNavigate('uav')}
              className="px-4 py-2 text-xs font-semibold text-sky-400 bg-sky-950/50 hover:bg-sky-900/50 border border-sky-800/60 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>View UAV Flight Sim</span>
            </button>
          </div>
        </div>

        {/* Conceptual Pipeline Stage Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Intelligence Pipeline Execution</span>
            <span className="text-xs font-mono text-sky-400">SENSE → DETECT → CORRELATE → ASSESS → DECIDE</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono text-slate-500">0{idx + 1}</span>
                    <Icon className="h-4 w-4 text-sky-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{step.name}</div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6 Key Operational Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Items Scanned</span>
            <Scan className="h-4 w-4 text-slate-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
              {summary.totalItemsScanned}
            </span>
            <span className="text-xs text-slate-400 ml-1">units</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>11 storage bays</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Discrepancies</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-amber-400 font-mono tabular-nums">
              {summary.totalDiscrepancies}
            </span>
            <span className="text-xs text-slate-400 ml-1">flagged</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            <span>Across 3 warehouse zones</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-rose-900/40 bg-slate-900/80 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-300 text-xs font-medium">
            <span>Critical / High Risk</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-rose-400 font-mono tabular-nums">
              {summary.criticalCount + summary.highCount}
            </span>
            <span className="text-xs text-slate-400 ml-1">
              ({summary.criticalCount} crit / {summary.highCount} high)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-rose-300/80">
            <span>Prioritized for audit</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Scan Coverage</span>
            <Percent className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-white font-mono tabular-nums">
              {summary.scanCoveragePct}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
            <span>Full aisle clearance</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Avg Confidence</span>
            <CheckCheck className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-sky-300 font-mono tabular-nums">
              {summary.averageConfidence}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            <span>Prototype Score</span>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Last Scan Epoch</span>
            <Clock className="h-4 w-4 text-slate-500" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-mono font-bold text-slate-200 block truncate">
              {summary.lastScanTimestamp.split(' ')[1] || '07:14:00'}
            </span>
            <span className="text-[11px] text-slate-400">
              {summary.lastScanTimestamp.split(' ')[0] || 'Today'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-sky-400/80">
            <span>Autonomous schedule</span>
          </div>
        </div>
      </div>

      {/* Quick Interactive Demo Flow Guide */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Trial Demonstration Guide
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400">Recommended 3-Minute Hackathon Jury Walkthrough</span>
          </div>
          <span className="text-xs font-mono text-sky-400">A.U.D.I.T. Verified</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('warehouse')}
            className="text-left rounded-lg border border-slate-800 bg-slate-950 p-3 hover:border-sky-500/50 transition-colors group cursor-pointer"
          >
            <div className="text-[11px] font-mono text-sky-400 mb-1">Step 1 · Spatial Map</div>
            <div className="text-xs font-bold text-white group-hover:text-sky-300">
              Open Rack Map & WH-01
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Inspect physical rack bins (Zone A, B, C) and color-coded status.
            </div>
          </button>

          <button
            onClick={() => onNavigate('discrepancies')}
            className="text-left rounded-lg border border-slate-800 bg-slate-950 p-3 hover:border-sky-500/50 transition-colors group cursor-pointer"
          >
            <div className="text-[11px] font-mono text-sky-400 mb-1">Step 2 · Intelligence Table</div>
            <div className="text-xs font-bold text-white group-hover:text-sky-300">
              Filter by Discrepancy Type
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Select Rack A / Bin 02 (Quantity mismatch: 15 exp vs 11 obs).
            </div>
          </button>

          <button
            onClick={() => onNavigate('evidence')}
            className="text-left rounded-lg border border-slate-800 bg-slate-950 p-3 hover:border-sky-500/50 transition-colors group cursor-pointer"
          >
            <div className="text-[11px] font-mono text-sky-400 mb-1">Step 3 · Evidence Studio</div>
            <div className="text-xs font-bold text-white group-hover:text-sky-300">
              Visual Overlays & 6-Pillar Explain
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Review aerial photo, confidence breakdown, and operator action.
            </div>
          </button>

          <button
            onClick={() => onNavigate('history')}
            className="text-left rounded-lg border border-slate-800 bg-slate-950 p-3 hover:border-sky-500/50 transition-colors group cursor-pointer"
          >
            <div className="text-[11px] font-mono text-sky-400 mb-1">Step 4 · Temporal Persistence</div>
            <div className="text-xs font-bold text-white group-hover:text-sky-300">
              Verify Multi-Scan History
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Observe how repeated mismatch elevates to Persistent Discrepancy.
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
