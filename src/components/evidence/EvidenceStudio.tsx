import React, { useState } from 'react';
import { DiscrepancyRecord } from '../../types';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sliders,
  Maximize2,
  FileText,
  ShieldAlert,
  Info,
  Layers,
  Camera,
  Navigation,
  Check,
} from 'lucide-react';

interface EvidenceStudioProps {
  discrepancy: DiscrepancyRecord | null;
  onUpdateVerification: (
    id: string,
    status: DiscrepancyRecord['verification']['status'],
    notes?: string
  ) => void;
  onOpenReFlight?: () => void;
}

export const EvidenceStudio: React.FC<EvidenceStudioProps> = ({
  discrepancy,
  onUpdateVerification,
  onOpenReFlight,
}) => {
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showExpectedRegion, setShowExpectedRegion] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [operatorNotes, setOperatorNotes] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!discrepancy) {
    return (
      <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-12 text-center font-mono">
        <FileText className="h-10 w-10 text-[#8FA4B8]/60 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-[#F4F7FA]">No Discrepancy Selected</h3>
        <p className="text-xs text-[#8FA4B8] mt-1 max-w-sm mx-auto">
          Select an anomaly from the Discrepancy Table or Rack Map to inspect its visual evidence and 6-pillar explanation dossier.
        </p>
      </div>
    );
  }

  const handleAction = (status: DiscrepancyRecord['verification']['status']) => {
    onUpdateVerification(discrepancy.id, status, operatorNotes);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const delta = discrepancy.observedQuantity - discrepancy.expectedQuantity;

  return (
    <div className="space-y-5 font-mono">
      {/* Top Header Card */}
      <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#4DA3FF] font-bold">{discrepancy.id}</span>
            <span className="text-[#8FA4B8]">·</span>
            <span className="text-[#F4F7FA]">Bin {discrepancy.location.binDisplay}</span>
            <span className="text-[#8FA4B8]">·</span>
            <span className="text-[#8FA4B8]">{discrepancy.location.zone}, {discrepancy.location.rack}</span>
          </div>
          <h2 className="text-lg font-bold text-[#F4F7FA] font-display">
            {discrepancy.explanation.what}
          </h2>
          <div className="text-xs text-[#8FA4B8]">
            Detected during Scan <span className="text-[#F4F7FA] font-bold">{discrepancy.scanId}</span> at {discrepancy.timestamp}
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-[#8FA4B8] uppercase tracking-wider font-semibold">Operator State</div>
            <div className="text-xs font-bold text-[#F4F7FA]">
              {discrepancy.verification.status === 'CONFIRMED' && (
                <span className="text-[#39D98A]">Verified & Confirmed</span>
              )}
              {discrepancy.verification.status === 'DISMISSED_FALSE_POSITIVE' && (
                <span className="text-[#8FA4B8]">Dismissed as False Positive</span>
              )}
              {discrepancy.verification.status === 'REFLIGHT_REQUESTED' && (
                <span className="text-[#4DA3FF]">UAV Re-flight Scheduled</span>
              )}
              {discrepancy.verification.status === 'PENDING_REVIEW' && (
                <span className="text-[#F5B942]">Pending Operator Sign-off</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Evidence on Left, Intelligence & Explanation on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Visual Aerial Evidence (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] overflow-hidden">
            {/* Viewport Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#07111F] border-b border-[#24364A] text-xs">
              <div className="flex items-center gap-2 text-[#8FA4B8]">
                <Camera className="h-4 w-4 text-[#4DA3FF]" />
                <span className="text-[#F4F7FA] font-bold">
                  {discrepancy.evidence.sourceFrameId}
                </span>
                <span>· Alt: {discrepancy.evidence.cameraAltitudeM}m</span>
                <span>· Gimbal: {discrepancy.evidence.gimbalAngleDeg}°</span>
              </div>

              {/* Overlay Toggles */}
              <div className="flex items-center gap-3 text-[10px]">
                <label className="flex items-center gap-1 cursor-pointer text-[#8FA4B8] hover:text-[#F4F7FA]">
                  <input
                    type="checkbox"
                    checked={showBoundingBoxes}
                    onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                    className="accent-[#4DA3FF]"
                  />
                  <span>Detections</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-[#8FA4B8] hover:text-[#F4F7FA]">
                  <input
                    type="checkbox"
                    checked={showExpectedRegion}
                    onChange={(e) => setShowExpectedRegion(e.target.checked)}
                    className="accent-[#4DA3FF]"
                  />
                  <span>Bin Bounds</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-[#8FA4B8] hover:text-[#F4F7FA]">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                    className="accent-[#4DA3FF]"
                  />
                  <span>Labels</span>
                </label>
              </div>
            </div>

            {/* Aerial Image Container with Overlays */}
            <div className="relative aspect-[16/10] bg-[#07111F] overflow-hidden select-none group">
              <img
                src={discrepancy.evidence.imageSrc}
                alt={`Aerial UAV Frame for Bin ${discrepancy.location.binDisplay}`}
                className="w-full h-full object-cover transition-transform duration-300"
                referrerPolicy="no-referrer"
              />

              {/* Overlay Layer 1: Expected Bin Region */}
              {showExpectedRegion && (
                <div
                  className="absolute border border-dashed border-[#4DA3FF] bg-[#4DA3FF]/10 pointer-events-none transition-all"
                  style={{
                    left: `${discrepancy.evidence.expectedRegionBox.x}%`,
                    top: `${discrepancy.evidence.expectedRegionBox.y}%`,
                    width: `${discrepancy.evidence.expectedRegionBox.width}%`,
                    height: `${discrepancy.evidence.expectedRegionBox.height}%`,
                  }}
                >
                  <div className="absolute top-0 left-0 bg-[#07111F]/90 text-[#4DA3FF] text-[9px] px-1 py-0.2 border-r border-b border-[#4DA3FF]">
                    EXPECTED: {discrepancy.location.binDisplay}
                  </div>
                </div>
              )}

              {/* Overlay Layer 2: Detected Objects */}
              {showBoundingBoxes &&
                discrepancy.evidence.detectedBoxes.map((det) => (
                  <div
                    key={det.id}
                    className="absolute border border-[#F5B942] bg-[#F5B942]/15 pointer-events-none transition-all shadow-sm"
                    style={{
                      left: `${det.box.x}%`,
                      top: `${det.box.y}%`,
                      width: `${det.box.width}%`,
                      height: `${det.box.height}%`,
                    }}
                  >
                    {showLabels && (
                      <div className="absolute -top-5 left-0 bg-[#0D1B2A] border border-[#F5B942] text-[#F5B942] text-[9px] font-bold px-1 py-0.2 rounded-xs">
                        {det.label} ({(det.confidence * 100).toFixed(0)}%)
                      </div>
                    )}
                  </div>
                ))}

              {/* Viewport Crosshair Center */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                <div className="w-8 h-8 border border-[#F4F7FA]/60 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#4DA3FF] rounded-full" />
                </div>
              </div>

              {/* Subtle Sensor Overlay Watermark */}
              <div className="absolute bottom-2 left-2 bg-[#07111F]/90 border border-[#24364A] rounded px-2 py-0.5 text-[9px] text-[#8FA4B8]">
                UAV-GIMBAL CAM · RAW OPTICAL SENSOR CAPTURE
              </div>
            </div>

            {/* Evidence Sub-bar */}
            <div className="p-2.5 bg-[#07111F] border-t border-[#24364A] flex items-center justify-between text-xs text-[#8FA4B8]">
              <div className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-[#4DA3FF]" />
                <span className="text-[11px]">{discrepancy.evidence.notes || 'Line of sight unobstructed by aisle gantry.'}</span>
              </div>
              <span className="text-[10px]">
                {discrepancy.persistence.isPersistent ? 'PERSISTENT ACROSS SCANS' : 'SINGLE-SCAN EPOCH'}
              </span>
            </div>
          </div>

          {/* Ledger Comparison Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 text-center">
              <div className="text-[10px] text-[#8FA4B8] uppercase">Expected Qty</div>
              <div className="text-xl font-bold text-[#F4F7FA] tabular-nums mt-0.5">
                {discrepancy.expectedQuantity}
              </div>
              <div className="text-[9px] text-[#8FA4B8] mt-0.5">WMS Master Record</div>
            </div>

            <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 text-center">
              <div className="text-[10px] text-[#8FA4B8] uppercase">Observed Qty</div>
              <div className="text-xl font-bold text-[#4DA3FF] tabular-nums mt-0.5">
                {discrepancy.observedQuantity}
              </div>
              <div className="text-[9px] text-[#4DA3FF] mt-0.5">Visual Perception</div>
            </div>

            <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 text-center">
              <div className="text-[10px] text-[#8FA4B8] uppercase">Delta Variance</div>
              <div
                className={`text-xl font-bold tabular-nums mt-0.5 ${
                  delta < 0 ? 'text-[#FF5C6C]' : delta > 0 ? 'text-[#F5B942]' : 'text-[#39D98A]'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta}
              </div>
              <div className="text-[9px] text-[#8FA4B8] mt-0.5">Net Discrepancy</div>
            </div>
          </div>
        </div>

        {/* Right Column: Reasoning, Explanation Dossier & Verification (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Risk & Confidence Metric Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#8FA4B8] font-bold">
                PROTOTYPE CONFIDENCE
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-[#4DA3FF] tabular-nums">
                  {discrepancy.confidence.overall}%
                </span>
                <span className="text-[10px] text-[#8FA4B8]">Score</span>
              </div>
              <div className="mt-2 text-[10px] text-[#8FA4B8] space-y-0.5">
                <div>Vision: {(discrepancy.confidence.visionConfidence * 100).toFixed(0)}% (wt {discrepancy.confidence.weights.vision})</div>
                <div>Spatial: {(discrepancy.confidence.spatialConfidence * 100).toFixed(0)}% (wt {discrepancy.confidence.weights.spatial})</div>
                <div>Temporal: {(discrepancy.confidence.temporalConfidence * 100).toFixed(0)}% (wt {discrepancy.confidence.weights.temporal})</div>
              </div>
            </div>

            <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#8FA4B8] font-bold">
                PROTOTYPE RISK MODEL
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-2xl font-bold tabular-nums ${
                  discrepancy.risk.level === 'CRITICAL' ? 'text-[#FF5C6C]' :
                  discrepancy.risk.level === 'HIGH' ? 'text-[#F5B942]' : 'text-[#4DA3FF]'
                }`}>
                  {discrepancy.risk.level}
                </span>
                <span className="text-[10px] text-[#8FA4B8]">({discrepancy.risk.score}/100)</span>
              </div>
              <div className="mt-2 text-[10px] text-[#8FA4B8] space-y-0.5">
                <div>Severity factor: {discrepancy.risk.severityFactor}</div>
                <div>Persistence factor: {discrepancy.risk.persistenceFactor}</div>
                <div>Scans observed: {discrepancy.persistence.scanCount}</div>
              </div>
            </div>
          </div>

          {/* 6-Pillar Explainability Dossier */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#24364A] pb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F4F7FA]">
                EXPLAINABILITY DOSSIER
              </span>
              <span className="text-[10px] text-[#4DA3FF]">REASONING CORE</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[#8FA4B8] font-bold block text-[10px] uppercase">
                  1. WHAT HAPPENED:
                </span>
                <p className="text-[#F4F7FA] mt-0.5">{discrepancy.explanation.what}</p>
              </div>

              <div>
                <span className="text-[#8FA4B8] font-bold block text-[10px] uppercase">
                  2. LOCATION CONTEXT:
                </span>
                <p className="text-[#F4F7FA] mt-0.5 text-[11px]">
                  {discrepancy.explanation.where}
                </p>
              </div>

              <div>
                <span className="text-[#8FA4B8] font-bold block text-[10px] uppercase">
                  3. WHY FLAGGED:
                </span>
                <p className="text-[#F4F7FA] mt-0.5">{discrepancy.explanation.why}</p>
              </div>

              <div>
                <span className="text-[#8FA4B8] font-bold block text-[10px] uppercase">
                  4. SUPPORTING EVIDENCE:
                </span>
                <p className="text-[#8FA4B8] mt-0.5">{discrepancy.explanation.evidenceSummary}</p>
              </div>

              <div>
                <span className="text-[#8FA4B8] font-bold block text-[10px] uppercase">
                  5. SYSTEM CONFIDENCE:
                </span>
                <p className="text-[#39D98A] mt-0.5 text-[11px]">
                  {discrepancy.explanation.confidenceStatement}
                </p>
              </div>

              <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
                <span className="text-[#4DA3FF] font-bold block text-[10px] uppercase">
                  6. RECOMMENDED OPERATOR ACTION:
                </span>
                <p className="text-[#F4F7FA] mt-0.5 text-[11px]">
                  {discrepancy.explanation.recommendedAction}
                </p>
              </div>
            </div>
          </div>

          {/* Human Verification Action Controls */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F4F7FA]">
                OPERATOR SIGN-OFF
              </span>
              {savedFeedback && (
                <span className="text-xs text-[#39D98A] flex items-center gap-1 font-bold">
                  <Check className="h-3.5 w-3.5" />
                  <span>State Updated</span>
                </span>
              )}
            </div>

            <textarea
              placeholder="Operator notes (e.g. 'Dispatched physical cycle counter to Bay A01-02', 'Confirmed stock discrepancy with ERP')..."
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              rows={2}
              className="w-full p-2 text-xs bg-[#07111F] border border-[#24364A] rounded text-[#F4F7FA] placeholder-[#8FA4B8]/50 focus:outline-none focus:border-[#4DA3FF]"
            />

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAction('CONFIRMED')}
                className="py-1.5 px-2 text-xs font-bold text-[#39D98A] bg-[#39D98A]/20 hover:bg-[#39D98A]/30 border border-[#39D98A]/40 rounded transition-colors flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Confirm</span>
              </button>

              <button
                onClick={() => handleAction('DISMISSED_FALSE_POSITIVE')}
                className="py-1.5 px-2 text-xs font-semibold text-[#8FA4B8] bg-[#07111F] hover:bg-[#122438] border border-[#24364A] rounded transition-colors flex items-center justify-center gap-1"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Dismiss</span>
              </button>

              <button
                onClick={() => {
                  handleAction('REFLIGHT_REQUESTED');
                  if (onOpenReFlight) onOpenReFlight();
                }}
                className="py-1.5 px-2 text-xs font-bold text-[#4DA3FF] bg-[#4DA3FF]/20 hover:bg-[#4DA3FF]/30 border border-[#4DA3FF]/40 rounded transition-colors flex items-center justify-center gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Re-Scan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
