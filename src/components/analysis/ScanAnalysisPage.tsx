import React, { useState } from 'react';
import {
  PerceptionEngine,
  DemoPerceptionEngine,
  IngestedScanFrame,
  PerceptionOutput,
  LocalizedDetection,
  DEMO_SCENARIOS,
  DemoScenario,
} from '../../services/perceptionEngine';
import { DiscrepancyRecord } from '../../types';
import { ConfidenceStack } from '../common/ConfidenceStack';
import {
  Crosshair,
  Camera,
  Layers,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  Upload,
  Play,
  RefreshCw,
  Sliders,
  Info,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Split,
  Eye,
  Clock,
  History,
} from 'lucide-react';

interface ScanAnalysisPageProps {
  discrepancy: DiscrepancyRecord | null;
  allDiscrepancies: DiscrepancyRecord[];
  onSelectDiscrepancy: (disc: DiscrepancyRecord) => void;
  onUpdateVerification: (
    id: string,
    status: DiscrepancyRecord['verification']['status'],
    notes?: string
  ) => void;
  onOpenReFlight?: () => void;
}

export const ScanAnalysisPage: React.FC<ScanAnalysisPageProps> = ({
  discrepancy,
  allDiscrepancies,
  onSelectDiscrepancy,
  onUpdateVerification,
  onOpenReFlight,
}) => {
  // Scenario state
  const [activeScenario, setActiveScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const [currentFrame, setCurrentFrame] = useState<IngestedScanFrame>(DEMO_SCENARIOS[0].scanMetadata);
  const [activeDetections, setActiveDetections] = useState<LocalizedDetection[]>(
    DEMO_SCENARIOS[0].detections
  );
  const [selectedDetectionId, setSelectedDetectionId] = useState<string>(
    DEMO_SCENARIOS[0].detections[0]?.id || ''
  );

  // View mode: 'original' | 'processed' | 'overlay'
  const [viewMode, setViewMode] = useState<'original' | 'processed' | 'overlay'>('processed');
  const [showBinBounds, setShowBinBounds] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  // Analysis workflow execution state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingStep, setCurrentProcessingStep] = useState<string>('');
  const [inferenceLatencyMs, setInferenceLatencyMs] = useState<number>(78);

  // Operator Verification state
  const [operatorNotes, setOperatorNotes] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const perceptionEngine: PerceptionEngine = new DemoPerceptionEngine();

  // Switch scenario
  const handleSelectScenario = (scenario: DemoScenario) => {
    setActiveScenario(scenario);
    setCurrentFrame(scenario.scanMetadata);
    setActiveDetections(scenario.detections);
    setSelectedDetectionId(scenario.detections[0]?.id || '');

    // Correlate with parent discrepancy list if matching location exists
    const match = allDiscrepancies.find(
      (d) => d.location.binDisplay === scenario.detections[0]?.associatedLocation.binDisplay
    );
    if (match) {
      onSelectDiscrepancy(match);
    }
  };

  // Upload custom aerial image
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const customFrame: IngestedScanFrame = {
        scanId: `AU-CUSTOM-${Date.now().toString(36).toUpperCase()}`,
        source: 'UPLOADED_IMAGE',
        imageSrc: dataUrl,
        imageSize: `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        missionId: 'CUSTOM-UPLOAD-TEST',
        altitudeM: 3.5,
        gimbalPitchDeg: -45,
      };
      setCurrentFrame(customFrame);
      // Run automatic analysis on uploaded frame
      runAnalysis(customFrame);
    };
    reader.readAsDataURL(file);
  };

  // Run multi-stage analysis pipeline
  const runAnalysis = async (frameToAnalyze: IngestedScanFrame = currentFrame) => {
    setIsProcessing(true);

    const stages = [
      'INGESTING IMAGE...',
      'DETECTING OBJECTS...',
      'MAPPING LOCATIONS...',
      'COMPARING INVENTORY...',
      'GENERATING FINDINGS...',
    ];

    for (let i = 0; i < stages.length; i++) {
      setCurrentProcessingStep(stages[i]);
      await new Promise((r) => setTimeout(r, 120));
    }

    const output = await perceptionEngine.analyze(frameToAnalyze);
    setActiveDetections(output.detections);
    setSelectedDetectionId(output.detections[0]?.id || '');
    setInferenceLatencyMs(output.processingTimeMs);
    setIsProcessing(false);
    setCurrentProcessingStep('');
  };

  // Safe Fallback Detection Object to prevent null pointer crashes
  const fallbackDetection: LocalizedDetection = {
    id: 'DET-000',
    box: { x: 20, y: 20, width: 60, height: 60 },
    label: 'Unassigned Bin Space',
    sku: discrepancy?.expectedSku || 'SKU-PENDING',
    confidence: 0.92,
    associatedLocation: {
      zone: discrepancy?.location?.zone || 'Zone A',
      rack: discrepancy?.location?.rack || 'Rack 01',
      shelf: discrepancy?.location?.shelf || 1,
      bin: discrepancy?.location?.bin || 'Bin 01',
      binDisplay: discrepancy?.location?.binDisplay || 'A01-01',
    },
    expectedQuantity: discrepancy?.expectedQuantity ?? 0,
    observedQuantity: discrepancy?.observedQuantity ?? 0,
    delta: (discrepancy?.observedQuantity ?? 0) - (discrepancy?.expectedQuantity ?? 0),
    status: 'NORMAL',
    riskLevel: discrepancy?.risk?.level || 'LOW',
    whyFlagged:
      discrepancy?.explanation?.why ||
      'Optical detection and telemetry correlation pending frame analysis.',
  };

  // Selected detection object (safe against empty lists)
  const activeObj: LocalizedDetection =
    activeDetections.find((d) => d.id === selectedDetectionId) ||
    activeDetections[0] ||
    fallbackDetection;

  const handleAction = (status: DiscrepancyRecord['verification']['status']) => {
    if (discrepancy) {
      onUpdateVerification(discrepancy.id, status, operatorNotes);
    } else if (allDiscrepancies.length > 0) {
      const matched =
        allDiscrepancies.find(
          (d) => d.location.binDisplay === activeObj.associatedLocation.binDisplay
        ) || allDiscrepancies[0];
      onUpdateVerification(matched.id, status, operatorNotes);
    }
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Top Header & Pre-Processing Metadata HUD */}
      <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#F4F7FA] font-display">
              AERIAL COMPUTER VISION WORKSPACE
            </h1>
            <span className="text-[10px] uppercase bg-[#122438] text-[#4DA3FF] px-2 py-0.5 rounded border border-[#24364A] font-bold">
              PERCEPTION LAYER
            </span>
          </div>
          <div className="text-[11px] text-[#8FA4B8] mt-0.5">
            AERIAL IMAGE → OBJECT DETECTION → LOCATION ASSOCIATION → INVENTORY RECOGNITION → DISCREPANCY
          </div>
        </div>

        {/* Scan Metadata HUD Tags */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8FA4B8]">
          <div className="px-2 py-0.5 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[#8FA4B8]/60">SCAN ID:</span>{' '}
            <span className="text-[#F4F7FA] font-bold">{currentFrame.scanId}</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[#8FA4B8]/60">SOURCE:</span>{' '}
            <span className="text-[#4DA3FF] font-bold">{currentFrame.source}</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[#8FA4B8]/60">SIZE:</span>{' '}
            <span className="text-[#F4F7FA]">{currentFrame.imageSize}</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[#8FA4B8]/60">TIME:</span>{' '}
            <span className="text-[#F4F7FA]">{currentFrame.timestamp.split(' ')[1] || '10:48:12'}</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-[#07111F] border border-[#24364A]">
            <span className="text-[#8FA4B8]/60">MISSION:</span>{' '}
            <span className="text-[#F4F7FA] font-bold">{currentFrame.missionId}</span>
          </div>
        </div>
      </div>

      {/* Analysis Action Strip & Multi-Stage Processing Pipeline */}
      <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => runAnalysis()}
            disabled={isProcessing}
            className={`px-4 py-2 font-bold rounded transition-colors flex items-center gap-2 ${
              isProcessing
                ? 'bg-[#4DA3FF]/40 text-[#F4F7FA] cursor-wait'
                : 'bg-[#4DA3FF] hover:bg-[#3d8ee6] text-[#07111F] shadow-sm shadow-[#4DA3FF]/20 active:scale-95'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>{currentProcessingStep}</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>ANALYZE SCAN</span>
              </>
            )}
          </button>

          {isProcessing ? (
            <div className="flex items-center gap-2 text-[11px] text-[#4DA3FF] animate-pulse">
              <span>PIPELINE RUNNING: {currentProcessingStep}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-[#8FA4B8]">
              <span className="h-2 w-2 rounded-full bg-[#39D98A]" />
              <span>INFERENCE COMPLETE IN <strong className="text-[#F4F7FA]">{inferenceLatencyMs} ms</strong></span>
              <span>·</span>
              <span className="text-[10px] text-[#F5B942] bg-[#122438] px-1.5 py-0.5 rounded border border-[#24364A]">
                DEMO DETECTION / SIMULATED INFERENCE
              </span>
            </div>
          )}
        </div>

        {/* View Mode Controls: Original / Processed / Overlay */}
        <div className="flex items-center gap-1.5 bg-[#07111F] p-1 rounded border border-[#24364A]">
          <span className="text-[10px] text-[#8FA4B8] px-2 font-bold">VIEW MODE:</span>
          {(['original', 'processed', 'overlay'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded uppercase transition-colors ${
                viewMode === mode
                  ? 'bg-[#4DA3FF] text-[#07111F] font-bold'
                  : 'text-[#8FA4B8] hover:text-[#F4F7FA]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* THREE-PANEL ANALYSIS WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* PANEL 1 (LEFT): SOURCE IMAGE & SCENARIO SELECTOR (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          {/* Scenario Selector */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-[#24364A] pb-2 text-[11px]">
              <span className="font-bold text-[#F4F7FA] uppercase">DEMO SCENARIOS</span>
              <span className="text-[#8FA4B8]">5 TRIALS</span>
            </div>

            <div className="space-y-1.5">
              {DEMO_SCENARIOS.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc)}
                  className={`p-2 rounded border cursor-pointer transition-colors text-xs space-y-0.5 ${
                    activeScenario.id === sc.id
                      ? 'border-[#4DA3FF] bg-[#122438] text-[#4DA3FF]'
                      : 'border-[#24364A]/70 bg-[#07111F] text-[#8FA4B8] hover:border-[#8FA4B8]'
                  }`}
                >
                  <div className="font-bold text-[11px] text-[#F4F7FA] truncate">{sc.name}</div>
                  <div className="text-[10px] text-[#8FA4B8] truncate">{sc.tagline}</div>
                </div>
              ))}
            </div>

            {/* Custom Image Upload Button */}
            <div className="pt-2 border-t border-[#24364A]">
              <label className="cursor-pointer w-full py-1.5 px-2 bg-[#07111F] hover:bg-[#122438] border border-dashed border-[#24364A] hover:border-[#4DA3FF] rounded flex items-center justify-center gap-1.5 text-[11px] text-[#8FA4B8] hover:text-[#F4F7FA] transition-colors">
                <Upload className="h-3 w-3 text-[#4DA3FF]" />
                <span>UPLOAD CUSTOM IMAGE</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Raw Frame Crop Thumbnail */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 space-y-2">
            <div className="text-[11px] font-bold text-[#F4F7FA] uppercase border-b border-[#24364A] pb-1.5 flex items-center justify-between">
              <span>SOURCE FRAME RAW</span>
              <Camera className="h-3.5 w-3.5 text-[#4DA3FF]" />
            </div>

            <div className="aspect-[4/3] rounded overflow-hidden border border-[#24364A] bg-[#07111F] relative">
              <img
                src={currentFrame.imageSrc}
                alt="Source raw capture"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 left-1 bg-[#07111F]/80 px-1.5 py-0.2 rounded text-[8px] text-[#8FA4B8]">
                RAW OPTICAL SENSOR
              </div>
            </div>

            <div className="text-[10px] text-[#8FA4B8] space-y-0.5 pt-1">
              <div>ALTITUDE: {currentFrame.altitudeM} m</div>
              <div>GIMBAL PITCH: {currentFrame.gimbalPitchDeg}°</div>
              <div>SENSOR: SONY EXMOR 4K</div>
            </div>
          </div>
        </div>

        {/* PANEL 2 (CENTER): PROCESSED IMAGE WITH DETECTION OVERLAYS (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] overflow-hidden">
            {/* Viewport Top Bar */}
            <div className="px-3 py-2 bg-[#07111F] border-b border-[#24364A] flex items-center justify-between text-xs text-[#8FA4B8]">
              <div className="flex items-center gap-2">
                <span className="text-[#39D98A] font-bold">● COMPUTER VISION INFERENCE</span>
                <span>·</span>
                <span className="text-[#F4F7FA]">MODE: {viewMode.toUpperCase()}</span>
              </div>

              {/* Overlay Toggle Controls */}
              <div className="flex items-center gap-3 text-[10px]">
                <label className="flex items-center gap-1 cursor-pointer hover:text-[#F4F7FA]">
                  <input
                    type="checkbox"
                    checked={showBinBounds}
                    onChange={(e) => setShowBinBounds(e.target.checked)}
                    className="accent-[#4DA3FF]"
                  />
                  <span>BIN REGION</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer hover:text-[#F4F7FA]">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                    className="accent-[#4DA3FF]"
                  />
                  <span>LABELS</span>
                </label>
              </div>
            </div>

            {/* Main Optical Frame Canvas with Thin Technical Overlays */}
            <div className="relative aspect-[4/3] bg-[#07111F] overflow-hidden select-none group">
              <img
                src={currentFrame.imageSrc}
                alt="Perception frame"
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  viewMode === 'original' ? 'opacity-100' : viewMode === 'overlay' ? 'opacity-85' : 'opacity-95'
                }`}
              />

              {/* Bin Bounds Overlay (When in processed or overlay mode) */}
              {viewMode !== 'original' &&
                showBinBounds &&
                activeDetections.map((det) => (
                  <div
                    key={`bin-${det.id}`}
                    className="absolute border border-dashed border-[#4DA3FF] bg-[#4DA3FF]/10 pointer-events-none transition-all"
                    style={{
                      left: `${det.box.x - 1}%`,
                      top: `${det.box.y - 1}%`,
                      width: `${det.box.width + 2}%`,
                      height: `${det.box.height + 2}%`,
                    }}
                  >
                    <div className="absolute top-0 left-0 bg-[#07111F]/90 text-[#4DA3FF] text-[8px] px-1 py-0.2 border-r border-b border-[#4DA3FF]">
                      {det.associatedLocation.zone.toUpperCase()} · {det.associatedLocation.rack.toUpperCase()} · {det.associatedLocation.bin.toUpperCase()}
                    </div>
                  </div>
                ))}

              {/* Thin Technical Bounding Boxes Overlay */}
              {viewMode !== 'original' &&
                activeDetections.map((det) => {
                  const isSelected = det.id === selectedDetectionId;
                  const isAnomaly = det.status !== 'NORMAL';
                  const boxBorderColor = isAnomaly
                    ? det.riskLevel === 'CRITICAL'
                      ? '#FF5C6C'
                      : '#F5B942'
                    : '#39D98A';

                  return (
                    <div
                      key={det.id}
                      onClick={() => setSelectedDetectionId(det.id)}
                      className={`absolute cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-2 ring-[#4DA3FF] z-20'
                          : 'hover:border-opacity-100 z-10'
                      }`}
                      style={{
                        left: `${det.box.x}%`,
                        top: `${det.box.y}%`,
                        width: `${det.box.width}%`,
                        height: `${det.box.height}%`,
                        border: `1.5px solid ${boxBorderColor}`,
                        backgroundColor: `${boxBorderColor}18`,
                      }}
                    >
                      {/* Thin Technical Label Tag */}
                      {showLabels && (
                        <div
                          className="absolute -top-5 left-0 px-1 py-0.2 text-[9px] font-bold rounded-xs whitespace-nowrap shadow-sm border"
                          style={{
                            backgroundColor: '#0D1B2A',
                            borderColor: boxBorderColor,
                            color: boxBorderColor,
                          }}
                        >
                          {det.sku} · {(det.confidence * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Optical Reticle Center Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                <div className="w-10 h-10 border border-[#F4F7FA]/60 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-[#4DA3FF] rounded-full" />
                </div>
              </div>

              {/* Watermark Tag */}
              <div className="absolute bottom-2 left-2 bg-[#07111F]/80 px-2 py-0.5 rounded border border-[#24364A] text-[9px] text-[#8FA4B8]">
                AEROVUE PERCEPTION · PIXEL MAP: 3840x2160 → WMS GRID
              </div>
            </div>

            {/* Expected vs Observed vs Delta Live Strip */}
            <div className="p-3 bg-[#07111F] border-t border-[#24364A] grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-[#0D1B2A] border border-[#24364A]">
                <div className="text-[10px] text-[#8FA4B8] uppercase">EXPECTED</div>
                <div className="text-lg font-bold text-[#F4F7FA] tabular-nums mt-0.5">
                  {activeObj.expectedQuantity}
                </div>
                <div className="text-[9px] text-[#8FA4B8]">WMS Ledger Record</div>
              </div>

              <div className="p-2 rounded bg-[#0D1B2A] border border-[#24364A]">
                <div className="text-[10px] text-[#8FA4B8] uppercase">OBSERVED</div>
                <div className="text-lg font-bold text-[#4DA3FF] tabular-nums mt-0.5">
                  {activeObj.observedQuantity}
                </div>
                <div className="text-[9px] text-[#4DA3FF]">Visual CV Detection</div>
              </div>

              <div className="p-2 rounded bg-[#0D1B2A] border border-[#24364A]">
                <div className="text-[10px] text-[#8FA4B8] uppercase">DELTA</div>
                <div
                  className={`text-lg font-bold tabular-nums mt-0.5 ${
                    activeObj.delta < 0
                      ? 'text-[#FF5C6C]'
                      : activeObj.delta > 0
                      ? 'text-[#F5B942]'
                      : 'text-[#39D98A]'
                  }`}
                >
                  {activeObj.delta > 0 ? `+${activeObj.delta}` : activeObj.delta}
                </div>
                <div className="text-[9px] text-[#8FA4B8]">Net Variance</div>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 3 (RIGHT): AEROVUE INTELLIGENCE & EVIDENCE (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Selected Detection Dossier */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#24364A] pb-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#4DA3FF]">{activeObj.id}</span>
                <span className="text-[#8FA4B8]">·</span>
                <span className="font-bold text-[#F4F7FA]">
                  BIN {activeObj.associatedLocation.binDisplay}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  activeObj.status === 'NORMAL'
                    ? 'bg-[#39D98A]/20 text-[#39D98A] border border-[#39D98A]/40'
                    : activeObj.riskLevel === 'CRITICAL'
                    ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border border-[#FF5C6C]/40'
                    : 'bg-[#F5B942]/20 text-[#F5B942] border border-[#F5B942]/40'
                }`}
              >
                {activeObj.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Location & Object Hierarchy */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8FA4B8]">OBJECT / SKU:</span>
                <span className="text-[#4DA3FF] font-bold">{activeObj.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8FA4B8]">LOCATION:</span>
                <span className="text-[#F4F7FA] font-bold">
                  {activeObj.associatedLocation.rack} / {activeObj.associatedLocation.bin}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8FA4B8]">BOUNDING COORDINATES:</span>
                <span className="text-[#8FA4B8] text-[10px]">
                  X={activeObj.box.x}%, Y={activeObj.box.y}%, W={activeObj.box.width}%, H={activeObj.box.height}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8FA4B8]">VISION CONFIDENCE:</span>
                <span className="text-[#39D98A] font-bold">
                  {(activeObj.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8FA4B8]">INFERENCE MODEL:</span>
                <span className="text-[#F5B942] text-[10px]">
                  DEMO DETECTION / SIMULATED INFERENCE
                </span>
              </div>
            </div>
          </div>

          {/* HUMAN VERIFICATION THRESHOLD WARNING BANNER */}
          {(activeObj.confidence < 0.85 || activeObj.status !== 'NORMAL') && (
            <div className="p-3 rounded border border-[#F5B942]/60 bg-[#F5B942]/10 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#F5B942]">
                <AlertTriangle className="h-4 w-4" />
                <span>REQUIRES HUMAN VERIFICATION</span>
              </div>
              <p className="text-[11px] text-[#F4F7FA]">
                Vision confidence is {(activeObj.confidence * 100).toFixed(0)}% (threshold 85%). Autonomous confirmation prohibited. Human operator review required.
              </p>
            </div>
          )}

          {/* TEMPORAL INTELLIGENCE & PERSISTENCE REASONING */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-2.5">
            <div className="text-[11px] font-bold text-[#F4F7FA] uppercase border-b border-[#24364A] pb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#4DA3FF]" />
                <span>TEMPORAL INTELLIGENCE</span>
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  activeObj.status === 'NORMAL'
                    ? 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/40'
                    : 'bg-[#FF5C6C]/20 text-[#FF5C6C] border-[#FF5C6C]/40'
                }`}
              >
                {activeObj.status === 'NORMAL' ? 'RESOLVED' : 'PERSISTENT DISCREPANCY'}
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#07111F] border border-[#24364A] space-y-2 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#8FA4B8]">PROTOTYPE PERSISTENCE SCORE:</span>
                <span
                  className={`font-bold text-sm ${
                    activeObj.status === 'NORMAL' ? 'text-[#39D98A]' : 'text-[#FF5C6C]'
                  }`}
                >
                  {activeObj.status === 'NORMAL' ? '0 / 100' : '90 / 100'}
                </span>
              </div>

              {/* Longitudinal Observation Timeline */}
              <div className="text-[10px] text-[#8FA4B8] pt-1 border-t border-[#24364A]/60">
                <div className="text-[#8FA4B8] font-bold mb-1">LONGITUDINAL OBSERVATIONS:</div>
                <div className="grid grid-cols-4 gap-1 text-[9px] text-center font-mono">
                  <div className="p-1 rounded bg-[#0D1B2A] border border-[#24364A]">
                    <div className="text-[#8FA4B8]">14:10</div>
                    <div className="text-[#39D98A] font-bold">NORMAL</div>
                  </div>
                  <div className="p-1 rounded bg-[#0D1B2A] border border-[#24364A]">
                    <div className="text-[#8FA4B8]">15:20</div>
                    <div className="text-[#F5B942] font-bold">MISMATCH</div>
                  </div>
                  <div className="p-1 rounded bg-[#0D1B2A] border border-[#24364A]">
                    <div className="text-[#8FA4B8]">16:30</div>
                    <div className="text-[#F5B942] font-bold">MISMATCH</div>
                  </div>
                  <div className="p-1 rounded bg-[#0D1B2A] border border-[#4DA3FF]">
                    <div className="text-[#8FA4B8]">18:50 (NOW)</div>
                    <div className="text-[#FF5C6C] font-bold">PERSISTENT</div>
                  </div>
                </div>
              </div>

              {/* Required Explanation & Honesty Disclaimer Text */}
              <div className="pt-2 border-t border-[#24364A]/60 space-y-1">
                <div className="text-[#F4F7FA] font-semibold text-[11px]">
                  “Similar discrepancy observed in {activeObj.status === 'NORMAL' ? 'previous epochs (now resolved).' : '3 consecutive scans.'}”
                </div>
                <div className="text-[10px] text-[#8FA4B8] italic">
                  “This increases prioritization confidence but does not independently establish the root cause.”
                </div>
              </div>
            </div>
          </div>

          {/* 6-PILLAR EXPLAINABILITY DOSSIER */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-2.5">
            <div className="text-[11px] font-bold text-[#F4F7FA] uppercase border-b border-[#24364A] pb-1 flex items-center justify-between">
              <span>6-PILLAR EXPLAINABILITY DOSSIER</span>
              <span className="text-[10px] text-[#4DA3FF]">REASONING CORE</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[#8FA4B8] text-[10px] block uppercase font-bold">WHAT:</span>
                <span className="text-[#F4F7FA] font-semibold">
                  {activeObj.status.replace(/_/g, ' ')} ({activeObj.delta > 0 ? `+${activeObj.delta}` : activeObj.delta} units variance)
                </span>
              </div>

              <div>
                <span className="text-[#8FA4B8] text-[10px] block uppercase font-bold">WHERE:</span>
                <span className="text-[#F4F7FA]">
                  {activeObj.associatedLocation.zone} · {activeObj.associatedLocation.rack} · Shelf {activeObj.associatedLocation.shelf} · {activeObj.associatedLocation.bin}
                </span>
              </div>

              <div>
                <span className="text-[#8FA4B8] text-[10px] block uppercase font-bold">WHY:</span>
                <span className="text-[#F4F7FA]">
                  {activeObj.whyFlagged}
                </span>
              </div>

              <div>
                <span className="text-[#8FA4B8] text-[10px] block uppercase font-bold">EVIDENCE:</span>
                <span className="text-[#8FA4B8]">
                  Aerial camera frame detection + WMS inventory record comparison.
                </span>
              </div>

              <div>
                <span className="text-[#8FA4B8] text-[10px] block uppercase font-bold">CONFIDENCE:</span>
                <span className="text-[#39D98A] font-bold">
                  {(activeObj.confidence * 100).toFixed(0)}% (Prototype Confidence Score)
                </span>
              </div>

              <div className="p-2 rounded bg-[#07111F] border border-[#24364A]">
                <span className="text-[#4DA3FF] text-[10px] block uppercase font-bold">RECOMMENDED ACTION:</span>
                <span className="text-[#F4F7FA]">
                  Re-scan / human verification: dispatch floor lead for physical cycle count.
                </span>
              </div>
            </div>
          </div>

          {/* VISIBLE RISK SCORING MODEL RULES */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-2 text-xs">
            <div className="text-[11px] font-bold text-[#F4F7FA] uppercase border-b border-[#24364A] pb-1 flex items-center justify-between">
              <span>PROTOTYPE RISK SCORING MODEL</span>
              <span className="text-[10px] text-[#F5B942]">METHODOLOGY</span>
            </div>

            <div className="p-2 rounded bg-[#07111F] border border-[#24364A] text-[11px] space-y-1">
              <div className="text-[#8FA4B8] text-[10px]">FORMULA:</div>
              <div className="text-[#4DA3FF] font-bold">
                Risk = Normalized(Severity × Confidence × Persistence)
              </div>
              <div className="text-[#8FA4B8] text-[10px] pt-1 border-t border-[#24364A]/60 flex justify-between">
                <span>SEVERITY: {activeObj.riskLevel === 'CRITICAL' ? '0.95' : '0.85'}</span>
                <span>CONF: {activeObj.confidence.toFixed(2)}</span>
                <span>PERSIST: 0.90</span>
              </div>
            </div>

            <div className="text-[10px] text-[#8FA4B8]/80 leading-tight">
              Scoring rule: Classified into LOW, MEDIUM, HIGH, CRITICAL based on item criticality and financial exposure. AEROVUE prototype model.
            </div>
          </div>

          {/* AEROVUE CONFIDENCE STACK */}
          <ConfidenceStack
            visionScore={Math.round(activeObj.confidence * 100)}
            spatialScore={91}
            temporalScore={activeObj.status === 'NORMAL' ? 95 : 80}
            overallScore={Math.round(activeObj.confidence * 45 + 91 * 0.35 + 80 * 0.2)}
            weights={{ vision: 0.45, spatial: 0.35, temporal: 0.2 }}
          />

          {/* Human-in-the-Loop Operator Verification Controls */}
          <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#F4F7FA] uppercase">OPERATOR SIGN-OFF</span>
              {savedFeedback && (
                <span className="text-[10px] text-[#39D98A] flex items-center gap-1 font-bold">
                  <Check className="h-3 w-3" /> VERIFIED
                </span>
              )}
            </div>

            <textarea
              rows={2}
              placeholder="Operator verification notes (e.g. 'Confirmed discrepancy with pallet supervisor')..."
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              className="w-full p-2 text-xs bg-[#07111F] border border-[#24364A] rounded text-[#F4F7FA] placeholder-[#8FA4B8]/50 focus:outline-none focus:border-[#4DA3FF]"
            />

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => handleAction('CONFIRMED')}
                className="py-1.5 px-2 bg-[#39D98A]/20 hover:bg-[#39D98A]/30 text-[#39D98A] border border-[#39D98A]/40 rounded font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Confirm</span>
              </button>

              <button
                onClick={() => handleAction('DISMISSED_FALSE_POSITIVE')}
                className="py-1.5 px-2 bg-[#07111F] hover:bg-[#122438] text-[#8FA4B8] hover:text-[#F4F7FA] border border-[#24364A] rounded font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Dismiss</span>
              </button>

              <button
                onClick={() => {
                  handleAction('REFLIGHT_REQUESTED');
                  if (onOpenReFlight) onOpenReFlight();
                }}
                className="py-1.5 px-2 bg-[#4DA3FF]/20 hover:bg-[#4DA3FF]/30 text-[#4DA3FF] border border-[#4DA3FF]/40 rounded font-semibold transition-colors flex items-center justify-center gap-1"
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
