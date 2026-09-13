export interface AudioClip {
  id: string;
  name: string;
  trackId: string;
  startTime: number;
  duration: number;
  audioBuffer: AudioBuffer | null;
  blobUrl?: string;
  waveformData?: number[];
  isRecording?: boolean;
  color?: string;
  liveWaveform?: number[];
}

export type PluginType =
  | 'vocal-clear'
  | 'vocal-warm'
  | 'vocal-air'
  | 'guitar-clean'
  | 'guitar-distortion'
  | 'guitar-acoustic'
  | 'bass-boost'
  | 'bass-tight'
  | 'drum-kick'
  | 'drum-snare'
  | 'drum-master'
  | 'piano-bright'
  | 'master-loudness'
  | 'reverb-room'
  | 'reverb-hall'
  | 'delay-echo';

export interface PluginPreset {
  type: PluginType;
  name: string;
  icon: string;
  category: 'Vocal' | 'Guitar' | 'Bass' | 'Drum' | 'Keys' | 'Master' | 'Space';
  description: string;
  eq?: {
    lowShelf?: { freq: number; gain: number; Q?: number };
    highShelf?: { freq: number; gain: number; Q?: number };
    peaking?: { freq: number; gain: number; Q: number }[];
    lowCut?: number;
    highCut?: number;
  };
  compressor?: {
    threshold: number;
    knee: number;
    ratio: number;
    attack: number;
    release: number;
    makeupGain?: number;
  };
  reverb?: {
    seconds: number;
    decay: number;
    wet: number;
  };
  delay?: {
    time: number;
    feedback: number;
    wet: number;
  };
  distortion?: {
    amount: number;
    oversample?: OverSampleType;
  };
  gain?: number;
}

export interface Track {
  id: string;
  name: string;
  color: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  armed: boolean;
  pan: number;
  plugins: PluginType[];
}

export interface AudioEngineState {
  isPlaying: boolean;
  isRecording: boolean;
  isPaused: boolean;
  currentTime: number;
  bpm: number;
  sampleRate: number;
}

export type TransportAction = 'play' | 'pause' | 'stop' | 'record' | 'loop';
