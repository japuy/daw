import { useCallback, useRef, useState, useEffect } from 'react';
import { AudioClip, Track, AudioEngineState, PluginType } from './types';
import { createAudioClip, computeWaveformData, generateId } from './utils';
import { buildPluginChain, PluginGraphNodes } from './plugins';

interface TrackNodes {
  pluginChain: PluginGraphNodes;
  gain: GainNode;
  pan: StereoPannerNode;
  analyser: AnalyserNode;
  lastPluginSnapshot: string;
}

export const useAudioEngine = (
  tracks: Track[],
  clips: AudioClip[],
  setClips: React.Dispatch<React.SetStateAction<AudioClip[]>>,
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>
) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const trackGainNodesRef = useRef<Map<string, TrackNodes>>(new Map());
  const sourceNodesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const rafIdRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTrackIdRef = useRef<string | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingClipIdRef = useRef<string | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const liveWaveformRef = useRef<number[]>([]);

  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    isRecording: false,
    isPaused: false,
    currentTime: 0,
    bpm: 120,
    sampleRate: 44100,
  });

  const [masterVolume, setMasterVolume] = useState(0.8);
  const [meterLevels, setMeterLevels] = useState<Record<string, number>>({});
  const [masterMeter, setMasterMeter] = useState(0);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 44100 });
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.gain.value = masterVolume;
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      masterGainRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, [masterVolume]);

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVolume;
    }
  }, [masterVolume]);

  const destroyTrackNodes = useCallback((id: string) => {
    const nodes = trackGainNodesRef.current.get(id);
    if (!nodes) return;
    try { nodes.pluginChain.inputs.forEach((n) => n.disconnect()); } catch {}
    try { nodes.pluginChain.analyser.disconnect(); } catch {}
    try { nodes.pluginChain.output.disconnect(); } catch {}
    try { nodes.gain.disconnect(); } catch {}
    try { nodes.pan.disconnect(); } catch {}
    try { nodes.analyser.disconnect(); } catch {}
    trackGainNodesRef.current.delete(id);
  }, []);

  const ensureTrackNodes = useCallback((track: Track) => {
    const ctx = initAudioContext();
    const existing = trackGainNodesRef.current.get(track.id);
    const snapshot = JSON.stringify(track.plugins || []);

    if (existing && existing.lastPluginSnapshot === snapshot) {
      existing.gain.gain.value = track.muted ? 0 : track.volume;
      existing.pan.pan.value = track.pan;
      return existing;
    }

    if (existing) destroyTrackNodes(track.id);

    const pan = ctx.createStereoPanner();
    pan.pan.value = track.pan;
    const afterPanGain = ctx.createGain();
    afterPanGain.gain.value = track.muted ? 0 : track.volume;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    const pluginChain = buildPluginChain(
      ctx,
      track.plugins || [],
      afterPanGain
    );
    afterPanGain.connect(pan);
    pan.connect(analyser);
    analyser.connect(masterGainRef.current!);

    const nodes: TrackNodes = {
      pluginChain,
      gain: afterPanGain,
      pan,
      analyser,
      lastPluginSnapshot: snapshot,
    };
    trackGainNodesRef.current.set(track.id, nodes);
    return nodes;
  }, [initAudioContext, destroyTrackNodes]);

  useEffect(() => {
    tracks.forEach((track) => {
      ensureTrackNodes(track);
    });

    const existingIds = new Set(tracks.map((t) => t.id));
    Array.from(trackGainNodesRef.current.keys()).forEach((id) => {
      if (!existingIds.has(id)) destroyTrackNodes(id);
    });

    const soloTracks = tracks.filter((t) => t.solo);
    if (soloTracks.length > 0) {
      tracks.forEach((track) => {
        const nodes = trackGainNodesRef.current.get(track.id);
        if (nodes) {
          nodes.gain.gain.value = track.solo && !track.muted ? track.volume : 0;
        }
      });
    }
  }, [tracks, ensureTrackNodes, destroyTrackNodes]);

  const stopAllSources = useCallback(() => {
    sourceNodesRef.current.forEach((src) => {
      try { src.stop(); } catch {}
    });
    sourceNodesRef.current.clear();
  }, []);

  const scheduleClipPlayback = useCallback((clip: AudioClip, ctxStartTime: number, offset: number) => {
    if (!clip.audioBuffer || !audioContextRef.current) return;
    const track = tracks.find((t) => t.id === clip.trackId);
    if (!track) return;

    const nodes = ensureTrackNodes(track);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = clip.audioBuffer;
    source.connect(nodes.pluginChain.inputs[0]);

    let clipStart = clip.startTime;
    let clipOffset = 0;
    if (clipStart < offset) {
      clipOffset = offset - clipStart;
      clipStart = offset;
    }
    if (clipOffset >= clip.duration) return;

    const when = ctxStartTime + (clipStart - offset);
    try {
      source.start(Math.max(0, when), Math.max(0, clipOffset));
      sourceNodesRef.current.set(clip.id, source);
    } catch (e) {
      console.error('Error scheduling clip:', e);
    }
  }, [tracks, ensureTrackNodes]);

  const startPlayback = useCallback((fromTime?: number) => {
    const ctx = initAudioContext();
    stopAllSources();
    const offset = fromTime ?? pausedAtRef.current;
    const ctxStartTime = ctx.currentTime + 0.05;
    startTimeRef.current = ctxStartTime - offset;

    clips.forEach((clip) => {
      scheduleClipPlayback(clip, ctxStartTime, offset);
    });

    setState((s) => ({ ...s, isPlaying: true, isPaused: false, currentTime: offset }));

    const tick = () => {
      if (!audioContextRef.current) return;
      const currentTime = Math.max(0, audioContextRef.current.currentTime - startTimeRef.current);
      setState((s) => ({ ...s, currentTime }));

      if (recordingClipIdRef.current) {
        const recStartTime = recordingStartTimeRef.current;
        const liveDuration = Math.max(0.05, currentTime - recStartTime);

        let rmsLevel = 0;
        if (micAnalyserRef.current) {
          const arr = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
          micAnalyserRef.current.getByteTimeDomainData(arr);
          let sum = 0;
          for (let i = 0; i < arr.length; i++) {
            const v = (arr[i] - 128) / 128;
            sum += v * v;
          }
          rmsLevel = Math.sqrt(sum / arr.length);
        }
        liveWaveformRef.current.push(rmsLevel);

        let liveWaveformOut = liveWaveformRef.current;
        const MAX_POINTS = 120;
        if (liveWaveformOut.length > MAX_POINTS) {
          const step = liveWaveformOut.length / MAX_POINTS;
          const resampled: number[] = [];
          for (let i = 0; i < MAX_POINTS; i++) {
            const start = Math.floor(i * step);
            const end = Math.max(start + 1, Math.floor((i + 1) * step));
            let max = 0;
            for (let j = start; j < end && j < liveWaveformOut.length; j++) {
              if (liveWaveformOut[j] > max) max = liveWaveformOut[j];
            }
            resampled.push(max);
          }
          liveWaveformOut = resampled;
        }

        const liveClipId = recordingClipIdRef.current;
        setClips((prev) =>
          prev.map((c) =>
            c.id === liveClipId
              ? { ...c, duration: liveDuration, liveWaveform: liveWaveformOut }
              : c
          )
        );
      }

      const levels: Record<string, number> = {};
      trackGainNodesRef.current.forEach((nodes, id) => {
        const arr = new Uint8Array(nodes.analyser.frequencyBinCount);
        nodes.analyser.getByteTimeDomainData(arr);
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
          const v = (arr[i] - 128) / 128;
          sum += v * v;
        }
        levels[id] = Math.sqrt(sum / arr.length);
      });
      setMeterLevels(levels);

      if (analyserRef.current) {
        const arr = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(arr);
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
          const v = (arr[i] - 128) / 128;
          sum += v * v;
        }
        setMasterMeter(Math.sqrt(sum / arr.length));
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }, [initAudioContext, stopAllSources, clips, scheduleClipPlayback]);

  const pausePlayback = useCallback(() => {
    stopAllSources();
    cancelAnimationFrame(rafIdRef.current);
    pausedAtRef.current = state.currentTime;
    setState((s) => ({ ...s, isPlaying: false, isPaused: true }));
  }, [stopAllSources, state.currentTime]);

  const stopPlayback = useCallback(() => {
    stopAllSources();
    cancelAnimationFrame(rafIdRef.current);
    pausedAtRef.current = 0;
    setState((s) => ({ ...s, isPlaying: false, isPaused: false, currentTime: 0 }));
    setMeterLevels({});
    setMasterMeter(0);
  }, [stopAllSources]);

  const seekTo = useCallback((time: number) => {
    const wasPlaying = state.isPlaying;
    if (wasPlaying) {
      stopAllSources();
      cancelAnimationFrame(rafIdRef.current);
    }
    pausedAtRef.current = Math.max(0, time);
    setState((s) => ({ ...s, currentTime: Math.max(0, time) }));
    if (wasPlaying) {
      startPlayback(Math.max(0, time));
    }
  }, [state.isPlaying, stopAllSources, startPlayback]);

  const startRecording = useCallback(async (trackId: string, micDeviceId?: string | null) => {
    try {
      const audioConstraint: MediaTrackConstraints = micDeviceId
        ? { deviceId: { exact: micDeviceId }, echoCancellation: true, noiseSuppression: true }
        : { echoCancellation: true, noiseSuppression: true };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint });
      recordingStreamRef.current = stream;
      liveWaveformRef.current = [];

      const ctx2 = initAudioContext();
      if (micSourceRef.current) {
        try { micSourceRef.current.disconnect(); } catch {}
        micSourceRef.current = null;
      }
      micSourceRef.current = ctx2.createMediaStreamSource(stream);
      const an = ctx2.createAnalyser();
      an.fftSize = 512;
      micAnalyserRef.current = an;
      micSourceRef.current.connect(an);

      let mime = '';
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm;codecs=pcm',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      for (const m of candidates) {
        try {
          if (MediaRecorder.isTypeSupported(m)) { mime = m; break; }
        } catch {}
      }
      if (!mime) mime = 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 256000 });
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];
      recordingTrackIdRef.current = trackId;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordingChunksRef.current.push(e.data);
      };

      recorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
      };

      recorder.onstop = async () => {
        const liveClipId = recordingClipIdRef.current;
        const trackIdFinal = recordingTrackIdRef.current;
        const startTimeFinal = recordingStartTimeRef.current;
        const chunks = [...recordingChunksRef.current];
        const finalMime = recorder.mimeType || mime;

        try {
          if (!trackIdFinal) throw new Error('Recording track ID tidak valid');
          if (chunks.length === 0) throw new Error('Tidak ada data rekaman (coba rekam lebih lama)');

          const ctx = initAudioContext();
          const blob = new Blob(chunks, { type: finalMime });
          const arrayBuffer = await blob.arrayBuffer();
          if (!arrayBuffer || arrayBuffer.byteLength < 100) throw new Error('Data rekaman terlalu kecil');

          let audioBuffer: AudioBuffer | null = null;
          try {
            audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
          } catch (decodeErr) {
            console.warn('decodeAudioData gagal untuk mime', finalMime, '- coba fallback...', decodeErr);
            try {
              audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            } catch (decodeErr2) {
              throw new Error('Format rekaman tidak bisa di-decode (coba browser Chrome).');
            }
          }
          if (!audioBuffer || audioBuffer.duration <= 0) throw new Error('Audio buffer kosong');

          const waveformData = computeWaveformData(audioBuffer);
          const blobUrl = URL.createObjectURL(blob);

          setClips((prev) => {
            const rest = liveClipId ? prev.filter((c) => c.id !== liveClipId) : prev;
            const newClip = createAudioClip(
              trackIdFinal,
              startTimeFinal,
              audioBuffer,
              blobUrl,
              waveformData
            );
            return [...rest, newClip];
          });
        } catch (err) {
          console.error('Finalisasi rekaman GAGAL:', err);
          alert(`Rekaman gagal diproses: ${(err as Error).message || 'Unknown error'}`);
          if (liveClipId) {
            setClips((prev) => prev.filter((c) => c.id !== liveClipId));
          }
        } finally {
          recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
          recordingStreamRef.current = null;
          mediaRecorderRef.current = null;
          recordingTrackIdRef.current = null;
          recordingClipIdRef.current = null;
          recordingChunksRef.current = [];
          liveWaveformRef.current = [];
          if (micSourceRef.current) {
            try { micSourceRef.current.disconnect(); } catch {}
            micSourceRef.current = null;
          }
          micAnalyserRef.current = null;
        }
      };

      recordingStartTimeRef.current = state.currentTime;
      const tempClipId = generateId() + '-rec';
      recordingClipIdRef.current = tempClipId;
      const track = tracks.find((t) => t.id === trackId);
      setClips((prev) => [
        ...prev,
        {
          id: tempClipId,
          name: '● REC',
          trackId,
          startTime: recordingStartTimeRef.current,
          duration: 0.05,
          audioBuffer: null,
          isRecording: true,
          color: track?.color || '#ef4444',
        } as AudioClip,
      ]);
      recorder.start(50);
      setState((s) => ({ ...s, isRecording: true }));

      if (!state.isPlaying) {
        startPlayback();
      }
    } catch (e) {
      console.error('Recording init failed:', e);
      alert('Tidak bisa mengakses mikrofon. Pastikan izin mikrofon diizinkan.');
      const liveClipId = recordingClipIdRef.current;
      if (liveClipId) {
        setClips((prev) => prev.filter((c) => c.id !== liveClipId));
        recordingClipIdRef.current = null;
      }
      recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
      recordingStreamRef.current = null;
      mediaRecorderRef.current = null;
      recordingTrackIdRef.current = null;
      recordingChunksRef.current = [];
      liveWaveformRef.current = [];
      if (micSourceRef.current) {
        try { micSourceRef.current.disconnect(); } catch {}
        micSourceRef.current = null;
      }
      micAnalyserRef.current = null;
    }
  }, [initAudioContext, setClips, state.currentTime, state.isPlaying, startPlayback, tracks]);

  const stopRecording = useCallback(() => {
    const liveClipId = recordingClipIdRef.current;
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      } else if (mediaRecorderRef.current) {
        console.warn('MediaRecorder sudah inactive — paksa cleanup');
        mediaRecorderRef.current.dispatchEvent(new Event('stop'));
      } else {
        console.warn('stopRecording dipanggil tanpa MediaRecorder aktif — cleanup placeholder');
        recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        recordingTrackIdRef.current = null;
        recordingClipIdRef.current = null;
        recordingChunksRef.current = [];
        liveWaveformRef.current = [];
        if (micSourceRef.current) {
          try { micSourceRef.current.disconnect(); } catch {}
          micSourceRef.current = null;
        }
        micAnalyserRef.current = null;
        if (liveClipId) {
          setClips((prev) => prev.filter((c) => c.id !== liveClipId));
        }
      }
    } catch (err) {
      console.error('stopRecording error:', err);
      alert('Gagal menghentikan rekaman: ' + (err as Error).message);
    }
    setState((s) => ({ ...s, isRecording: false }));
    if (state.isPlaying) {
      pausePlayback();
    }
  }, [state.isPlaying, pausePlayback]);

  const importAudioFile = useCallback(async (file: File, trackId: string, startTime: number) => {
    const ctx = initAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const waveformData = computeWaveformData(audioBuffer);
    const blobUrl = URL.createObjectURL(file);
    const clip = createAudioClip(trackId, startTime, audioBuffer, blobUrl, waveformData);
    clip.name = file.name.replace(/\.[^.]+$/, '');
    setClips((prev) => [...prev, clip]);
  }, [initAudioContext, setClips]);

  const exportMixdown = useCallback(async (duration: number): Promise<void> => {
    const ctx = initAudioContext();
    const sampleRate = ctx.sampleRate;
    const length = Math.ceil(duration * sampleRate);
    const offlineCtx = new OfflineAudioContext(2, length, sampleRate);
    const offlineMaster = offlineCtx.createGain();
    offlineMaster.gain.value = masterVolume;
    offlineMaster.connect(offlineCtx.destination);

    tracks.forEach((track) => {
      if (track.muted) return;
      const hasSolo = tracks.some((t) => t.solo);
      if (hasSolo && !track.solo) return;

      const afterPanGain = offlineCtx.createGain();
      afterPanGain.gain.value = track.volume;
      const pan = offlineCtx.createStereoPanner();
      pan.pan.value = track.pan;
      const pluginChain = buildPluginChain(
        offlineCtx,
        track.plugins || [],
        afterPanGain
      );
      afterPanGain.connect(pan);
      pan.connect(offlineMaster);

      clips
        .filter((c) => c.trackId === track.id && c.audioBuffer)
        .forEach((clip) => {
          const src = offlineCtx.createBufferSource();
          src.buffer = clip.audioBuffer!;
          src.connect(pluginChain.inputs[0]);
          src.start(clip.startTime);
        });
    });

    const renderedBuffer = await offlineCtx.startRendering();
    const wav = audioBufferToWav(renderedBuffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mixdown-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  }, [initAudioContext, tracks, clips, masterVolume]);

  const exportTrack = useCallback(async (trackId: string): Promise<void> => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) {
      alert('Track tidak ditemukan');
      return;
    }
    const trackClips = clips.filter((c) => c.trackId === trackId && c.audioBuffer);
    if (trackClips.length === 0) {
      alert('Track "' + track.name + '" tidak memiliki clip audio untuk diekspor.');
      return;
    }

    const maxEnd = trackClips.reduce((m, c) => Math.max(m, c.startTime + c.duration), 0);
    if (maxEnd === 0) {
      alert('Track ini tidak ada audio yang bisa diekspor.');
      return;
    }

    const ctx = initAudioContext();
    const sampleRate = ctx.sampleRate;
    const totalDuration = maxEnd + 1;
    const length = Math.ceil(totalDuration * sampleRate);
    const offlineCtx = new OfflineAudioContext(2, length, sampleRate);
    const offlineMaster = offlineCtx.createGain();
    offlineMaster.gain.value = track.muted ? 0 : track.volume;
    offlineMaster.connect(offlineCtx.destination);

    const afterPanGain = offlineCtx.createGain();
    afterPanGain.gain.value = 1;
    const pan = offlineCtx.createStereoPanner();
    pan.pan.value = track.pan;
    const pluginChain = buildPluginChain(
      offlineCtx,
      track.plugins || [],
      afterPanGain
    );
    afterPanGain.connect(pan);
    pan.connect(offlineMaster);

    trackClips.forEach((clip) => {
      const src = offlineCtx.createBufferSource();
      src.buffer = clip.audioBuffer!;
      src.connect(pluginChain.inputs[0]);
      src.start(clip.startTime);
    });

    const renderedBuffer = await offlineCtx.startRendering();
    const wav = audioBufferToWav(renderedBuffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = track.name.replace(/[^a-z0-9_\- ]/gi, '_').trim() || `track-${trackId.slice(0, 6)}`;
    a.download = `${safeName}-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  }, [initAudioContext, tracks, clips]);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  }, [state.isPlaying, pausePlayback, startPlayback]);

  const setOutputDevice = useCallback(async (deviceId: string | null): Promise<boolean> => {
    try {
      const ctx = initAudioContext();
      const anyCtx = ctx as unknown as {
        setSinkId?: (id: string) => Promise<void>;
        sinkId?: string;
      };
      if (!deviceId || deviceId === 'default') {
        if (anyCtx.setSinkId) {
          await anyCtx.setSinkId('');
        }
        return true;
      }
      if (typeof anyCtx.setSinkId === 'function') {
        await anyCtx.setSinkId(deviceId);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Gagal mengubah output device:', e);
      return false;
    }
  }, [initAudioContext]);

  const togglePlugin = useCallback((trackId: string, pluginType: PluginType) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const plugins = t.plugins || [];
        const has = plugins.includes(pluginType);
        return {
          ...t,
          plugins: has
            ? plugins.filter((p) => p !== pluginType)
            : [...plugins, pluginType],
        };
      })
    );
  }, [setTracks]);

  const clearPlugins = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, plugins: [] } : t))
    );
  }, [setTracks]);

  return {
    state,
    setState,
    masterVolume,
    setMasterVolume,
    meterLevels,
    masterMeter,
    initAudioContext,
    startPlayback,
    pausePlayback,
    stopPlayback,
    seekTo,
    startRecording,
    stopRecording,
    importAudioFile,
    exportMixdown,
    exportTrack,
    togglePlay,
    setOutputDevice,
    togglePlugin,
    clearPlugins,
  };
};

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const bytesPerSec = sampleRate * blockAlign;
  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const ab = new ArrayBuffer(bufferLength);
  const view = new DataView(ab);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, bytesPerSec, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) channels.push(buffer.getChannelData(i));

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channels[ch][i];
      sample = Math.max(-1, Math.min(1, sample));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return ab;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
