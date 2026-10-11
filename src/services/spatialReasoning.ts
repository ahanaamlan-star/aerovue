/**
 * AEROVUE Spatial Reasoning Engine
 *
 * Maps pixel & bounding-box detections in aerial camera frames
 * into structured warehouse coordinate space (Zone -> Rack -> Shelf -> Bin).
 *
 * Designed with extensible hooks for UAV camera pose, gimbal pitch/yaw,
 * altitude homography, and 3D spatial coordinate projection.
 */

import { BoundingBox, DetectedObject, WarehouseBin } from '../types';

export interface CameraPose {
  altitudeM: number;
  pitchDeg: number;
  yawDeg: number;
  rollDeg: number;
  fovDeg: number;
  worldCoordinates: { x: number; y: number; z: number };
}

export interface SpatialMatchResult {
  bin: WarehouseBin;
  overlapScore: number; // 0.0 - 1.0 (Intersection over Union / Area overlap)
  isInsideExpectedRegion: boolean;
  distanceFromBinCenter: number; // normalized units
}

export class SpatialReasoningEngine {
  /**
   * Calculate 2D Intersection Over Union (IoU) between bounding boxes
   */
  public computeIoU(boxA: BoundingBox, boxB: BoundingBox): number {
    const xA = Math.max(boxA.x, boxB.x);
    const yA = Math.max(boxA.y, boxB.y);
    const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
    const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const boxAArea = boxA.width * boxA.height;
    const boxBArea = boxB.width * boxB.height;
    const unionArea = boxAArea + boxBArea - interArea;

    if (unionArea <= 0) return 0;
    return interArea / unionArea;
  }

  /**
   * Compute overlap ratio of boxA inside binRegion (boxA area inside bin / boxA area)
   */
  public computeContainment(objectBox: BoundingBox, binRegion: { normalizedX: number; normalizedY: number; normalizedW: number; normalizedH: number }): number {
    const binBox: BoundingBox = {
      x: binRegion.normalizedX,
      y: binRegion.normalizedY,
      width: binRegion.normalizedW,
      height: binRegion.normalizedH,
    };

    const xA = Math.max(objectBox.x, binBox.x);
    const yA = Math.max(objectBox.y, binBox.y);
    const xB = Math.min(objectBox.x + objectBox.width, binBox.x + binBox.width);
    const yB = Math.min(objectBox.y + objectBox.height, binBox.y + binBox.height);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const objectArea = objectBox.width * objectBox.height;

    if (objectArea <= 0) return 0;
    return interArea / objectArea;
  }

  /**
   * Map detected object to candidate bins based on spatial geometry
   */
  public mapObjectToBins(
    detected: DetectedObject,
    bins: WarehouseBin[],
    _cameraPose?: CameraPose
  ): SpatialMatchResult[] {
    const results: SpatialMatchResult[] = [];

    const objCenterX = detected.box.x + detected.box.width / 2;
    const objCenterY = detected.box.y + detected.box.height / 2;

    for (const bin of bins) {
      const containment = this.computeContainment(detected.box, bin.spatialRegion);
      const binCenterX = bin.spatialRegion.normalizedX + bin.spatialRegion.normalizedW / 2;
      const binCenterY = bin.spatialRegion.normalizedY + bin.spatialRegion.normalizedH / 2;

      const dx = objCenterX - binCenterX;
      const dy = objCenterY - binCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const isInside =
        objCenterX >= bin.spatialRegion.normalizedX &&
        objCenterX <= bin.spatialRegion.normalizedX + bin.spatialRegion.normalizedW &&
        objCenterY >= bin.spatialRegion.normalizedY &&
        objCenterY <= bin.spatialRegion.normalizedY + bin.spatialRegion.normalizedH;

      results.push({
        bin,
        overlapScore: containment,
        isInsideExpectedRegion: isInside,
        distanceFromBinCenter: dist,
      });
    }

    // Sort by best match (highest overlap, lowest distance)
    return results.sort((a, b) => b.overlapScore - a.overlapScore || a.distanceFromBinCenter - b.distanceFromBinCenter);
  }

  /**
   * Spatial confidence estimation
   * Returns a 0.0 - 1.0 confidence score representing how cleanly detections align with grid geometries
   */
  public estimateSpatialConfidence(
    matches: SpatialMatchResult[],
    cameraAltitudeM: number = 3.5
  ): number {
    if (matches.length === 0) return 0.5;
    const best = matches[0];

    // Penalty if camera is too high (lower ground resolution)
    let altFactor = 1.0;
    if (cameraAltitudeM > 5.0) altFactor = 0.85;
    else if (cameraAltitudeM < 2.0) altFactor = 0.90; // Too close, severe perspective distortion

    let baseSpatialScore = best.isInsideExpectedRegion ? 0.90 : 0.65;
    if (best.overlapScore > 0.7) {
      baseSpatialScore += 0.08;
    }

    return Math.min(0.99, Math.max(0.3, baseSpatialScore * altFactor));
  }
}
