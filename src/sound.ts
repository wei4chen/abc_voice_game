/**
 * A cute retro synthesizer using Web Audio API to create educational sound effects
 * without loading external media assets.
 */

class SoundSynth {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on the count of first user gesture
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtxClass();
      } catch (e) {
        console.error('Web Audio API is not supported in this browser:', e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggle(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Short bubble-like beep when a letter is zapped
   */
  public playLetterZap() {
    if (!this.isEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  /**
   * Joyful chime sequence when a full word is completed
   */
  public playWordCleared() {
    if (!this.isEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const playNote = (freq: number, start: number, duration: number, volume: number = 0.1) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(volume, start);
      gain.gain.linearRampToValueAtTime(0.01, start + duration);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    const now = this.ctx.currentTime;
    // C-major arpeggio C5 - E5 - G5 - C6
    playNote(523.25, now, 0.1); // C5
    playNote(659.25, now + 0.08, 0.1); // E5
    playNote(783.99, now + 0.16, 0.12); // G5
    playNote(1046.50, now + 0.24, 0.2, 0.15); // C6
  }

  /**
   * Sound indicating a life lost / word touched base
   */
  public playLifeLost() {
    if (!this.isEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  /**
   * Soft click / hover sound
   */
  public playTick() {
    if (!this.isEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  /**
   * Game Over fanfare
   */
  public playGameOver() {
    if (!this.isEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.linearRampToValueAtTime(0.01, start + duration);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // Descending sad pattern
    playNote(392.00, now, 0.25); // G4
    playNote(349.23, now + 0.25, 0.25); // F4
    playNote(311.13, now + 0.50, 0.25); // Eb4
    playNote(246.94, now + 0.75, 0.5); // B3
  }

  /**
   * Victory levelling fanfare
   */
  public playLevelUp() {
    if (!this.isEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.linearRampToValueAtTime(0.01, start + duration);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(261.63, now, 0.12); // C4
    playNote(329.63, now + 0.1, 0.12); // E4
    playNote(392.00, now + 0.2, 0.12); // G4
    playNote(523.25, now + 0.3, 0.15); // C5
    playNote(659.25, now + 0.45, 0.15); // E5
    playNote(783.99, now + 0.6, 0.3); // G5
  }
}

export const synth = new SoundSynth();
