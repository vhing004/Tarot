import { t } from '@/shared/i18n';
import type { AudioManager } from '@/core/AudioManager';

export interface MenuCallbacks {
  onStartTarot: () => void;
  onOpenHistory?: () => void;
  onOpenSettings?: () => void;
}

export class Menu {
  private element: HTMLElement | null = null;
  private readonly callbacks: MenuCallbacks;
  private audio?: AudioManager;

  constructor(callbacks: MenuCallbacks, audio?: AudioManager) {
    this.callbacks = callbacks;
    this.audio = audio;
  }

  mount(parent: HTMLElement): void {
    this.unmount();

    const root = document.createElement('div');
    root.className = 'menu-container';

    // Nút tắt/bật loa ở góc màn hình
    if (this.audio) {
      const soundBtn = document.createElement('button');
      soundBtn.className = 'menu-sound-toggle-btn';
      soundBtn.textContent = this.audio.muted ? '🔇' : '🔊';
      soundBtn.title = t('settings_mute');
      soundBtn.addEventListener('click', () => {
        if (!this.audio) return;
        const newMuted = !this.audio.muted;
        this.audio.setMuted(newMuted);
        soundBtn.textContent = newMuted ? '🔇' : '🔊';
      });
      root.appendChild(soundBtn);
    }

    // Header
    const header = document.createElement('div');
    header.className = 'menu-header';

    const title = document.createElement('h1');
    title.className = 'menu-title';
    title.textContent = t('app_title');

    const subtitle = document.createElement('p');
    subtitle.className = 'menu-subtitle';
    subtitle.textContent = t('app_subtitle');

    header.appendChild(title);
    header.appendChild(subtitle);
    root.appendChild(header);

    // Button group
    const btnGroup = document.createElement('div');
    btnGroup.className = 'menu-btn-group';

    const btnTarot = document.createElement('button');
    btnTarot.className = 'btn btn-primary menu-tarot-primary-btn';
    btnTarot.textContent = `✨ ${t('menu_tarot')}`;
    btnTarot.addEventListener('click', () => {
      this.callbacks.onStartTarot();
    });

    const btnHistory = document.createElement('button');
    btnHistory.className = 'btn btn-secondary';
    btnHistory.textContent = t('menu_history');
    btnHistory.addEventListener('click', () => {
      this.callbacks.onOpenHistory?.();
    });

    const btnSettings = document.createElement('button');
    btnSettings.className = 'btn btn-secondary';
    btnSettings.textContent = t('menu_settings');
    btnSettings.addEventListener('click', () => {
      this.callbacks.onOpenSettings?.();
    });

    btnGroup.appendChild(btnTarot);
    btnGroup.appendChild(btnHistory);
    btnGroup.appendChild(btnSettings);
    root.appendChild(btnGroup);

    // Disclaimer bắt buộc (R05 §2)
    const footer = document.createElement('div');
    footer.className = 'menu-footer';
    const disclaimer = document.createElement('p');
    disclaimer.className = 'disclaimer-text';
    disclaimer.textContent = t('disclaimer');
    footer.appendChild(disclaimer);
    root.appendChild(footer);

    this.element = root;
    parent.appendChild(root);
  }

  unmount(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
