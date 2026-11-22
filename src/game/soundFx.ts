class SoundFxEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureCtx(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext?: typeof AudioContext})
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(next: boolean): void {
    this.muted = next;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    durationSec: number,
    type: OscillatorType,
    volume = 0.08,
    delaySec = 0,
  ) {
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freqStart), now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, freqEnd),
      now + durationSec,
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  public playAttack(mode: 'melee' | 'ranged') {
    if (mode === 'melee') {
      this.playTone(290, 105, 0.11, 'triangle', 0.08);
    } else {
      this.playTone(580, 240, 0.09, 'sine', 0.065);
    }
  }

  public playHit(heavy = false) {
    if (heavy) {
      this.playTone(170, 58, 0.15, 'sawtooth', 0.09);
    } else {
      this.playTone(240, 120, 0.07, 'square', 0.045);
    }
  }

  public playSkill() {
    this.playTone(360, 540, 0.14, 'triangle', 0.075);
    this.playTone(540, 720, 0.12, 'sine', 0.055, 0.06);
  }

  public playUlt() {
    this.playTone(180, 520, 0.28, 'sawtooth', 0.085);
    this.playTone(320, 880, 0.34, 'triangle', 0.08, 0.08);
    this.playTone(140, 65, 0.38, 'sine', 0.11, 0.14);
  }

  public playPlayerHurt() {
    this.playTone(160, 75, 0.14, 'sawtooth', 0.075);
  }

  public playWaveClear() {
    this.playTone(392, 392, 0.12, 'triangle', 0.07, 0);
    this.playTone(493.88, 493.88, 0.12, 'triangle', 0.07, 0.1);
    this.playTone(587.33, 587.33, 0.22, 'triangle', 0.08, 0.2);
  }

  public playVictory() {
    this.playTone(392, 392, 0.14, 'triangle', 0.08, 0);
    this.playTone(523.25, 523.25, 0.14, 'triangle', 0.08, 0.12);
    this.playTone(659.25, 659.25, 0.16, 'triangle', 0.085, 0.24);
    this.playTone(783.99, 783.99, 0.35, 'triangle', 0.09, 0.36);
  }

  public playDefeat() {
    this.playTone(300, 220, 0.2, 'sawtooth', 0.07, 0);
    this.playTone(220, 140, 0.25, 'sawtooth', 0.07, 0.18);
    this.playTone(140, 82, 0.4, 'triangle', 0.08, 0.38);
  }
}

export const soundFx = new SoundFxEngine();
