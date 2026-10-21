/**
 * AEROVUE TEMPORAL INTELLIGENCE & HISTORICAL SCANS WORKSTATION
 *
 * Core Principle:
 * CURRENT SCAN + PREVIOUS SCANS → TEMPORAL DISCREPANCY INTELLIGENCE
 *
 * Reasons across:
 * TIME + LOCATION + INVENTORY + OBSERVATION
 *
 * Features:
 * - Multi-epoch longitudinal persistence tracking
 * - 4 Lifecycle Classifications: NEW, INTERMITTENT, PERSISTENT, RESOLVED
 * - Transparent Prototype Persistence Score (0 - 100)
 * - Visual Timeline (e.g. 14:10 NORMAL → 15:20 QUANTITY MISMATCH → ... → 18:50 PERSISTENT)
 * - Clean engineering charts: Discrepancies over time & High-risk findings over time
 * - Explicit Honesty Disclaimers: "This increases prioritization confidence but does not independently establish the root cause."
 * - Complete Scan History Records (scanId, timestamp, location, sku, expected, observed, discrepancy, confidence, risk, status)
 */

import React, { useState, useMemo } from 'react';
import {
  ScanSession,
  DiscrepancyRecord,
  LocationTimeline,
  HistoricalScanRecord,
  TemporalLifecycle,
} from '../../types';
import {
  SAMPLE_LOCATION_TIMELINES,
  SAMPLE_HISTORICAL_SCAN_RECORDS,
} from '../../data/mockWarehouseData';
import {
  Clock,
  History,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Play,
  ShieldAlert,
  Activity,
  Layers,
  Filter,
  Search,
  Check,
  Info,
  Calendar,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface HistoricalScansViewProps {
  history: ScanSession[];
  discrepancies: DiscrepancyRecord[];
  onSelectDiscrepancy: (d: DiscrepancyRecord) => void;
  onRunNewScan: () => void;
  isScanning: boolean;
}

export const HistoricalScansView: React.FC<HistoricalScansViewProps> = ({
  history,
  discrepancies,
  onSelectDiscrepancy,
  onRunNewScan,
  isScanning,
}) => {
  // Active selected location timeline
  const [selectedTimelineKey, setSelectedTimelineKey] = useState<string>('A01-02');
  const [recordFilter, setRecordFilter] = useState<'ALL' | 'PERSISTENT' | 'INTERMITTENT' | 'NEW' | 'RESOLVED' | 'HIGH_RISK'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const timelines: LocationTimeline[] = SAMPLE_LOCATION_TIMELINES;
  const scanRecords: HistoricalScanRecord[] = SAMPLE_HISTORICAL_SCAN_RECORDS;

  const fallbackTimeline: LocationTimeline = {
    binDisplay: 'A01-01',
    location: {
      warehouse: 'WH-01',
      zone: 'Zone A',
      rack: 'Rack 01',
      shelf: 1,
      bin: 'Bin 01',
      binDisplay: 'A01-01',
    },
    sku: 'SKU-A101',
    productName: 'Avionics Wire Harness',
    currentLifecycle: 'RESOLVED',
    consecutiveScanCount: 0,
    persistenceScore: 0,
    epochs: [],
    explanation: 'No persistent anomaly logged for this location.',
    disclaimer: 'Prototype historical analysis.',
  };

  const activeTimeline = useMemo(() => {
    return (
      timelines.find((t) => t.binDisplay === selectedTimelineKey) ||
      timelines[0] ||
      fallbackTimeline
    );
  }, [timelines, selectedTimelineKey]);

  // Aggregate temporal lifecycle counts
  const lifecycleCounts = useMemo(() => {
    const persistent = timelines.filter((t) => t.currentLifecycle === 'PERSISTENT').length;
    const intermittent = timelines.filter((t) => t.currentLifecycle === 'INTERMITTENT').length;
    const newCount = timelines.filter((t) => t.currentLifecycle === 'NEW').length;
    const resolved = timelines.filter((t) => t.currentLifecycle === 'RESOLVED').length;
    return { persistent, intermittent, newCount, resolved };
  }, [timelines]);

  // Filtered historical scan records
  const filteredRecords = useMemo(() => {
    return scanRecords.filter((rec) => {
      const matchSearch =
        rec.scanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.location.binDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.discrepancy.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (recordFilter === 'ALL') return true;
      if (recordFilter === 'HIGH_RISK') return rec.risk === 'HIGH' || rec.risk === 'CRITICAL';
      return rec.lifecycleState === recordFilter;
    });
  }, [scanRecords, searchTerm, recordFilter]);

  // Chart data: Chronological progression across 5 epochs
  const chartEpochs = [
    { label: '14:10', scanId: 'SCAN-2026-10-04-A', totalDisc: 0, highRisk: 0, persistent: 0 },
    { label: '15:20', scanId: 'SCAN-2026-10-04-B', totalDisc: 3, highRisk: 2, persistent: 0 },
    { label: '16:30', scanId: 'SCAN-2026-10-04-C', totalDisc: 3, highRisk: 2, persistent: 2 },
    { label: '17:40', scanId: 'SCAN-2026-10-04-D', totalDisc: 4, highRisk: 3, persistent: 2 },
    { label: '18:50', scanId: 'SCAN-2026-10-05-A', totalDisc: 5, highRisk: 3, persistent: 3 },
  ];

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#24364A] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#F4F7FA] font-display">
              TEMPORAL DISCREPANCY INTELLIGENCE
            </h1>
            <span className="text-[10px] uppercase bg-[#122438] text-[#4DA3FF] px-2 py-0.5 rounded border border-[#24364A] font-bold">
              MULTI-EPOCH CORRELATION
            </span>
          </div>
          <p className="text-xs text-[#8FA4B8] mt-0.5">
            Longitudinal reasoning across TIME + LOCATION + INVENTORY + OBSERVATION
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-[#8FA4B8]">TEMPORAL BASELINE</div>
            <div className="text-xs font-bold text-[#39D98A]">5 FLIGHT EPOCHS LOGGED</div>
          </div>
          <button
            onClick={onRunNewScan}
            disabled={isScanning}
            className="px-3 py-1.5 bg-[#4DA3FF] hover:bg-[#3d8ee6] text-[#07111F] font-bold rounded text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>{isScanning ? 'EXECUTING SCAN...' : 'EXECUTE NEXT SCAN EPOCH'}</span>
          </button>
        </div>
      </div>

      {/* Temporal Lifecycle Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8FA4B8] uppercase">PERSISTENT FINDINGS</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#FF5C6C]/20 text-[#FF5C6C] border border-[#FF5C6C]/40 rounded font-bold">
              PRIORITY
            </span>
          </div>
          <span className="text-2xl font-bold text-[#FF5C6C] tabular-nums block">
            {lifecycleCounts.persistent}
          </span>
          <span className="text-[10px] text-[#8FA4B8] block truncate">
            Observed across ≥ 2 consecutive scans
          </span>
        </div>

        <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8FA4B8] uppercase">INTERMITTENT FINDINGS</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/40 rounded font-bold">
              VARIABLE
            </span>
          </div>
          <span className="text-2xl font-bold text-[#F5B942] tabular-nums block">
            {lifecycleCounts.intermittent}
          </span>
          <span className="text-[10px] text-[#8FA4B8] block truncate">
            Non-continuous sensor recurrence
          </span>
        </div>

        <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8FA4B8] uppercase">NEW FINDINGS</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#4DA3FF]/20 text-[#4DA3FF] border border-[#4DA3FF]/40 rounded font-bold">
              INITIAL
            </span>
          </div>
          <span className="text-2xl font-bold text-[#4DA3FF] tabular-nums block">
            {lifecycleCounts.newCount}
          </span>
          <span className="text-[10px] text-[#8FA4B8] block truncate">
            First detected in current epoch
          </span>
        </div>

        <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8FA4B8] uppercase">RESOLVED FINDINGS</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#39D98A]/20 text-[#39D98A] border border-[#39D98A]/40 rounded font-bold">
              CLEARED
            </span>
          </div>
          <span className="text-2xl font-bold text-[#39D98A] tabular-nums block">
            {lifecycleCounts.resolved}
          </span>
          <span className="text-[10px] text-[#8FA4B8] block truncate">
            Restocked / ledger reconciled
          </span>
        </div>
      </div>

      {/* Visual Engineering Charts: Longitudinal Trends Across Epochs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Discrepancies & High-Risk Findings Over Time SVG Chart (7 cols) */}
        <div className="lg:col-span-7 rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#24364A] pb-2 text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[#4DA3FF]" />
              <span className="font-bold text-[#F4F7FA] uppercase text-[11px]">
                LONGITUDINAL TRENDS OVER TIME
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#4DA3FF] inline-block" />
                <span className="text-[#8FA4B8]">TOTAL DISCREPANCIES</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#FF5C6C] inline-block" />
                <span className="text-[#8FA4B8]">HIGH-RISK FINDINGS</span>
              </span>
            </div>
          </div>

          {/* Clean Engineering SVG Chart */}
          <div className="relative h-44 w-full bg-[#07111F] rounded border border-[#24364A] p-3 flex flex-col justify-between">
            {/* Grid lines */}
            <div className="absolute inset-x-3 top-6 border-b border-[#24364A]/40 text-[9px] text-[#8FA4B8]/40 text-right pr-1">
              5
            </div>
            <div className="absolute inset-x-3 top-16 border-b border-[#24364A]/40 text-[9px] text-[#8FA4B8]/40 text-right pr-1">
              3
            </div>
            <div className="absolute inset-x-3 top-28 border-b border-[#24364A]/40 text-[9px] text-[#8FA4B8]/40 text-right pr-1">
              1
            </div>

            {/* SVG Data Paths */}
            <svg className="w-full h-32 overflow-visible relative z-10" viewBox="0 0 500 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4DA3FF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4DA3FF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area fill for Total Discrepancies */}
              <polygon
                points="20,110 125,50 250,50 375,30 480,10 480,110 20,110"
                fill="url(#blueAreaGrad)"
              />

              {/* Total Discrepancies Line (Points: 0 -> 3 -> 3 -> 4 -> 5) */}
              <polyline
                fill="none"
                stroke="#4DA3FF"
                strokeWidth="2.5"
                points="20,110 125,50 250,50 375,30 480,10"
              />

              {/* High Risk Line (Points: 0 -> 2 -> 2 -> 3 -> 3) */}
              <polyline
                fill="none"
                stroke="#FF5C6C"
                strokeWidth="2"
                strokeDasharray="4,3"
                points="20,110 125,70 250,70 375,50 480,50"
              />

              {/* Data Node Markers */}
              {/* Epoch 1: 14:10 */}
              <circle cx="20" cy="110" r="3.5" fill="#39D98A" stroke="#0D1B2A" strokeWidth="1.5" />
              {/* Epoch 2: 15:20 */}
              <circle cx="125" cy="50" r="3.5" fill="#4DA3FF" stroke="#0D1B2A" strokeWidth="1.5" />
              <rect x="122" y="67" width="6" height="6" fill="#FF5C6C" />
              {/* Epoch 3: 16:30 */}
              <circle cx="250" cy="50" r="3.5" fill="#4DA3FF" stroke="#0D1B2A" strokeWidth="1.5" />
              <rect x="247" y="67" width="6" height="6" fill="#FF5C6C" />
              {/* Epoch 4: 17:40 */}
              <circle cx="375" cy="30" r="3.5" fill="#4DA3FF" stroke="#0D1B2A" strokeWidth="1.5" />
              <rect x="372" y="47" width="6" height="6" fill="#FF5C6C" />
              {/* Epoch 5: 18:50 */}
              <circle cx="480" cy="10" r="4.5" fill="#FF5C6C" stroke="#F4F7FA" strokeWidth="1.5" />
              <rect x="477" y="47" width="6" height="6" fill="#FF5C6C" />
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-[10px] text-[#8FA4B8] pt-1 border-t border-[#24364A] relative z-10">
              {chartEpochs.map((e) => (
                <div key={e.scanId} className="text-center">
                  <div className="font-bold text-[#F4F7FA]">{e.label}</div>
                  <div className="text-[8px] text-[#8FA4B8]/70">EPOCH</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-[#8FA4B8] flex items-center justify-between border-t border-[#24364A] pt-2">
            <span>Longitudinal pattern: 3 anomalies stabilized as persistent</span>
            <span className="text-[#39D98A] font-bold">TEMPORAL INTEGRATION ACTIVE</span>
          </div>
        </div>

        {/* Prototype Persistence Score Engine Rule Box (5 cols) */}
        <div className="lg:col-span-5 rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#24364A] pb-2 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-[#F5B942]" />
              <span className="font-bold text-[#F4F7FA] uppercase text-[11px]">
                PERSISTENCE SCORE ENGINE
              </span>
            </div>
            <span className="text-[10px] text-[#4DA3FF] font-bold">PROTOTYPE MODEL</span>
          </div>

          <div className="p-3 rounded bg-[#07111F] border border-[#24364A] space-y-2 text-xs">
            <div className="text-[#8FA4B8] text-[10px] uppercase font-bold">SCORING METHODOLOGY:</div>
            <div className="text-[#F4F7FA] font-bold text-[11px] leading-snug">
              Persistence Score = Normalized(Consecutive Scan Occurrences × Continuity Factor)
            </div>

            <div className="space-y-1 pt-1.5 border-t border-[#24364A]/60 text-[10px]">
              <div className="flex justify-between">
                <span className="text-[#8FA4B8]">1 SCAN (NEW):</span>
                <span className="text-[#4DA3FF] font-bold">35 / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8FA4B8]">2 CONSECUTIVE SCANS:</span>
                <span className="text-[#F5B942] font-bold">70 / 100 (PERSISTENT)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8FA4B8]">3 CONSECUTIVE SCANS:</span>
                <span className="text-[#FF5C6C] font-bold">90 / 100 (HIGH PERSISTENCE)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8FA4B8]">4+ CONSECUTIVE SCANS:</span>
                <span className="text-[#FF5C6C] font-bold">98 / 100 (CRITICAL PERSISTENCE)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8FA4B8]">RESOLVED IN LATEST:</span>
                <span className="text-[#39D98A] font-bold">0 / 100 (CLEARED)</span>
              </div>
            </div>
          </div>

          {/* Engineering Honesty Banner (Required) */}
          <div className="p-2.5 rounded border border-[#24364A] bg-[#07111F] text-[10px] text-[#8FA4B8] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#F5B942]">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>SYSTEM TRUTH DISCLAIMER</span>
            </div>
            <p className="leading-relaxed">
              Persistence indicates repeated observation and increases prioritization confidence, but does not independently establish the physical root cause.
            </p>
          </div>
        </div>
      </div>

      {/* INTERACTIVE MULTI-EPOCH LOCATION TIMELINE INSPECTOR */}
      <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#24364A] pb-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[#4DA3FF]" />
              <h2 className="font-bold text-[#F4F7FA] uppercase tracking-wide">
                LOCATION TIMELINE INSPECTOR
              </h2>
            </div>
            <p className="text-[11px] text-[#8FA4B8] mt-0.5">
              Select a warehouse bin to examine its multi-epoch observation sequence across flight missions
            </p>
          </div>

          {/* Location Selector Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {timelines.map((t) => {
              const isSelected = t.binDisplay === selectedTimelineKey;
              return (
                <button
                  key={t.binDisplay}
                  onClick={() => setSelectedTimelineKey(t.binDisplay)}
                  className={`px-2.5 py-1 rounded text-xs transition-all font-bold flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[#4DA3FF] text-[#07111F] border-[#4DA3FF]'
                      : 'bg-[#07111F] text-[#8FA4B8] border-[#24364A] hover:border-[#4DA3FF]/60 hover:text-[#F4F7FA]'
                  }`}
                >
                  <span>BIN {t.binDisplay}</span>
                  <span
                    className={`text-[9px] px-1 rounded ${
                      t.currentLifecycle === 'PERSISTENT'
                        ? isSelected
                          ? 'bg-[#07111F] text-[#FF5C6C]'
                          : 'bg-[#FF5C6C]/20 text-[#FF5C6C]'
                        : t.currentLifecycle === 'RESOLVED'
                        ? isSelected
                          ? 'bg-[#07111F] text-[#39D98A]'
                          : 'bg-[#39D98A]/20 text-[#39D98A]'
                        : isSelected
                        ? 'bg-[#07111F] text-[#F5B942]'
                        : 'bg-[#F5B942]/20 text-[#F5B942]'
                    }`}
                  >
                    {t.currentLifecycle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Bin Summary Dossier */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#07111F] p-3 rounded border border-[#24364A] text-xs">
          <div>
            <span className="text-[10px] text-[#8FA4B8] block">TARGET BIN:</span>
            <span className="text-[#F4F7FA] font-bold text-sm">
              BIN {activeTimeline.binDisplay} · {activeTimeline.location.rack}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#8FA4B8] block">ALLOCATED SKU:</span>
            <span className="text-[#4DA3FF] font-bold text-sm">{activeTimeline.sku}</span>
            <span className="text-[10px] text-[#8FA4B8] block truncate">{activeTimeline.productName}</span>
          </div>

          <div>
            <span className="text-[10px] text-[#8FA4B8] block">PROTOTYPE PERSISTENCE SCORE:</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-lg font-bold tabular-nums ${
                  activeTimeline.persistenceScore >= 80
                    ? 'text-[#FF5C6C]'
                    : activeTimeline.persistenceScore >= 50
                    ? 'text-[#F5B942]'
                    : activeTimeline.persistenceScore > 0
                    ? 'text-[#4DA3FF]'
                    : 'text-[#39D98A]'
                }`}
              >
                {activeTimeline.persistenceScore} / 100
              </span>
              <span className="text-[10px] text-[#8FA4B8]">
                ({activeTimeline.consecutiveScanCount} consecutive)
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-[#8FA4B8] block">LIFECYCLE STATE:</span>
            <span
              className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded border ${
                activeTimeline.currentLifecycle === 'PERSISTENT'
                  ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border-[#FF5C6C]/40'
                  : activeTimeline.currentLifecycle === 'RESOLVED'
                  ? 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/40'
                  : activeTimeline.currentLifecycle === 'INTERMITTENT'
                  ? 'bg-[#F5B942]/20 text-[#F5B942] border-[#F5B942]/40'
                  : 'bg-[#4DA3FF]/20 text-[#4DA3FF] border-[#4DA3FF]/40'
              }`}
            >
              ● {activeTimeline.currentLifecycle}
            </span>
          </div>
        </div>

        {/* VISUAL TIMELINE STEPPER (e.g. 14:10 NORMAL -> 15:20 QUANTITY MISMATCH -> ... -> 18:50 PERSISTENT) */}
        <div className="p-4 bg-[#07111F] rounded border border-[#24364A] space-y-3">
          <div className="text-[11px] text-[#8FA4B8] font-bold uppercase flex items-center justify-between border-b border-[#24364A]/60 pb-2">
            <span>OBSERVATION PROGRESSION ACROSS SCAN EPOCHS</span>
            <span className="text-[10px] text-[#4DA3FF]">CHRONOLOGICAL SEQUENCE</span>
          </div>

          {/* Stepper Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            {activeTimeline.epochs.map((ep, idx) => {
              const isLast = idx === activeTimeline.epochs.length - 1;
              const isNormal = ep.status === 'NORMAL';
              const isResolved = ep.status === 'RESOLVED';
              const isPersistent = ep.status === 'PERSISTENT' || ep.lifecycleState === 'PERSISTENT';

              return (
                <div
                  key={ep.epochId}
                  className={`p-3 rounded border relative flex flex-col justify-between transition-all ${
                    isLast
                      ? 'border-[#4DA3FF] bg-[#122438] ring-1 ring-[#4DA3FF]/30'
                      : 'border-[#24364A] bg-[#0D1B2A]'
                  }`}
                >
                  {/* Top: Time & Epoch Badge */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#F4F7FA]">
                      <span className="text-sm font-mono tracking-wider">{ep.timeLabel}</span>
                      <span className="text-[9px] text-[#8FA4B8]">{ep.scanId.replace('SCAN-2026-10-04-', 'EP-').replace('SCAN-2026-10-05-', 'NOW')}</span>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded block text-center truncate border ${
                          isNormal || isResolved
                            ? 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/40'
                            : isPersistent
                            ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border-[#FF5C6C]/40'
                            : 'bg-[#F5B942]/20 text-[#F5B942] border-[#F5B942]/40'
                        }`}
                      >
                        {ep.status}
                      </span>
                    </div>
                  </div>

                  {/* Quantitative Metrics */}
                  <div className="mt-3 pt-2 border-t border-[#24364A]/60 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-[#8FA4B8]">EXPECTED:</span>
                      <span className="text-[#F4F7FA] font-bold tabular-nums">{ep.expected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8FA4B8]">OBSERVED:</span>
                      <span className="text-[#4DA3FF] font-bold tabular-nums">{ep.observed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8FA4B8]">DELTA:</span>
                      <span
                        className={`font-bold tabular-nums ${
                          ep.delta < 0
                            ? 'text-[#FF5C6C]'
                            : ep.delta > 0
                            ? 'text-[#F5B942]'
                            : 'text-[#39D98A]'
                        }`}
                      >
                        {ep.delta > 0 ? `+${ep.delta}` : ep.delta}
                      </span>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="mt-2 text-[9px] text-[#8FA4B8] leading-tight line-clamp-2">
                    {ep.notes}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Required Explanation Dossier Box */}
        <div className="p-3.5 rounded border border-[#24364A] bg-[#07111F] space-y-2 text-xs">
          <div className="text-[10px] font-bold text-[#F5B942] uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>AEROVUE TEMPORAL REASONING EXPLANATION</span>
          </div>

          <div className="text-[#F4F7FA] font-semibold text-sm pl-5 border-l-2 border-[#4DA3FF]">
            “{activeTimeline.explanation}”
          </div>

          <div className="text-[#8FA4B8] text-[11px] pl-5 italic">
            “{activeTimeline.disclaimer}”
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE SCAN HISTORY LOGS TABLE */}
      <div className="rounded border border-[#24364A] bg-[#0D1B2A] overflow-hidden space-y-0">
        <div className="px-3.5 py-2.5 bg-[#07111F] border-b border-[#24364A] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F4F7FA]">HISTORICAL OBSERVATION AUDIT LEDGER</span>
            <span className="text-[#8FA4B8]">({filteredRecords.length} records)</span>
          </div>

          {/* Filter tabs & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-[#8FA4B8] absolute left-2 top-2" />
              <input
                type="text"
                placeholder="Search SKU, Bin, Scan ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-2 py-1 bg-[#0D1B2A] border border-[#24364A] text-xs text-[#F4F7FA] rounded placeholder:text-[#8FA4B8]/50 focus:outline-none focus:border-[#4DA3FF]"
              />
            </div>

            <div className="flex gap-1 text-[10px]">
              {(['ALL', 'PERSISTENT', 'INTERMITTENT', 'NEW', 'RESOLVED', 'HIGH_RISK'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setRecordFilter(cat)}
                  className={`px-2 py-1 rounded transition-colors font-bold ${
                    recordFilter === cat
                      ? 'bg-[#4DA3FF] text-[#07111F]'
                      : 'bg-[#0D1B2A] text-[#8FA4B8] hover:text-[#F4F7FA] border border-[#24364A]'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07111F] border-b border-[#24364A] text-[#8FA4B8] uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">SCAN ID</th>
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">LOCATION</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3 text-right">EXPECTED</th>
                <th className="py-2.5 px-3 text-right">OBSERVED</th>
                <th className="py-2.5 px-3 text-right">DELTA</th>
                <th className="py-2.5 px-3">DISCREPANCY</th>
                <th className="py-2.5 px-3 text-center">CONFIDENCE</th>
                <th className="py-2.5 px-3">RISK</th>
                <th className="py-2.5 px-3">LIFECYCLE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24364A]/60 font-mono">
              {filteredRecords.map((r) => {
                const isSelected = r.location.binDisplay === selectedTimelineKey;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedTimelineKey(r.location.binDisplay)}
                    className={`hover:bg-[#122438] cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#122438]/80' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-[#4DA3FF]">{r.scanId}</td>
                    <td className="py-2.5 px-3 text-[#F4F7FA] whitespace-nowrap">{r.timestamp}</td>
                    <td className="py-2.5 px-3 font-bold text-[#F4F7FA]">
                      BIN {r.location.binDisplay}
                    </td>
                    <td className="py-2.5 px-3 text-[#4DA3FF] font-semibold">{r.sku}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#8FA4B8]">{r.expected}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F4F7FA] font-bold">
                      {r.observed}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold">
                      <span
                        className={
                          r.delta < 0
                            ? 'text-[#FF5C6C]'
                            : r.delta > 0
                            ? 'text-[#F5B942]'
                            : 'text-[#39D98A]'
                        }
                      >
                        {r.delta > 0 ? `+${r.delta}` : r.delta}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          r.discrepancy === 'NO_DISCREPANCY'
                            ? 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/40'
                            : r.discrepancy === 'MISSING_ITEM'
                            ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border-[#FF5C6C]/40'
                            : 'bg-[#F5B942]/20 text-[#F5B942] border-[#F5B942]/40'
                        }`}
                      >
                        {r.discrepancy.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center tabular-nums text-[#39D98A] font-bold">
                      {r.confidence}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold ${
                          r.risk === 'CRITICAL'
                            ? 'text-[#FF5C6C]'
                            : r.risk === 'HIGH'
                            ? 'text-[#FF5C6C]'
                            : r.risk === 'MEDIUM'
                            ? 'text-[#F5B942]'
                            : 'text-[#39D98A]'
                        }`}
                      >
                        {r.risk}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          r.lifecycleState === 'PERSISTENT'
                            ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border border-[#FF5C6C]/40'
                            : r.lifecycleState === 'RESOLVED'
                            ? 'bg-[#39D98A]/20 text-[#39D98A] border border-[#39D98A]/40'
                            : r.lifecycleState === 'INTERMITTENT'
                            ? 'bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/40'
                            : 'bg-[#4DA3FF]/20 text-[#4DA3FF] border border-[#4DA3FF]/40'
                        }`}
                      >
                        {r.lifecycleState}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flight Mission Sessions Table */}
      <div className="rounded border border-[#24364A] bg-[#0D1B2A] overflow-hidden">
        <div className="px-3.5 py-2.5 bg-[#07111F] border-b border-[#24364A] flex items-center justify-between text-xs text-[#8FA4B8]">
          <span className="font-bold text-[#F4F7FA]">FLIGHT MISSION SESSIONS</span>
          <span>{history.length} REGISTERED MISSIONS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#07111F] border-b border-[#24364A] text-[#8FA4B8] uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">SESSION ID</th>
                <th className="py-2.5 px-3">DATE / TIME</th>
                <th className="py-2.5 px-3">UAV RIG</th>
                <th className="py-2.5 px-3 text-right">ITEMS</th>
                <th className="py-2.5 px-3 text-right">DISCREPANCIES</th>
                <th className="py-2.5 px-3 text-right">HIGH-RISK</th>
                <th className="py-2.5 px-3 text-right">COVERAGE</th>
                <th className="py-2.5 px-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24364A]/60">
              {history.map((s, idx) => (
                <tr key={s.id} className="hover:bg-[#122438] transition-colors">
                  <td className="py-2.5 px-3 font-bold text-[#4DA3FF]">
                    {s.id}
                    {idx === 0 && (
                      <span className="ml-1.5 text-[9px] text-[#39D98A] font-normal">
                        (LATEST)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[#F4F7FA]">{s.timestamp}</td>
                  <td className="py-2.5 px-3 text-[#8FA4B8]">{s.uavId}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[#F4F7FA]">
                    {s.totalItemsScanned}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    <span className={s.discrepanciesFound > 0 ? 'text-[#F5B942] font-bold' : 'text-[#39D98A]'}>
                      {s.discrepanciesFound}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[#FF5C6C] font-bold">
                    {s.criticalCount + s.highCount}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[#4DA3FF]">
                    {s.coveragePercentage}%
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[#39D98A] flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>COMPLETED</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
