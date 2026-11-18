import { Engine } from '@/core/Engine';
import { AudioManager } from '@/core/AudioManager';
import { LocalRepository } from '@/services/repository';
import { Menu } from '@/ui/Menu';
import { t } from '@/shared/i18n';
import type { Mode, ModeContext } from '@/modes/Mode';

class App {
  private engine: Engine;
  private audio: AudioManager;
  private repo: LocalRepository;
  private menu: Menu;
  private currentMode: Mode | null = null;
  private uiRoot: HTMLElement;

  constructor() {
    const canvasContainer = document.getElementById('app-canvas');
    const uiRoot = document.getElementById('app-ui');

    if (!canvasContainer || !uiRoot) {
      throw new Error('Không tìm thấy container ứng dụng #app-canvas hoặc #app-ui');
    }

    this.uiRoot = uiRoot;
    this.engine = new Engine(canvasContainer);
    this.audio = new AudioManager();
    this.repo = new LocalRepository();

    this.menu = new Menu({
      onSelectMode: (modeId) => {
        void this.startMode(modeId);
      },
    });

    this.showMenu();
  }

  private showMenu(): void {
    if (this.currentMode) {
      this.currentMode.exit();
      this.currentMode.dispose();
      this.currentMode = null;
    }
    this.menu.mount(this.uiRoot);
    this.engine.requestRender();
  }

  private async startMode(modeId: 'tarot' | 'divination'): Promise<void> {
    this.menu.unmount();

    const ctx: ModeContext = {
      engine: this.engine,
      audio: this.audio,
      repo: this.repo,
      t,
      onExitToMenu: () => {
        this.showMenu();
      },
    };

    try {
      if (modeId === 'tarot') {
        // Nạp động chunk Tarot (R01 §1, R03 §7)
        const { TarotMode } = await import('@/modes/tarot/TarotMode');
        const mode = new TarotMode();
        await mode.init(ctx);
        mode.enter();
        this.currentMode = mode;
      } else if (modeId === 'divination') {
        // Nạp động chunk Divination (R01 §1, R03 §7)
        const { DivinationMode } = await import('@/modes/divination/DivinationMode');
        const mode = new DivinationMode();
        await mode.init(ctx);
        mode.enter();
        this.currentMode = mode;
      }
    } catch (err) {
      console.error(`Không thể nạp mode ${modeId}`, err);
      this.showMenu();
    }
  }
}

// Khởi tạo app khi DOM sẵn sàng
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
