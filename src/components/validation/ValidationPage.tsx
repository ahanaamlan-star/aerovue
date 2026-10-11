/**
 * AEROVUE VALIDATION CENTER
 *
 * Engineering testing environment for systematic empirical verification.
 *
 * Engineering Value:
 * "We are testing the system systematically" rather than "We claim the system is perfect."
 * This serves as evidence during technical evaluation.
 *
 * Non-fabrication discipline:
 * - All simulated metrics are explicitly labeled [SIMULATION].
 * - Real-world physical fleet status is explicitly marked [NOT YET VALIDATED].
 * - Full disclosure of failure modes, edge condition degradations, and operator review states.
 */

import React, { useState, useMemo } from 'react';
import {
  ValidationTestCase,
  ValidationTestStatus,
  ValidationPerformanceSummary,
  KnownLimitation,
} from '../../types';
import { validationService } from '../../services/validationService';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCcw,
  Search,
  Filter,
  Sliders,
  Info,
  Clock,
  Cpu,
  Layers,
  ShieldCheck,
  ShieldAlert,
  FileText,
  ChevronRight,
  ExternalLink,
  Activity,
  Maximize2,
  Check,
  Save,
  RefreshCw,
  X,
  AlertOctagon,
  Eye,
  Camera,
  Compass,
} from 'lucide-react';

export const ValidationPage: React.FC = () => {
  const [testCases, setTestCases] = useState<ValidationTestCase[]>(() =>
    validationService.getTestCases()
  );
  const [limitations] = useState<KnownLimitation[]>(() =>
    validationService.getKnownLimitations()
  );
  const [selectedTest, setSelectedTest] = useState<ValidationTestCase | null>(
    testCases[0] || null
  );

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | ValidationTestStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Execution states
  const [isExecutingAll, setIsExecutingAll] = useState<boolean>(false);
  const [executingTestId, setExecutingTestId] = useState<string | null>(null);
  const [executionProgress, setExecutionProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(false);
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [editedStatus, setEditedStatus] = useState<ValidationTestStatus>('PASS');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute live performance summary
  const summary: ValidationPerformanceSummary = useMemo(() => {
    return validationService.getPerformanceSummary();
  }, [testCases]);

  // Counts by status
  const passCount = useMemo(
    () => testCases.filter((t) => t.status === 'PASS').length,
    [testCases]
  );
  const failCount = useMemo(
    () => testCases.filter((t) => t.status === 'FAIL').length,
    [testCases]
  );
  const reviewCount = useMemo(
    () => testCases.filter((t) => t.status === 'REVIEW').length,
    [testCases]
  );

  // Filtered test cases
  const filteredCases = useMemo(() => {
    return testCases.filter((tc) => {
      if (statusFilter !== 'ALL' && tc.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && tc.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = tc.testId.toLowerCase().includes(q);
        const matchesScenario = tc.scenario.toLowerCase().includes(q);
        const matchesInput = tc.input.toLowerCase().includes(q);
        const matchesNotes = tc.notes.toLowerCase().includes(q);
        if (!matchesId && !matchesScenario && !matchesInput && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [testCases, statusFilter, categoryFilter, searchQuery]);

  // Handle open inspector
  const handleOpenInspector = (tc: ValidationTestCase) => {
    setSelectedTest(tc);
    setEditedNotes(tc.notes);
    setEditedStatus(tc.status);
    setInspectorOpen(true);
  };

  // Run single test
  const handleRunSingleTest = async (testId: string) => {
    setExecutingTestId(testId);
    try {
      const updated = await validationService.runSingleTest(testId);
      if (updated) {
        setTestCases((prev) => prev.map((t) => (t.testId === testId ? updated : t)));
        if (selectedTest?.testId === testId) {
          setSelectedTest(updated);
          setEditedNotes(updated.notes);
          setEditedStatus(updated.status);
        }
        showToast(`Test ${testId} executed in ${updated.processingLatencyMs}ms.`);
      }
    } finally {
      setExecutingTestId(null);
    }
  };

  // Run all tests
  const handleRunAllTests = async () => {
    setIsExecutingAll(true);
    setExecutionProgress({ completed: 0, total: testCases.length });
    try {
      const updatedList = await validationService.runAllTests((completed, total) => {
        setExecutionProgress({ completed, total });
      });
      setTestCases(updatedList);
      if (selectedTest) {
        const found = updatedList.find((t) => t.testId === selectedTest.testId);
        if (found) setSelectedTest(found);
      }
      showToast('All 10 test cases systematically executed and updated.');
    } finally {
      setIsExecutingAll(false);
      setExecutionProgress(null);
    }
  };

  // Save notes & status from inspector
  const handleSaveInspectorEdits = () => {
    if (!selectedTest) return;
    const updated = validationService.updateTestCase(selectedTest.testId, {
      notes: editedNotes,
      status: editedStatus,
    });
    if (updated) {
      setTestCases((prev) =>
        prev.map((t) => (t.testId === selectedTest.testId ? updated : t))
      );
      setSelectedTest(updated);
      showToast(`Record ${selectedTest.testId} audit notes and status updated.`);
    }
  };

  // Reset to defaults
  const handleResetToBaseline = () => {
    const fresh = validationService.resetToDefaults();
    setTestCases(fresh);
    if (fresh.length > 0) {
      setSelectedTest(fresh[0]);
      setEditedNotes(fresh[0].notes);
      setEditedStatus(fresh[0].status);
    }
    showToast('Reset empirical bench to baseline ground-truth records.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 font-mono select-none">
      {/* 1. Header & Engineering Value Positioning */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#24364A] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F7FA] font-display">
              AEROVUE VALIDATION CENTER
            </h1>
            <span className="text-[10px] uppercase bg-[#122438] text-[#4DA3FF] px-2 py-0.5 rounded border border-[#24364A] font-bold">
              EMPIRICAL TESTBED
            </span>
            <span className="text-[10px] uppercase bg-[#122438] text-[#8FA4B8] px-2 py-0.5 rounded border border-[#24364A]">
              SUITE v2.4
            </span>
          </div>
          <p className="text-xs text-[#8FA4B8] mt-1 max-w-3xl">
            Controlled verification harness for documenting prototype experiments, detection counts, latency, and boundary failure modes.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={handleResetToBaseline}
            disabled={isExecutingAll}
            className="px-2.5 py-1.5 bg-[#0D1B2A] border border-[#24364A] hover:border-[#8FA4B8] text-[#8FA4B8] hover:text-[#F4F7FA] rounded transition-colors flex items-center gap-1.5"
            title="Reset all test records to baseline seed"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>RESET BASELINE</span>
          </button>

          <button
            onClick={handleRunAllTests}
            disabled={isExecutingAll}
            className="px-3.5 py-1.5 bg-[#4DA3FF] hover:bg-[#3d8ee6] text-[#07111F] font-bold rounded transition-colors flex items-center gap-1.5 shadow-md shadow-[#4DA3FF]/20 disabled:opacity-50"
          >
            {isExecutingAll ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>
                  RUNNING ({executionProgress?.completed}/{executionProgress?.total})...
                </span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>RUN ALL TESTS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-2.5 rounded border border-[#39D98A]/50 bg-[#39D98A]/10 text-xs text-[#39D98A] flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{toastMessage}</span>
          </div>
          <span className="text-[10px] text-[#8FA4B8]">SYSTEM LOGGED</span>
        </div>
      )}

      {/* 2. Engineering Discipline & Honesty Banner */}
      <div className="rounded-lg border border-[#24364A] bg-[#0D1B2A] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start md:items-center gap-3">
          <div className="p-2 rounded bg-[#122438] border border-[#24364A] text-[#4DA3FF] shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[#F4F7FA] font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <span>SYSTEMATIC TESTING DISCIPLINE</span>
              <span className="text-[10px] bg-[#4DA3FF]/20 text-[#4DA3FF] px-1.5 py-0.2 rounded border border-[#4DA3FF]/40">
                EVALUATION EVIDENCE
              </span>
            </div>
            <p className="text-[#8FA4B8] text-[11px] mt-0.5 leading-relaxed">
              &ldquo;We are testing the system systematically rather than claiming the system is perfect.&rdquo;
              Telemetry metrics below represent reproducible simulation harness observations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-[#24364A] pt-2 md:pt-0 md:pl-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#39D98A]" />
            <span className="text-[#8FA4B8]">PASS:</span>
            <strong className="text-[#39D98A]">{passCount}</strong>
          </div>
          <span className="text-[#24364A]">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#F5B942]" />
            <span className="text-[#8FA4B8]">REVIEW:</span>
            <strong className="text-[#F5B942]">{reviewCount}</strong>
          </div>
          <span className="text-[#24364A]">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#FF5C6C]" />
            <span className="text-[#8FA4B8]">FAIL:</span>
            <strong className="text-[#FF5C6C]">{failCount}</strong>
          </div>
        </div>
      </div>

      {/* 3. PERFORMANCE METRICS SECTION (7 Required Metrics + Honesty Disclaimers) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[#4DA3FF]" />
            <span className="font-bold text-[#F4F7FA] uppercase tracking-wider">
              PERFORMANCE TELEMETRY &amp; BENCHMARKS
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#8FA4B8]">
            <span className="bg-[#122438] text-[#4DA3FF] px-2 py-0.5 rounded border border-[#24364A]">
              ALL VALUES SOURCED FROM ACTIVE TEST MATRIX
            </span>
          </div>
        </div>

        {/* 7 Core Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 text-xs">
          {/* 1. Detection Count */}
          <div className="p-3 rounded-lg border border-[#24364A] bg-[#0D1B2A] flex flex-col justify-between space-y-1 relative group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8FA4B8] uppercase font-bold">DETECTION COUNT</span>
              <span className="text-[9px] bg-[#4DA3FF]/20 text-[#4DA3FF] px-1 py-0.2 rounded border border-[#4DA3FF]/40 font-mono">
                SIMULATION
              </span>
            </div>
            <div className="text-2xl font-bold text-[#F4F7FA] tabular-nums">
              {summary.totalDetectionCount}
            </div>
            <span className="text-[10px] text-[#8FA4B8] truncate">Total segmented units</span>
          </div>

          {/* 2. Discrepancy Count */}
          <div className="p-3 rounded-lg border border-[#24364A] bg-[#0D1B2A] flex flex-col justify-between space-y-1 relative group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8FA4B8] uppercase font-bold">DISCREPANCY COUNT</span>
              <span className="text-[9px] bg-[#4DA3FF]/20 text-[#4DA3FF] px-1 py-0.2 rounded border border-[#4DA3FF]/40 font-mono">
                SIMULATION
              </span>
            </div>
            <div className="text-2xl font-bold text-[#F5B942] tabular-nums">
              {summary.totalDiscrepancyCount}
            </div>
            <span className="text-[10px] text-[#8FA4B8] truncate">Variances flagged</span>
          </div>

          {/* 3. Confidence */}
          <div className="p-3 rounded-lg border border-[#24364A] bg-[#0D1B2A] flex flex-col justify-between space-y-1 relative group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8FA4B8] uppercase font-bold">CONFIDENCE</span>
              <span className="text-[9px] bg-[#4DA3FF]/20 text-[#4DA3FF] px-1 py-0.2 rounded border border-[#4DA3FF]/40 font-mono">
                SIMULATION
              </span>
            </div>
            <div className="text-2xl font-bold text-[#39D98A] tabular-nums">
              {summary.averageConfidence}%
            </div>
            <span className="text-[10px] text-[#8FA4B8] truncate">Mean prototype score</span>
          </div>

          {/* 4. Processing Latency */}
          <div className="p-3 rounded-lg border border-[#24364A] bg-[#0D1B2A] flex flex-col justify-between space-y-1 relative group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8FA4B8] uppercase font-bold">LATENCY</span>
              <span className="text-[9px] bg-[#4DA3FF]/20 text-[#4DA3FF] px-1 py-0.2 rounded border border-[#4DA3FF]/40 font-mono">
                SIMULATION
              </span>
            </div>
            <div className="text-2xl font-bold text-[#4DA3FF] tabular-nums">
              {summary.averageLatencyMs} <span className="text-xs font-normal">ms</span>
            </div>
            <span className="text-[10px] text-[#8FA4B8] truncate">Per-frame inference</span>
          </div>

          {/* 5. Coverage */}
          <div className="p-3 rounded-lg border border-[#24364A] bg-[#0D1B2A] flex flex-col justify-between space-y-1 relative group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8FA4B8] uppercase font-bold">COVERAGE</span>
              <span className="text-[9px] bg-[#4DA3FF]/20 text-[#4DA3FF] px-1 py-0.2 rounded border border-[#4DA3FF]/40 font-mono">
                SIMULATION
              </span>
            </div>
            <div className="text-2xl font-bold text-[#F4F7FA] tabular-nums">
              {summary.averageCoveragePct}%
            </div>
            <span className="text-[10px] text-[#8FA4B8] truncate">Target grid swept</span>
          </div>

          {/* 6. False Positives */}
          <div className="p-3 rounded-lg border border-[#24364A] bg-[#0D1B2A] flex flex-col justify-between space-y-1 relative group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8FA4B8] uppercase font-bold">FALSE POSITIVES</span>
              <span className="text-[9px] bg-[#4DA3FF]/20 text-[#4DA3FF] px-1 py-0.2 rounded border border-[#4DA3FF]/40 font-mono">
                SIMULATION
              </span>
            </div>
            <div className="text-2xl font-bold text-[#FF5C6C] tabular-nums">
              {summary.totalFalsePositives}
            </div>
            <span className="text-[10px] text-[#8FA4B8] truncate">1 in TEST-006 (Occlusion)</span>
          </div>

          {/* 7. False Negatives */}
          <div className="p-3 rounded-lg border border-[#24364A] bg-[#0D1B2A] flex flex-col justify-between space-y-1 relative group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8FA4B8] uppercase font-bold">FALSE NEGATIVES</span>
              <span className="text-[9px] bg-[#4DA3FF]/20 text-[#4DA3FF] px-1 py-0.2 rounded border border-[#4DA3FF]/40 font-mono">
                SIMULATION
              </span>
            </div>
            <div className="text-2xl font-bold text-[#FF5C6C] tabular-nums">
              {summary.totalFalseNegatives}
            </div>
            <span className="text-[10px] text-[#8FA4B8] truncate">In low light &amp; occlusion</span>
          </div>
        </div>

        {/* Real-World Hardware Status Strip (Explicitly "NOT YET VALIDATED") */}
        <div className="p-2.5 rounded border border-[#24364A] bg-[#07111F] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#8FA4B8]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F4F7FA]">PHYSICAL UAV FLEET FIELD DEPLOYMENT:</span>
            <span className="bg-[#122438] text-[#F5B942] border border-[#F5B942]/40 px-2 py-0.5 rounded font-bold text-[10px]">
              NOT YET VALIDATED
            </span>
          </div>
          <div className="text-[10px] text-[#8FA4B8]">
            Reason: Awaiting flight trials in physical facility. No fabricated flight hours claimed.
          </div>
        </div>
      </div>

      {/* 4. TEST BENCH & RECORD INSPECTOR (Two-Panel or Table + Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Test Cases Table (7 or 12 cols depending on inspector) */}
        <div className={inspectorOpen ? 'lg:col-span-7 space-y-3' : 'lg:col-span-12 space-y-3'}>
          {/* Controls bar: Filters + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border border-[#24364A] bg-[#0D1B2A]">
            {/* Status Pills */}
            <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1 sm:pb-0">
              {(['ALL', 'PASS', 'REVIEW', 'FAIL'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                    statusFilter === s
                      ? s === 'PASS'
                        ? 'bg-[#39D98A]/20 text-[#39D98A] border border-[#39D98A]/50'
                        : s === 'FAIL'
                        ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border border-[#FF5C6C]/50'
                        : s === 'REVIEW'
                        ? 'bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/50'
                        : 'bg-[#122438] text-[#4DA3FF] border border-[#4DA3FF]/50'
                      : 'text-[#8FA4B8] hover:text-[#F4F7FA] hover:bg-[#122438]/50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Category dropdown + Search */}
            <div className="flex items-center gap-2 text-xs">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#07111F] border border-[#24364A] text-[#8FA4B8] hover:text-[#F4F7FA] px-2 py-1 rounded text-xs focus:outline-none focus:border-[#4DA3FF]"
              >
                <option value="ALL">ALL CATEGORIES</option>
                <option value="NOMINAL">NOMINAL</option>
                <option value="DISCREPANCY_REASONING">DISCREPANCY REASONING</option>
                <option value="EDGE_CONDITION">EDGE CONDITIONS</option>
                <option value="INTEGRATION">INTEGRATION</option>
              </select>

              <div className="relative">
                <Search className="h-3.5 w-3.5 text-[#8FA4B8] absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="Filter test cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#07111F] border border-[#24364A] text-[#F4F7FA] placeholder-[#8FA4B8]/50 pl-7 pr-2 py-1 rounded text-xs focus:outline-none focus:border-[#4DA3FF] w-36 sm:w-44"
                />
              </div>
            </div>
          </div>

          {/* Test Cases Table */}
          <div className="rounded-lg border border-[#24364A] bg-[#0D1B2A] overflow-hidden">
            <div className="px-3.5 py-2.5 bg-[#07111F] border-b border-[#24364A] flex items-center justify-between text-xs text-[#8FA4B8]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F4F7FA]">TEST BENCH MATRIX</span>
                <span className="text-[10px] text-[#8FA4B8]">
                  SHOWING {filteredCases.length} OF {testCases.length} RECORDS
                </span>
              </div>
              <span className="text-[10px] text-[#4DA3FF]">CLICK RECORD TO INSPECT</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#07111F] border-b border-[#24364A] text-[#8FA4B8] uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">TEST ID</th>
                    <th className="py-2.5 px-3">SCENARIO</th>
                    <th className="py-2.5 px-3">CATEGORY</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-right">CONF</th>
                    <th className="py-2.5 px-3 text-right">LATENCY</th>
                    <th className="py-2.5 px-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24364A]/60 font-mono">
                  {filteredCases.map((tc) => {
                    const isSelected = selectedTest?.testId === tc.testId;
                    const isPass = tc.status === 'PASS';
                    const isFail = tc.status === 'FAIL';
                    const isReview = tc.status === 'REVIEW';
                    const isRunningThis = executingTestId === tc.testId;

                    return (
                      <tr
                        key={tc.testId}
                        onClick={() => handleOpenInspector(tc)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#122438] border-l-2 border-l-[#4DA3FF]'
                            : 'hover:bg-[#122438]/60'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-[#4DA3FF]">
                          {tc.testId}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#F4F7FA] text-xs">
                            {tc.scenario}
                          </div>
                          <div className="text-[10px] text-[#8FA4B8] truncate max-w-xs sm:max-w-md">
                            {tc.expectedResult}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-[#8FA4B8]">
                          {tc.category.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isPass
                                ? 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/40'
                                : isFail
                                ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border-[#FF5C6C]/40'
                                : 'bg-[#F5B942]/20 text-[#F5B942] border-[#F5B942]/40'
                            }`}
                          >
                            {isPass && <CheckCircle2 className="h-3 w-3" />}
                            {isFail && <XCircle className="h-3 w-3" />}
                            {isReview && <AlertTriangle className="h-3 w-3" />}
                            <span>{tc.status}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-[#39D98A] font-bold">
                          {tc.confidenceScore !== null ? `${tc.confidenceScore}%` : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-[#F4F7FA]">
                          {tc.processingLatencyMs !== null
                            ? `${tc.processingLatencyMs} ms`
                            : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleRunSingleTest(tc.testId)}
                              disabled={isRunningThis || isExecutingAll}
                              className="p-1 rounded bg-[#07111F] border border-[#24364A] hover:border-[#4DA3FF] text-[#8FA4B8] hover:text-[#4DA3FF] transition-colors"
                              title="Re-run test in simulation harness"
                            >
                              {isRunningThis ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleOpenInspector(tc)}
                              className="px-2 py-1 rounded bg-[#07111F] border border-[#24364A] hover:border-[#4DA3FF] text-[#8FA4B8] hover:text-[#F4F7FA] text-[10px]"
                            >
                              INSPECT
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Detailed Test Record Inspector Drawer / Panel */}
        {inspectorOpen && selectedTest && (
          <div className="lg:col-span-5 rounded-lg border border-[#24364A] bg-[#0D1B2A] p-4 space-y-4 shadow-xl">
            {/* Inspector Header */}
            <div className="flex items-center justify-between border-b border-[#24364A] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#4DA3FF]" />
                <span className="font-bold text-[#F4F7FA] text-sm font-display">
                  TEST RECORD: {selectedTest.testId}
                </span>
                <span className="text-[10px] bg-[#122438] text-[#8FA4B8] px-1.5 py-0.5 rounded border border-[#24364A]">
                  {selectedTest.category}
                </span>
              </div>
              <button
                onClick={() => setInspectorOpen(false)}
                className="p-1 rounded hover:bg-[#122438] text-[#8FA4B8] hover:text-[#F4F7FA] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Test Scenario Title & Timestamp */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#F4F7FA] font-display">
                  {selectedTest.scenario}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-[#8FA4B8] mt-0.5">
                  <Clock className="h-3 w-3" />
                  <span>TIMESTAMP: {selectedTest.timestamp}</span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex flex-col items-end gap-1">
                <label className="text-[9px] uppercase text-[#8FA4B8]">AUDIT STATUS</label>
                <select
                  value={editedStatus}
                  onChange={(e) => setEditedStatus(e.target.value as ValidationTestStatus)}
                  className={`text-xs font-bold px-2 py-1 rounded border bg-[#07111F] focus:outline-none ${
                    editedStatus === 'PASS'
                      ? 'text-[#39D98A] border-[#39D98A]/50'
                      : editedStatus === 'FAIL'
                      ? 'text-[#FF5C6C] border-[#FF5C6C]/50'
                      : 'text-[#F5B942] border-[#F5B942]/50'
                  }`}
                >
                  <option value="PASS">PASS</option>
                  <option value="REVIEW">REVIEW</option>
                  <option value="FAIL">FAIL</option>
                </select>
              </div>
            </div>

            {/* Input Stimulus & Hardware Profile */}
            <div className="space-y-1 bg-[#07111F] p-3 rounded border border-[#24364A] text-xs">
              <span className="text-[10px] text-[#8FA4B8] uppercase font-bold flex items-center gap-1.5">
                <Sliders className="h-3 w-3 text-[#4DA3FF]" />
                INPUT STIMULUS &amp; TEST CONDITIONS
              </span>
              <p className="text-[#F4F7FA] leading-relaxed text-[11px]">
                {selectedTest.input}
              </p>
              <div className="pt-2 border-t border-[#24364A]/60 flex items-center justify-between text-[10px] text-[#8FA4B8]">
                <span>PLATFORM: {selectedTest.hardwarePlatform || 'Simulated Jetson AGX Orin'}</span>
                <span className="bg-[#122438] text-[#4DA3FF] px-1.5 py-0.2 rounded border border-[#24364A]">
                  SIMULATION
                </span>
              </div>
            </div>

            {/* Expected vs Observed Results */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-[#07111F] border border-[#24364A] space-y-1">
                <span className="text-[10px] text-[#8FA4B8] uppercase font-bold block">
                  EXPECTED RESULT
                </span>
                <p className="text-[11px] text-[#8FA4B8] leading-relaxed">
                  {selectedTest.expectedResult}
                </p>
              </div>

              <div className="p-2.5 rounded bg-[#07111F] border border-[#24364A] space-y-1">
                <span className="text-[10px] text-[#39D98A] uppercase font-bold block">
                  OBSERVED RESULT
                </span>
                <p className="text-[11px] text-[#F4F7FA] leading-relaxed">
                  {selectedTest.observedResult}
                </p>
              </div>
            </div>

            {/* Telemetry Metrics Grid for this Test */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
                <span className="text-[9px] text-[#8FA4B8] uppercase block">CONFIDENCE</span>
                <span className="text-sm font-bold text-[#39D98A] tabular-nums">
                  {selectedTest.confidenceScore}%
                </span>
              </div>
              <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
                <span className="text-[9px] text-[#8FA4B8] uppercase block">LATENCY</span>
                <span className="text-sm font-bold text-[#4DA3FF] tabular-nums">
                  {selectedTest.processingLatencyMs} ms
                </span>
              </div>
              <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
                <span className="text-[9px] text-[#8FA4B8] uppercase block">DETECTIONS</span>
                <span className="text-sm font-bold text-[#F4F7FA] tabular-nums">
                  {selectedTest.detectionCount}
                </span>
              </div>
              <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
                <span className="text-[9px] text-[#8FA4B8] uppercase block">FP / FN</span>
                <span className="text-sm font-bold text-[#F5B942] tabular-nums">
                  {selectedTest.falsePositives} / {selectedTest.falseNegatives}
                </span>
              </div>
            </div>

            {/* Operator Notes Editor */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#8FA4B8] uppercase font-bold flex items-center justify-between">
                <span>ENGINEERING AUDIT NOTES</span>
                <span className="text-[9px] text-[#4DA3FF]">AUDIT EVIDENCE TRAIL</span>
              </label>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={3}
                className="w-full bg-[#07111F] border border-[#24364A] rounded p-2.5 text-xs text-[#F4F7FA] focus:outline-none focus:border-[#4DA3FF] leading-relaxed resize-none font-mono"
                placeholder="Enter engineering rationale, observed boundary behaviors, or re-test justification..."
              />
            </div>

            {/* Inspector Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#24364A]">
              <button
                onClick={() => handleRunSingleTest(selectedTest.testId)}
                disabled={executingTestId === selectedTest.testId}
                className="px-3 py-1.5 rounded bg-[#07111F] border border-[#24364A] hover:border-[#4DA3FF] text-[#4DA3FF] font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {executingTestId === selectedTest.testId ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>EXECUTING...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    <span>RE-EXECUTE TEST</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSaveInspectorEdits}
                className="px-3 py-1.5 rounded bg-[#39D98A] hover:bg-[#2fc478] text-[#07111F] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Save className="h-3 w-3" />
                <span>SAVE AUDIT NOTES</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. FAILURE ANALYSIS: KNOWN LIMITATIONS SECTION */}
      <div className="space-y-3 pt-3 border-t border-[#24364A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-[#F5B942]" />
            <h2 className="text-base font-bold text-[#F4F7FA] font-display uppercase tracking-wider">
              FAILURE ANALYSIS &amp; KNOWN LIMITATIONS
            </h2>
          </div>
          <span className="text-[10px] text-[#8FA4B8] bg-[#122438] px-2 py-0.5 rounded border border-[#24364A]">
            7 FORMAL BOUNDARY CONDITIONS DISCLOSED
          </span>
        </div>

        <p className="text-xs text-[#8FA4B8] leading-relaxed max-w-4xl">
          Transparent engineering characterization of physical, optical, and logistical constraints.
          In accordance with aerospace validation practice, the system handles boundary conditions through
          graceful degradation, confidence penalization, and human-in-the-loop review rather than uncalibrated extrapolation.
        </p>

        {/* 7 Known Limitations Technical Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {limitations.map((lim) => {
            const isHigh = lim.severity === 'HIGH';
            const isMedium = lim.severity === 'MEDIUM';

            return (
              <div
                key={lim.id}
                className="rounded-lg border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-2.5 flex flex-col justify-between hover:border-[#4DA3FF]/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F4F7FA] text-xs font-display flex items-center gap-1.5">
                      <span className="text-[#4DA3FF] text-[11px] font-mono">{lim.id}</span>
                      <span>{lim.title}</span>
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        isHigh
                          ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border-[#FF5C6C]/40'
                          : isMedium
                          ? 'bg-[#F5B942]/20 text-[#F5B942] border-[#F5B942]/40'
                          : 'bg-[#4DA3FF]/20 text-[#4DA3FF] border-[#4DA3FF]/40'
                      }`}
                    >
                      SEVERITY: {lim.severity}
                    </span>
                  </div>

                  {/* Observed Failure Mode */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase text-[#FF5C6C] font-bold block">
                      OBSERVED FAILURE MODE:
                    </span>
                    <p className="text-[11px] text-[#8FA4B8] leading-relaxed">
                      {lim.observedFailureMode}
                    </p>
                  </div>

                  {/* Current Prototype Mitigation */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase text-[#39D98A] font-bold block">
                      CURRENT PROTOTYPE MITIGATION:
                    </span>
                    <p className="text-[11px] text-[#F4F7FA] leading-relaxed">
                      {lim.prototypeMitigation}
                    </p>
                  </div>
                </div>

                {/* Footer: Engineering Impact & Roadmap Next Step */}
                <div className="pt-2 border-t border-[#24364A]/60 space-y-1 text-[10px]">
                  <div className="text-[#8FA4B8]">
                    <span className="text-[#8FA4B8]/60 uppercase font-semibold">IMPACT:</span>{' '}
                    <span>{lim.engineeringImpact}</span>
                  </div>
                  <div className="text-[#4DA3FF]">
                    <span className="text-[#4DA3FF]/70 uppercase font-semibold">NEXT STEP:</span>{' '}
                    <span>{lim.roadmapNextStep}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Technical Evaluation Sign-off Footer */}
      <div className="p-3 rounded-lg border border-[#24364A] bg-[#07111F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#8FA4B8]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-[#4DA3FF]" />
          <span className="text-[#F4F7FA] font-bold">A.U.D.I.T. EVALUATION INTEGRITY STATEMENT</span>
        </div>
        <div className="text-[11px]">
          Empirical records formatted for technical flight trial committee review · Revision 2.4.0
        </div>
      </div>
    </div>
  );
};
