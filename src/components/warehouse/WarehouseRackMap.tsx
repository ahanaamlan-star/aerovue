import React, { useState } from 'react';
import { WarehouseBin, DiscrepancyRecord } from '../../types';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, ArrowUpRight } from 'lucide-react';

interface WarehouseRackMapProps {
  bins: WarehouseBin[];
  discrepancies: DiscrepancyRecord[];
  onSelectDiscrepancy: (discrepancy: DiscrepancyRecord) => void;
  selectedDiscrepancyId?: string;
}

export const WarehouseRackMap: React.FC<WarehouseRackMapProps> = ({
  bins,
  discrepancies,
  onSelectDiscrepancy,
  selectedDiscrepancyId,
}) => {
  const [activeZone, setActiveZone] = useState<string>('ALL');
  const [hoveredBin, setHoveredBin] = useState<WarehouseBin | null>(null);

  // Group bins by zone and rack
  const zones = Array.from(new Set(bins.map((b) => b.zone)));
  const filteredBins = activeZone === 'ALL' ? bins : bins.filter((b) => b.zone === activeZone);

  const getStatusColor = (status: WarehouseBin['currentStatus']) => {
    switch (status) {
      case 'CRITICAL':
        return 'border-rose-500 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 shadow-rose-950/50';
      case 'HIGH_RISK':
        return 'border-amber-500 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 shadow-amber-950/50';
      case 'WARNING':
        return 'border-yellow-600/70 bg-yellow-950/20 text-yellow-300 hover:bg-yellow-900/30';
      case 'NORMAL':
      default:
        return 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-sky-500/40 hover:bg-slate-850';
    }
  };

  const getStatusDot = (status: WarehouseBin['currentStatus']) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-rose-500';
      case 'HIGH_RISK':
        return 'bg-amber-500';
      case 'WARNING':
        return 'bg-yellow-500';
      case 'NORMAL':
      default:
        return 'bg-emerald-500';
    }
  };

  const handleBinClick = (bin: WarehouseBin) => {
    if (bin.activeDiscrepancyId) {
      const match = discrepancies.find((d) => d.id === bin.activeDiscrepancyId);
      if (match) {
        onSelectDiscrepancy(match);
        return;
      }
    }
    // If no active discrepancy found, find any by location
    const byLoc = discrepancies.find((d) => d.location.binDisplay === bin.displayCode);
    if (byLoc) {
      onSelectDiscrepancy(byLoc);
    }
  };

  // Group by Rack for realistic industrial visualization
  const racks = Array.from(new Set(filteredBins.map((b) => b.rack))).sort();

  return (
    <div className="space-y-4">
      {/* Zone Selector and Map Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Warehouse Grid WH-01
          </span>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveZone('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeZone === 'ALL'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Zones
            </button>
            {zones.map((zone) => (
              <button
                key={zone}
                onClick={() => setActiveZone(zone)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeZone === zone
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>High Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* Rack Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {racks.map((rack) => {
          const rackBins = filteredBins.filter((b) => b.rack === rack);
          const hasAnomaly = rackBins.some((b) => b.currentStatus !== 'NORMAL');

          return (
            <div
              key={rack}
              className={`rounded-xl border ${
                hasAnomaly ? 'border-slate-700 bg-slate-900/90' : 'border-slate-800 bg-slate-900/50'
              } p-4 transition-all`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-sky-400" />
                  <span className="text-sm font-bold text-white tracking-wide">{rack}</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {rackBins[0]?.zone || 'Zone A'}
                </span>
              </div>

              {/* Bins in Rack */}
              <div className="grid grid-cols-2 gap-2.5">
                {rackBins.map((bin) => {
                  const isSelected = selectedDiscrepancyId && bin.activeDiscrepancyId === selectedDiscrepancyId;
                  const delta = bin.observedQty - bin.expectedQty;

                  return (
                    <div
                      key={bin.id}
                      onClick={() => handleBinClick(bin)}
                      onMouseEnter={() => setHoveredBin(bin)}
                      onMouseLeave={() => setHoveredBin(null)}
                      className={`relative rounded-lg border p-3 cursor-pointer transition-all ${getStatusColor(
                        bin.currentStatus
                      )} ${
                        isSelected ? 'ring-2 ring-sky-400 border-sky-400' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold">{bin.displayCode}</span>
                        <span
                          className={`h-2 w-2 rounded-full ${getStatusDot(bin.currentStatus)}`}
                        />
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 truncate mb-1">
                        {bin.expectedSku || 'Empty Slot'}
                      </div>

                      <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-800/60 font-mono tabular-nums">
                        <div className="text-slate-400 text-[10px]">
                          Exp: <span className="text-slate-200 font-semibold">{bin.expectedQty}</span>
                        </div>
                        <div className="text-[10px]">
                          Obs: <span className="font-semibold text-white">{bin.observedQty}</span>
                        </div>
                      </div>

                      {delta !== 0 && (
                        <div
                          className={`mt-1 text-[10px] font-mono font-bold text-right ${
                            delta < 0 ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        >
                          Delta: {delta > 0 ? `+${delta}` : delta}
                        </div>
                      )}

                      {bin.activeDiscrepancyId && (
                        <div className="mt-1 flex items-center justify-end text-[10px] text-sky-400 font-medium">
                          <span>Inspect Evidence</span>
                          <ArrowUpRight className="h-3 w-3 ml-0.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected / Hovered Bin Detail Bar */}
      {hoveredBin && (
        <div className="rounded-xl border border-sky-900/60 bg-slate-900/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Info className="h-4 w-4 text-sky-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Bin {hoveredBin.displayCode}</span>
              <span className="text-slate-400 ml-2">
                Location: {hoveredBin.zone} · {hoveredBin.rack} · Shelf {hoveredBin.shelf} · {hoveredBin.binNumber}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-300 font-mono">
            <span>Expected: {hoveredBin.expectedSku} (Qty: {hoveredBin.expectedQty})</span>
            <span>Observed: {hoveredBin.observedSku || 'None'} (Qty: {hoveredBin.observedQty})</span>
          </div>
        </div>
      )}
    </div>
  );
};
