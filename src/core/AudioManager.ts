export class AudioManager {
  private isMuted = false;
  private hasInteracted = false;

  constructor() {
    this.setupAutoplayUnlock();
  }

  private setupAutoplayUnlock(): void {
    const unlock = () => {
      this.hasInteracted = true;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  get isUnlocked(): boolean {
    return this.hasInteracted;
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  get muted(): boolean {
    return this.isMuted;
  }

  playBgm(): void {
    // Sẽ hoàn thiện ở W04 / Phase P3
  }

  stopBgm(): void {
    // Sẽ hoàn thiện ở W04 / Phase P3
  }

  playSfx(_name: string): void {
    // Sẽ hoàn thiện ở W04 / Phase P3
  }

  dispose(): void {
    // Dọn dẹp audio context nếu có
  }
}
