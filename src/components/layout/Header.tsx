import React from 'react';
import { AerovueLogo } from '../common/AerovueLogo';
import { Play, RefreshCw, Upload, Sliders, ShieldCheck, User, Sparkles } from 'lucide-react';

interface HeaderProps {
  lastScanTimestamp: string;
  isScanning: boolean;
  onTriggerScan: () => void;
  onOpenSimModal: () => void;
  onOpenIngestModal: () => void;
  onOpenJudgeTour?: () => void;
  activeUavMode?: string;
}

export const Header: React.FC<HeaderProps> = ({
  lastScanTimestamp,
  isScanning,
  onTriggerScan,
  onOpenSimModal,
  onOpenIngestModal,
  onOpenJudgeTour,
  activeUavMode = 'SIMULATION',
}) => {
  // Format last scan time
  const timeOnly = lastScanTimestamp ? lastScanTimestamp.split(' ')[1] || '07:14:00' : '07:14:00';

  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-[#0D1B2A] border-b border-[#24364A] px-4 lg:px-6 flex items-center justify-between select-none">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3">
        <AerovueLogo size={30} />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-wider text-[#F4F7FA] font-display">
              AEROVUE
            </span>
            <span className="text-[10px] font-mono tracking-widest text-[#4DA3FF] bg-[#122438] px-1.5 py-0.5 rounded border border-[#24364A]">
              A.U.D.I.T.
            </span>
          </div>
          <span className="text-[10px] text-[#8FA4B8] hidden sm:block tracking-tight font-medium">
            AI-Powered Aerial Discrepancy Intelligence
          </span>
        </div>
      </div>

      {/* Center / Right: Operational Status Telemetry & Controls */}
      <div className="flex items-center gap-3 sm:gap-5 text-xs font-mono">
        {/* System Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-[#07111F] rounded border border-[#24364A]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#39D98A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#39D98A]"></span>
          </span>
          <span className="text-[11px] text-[#8FA4B8]">SYSTEM:</span>
          <span className="text-[11px] font-semibold text-[#39D98A]">OPERATIONAL</span>
        </div>

        {/* Last Scan Time */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-[#8FA4B8]">
          <span>LAST SCAN:</span>
          <span className="text-[#F4F7FA] font-bold tabular-nums">{timeOnly}</span>
        </div>

        {/* UAV Source Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-[#122438] rounded border border-[#24364A] text-[11px]">
          <span className="text-[#8FA4B8]">UAV:</span>
          <span className="text-[#4DA3FF] font-semibold">{activeUavMode}</span>
        </div>

        {/* Operator Profile */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-[#8FA4B8]">
          <User className="h-3.5 w-3.5 text-[#4DA3FF]" />
          <span className="text-[#F4F7FA]">OP-04 · FLIGHT LEAD</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenIngestModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#8FA4B8] hover:text-[#F4F7FA] bg-[#122438] hover:bg-[#1b324b] border border-[#24364A] rounded transition-colors"
            title="Ingest Aerial Data or CSV"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Ingest</span>
          </button>

          <button
            onClick={onOpenSimModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#8FA4B8] hover:text-[#4DA3FF] bg-[#122438] hover:bg-[#1b324b] border border-[#24364A] rounded transition-colors"
            title="Simulation Parameters & Fault Injection"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Sim Lab</span>
          </button>

          {onOpenJudgeTour && (
            <button
              onClick={onOpenJudgeTour}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#4DA3FF] hover:text-white bg-[#4DA3FF]/15 hover:bg-[#4DA3FF]/30 border border-[#4DA3FF]/40 rounded transition-colors font-bold shadow-sm shadow-[#4DA3FF]/10"
              title="Launch 30-Second Judicial Evaluation Tour"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>30s Tour</span>
            </button>
          )}

          <button
            onClick={onTriggerScan}
            disabled={isScanning}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded border border-[#4DA3FF]/60 transition-all ${
              isScanning
                ? 'bg-[#4DA3FF]/40 cursor-wait'
                : 'bg-[#4DA3FF] hover:bg-[#3d8ee6] active:scale-95 shadow-sm shadow-[#4DA3FF]/20'
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 fill-current" />
                <span>Run UAV Scan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
