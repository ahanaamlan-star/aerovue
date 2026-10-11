import React, { useState } from 'react';
import { SimulationParams } from '../../types';
import { X, Play, Sliders, CheckSquare, Square, RefreshCw } from 'lucide-react';

interface SimulationLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunSimulation: (params: SimulationParams, navigateToDiscrepancies?: boolean) => Promise<any>;
  isLoading: boolean;
}

export const SimulationLabModal: React.FC<SimulationLabModalProps> = ({
  isOpen,
  onClose,
  onRunSimulation,
  isLoading,
}) => {
  const [warehouseName, setWarehouseName] = useState('WH-01 (Apex Logistics)');
  const [rackCount, setRackCount] = useState(4);
  const [skusPerRack, setSkusPerRack] = useState(6);
  const [discrepancyRate, setDiscrepancyRate] = useState(30);
  const [altitude, setAltitude] = useState(3.5);
  const [fov, setFov] = useState(84);

  const [faults, setFaults] = useState({
    missingItems: true,
    unexpectedItems: true,
    wrongLocation: true,
    quantityMismatch: true,
    labelMismatch: true,
  });

  if (!isOpen) return null;

  const toggleFault = (key: keyof typeof faults) => {
    setFaults((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExecute = async () => {
    await onRunSimulation({
      warehouseName,
      rackCount,
      skusPerRack,
      discrepancyRatePct: discrepancyRate,
      cameraAltitudeM: altitude,
      cameraFovDeg: fov,
      faults,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07111F]/85 backdrop-blur-xs font-mono">
      <div className="w-full max-w-2xl rounded border border-[#24364A] bg-[#0D1B2A] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#24364A] bg-[#07111F]">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-4 w-4 text-[#4DA3FF]" />
            <div>
              <h2 className="text-sm font-bold text-[#F4F7FA] font-display">
                SIMULATION & FAULT INJECTION LAB
              </h2>
              <p className="text-[11px] text-[#8FA4B8]">
                Generate synthetic warehouse scenarios with controlled anomaly injection
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

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Section 1: Facility & Geometry */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#4DA3FF]">
              FACILITY CONFIGURATION
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#8FA4B8] mb-1">
                  WAREHOUSE FACILITY ID
                </label>
                <input
                  type="text"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#07111F] border border-[#24364A] rounded text-[#F4F7FA] focus:outline-none focus:border-[#4DA3FF]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-[#8FA4B8] mb-1">
                  <span>ACTIVE RACKS</span>
                  <span className="text-[#4DA3FF] font-bold">{rackCount} RACKS</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={rackCount}
                  onChange={(e) => setRackCount(parseInt(e.target.value, 10))}
                  className="w-full accent-[#4DA3FF]"
                />
                <div className="flex justify-between text-[9px] text-[#8FA4B8]">
                  <span>2 RACKS</span>
                  <span>6 RACKS (MAX)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: UAV Camera & Discrepancy Rate */}
          <div className="space-y-2 pt-3 border-t border-[#24364A]">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#4DA3FF]">
              UAV SENSOR & ANOMALY DENSITY
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#8FA4B8] mb-1">
                  <span>DISCREPANCY RATE</span>
                  <span className="text-[#F5B942] font-bold">{discrepancyRate}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={discrepancyRate}
                  onChange={(e) => setDiscrepancyRate(parseInt(e.target.value, 10))}
                  className="w-full accent-[#F5B942]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-[#8FA4B8] mb-1">
                  <span>CAMERA ALTITUDE</span>
                  <span className="text-[#4DA3FF] font-bold">{altitude}m</span>
                </div>
                <input
                  type="range"
                  min={2.0}
                  max={6.0}
                  step={0.5}
                  value={altitude}
                  onChange={(e) => setAltitude(parseFloat(e.target.value))}
                  className="w-full accent-[#4DA3FF]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-[#8FA4B8] mb-1">
                  <span>FIELD OF VIEW</span>
                  <span className="text-[#4DA3FF] font-bold">{fov}°</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={110}
                  step={4}
                  value={fov}
                  onChange={(e) => setFov(parseInt(e.target.value, 10))}
                  className="w-full accent-[#4DA3FF]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Controlled Fault Injection Options */}
          <div className="space-y-2 pt-3 border-t border-[#24364A]">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#4DA3FF]">
              FAULT INJECTION MATRIX
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { id: 'quantityMismatch', label: 'Quantity Mismatch' },
                { id: 'missingItems', label: 'Missing Inventory' },
                { id: 'wrongLocation', label: 'Wrong Location / Misplaced' },
                { id: 'unexpectedItems', label: 'Unexpected / Extraneous Item' },
                { id: 'labelMismatch', label: 'Label / Barcode Mismatch' },
              ].map((fault) => {
                const key = fault.id as keyof typeof faults;
                const checked = faults[key];
                return (
                  <div
                    key={fault.id}
                    onClick={() => toggleFault(key)}
                    className={`p-2 rounded border cursor-pointer transition-colors flex items-center gap-2 ${
                      checked
                        ? 'border-[#4DA3FF]/60 bg-[#122438] text-[#F4F7FA]'
                        : 'border-[#24364A] bg-[#07111F] text-[#8FA4B8] hover:border-[#8FA4B8]'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="h-3.5 w-3.5 text-[#4DA3FF]" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-[#8FA4B8]" />
                    )}
                    <span className="font-semibold text-[11px]">{fault.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#24364A] bg-[#07111F] text-xs">
          <div className="text-[11px] text-[#8FA4B8]">
            Synthesizes inventory records and executes AEROVUE pipeline
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#8FA4B8] hover:text-[#F4F7FA] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              disabled={isLoading}
              className="px-3 py-1.5 bg-[#4DA3FF] hover:bg-[#3d8ee6] text-[#07111F] font-bold rounded transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>Synthesize & Run Scan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
