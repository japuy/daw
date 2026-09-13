import React from 'react';
import { Track } from '../types';

interface Props {
  tracks: Track[];
  selectedTrackId: string | null;
  onSelectTrack: (id: string) => void;
  onUpdateTrack: (id: string, updates: Partial<Track>) => void;
  onAddTrack: () => void;
  onDeleteTrack: (id: string) => void;
  meterLevels: Record<string, number>;
  onArmTrack: (id: string) => void;
  isRecording: boolean;
  recordingTrackId: string | null;
  trackHeight: number;
  onExportTrack: (id: string) => void;
}

export const TrackList: React.FC<Props> = ({
  tracks,
  selectedTrackId,
  onSelectTrack,
  onUpdateTrack,
  onAddTrack,
  onDeleteTrack,
  meterLevels,
  onArmTrack,
  isRecording,
  recordingTrackId,
  trackHeight,
  onExportTrack,
}) => {
  const isCompact = trackHeight < 80;
  const isTiny = trackHeight < 62;

  return (
    <div className="w-64 bg-studio-panel border-r border-studio-border flex flex-col shrink-0">
      <div className="h-12 border-b border-studio-border flex items-center px-3 justify-between shrink-0">
        <span className="text-sm font-semibold text-gray-300">TRACKS</span>
        <button
          onClick={onAddTrack}
          className="w-7 h-7 rounded bg-studio-accent hover:bg-studio-accent-hover flex items-center justify-center transition-all text-white shadow-md shadow-purple-500/30"
          title="+ Tambah Track"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tracks.map((track) => {
          const isSelected = selectedTrackId === track.id;
          const isArmed = track.armed;
          const meter = meterLevels[track.id] || 0;
          const isThisRecording = isRecording && recordingTrackId === track.id;

          return (
            <div
              key={track.id}
              onClick={() => onSelectTrack(track.id)}
              className={`relative px-2.5 overflow-hidden flex flex-col cursor-pointer transition-all ${
                isSelected ? 'bg-studio-accent/10' : 'hover:bg-studio-bg/50'
              } ${isArmed ? 'border-l-4 border-b border-studio-border' : 'border-b border-studio-border'}`}
              style={{
                height: trackHeight,
                borderLeftColor: isArmed ? track.color : undefined,
                paddingTop: isTiny ? 4 : 6,
                paddingBottom: isTiny ? 4 : 6,
                gap: isCompact ? 2 : 4,
              }}
            >
              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className="rounded-full mt-0.5 shrink-0"
                  style={{
                    backgroundColor: track.color,
                    width: isTiny ? 8 : 10,
                    height: isTiny ? 8 : 10,
                  }}
                />
                <input
                  type="text"
                  value={track.name}
                  onChange={(e) => onUpdateTrack(track.id, { name: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent focus:outline-none w-full truncate"
                  style={{
                    fontSize: isTiny ? 11 : isCompact ? 12 : 13,
                    fontWeight: 500,
                    lineHeight: 1.2,
                  }}
                />
                {!isTiny && track.plugins && track.plugins.length > 0 && (
                  <span
                    className="shrink-0 rounded-full bg-gradient-to-r from-studio-accent to-pink-500 text-white text-[9px] font-bold px-1.5 py-0 leading-none shadow"
                    title={`${track.plugins.length} efek plugin aktif (lihat panel PLUGINS)`}
                  >
                    FX {track.plugins.length}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExportTrack(track.id);
                  }}
                  className="bg-studio-bg hover:bg-emerald-600 text-emerald-400 hover:text-white rounded flex items-center justify-center shrink-0 transition-all border border-studio-border hover:border-emerald-500"
                  style={{ width: isCompact ? 20 : 22, height: isCompact ? 20 : 22 }}
                  title={`💾 Save / Export track "${track.name}" ke WAV`}
                >
                  <svg width={isCompact ? 10 : 11} height={isCompact ? 10 : 11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Hapus track "${track.name}"? Semua clip di track ini akan terhapus.`)) {
                      onDeleteTrack(track.id);
                    }
                  }}
                  className="bg-studio-bg hover:bg-studio-danger text-gray-400 hover:text-white rounded flex items-center justify-center shrink-0 transition-all border border-studio-border hover:border-studio-danger"
                  style={{ width: isCompact ? 20 : 22, height: isCompact ? 20 : 22, fontSize: isCompact ? 10 : 11 }}
                  title="Hapus Track"
                >
                  🗑
                </button>
              </div>

              {!isTiny && (
                <>
                  <div className="flex items-center gap-1 shrink-0">
                    {(['M', 'S', 'R'] as const).map((k) => {
                      const key = k.toLowerCase() as 'muted' | 'solo' | 'armed';
                      const active = key === 'muted' ? track.muted : key === 'solo' ? track.solo : isArmed && k === 'R';
                      const extra = k === 'R' && isThisRecording ? 'animate-pulse' : '';
                      const activeBg =
                        k === 'M' ? 'bg-studio-danger text-white' :
                        k === 'S' ? 'bg-yellow-500 text-black' :
                        'bg-studio-danger text-white';
                      const handler = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (k === 'M') onUpdateTrack(track.id, { muted: !track.muted });
                        else if (k === 'S') onUpdateTrack(track.id, { solo: !track.solo });
                        else onArmTrack(track.id);
                      };
                      return (
                        <button
                          key={k}
                          onClick={handler}
                          className={`rounded font-bold transition-all shrink-0 ${
                            active
                              ? `${activeBg} ${extra}`
                              : 'bg-studio-bg text-gray-400 hover:text-white border border-studio-border'
                          }`}
                          style={{
                            width: isCompact ? 22 : 26,
                            height: isCompact ? 20 : 24,
                            fontSize: isCompact ? 10 : 11,
                          }}
                          title={k === 'M' ? 'Mute' : k === 'S' ? 'Solo' : 'Arm for Recording'}
                        >
                          {k}
                        </button>
                      );
                    })}
                    <div
                      className="ml-auto rounded overflow-hidden border border-studio-border bg-black/40 shrink-0"
                      style={{ width: isCompact ? 48 : 60, height: isCompact ? 10 : 12 }}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                        style={{ width: `${Math.min(100, meter * 400)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <svg width={isCompact ? 10 : 12} height={isCompact ? 10 : 12} viewBox="0 0 24 24" fill="currentColor" className="text-gray-500 shrink-0">
                      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" />
                    </svg>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={track.volume}
                      onChange={(e) => onUpdateTrack(track.id, { volume: Number(e.target.value) })}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1"
                    />
                    <span
                      className="font-mono text-right shrink-0 text-gray-500 tabular-nums"
                      style={{ fontSize: isCompact ? 9 : 10, width: isCompact ? 22 : 26 }}
                    >
                      {Math.round(track.volume * 100)}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
