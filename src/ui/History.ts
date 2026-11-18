import type { Reading, ReadingRepository } from '@/shared/types';
import { summarizeReading } from '@/services/reading';
import { t } from '@/shared/i18n';

export interface HistoryCallbacks {
  onSelectReading: (reading: Reading) => void;
  onClose: () => void;
}

export class HistoryView {
  private element: HTMLElement | null = null;
  private repo: ReadingRepository;
  private callbacks: HistoryCallbacks;

  constructor(repo: ReadingRepository, callbacks: HistoryCallbacks) {
    this.repo = repo;
    this.callbacks = callbacks;
  }

  async mount(parent: HTMLElement): Promise<void> {
    this.unmount();

    const root = document.createElement('div');
    root.className = 'history-container';

    const cardBox = document.createElement('div');
    cardBox.className = 'history-card-box';

    // Header
    const header = document.createElement('div');
    header.className = 'history-header';

    const title = document.createElement('h2');
    title.className = 'history-title';
    title.textContent = t('history_title');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'history-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => {
      this.callbacks.onClose();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    cardBox.appendChild(header);

    // List container
    const listContainer = document.createElement('div');
    listContainer.className = 'history-list';
    cardBox.appendChild(listContainer);

    // Nạp dữ liệu lịch sử
    await this.renderList(listContainer);

    // Footer actions
    const footer = document.createElement('div');
    footer.className = 'history-footer';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn-secondary history-clear-btn';
    clearBtn.textContent = t('history_clear_all');
    clearBtn.addEventListener('click', async () => {
      // allow:R06-xss xác nhận xóa dữ liệu
      if (window.confirm(t('history_confirm_clear'))) {
        await this.repo.clear();
        await this.renderList(listContainer);
      }
    });

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-primary';
    backBtn.textContent = t('btn_back_menu');
    backBtn.addEventListener('click', () => {
      this.callbacks.onClose();
    });

    footer.appendChild(clearBtn);
    footer.appendChild(backBtn);
    cardBox.appendChild(footer);

    root.appendChild(cardBox);
    this.element = root;
    parent.appendChild(root);
  }

  private async renderList(container: HTMLElement): Promise<void> {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const records = await this.repo.list();

    if (records.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'history-empty-msg';
      emptyMsg.textContent = t('history_empty');
      container.appendChild(emptyMsg);
      return;
    }

    for (const reading of records) {
      const summary = summarizeReading(reading);

      const item = document.createElement('div');
      item.className = 'history-item';

      // Cột thông tin
      const infoBox = document.createElement('div');
      infoBox.className = 'history-item-info';
      infoBox.addEventListener('click', () => {
        this.callbacks.onSelectReading(reading);
      });

      const dateText = document.createElement('span');
      dateText.className = 'history-item-time';
      dateText.textContent = summary.timeFormatted;

      const itemTitle = document.createElement('h4');
      itemTitle.className = 'history-item-title';
      itemTitle.textContent = summary.title;

      const itemSub = document.createElement('span');
      itemSub.className = 'history-item-sub';
      itemSub.textContent = summary.subtitle;

      const itemPreview = document.createElement('p');
      itemPreview.className = 'history-item-preview';
      itemPreview.textContent = summary.previewText;

      infoBox.appendChild(dateText);
      infoBox.appendChild(itemTitle);
      infoBox.appendChild(itemSub);
      infoBox.appendChild(itemPreview);
      item.appendChild(infoBox);

      // Nút xóa riêng lẻ
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'history-delete-item-btn';
      deleteBtn.title = t('history_delete_item');
      deleteBtn.textContent = '🗑️';
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.repo.remove(reading.id);
        await this.renderList(container);
      });

      item.appendChild(deleteBtn);
      container.appendChild(item);
    }
  }

  unmount(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
