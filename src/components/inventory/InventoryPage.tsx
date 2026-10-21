import React, { useState, useMemo } from 'react';
import { InventoryItem, WarehouseBin, DiscrepancyRecord } from '../../types';
import { Search, Filter, Download, ArrowUpRight, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface InventoryPageProps {
  inventory: InventoryItem[];
  bins: WarehouseBin[];
  discrepancies: DiscrepancyRecord[];
  onSelectDiscrepancy: (disc: DiscrepancyRecord) => void;
  onNavigateToAnalysis: () => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  inventory,
  bins,
  discrepancies,
  onSelectDiscrepancy,
  onNavigateToAnalysis,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Combine bin state with inventory records
  const combinedRows = useMemo(() => {
    return bins.map((bin) => {
      const disc = discrepancies.find((d) => d.id === bin.activeDiscrepancyId || d.location.binDisplay === bin.displayCode);
      const invItem = inventory.find((item) => item.sku === bin.expectedSku);

      return {
        binId: bin.id,
        location: bin.displayCode,
        zone: bin.zone,
        rack: bin.rack,
        shelf: bin.shelf,
        sku: bin.expectedSku || 'N/A',
        itemName: invItem?.name || `Item ${bin.expectedSku || 'Unassigned'}`,
        category: invItem?.category || 'General',
        expected: bin.expectedQty,
        observed: bin.observedQty,
        delta: bin.observedQty - bin.expectedQty,
        status: bin.currentStatus,
        criticality: invItem?.criticality || 'MEDIUM',
        confidence: disc ? disc.confidence.overall : 98,
        discrepancy: disc,
      };
    });
  }, [bins, inventory, discrepancies]);

  const filteredRows = useMemo(() => {
    return combinedRows.filter((row) => {
      const matchesSearch =
        row.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (filterZone !== 'ALL' && row.zone !== filterZone) return false;

      if (filterStatus === 'NORMAL' && row.status !== 'NORMAL') return false;
      if (filterStatus === 'DISCREPANCY' && row.status === 'NORMAL') return false;

      return true;
    });
  }, [combinedRows, searchTerm, filterZone, filterStatus]);

  const handleRowClick = (row: (typeof combinedRows)[0]) => {
    if (row.discrepancy) {
      onSelectDiscrepancy(row.discrepancy);
      onNavigateToAnalysis();
    }
  };

  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportCsv = () => {
    if (filteredRows.length === 0) return;

    const headers = [
      'Location',
      'Zone',
      'Rack',
      'Shelf',
      'SKU',
      'Item Description',
      'Category',
      'Expected Qty',
      'Observed Qty',
      'Variance Delta',
      'Status',
      'Criticality',
      'Confidence Pct',
      'Has Discrepancy',
    ];

    const csvRows = filteredRows.map((r) => [
      escapeCsv(r.location),
      escapeCsv(r.zone),
      escapeCsv(r.rack),
      escapeCsv(r.shelf),
      escapeCsv(r.sku),
      escapeCsv(r.itemName),
      escapeCsv(r.category),
      escapeCsv(r.expected),
      escapeCsv(r.observed),
      escapeCsv(r.delta > 0 ? `+${r.delta}` : r.delta),
      escapeCsv(r.status),
      escapeCsv(r.criticality),
      escapeCsv(r.confidence),
      escapeCsv(r.discrepancy ? 'YES' : 'NO'),
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `aerovue_reconciled_inventory_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#24364A] pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#F4F7FA] font-display">
            MASTER INVENTORY LEDGER
          </h1>
          <p className="text-xs text-[#8FA4B8]">
            Expected warehouse inventory vs real-time aerial observations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#8FA4B8]">
            <span>TOTAL BAYS: <strong className="text-[#F4F7FA]">{bins.length}</strong></span>
            <span>·</span>
            <span>DISCREPANT: <strong className="text-[#F5B942]">{discrepancies.length}</strong></span>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={filteredRows.length === 0}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 border ${
              filteredRows.length === 0
                ? 'bg-[#122438]/50 text-[#8FA4B8]/40 border-[#24364A]/50 cursor-not-allowed'
                : 'bg-[#122438] hover:bg-[#1c3654] text-[#4DA3FF] border-[#24364A] hover:border-[#4DA3FF] shadow-sm'
            }`}
            title={
              filteredRows.length === 0
                ? 'No inventory rows match current filter settings'
                : `Export ${filteredRows.length} inventory records to CSV`
            }
          >
            <Download className="h-3.5 w-3.5" />
            <span>EXPORT CSV ({filteredRows.length})</span>
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8FA4B8]" />
          <input
            type="text"
            placeholder="Search by location (e.g. A01-02), SKU, item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#07111F] border border-[#24364A] rounded text-[#F4F7FA] placeholder-[#8FA4B8]/60 focus:outline-none focus:border-[#4DA3FF]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Zone Filter */}
          <div className="flex items-center gap-1 bg-[#07111F] p-0.5 rounded border border-[#24364A]">
            {['ALL', 'Zone A', 'Zone B', 'Zone C'].map((z) => (
              <button
                key={z}
                onClick={() => setFilterZone(z)}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                  filterZone === z
                    ? 'bg-[#4DA3FF] text-[#07111F] font-bold'
                    : 'text-[#8FA4B8] hover:text-[#F4F7FA]'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#07111F] p-0.5 rounded border border-[#24364A]">
            {[
              { id: 'ALL', label: 'ALL' },
              { id: 'NORMAL', label: 'NORMAL' },
              { id: 'DISCREPANCY', label: 'DISCREPANCY' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterStatus(s.id)}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                  filterStatus === s.id
                    ? 'bg-[#4DA3FF] text-[#07111F] font-bold'
                    : 'text-[#8FA4B8] hover:text-[#F4F7FA]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* High-Density Inventory Table */}
      <div className="rounded border border-[#24364A] bg-[#0D1B2A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07111F] border-b border-[#24364A] text-[#8FA4B8] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">LOCATION</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">ITEM DESCRIPTION</th>
                <th className="py-2.5 px-3 text-right">EXPECTED</th>
                <th className="py-2.5 px-3 text-right">OBSERVED</th>
                <th className="py-2.5 px-3 text-right">DELTA</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3 text-right">CONFIDENCE</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24364A]/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#8FA4B8]">
                    No inventory rows matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.binId}
                    onClick={() => handleRowClick(row)}
                    className="hover:bg-[#122438] transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-bold text-[#F4F7FA]">
                      {row.location}
                    </td>
                    <td className="py-2.5 px-3 text-[#4DA3FF] font-semibold">
                      {row.sku}
                    </td>
                    <td className="py-2.5 px-3 text-[#8FA4B8] truncate max-w-xs">
                      {row.itemName}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#F4F7FA]">
                      {row.expected}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[#F4F7FA]">
                      {row.observed}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold">
                      <span
                        className={
                          row.delta < 0
                            ? 'text-[#FF5C6C]'
                            : row.delta > 0
                            ? 'text-[#F5B942]'
                            : 'text-[#8FA4B8]'
                        }
                      >
                        {row.delta > 0 ? `+${row.delta}` : row.delta}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {row.status === 'NORMAL' ? (
                        <span className="text-[#39D98A] flex items-center gap-1.5 text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#39D98A]" />
                          <span>NORMAL</span>
                        </span>
                      ) : row.status === 'CRITICAL' ? (
                        <span className="text-[#FF5C6C] font-bold flex items-center gap-1.5 text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C6C]" />
                          <span>CRITICAL</span>
                        </span>
                      ) : (
                        <span className="text-[#F5B942] font-semibold flex items-center gap-1.5 text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#F5B942]" />
                          <span>DISCREPANCY</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#8FA4B8]">
                      {row.confidence}%
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {row.discrepancy ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(row);
                          }}
                          className="px-2 py-0.5 text-[10px] text-[#4DA3FF] hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Analyze</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#8FA4B8]/40">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
