import React, { useState } from 'react';
import { ConfidenceWeightConfig, InventoryItem } from '../../types';
import { DataIngestionService } from '../../services/dataIngestion';
import { SAMPLE_AERIAL_IMAGES } from '../../data/mockWarehouseData';
import {
  X,
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
  Sliders,
  Download,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface DataIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  confidenceWeights: ConfidenceWeightConfig;
  onUpdateWeights: (weights: ConfidenceWeightConfig) => void;
  onLoadCustomInventory: (items: InventoryItem[]) => void;
  onSelectSampleImage: (imgSrc: string) => void;
}

export const DataIngestionModal: React.FC<DataIngestionModalProps> = ({
  isOpen,
  onClose,
  confidenceWeights,
  onUpdateWeights,
  onLoadCustomInventory,
  onSelectSampleImage,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'imagery' | 'weights' | 'disclaimer'>(
    'inventory'
  );
  const [csvText, setCsvText] = useState('');
  const [parseStatus, setParseStatus] = useState<{
    success?: boolean;
    message?: string;
    count?: number;
  }>({});

  const [localWeights, setLocalWeights] = useState<ConfidenceWeightConfig>({ ...confidenceWeights });

  const dataService = new DataIngestionService();

  if (!isOpen) return null;

  const handleWeightChange = (key: keyof ConfidenceWeightConfig, val: number) => {
    setLocalWeights((prev) => {
      const updated = { ...prev, [key]: val };
      return updated;
    });
  };

  const handleSaveWeights = () => {
    onUpdateWeights(localWeights);
    onClose();
  };

  const handleParseCSV = () => {
    if (!csvText.trim()) {
      setParseStatus({ success: false, message: 'Please paste CSV content or upload a file.' });
      return;
    }
    const result = dataService.parseInventoryCSV(csvText);
    if (result.success && result.data) {
      onLoadCustomInventory(result.data);
      setParseStatus({
        success: true,
        message: `Successfully parsed and loaded ${result.itemCount} inventory items into AEROVUE.`,
        count: result.itemCount,
      });
    } else {
      setParseStatus({
        success: false,
        message: result.errors?.join('; ') || 'Failed to parse CSV.',
      });
    }
  };

  const handleLoadSampleCSV = () => {
    const sample = dataService.generateSampleCSV();
    setCsvText(sample);
    setParseStatus({ success: true, message: 'Sample inventory CSV template loaded.' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onSelectSampleImage(dataUrl);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/85 backdrop-blur-xs font-mono">
      <div className="w-full max-w-2xl rounded border border-[#24364A] bg-[#0D1B2A] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#24364A] bg-[#07111F]">
          <div className="flex items-center gap-2.5">
            <Upload className="h-4 w-4 text-[#4DA3FF]" />
            <div>
              <h2 className="text-sm font-bold text-[#F4F7FA] font-display">
                DATA INGESTION & CALIBRATION HUB
              </h2>
              <p className="text-[11px] text-[#8FA4B8]">
                Configure aerial imagery feeds, inventory schemas, and confidence weights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8FA4B8] hover:text-[#F4F7FA] hover:bg-[#122438] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Nav */}
        <div className="flex border-b border-[#24364A] bg-[#07111F] px-5 gap-2">
          {[
            { id: 'inventory', label: 'INVENTORY (CSV/JSON)', icon: FileSpreadsheet },
            { id: 'imagery', label: 'AERIAL SENSOR FEED', icon: ImageIcon },
            { id: 'weights', label: 'CONFIDENCE WEIGHTS', icon: Sliders },
            { id: 'disclaimer', label: 'SYSTEM DISCLOSURE', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#4DA3FF] text-[#4DA3FF]'
                    : 'border-transparent text-[#8FA4B8] hover:text-[#F4F7FA]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: INVENTORY CSV / JSON */}
          {activeTab === 'inventory' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[11px] font-bold text-[#F4F7FA] uppercase">
                    WAREHOUSE INVENTORY DATA
                  </h3>
                  <p className="text-[10px] text-[#8FA4B8]">
                    Upload expected warehouse ledger (SKU, expectedQuantity, rack, bin, criticality)
                  </p>
                </div>
                <button
                  onClick={handleLoadSampleCSV}
                  className="px-2.5 py-1 text-[11px] text-[#4DA3FF] bg-[#122438] border border-[#24364A] rounded hover:bg-[#1b324b] transition-colors flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  <span>LOAD TEMPLATE</span>
                </button>
              </div>

              <div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Paste CSV format or load template..."
                  className="w-full p-2.5 font-mono text-[10px] bg-[#07111F] border border-[#24364A] rounded text-[#F4F7FA] placeholder-[#8FA4B8]/50 focus:outline-none focus:border-[#4DA3FF]"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="cursor-pointer px-3 py-1.5 text-xs text-[#8FA4B8] hover:text-[#F4F7FA] bg-[#122438] hover:bg-[#1b324b] rounded transition-colors border border-[#24364A] inline-flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload .CSV File</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleParseCSV}
                  className="px-3.5 py-1.5 bg-[#4DA3FF] hover:bg-[#3d8ee6] text-[#07111F] font-bold rounded transition-colors"
                >
                  Ingest & Validate Schema
                </button>
              </div>

              {parseStatus.message && (
                <div
                  className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                    parseStatus.success
                      ? 'border-[#39D98A]/50 bg-[#39D98A]/10 text-[#39D98A]'
                      : 'border-[#FF5C6C]/50 bg-[#FF5C6C]/10 text-[#FF5C6C]'
                  }`}
                >
                  {parseStatus.success ? (
                    <CheckCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{parseStatus.message}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AERIAL IMAGERY SOURCE */}
          {activeTab === 'imagery' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-[11px] font-bold text-[#F4F7FA] uppercase">
                  AERIAL IMAGERY SELECTION
                </h3>
                <p className="text-[10px] text-[#8FA4B8]">
                  Select preloaded UAV inspection capture or upload custom drone frame
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'overview',
                    name: 'Warehouse Overview',
                    src: SAMPLE_AERIAL_IMAGES.warehouseOverview,
                    desc: 'Full aisle high-bay camera frame',
                  },
                  {
                    id: 'detail',
                    name: 'Rack Bay Detail (A01-02)',
                    src: SAMPLE_AERIAL_IMAGES.rackBayDetail,
                    desc: 'Elevated inspection perspective',
                  },
                  {
                    id: 'flight',
                    name: 'Flight Perspective',
                    src: SAMPLE_AERIAL_IMAGES.flightPerspective,
                    desc: 'Hovering telemetry viewpoint',
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectSampleImage(item.src);
                      onClose();
                    }}
                    className="border border-[#24364A] hover:border-[#4DA3FF] rounded overflow-hidden cursor-pointer transition-colors bg-[#07111F]"
                  >
                    <div className="aspect-video bg-[#07111F] relative overflow-hidden">
                      <img
                        src={item.src}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-bold text-[#F4F7FA]">{item.name}</div>
                      <div className="text-[10px] text-[#8FA4B8] mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#24364A]">
                <label className="cursor-pointer w-full py-2.5 px-3 border border-dashed border-[#24364A] hover:border-[#4DA3FF] rounded bg-[#07111F] flex items-center justify-center gap-2 text-xs text-[#8FA4B8] hover:text-[#F4F7FA] transition-colors">
                  <Upload className="h-3.5 w-3.5 text-[#4DA3FF]" />
                  <span>Upload Drone Photo (PNG, JPG, WebP)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: CONFIDENCE CALIBRATION */}
          {activeTab === 'weights' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-[11px] font-bold text-[#F4F7FA] uppercase">
                  PROTOTYPE CONFIDENCE WEIGHTS
                </h3>
                <p className="text-[10px] text-[#8FA4B8]">
                  Confidence = Vision Weight + Spatial Weight + Temporal Weight. Calibrate relative influence.
                </p>
              </div>

              <div className="space-y-3 p-3.5 rounded border border-[#24364A] bg-[#07111F]">
                <div>
                  <div className="flex justify-between text-xs text-[#F4F7FA] mb-1">
                    <span>VISION CONFIDENCE WEIGHT</span>
                    <span className="text-[#4DA3FF] font-bold">
                      {localWeights.visionWeight.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.8}
                    step={0.05}
                    value={localWeights.visionWeight}
                    onChange={(e) =>
                      handleWeightChange('visionWeight', parseFloat(e.target.value))
                    }
                    className="w-full accent-[#4DA3FF]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#F4F7FA] mb-1">
                    <span>SPATIAL CONFIDENCE WEIGHT</span>
                    <span className="text-[#4DA3FF] font-bold">
                      {localWeights.spatialWeight.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.8}
                    step={0.05}
                    value={localWeights.spatialWeight}
                    onChange={(e) =>
                      handleWeightChange('spatialWeight', parseFloat(e.target.value))
                    }
                    className="w-full accent-[#4DA3FF]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#F4F7FA] mb-1">
                    <span>TEMPORAL CONFIDENCE WEIGHT</span>
                    <span className="text-[#4DA3FF] font-bold">
                      {localWeights.temporalWeight.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={0.6}
                    step={0.05}
                    value={localWeights.temporalWeight}
                    onChange={(e) =>
                      handleWeightChange('temporalWeight', parseFloat(e.target.value))
                    }
                    className="w-full accent-[#4DA3FF]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveWeights}
                  className="px-3.5 py-1.5 bg-[#4DA3FF] hover:bg-[#3d8ee6] text-[#07111F] font-bold rounded transition-colors"
                >
                  Apply Calibration Weights
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM HONESTY & SPECIFICATIONS */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-3 leading-relaxed">
              <div className="p-3 rounded border border-[#4DA3FF]/40 bg-[#4DA3FF]/10 text-[#4DA3FF] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="h-4 w-4" />
                  <span>Engineering Disclosure & Reliability Principle</span>
                </div>
                <p className="text-[11px] text-[#F4F7FA]">
                  AEROVUE is an aerospace & computer vision prototype developed for the A.U.D.I.T. trials. It clearly distinguishes demo heuristic modules from future production deep learning pipelines.
                </p>
              </div>

              <div className="rounded border border-[#24364A] bg-[#07111F] p-3 space-y-1">
                <div className="font-bold text-[#F4F7FA] text-[11px] uppercase">
                  DEMO PERCEPTION VS PRODUCTION MODEL
                </div>
                <p className="text-[#8FA4B8] text-[11px]">
                  <strong>Current Demo:</strong> Uses deterministic bounding box extraction, spatial containment mapping, and simulated image feature extraction to demonstrate the intelligence pipeline without requiring on-device GPU acceleration in the browser.
                </p>
                <p className="text-[#8FA4B8] text-[11px]">
                  <strong>Production Target:</strong> PyTorch/YOLOv10-UAV model with ONNX Runtime FP16 inference executed on an onboard NVIDIA Jetson Orin edge computer.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
