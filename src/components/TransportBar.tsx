import React from 'react';
import { formatTime, formatBars } from '../utils';
import { AudioEngineState } from '../types';

interface DeviceItem {
  deviceId: string;
  label: string;
}

interface Props {
  state: AudioEngineState;
  isRecording: boolean;
  onPlay: () => void;
  onStop: () => void;
  onRecord: () => void;
  onBpmChange: (bpm: number) => void;
  onExport: () => void;
  onImportClick: () => void;
  masterVolume: number;
  onMasterVolumeChange: (v: number) => void;
  masterMeter: number;
  pixelsPerSecond: number;
  onZoomHIn: () => void;
  onZoomHOut: () => void;
  onZoomHReset: () => void;
  onZoomHSet: (v: number) => void;
  trackHeight: number;
  onZoomVIn: () => void;
  onZoomVOut: () => void;
  onZoomVReset: () => void;
  onZoomVSet: (v: number) => void;
  inputDevices: DeviceItem[];
  selectedMicId: string;
  onMicChange: (id: string) => void;
  outputDevices: DeviceItem[];
  selectedOutputId: string;
  onOutputChange: (id: string) => void;
  onRefreshDevices: () => void;
  outputSupported: boolean;
}

const BtnIcon: React.FC<{
  onClick?: () => void;
  onDoubleClick?: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, onDoubleClick, title, children, className = '' }) => (
  <button
    onClick={onClick}
    onDoubleClick={onDoubleClick}
    title={title}
    className={`w-7 h-7 rounded bg-studio-bg hover:bg-studio-border border border-studio-border flex items-center justify-center text-gray-300 hover:text-white transition-all shrink-0 ${className}`}
  >
    {children}
  </button>
);

const DeviceSelect: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: string;
  devices: DeviceItem[];
  onChange: (id: string) => void;
  title?: string;
  disabled?: boolean;
  width?: string;
}> = ({ label, icon, value, devices, onChange, title, disabled, width = 'w-[150px]' }) => {
  const hasDefault = value === 'default' || devices.some((d) => d.deviceId === 'default');
  const options: DeviceItem[] = [];
  if (hasDefault && !devices.some((d) => d.deviceId === 'default')) {
    options.push({ deviceId: 'default', label: 'Default System Device' });
  }
  devices.forEach((d) => {
    if (d.deviceId === 'default') {
      if (!options.some((o) => o.deviceId === 'default')) options.push({ deviceId: 'default', label: d.label || 'Default System Device' });
    } else {
      options.push(d);
    }
  });
  if (options.length === 0) options.push({ deviceId: 'default', label: 'Default System Device' });

  const current = options.find((o) => o.deviceId === value) || options[0];

  return (
    <div className="flex items-center gap-1.5 shrink-0" title={title}>
      <div className="text-studio-accent font-bold text-[11px] uppercase tracking-wide whitespace-nowrap shrink-0 flex items-center gap-1">
        <div className="text-gray-300">{icon}</div>
        {label}
      </div>
      <div className="relative">
        <select
          disabled={disabled}
          value={current.deviceId}
          onChange={(e) => onChange(e.target.value)}
          className={`${width} bg-studio-bg border border-studio-border rounded pl-2 pr-6 py-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-studio-accent truncate appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0`}
        >
          {options.map((d) => (
            <option key={d.deviceId} value={d.deviceId} className="text-xs truncate">
              {d.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] leading-none">▾</div>
      </div>
    </div>
  );
};

export const TransportBar: React.FC<Props> = ({
  state,
  isRecording,
  onPlay,
  onStop,
  onRecord,
  onBpmChange,
  onExport,
  onImportClick,
  masterVolume,
  onMasterVolumeChange,
  masterMeter,
  pixelsPerSecond,
  onZoomHIn,
  onZoomHOut,
  onZoomHReset,
  onZoomHSet,
  trackHeight,
  onZoomVIn,
  onZoomVOut,
  onZoomVReset,
  onZoomVSet,
  inputDevices,
  selectedMicId,
  onMicChange,
  outputDevices,
  selectedOutputId,
  onOutputChange,
  onRefreshDevices,
  outputSupported,
}) => {
  return (
    <div className="bg-studio-panel border-b border-studio-border flex flex-col gap-2 px-3 py-2 shrink-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 min-h-[44px]">
        <div className="flex items-center gap-2 pr-3 border-r border-studio-border">
          <div className="text-studio-accent font-bold text-lg leading-tight whitespace-nowrap">🎵 Mouza Studio</div>
        </div>

        <div className="flex items-center gap-1.5 pr-3 border-r border-studio-border">
          <button
            onClick={onRecord}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
              isRecording
                ? 'bg-studio-danger text-white animate-pulse shadow-lg shadow-red-500/50'
                : 'bg-studio-bg hover:bg-red-500/20 text-studio-danger border border-studio-border'
            }`}
            title="Record (R)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="6" />
            </svg>
          </button>

          <button
            onClick={onPlay}
            className="w-9 h-9 rounded-full bg-studio-accent hover:bg-studio-accent-hover flex items-center justify-center transition-all shadow-lg shadow-purple-500/30 shrink-0"
            title={state.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {state.isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,4 20,12 6,20" />
              </svg>
            )}
          </button>

          <button
            onClick={onStop}
            className="w-9 h-9 rounded-full bg-studio-bg hover:bg-studio-border border border-studio-border flex items-center justify-center transition-all shrink-0"
            title="Stop (S)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 pr-3 border-r border-studio-border font-mono">
          <div className="bg-black/40 rounded-lg px-3 py-1.5 text-xl tracking-wider whitespace-nowrap">
            {formatTime(state.currentTime)}
          </div>
          <div className="text-gray-500 text-sm whitespace-nowrap">
            {formatBars(state.currentTime, state.bpm)}
          </div>
        </div>

        <div className="flex items-center gap-2 pr-3 border-r border-studio-border">
          <DeviceSelect
            label="MIC"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="17" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            }
            value={selectedMicId}
            devices={inputDevices}
            onChange={onMicChange}
            title="Microphone / Input Device (digunakan saat merekam)"
          />
          <DeviceSelect
            label="OUT"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            }
            value={selectedOutputId}
            devices={outputDevices}
            onChange={onOutputChange}
            title={outputSupported
              ? 'Speaker / Output Device (tempat audio diputar)'
              : 'Output per-device tidak didukung browser ini (pakai Chrome/Edge). Audio ke sistem default.'}
            disabled={!outputSupported}
          />
          <BtnIcon
            onClick={onRefreshDevices}
            title="Refresh daftar perangkat audio"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23,4 23,10 17,10" />
              <polyline points="1,20 1,14 7,14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </BtnIcon>
        </div>

        <div className="flex items-center gap-2 pr-3 border-r border-studio-border">
          <label className="text-[11px] text-gray-400 font-semibold whitespace-nowrap">BPM</label>
          <input
            type="number"
            min="40"
            max="240"
            value={state.bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            className="w-14 bg-studio-bg border border-studio-border rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-studio-accent"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onImportClick}
            className="px-3 py-1.5 bg-studio-bg hover:bg-studio-border border border-studio-border rounded-lg text-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import
          </button>
          <button
            onClick={onExport}
            className="px-3 py-1.5 bg-studio-accent hover:bg-studio-accent-hover rounded-lg text-sm transition-all flex items-center gap-1.5 shadow-lg shadow-purple-500/20 whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export WAV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 min-h-[36px] border-t border-studio-border/70 pt-2">
        <div className="flex items-center gap-2 pr-3 border-r border-studio-border min-w-[220px] flex-1 max-w-md">
          <label className="text-[11px] text-gray-400 font-semibold shrink-0 whitespace-nowrap">MASTER</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
            className="flex-1 min-w-[80px]"
          />
          <div className="w-20 h-3.5 bg-studio-bg rounded overflow-hidden border border-studio-border shrink-0">
            <div
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
              style={{ width: `${Math.min(100, masterMeter * 300)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pr-3 border-r border-studio-border">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider w-4 shrink-0" title="Zoom Horizontal (Timeline)">H</span>
            <BtnIcon
              onClick={onZoomHOut}
              onDoubleClick={onZoomHReset}
              title={`Zoom Out Timeline (Ctrl + Scroll)\nDouble-click: Reset`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </BtnIcon>
            <input
              type="range"
              min="15"
              max="300"
              step="1"
              value={pixelsPerSecond}
              onChange={(e) => onZoomHSet(Number(e.target.value))}
              className="w-[88px] shrink-0"
              title={`${Math.round(pixelsPerSecond)} px/detik`}
            />
            <BtnIcon
              onClick={onZoomHIn}
              onDoubleClick={onZoomHReset}
              title={`Zoom In Timeline (Ctrl + Scroll)\nDouble-click: Reset`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </BtnIcon>
            <span className="text-[10px] text-gray-500 font-mono w-8 text-right shrink-0 tabular-nums" title="Pixels / second">
              {Math.round(pixelsPerSecond)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider w-4 shrink-0" title="Zoom Vertikal (Tinggi Track)">V</span>
            <BtnIcon
              onClick={onZoomVOut}
              onDoubleClick={onZoomVReset}
              title={`Perkecil Tinggi Track (Shift + Scroll)\nDouble-click: Reset`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </BtnIcon>
            <input
              type="range"
              min="50"
              max="200"
              step="1"
              value={trackHeight}
              onChange={(e) => onZoomVSet(Number(e.target.value))}
              className="w-[72px] shrink-0"
              title={`Tinggi track: ${trackHeight}px`}
            />
            <BtnIcon
              onClick={onZoomVIn}
              onDoubleClick={onZoomVReset}
              title={`Perbesar Tinggi Track (Shift + Scroll)\nDouble-click: Reset`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </BtnIcon>
            <span className="text-[10px] text-gray-500 font-mono w-7 text-right shrink-0 tabular-nums" title="Tinggi (px)">
              {trackHeight}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
