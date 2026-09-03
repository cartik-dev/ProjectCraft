/**
 * Authentic C418 Soundtrack & Sound Effects Manager
 * Plays exclusively the official Minecraft Volume Alpha audio files
 * (/audio/sweden.ogg, subwoofer_lullaby.ogg, wet_hands.ogg, etc.)
 * with authentic rarity (2-4 minute ambient silences between tracks).
 */

export interface TrackInfo {
  title: string;
  file: string;
}

export const C418_TRACKS: TrackInfo[] = [
  { title: 'C418 - Sweden', file: '/audio/sweden.ogg' },
  { title: 'C418 - Subwoofer Lullaby', file: '/audio/subwoofer_lullaby.ogg' },
  { title: 'C418 - Wet Hands', file: '/audio/wet_hands.ogg' },
  { title: 'C418 - Minecraft', file: '/audio/minecraft.ogg' },
  { title: 'C418 - Haggstrom', file: '/audio/haggstrom.ogg' },
  { title: 'C418 - Living Mice', file: '/audio/living_mice.ogg' },
];

export class SoundManager {
  private ctx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private musicTimeoutId: number | null = null;
  public trackIndex = 0;
  private lastTrackIndex = -1;

  public isSoundMuted = false;
  public isMusicMuted = false;
  public isMusicPlaying = false;
  public currentTrackTitle = 'C418 - Sweden';

  private lastStepTime = 0;

  constructor() {}

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // --- RARE C418 SOUNDTRACK ENGINE ---

  /**
   * Starts scheduler. In vanilla Minecraft, music plays periodically with ambient pauses.
   */
  public startMusicScheduler(): void {
    if (this.musicTimeoutId !== null || this.isMusicPlaying) return;

    // Pick a random track index on game launch so it never always starts with the same track
    this.trackIndex = Math.floor(Math.random() * C418_TRACKS.length);

    // First ambient track starts after 10 seconds of gameplay
    this.musicTimeoutId = window.setTimeout(() => {
      this.playNextTrack();
    }, 10000);
  }

  public playNextTrack(): void {
    if (this.isMusicMuted) {
      this.scheduleNextTrack();
      return;
    }

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    // Pick next track ensuring it doesn't repeat the previous one
    let nextIdx = Math.floor(Math.random() * C418_TRACKS.length);
    if (nextIdx === this.lastTrackIndex) {
      nextIdx = (nextIdx + 1) % C418_TRACKS.length;
    }
    this.lastTrackIndex = nextIdx;
    this.trackIndex = nextIdx;

    const track = C418_TRACKS[nextIdx];
    this.currentTrackTitle = track.title;

    const audio = new Audio(track.file);
    audio.volume = 0.35; // Soft ambient background volume
    this.currentAudio = audio;
    this.isMusicPlaying = true;

    audio.play().catch((err) => {
      console.warn('C418 music playback prevented', err);
    });

    audio.onended = () => {
      this.isMusicPlaying = false;
      this.currentAudio = null;
      this.scheduleNextTrack();
    };

    audio.onerror = () => {
      this.isMusicPlaying = false;
      this.currentAudio = null;
      this.scheduleNextTrack();
    };
  }

  public skipToNextTrack(): string {
    if (this.musicTimeoutId !== null) {
      clearTimeout(this.musicTimeoutId);
      this.musicTimeoutId = null;
    }
    this.isMusicMuted = false;
    this.playNextTrack();
    return this.currentTrackTitle;
  }

  private scheduleNextTrack(): void {
    if (this.musicTimeoutId !== null) {
      clearTimeout(this.musicTimeoutId);
    }
    // Minecraft music interval: 2 to 3.5 minutes of peaceful silence between tracks
    const delay = 90000 + Math.random() * 120000;
    this.musicTimeoutId = window.setTimeout(() => {
      this.playNextTrack();
    }, delay);
  }

  public toggleMusic(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.isMusicMuted) {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
      this.isMusicPlaying = false;
      if (this.musicTimeoutId !== null) {
        clearTimeout(this.musicTimeoutId);
        this.musicTimeoutId = null;
      }
    } else {
      this.playNextTrack();
    }
    return !this.isMusicMuted;
  }

  public toggleSound(): boolean {
    this.isSoundMuted = !this.isSoundMuted;
    return !this.isSoundMuted;
  }

  // --- ORGANIC SOUND EFFECTS ---

  private createNoiseBuffer(duration: number): AudioBuffer | null {
    const ctx = this.getContext();
    if (!ctx) return null;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.28;
    }
    return buffer;
  }

  public playStep(isSprinting = false): void {
    if (this.isSoundMuted) return;
    const now = performance.now();
    const interval = isSprinting ? 270 : 360;
    if (now - this.lastStepTime < interval) return;
    this.lastStepTime = now;

    const ctx = this.getContext();
    if (!ctx) return;

    const noise = this.createNoiseBuffer(0.09);
    if (!noise) return;

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noise;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 450 + Math.random() * 200;
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    const vol = isSprinting ? 0.15 : 0.11;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noiseSource.start();

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(85 + Math.random() * 20, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.07);

    oscGain.gain.setValueAtTime(0.12, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  }

  public playJump(): void {
    if (this.isSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.11);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.11);
  }

  public playHit(): void {
    if (this.isSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const noise = this.createNoiseBuffer(0.06);
    if (!noise) return;

    const source = ctx.createBufferSource();
    source.buffer = noise;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 550 + Math.random() * 200;
    filter.Q.value = 2.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.13, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 + Math.random() * 40, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.05);

    oscGain.gain.setValueAtTime(0.16, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  public playBreak(): void {
    if (this.isSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const noise = this.createNoiseBuffer(0.16);
    if (!noise) return;

    const source = ctx.createBufferSource();
    source.buffer = noise;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.16);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.12);

    oscGain.gain.setValueAtTime(0.22, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  public playPlace(): void {
    if (this.isSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.08);

    oscGain.gain.setValueAtTime(0.24, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);

    const noise = this.createNoiseBuffer(0.04);
    if (!noise) return;
    const source = ctx.createBufferSource();
    source.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.12, ctx.currentTime);
    nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    source.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    source.start();
  }

  public playZombieGroan(): void {
    if (this.isSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    const startFreq = 85 + Math.random() * 25;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(startFreq - 20, ctx.currentTime + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  }

  public playSkeletonRattle(): void {
    if (this.isSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const noise = this.createNoiseBuffer(0.04);
        if (!noise || !ctx) return;
        const src = ctx.createBufferSource();
        src.buffer = noise;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800 + Math.random() * 400;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start();
      }, i * 45);
    }
  }

  public playPigOink(): void {
    if (this.isSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  public playSheepBaa(): void {
    if (this.isSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(190, ctx.currentTime + 0.35);

    filter.type = 'bandpass';
    filter.frequency.value = 750;
    filter.Q.value = 3.0;

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  public playEatBite(): void {
    if (this.isSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // 1. Crunchy noise bite burst
    const noise = this.createNoiseBuffer(0.08);
    if (!noise) return;
    const src = ctx.createBufferSource();
    src.buffer = noise;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000 + Math.random() * 500;
    filter.Q.value = 2.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.20, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();

    // 2. Teeth jaw crunch tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260 + Math.random() * 40, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);

    oscGain.gain.setValueAtTime(0.14, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  public playBurp(): void {
    if (this.isSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(75, ctx.currentTime + 0.38);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, ctx.currentTime);

    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.40);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.40);
  }
}

export const soundManager = new SoundManager();
