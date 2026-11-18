import type { Engine } from '@/core/Engine';
import type { AudioManager } from '@/core/AudioManager';
import type { Quality } from '@/core/Quality';
import type { ReadingRepository } from '@/shared/types';

export interface ModeContext {
  engine: Engine;
  audio: AudioManager;
  repo: ReadingRepository;
  t: (key: string) => string;
  /** Quality manager để mode điều chỉnh số hạt khói khi mức thay đổi */
  quality: Quality;
  /** Bật khi người dùng chọn giảm chuyển động (prefers-reduced-motion hoặc cài đặt thủ công) */
  reducedMotion: boolean;
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
