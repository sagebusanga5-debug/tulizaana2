// Web Audio API Procedural Sound Engine for Tulizaana Calming Tools

class SoundEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: Map<string, { gain: GainNode; stop: () => void }> = new Map();

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Generate buffer with noise
  private createNoiseBuffer(type: 'white' | 'pink'): AudioBuffer {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else {
      // Pink noise using Paul Kellet's filter method
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  // Play Gentle Bell / Chime for Breath Inhale / Exhale cues
  playChime(type: 'inhale' | 'exhale' | 'bell' = 'bell', volume = 0.3) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = type === 'inhale' ? 528 : type === 'exhale' ? 396 : 432;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 1.5, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 2.5);
      osc2.stop(now + 2.5);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Play Tibetan Singing Bowl
  playSingingBowl(volume = 0.4) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freqs = [216, 432, 864, 1296];
      const gains = [0.6, 0.4, 0.2, 0.1];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (Math.random() * 2 - 1), now);

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(volume * gains[idx], now + 0.1);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 6.0);

        osc.connect(g);
        g.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 6.0);
      });
    } catch (e) {
      console.warn('Singing bowl failed:', e);
    }
  }

  // Start continuous ambient sound
  startAmbient(soundKey: 'rain' | 'ocean' | 'breeze' | 'binaural' | 'stream', volume = 0.5) {
    this.stopAmbient(soundKey);
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(volume, now + 1.5);
    mainGain.connect(ctx.destination);

    if (soundKey === 'rain') {
      const noiseBuffer = this.createNoiseBuffer('pink');
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);

      source.connect(filter);
      filter.connect(mainGain);
      source.start();

      this.activeNodes.set(soundKey, {
        gain: mainGain,
        stop: () => {
          mainGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          setTimeout(() => {
            try { source.stop(); } catch {}
          }, 900);
        },
      });
    } else if (soundKey === 'ocean') {
      const noiseBuffer = this.createNoiseBuffer('pink');
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);

      // Low frequency oscillator for wave swell effect
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.12, now); // 8 seconds per wave cycle
      lfoGain.gain.setValueAtTime(0.4, now);

      lfo.connect(mainGain.gain);
      lfo.start();

      source.connect(filter);
      filter.connect(mainGain);
      source.start();

      this.activeNodes.set(soundKey, {
        gain: mainGain,
        stop: () => {
          try {
            lfo.stop();
            source.stop();
          } catch {}
        },
      });
    } else if (soundKey === 'breeze') {
      const noiseBuffer = this.createNoiseBuffer('pink');
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.Q.setValueAtTime(1.5, now);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.2, now);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(150, now);

      lfo.connect(filter.frequency);
      lfo.start();

      source.connect(filter);
      filter.connect(mainGain);
      source.start();

      this.activeNodes.set(soundKey, {
        gain: mainGain,
        stop: () => {
          try {
            lfo.stop();
            source.stop();
          } catch {}
        },
      });
    } else if (soundKey === 'binaural') {
      // 432Hz Left, 438Hz Right (6Hz Theta calm brainwave)
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const panL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const panR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(216, now);
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(222, now); // 6Hz difference (Theta)

      if (panL && panR) {
        panL.pan.setValueAtTime(-1, now);
        panR.pan.setValueAtTime(1, now);
        oscL.connect(panL);
        oscR.connect(panR);
        panL.connect(mainGain);
        panR.connect(mainGain);
      } else {
        oscL.connect(mainGain);
        oscR.connect(mainGain);
      }

      oscL.start();
      oscR.start();

      this.activeNodes.set(soundKey, {
        gain: mainGain,
        stop: () => {
          try {
            oscL.stop();
            oscR.stop();
          } catch {}
        },
      });
    } else if (soundKey === 'stream') {
      const noiseBuffer = this.createNoiseBuffer('white');
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.Q.setValueAtTime(3.0, now);

      source.connect(filter);
      filter.connect(mainGain);
      source.start();

      this.activeNodes.set(soundKey, {
        gain: mainGain,
        stop: () => {
          try { source.stop(); } catch {}
        },
      });
    }
  }

  setVolume(soundKey: string, volume: number) {
    const active = this.activeNodes.get(soundKey);
    if (active && this.ctx) {
      active.gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
  }

  stopAmbient(soundKey: string) {
    const active = this.activeNodes.get(soundKey);
    if (active) {
      active.stop();
      this.activeNodes.delete(soundKey);
    }
  }

  stopAll() {
    this.activeNodes.forEach((_, key) => {
      this.stopAmbient(key);
    });
  }
}

export const soundEngine = new SoundEngine();
