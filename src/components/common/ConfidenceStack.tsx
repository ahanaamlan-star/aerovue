import React from 'react';

interface ConfidenceStackProps {
  visionScore: number; // 0 - 100
  spatialScore: number; // 0 - 100
  temporalScore: number; // 0 - 100
  overallScore: number; // 0 - 100
  weights?: {
    vision: number;
    spatial: number;
    temporal: number;
  };
}

export const ConfidenceStack: React.FC<ConfidenceStackProps> = ({
  visionScore,
  spatialScore,
  temporalScore,
  overallScore,
  weights = { vision: 0.45, spatial: 0.35, temporal: 0.2 },
}) => {
  const renderBlocks = (pct: number) => {
    const totalBlocks = 20;
    const filledBlocks = Math.round((pct / 100) * totalBlocks);
    const filled = '█'.repeat(Math.max(0, Math.min(totalBlocks, filledBlocks)));
    const empty = '░'.repeat(Math.max(0, totalBlocks - filledBlocks));
    return { filled, empty };
  };

  const layers = [
    {
      label: 'Vision Modality',
      sub: 'Bounding acuity & OCR confidence',
      pct: visionScore,
      weight: weights.vision,
      color: '#4DA3FF',
    },
    {
      label: 'Spatial Reasoning',
      sub: 'IoU containment & bin geometry',
      pct: spatialScore,
      weight: weights.spatial,
      color: '#39D98A',
    },
    {
      label: 'Temporal Persistence',
      sub: 'Cross-scan reproducibility factor',
      pct: temporalScore,
      weight: weights.temporal,
      color: '#F5B942',
    },
  ];

  return (
    <div className="rounded border border-[#24364A] bg-[#0D1B2A] p-3.5 space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-[#24364A] pb-2">
        <span className="text-[11px] font-bold tracking-wider text-[#F4F7FA] uppercase">
          AEROVUE Confidence Stack
        </span>
        <span className="text-xs font-bold text-[#4DA3FF] tabular-nums">
          {overallScore}% COMPOSITE
        </span>
      </div>

      <div className="space-y-2.5">
        {layers.map((layer) => {
          const { filled, empty } = renderBlocks(layer.pct);
          return (
            <div key={layer.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F4F7FA] font-medium">{layer.label}</span>
                <span className="text-xs font-bold text-[#F4F7FA] tabular-nums">{layer.pct}%</span>
              </div>

              {/* Block text visualizer requested */}
              <div className="flex items-center justify-between text-[11px] tracking-tighter">
                <span className="font-mono select-none" style={{ color: layer.color }}>
                  {filled}
                  <span className="text-[#24364A]">{empty}</span>
                </span>
                <span className="text-[10px] text-[#8FA4B8] tabular-nums">
                  wt {(layer.weight * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-[#24364A] text-[10px] text-[#8FA4B8] flex items-center justify-between">
        <span>Reasoning across 3 orthogonal evidence sources</span>
        <span className="text-[#4DA3FF]">CALIBRATED</span>
      </div>
    </div>
  );
};
