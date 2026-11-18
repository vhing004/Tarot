import type { Engine } from '@/core/Engine';
import type { AudioManager } from '@/core/AudioManager';
import type { ReadingRepository } from '@/shared/types';

export interface ModeContext {
  engine: Engine;
  audio: AudioManager;
  repo: ReadingRepository;
  t: (key: string) => string;
  onExitToMenu: () => void;
}

export interface Mode {
  readonly id: 'tarot' | 'divination';
  init(ctx: ModeContext): Promise<void>;
  enter(): void;
  update(dt: number): void;
  exit(): void;
  dispose(): void;
}
