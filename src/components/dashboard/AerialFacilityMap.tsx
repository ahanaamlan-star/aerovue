import React, { useState } from 'react';
import { WarehouseBin, DiscrepancyRecord, UAVTelemetry } from '../../types';
import { Navigation, Crosshair, ZoomIn, ZoomOut, Layers, Radio } from 'lucide-react';

interface AerialFacilityMapProps {
  bins: WarehouseBin[];
  discrepancies: DiscrepancyRecord[];
  onSelectBin: (bin: WarehouseBin) => void;
  selectedBinId?: string;
  uavCoordinates?: { x: number; y: number; z: number };
  telemetry?: UAVTelemetry;
  headingDegrees?: number;
}

export const AerialFacilityMap: React.FC<AerialFacilityMapProps> = ({
  bins,
  discrepancies,
  onSelectBin,
  selectedBinId,
  uavCoordinates = { x: 14.8, y: 8.2, z: 3.6 },
  telemetry,
  headingDegrees,
}) => {
  const [activeLayer, setActiveLayer] = useState<'all' | 'anomalies' | 'coverage'>('all');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredBin, setHoveredBin] = useState<WarehouseBin | null>(null);

  // Dynamic UAV position calculation:
  // Project warehouse boundary convention: 30.0m length (X) by 20.0m width (Y).
  // Safely extract coordinates from telemetry or uavCoordinates prop.
  const rawX = telemetry?.coordinates?.x ?? uavCoordinates?.x;
  const rawY = telemetry?.coordinates?.y ?? uavCoordinates?.y;
  const rawZ = telemetry?.altitudeMeters ?? telemetry?.coordinates?.z ?? uavCoordinates?.z ?? 3.6;
  const heading = telemetry?.headingDegrees ?? headingDegrees ?? 0;
  const droneName = telemetry?.droneId ? telemetry.droneId.split(' ')[0] : 'UAV-RAVEN-04';

  // Convert to map-relative percentages:
  // - Metric coordinates: x in [0, 30m], y in [0, 20m]
  // - Normalized coordinates: x in [0, 1.0], y in [0, 1.0]
  // - Percentage coordinates: x in [0, 100]
  let mapX = 38;
  let mapY = 34;

  if (typeof rawX === 'number' && Number.isFinite(rawX) && typeof rawY === 'number' && Number.isFinite(rawY)) {
    if (rawX >= 0 && rawX <= 1.0 && rawY >= 0 && rawY <= 1.0) {
      mapX = rawX * 100;
      mapY = rawY * 100;
    } else if (rawX <= 30.0 && rawY <= 20.0) {
      mapX = (rawX / 30.0) * 100;
      mapY = (rawY / 20.0) * 100;
    } else {
      mapX = rawX;
      mapY = rawY;
    }
  }

  // Prevent drone icon and camera frustum from escaping map boundaries
  const boundedLeft = Math.min(88, Math.max(12, mapX));
  const boundedTop = Math.min(85, Math.max(15, mapY));

  // Group bins into 3 primary zones & racks
  const zoneA_racks = ['Rack A01', 'Rack A02'];
  const zoneB_racks = ['Rack B01', 'Rack B02'];
  const zoneC_racks = ['Rack C01'];

  const getStatusColor = (status: WarehouseBin['currentStatus']) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-[#FF5C6C]/20 border-[#FF5C6C] text-[#FF5C6C] hover:bg-[#FF5C6C]/30';
      case 'HIGH_RISK':
        return 'bg-[#F5B942]/20 border-[#F5B942] text-[#F5B942] hover:bg-[#F5B942]/30';
      case 'WARNING':
        return 'bg-[#F5B942]/10 border-[#F5B942]/60 text-[#F5B942] hover:bg-[#F5B942]/20';
      case 'NORMAL':
      default:
        return 'bg-[#39D98A]/10 border-[#39D98A]/50 text-[#39D98A] hover:bg-[#39D98A]/20';
    }
  };

  const getStatusDot = (status: WarehouseBin['currentStatus']) => {
    switch (status) {
      case 'CRITICAL':
        return '#FF5C6C';
      case 'HIGH_RISK':
        return '#F5B942';
      case 'WARNING':
        return '#F5B942';
      case 'NORMAL':
      default:
        return '#39D98A';
    }
  };

  return (
    <div className="rounded border border-[#24364A] bg-[#0D1B2A] overflow-hidden flex flex-col font-mono">
      {/* Map Control Top Bar */}
      <div className="px-4 py-2.5 bg-[#07111F] border-b border-[#24364A] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-[#4DA3FF]" />
          <span className="font-bold text-[#F4F7FA] tracking-wider text-[11px] uppercase">
            AERIAL FACILITY MAP
          </span>
          <span className="text-[#8FA4B8]">·</span>
          <span className="text-[11px] text-[#8FA4B8]">WH-01 DIGITAL TWIN</span>
        </div>

        {/* Tactical Map HUD Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#122438] p-0.5 rounded border border-[#24364A]">
            <button
              onClick={() => setActiveLayer('all')}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                activeLayer === 'all'
                  ? 'bg-[#4DA3FF] text-[#07111F] font-bold'
                  : 'text-[#8FA4B8] hover:text-[#F4F7FA]'
              }`}
            >
              ALL BAYS
            </button>
            <button
              onClick={() => setActiveLayer('anomalies')}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                activeLayer === 'anomalies'
                  ? 'bg-[#FF5C6C] text-[#07111F] font-bold'
                  : 'text-[#8FA4B8] hover:text-[#F4F7FA]'
              }`}
            >
              ANOMALIES ONLY
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#8FA4B8]">
            <span className="h-2 w-2 rounded-full bg-[#39D98A] inline-block" /> Normal
            <span className="h-2 w-2 rounded-full bg-[#F5B942] inline-block ml-1" /> High Risk
            <span className="h-2 w-2 rounded-full bg-[#FF5C6C] inline-block ml-1" /> Critical
          </div>
        </div>
      </div>

      {/* Main Tactical Map Surface */}
      <div className="relative h-[340px] sm:h-[400px] w-full bg-[#07111F] aerovue-grid overflow-hidden p-4 select-none">
        {/* Coordinate Axis Legend */}
        <div className="absolute top-2 left-2 text-[9px] text-[#8FA4B8]/60 space-y-0.5">
          <div>ORIGIN: [0.0, 0.0] FACILITY_NORTH: 000°</div>
          <div>DATUM: WGS84-LOCAL · RESOLUTION: 0.05m/px</div>
        </div>

        {/* Flight Trajectory Vector Path SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#4DA3FF" />
            </marker>
          </defs>

          {/* Planned UAV Flight Track */}
          <path
            d="M 60 70 L 180 70 L 320 70 L 460 70 L 460 170 L 320 170 L 180 170 L 60 170 L 60 270 L 260 270"
            fill="none"
            stroke="#4DA3FF"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* Trajectory Direction Waypoint Points */}
          {[
            { cx: 60, cy: 70 },
            { cx: 320, cy: 70 },
            { cx: 460, cy: 170 },
            { cx: 180, cy: 170 },
            { cx: 260, cy: 270 },
          ].map((pt, i) => (
            <circle
              key={i}
              cx={pt.cx}
              cy={pt.cy}
              r="2.5"
              fill="#07111F"
              stroke="#4DA3FF"
              strokeWidth="1.5"
            />
          ))}
        </svg>

        {/* Drone Dynamic Camera Frustum & Position Icon */}
        <div
          className="absolute z-20 pointer-events-none transition-all duration-700 flex flex-col items-center"
          style={{
            left: `${boundedLeft.toFixed(1)}%`,
            top: `${boundedTop.toFixed(1)}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Rotatable UAV and Camera Frustum group aligned with telemetry orientation */}
          <div
            className="flex flex-col items-center transition-transform duration-500"
            style={{
              transform: `rotate(${heading}deg)`,
              transformOrigin: 'center 40px',
            }}
          >
            {/* Projected Camera Footprint Frustum Box */}
            <div className="w-28 h-20 border border-[#4DA3FF]/80 bg-[#4DA3FF]/10 rounded-sm -translate-y-2 flex flex-col items-center justify-between p-1">
              <span className="text-[8px] text-[#4DA3FF] tracking-wider uppercase font-bold">
                CAM FRUSTUM · FOV {telemetry?.cameraFovDeg ?? 84}°
              </span>
              <div className="w-2 h-2 border-t border-l border-[#4DA3FF]" />
              <span className="text-[7px] text-[#8FA4B8] font-mono">SWEEP: 4.8m²</span>
            </div>

            {/* UAV Chevrons / Rotor Symbol */}
            <div className="relative -mt-10 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-[#0D1B2A] border-2 border-[#4DA3FF] shadow-lg shadow-[#4DA3FF]/40 flex items-center justify-center">
                <Navigation className="h-3 w-3 text-[#4DA3FF] transform rotate-45" />
              </div>
              {/* Rotor blade circles */}
              <div className="absolute -top-1 -left-1 h-2 w-2 rounded-full border border-[#4DA3FF]/70" />
              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full border border-[#4DA3FF]/70" />
              <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full border border-[#4DA3FF]/70" />
              <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full border border-[#4DA3FF]/70" />
            </div>
          </div>

          <span className="text-[9px] text-[#4DA3FF] bg-[#07111F]/90 px-1.5 py-0.5 rounded border border-[#24364A] mt-1 font-bold whitespace-nowrap">
            {droneName} [{Number.isFinite(rawZ) ? rawZ.toFixed(1) : '3.6'}m ALT] · SIM
          </span>
        </div>

        {/* Rack Layout Sections */}
        <div className="relative z-10 h-full flex flex-col justify-between py-2 px-1">
          {/* ZONE A: High Bay Aisle 01 */}
          <div className="rounded border border-[#24364A]/80 bg-[#0D1B2A]/70 p-2.5 backdrop-blur-xs">
            <div className="flex items-center justify-between mb-1.5 text-[10px] text-[#8FA4B8]">
              <span className="font-bold text-[#F4F7FA]">ZONE A · HIGH BAY AISLE 01</span>
              <span>RACKS A01 — A02</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {bins
                .filter((b) => b.zone === 'Zone A')
                .map((bin) => {
                  const hasDiscrepancy = bin.currentStatus !== 'NORMAL';
                  if (activeLayer === 'anomalies' && !hasDiscrepancy) return null;
                  const isSelected = selectedBinId === bin.id;

                  return (
                    <div
                      key={bin.id}
                      onClick={() => onSelectBin(bin)}
                      onMouseEnter={() => setHoveredBin(bin)}
                      onMouseLeave={() => setHoveredBin(null)}
                      className={`p-2 rounded border cursor-pointer transition-all ${getStatusColor(
                        bin.currentStatus
                      )} ${isSelected ? 'ring-2 ring-[#4DA3FF] border-[#4DA3FF]' : ''}`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span>{bin.displayCode}</span>
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: getStatusDot(bin.currentStatus) }}
                        />
                      </div>
                      <div className="text-[9px] truncate text-[#8FA4B8] mt-0.5">
                        {bin.expectedSku || 'EMPTY'}
                      </div>
                      <div className="flex items-center justify-between text-[9px] mt-1 font-bold">
                        <span>EXP: {bin.expectedQty}</span>
                        <span>OBS: {bin.observedQty}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* ZONE B: Mid Bay Aisle 02 */}
          <div className="rounded border border-[#24364A]/80 bg-[#0D1B2A]/70 p-2.5 backdrop-blur-xs">
            <div className="flex items-center justify-between mb-1.5 text-[10px] text-[#8FA4B8]">
              <span className="font-bold text-[#F4F7FA]">ZONE B · AVIONICS & STORAGE AISLE 02</span>
              <span>RACKS B01 — B02</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {bins
                .filter((b) => b.zone === 'Zone B')
                .map((bin) => {
                  const hasDiscrepancy = bin.currentStatus !== 'NORMAL';
                  if (activeLayer === 'anomalies' && !hasDiscrepancy) return null;
                  const isSelected = selectedBinId === bin.id;

                  return (
                    <div
                      key={bin.id}
                      onClick={() => onSelectBin(bin)}
                      onMouseEnter={() => setHoveredBin(bin)}
                      onMouseLeave={() => setHoveredBin(null)}
                      className={`p-2 rounded border cursor-pointer transition-all ${getStatusColor(
                        bin.currentStatus
                      )} ${isSelected ? 'ring-2 ring-[#4DA3FF] border-[#4DA3FF]' : ''}`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span>{bin.displayCode}</span>
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: getStatusDot(bin.currentStatus) }}
                        />
                      </div>
                      <div className="text-[9px] truncate text-[#8FA4B8] mt-0.5">
                        {bin.expectedSku || 'EMPTY'}
                      </div>
                      <div className="flex items-center justify-between text-[9px] mt-1 font-bold">
                        <span>EXP: {bin.expectedQty}</span>
                        <span>OBS: {bin.observedQty}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* ZONE C: Heavy Hardware Aisle 03 */}
          <div className="rounded border border-[#24364A]/80 bg-[#0D1B2A]/70 p-2.5 backdrop-blur-xs">
            <div className="flex items-center justify-between mb-1.5 text-[10px] text-[#8FA4B8]">
              <span className="font-bold text-[#F4F7FA]">ZONE C · FASTENERS & SENSORS AISLE 03</span>
              <span>RACK C01</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {bins
                .filter((b) => b.zone === 'Zone C')
                .map((bin) => {
                  const hasDiscrepancy = bin.currentStatus !== 'NORMAL';
                  if (activeLayer === 'anomalies' && !hasDiscrepancy) return null;
                  const isSelected = selectedBinId === bin.id;

                  return (
                    <div
                      key={bin.id}
                      onClick={() => onSelectBin(bin)}
                      onMouseEnter={() => setHoveredBin(bin)}
                      onMouseLeave={() => setHoveredBin(null)}
                      className={`p-2 rounded border cursor-pointer transition-all ${getStatusColor(
                        bin.currentStatus
                      )} ${isSelected ? 'ring-2 ring-[#4DA3FF] border-[#4DA3FF]' : ''}`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span>{bin.displayCode}</span>
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: getStatusDot(bin.currentStatus) }}
                        />
                      </div>
                      <div className="text-[9px] truncate text-[#8FA4B8] mt-0.5">
                        {bin.expectedSku || 'EMPTY'}
                      </div>
                      <div className="flex items-center justify-between text-[9px] mt-1 font-bold">
                        <span>EXP: {bin.expectedQty}</span>
                        <span>OBS: {bin.observedQty}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Hovered Bin Details Strip */}
      <div className="px-4 py-2 bg-[#07111F] border-t border-[#24364A] flex flex-wrap items-center justify-between text-[11px] text-[#8FA4B8]">
        {hoveredBin ? (
          <div className="flex items-center gap-3">
            <span className="text-[#F4F7FA] font-bold">BIN {hoveredBin.displayCode}</span>
            <span>·</span>
            <span>{hoveredBin.zone} / {hoveredBin.rack} / {hoveredBin.binNumber}</span>
            <span>·</span>
            <span className="text-[#4DA3FF]">SKU: {hoveredBin.expectedSku}</span>
            <span>·</span>
            <span>DELTA: {hoveredBin.observedQty - hoveredBin.expectedQty}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[#8FA4B8]">
            <Radio className="h-3 w-3 text-[#4DA3FF]" />
            <span>Click any bay on the tactical grid to inspect discrepancies and evidence crop</span>
          </div>
        )}
        <div className="font-mono text-[10px] text-[#8FA4B8]">
          GRID COORDS: X={typeof rawX === 'number' && Number.isFinite(rawX) ? rawX.toFixed(1) : '14.8'}m Y={typeof rawY === 'number' && Number.isFinite(rawY) ? rawY.toFixed(1) : '8.2'}m Z={typeof rawZ === 'number' && Number.isFinite(rawZ) ? rawZ.toFixed(1) : '3.6'}m <span className="text-[#4DA3FF]">[SIMULATED]</span>
        </div>
      </div>
    </div>
  );
};
