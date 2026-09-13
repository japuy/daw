import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TransportBar } from './components/TransportBar';
import { TrackList } from './components/TrackList';
import { Timeline } from './components/Timeline';
import { useAudioEngine } from './useAudioEngine';
import { createDefaultTrack } from './utils';
import { Track, AudioClip, PluginType } from './types';
import { PLUGIN_PRESETS, PLUGIN_CATEGORIES } from './plugins';

const DEFAULT_TRACK_HEIGHT = 90;
const DEFAULT_PIXELS_PER_SECOND = 60;
const MIN_PIXELS_PER_SECOND = 15;
const MAX_PIXELS_PER_SECOND = 300;
const MIN_TRACK_HEIGHT = 50;
const MAX_TRACK_HEIGHT = 200;

interface DeviceItem {
  deviceId: string;
  label: string;
}

function App() {
  const [tracks, setTracks] = useState<Track[]>([
    { ...createDefaultTrack(0), armed: true },
    createDefaultTrack(1),
    createDefaultTrack(2),
    createDefaultTrack(3),
  ]);
  const [clips, setClips] = useState<AudioClip[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(tracks[0]?.id || null);
  const [recordingTrackId, setRecordingTrackId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [pixelsPerSecond, setPixelsPerSecond] = useState<number>(DEFAULT_PIXELS_PER_SECOND);
  const [trackHeight, setTrackHeight] = useState<number>(DEFAULT_TRACK_HEIGHT);
  const [inputDevices, setInputDevices] = useState<DeviceItem[]>([]);
  const [outputDevices, setOutputDevices] = useState<DeviceItem[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('default');
  const [selectedOutputId, setSelectedOutputId] = useState<string>('default');
  const [outputSupported, setOutputSupported] = useState<boolean>(true);

  const importFileInputRef = useRef<HTMLInputElement>(null);

  const engine = useAudioEngine(tracks, clips, setClips, setTracks);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const mic: DeviceItem[] = [];
      const out: DeviceItem[] = [];
      all.forEach((d) => {
        const label = d.label || (d.deviceId === 'default' ? 'Default' : `Device ${d.deviceId.slice(0, 6)}`);
        if (d.kind === 'audioinput') mic.push({ deviceId: d.deviceId, label });
        else if (d.kind === 'audiooutput') out.push({ deviceId: d.deviceId, label });
      });
      setInputDevices((prev) => (prev.length === 0 && mic.length === 0 ? prev : mic));
      setOutputDevices((prev) => (prev.length === 0 && out.length === 0 ? prev : out));
    } catch (e) {
      console.warn('enumerateDevices gagal:', e);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    if (!navigator.mediaDevices) return;
    const handler = () => refreshDevices();
    navigator.mediaDevices.addEventListener?.('devicechange', handler);
    return () => {
      navigator.mediaDevices.removeEventListener?.('devicechange', handler);
    };
  }, [refreshDevices]);

  useEffect(() => {
    try {
      const ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const anyAc = ac as unknown as { setSinkId?: unknown };
      setOutputSupported(typeof anyAc.setSinkId === 'function');
      try { ac.close(); } catch {}
    } catch {
      setOutputSupported(false);
    }
  }, []);

  const handleAddTrack = useCallback(() => {
    setTracks((prev) => [...prev, createDefaultTrack(prev.length)]);
  }, []);

  const handleDeleteTrack = useCallback((id: string) => {
    setTracks((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((t) => t.id !== id);
    });
    setClips((prev) => prev.filter((c) => c.trackId !== id));
    setSelectedTrackId((cur) => {
      if (cur !== id) return cur;
      return tracks.find((t) => t.id !== id)?.id || null;
    });
  }, [tracks]);

  const handleUpdateTrack = useCallback((id: string, updates: Partial<Track>) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const handleArmTrack = useCallback((id: string) => {
    setTracks((prev) =>
      prev.map((t) => ({
        ...t,
        armed: t.id === id ? !t.armed : false,
      }))
    );
  }, []);

  const handleUpdateClip = useCallback((id: string, updates: Partial<AudioClip>) => {
    setClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const handleDeleteClip = useCallback((id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleToggleRecord = useCallback(() => {
    if (engine.state.isRecording) {
      engine.stopRecording();
      setRecordingTrackId(null);
    } else {
      const armedTrack = tracks.find((t) => t.armed);
      if (!armedTrack) {
        alert('Pilih track terlebih dahulu (klik tombol R pada track)');
        return;
      }
      engine.initAudioContext();
      setRecordingTrackId(armedTrack.id);
      const micId = selectedMicId === 'default' ? null : selectedMicId;
      engine.startRecording(armedTrack.id, micId);
      setTimeout(refreshDevices, 800);
    }
  }, [engine, tracks, selectedMicId, refreshDevices]);

  const handleMicChange = useCallback(async (deviceId: string) => {
    setSelectedMicId(deviceId);
  }, []);

  const handleOutputChange = useCallback(async (deviceId: string) => {
    setSelectedOutputId(deviceId);
    if (deviceId === 'default') {
      const ok = await engine.setOutputDevice(null);
      if (!ok && outputSupported) {
        alert('Output device tidak didukung oleh browser ini (coba gunakan Chrome / Edge terbaru).');
      }
    } else {
      const ok = await engine.setOutputDevice(deviceId);
      if (!ok) {
        alert('Browser Anda tidak mendukung perpindahan output audio per-aplikasi.\nOutput akan menggunakan sistem default.\n(Gunakan Chrome / Edge versi terbaru untuk fitur ini.)');
      }
    }
  }, [engine, outputSupported]);

  const handleRefreshDevices = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {}
    await refreshDevices();
  }, [refreshDevices]);

  const handlePlay = useCallback(() => {
    engine.initAudioContext();
    engine.togglePlay();
  }, [engine]);

  const handleStop = useCallback(() => {
    if (engine.state.isRecording) {
      engine.stopRecording();
      setRecordingTrackId(null);
    }
    engine.stopPlayback();
  }, [engine]);

  const handleBpmChange = useCallback((bpm: number) => {
    engine.setState((s) => ({ ...s, bpm: Math.max(40, Math.min(240, bpm || 120)) }));
  }, [engine]);

  const handleImportClick = useCallback(() => {
    importFileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    engine.initAudioContext();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const targetTrack = selectedTrackId || tracks[0]?.id;
      if (targetTrack) {
        const startTime = engine.state.currentTime + i * 0.1;
        await engine.importAudioFile(file, targetTrack, startTime);
      }
    }
    e.target.value = '';
  }, [engine, selectedTrackId, tracks]);

  const handleImportToTrack = useCallback((trackId: string, time: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      engine.initAudioContext();
      await engine.importAudioFile(file, trackId, time);
    };
    input.click();
  }, [engine]);

  const handleExport = useCallback(() => {
    const maxClipEnd = clips.reduce(
      (max, c) => Math.max(max, c.startTime + c.duration),
      0
    );
    if (maxClipEnd === 0) {
      alert('Tidak ada audio untuk diekspor. Rekam atau import audio terlebih dahulu.');
      return;
    }
    engine.exportMixdown(maxClipEnd + 2);
  }, [clips, engine]);

  const handleZoomHIn = useCallback(() => {
    setPixelsPerSecond((prev) => Math.min(MAX_PIXELS_PER_SECOND, prev * 1.25));
  }, []);

  const handleZoomHOut = useCallback(() => {
    setPixelsPerSecond((prev) => Math.max(MIN_PIXELS_PER_SECOND, prev / 1.25));
  }, []);

  const handleZoomHReset = useCallback(() => {
    setPixelsPerSecond(DEFAULT_PIXELS_PER_SECOND);
  }, []);

  const handleZoomHSet = useCallback((v: number) => {
    setPixelsPerSecond(Math.max(MIN_PIXELS_PER_SECOND, Math.min(MAX_PIXELS_PER_SECOND, v)));
  }, []);

  const handleZoomVIn = useCallback(() => {
    setTrackHeight((prev) => Math.min(MAX_TRACK_HEIGHT, Math.round(prev * 1.2)));
  }, []);

  const handleZoomVOut = useCallback(() => {
    setTrackHeight((prev) => Math.max(MIN_TRACK_HEIGHT, Math.round(prev / 1.2)));
  }, []);

  const handleZoomVReset = useCallback(() => {
    setTrackHeight(DEFAULT_TRACK_HEIGHT);
  }, []);

  const handleZoomVSet = useCallback((v: number) => {
    setTrackHeight(Math.max(MIN_TRACK_HEIGHT, Math.min(MAX_TRACK_HEIGHT, Math.round(v))));
  }, []);

  const handleTogglePlugin = useCallback((trackId: string, type: PluginType) => {
    engine.togglePlugin(trackId, type);
  }, [engine]);

  const handleClearPlugins = useCallback((trackId: string) => {
    engine.clearPlugins(trackId);
  }, [engine]);

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) || null;
  const activePluginsOnSelected = selectedTrack?.plugins || [];

  return (
    <div className="h-screen w-screen flex flex-col bg-studio-bg text-white">
      <TransportBar
        state={engine.state}
        isRecording={engine.state.isRecording}
        onPlay={handlePlay}
        onStop={handleStop}
        onRecord={handleToggleRecord}
        onBpmChange={handleBpmChange}
        onExport={handleExport}
        onImportClick={handleImportClick}
        masterVolume={engine.masterVolume}
        onMasterVolumeChange={engine.setMasterVolume}
        masterMeter={engine.masterMeter}
        pixelsPerSecond={pixelsPerSecond}
        onZoomHIn={handleZoomHIn}
        onZoomHOut={handleZoomHOut}
        onZoomHReset={handleZoomHReset}
        onZoomHSet={handleZoomHSet}
        trackHeight={trackHeight}
        onZoomVIn={handleZoomVIn}
        onZoomVOut={handleZoomVOut}
        onZoomVReset={handleZoomVReset}
        onZoomVSet={handleZoomVSet}
        inputDevices={inputDevices}
        selectedMicId={selectedMicId}
        onMicChange={handleMicChange}
        outputDevices={outputDevices}
        selectedOutputId={selectedOutputId}
        onOutputChange={handleOutputChange}
        onRefreshDevices={handleRefreshDevices}
        outputSupported={outputSupported}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-studio-panel border-r border-studio-border flex flex-col shrink-0">
          <div className="h-12 border-b border-studio-border flex items-center px-3 justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🎛️</span>
              <span className="text-sm font-bold text-studio-accent">PLUGINS</span>
            </div>
            <div className="flex items-center gap-1">
              {selectedTrack && activePluginsOnSelected.length > 0 && (
                <button
                  onClick={() => handleClearPlugins(selectedTrack.id)}
                  className="px-2 h-6 text-[10px] rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/40 hover:border-red-500 transition-all shrink-0"
                  title="Bersihkan semua plugin pada track ini"
                >
                  Bersihkan
                </button>
              )}
            </div>
          </div>

          <div className="px-3 py-2 border-b border-studio-border bg-studio-accent/5 shrink-0">
            {selectedTrack ? (
              <div className="flex items-center gap-2">
                <div
                  className="rounded-full w-3 h-3 shrink-0"
                  style={{ backgroundColor: selectedTrack.color }}
                />
                <div className="min-w-0">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Target Track</div>
                  <div className="text-xs font-semibold text-white truncate">{selectedTrack.name}</div>
                </div>
                {activePluginsOnSelected.length > 0 && (
                  <div className="ml-auto text-[10px] bg-studio-accent/30 text-studio-accent px-2 py-0.5 rounded-full font-bold shrink-0">
                    {activePluginsOnSelected.length} Aktif
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic">Pilih track terlebih dahulu</div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
            {!selectedTrack ? (
              <div className="text-xs text-gray-500 text-center py-8 px-2">
                Klik salah satu track di panel TRACKS untuk menerapkan plugin efek.
              </div>
            ) : (
              PLUGIN_CATEGORIES.map((category) => {
                const pluginsInCat = Object.values(PLUGIN_PRESETS).filter((p) => p.category === category);
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center gap-1 px-1 pt-1 pb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {category}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-studio-border to-transparent" />
                    </div>
                    <div className="space-y-1">
                      {pluginsInCat.map((preset) => {
                        const isActive = activePluginsOnSelected.includes(preset.type);
                        return (
                          <button
                            key={preset.type}
                            onClick={() => handleTogglePlugin(selectedTrack.id, preset.type)}
                            title={preset.description}
                            className={`w-full text-left px-2 py-1.5 rounded border transition-all flex items-start gap-2 group ${
                              isActive
                                ? 'bg-studio-accent/20 border-studio-accent shadow-md shadow-purple-500/10'
                                : 'bg-studio-bg border-studio-border hover:border-studio-accent/60 hover:bg-studio-accent/5'
                            }`}
                          >
                            <span className="text-base leading-none shrink-0 mt-0.5">{preset.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>
                                {preset.name}
                                {isActive && <span className="ml-1.5 text-[9px] text-studio-accent">● AKTIF</span>}
                              </div>
                              <div className="text-[10px] text-gray-500 leading-tight line-clamp-2 group-hover:text-gray-400">
                                {preset.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-studio-border p-3 shrink-0">
            <div className="text-xs text-gray-400 mb-2 font-semibold">SHORTCUTS</div>
            <div className="space-y-1 text-[10px] text-gray-500 font-mono">
              <div><span className="text-gray-300">Space</span> = Play/Pause</div>
              <div><span className="text-gray-300">R</span> = Record</div>
              <div><span className="text-gray-300">S</span> = Stop</div>
              <div><span className="text-gray-300">Double-click</span> timeline = Import</div>
            </div>
            <div className="mt-3 p-2 rounded bg-studio-bg border border-studio-border text-[10px] text-gray-400 leading-snug">
              <div className="font-bold text-studio-accent mb-1">💡 Tips Plugin</div>
              Plugin diterapkan <span className="text-white">per-track</span>. Pilih track, klik efek untuk nyalakan/matikan. Efek bekerja saat playback & export WAV.
            </div>
            <button
              onClick={() => setShowHelp(true)}
              className="mt-3 w-full text-xs text-studio-accent hover:text-purple-400 py-1 border border-studio-accent/30 rounded hover:bg-studio-accent/10 transition-all"
            >
              Tunjukkan Panduan
            </button>
          </div>
        </div>

        <TrackList
          tracks={tracks}
          selectedTrackId={selectedTrackId}
          onSelectTrack={setSelectedTrackId}
          onUpdateTrack={handleUpdateTrack}
          onAddTrack={handleAddTrack}
          onDeleteTrack={handleDeleteTrack}
          meterLevels={engine.meterLevels}
          onArmTrack={handleArmTrack}
          isRecording={engine.state.isRecording}
          recordingTrackId={recordingTrackId}
          trackHeight={trackHeight}
          onExportTrack={engine.exportTrack}
        />

        <Timeline
          tracks={tracks}
          clips={clips}
          currentTime={engine.state.currentTime}
          bpm={engine.state.bpm}
          pixelsPerSecond={pixelsPerSecond}
          trackHeight={trackHeight}
          onSeek={engine.seekTo}
          onUpdateClip={handleUpdateClip}
          onDeleteClip={handleDeleteClip}
          onImportToTrack={handleImportToTrack}
          isPlaying={engine.state.isPlaying}
          onZoomHSet={handleZoomHSet}
          onZoomVSet={handleZoomVSet}
        />
      </div>

      <input
        ref={importFileInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={handleImportFile}
      />

      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}

      <KeyboardShortcuts
        onPlay={handlePlay}
        onStop={handleStop}
        onRecord={handleToggleRecord}
      />
    </div>
  );
}

const KeyboardShortcuts: React.FC<{
  onPlay: () => void;
  onStop: () => void;
  onRecord: () => void;
}> = ({ onPlay, onStop, onRecord }) => {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        onPlay();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        onStop();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onRecord();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onPlay, onStop, onRecord]);
  return null;
};

const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-studio-panel border border-studio-border rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-studio-accent/30 to-pink-500/20 border-b border-studio-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎵</div>
            <div>
              <h2 className="text-xl font-bold text-white">Selamat datang di Mouza Studio</h2>
              <p className="text-sm text-gray-400">Studio musik digital di browser Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded bg-studio-bg hover:bg-studio-danger flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <Section title="🎙️ Cara Merekam Suara">
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
              <li>Klik tombol <span className="text-studio-danger font-bold">R</span> pada track yang ingin dijadikan tempat rekaman</li>
              <li>Klik tombol Record (lingkaran merah) di toolbar atas</li>
              <li>Izin akses mikrofin jika diminta</li>
              <li>Rekam suara/instrumen Anda</li>
              <li>Klik Stop untuk mengakhiri. Rekaman akan otomatis muncul di timeline.</li>
            </ol>
          </Section>

          <Section title="🎛️ Menggunakan Plugin Efek (BARU!)">
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              <li>Panel kiri adalah <span className="text-studio-accent font-bold">PLUGINS</span> (menggantikan Library yang lama).</li>
              <li><span className="font-bold text-white">Pilih track</span> di panel TRACKS dengan mengkliknya</li>
              <li>Klik salah satu plugin efek di panel kiri untuk <span className="font-bold text-white">menyalakan/mematikan</span> efek pada track tersebut</li>
              <li><span className="font-bold">Vocal</span>: Clarity / Warm / Air</li>
              <li><span className="font-bold">Guitar</span>: Clean / Distortion / Akustik</li>
              <li><span className="font-bold">Bass</span>: Boost / Tight</li>
              <li><span className="font-bold">Drum</span>: Kick / Snare / Drum Bus</li>
              <li><span className="font-bold">Keys & Space</span>: Piano Bright, Reverb Room/Hall, Delay Echo</li>
              <li>Gunakan <span className="text-studio-accent font-bold">Master Loudness</span> di track akhir untuk loudness master.</li>
              <li>Efek akan diterapkan saat <span className="font-bold">playback</span> dan juga saat <span className="font-bold">Export WAV</span> (baik per-track maupun mixdown).</li>
            </ul>
          </Section>

          <Section title="📂 Import Audio File">
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              <li>Klik tombol <span className="text-studio-accent font-bold">Import</span> di toolbar untuk menambahkan ke track yang dipilih</li>
              <li>Atau <span className="font-bold">double-click</span> pada area timeline di track yang diinginkan</li>
              <li>Format yang didukung: MP3, WAV, OGG, WebM, M4A, dll.</li>
            </ul>
          </Section>

          <Section title="🎚️ Mengatur Track">
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
              <li><span className="font-bold">M</span> (Mute): Membisukan track</li>
              <li><span className="font-bold text-yellow-500">S</span> (Solo): Hanya memainkan track ini</li>
              <li><span className="font-bold text-red-500">R</span> (Record): Arm track untuk perekaman</li>
              <li>Geser slider Volume untuk mengatur volume tiap track</li>
              <li><span className="font-bold text-green-500">⬇</span> = Export track tersebut sebagai WAV (stem export dengan efek yang sudah aktif)</li>
              <li>Drag clip di timeline untuk memindahkan posisi</li>
              <li>Klik clip lalu tombol ✕ untuk menghapus</li>
            </ul>
          </Section>

          <Section title="⌨️ Shortcut Keyboard">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Shortcut k="Space" d="Play / Pause" />
              <Shortcut k="R" d="Mulai / Berhenti Rekam" />
              <Shortcut k="S" d="Stop" />
              <Shortcut k="Klik ruler" d="Pindah posisi playhead" />
            </div>
          </Section>

          <Section title="💾 Export Hasil">
            <p className="text-sm text-gray-300">
              Klik tombol <span className="text-studio-accent font-bold">Export WAV</span> di toolbar untuk mendownload hasil campuran semua track (sudah termasuk plugin). Atau klik tombol ⬇ pada setiap track untuk export stem dengan efeknya.
            </p>
          </Section>
        </div>
        <div className="px-6 py-4 border-t border-studio-border bg-studio-bg flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-studio-accent hover:bg-studio-accent-hover rounded-lg text-sm font-semibold shadow-lg shadow-purple-500/30 transition-all"
          >
            Mulai Buat Musik! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
    {children}
  </div>
);

const Shortcut: React.FC<{ k: string; d: string }> = ({ k, d }) => (
  <div className="flex items-center gap-2">
    <kbd className="px-2 py-0.5 bg-studio-bg border border-studio-border rounded text-xs font-mono text-studio-accent">{k}</kbd>
    <span className="text-gray-400 text-xs">{d}</span>
  </div>
);

export default App;
