/**
 * AEROVUE API Service Client
 * Provides typed methods corresponding to REST API endpoints:
 * - POST /scan
 * - GET /inventory
 * - GET /discrepancies
 * - GET /discrepancies/{id}
 * - GET /history
 * - POST /simulation
 * - GET /risk-summary
 */

import {
  DiscrepancyRecord,
  InventoryItem,
  ScanSession,
  WarehouseBin,
  SimulationParams,
  ConfidenceWeightConfig,
  HistoricalScanRecord,
  LocationTimeline,
  TemporalLifecycle,
} from '../types';
import {
  INITIAL_INVENTORY,
  INITIAL_BINS,
  INITIAL_DISCREPANCIES,
  INITIAL_SCAN_SESSIONS,
  DEFAULT_CONFIDENCE_WEIGHTS,
  SAMPLE_HISTORICAL_SCAN_RECORDS,
  SAMPLE_LOCATION_TIMELINES,
} from '../data/mockWarehouseData';
import { AerovueDiscrepancyIntelligenceEngine } from './discrepancyEngine';
import { SimulationEngine, SimulationRunResult } from './simulationEngine';

export interface RiskSummary {
  totalItemsScanned: number;
  totalDiscrepancies: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  averageConfidence: number;
  scanCoveragePct: number;
  lastScanTimestamp: string;
}

class AerovueApiService {
  private inventory: InventoryItem[] = [...INITIAL_INVENTORY];
  private bins: WarehouseBin[] = [...INITIAL_BINS];
  private discrepancies: DiscrepancyRecord[] = [...INITIAL_DISCREPANCIES];
  private scanHistory: ScanSession[] = [...INITIAL_SCAN_SESSIONS];
  private historicalScanRecords: HistoricalScanRecord[] = [...SAMPLE_HISTORICAL_SCAN_RECORDS];
  private locationTimelines: LocationTimeline[] = [...SAMPLE_LOCATION_TIMELINES];
  private confidenceWeights: ConfidenceWeightConfig = { ...DEFAULT_CONFIDENCE_WEIGHTS };

  private discrepancyEngine = new AerovueDiscrepancyIntelligenceEngine(this.confidenceWeights);
  private simulationEngine = new SimulationEngine();

  // GET /inventory
  public async getInventory(): Promise<InventoryItem[]> {
    return [...this.inventory];
  }

  // GET /bins
  public async getWarehouseBins(): Promise<WarehouseBin[]> {
    return [...this.bins];
  }

  // GET /discrepancies
  public async getDiscrepancies(): Promise<DiscrepancyRecord[]> {
    return [...this.discrepancies];
  }

  // GET /discrepancies/{id}
  public async getDiscrepancyById(id: string): Promise<DiscrepancyRecord | null> {
    const found = this.discrepancies.find((d) => d.id === id);
    return found ? { ...found } : null;
  }

  // GET /history (Scan sessions)
  public async getHistory(): Promise<ScanSession[]> {
    return [...this.scanHistory];
  }

  // GET /temporal/scan-records
  public async getHistoricalScanRecords(): Promise<HistoricalScanRecord[]> {
    return [...this.historicalScanRecords];
  }

  // GET /temporal/timelines
  public async getLocationTimelines(): Promise<LocationTimeline[]> {
    return [...this.locationTimelines];
  }

  // GET /temporal/timelines/{binDisplay}
  public async getLocationTimeline(binDisplay: string): Promise<LocationTimeline | null> {
    const found = this.locationTimelines.find((t) => t.binDisplay === binDisplay);
    return found ? { ...found } : null;
  }

  // GET /temporal/metrics
  public async getTemporalMetrics(): Promise<{
    persistentCount: number;
    intermittentCount: number;
    newCount: number;
    resolvedCount: number;
    averagePersistenceScore: number;
  }> {
    const persistent = this.locationTimelines.filter((t) => t.currentLifecycle === 'PERSISTENT').length;
    const intermittent = this.locationTimelines.filter((t) => t.currentLifecycle === 'INTERMITTENT').length;
    const newItems = this.locationTimelines.filter((t) => t.currentLifecycle === 'NEW').length;
    const resolved = this.locationTimelines.filter((t) => t.currentLifecycle === 'RESOLVED').length;

    const totalScores = this.locationTimelines.reduce((acc, t) => acc + t.persistenceScore, 0);
    const avgScore =
      this.locationTimelines.length > 0 ? Math.round(totalScores / this.locationTimelines.length) : 50;

    return {
      persistentCount: persistent,
      intermittentCount: intermittent,
      newCount: newItems,
      resolvedCount: resolved,
      averagePersistenceScore: avgScore,
    };
  }

  // GET /risk-summary
  public async getRiskSummary(): Promise<RiskSummary> {
    const critical = this.discrepancies.filter((d) => d.risk.level === 'CRITICAL').length;
    const high = this.discrepancies.filter((d) => d.risk.level === 'HIGH').length;
    const medium = this.discrepancies.filter((d) => d.risk.level === 'MEDIUM').length;
    const low = this.discrepancies.filter((d) => d.risk.level === 'LOW').length;

    const totalConf = this.discrepancies.reduce((acc, d) => acc + d.confidence.overall, 0);
    const avgConf =
      this.discrepancies.length > 0 ? Math.round(totalConf / this.discrepancies.length) : 92;

    const totalScanned = this.bins.reduce((acc, b) => acc + b.observedQty, 0);

    return {
      totalItemsScanned: totalScanned,
      totalDiscrepancies: this.discrepancies.length,
      criticalCount: critical,
      highCount: high,
      mediumCount: medium,
      lowCount: low,
      averageConfidence: avgConf,
      scanCoveragePct: 100,
      lastScanTimestamp: this.scanHistory[0]?.timestamp || '2026-10-05 07:14:00',
    };
  }

  // POST /scan
  public async triggerScan(options?: {
    imageSrc?: string;
    customBins?: WarehouseBin[];
    triggerType?: ScanSession['triggerType'];
    planId?: string;
    flightDurationSeconds?: number;
    coveragePercentage?: number;
    uavId?: string;
  }): Promise<{ session: ScanSession; discrepancies: DiscrepancyRecord[]; bins: WarehouseBin[] }> {
    const scanId = options?.planId
      ? `SCAN-${options.planId.replace(/[^A-Za-z0-9]/g, '').slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`
      : `SCAN-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const targetBins = options?.customBins || this.bins;

    const result = this.discrepancyEngine.evaluateScan({
      scanId,
      timestamp,
      bins: targetBins,
      inventory: this.inventory,
      historicalDiscrepancies: this.discrepancies,
      confidenceWeights: this.confidenceWeights,
      imageRef: options?.imageSrc,
    });

    this.bins = result.updatedBins;
    this.discrepancies = result.evaluatedDiscrepancies;

    const newSession: ScanSession = {
      id: scanId,
      warehouseId: 'WH-01',
      timestamp,
      triggerType: options?.triggerType || 'AUTONOMOUS_SCHEDULED',
      uavId: options?.uavId || 'AeroVue-Raven-04',
      totalBinsScanned: targetBins.length,
      totalItemsScanned: targetBins.reduce((acc, b) => acc + b.observedQty, 0),
      discrepanciesFound: result.summary.discrepanciesCount,
      criticalCount: result.summary.criticalCount,
      highCount: result.summary.highCount,
      mediumCount: result.summary.mediumCount,
      lowCount: result.summary.lowCount,
      coveragePercentage: options?.coveragePercentage ?? 100,
      averageConfidence: result.summary.averageConfidence,
      flightDurationSeconds: options?.flightDurationSeconds ?? (160 + Math.floor(Math.random() * 40)),
      imageCount: targetBins.length * 3,
    };

    this.scanHistory = [newSession, ...this.scanHistory];

    return {
      session: newSession,
      discrepancies: this.discrepancies,
      bins: this.bins,
    };
  }

  // Generate scenario setup preview
  public generateScenario(params: SimulationParams): SimulationRunResult {
    return this.simulationEngine.generateSimulation(params);
  }

  // POST /simulation
  public async runSimulation(params: SimulationParams): Promise<{
    simResult: SimulationRunResult;
    discrepancies: DiscrepancyRecord[];
    bins: WarehouseBin[];
    session: ScanSession;
  }> {
    const simResult = this.simulationEngine.generateSimulation(params);
    this.inventory = simResult.generatedInventory;

    const scanRes = await this.triggerScan({
      customBins: simResult.generatedBins,
      triggerType: 'SIMULATION_CYCLE',
    });

    return {
      simResult,
      discrepancies: scanRes.discrepancies,
      bins: scanRes.bins,
      session: scanRes.session,
    };
  }

  // Human Operator Verification Update
  public updateVerification(
    id: string,
    status: DiscrepancyRecord['verification']['status'],
    notes?: string
  ): DiscrepancyRecord | null {
    const idx = this.discrepancies.findIndex((d) => d.id === id);
    if (idx === -1) return null;

    this.discrepancies[idx] = {
      ...this.discrepancies[idx],
      verification: {
        status,
        verifiedBy: 'Lead UAV Flight Operations Engineer',
        verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        notes: notes || this.discrepancies[idx].verification.notes,
      },
    };

    return { ...this.discrepancies[idx] };
  }

  // Update confidence weights configuration
  public setConfidenceWeights(weights: ConfidenceWeightConfig) {
    this.confidenceWeights = weights;
    this.discrepancyEngine.updateWeights(weights);
  }

  public getConfidenceWeights(): ConfidenceWeightConfig {
    return { ...this.confidenceWeights };
  }

  // Load imported inventory from CSV/JSON
  public setCustomInventory(items: InventoryItem[]) {
    this.inventory = items;
  }
}

export const apiService = new AerovueApiService();
