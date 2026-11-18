import type { QualityLevel } from '@/shared/types';

export class Quality {
  private currentLevel: QualityLevel = 'high';

  getLevel(): QualityLevel {
    return this.currentLevel;
  }

  setLevel(level: QualityLevel): void {
    this.currentLevel = level;
  }

  isShadowsEnabled(): boolean {
    return this.currentLevel === 'high';
  }

  isBloomEnabled(): boolean {
    return this.currentLevel === 'high';
  }

  dispose(): void {
    // Dọn dẹp bộ đo FPS
  }
}
