/**
 * AEROVUE Simulation & UAV Mission Planner Engine
 *
 * Generates synthetic warehouse setups, controls fault injection,
 * and simulates UAV autonomous flight waypoints and camera frustum sweeps.
 *
 * Core Equation:
 * UAV → SCAN → OBSERVATION → DISCREPANCY ANALYSIS → RISK
 */

import {
  SimulationParams,
  WarehouseBin,
  InventoryItem,
  DiscrepancyType,
  SimulationScenarioPreset,
} from '../types';

export interface UAVWaypoint {
  id: string;
  index: number;
  label: string;
  coordinates: { x: number; y: number; z: number };
  targetRack: string;
  status: 'PENDING' | 'SCANNING' | 'COMPLETED';
}

export interface CameraFootprintMetrics {
  widthMeters: number;
  depthMeters: number;
  groundAreaSqMeters: number;
}

export interface SimulationRunResult {
  generatedInventory: InventoryItem[];
  generatedBins: WarehouseBin[];
  injectedDiscrepanciesCount: number;
  faultDistribution: Record<DiscrepancyType, number>;
  flightWaypoints: UAVWaypoint[];
  estimatedFlightTimeSeconds: number;
  areaScannedSqMeters: number;
  coveragePercentage: number;
  totalObjectsObserved: number;
  cameraFootprint: CameraFootprintMetrics;
}

export class SimulationEngine {
  /**
   * Calculate optical camera footprint on the ground/rack plane from altitude and FOV
   */
  public calculateCameraFootprint(altitudeM: number, fovDeg: number): CameraFootprintMetrics {
    const fovRad = (fovDeg * Math.PI) / 180;
    const widthMeters = Number((2 * altitudeM * Math.tan(fovRad / 2)).toFixed(2));
    const depthMeters = Number((widthMeters * 0.65).toFixed(2));
    const groundAreaSqMeters = Number((widthMeters * depthMeters).toFixed(1));

    return {
      widthMeters,
      depthMeters,
      groundAreaSqMeters,
    };
  }

  /**
   * Generates a synthetic warehouse inventory and selectively injects controlled anomalies
   */
  public generateSimulation(params: SimulationParams): SimulationRunResult {
    const rackPool = [
      'Rack A01',
      'Rack A02',
      'Rack B01',
      'Rack B02',
      'Rack C01',
      'Rack C02',
      'Rack D01',
      'Rack D02',
    ];
    const racks = rackPool.slice(0, Math.min(8, Math.max(2, params.rackCount)));

    const generatedInventory: InventoryItem[] = [];
    const generatedBins: WarehouseBin[] = [];

    const faultDistribution: Record<DiscrepancyType, number> = {
      QUANTITY_MISMATCH: 0,
      MISSING_ITEM: 0,
      UNEXPECTED_ITEM: 0,
      WRONG_LOCATION: 0,
      MISPLACED_INVENTORY: 0,
      LABEL_MISMATCH: 0,
      PERSISTENT_DISCREPANCY: 0,
      NO_DISCREPANCY: 0,
    };

    let binCounter = 1;
    let injectedCount = 0;
    let totalObservedSum = 0;

    const skuPool = [
      { prefix: 'ACT', name: 'Actuator Core', cat: 'Mechanical', val: 120 },
      { prefix: 'INV', name: 'Micro-Inverter', cat: 'Power', val: 210 },
      { prefix: 'SEN', name: 'Telemetry Transducer', cat: 'Sensors', val: 95 },
      { prefix: 'BAT', name: 'LiPo Battery Pack', cat: 'Energy', val: 180 },
      { prefix: 'NAV', name: 'Avionics Computer', cat: 'Electronics', val: 540 },
      { prefix: 'CAB', name: 'Industrial Loom', cat: 'Cabling', val: 45 },
      { prefix: 'LID', name: 'Lidar Module', cat: 'Perception', val: 320 },
      { prefix: 'PRO', name: 'Carbon Propeller', cat: 'Propulsion', val: 65 },
    ];

    const binsPerShelf = params.binsPerRack ? Math.ceil(params.binsPerRack / 2) : 3;

    // Apply Scenario Presets if selected
    let effectiveRate = params.discrepancyRatePct;
    if (params.scenarioPreset === 'NORMAL') {
      effectiveRate = 0;
    } else if (params.scenarioPreset && params.scenarioPreset !== 'CUSTOM' && effectiveRate === 0) {
      effectiveRate = 25;
    }

    racks.forEach((rackName, rIdx) => {
      const zoneLetter = rackName.includes('A')
        ? 'Zone A'
        : rackName.includes('B')
        ? 'Zone B'
        : rackName.includes('C')
        ? 'Zone C'
        : 'Zone D';

      for (let s = 1; s <= 2; s++) {
        for (let b = 1; b <= binsPerShelf; b++) {
          const skuType = skuPool[(rIdx * 2 + s + b) % skuPool.length];
          const skuCode = `SKU-${skuType.prefix}${100 + binCounter}`;
          const expectedQty = 6 + (binCounter % 8) * 2;
          const displayCode = `${rackName.replace('Rack ', '')}-0${b}`;

          const item: InventoryItem = {
            sku: skuCode,
            name: `${skuType.name} v${s}.${b}`,
            category: skuType.cat,
            expectedQuantity: expectedQty,
            location: {
              warehouse: params.warehouseName,
              zone: zoneLetter,
              rack: rackName,
              shelf: s,
              bin: `Bin 0${b}`,
            },
            criticality: skuType.val > 300 ? 'MISSION_CRITICAL' : skuType.val > 150 ? 'HIGH' : 'MEDIUM',
            unitValueUsd: skuType.val,
            reorderThreshold: Math.max(2, Math.floor(expectedQty * 0.3)),
          };
          generatedInventory.push(item);

          // Decide whether to inject a discrepancy
          const shouldInject = Math.random() * 100 < effectiveRate;
          let observedQty = expectedQty;
          let observedSku: string | null = skuCode;
          let binStatus: WarehouseBin['currentStatus'] = 'NORMAL';

          if (shouldInject) {
            injectedCount++;

            // Check scenario preset or enabled fault checkboxes
            let chosenFault: string = 'QUANTITY';

            if (params.scenarioPreset === 'MISSING') {
              chosenFault = 'MISSING';
            } else if (params.scenarioPreset === 'QUANTITY_MISMATCH') {
              chosenFault = 'QUANTITY';
            } else if (params.scenarioPreset === 'WRONG_LOCATION') {
              chosenFault = 'WRONG_LOC';
            } else if (params.scenarioPreset === 'UNEXPECTED_ITEM') {
              chosenFault = 'UNEXPECTED';
            } else if (params.scenarioPreset === 'PERSISTENT') {
              chosenFault = 'PERSISTENT';
            } else {
              const activeFaults: string[] = [];
              if (params.faults.quantityMismatch) activeFaults.push('QUANTITY');
              if (params.faults.missingItems) activeFaults.push('MISSING');
              if (params.faults.unexpectedItems) activeFaults.push('UNEXPECTED');
              if (params.faults.wrongLocation) activeFaults.push('WRONG_LOC');
              if (params.faults.labelMismatch) activeFaults.push('LABEL');
              if (params.faults.persistentDiscrepancy) activeFaults.push('PERSISTENT');

              chosenFault =
                activeFaults.length > 0
                  ? activeFaults[Math.floor(Math.random() * activeFaults.length)]
                  : 'QUANTITY';
            }

            if (chosenFault === 'MISSING') {
              observedQty = 0;
              observedSku = null;
              binStatus = 'CRITICAL';
              faultDistribution.MISSING_ITEM++;
            } else if (chosenFault === 'UNEXPECTED') {
              observedQty = expectedQty + 2;
              observedSku = `${skuCode} + UNKNOWN-CRATE`;
              binStatus = 'WARNING';
              faultDistribution.UNEXPECTED_ITEM++;
            } else if (chosenFault === 'WRONG_LOC') {
              observedQty = 4;
              observedSku = `SKU-MISPLACED-EXT`;
              binStatus = 'HIGH_RISK';
              faultDistribution.WRONG_LOCATION++;
            } else if (chosenFault === 'LABEL') {
              observedQty = expectedQty;
              observedSku = `${skuCode}-MISMATCH-BARCODE`;
              binStatus = 'WARNING';
              faultDistribution.LABEL_MISMATCH++;
            } else if (chosenFault === 'PERSISTENT') {
              const delta = -Math.ceil(expectedQty * 0.3);
              observedQty = Math.max(1, expectedQty + delta);
              binStatus = 'CRITICAL';
              faultDistribution.PERSISTENT_DISCREPANCY++;
            } else {
              // Quantity mismatch
              const delta = Math.random() > 0.5 ? -Math.ceil(expectedQty * 0.3) : Math.ceil(expectedQty * 0.2);
              observedQty = Math.max(1, expectedQty + delta);
              binStatus = 'HIGH_RISK';
              faultDistribution.QUANTITY_MISMATCH++;
            }
          }

          totalObservedSum += observedQty;

          // Normalized 2D spatial coordinates for map visualization
          const normX = 8 + (b - 1) * (78 / binsPerShelf);
          const normY = 12 + rIdx * (70 / racks.length) + (s - 1) * 8;

          generatedBins.push({
            id: `WH01-${zoneLetter.replace(' ', '')}-${rackName.replace(' ', '')}-S${s}-B0${b}`,
            displayCode,
            zone: zoneLetter,
            rack: rackName,
            shelf: s,
            binNumber: `Bin 0${b}`,
            expectedSku: skuCode,
            expectedQty,
            observedSku,
            observedQty,
            currentStatus: binStatus,
            spatialRegion: {
              normalizedX: Math.round(normX),
              normalizedY: Math.round(normY),
              normalizedW: Math.round(72 / binsPerShelf),
              normalizedH: 14,
            },
          });

          binCounter++;
        }
      }
    });

    // Footprint calculation
    const cameraFootprint = this.calculateCameraFootprint(params.cameraAltitudeM, params.cameraFovDeg);
    const warehouseTotalArea = racks.length * 110;
    const speed = params.flightSpeedMs || 0.8;
    const scanDensityFactor = params.scanDensity === 'HIGH' ? 1.25 : params.scanDensity === 'LOW' ? 0.75 : 1.0;

    const areaScannedSqMeters = Math.min(
      warehouseTotalArea,
      Math.round(racks.length * cameraFootprint.groundAreaSqMeters * 1.5 * scanDensityFactor)
    );
    const coveragePercentage = Math.min(100, Math.round((areaScannedSqMeters / warehouseTotalArea) * 100));

    // Generate UAV flight waypoints
    const flightWaypoints: UAVWaypoint[] = racks.map((rack, idx) => ({
      id: `WP-0${idx + 1}`,
      index: idx + 1,
      label: `Inspect ${rack}`,
      coordinates: {
        x: Number((4.0 + idx * 4.5).toFixed(1)),
        y: Number((5.5 + (idx % 2) * 6.0).toFixed(1)),
        z: params.cameraAltitudeM,
      },
      targetRack: rack,
      status: idx === 0 ? 'SCANNING' : 'PENDING',
    }));

    return {
      generatedInventory,
      generatedBins,
      injectedDiscrepanciesCount: injectedCount,
      faultDistribution,
      flightWaypoints,
      estimatedFlightTimeSeconds: Math.round((racks.length * 28) / speed),
      areaScannedSqMeters,
      coveragePercentage,
      totalObjectsObserved: totalObservedSum,
      cameraFootprint,
    };
  }
}
