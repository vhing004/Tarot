import { Engine } from '@/core/Engine';
import { AudioManager } from '@/core/AudioManager';
import { LocalRepository } from '@/services/repository';
import { SettingsService } from '@/services/settings';
import { Menu } from '@/ui/Menu';
import { HistoryView } from '@/ui/History';
import { SettingsModal } from '@/ui/Settings';
import { ReadingPanel } from '@/ui/ReadingPanel';
import { t } from '@/shared/i18n';
import type { Mode, ModeContext } from '@/modes/Mode';
import type { Reading, TarotResult, DivinationResult } from '@/shared/types';
import { lookupHexagram } from '@/modes/divination/logic/lookup';

class App {
  private engine: Engine;
  private audio: AudioManager;
  private repo: LocalRepository;
  private settingsService: SettingsService;
  private menu: Menu;
  private currentMode: Mode | null = null;
  private uiRoot: HTMLElement;

  private historyView: HistoryView | null = null;
  private settingsModal: SettingsModal | null = null;
  private detailReadingPanel: ReadingPanel | null = null;

  constructor() {
    const canvasContainer = document.getElementById('app-canvas');
    const uiRoot = document.getElementById('app-ui');

    if (!canvasContainer || !uiRoot) {
      throw new Error('Không tìm thấy container ứng dụng #app-canvas hoặc #app-ui');
    }

    this.uiRoot = uiRoot;
    this.engine = new Engine(canvasContainer);
    this.settingsService = new SettingsService();
    this.audio = new AudioManager(this.settingsService);
    this.repo = new LocalRepository();

    this.menu = new Menu(
      {
        onSelectMode: (modeId) => {
          void this.startMode(modeId);
        },
        onOpenHistory: () => {
          this.openHistory();
        },
        onOpenSettings: () => {
          this.openSettings();
        },
      },
      this.audio,
    );

    this.showMenu();
  }

  private showMenu(): void {
    if (this.currentMode) {
      this.currentMode.exit();
      this.currentMode.dispose();
      this.currentMode = null;
    }
    this.closeOverlays();
    this.menu.mount(this.uiRoot);
    this.engine.requestRender();
  }

  private closeOverlays(): void {
    this.historyView?.unmount();
    this.historyView = null;
    this.settingsModal?.unmount();
    this.settingsModal = null;
    this.detailReadingPanel?.unmount();
    this.detailReadingPanel = null;
  }

  private openHistory(): void {
    this.closeOverlays();
    this.historyView = new HistoryView(this.repo, {
      onSelectReading: (reading: Reading) => {
        this.openReadingDetail(reading);
      },
      onClose: () => {
        this.closeOverlays();
        this.menu.mount(this.uiRoot);
      },
    });
    void this.historyView.mount(this.uiRoot);
  }

  private openReadingDetail(reading: Reading): void {
    this.closeOverlays();

    this.detailReadingPanel = new ReadingPanel({
      onRetry: () => {
        this.openHistory();
      },
      onExit: () => {
        this.showMenu();
      },
    });

    if (reading.mode === 'tarot') {
      const res = reading.result as TarotResult;
      this.detailReadingPanel.mount(
        this.uiRoot,
        res.cards,
        reading.interpretation,
        reading,
      );
    } else {
      const res = reading.result as DivinationResult;
      const primaryHex = lookupHexagram(res.primaryKey);
      const changedHex = res.changedKey ? lookupHexagram(res.changedKey) : null;
      this.detailReadingPanel.mountDivination(
        this.uiRoot,
        primaryHex,
        changedHex,
        res.movingLines,
        reading.interpretation,
        reading,
      );
    }
  }

  private openSettings(): void {
    this.settingsModal = new SettingsModal(this.settingsService, this.audio, {
      onClose: () => {
        this.settingsModal?.unmount();
        this.settingsModal = null;
      },
    });
    this.settingsModal.mount(this.uiRoot);
  }

  private async startMode(modeId: 'tarot' | 'divination'): Promise<void> {
    this.closeOverlays();
    this.menu.unmount();

    // Bắt đầu phát ambient BGM khi vào mode
    this.audio.playBgm();

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
        const { TarotMode } = await import('@/modes/tarot/TarotMode');
        const mode = new TarotMode();
        await mode.init(ctx);
        mode.enter();
        this.currentMode = mode;
      } else if (modeId === 'divination') {
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
