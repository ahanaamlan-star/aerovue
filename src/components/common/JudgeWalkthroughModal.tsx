/**
 * AEROVUE 30-SECOND JUDICIAL EVALUATION JOURNEY
 *
 * Designed to provide judges, competition reviewers, and technical leads
 * an immediate end-to-end understanding of AEROVUE within 30 seconds.
 *
 * 10-Step Sequential Walkthrough:
 * 1. Show warehouse
 * 2. Show UAV scan
 * 3. Show detections
 * 4. Show discrepancy
 * 5. Show evidence
 * 6. Show reasoning
 * 7. Show risk
 * 8. Show historical persistence
 * 9. Show simulation
 * 10. Show validation
 */

import React, { useState } from 'react';
import { NavigationPage } from '../layout/Sidebar';
import {
  Boxes,
  Navigation,
  Crosshair,
  AlertTriangle,
  Camera,
  Cpu,
  ShieldAlert,
  Clock,
  Compass,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';

interface JudgeWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigatePage: (page: NavigationPage) => void;
}

interface JourneyStep {
  stepNumber: number;
  title: string;
  targetPage: NavigationPage;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  technicalHighlights: string[];
  systemEvidence: string;
  statusBadge: string;
}

const JOURNEY_STEPS: JourneyStep[] = [
  {
    stepNumber: 1,
    title: 'Show Warehouse',
    targetPage: 'overview',
    tagline: 'Digital Twin Facility Topology',
    icon: Boxes,
    summary:
      'A digital twin of the industrial warehouse environment modeled hierarchically across Zones (A, B, C), Racks (A01-C01), Shelves, and Bins with real-time occupancy status.',
    technicalHighlights: [
      'Interactive 2D spatial grid with multi-layer overlays (All Bays vs Anomalies Only)',
      'Sub-meter coordinates mapped directly to WMS inventory storage bins',
      'Instant bay telemetry preview with active SKU and stock health status',
    ],
    systemEvidence: 'WH-01 digital twin: 11 active bays monitored across 3 designated zones.',
    statusBadge: 'FACILITY ACTIVE',
  },
  {
    stepNumber: 2,
    title: 'Show UAV Scan',
    targetPage: 'mission-planner',
    tagline: 'Autonomous Trajectory & Camera Footprint',
    icon: Navigation,
    summary:
      'Simulated UAV mission planner defining inspection boundaries, altitude, optical field of view (FOV), and generating repeatable waypoint trajectories with ground footprint projection.',
    technicalHighlights: [
      'Configurable altitude (2.0–7.0m) and optical FOV (60°–110°)',
      'Live flight kinematics: position [X, Y, Z], heading, ground speed, and battery',
      'Camera ground footprint calculation with scanned coverage visualization',
    ],
    systemEvidence: 'Simulated estimates: 100% aisle coverage across 12 automated waypoints.',
    statusBadge: 'SIMULATED ESTIMATES',
  },
  {
    stepNumber: 3,
    title: 'Show Detections',
    targetPage: 'scan-analysis',
    tagline: 'Aerial Computer Vision & Object Localization',
    icon: Crosshair,
    summary:
      'High-throughput computer vision pipeline processing aerial frames to identify inventory items, locate bounding boxes, and associate objects with physical rack and shelf coordinates.',
    technicalHighlights: [
      '3-Panel workspace: Source Image → Optical CV Overlays → Intelligence Dossier',
      'Real-time edge inference benchmark (78 ms on simulated Jetson AGX Orin)',
      'Thin bounding boxes with SKU labels, class probability, and bin coordinate association',
    ],
    systemEvidence: 'Perception output: 1,284 inventory units localized with 90.4% mean confidence.',
    statusBadge: 'PERCEPTION READY',
  },
  {
    stepNumber: 4,
    title: 'Show Discrepancy',
    targetPage: 'discrepancies',
    tagline: 'Rigorous Ledger vs Observation Variance Analysis',
    icon: AlertTriangle,
    summary:
      'Autonomous variance classification engine comparing optical counts against WMS inventory records to detect missing items, quantity mismatches, wrong locations, and unexpected stock.',
    technicalHighlights: [
      'Structured discrepancy taxonomy: MISSING, QUANTITY MISMATCH, WRONG LOCATION, UNEXPECTED',
      'Net delta calculation (Observed vs Expected ledger quantity)',
      'High/Critical priority triaging to prevent warehouse inventory drift',
    ],
    systemEvidence: '5 variances flagged: 1 Critical, 2 High, 2 Medium requiring audit.',
    statusBadge: 'AUDIT FLAGGED',
  },
  {
    stepNumber: 5,
    title: 'Show Evidence',
    targetPage: 'scan-analysis',
    tagline: 'Multi-Modal Aerial Verification Evidence',
    icon: Camera,
    summary:
      'Comprehensive evidence package binding raw optical crops, pixel bounding coordinates, GPS/telemetry position, and expected ledger data into an indisputable inspection audit trail.',
    technicalHighlights: [
      'Cropped optical evidence linked directly to scan frame AU-2026-001',
      'Precise pixel coordinates (X%, Y%, W%, H%) mapped to WMS physical bins',
      'Cross-sensor metadata including gimbal pitch angle (-45°) and hover altitude',
    ],
    systemEvidence: 'Inspection frame timestamp: 2026-10-05 14:32:08 UTC with EXIF metadata.',
    statusBadge: 'EVIDENCE LOGGED',
  },
  {
    stepNumber: 6,
    title: 'Show Reasoning',
    targetPage: 'scan-analysis',
    tagline: '6-Pillar Explainable Intelligence Dossier',
    icon: Cpu,
    summary:
      'Explainable AI architecture breaking each finding down into 6 formal pillars (WHAT, WHERE, WHY, EVIDENCE, CONFIDENCE, RECOMMENDED ACTION) with counterfactual logic.',
    technicalHighlights: [
      'Transparent rule-based deduction: why this finding was flagged vs alternate hypotheses',
      'Eliminates black-box opacity for safety-critical warehouse environments',
      'Direct recommendation (e.g. "Physical cycle count dispatch required")',
    ],
    systemEvidence: 'Dossier generated with automated human-in-the-loop verification protocol.',
    statusBadge: 'EXPLAINABLE AI',
  },
  {
    stepNumber: 7,
    title: 'Show Risk',
    targetPage: 'system',
    tagline: 'Severity × Confidence × Persistence Scoring & Failsafes',
    icon: ShieldAlert,
    summary:
      'Transparent mathematical risk assessment formula factoring SKU criticality, model confidence, and temporal persistence, backed by a 10-item Technical Risk Register and automated failsafes.',
    technicalHighlights: [
      'Formula: Risk = Normalized(Severity × Confidence × Persistence)',
      '10-Item Technical Risk Register (occlusion, blur, poor lighting, comms loss, etc.)',
      'Golden Mandate: Uncertain observations are flagged for review, never silently confirmed',
    ],
    systemEvidence: '4 Failsafe rules active: Low Conf → FLAG, Inconsistent → REVIEW, Comms → SAFE STATE.',
    statusBadge: 'FAILSAFES ARMED',
  },
  {
    stepNumber: 8,
    title: 'Show Historical Persistence',
    targetPage: 'history',
    tagline: 'Longitudinal Multi-Epoch Scan Comparison',
    icon: Clock,
    summary:
      'Temporal reasoning engine tracking discrepancies across repeated flight sessions (e.g. 14:10 → 15:20 → 16:30 → 18:50) to classify anomalies into NEW, INTERMITTENT, PERSISTENT, or RESOLVED.',
    technicalHighlights: [
      'Prototype persistence score (0–100) separating transient glitches from true errors',
      'Chronological timeline showing state progression across consecutive scan epochs',
      'Engineering truth disclaimer: persistence increases confidence but does not establish root cause',
    ],
    systemEvidence: '3 consecutive epochs verified for Bin A01-02 (Persistent status confirmed).',
    statusBadge: 'LONGITUDINAL AUDIT',
  },
  {
    stepNumber: 9,
    title: 'Show Simulation',
    targetPage: 'simulation-lab',
    tagline: 'Engineering Simulation Lab & Fault Injection',
    icon: Compass,
    summary:
      'Controlled test environment allowing engineers to configure warehouse parameters, inject controlled discrepancy scenarios, and execute simulated UAV scan flights.',
    technicalHighlights: [
      'Configurable warehouse dimensions, rack counts, bin density, and SKU catalogs',
      'Controlled fault presets: NORMAL, MISSING, MISMATCH, WRONG LOCATION, UNEXPECTED, PERSISTENT',
      'Two-stage experiment execution: "GENERATE SCENARIO" followed by "RUN SIMULATION"',
    ],
    systemEvidence: 'Synthetic test bench verifies end-to-end UAV → SCAN → PERCEPTION → RISK loop.',
    statusBadge: 'SIMULATION LAB',
  },
  {
    stepNumber: 10,
    title: 'Show Validation',
    targetPage: 'validation',
    tagline: '10 Empirical Test Cases & Systematic Validation',
    icon: CheckCircle2,
    summary:
      'Empirical verification environment documenting reproducible test runs (TEST-001 through TEST-010), latency benchmarks, and failure mode disclosures with strict non-fabrication discipline.',
    technicalHighlights: [
      '10 Systematic Test Cases (Normal, Missing, Mismatch, Occlusion, Low Lighting, etc.)',
      'Empirical metrics (Detection count, Discrepancy count, Confidence, Latency, FP/FN rates)',
      'Core Principle: "We are testing the system systematically rather than claiming perfection"',
    ],
    systemEvidence: 'Documented boundary conditions: occlusion, motion blur, lighting thresholds.',
    statusBadge: 'SYSTEMATIC TESTING',
  },
];

export const JudgeWalkthroughModal: React.FC<JudgeWalkthroughModalProps> = ({
  isOpen,
  onClose,
  onNavigatePage,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = JOURNEY_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    if (currentStepIndex < JOURNEY_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleJumpToModule = () => {
    onNavigatePage(currentStep.targetPage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-4xl bg-[#0D1B2A] border border-[#24364A] rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-[#07111F] border-b border-[#24364A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded bg-[#4DA3FF]/20 text-[#4DA3FF] border border-[#4DA3FF]/30">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#F4F7FA] font-display">
                  AEROVUE 30-SECOND JUDICIAL EVALUATION JOURNEY
                </span>
                <span className="text-[10px] bg-[#122438] text-[#4DA3FF] px-2 py-0.5 rounded border border-[#24364A] font-bold">
                  A.U.D.I.T. CHALLENGE
                </span>
              </div>
              <div className="text-[11px] text-[#8FA4B8]">
                Understand the complete UAV aerial discrepancy intelligence platform in 10 sequential steps
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#8FA4B8] hover:text-[#F4F7FA] hover:bg-[#122438] transition-colors"
            title="Close Walkthrough"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 10-Step Progress Navigation Strip */}
        <div className="px-5 py-2.5 bg-[#0A1624] border-b border-[#24364A] overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1 min-w-[720px]">
            {JOURNEY_STEPS.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;
              return (
                <button
                  key={step.stepNumber}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`flex-1 py-1.5 px-2 rounded text-center transition-all text-[11px] font-bold border flex items-center justify-center gap-1 ${
                    isActive
                      ? 'bg-[#4DA3FF] text-[#07111F] border-[#4DA3FF] shadow-sm shadow-[#4DA3FF]/20 font-extrabold'
                      : isPast
                      ? 'bg-[#122438] text-[#39D98A] border-[#24364A] hover:border-[#39D98A]/50'
                      : 'bg-[#07111F] text-[#8FA4B8] border-[#24364A] hover:text-[#F4F7FA] hover:border-[#8FA4B8]'
                  }`}
                  title={step.title}
                >
                  <span>{step.stepNumber}.</span>
                  <span className="truncate">{step.title.replace('Show ', '')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step Header & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#24364A] pb-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-lg bg-[#122438] border border-[#24364A] text-[#4DA3FF]">
                <StepIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#4DA3FF]">
                    STEP {currentStep.stepNumber} OF 10
                  </span>
                  <span className="text-[#8FA4B8]">·</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#07111F] border border-[#24364A] text-[#39D98A] font-bold">
                    {currentStep.statusBadge}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#F4F7FA] font-display mt-0.5">
                  {currentStep.title}: {currentStep.tagline}
                </h2>
                <p className="text-xs text-[#8FA4B8] mt-1 max-w-2xl">
                  {currentStep.summary}
                </p>
              </div>
            </div>

            <button
              onClick={handleJumpToModule}
              className="px-3.5 py-2 rounded bg-[#122438] hover:bg-[#1b324b] text-[#4DA3FF] border border-[#24364A] hover:border-[#4DA3FF] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <span>View in App</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Technical Highlights & Engineering Rigor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#07111F] border border-[#24364A] space-y-2.5">
              <div className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[#4DA3FF]" />
                <span>TECHNICAL CAPABILITIES</span>
              </div>
              <ul className="space-y-2 text-xs text-[#8FA4B8]">
                {currentStep.technicalHighlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#4DA3FF] font-bold">▸</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-[#07111F] border border-[#24364A] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#39D98A]" />
                  <span>EMPIRICAL VERIFICATION EVIDENCE</span>
                </div>
                <div className="mt-2 text-xs text-[#8FA4B8] bg-[#0D1B2A] p-3 rounded border border-[#24364A]/80 font-mono leading-relaxed">
                  {currentStep.systemEvidence}
                </div>
              </div>

              <div className="pt-2 border-t border-[#24364A]/60 flex items-center justify-between text-[11px] text-[#8FA4B8]">
                <span>MODULE TARGET:</span>
                <span className="text-[#4DA3FF] font-bold uppercase">{currentStep.targetPage}</span>
              </div>
            </div>
          </div>

          {/* 30-Second Fast Stepper Bar */}
          <div className="p-3 rounded-lg bg-[#122438]/60 border border-[#24364A] flex items-center justify-between text-xs text-[#8FA4B8]">
            <div className="flex items-center gap-2">
              <span className="text-[#F4F7FA] font-bold">30s FLOW:</span>
              <span className="text-[11px] hidden sm:inline">
                WAREHOUSE → SCAN → DETECT → DISCREPANCY → EVIDENCE → REASON → RISK → PERSISTENCE → SIM → VALIDATION
              </span>
            </div>
            <div className="text-[11px] text-[#4DA3FF]">
              Step {currentStep.stepNumber} / 10
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Controls */}
        <div className="px-5 py-3.5 bg-[#07111F] border-t border-[#24364A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStepIndex(0)}
              disabled={currentStepIndex === 0}
              className="p-1.5 rounded bg-[#122438] hover:bg-[#1b324b] text-[#8FA4B8] hover:text-[#F4F7FA] border border-[#24364A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs flex items-center gap-1"
              title="Restart from Step 1"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Restart</span>
            </button>
            <span className="text-xs text-[#8FA4B8] hidden sm:inline">
              Use arrow buttons to step through evaluation flow
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="px-3 py-1.5 rounded bg-[#122438] hover:bg-[#1b324b] text-[#8FA4B8] hover:text-[#F4F7FA] border border-[#24364A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs flex items-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            {currentStepIndex < JOURNEY_STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded bg-[#4DA3FF] hover:bg-[#3d8ee6] text-[#07111F] font-bold transition-colors text-xs flex items-center gap-1 shadow-sm shadow-[#4DA3FF]/20"
              >
                <span>Next Step</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleJumpToModule}
                className="px-4 py-1.5 rounded bg-[#39D98A] hover:bg-[#32c27b] text-[#07111F] font-bold transition-colors text-xs flex items-center gap-1 shadow-sm shadow-[#39D98A]/20"
              >
                <span>Explore Platform</span>
                <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
