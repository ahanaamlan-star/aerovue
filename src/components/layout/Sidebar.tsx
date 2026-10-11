import React from 'react';
import {
  LayoutDashboard,
  Crosshair,
  AlertTriangle,
  Compass,
  Boxes,
  History,
  CheckCircle2,
  Server,
  Radio,
  Navigation,
  Sparkles,
} from 'lucide-react';

export type NavigationPage =
  | 'overview'
  | 'mission-planner'
  | 'scan-analysis'
  | 'discrepancies'
  | 'simulation-lab'
  | 'inventory'
  | 'history'
  | 'validation'
  | 'system';

interface SidebarProps {
  activePage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
  discrepanciesCount: number;
  criticalCount: number;
  onOpenJudgeTour?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  discrepanciesCount,
  criticalCount,
  onOpenJudgeTour,
}) => {
  const navItems = [
    {
      id: 'overview',
      label: 'OVERVIEW',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'mission-planner',
      label: 'MISSION PLANNER',
      icon: Navigation,
      badge: 'SIM',
    },
    {
      id: 'scan-analysis',
      label: 'SCAN ANALYSIS',
      icon: Crosshair,
      badge: 'LIVE',
    },
    {
      id: 'discrepancies',
      label: 'DISCREPANCIES',
      icon: AlertTriangle,
      badge: discrepanciesCount > 0 ? `${discrepanciesCount}` : null,
      badgeCritical: criticalCount > 0,
    },
    {
      id: 'simulation-lab',
      label: 'SIMULATION LAB',
      icon: Compass,
      badge: null,
    },
    {
      id: 'inventory',
      label: 'INVENTORY',
      icon: Boxes,
      badge: null,
    },
    {
      id: 'history',
      label: 'HISTORY',
      icon: History,
      badge: null,
    },
    {
      id: 'validation',
      label: 'VALIDATION',
      icon: CheckCircle2,
      badge: null,
    },
    {
      id: 'system',
      label: 'SYSTEM & RELIABILITY',
      icon: Server,
      badge: 'ARCH',
    },
  ];

  return (
    <aside className="w-56 shrink-0 bg-[#07111F] border-r border-[#24364A] flex flex-col justify-between select-none">
      <div className="py-4">
        {/* Section title */}
        <div className="px-4 mb-2 text-[10px] font-mono uppercase tracking-widest text-[#8FA4B8]/70">
          COMMAND NAVIGATION
        </div>

        {/* Navigation list */}
        <nav className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id as NavigationPage)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-mono tracking-wider transition-colors relative group ${
                  isActive
                    ? 'bg-[#0D1B2A] text-[#4DA3FF] border border-[#24364A] shadow-sm'
                    : 'text-[#8FA4B8] hover:text-[#F4F7FA] hover:bg-[#122438]/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#4DA3FF]' : 'text-[#8FA4B8] group-hover:text-[#F4F7FA]'
                    }`}
                  />
                  <span className="font-semibold text-[11px]">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      item.badge === 'LIVE'
                        ? 'bg-[#39D98A]/15 text-[#39D98A] border border-[#39D98A]/30'
                        : item.badgeCritical
                        ? 'bg-[#FF5C6C]/20 text-[#FF5C6C] border border-[#FF5C6C]/40'
                        : 'bg-[#24364A] text-[#8FA4B8]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Subtle active left pill line */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-[#4DA3FF] rounded-r" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom mission telemetry & 30s tour button */}
      <div className="border-t border-[#24364A] bg-[#0D1B2A]/40 text-[11px] font-mono text-[#8FA4B8] space-y-2 p-3">
        {onOpenJudgeTour && (
          <button
            onClick={onOpenJudgeTour}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-[#4DA3FF]/15 hover:bg-[#4DA3FF]/25 border border-[#4DA3FF]/30 hover:border-[#4DA3FF] text-[#4DA3FF] text-[10px] font-bold transition-all shadow-sm shadow-[#4DA3FF]/10"
            title="Launch 30-Second Judicial Evaluation Tour"
          >
            <Sparkles className="h-3 w-3" />
            <span>30s JUDGE TOUR</span>
          </button>
        )}
        <div className="flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1.5 text-[#39D98A]">
            <Radio className="h-3 w-3 animate-pulse" />
            <span>LINK ACTIVE</span>
          </span>
          <span className="text-[#8FA4B8]">WH-01 · APEX</span>
        </div>
        <div className="text-[10px] text-[#8FA4B8]/80 truncate">
          GRID: 14.8E / 08.2N / 3.6Z
        </div>
      </div>
    </aside>
  );
};
