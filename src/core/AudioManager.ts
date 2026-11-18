import { SettingsService } from '@/services/settings';

/**
 * Trình quản lý âm thanh huyền bí sử dụng Web Audio API (procedural synthesizer).
 * Không phụ thuộc file âm thanh ngoài, dung lượng 0 KB, hoạt động 100% offline.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isBgmPlaying = false;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmFilter: BiquadFilterNode | null = null;

  private settingsService: SettingsService;
  private isUnlocked = false;

  constructor(settingsService?: SettingsService) {
    this.settingsService = settingsService ?? new SettingsService();
    this.setupAutoplayUnlock();
  }

  get unlocked(): boolean {
    return this.isUnlocked;
  }

  private initAudioContext(): void {
    if (this.ctx) return;

    try {
      // allow:R02-any AudioContext fallback
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);

      this.applySettings();
    } catch (err) {
      console.warn('AudioManager: Web Audio API không được hỗ trợ hoặc bị chặn', err);
    }
  }

  private setupAutoplayUnlock(): void {
    const unlock = () => {
      this.isUnlocked = true;
      this.initAudioContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  private applySettings(): void {
    const { volume, muted } = this.settingsService.settings;
    if (this.masterGain && this.ctx) {
      const targetVol = muted ? 0 : volume;
      this.masterGain.gain.setValueAtTime(targetVol, this.ctx.currentTime);
    }
  }

  setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.settingsService.save({ volume: clamped });
    this.applySettings();
  }

  setMuted(muted: boolean): void {
    this.settingsService.save({ muted });
    this.applySettings();
  }

  get muted(): boolean {
    return this.settingsService.settings.muted;
  }

  get volume(): number {
    return this.settingsService.settings.volume;
  }

  /**
   * Phát nhạc nền Ambient Drone huyền ảo thiền định
   */
  playBgm(): void {
    if (this.isBgmPlaying) return;
    this.initAudioContext();
    if (!this.ctx || !this.bgmGain) return;

    this.stopBgm();
    this.isBgmPlaying = true;

    // Bộ lọc Lowpass tạo âm sắc sâu lắng, bí ẩn
    this.bgmFilter = this.ctx.createBiquadFilter();
    this.bgmFilter.type = 'lowpass';
    this.bgmFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
    this.bgmFilter.connect(this.bgmGain);
    this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    // 2 Tần số cơ bản: nốt A1 (55Hz) và nốt E2 (82.4Hz)
    const freqs = [55, 82.4, 110];
    this.bgmOscillators = freqs.map((freq) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
      osc.connect(this.bgmFilter!);
      osc.start();
      return osc;
    });
  }

  stopBgm(): void {
    for (const osc of this.bgmOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // bỏ qua nếu đã dừng
      }
    }
    this.bgmOscillators = [];
    this.isBgmPlaying = false;
  }

  /**
   * SFX: Tiếng xáo bài (sột soạt nhẹ nhàng của thẻ bài)
   */
  playShuffle(): void {
    this.initAudioContext();
    if (!this.ctx || !this.sfxGain || this.muted) return;

    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Noise kết hợp điều chế
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(2, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.sfxGain);

    noise.start();
  }

  /**
   * SFX: Tiếng lật bài (dứt khoát, thanh thoát)
   */
  playCardFlip(): void {
    this.initAudioContext();
    if (!this.ctx || !this.sfxGain || this.muted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  /**
   * SFX: Tiếng đồng xu rơi ngân vang (kim loại lách cách)
   */
  playCoinDrop(): void {
    this.initAudioContext();
    if (!this.ctx || !this.sfxGain || this.muted) return;

    const freqs = [1800, 2400];
    for (const freq of freqs) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    }
  }

  /**
   * SFX: Tiếng chuông thiền định / chuông kết quả thanh khiết
   */
  playChime(): void {
    this.initAudioContext();
    if (!this.ctx || !this.sfxGain || this.muted) return;

    const chords = [528, 660, 792]; // Tần số hòa âm Solfeggio 528Hz
    for (let i = 0; i < chords.length; i++) {
      const freq = chords[i]!;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.05);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5 + i * 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(this.ctx.currentTime + i * 0.05);
      osc.stop(this.ctx.currentTime + 1.8);
    }
  }

  dispose(): void {
    this.stopBgm();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
