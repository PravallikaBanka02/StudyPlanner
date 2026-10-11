// Web Audio API Procedural Sound Generator for Focus Mode
class AudioService {
  constructor() {
    this.ctx = null;
    this.activeNode = null;
    this.gainNode = null;
    this.currentTrack = null;
    this.volume = 0.5;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx ? this.ctx.currentTime : 0);
    }
  }

  stop() {
    if (this.activeNode) {
      try {
        if (this.activeNode.stop) this.activeNode.stop();
        if (this.activeNode.disconnect) this.activeNode.disconnect();
      } catch (e) {
        // ignore
      }
      this.activeNode = null;
    }
    this.currentTrack = null;
  }

  playRain() {
    this.init();
    this.stop();

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Pink noise generation for realistic rain
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter to sound like soft rainfall
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume * 0.7, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    noise.start();
    this.activeNode = noise;
    this.currentTrack = 'rain';
  }

  playBinauralAlpha() {
    this.init();
    this.stop();

    // 10Hz alpha difference (ideal for deep study & relaxed focus)
    const oscL = this.ctx.createOscillator();
    const oscR = this.ctx.createOscillator();
    const merger = this.ctx.createChannelMerger(2);

    oscL.frequency.setValueAtTime(200, this.ctx.currentTime);     // 200 Hz
    oscR.frequency.setValueAtTime(210, this.ctx.currentTime);     // 210 Hz -> 10 Hz Alpha beat

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);

    oscL.connect(merger, 0, 0);
    oscR.connect(merger, 0, 1);
    merger.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    oscL.start();
    oscR.start();

    this.activeNode = {
      stop: () => {
        oscL.stop();
        oscR.stop();
      },
      disconnect: () => {
        merger.disconnect();
      }
    };
    this.currentTrack = 'binaural';
  }

  playWhiteNoise() {
    this.init();
    this.stop();

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.12;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    noise.start();
    this.activeNode = noise;
    this.currentTrack = 'whitenoise';
  }

  playCompletionChime() {
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major chord arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);

      const startTime = this.ctx.currentTime + idx * 0.12;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 1.3);
    });
  }
}

export const audioService = new AudioService();
