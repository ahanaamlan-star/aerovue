import React, { useState, useMemo, useEffect } from 'react';
import { DiscrepancyRecord, DiscrepancyType } from '../../types';
import { EvidenceStudio } from '../evidence/EvidenceStudio';
import {
  Search,
  ArrowUpDown,
  Filter,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Download,
  X,
  FileText,
} from 'lucide-react';

interface DiscrepancyTableProps {
  discrepancies: DiscrepancyRecord[];
  onSelectDiscrepancy: (discrepancy: DiscrepancyRecord) => void;
  selectedDiscrepancyId?: string;
  onUpdateVerification?: (
    id: string,
    status: DiscrepancyRecord['verification']['status'],
    notes?: string
  ) => void;
  onOpenReFlight?: () => void;
}

type FilterCategory =
  | 'ALL'
  | 'PERSISTENT'
  | 'INTERMITTENT'
  | 'NEW'
  | 'RESOLVED'
  | 'QUANTITY'
  | 'MISSING'
  | 'WRONG_LOCATION'
  | 'UNEXPECTED'
  | 'LABEL'
  | 'HIGH_RISK';

type SortField = 'risk' | 'confidence' | 'location' | 'delta' | 'timestamp' | 'persistence';

export const DiscrepancyTable: React.FC<DiscrepancyTableProps> = ({
  discrepancies,
  onSelectDiscrepancy,
  selectedDiscrepancyId,
  onUpdateVerification,
  onOpenReFlight,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [sortField, setSortField] = useState<SortField>('risk');
  const [sortAsc, setSortAsc] = useState(false);
  const [evidenceDrawerId, setEvidenceDrawerId] = useState<string | null>(null);

  // Derive fresh active discrepancy from master list to prevent stale data
  const drawerDiscrepancy = useMemo(() => {
    if (!evidenceDrawerId) return null;
    return discrepancies.find((d) => d.id === evidenceDrawerId) || null;
  }, [evidenceDrawerId, discrepancies]);

  // Keyboard navigation: Escape key closes Evidence Studio drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && evidenceDrawerId) {
        setEvidenceDrawerId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [evidenceDrawerId]);

  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportCsv = () => {
    if (sorted.length === 0) return;

    const headers = [
      'Discrepancy ID',
      'Location Code',
      'Warehouse',
      'Zone',
      'Rack',
      'Shelf',
      'Bin',
      'Discrepancy Type',
      'Expected SKU',
      'Observed SKU',
      'Expected Qty',
      'Observed Qty',
      'Net Delta',
      'Risk Level',
      'Risk Score',
      'Confidence Score',
      'Temporal Lifecycle',
      'Verification Status',
      'Timestamp',
    ];

    const csvRows = sorted.map((d) => [
      escapeCsv(d.id),
      escapeCsv(d.location.binDisplay),
      escapeCsv(d.location.warehouse),
      escapeCsv(d.location.zone),
      escapeCsv(d.location.rack),
      escapeCsv(d.location.shelf),
      escapeCsv(d.location.bin),
      escapeCsv(d.discrepancyType),
      escapeCsv(d.expectedSku || 'N/A'),
      escapeCsv(d.observedSku || 'N/A'),
      escapeCsv(d.expectedQuantity),
      escapeCsv(d.observedQuantity),
      escapeCsv(d.quantityDelta > 0 ? `+${d.quantityDelta}` : d.quantityDelta),
      escapeCsv(d.risk.level),
      escapeCsv(d.risk.score),
      escapeCsv(d.confidence.overall),
      escapeCsv(d.temporalLifecycle || (d.persistence.isPersistent ? 'PERSISTENT' : 'NEW')),
      escapeCsv(d.verification.status),
      escapeCsv(d.timestamp),
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `aerovue_discrepancies_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filterTabs: { id: FilterCategory; label: string }[] = [
    { id: 'ALL', label: 'ALL DISCREPANCIES' },
    { id: 'PERSISTENT', label: 'PERSISTENT' },
    { id: 'INTERMITTENT', label: 'INTERMITTENT' },
    { id: 'NEW', label: 'NEW' },
    { id: 'RESOLVED', label: 'RESOLVED' },
    { id: 'QUANTITY', label: 'QUANTITY' },
    { id: 'MISSING', label: 'MISSING' },
    { id: 'WRONG_LOCATION', label: 'WRONG LOCATION' },
    { id: 'UNEXPECTED', label: 'UNEXPECTED' },
    { id: 'LABEL', label: 'LABEL MISMATCH' },
    { id: 'HIGH_RISK', label: 'HIGH / CRITICAL RISK' },
  ];

  const filtered = useMemo(() => {
    return discrepancies.filter((d) => {
      const matchesSearch =
        d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.location.binDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.expectedSku && d.expectedSku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.observedSku && d.observedSku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        d.discrepancyType.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case 'PERSISTENT':
          return d.temporalLifecycle === 'PERSISTENT' || d.persistence.isPersistent || d.discrepancyType === 'PERSISTENT_DISCREPANCY';
        case 'INTERMITTENT':
          return d.temporalLifecycle === 'INTERMITTENT';
        case 'NEW':
          return d.temporalLifecycle === 'NEW' || (!d.persistence.isPersistent && d.persistence.scanCount <= 1);
        case 'RESOLVED':
          return d.temporalLifecycle === 'RESOLVED';
        case 'MISSING':
          return d.discrepancyType === 'MISSING_ITEM';
        case 'QUANTITY':
          return d.discrepancyType === 'QUANTITY_MISMATCH';
        case 'WRONG_LOCATION':
          return d.discrepancyType === 'WRONG_LOCATION' || d.discrepancyType === 'MISPLACED_INVENTORY';
        case 'UNEXPECTED':
          return d.discrepancyType === 'UNEXPECTED_ITEM';
        case 'LABEL':
          return d.discrepancyType === 'LABEL_MISMATCH';
        case 'HIGH_RISK':
          return d.risk.level === 'HIGH' || d.risk.level === 'CRITICAL';
        case 'ALL':
        default:
          return true;
      }
    });
  }, [discrepancies, searchTerm, activeFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'risk') {
        cmp = b.risk.score - a.risk.score;
      } else if (sortField === 'confidence') {
        cmp = b.confidence.overall - a.confidence.overall;
      } else if (sortField === 'persistence') {
        cmp = (b.persistenceScore ?? 50) - (a.persistenceScore ?? 50);
      } else if (sortField === 'location') {
        cmp = a.location.binDisplay.localeCompare(b.location.binDisplay);
      } else if (sortField === 'delta') {
        cmp = Math.abs(b.quantityDelta) - Math.abs(a.quantityDelta);
      } else if (sortField === 'timestamp') {
        cmp = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return sortAsc ? -cmp : cmp;
    });
  }, [filtered, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const formatTypeLabel = (type: DiscrepancyType) => {
    switch (type) {
      case 'QUANTITY_MISMATCH':
        return 'Quantity Mismatch';
      case 'MISSING_ITEM':
        return 'Missing Item';
      case 'UNEXPECTED_ITEM':
        return 'Unexpected Item';
      case 'WRONG_LOCATION':
        return 'Wrong Location';
      case 'MISPLACED_INVENTORY':
        return 'Misplaced Item';
      case 'LABEL_MISMATCH':
        return 'Label Mismatch';
      case 'PERSISTENT_DISCREPANCY':
        return 'Persistent Anomaly';
      default:
        return 'Discrepancy';
    }
  };

  const getRiskBadge = (level: DiscrepancyRecord['risk']['level']) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="text-[#FF5C6C] font-bold">CRITICAL</span>;
      case 'HIGH':
        return <span className="text-[#F5B942] font-semibold">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[#4DA3FF] font-medium">MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="text-[#39D98A] font-medium">LOW</span>;
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Control Bar */}
      <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8FA4B8]" />
            <input
              type="text"
              placeholder="Search by ID, bin (e.g. A01-02), SKU, or anomaly type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#07111F] border border-[#24364A] rounded text-[#F4F7FA] placeholder-[#8FA4B8]/60 focus:outline-none focus:border-[#4DA3FF]"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-[#8FA4B8]">
              Showing <strong className="text-[#F4F7FA]">{sorted.length}</strong> of {discrepancies.length} records
            </div>
            <button
              onClick={handleExportCsv}
              disabled={sorted.length === 0}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 border ${
                sorted.length === 0
                  ? 'bg-[#122438]/50 text-[#8FA4B8]/40 border-[#24364A]/50 cursor-not-allowed'
                  : 'bg-[#122438] hover:bg-[#1c3654] text-[#4DA3FF] border-[#24364A] hover:border-[#4DA3FF] shadow-sm'
              }`}
              title={
                sorted.length === 0
                  ? 'No discrepancies match current filter settings'
                  : `Export ${sorted.length} discrepancies to CSV`
              }
            >
              <Download className="h-3.5 w-3.5" />
              <span>EXPORT CSV ({sorted.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-[#24364A]/80">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded whitespace-nowrap transition-colors ${
                activeFilter === tab.id
                  ? 'bg-[#4DA3FF] text-[#07111F]'
                  : 'text-[#8FA4B8] hover:text-[#F4F7FA] hover:bg-[#122438]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Discrepancy Table */}
      <div className="rounded border border-[#24364A] bg-[#0D1B2A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07111F] border-b border-[#24364A] text-[#8FA4B8] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">DISCREPANCY ID</th>
                <th
                  onClick={() => toggleSort('location')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#F4F7FA] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>LOCATION</span>
                    <ArrowUpDown className="h-3 w-3 text-[#8FA4B8]" />
                  </div>
                </th>
                <th className="py-2.5 px-3">SKU DETAILS</th>
                <th className="py-2.5 px-3 text-right">EXPECTED</th>
                <th className="py-2.5 px-3 text-right">OBSERVED</th>
                <th
                  onClick={() => toggleSort('delta')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-[#F4F7FA] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>DELTA</span>
                    <ArrowUpDown className="h-3 w-3 text-[#8FA4B8]" />
                  </div>
                </th>
                <th className="py-2.5 px-3">TYPE</th>
                <th
                  onClick={() => toggleSort('confidence')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-[#F4F7FA] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>CONFIDENCE</span>
                    <ArrowUpDown className="h-3 w-3 text-[#8FA4B8]" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('risk')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#F4F7FA] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>RISK</span>
                    <ArrowUpDown className="h-3 w-3 text-[#8FA4B8]" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('persistence')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#F4F7FA] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>LIFECYCLE</span>
                    <ArrowUpDown className="h-3 w-3 text-[#8FA4B8]" />
                  </div>
                </th>
                <th className="py-2.5 px-3">VERIFICATION</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24364A]/60">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-[#8FA4B8]">
                    No discrepancies matching current search or filter criteria.
                  </td>
                </tr>
              ) : (
                sorted.map((d) => {
                  const isSelected = selectedDiscrepancyId === d.id;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => onSelectDiscrepancy(d)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#122438] border-l-2 border-[#4DA3FF]'
                          : 'hover:bg-[#122438]/60'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-[#4DA3FF]">
                        {d.id}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[#F4F7FA]">
                          BIN {d.location.binDisplay}
                        </div>
                        <div className="text-[10px] text-[#8FA4B8]">
                          {d.location.zone} · {d.location.rack}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-[#F4F7FA]">
                          {d.expectedSku || 'N/A'}
                        </div>
                        {d.observedSku && d.observedSku !== d.expectedSku && (
                          <div className="text-[10px] text-[#F5B942] truncate max-w-[120px]">
                            Obs: {d.observedSku}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-[#8FA4B8]">
                        {d.expectedQuantity}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[#F4F7FA]">
                        {d.observedQuantity}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold">
                        <span
                          className={
                            d.quantityDelta < 0
                              ? 'text-[#FF5C6C]'
                              : d.quantityDelta > 0
                              ? 'text-[#F5B942]'
                              : 'text-[#8FA4B8]'
                          }
                        >
                          {d.quantityDelta > 0 ? `+${d.quantityDelta}` : d.quantityDelta}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#F4F7FA]">
                        <div className="flex items-center gap-1.5">
                          {d.persistence.isPersistent && (
                            <span title="Persistent anomaly across scans" className="inline-flex">
                              <Clock className="h-3 w-3 text-[#F5B942] shrink-0" />
                            </span>
                          )}
                          <span>{formatTypeLabel(d.discrepancyType)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-[#4DA3FF] font-semibold">
                        {d.confidence.overall}%
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          {getRiskBadge(d.risk.level)}
                          <span className="text-[10px] text-[#8FA4B8]">
                            ({d.risk.score})
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              (d.temporalLifecycle || (d.persistence.isPersistent ? 'PERSISTENT' : 'NEW')) === 'PERSISTENT'
                                ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border-[#FF5C6C]/40'
                                : (d.temporalLifecycle || (d.persistence.isPersistent ? 'PERSISTENT' : 'NEW')) === 'RESOLVED'
                                ? 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/40'
                                : (d.temporalLifecycle || (d.persistence.isPersistent ? 'PERSISTENT' : 'NEW')) === 'INTERMITTENT'
                                ? 'bg-[#F5B942]/20 text-[#F5B942] border-[#F5B942]/40'
                                : 'bg-[#4DA3FF]/20 text-[#4DA3FF] border-[#4DA3FF]/40'
                            }`}
                          >
                            {d.temporalLifecycle || (d.persistence.isPersistent ? 'PERSISTENT' : 'NEW')}
                          </span>
                          <span className="text-[10px] text-[#8FA4B8] tabular-nums">
                            {d.persistenceScore ?? (d.persistence.isPersistent ? 90 : 35)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[#8FA4B8] text-[11px]">
                        {d.verification.status === 'CONFIRMED' ? (
                          <span className="text-[#39D98A] flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Confirmed</span>
                          </span>
                        ) : d.verification.status === 'DISMISSED_FALSE_POSITIVE' ? (
                          <span className="text-[#8FA4B8]">Dismissed</span>
                        ) : d.verification.status === 'REFLIGHT_REQUESTED' ? (
                          <span className="text-[#4DA3FF]">Re-flight</span>
                        ) : (
                          <span className="text-[#F5B942]">Pending</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDiscrepancy(d);
                            setEvidenceDrawerId(d.id);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold text-[#4DA3FF] bg-[#122438] hover:bg-[#1b324b] border border-[#24364A] hover:border-[#4DA3FF] rounded transition-colors inline-flex items-center gap-1 shadow-xs"
                          title="Open Evidence Studio Drawer for this anomaly"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Evidence Studio</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Studio Drawer / Modal Dialog */}
      {evidenceDrawerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#07111F]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-xl border border-[#24364A] bg-[#07111F] shadow-2xl shadow-black/80 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="evidence-studio-title"
          >
            {/* Drawer Header */}
            <div className="px-5 py-3.5 bg-[#0D1B2A] border-b border-[#24364A] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-[#4DA3FF] animate-pulse" />
                <div>
                  <h3
                    id="evidence-studio-title"
                    className="text-sm font-bold text-[#F4F7FA] tracking-wide uppercase"
                  >
                    EVIDENCE STUDIO · ANOMALY AUDIT TRAIL
                  </h3>
                  <span className="text-[10px] text-[#8FA4B8] block">
                    Inspection record for{' '}
                    {drawerDiscrepancy
                      ? `${drawerDiscrepancy.id} (Bin ${drawerDiscrepancy.location.binDisplay})`
                      : 'Discrepancy'}{' '}
                    · Press [Esc] to exit
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEvidenceDrawerId(null)}
                className="p-1.5 rounded-lg text-[#8FA4B8] hover:text-[#F4F7FA] hover:bg-[#122438] border border-transparent hover:border-[#24364A] transition-colors"
                aria-label="Close Evidence Studio"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#07111F]">
              <EvidenceStudio
                discrepancy={drawerDiscrepancy}
                onUpdateVerification={onUpdateVerification || (() => {})}
                onOpenReFlight={onOpenReFlight}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
