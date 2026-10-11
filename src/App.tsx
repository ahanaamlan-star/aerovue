/**
 * AEROVUE: AI-Powered Aerial Discrepancy Intelligence
 * Challenge: A.U.D.I.T. (Autonomous UAV Discrepancy Identification Trials)
 * Tagline: "See Beyond. Detect Smarter."
 *
 * Visual Design: Aerospace Mission Control & Industrial AI Command Workstation
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, NavigationPage } from './components/layout/Sidebar';
import { OverviewPage } from './components/dashboard/OverviewPage';
import { UavMissionPlannerPage } from './components/planner/UavMissionPlannerPage';
import { ScanAnalysisPage } from './components/analysis/ScanAnalysisPage';
import { DiscrepancyTable } from './components/discrepancies/DiscrepancyTable';
import { SimulationLabPage } from './components/simulation/SimulationLabPage';
import { InventoryPage } from './components/inventory/InventoryPage';
import { HistoricalScansView } from './components/history/HistoricalScansView';
import { ValidationPage } from './components/validation/ValidationPage';
import { SystemPage } from './components/system/SystemPage';
import { SimulationLabModal } from './components/simulation/SimulationLabModal';
import { DataIngestionModal } from './components/ingestion/DataIngestionModal';
import { JudgeWalkthroughModal } from './components/common/JudgeWalkthroughModal';
import {
  apiService,
  RiskSummary,
} from './services/apiService';
import {
  DiscrepancyRecord,
  WarehouseBin,
  ScanSession,
  ConfidenceWeightConfig,
  SimulationParams,
  InventoryItem,
  UAVTelemetry,
} from './types';
import { DEFAULT_CONFIDENCE_WEIGHTS, INITIAL_UAV_TELEMETRY } from './data/mockWarehouseData';

export default function App() {
  const [activePage, setActivePage] = useState<NavigationPage>('overview');
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyRecord[]>([]);
  const [bins, setBins] = useState<WarehouseBin[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<RiskSummary>({
    totalItemsScanned: 118,
    totalDiscrepancies: 5,
    criticalCount: 1,
    highCount: 2,
    mediumCount: 2,
    lowCount: 0,
    averageConfidence: 90.4,
    scanCoveragePct: 100,
    lastScanTimestamp: '2026-10-05 07:14:00',
  });
  const [history, setHistory] = useState<ScanSession[]>([]);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<DiscrepancyRecord | null>(null);
  const [telemetry, setTelemetry] = useState<UAVTelemetry>(INITIAL_UAV_TELEMETRY);

  const [isScanning, setIsScanning] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [isJudgeTourOpen, setIsJudgeTourOpen] = useState(false);
  const [confidenceWeights, setConfidenceWeights] = useState<ConfidenceWeightConfig>(
    DEFAULT_CONFIDENCE_WEIGHTS
  );

  // Initial Data Ingestion & State Bootstrapping
  useEffect(() => {
    const loadInitial = async () => {
      const disc = await apiService.getDiscrepancies();
      const b = await apiService.getWarehouseBins();
      const inv = await apiService.getInventory();
      const s = await apiService.getRiskSummary();
      const h = await apiService.getHistory();

      setDiscrepancies(disc);
      setBins(b);
      setInventory(inv);
      setSummary(s);
      setHistory(h);

      if (disc.length > 0) {
        setSelectedDiscrepancy(disc[0]);
      }
    };
    loadInitial();
  }, []);

  // Trigger UAV Scan
  const handleTriggerScan = async (customImage?: string) => {
    setIsScanning(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 750));

      const res = await apiService.triggerScan({
        imageSrc: customImage,
        triggerType: 'MANUAL_MISSION',
      });

      setDiscrepancies(res.discrepancies);
      setBins(res.bins);
      const newSummary = await apiService.getRiskSummary();
      setSummary(newSummary);
      const newHistory = await apiService.getHistory();
      setHistory(newHistory);

      if (res.discrepancies.length > 0) {
        setSelectedDiscrepancy(res.discrepancies[0]);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Run Simulation Lab Synthesis
  const handleRunSimulation = async (params: SimulationParams, navigateToDiscrepancies = false) => {
    setIsScanning(true);
    try {
      const res = await apiService.runSimulation(params);
      setDiscrepancies(res.discrepancies);
      setBins(res.bins);
      const newSummary = await apiService.getRiskSummary();
      setSummary(newSummary);
      const newHistory = await apiService.getHistory();
      setHistory(newHistory);
      const newInv = await apiService.getInventory();
      setInventory(newInv);

      if (res.discrepancies.length > 0) {
        setSelectedDiscrepancy(res.discrepancies[0]);
      }
      if (navigateToDiscrepancies) {
        setActivePage('discrepancies');
      }
      return res;
    } finally {
      setIsScanning(false);
    }
  };

  // Select discrepancy and route to Scan Analysis workstation
  const handleSelectDiscrepancy = (disc: DiscrepancyRecord) => {
    setSelectedDiscrepancy(disc);
    setActivePage('scan-analysis');
  };

  // Operator Verification Status Update
  const handleUpdateVerification = (
    id: string,
    status: DiscrepancyRecord['verification']['status'],
    notes?: string
  ) => {
    const updated = apiService.updateVerification(id, status, notes);
    if (updated) {
      setDiscrepancies((prev) => prev.map((d) => (d.id === id ? updated : d)));
      if (selectedDiscrepancy?.id === id) {
        setSelectedDiscrepancy(updated);
      }
    }
  };

  // Update Prototype Confidence Weights
  const handleUpdateWeights = (weights: ConfidenceWeightConfig) => {
    setConfidenceWeights(weights);
    apiService.setConfidenceWeights(weights);
    handleTriggerScan();
  };

  // Ingest Custom Inventory Items
  const handleLoadCustomInventory = (items: InventoryItem[]) => {
    apiService.setCustomInventory(items);
    setInventory(items);
    handleTriggerScan();
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F4F7FA] flex flex-col font-sans selection:bg-[#4DA3FF]/20 selection:text-[#4DA3FF]">
      {/* Persistent Aerospace Console Header */}
      <Header
        lastScanTimestamp={summary.lastScanTimestamp}
        isScanning={isScanning}
        onTriggerScan={() => handleTriggerScan()}
        onOpenSimModal={() => setIsSimModalOpen(true)}
        onOpenIngestModal={() => setIsIngestModalOpen(true)}
        onOpenJudgeTour={() => setIsJudgeTourOpen(true)}
        activeUavMode="SIMULATION"
      />

      {/* Main Command Center Layout: Left Sidebar + Viewport Content */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Left Sidebar Navigation */}
        <Sidebar
          activePage={activePage}
          onSelectPage={(page) => setActivePage(page)}
          discrepanciesCount={discrepancies.length}
          criticalCount={summary.criticalCount}
          onOpenJudgeTour={() => setIsJudgeTourOpen(true)}
        />

        {/* Primary Content Viewport */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 bg-[#07111F]">
          <div className="max-w-[1520px] mx-auto">
            {activePage === 'overview' && (
              <OverviewPage
                summary={summary}
                bins={bins}
                discrepancies={discrepancies}
                onSelectDiscrepancy={handleSelectDiscrepancy}
                onNavigatePage={(page) => setActivePage(page)}
                telemetry={telemetry}
                onOpenJudgeTour={() => setIsJudgeTourOpen(true)}
              />
            )}

            {activePage === 'mission-planner' && (
              <UavMissionPlannerPage
                onNavigateToSimulation={() => setActivePage('simulation-lab')}
                onNavigateToAnalysis={() => setActivePage('scan-analysis')}
                telemetry={telemetry}
              />
            )}

            {activePage === 'scan-analysis' && (
              <ScanAnalysisPage
                discrepancy={selectedDiscrepancy}
                allDiscrepancies={discrepancies}
                onSelectDiscrepancy={(d) => setSelectedDiscrepancy(d)}
                onUpdateVerification={handleUpdateVerification}
                onOpenReFlight={() => setActivePage('simulation-lab')}
              />
            )}

            {activePage === 'discrepancies' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#24364A] pb-3">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#F4F7FA] font-display">
                      DISCREPANCY INTELLIGENCE TABLE
                    </h1>
                    <p className="text-xs text-[#8FA4B8] font-mono">
                      Categorized variance records between expected ledger and aerial perception
                    </p>
                  </div>
                  <div className="text-xs text-[#8FA4B8] font-mono">
                    FACILITY: WH-01 · ZONE A, B, C
                  </div>
                </div>

                <DiscrepancyTable
                  discrepancies={discrepancies}
                  onSelectDiscrepancy={handleSelectDiscrepancy}
                  selectedDiscrepancyId={selectedDiscrepancy?.id}
                />
              </div>
            )}

            {activePage === 'simulation-lab' && (
              <SimulationLabPage
                onRunSimulation={handleRunSimulation}
                isLoading={isScanning}
                telemetry={telemetry}
                onSelectDiscrepancy={handleSelectDiscrepancy}
                onNavigateToAnalysis={() => setActivePage('scan-analysis')}
                onNavigateToPlanner={() => setActivePage('mission-planner')}
              />
            )}

            {activePage === 'inventory' && (
              <InventoryPage
                inventory={inventory}
                bins={bins}
                discrepancies={discrepancies}
                onSelectDiscrepancy={handleSelectDiscrepancy}
                onNavigateToAnalysis={() => setActivePage('scan-analysis')}
              />
            )}

            {activePage === 'history' && (
              <HistoricalScansView
                history={history}
                discrepancies={discrepancies}
                onSelectDiscrepancy={handleSelectDiscrepancy}
                onRunNewScan={() => handleTriggerScan()}
                isScanning={isScanning}
              />
            )}

            {activePage === 'validation' && <ValidationPage />}

            {activePage === 'system' && <SystemPage />}
          </div>
        </main>
      </div>

      {/* Modals for Parameters and Ingestion */}
      <SimulationLabModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        onRunSimulation={handleRunSimulation}
        isLoading={isScanning}
      />

      <DataIngestionModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        confidenceWeights={confidenceWeights}
        onUpdateWeights={handleUpdateWeights}
        onLoadCustomInventory={handleLoadCustomInventory}
        onSelectSampleImage={(src) => handleTriggerScan(src)}
      />

      <JudgeWalkthroughModal
        isOpen={isJudgeTourOpen}
        onClose={() => setIsJudgeTourOpen(false)}
        onNavigatePage={(page) => setActivePage(page)}
      />

      {/* Bottom Mission-Control Technical Strip */}
      <footer className="h-7 bg-[#07111F] border-t border-[#24364A] px-4 flex items-center justify-between text-[10px] font-mono text-[#8FA4B8] select-none">
        <div className="flex items-center gap-3">
          <span className="text-[#F4F7FA] font-bold">AEROVUE COMMAND</span>
          <span>·</span>
          <span>A.U.D.I.T. CHALLENGE (AUTONOMOUS UAV TRIALS)</span>
        </div>
        <div className="flex items-center gap-3 hidden sm:flex">
          <span>LATITUDE: 37.7749° N</span>
          <span>LONGITUDE: 122.4194° W</span>
          <span className="text-[#39D98A]">PIPELINE: ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}
