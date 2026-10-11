/**
 * AEROVUE Data Ingestion Service
 * Handles uploading & parsing:
 * - Inventory CSV / JSON
 * - Aerial UAV Imagery & Video sequence frames
 * - Historical scan records
 */

import { InventoryItem, ItemCriticality, DiscrepancyRecord } from '../types';
import { INITIAL_INVENTORY, INITIAL_DISCREPANCIES } from '../data/mockWarehouseData';

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  itemCount?: number;
}

export class DataIngestionService {
  /**
   * Parse Inventory CSV format
   * Expected headers: sku,name,category,expectedQuantity,warehouse,zone,rack,shelf,bin,criticality,unitValueUsd,reorderThreshold
   */
  public parseInventoryCSV(csvContent: string): ParseResult<InventoryItem[]> {
    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { success: false, errors: ['CSV file is empty or lacks header line.'] };
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const required = ['sku', 'expectedquantity', 'rack', 'bin'];
    const missing = required.filter((r) => !headers.includes(r));
    if (missing.length > 0) {
      return { success: false, errors: [`Missing required columns: ${missing.join(', ')}`] };
    }

    const skuIdx = headers.indexOf('sku');
    const nameIdx = headers.indexOf('name');
    const catIdx = headers.indexOf('category');
    const qtyIdx = headers.indexOf('expectedquantity');
    const whIdx = headers.indexOf('warehouse');
    const zoneIdx = headers.indexOf('zone');
    const rackIdx = headers.indexOf('rack');
    const shelfIdx = headers.indexOf('shelf');
    const binIdx = headers.indexOf('bin');
    const critIdx = headers.indexOf('criticality');
    const valIdx = headers.indexOf('unitvalueusd');
    const reorderIdx = headers.indexOf('reorderthreshold');

    const items: InventoryItem[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map((c) => c.trim());

      const sku = cols[skuIdx];
      const qty = parseInt(cols[qtyIdx], 10);
      if (!sku || isNaN(qty)) {
        errors.push(`Row ${i + 1}: Invalid SKU or quantity.`);
        continue;
      }

      let criticality: ItemCriticality = 'MEDIUM';
      if (critIdx !== -1 && cols[critIdx]) {
        const c = cols[critIdx].toUpperCase();
        if (c === 'LOW' || c === 'MEDIUM' || c === 'HIGH' || c === 'MISSION_CRITICAL') {
          criticality = c;
        }
      }

      items.push({
        sku,
        name: nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : `Item ${sku}`,
        category: catIdx !== -1 && cols[catIdx] ? cols[catIdx] : 'General Warehouse',
        expectedQuantity: qty,
        location: {
          warehouse: whIdx !== -1 && cols[whIdx] ? cols[whIdx] : 'WH-01',
          zone: zoneIdx !== -1 && cols[zoneIdx] ? cols[zoneIdx] : 'Zone A',
          rack: rackIdx !== -1 && cols[rackIdx] ? cols[rackIdx] : 'Rack A01',
          shelf: shelfIdx !== -1 ? parseInt(cols[shelfIdx], 10) || 1 : 1,
          bin: binIdx !== -1 && cols[binIdx] ? cols[binIdx] : 'Bin 01',
        },
        criticality,
        unitValueUsd: valIdx !== -1 ? parseFloat(cols[valIdx]) || 50.0 : 50.0,
        reorderThreshold: reorderIdx !== -1 ? parseInt(cols[reorderIdx], 10) || 5 : 5,
      });
    }

    return {
      success: items.length > 0,
      data: items,
      errors: errors.length > 0 ? errors : undefined,
      itemCount: items.length,
    };
  }

  /**
   * Parse Inventory JSON format
   */
  public parseInventoryJSON(jsonContent: string): ParseResult<InventoryItem[]> {
    try {
      const parsed = JSON.parse(jsonContent);
      const items = Array.isArray(parsed) ? parsed : parsed.inventory || parsed.items;
      if (!Array.isArray(items) || items.length === 0) {
        return { success: false, errors: ['JSON does not contain an array of inventory items.'] };
      }
      return { success: true, data: items as InventoryItem[], itemCount: items.length };
    } catch (e: any) {
      return { success: false, errors: [`JSON Parse error: ${e.message}`] };
    }
  }

  /**
   * Generates a template CSV string for users to download
   */
  public generateSampleCSV(): string {
    const header = 'sku,name,category,expectedQuantity,warehouse,zone,rack,shelf,bin,criticality,unitValueUsd,reorderThreshold\n';
    const rows = INITIAL_INVENTORY.map(
      (item) =>
        `${item.sku},"${item.name}","${item.category}",${item.expectedQuantity},${item.location.warehouse},${item.location.zone},${item.location.rack},${item.location.shelf},${item.location.bin},${item.criticality},${item.unitValueUsd},${item.reorderThreshold}`
    ).join('\n');
    return header + rows;
  }
}
