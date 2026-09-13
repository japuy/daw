import { PluginPreset, PluginType } from './types';

export const PLUGIN_PRESETS: Record<PluginType, PluginPreset> = {
  'vocal-clear': {
    type: 'vocal-clear',
    name: 'Vocal Clarity',
    icon: '🎤',
    category: 'Vocal',
    description: 'Potong low-end mud, boost presence & sibilance supaya vokal terdengar jelas dan menonjol di mix.',
    eq: {
      lowCut: 120,
      highShelf: { freq: 8000, gain: 3 },
      peaking: [
        { freq: 300, gain: -3, Q: 1 },
        { freq: 2500, gain: 4, Q: 1.2 },
        { freq: 5000, gain: 2, Q: 1.5 },
      ],
    },
    compressor: {
      threshold: -18,
      knee: 6,
      ratio: 3,
      attack: 0.01,
      release: 0.12,
      makeupGain: 2,
    },
  },
  'vocal-warm': {
    type: 'vocal-warm',
    name: 'Vocal Warm',
    icon: '🔥',
    category: 'Vocal',
    description: 'Berikan kesan hangat & tebal pada vokal dengan boost low-mid dan gentle compression.',
    eq: {
      lowCut: 80,
      highCut: 12000,
      peaking: [
        { freq: 220, gain: 4, Q: 1 },
        { freq: 1800, gain: -2, Q: 1.2 },
      ],
      highShelf: { freq: 6000, gain: -2 },
    },
    compressor: {
      threshold: -16,
      knee: 10,
      ratio: 2.5,
      attack: 0.02,
      release: 0.2,
      makeupGain: 2,
    },
  },
  'vocal-air': {
    type: 'vocal-air',
    name: 'Vocal Air',
    icon: '💨',
    category: 'Vocal',
    description: 'Tambahkan brightness & "air" pada vokal, cocok untuk balada dan pop.',
    eq: {
      lowCut: 150,
      peaking: [{ freq: 1500, gain: 2, Q: 1 }],
      highShelf: { freq: 10000, gain: 6 },
    },
    compressor: {
      threshold: -20,
      knee: 5,
      ratio: 2.2,
      attack: 0.015,
      release: 0.1,
    },
    reverb: { seconds: 2.2, decay: 2.5, wet: 0.18 },
  },

  'guitar-clean': {
    type: 'guitar-clean',
    name: 'Guitar Clean',
    icon: '🎸',
    category: 'Guitar',
    description: 'Gitar bersih dengan mid scoop ringan, cocok untuk arpeggio & chord clean.',
    eq: {
      lowCut: 80,
      highCut: 9000,
      peaking: [
        { freq: 800, gain: -4, Q: 1.2 },
        { freq: 3500, gain: 2, Q: 1 },
      ],
    },
    compressor: {
      threshold: -14,
      knee: 8,
      ratio: 4,
      attack: 0.01,
      release: 0.18,
      makeupGain: 3,
    },
  },
  'guitar-distortion': {
    type: 'guitar-distortion',
    name: 'Guitar Distortion',
    icon: '🤘',
    category: 'Guitar',
    description: 'Efek distorsi overdrive dengan low-end punch dan high cut agar tidak keruh.',
    distortion: { amount: 120, oversample: '4x' },
    eq: {
      lowCut: 100,
      highCut: 7500,
      lowShelf: { freq: 200, gain: 3 },
      peaking: [{ freq: 2200, gain: 4, Q: 1.3 }],
      highShelf: { freq: 5000, gain: -2 },
    },
    gain: 1.1,
  },
  'guitar-acoustic': {
    type: 'guitar-acoustic',
    name: 'Guitar Akustik',
    icon: '🪕',
    category: 'Guitar',
    description: 'Buat gitar akustik bersih, natural dengan kehadiran string dan body yang seimbang.',
    eq: {
      lowCut: 60,
      peaking: [
        { freq: 250, gain: -2, Q: 1 },
        { freq: 800, gain: 2, Q: 1 },
        { freq: 4000, gain: 3, Q: 1.2 },
        { freq: 7500, gain: 2, Q: 1.5 },
      ],
    },
    compressor: {
      threshold: -16,
      knee: 8,
      ratio: 2.8,
      attack: 0.008,
      release: 0.15,
      makeupGain: 2,
    },
    reverb: { seconds: 1.4, decay: 2, wet: 0.14 },
  },

  'bass-boost': {
    type: 'bass-boost',
    name: 'Bass Boost',
    icon: '🔊',
    category: 'Bass',
    description: 'Dorong low-end supaya bass terasa tebal, punchy dan menggelegar.',
    eq: {
      lowCut: 40,
      highCut: 6000,
      lowShelf: { freq: 120, gain: 6 },
      peaking: [{ freq: 800, gain: -3, Q: 1.2 }],
    },
    compressor: {
      threshold: -12,
      knee: 4,
      ratio: 4.5,
      attack: 0.01,
      release: 0.22,
      makeupGain: 2,
    },
  },
  'bass-tight': {
    type: 'bass-tight',
    name: 'Bass Tight',
    icon: '🎯',
    category: 'Bass',
    description: 'Bass yang ketat & cepat, hilangkan boominess, cocok untuk EDM, funk, metal.',
    eq: {
      lowCut: 55,
      lowShelf: { freq: 80, gain: -2 },
      peaking: [
        { freq: 200, gain: -5, Q: 1.4 },
        { freq: 900, gain: 2, Q: 1.2 },
        { freq: 2500, gain: 3, Q: 1.5 },
      ],
    },
    compressor: {
      threshold: -10,
      knee: 3,
      ratio: 6,
      attack: 0.003,
      release: 0.14,
      makeupGain: 2,
    },
  },

  'drum-kick': {
    type: 'drum-kick',
    name: 'Drum Kick',
    icon: '🥁',
    category: 'Drum',
    description: 'Perkuat beban kick drum dengan punch di 60Hz dan click di 2kHz.',
    eq: {
      lowCut: 30,
      highCut: 8000,
      peaking: [
        { freq: 62, gain: 6, Q: 1.2 },
        { freq: 250, gain: -4, Q: 1.2 },
        { freq: 2000, gain: 4, Q: 1.3 },
      ],
    },
    compressor: {
      threshold: -8,
      knee: 4,
      ratio: 5,
      attack: 0.003,
      release: 0.18,
      makeupGain: 2,
    },
  },
  'drum-snare': {
    type: 'drum-snare',
    name: 'Drum Snare',
    icon: '🪘',
    category: 'Drum',
    description: 'Buat snare lebih "crack" dengan attack dan body yang padat.',
    eq: {
      lowCut: 120,
      peaking: [
        { freq: 200, gain: 3, Q: 1 },
        { freq: 5000, gain: 5, Q: 1.4 },
        { freq: 10000, gain: 2, Q: 1 },
      ],
    },
    compressor: {
      threshold: -14,
      knee: 5,
      ratio: 4,
      attack: 0.005,
      release: 0.16,
      makeupGain: 2,
    },
  },
  'drum-master': {
    type: 'drum-master',
    name: 'Drum Bus',
    icon: '🎶',
    category: 'Drum',
    description: 'Untuk seluruh drum bus: glue compression + brightness agar drum "pop".',
    eq: {
      lowCut: 40,
      highShelf: { freq: 8000, gain: 2 },
      peaking: [{ freq: 180, gain: -3, Q: 1 }],
    },
    compressor: {
      threshold: -12,
      knee: 10,
      ratio: 2.5,
      attack: 0.01,
      release: 0.25,
      makeupGain: 2,
    },
  },

  'piano-bright': {
    type: 'piano-bright',
    name: 'Piano Bright',
    icon: '🎹',
    category: 'Keys',
    description: 'Piano yang cerah & memotong mix, dengan boost di register tinggi.',
    eq: {
      lowCut: 60,
      lowShelf: { freq: 120, gain: -2 },
      peaking: [{ freq: 2500, gain: 2, Q: 1 }],
      highShelf: { freq: 7000, gain: 5 },
    },
    compressor: {
      threshold: -18,
      knee: 8,
      ratio: 2,
      attack: 0.02,
      release: 0.2,
    },
    reverb: { seconds: 1.6, decay: 2.2, wet: 0.18 },
  },

  'master-loudness': {
    type: 'master-loudness',
    name: 'Master Loudness',
    icon: '📈',
    category: 'Master',
    description: 'Limiter-style master chain: naive loudness tanpa clipping. Gunakan di track master/bus akhir.',
    eq: {
      lowCut: 30,
      highCut: 18000,
      lowShelf: { freq: 80, gain: 1 },
      highShelf: { freq: 9000, gain: 1.5 },
    },
    compressor: {
      threshold: -6,
      knee: 2,
      ratio: 6,
      attack: 0.002,
      release: 0.18,
      makeupGain: 4,
    },
  },

  'reverb-room': {
    type: 'reverb-room',
    name: 'Reverb Room',
    icon: '🏠',
    category: 'Space',
    description: 'Reverb ruangan kecil natural, tidak terlalu basah.',
    reverb: { seconds: 1.2, decay: 2, wet: 0.22 },
  },
  'reverb-hall': {
    type: 'reverb-hall',
    name: 'Reverb Hall',
    icon: '🏛️',
    category: 'Space',
    description: 'Reverb aula besar, lebar, untuk kesan epik (string, pad, vokal lead).',
    reverb: { seconds: 3, decay: 3.5, wet: 0.28 },
  },
  'delay-echo': {
    type: 'delay-echo',
    name: 'Delay Echo',
    icon: '🔁',
    category: 'Space',
    description: 'Delay 1/4 note vibe dengan feedback sedang, buat efek echo yang catchy.',
    delay: { time: 0.3, feedback: 0.35, wet: 0.22 },
  },
};

export const PLUGIN_CATEGORIES: PluginPreset['category'][] = [
  'Vocal',
  'Guitar',
  'Bass',
  'Drum',
  'Keys',
  'Master',
  'Space',
];

export function buildImpulseResponse(
  ctx: AudioContext | OfflineAudioContext,
  seconds: number,
  decay: number
): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(rate * seconds));
  const impulse = ctx.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c++) {
    const ch = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return impulse;
}

export interface PluginGraphNodes {
  inputs: AudioNode[];
  output: AudioNode;
  preGain?: GainNode;
  eqFilters: BiquadFilterNode[];
  compressor?: DynamicsCompressorNode;
  compressorMakeup?: GainNode;
  distortion?: WaveShaperNode;
  reverbWet?: GainNode;
  reverbDry?: GainNode;
  convolver?: ConvolverNode;
  delayWet?: GainNode;
  delayNode?: DelayNode;
  delayFeedback?: GainNode;
  postGain?: GainNode;
  analyser: AnalyserNode;
}

export function buildPluginChain(
  ctx: AudioContext | OfflineAudioContext,
  pluginTypes: PluginType[],
  destinationForAnalyser: AudioNode
): PluginGraphNodes {
  const presets = pluginTypes.map((t) => PLUGIN_PRESETS[t]).filter(Boolean);

  const inputGain = ctx.createGain();
  inputGain.gain.value = 1;

  let cursor: AudioNode = inputGain;

  const eqFilters: BiquadFilterNode[] = [];
  let compressor: DynamicsCompressorNode | undefined;
  let compressorMakeup: GainNode | undefined;
  let distortion: WaveShaperNode | undefined;
  let reverbWet: GainNode | undefined;
  let reverbDry: GainNode | undefined;
  let convolver: ConvolverNode | undefined;
  let delayWet: GainNode | undefined;
  let delayNode: DelayNode | undefined;
  let delayFeedback: GainNode | undefined;

  let globalPreGain = 1;
  for (const p of presets) {
    if (typeof p.gain === 'number') globalPreGain *= p.gain;
  }
  let preGainNode: GainNode | undefined;
  if (globalPreGain !== 1) {
    preGainNode = ctx.createGain();
    preGainNode.gain.value = globalPreGain;
    cursor.connect(preGainNode);
    cursor = preGainNode;
  }

  for (const p of presets) {
    if (p.distortion) {
      const ws = ctx.createWaveShaper();
      if (p.distortion.oversample) ws.oversample = p.distortion.oversample;
      const k = p.distortion.amount;
      const n = 1024;
      const curve = new Float32Array(n);
      const deg = Math.PI / 180;
      for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      ws.curve = curve;
      cursor.connect(ws);
      cursor = ws;
      distortion = ws;
    }

    if (p.eq) {
      const eq = p.eq;
      if (eq.lowCut && eq.lowCut > 0) {
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = eq.lowCut;
        hp.Q.value = 0.707;
        cursor.connect(hp);
        cursor = hp;
        eqFilters.push(hp);
      }
      if (eq.highCut && eq.highCut > 0) {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = eq.highCut;
        lp.Q.value = 0.707;
        cursor.connect(lp);
        cursor = lp;
        eqFilters.push(lp);
      }
      if (eq.lowShelf) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowshelf';
        f.frequency.value = eq.lowShelf.freq;
        f.gain.value = eq.lowShelf.gain;
        if (eq.lowShelf.Q) f.Q.value = eq.lowShelf.Q;
        cursor.connect(f);
        cursor = f;
        eqFilters.push(f);
      }
      if (eq.highShelf) {
        const f = ctx.createBiquadFilter();
        f.type = 'highshelf';
        f.frequency.value = eq.highShelf.freq;
        f.gain.value = eq.highShelf.gain;
        if (eq.highShelf.Q) f.Q.value = eq.highShelf.Q;
        cursor.connect(f);
        cursor = f;
        eqFilters.push(f);
      }
      if (eq.peaking) {
        for (const pk of eq.peaking) {
          const f = ctx.createBiquadFilter();
          f.type = 'peaking';
          f.frequency.value = pk.freq;
          f.gain.value = pk.gain;
          f.Q.value = pk.Q;
          cursor.connect(f);
          cursor = f;
          eqFilters.push(f);
        }
      }
    }

    if (p.compressor) {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = p.compressor.threshold;
      comp.knee.value = p.compressor.knee;
      comp.ratio.value = p.compressor.ratio;
      comp.attack.value = p.compressor.attack;
      comp.release.value = p.compressor.release;
      cursor.connect(comp);
      cursor = comp;
      compressor = comp;
      if (p.compressor.makeupGain && p.compressor.makeupGain !== 0) {
        const mk = ctx.createGain();
        mk.gain.value = Math.pow(10, p.compressor.makeupGain / 20);
        cursor.connect(mk);
        cursor = mk;
        compressorMakeup = mk;
      }
    }

    if (p.delay) {
      const dry = ctx.createGain();
      dry.gain.value = 1;
      const wet = ctx.createGain();
      wet.gain.value = p.delay.wet;
      const fb = ctx.createGain();
      fb.gain.value = p.delay.feedback;
      const d = ctx.createDelay(2);
      d.delayTime.value = p.delay.time;
      cursor.connect(dry);
      cursor.connect(d);
      d.connect(fb);
      fb.connect(d);
      d.connect(wet);
      const sum = ctx.createGain();
      dry.connect(sum);
      wet.connect(sum);
      cursor = sum;
      delayWet = wet;
      delayNode = d;
      delayFeedback = fb;
    }

    if (p.reverb) {
      const dry = ctx.createGain();
      dry.gain.value = 1 - p.reverb.wet;
      const wet = ctx.createGain();
      wet.gain.value = p.reverb.wet;
      const conv = ctx.createConvolver();
      try {
        conv.buffer = buildImpulseResponse(ctx, p.reverb.seconds, p.reverb.decay);
      } catch {}
      cursor.connect(dry);
      cursor.connect(conv);
      conv.connect(wet);
      const sum = ctx.createGain();
      dry.connect(sum);
      wet.connect(sum);
      cursor = sum;
      reverbWet = wet;
      reverbDry = dry;
      convolver = conv;
    }
  }

  const postGain = ctx.createGain();
  postGain.gain.value = 1;
  cursor.connect(postGain);
  cursor = postGain;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  cursor.connect(analyser);
  analyser.connect(destinationForAnalyser);

  return {
    inputs: [inputGain],
    output: cursor,
    preGain: preGainNode,
    eqFilters,
    compressor,
    compressorMakeup,
    distortion,
    reverbWet,
    reverbDry,
    convolver,
    delayWet,
    delayNode,
    delayFeedback,
    postGain,
    analyser,
  };
}
