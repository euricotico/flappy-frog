// Bulletproof Web Audio API synthesized sound engine for mobile & desktop browsers

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('sapinho_voador_muted');
      if (saved === 'true') {
        this.muted = true;
      }
    } catch {
      // Ignore storage access errors
    }
  }

  private getOrCreateContext(): AudioContext | null {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  // Call synchronously inside any user gesture (pointerdown / touchstart / keydown)
  public unlock(): void {
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    if (ctx.state !== 'running') {
      ctx.resume().catch(() => {});
    }

    // Play a 1-sample silent buffer to reliably wake iOS/Android hardware audio
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      // Ignore unlock errors
    }
  }

  private runWithContext(playFn: (ctx: AudioContext, dest: AudioNode) => void): void {
    if (this.muted) return;
    const ctx = this.getOrCreateContext();
    if (!ctx || !this.masterGain) return;
    const dest = this.masterGain;

    if (ctx.state === 'running') {
      playFn(ctx, dest);
      return;
    }

    // Handle 'suspended' and mobile 'interrupted' states without dropping the sound
    ctx
      .resume()
      .then(() => {
        if (!this.muted && ctx.state === 'running') {
          playFn(ctx, dest);
        }
      })
      .catch(() => {});
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem('sapinho_voador_muted', String(muted));
    } catch {
      // Ignore storage errors
    }
    if (!muted) {
      this.unlock();
    }
  }

  public toggleMute(): boolean {
    const nextMuted = !this.muted;
    this.setMuted(nextMuted);
    if (!nextMuted) {
      this.playJump();
    }
    return nextMuted;
  }

  // Crisp, audible frog hop / boing-croak designed to cut cleanly on phone speakers
  public playJump(): void {
    this.runWithContext((ctx, dest) => {
      const now = ctx.currentTime;

      // Primary cheerful frog upward hop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.085);
      osc.frequency.exponentialRampToValueAtTime(490, now + 0.13);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.15);

      // Soft warm harmonic body for cute frog character
      const harmonic = ctx.createOscillator();
      const hGain = ctx.createGain();
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(420, now);
      harmonic.frequency.exponentialRampToValueAtTime(840, now + 0.075);

      hGain.gain.setValueAtTime(0.001, now);
      hGain.gain.linearRampToValueAtTime(0.1, now + 0.012);
      hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

      harmonic.connect(hGain);
      hGain.connect(dest);
      harmonic.start(now);
      harmonic.stop(now + 0.1);
    });
  }

  // Crisp two-tone pond chime on scoring a pipe
  public playScore(): void {
    this.runWithContext((ctx, dest) => {
      const now = ctx.currentTime;
      const notes = [880, 1174.66];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.18, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(start);
        osc.stop(start + 0.22);
      });
    });
  }

  // Impact thump + short noise smack on collision
  public playHit(): void {
    this.runWithContext((ctx, dest) => {
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(185, now);
      osc.frequency.exponentialRampToValueAtTime(52, now + 0.18);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.23);

      const bufferSize = Math.floor(ctx.sampleRate * 0.08);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(950, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(dest);
      noise.start(now);
    });
  }

  // Celebratory arpeggio on completing a stage
  public playStageClear(): void {
    this.runWithContext((ctx, dest) => {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.19, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(start);
        osc.stop(start + 0.34);
      });
    });
  }

  // Cheerful arpeggio for beating endless personal best
  public playNewRecord(): void {
    this.runWithContext((ctx, dest) => {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.07;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.16, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(start);
        osc.stop(start + 0.26);
      });
    });
  }
}

export const soundEngine = new SoundEngine();
