import React, { useState, useEffect } from 'react';
import { UAVTelemetry } from '../../types';
import { INITIAL_UAV_TELEMETRY, SAMPLE_AERIAL_IMAGES } from '../../data/mockWarehouseData';
import {
  Navigation,
  Compass,
  BatteryCharging,
  Maximize2,
  Play,
  Pause,
  SkipForward,
  Camera,
  Layers,
  Radio,
  Wifi,
  Cpu,
} from 'lucide-react';

interface UAVSimulationViewProps {
  onCaptureScan: () => void;
  isScanning: boolean;
}

export const UAVSimulationView: React.FC<UAVSimulationViewProps> = ({
  onCaptureScan,
  isScanning,
}) => {
  const [telemetry, setTelemetry] = useState<UAVTelemetry>(INITIAL_UAV_TELEMETRY);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWaypoint, setCurrentWaypoint] = useState(2);
  const [capturedFlash, setCapturedFlash] = useState(false);

  // 6 Predefined scan waypoints along warehouse aisles
  const waypoints = [
    { index: 1, label: 'WP1: Aisle A (Rack A01-S1)', x: 18, y: 30, alt: 3.5 },
    { index: 2, label: 'WP2: Aisle A (Rack A01-S2)', x: 38, y: 30, alt: 3.4 },
    { index: 3, label: 'WP3: Aisle A (Rack A02)', x: 60, y: 30, alt: 3.6 },
    { index: 4, label: 'WP4: Aisle B (Rack B01)', x: 25, y: 65, alt: 3.8 },
    { index: 5, label: 'WP5: Aisle B (Rack B02)', x: 55, y: 65, alt: 3.7 },
    { index: 6, label: 'WP6: Aisle C (Rack C01)', x: 40, y: 85, alt: 3.5 },
  ];

  // Simulated flight animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentWaypoint((prev) => {
        const next = prev >= waypoints.length ? 1 : prev + 1;
        const targetWp = waypoints[next - 1];

        setTelemetry((t) => ({
          ...t,
          currentWaypointIndex: next,
          coordinates: {
            x: Number((targetWp.x * 0.4).toFixed(1)),
            y: Number((targetWp.y * 0.3).toFixed(1)),
            z: targetWp.alt,
          },
          batteryPercentage: Math.max(15, t.batteryPercentage - 0.2),
          groundSpeedMs: 0.8 + Number((Math.random() * 0.2 - 0.1).toFixed(2)),
          gimbalPitchDegrees: -45 + Math.round(Math.random() * 4 - 2),
        }));

        return next;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isPlaying, waypoints]);

  const handleNextWaypoint = () => {
    const next = currentWaypoint >= waypoints.length ? 1 : currentWaypoint + 1;
    setCurrentWaypoint(next);
    const targetWp = waypoints[next - 1];
    setTelemetry((t) => ({
      ...t,
      currentWaypointIndex: next,
      coordinates: {
        x: Number((targetWp.x * 0.4).toFixed(1)),
        y: Number((targetWp.y * 0.3).toFixed(1)),
        z: targetWp.alt,
      },
    }));
  };

  const handleCapture = () => {
    setCapturedFlash(true);
    setTimeout(() => setCapturedFlash(false), 300);
    onCaptureScan();
  };

  const currentWpData = waypoints[currentWaypoint - 1] || waypoints[0];

  return (
    <div className="space-y-6">
      {/* Top Telemetry Strip */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px] uppercase font-semibold">UAV Airframe</span>
          <span className="font-mono font-bold text-white text-sm">Raven-04</span>
          <span className="text-[10px] text-sky-400 block">Hexacopter Rig</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px] uppercase font-semibold">Battery State</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <BatteryCharging className="h-4 w-4 text-emerald-400" />
            <span className="font-mono font-bold text-white text-sm tabular-nums">
              {telemetry.batteryPercentage.toFixed(0)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400">22.2V LiPo 6S</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px] uppercase font-semibold">Altitude & Speed</span>
          <span className="font-mono font-bold text-sky-400 text-sm tabular-nums">
            {telemetry.coordinates.z}m
          </span>
          <span className="text-slate-400 text-xs ml-1 font-mono">
            ({telemetry.groundSpeedMs} m/s)
          </span>
          <span className="text-[10px] text-slate-400 block">Ultrasonic + Baro</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px] uppercase font-semibold">Gimbal Pitch</span>
          <span className="font-mono font-bold text-white text-sm tabular-nums">
            {telemetry.gimbalPitchDegrees}°
          </span>
          <span className="text-[10px] text-slate-400 block">Stabilized 3-Axis</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px] uppercase font-semibold">Local Coordinates</span>
          <span className="font-mono text-slate-200 text-xs tabular-nums block">
            X: {telemetry.coordinates.x}m · Y: {telemetry.coordinates.y}m
          </span>
          <span className="text-[10px] text-sky-400">Optical Flow / SLAM</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px] uppercase font-semibold">Comms Link</span>
          <div className="flex items-center gap-1.5 text-emerald-400 mt-0.5">
            <Wifi className="h-3.5 w-3.5" />
            <span className="font-semibold text-xs">MAVLink 5.8GHz</span>
          </div>
          <span className="text-[10px] text-slate-400">Telemetry nominal</span>
        </div>
      </div>

      {/* Main Simulation Layout: 2D Warehouse Flight Map + Live Camera Gimbal Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 2D Top-Down Warehouse Flight Path & Camera Footprint (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Autonomous Scan Flight Path & Footprint
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Waypoint {currentWaypoint} / {waypoints.length}
              </div>
            </div>

            {/* 2D Plan View Canvas / SVG Map */}
            <div className="relative aspect-[16/10] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden p-4">
              {/* Warehouse Floor Grid Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:40px_40px]" />

              {/* Racks Layout Simulation */}
              {/* Rack Row A */}
              <div className="absolute top-[20%] left-[10%] w-[75%] h-[18%] border border-slate-700 bg-slate-900/60 rounded flex items-center justify-around px-2 text-[10px] text-slate-400 font-mono">
                <span className="bg-slate-800 px-2 py-0.5 rounded">RACK A01 (Bins 01-03)</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded">RACK A02 (Bins 01-02)</span>
              </div>

              {/* Rack Row B */}
              <div className="absolute top-[50%] left-[10%] w-[75%] h-[18%] border border-slate-700 bg-slate-900/60 rounded flex items-center justify-around px-2 text-[10px] text-slate-400 font-mono">
                <span className="bg-slate-800 px-2 py-0.5 rounded">RACK B01 (Bins 01-02)</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded">RACK B02 (Bins 03-04)</span>
              </div>

              {/* Rack Row C */}
              <div className="absolute top-[80%] left-[20%] w-[55%] h-[14%] border border-slate-700 bg-slate-900/60 rounded flex items-center justify-around px-2 text-[10px] text-slate-400 font-mono">
                <span className="bg-slate-800 px-2 py-0.5 rounded">RACK C01 (Bins 01-02)</span>
              </div>

              {/* Flight Path SVG Line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polyline
                  points={waypoints.map((w) => `${w.x * 3.5},${w.y * 2.2}`).join(' ')}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
              </svg>

              {/* Waypoint Markers */}
              {waypoints.map((w) => {
                const isActive = w.index === currentWaypoint;
                return (
                  <div
                    key={w.index}
                    style={{ left: `${w.x}%`, top: `${w.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all ${
                      isActive ? 'z-20 scale-110' : 'z-10 opacity-70'
                    }`}
                    onClick={() => setCurrentWaypoint(w.index)}
                  >
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                        isActive
                          ? 'bg-sky-400 text-slate-950 ring-4 ring-sky-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-600'
                      }`}
                    >
                      {w.index}
                    </div>
                  </div>
                );
              })}

              {/* Animated UAV Drone & Projected Camera Footprint */}
              <div
                style={{
                  left: `${currentWpData.x}%`,
                  top: `${currentWpData.y}%`,
                  transition: isPlaying ? 'all 2.4s ease-in-out' : 'all 0.5s ease-out',
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center"
              >
                {/* Camera Footprint Frustum Projection Rectangle */}
                <div className="w-24 h-16 border-2 border-sky-400/80 bg-sky-400/10 rounded-sm -translate-y-2 flex items-center justify-center">
                  <span className="text-[9px] font-mono text-sky-300 uppercase tracking-tight">
                    FOV FRUSTUM
                  </span>
                </div>

                {/* Drone Symbol */}
                <div className="relative -mt-8 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-slate-950 border-2 border-sky-400 shadow-lg shadow-sky-500/50 flex items-center justify-center">
                    <Navigation className="h-3.5 w-3.5 text-sky-400 transform rotate-45" />
                  </div>
                </div>
              </div>
            </div>

            {/* Flight Execution Controls */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                    isPlaying
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5" />
                      <span>Pause Flight</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      <span>Start Auto Sweep</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleNextWaypoint}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  <span>Next Waypoint</span>
                </button>
              </div>

              <button
                onClick={handleCapture}
                disabled={isScanning}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Capture & Ingest Frame</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Simulated Real-Time Camera Stream Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Gimbal Camera Optical Feed
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">4K 60FPS</span>
            </div>

            {/* Video / Frame Screen */}
            <div className="relative aspect-[4/3] rounded-lg bg-slate-950 border border-slate-800 overflow-hidden group">
              <img
                src={SAMPLE_AERIAL_IMAGES.warehouseOverview}
                alt="Simulated UAV Camera Stream"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Shutter flash effect */}
              {capturedFlash && <div className="absolute inset-0 bg-white z-40 animate-fade" />}

              {/* HUD Telemetry Overlay */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-sky-400 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded border border-slate-800">
                <span>REC ● 00:03:14</span>
                <span>ISO 400 · 1/2000s · f/2.8</span>
                <span>ALT {telemetry.coordinates.z}m</span>
              </div>

              {/* Center reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-16 h-16 border border-sky-400/40 rounded flex items-center justify-center">
                  <div className="w-2 h-2 border-t-2 border-l-2 border-sky-400" />
                </div>
              </div>

              {/* Target Rack Label */}
              <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-1 rounded text-[11px] font-mono text-slate-200 border border-slate-800">
                Target: {currentWpData.label}
              </div>
            </div>

            {/* Hardware Abstraction Contract Note */}
            <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-[11px]">
                <Cpu className="h-3.5 w-3.5" />
                <span>Hardware Abstraction Contract</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The <code className="text-slate-300">ImageSource</code> and <code className="text-slate-300">TelemetrySource</code> interfaces isolate the UI and discrepancy engine from physical sensor implementations. Replacing <code className="text-slate-300">SimulationImageSource</code> with <code className="text-slate-300">UAVCameraSource</code> (RTSP/WebRTC) connects directly to a physical UAV without frontend modifications.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
