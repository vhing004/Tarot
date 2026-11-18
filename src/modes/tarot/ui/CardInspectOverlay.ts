import type { DrawnCard } from '@/shared/types';
import { POSITION_LABELS_VI } from '@/modes/tarot/logic/spreads';

export interface CardInspectCallbacks {
  onNext: () => void;
  isLastCard: boolean;
  nextPositionLabel?: string;
}

export class CardInspectOverlay {
  private element: HTMLElement | null = null;
  private readonly callbacks: CardInspectCallbacks;

  constructor(callbacks: CardInspectCallbacks) {
    this.callbacks = callbacks;
  }

  mount(parent: HTMLElement, drawnCard: DrawnCard, currentIndex: number, totalCount: number): void {
    this.unmount();

    const root = document.createElement('div');
    root.className = 'card-inspect-container';

    const card = drawnCard.card;
    const posLabel = POSITION_LABELS_VI[drawnCard.position] ?? drawnCard.position;
    const isReversed = drawnCard.reversed;
    const orientationText = isReversed ? 'Ngược (Reversed)' : 'Xuôi (Upright)';
    const orientationClass = isReversed ? 'badge-reversed' : 'badge-upright';
    const meaning = isReversed ? card.reversed : card.upright;

    // 1. Header vị trí
    const header = document.createElement('div');
    header.className = 'inspect-header';

    const stepBadge = document.createElement('span');
    stepBadge.className = 'inspect-step-badge';
    stepBadge.textContent = `Lá bài ${currentIndex + 1} / ${totalCount}`;

    const posBadge = document.createElement('span');
    posBadge.className = 'inspect-pos-badge';
    posBadge.textContent = posLabel;

    header.appendChild(stepBadge);
    header.appendChild(posBadge);
    root.appendChild(header);

    // 2. Tên lá và huy hiệu chiều lá
    const titleRow = document.createElement('div');
    titleRow.className = 'inspect-title-row';

    const title = document.createElement('h3');
    title.className = 'inspect-title';
    title.textContent = `${card.nameVi} (${card.name})`;

    const badge = document.createElement('span');
    badge.className = `card-badge ${orientationClass}`;
    badge.textContent = orientationText;

    titleRow.appendChild(title);
    titleRow.appendChild(badge);
    root.appendChild(titleRow);

    // 3. Từ khóa cốt lõi
    const keywordsEl = document.createElement('div');
    keywordsEl.className = 'inspect-keywords';
    keywordsEl.textContent = `Từ khóa: ${card.keywords.join(' • ')}`;
    root.appendChild(keywordsEl);

    // 4. Lời thông điệp
    const meaningEl = document.createElement('p');
    meaningEl.className = 'inspect-meaning';
    meaningEl.textContent = meaning;
    root.appendChild(meaningEl);

    // 5. Khám phá biểu tượng hình ảnh cốt lõi (docs/tarot_game_development_guide.md mục 4 & 9)
    if (card.symbolism && card.symbolism.length > 0) {
      const symbolsBox = document.createElement('div');
      symbolsBox.className = 'inspect-symbols-box';

      const symbolsLabel = document.createElement('span');
      symbolsLabel.className = 'inspect-symbols-label';
      symbolsLabel.textContent = '🔍 Biểu tượng nổi bật:';
      symbolsBox.appendChild(symbolsLabel);

      const symbolsList = document.createElement('div');
      symbolsList.className = 'inspect-symbols-list';
      for (const sym of card.symbolism) {
        const item = document.createElement('span');
        item.className = 'inspect-symbol-tag';
        item.textContent = sym;
        symbolsList.appendChild(item);
      }
      symbolsBox.appendChild(symbolsList);
      root.appendChild(symbolsBox);
    }

    // 6. Nút chuyển tiếp (tiến trình có nhịp điệu)
    const actionRow = document.createElement('div');
    actionRow.className = 'inspect-action-row';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary inspect-next-btn';

    if (this.callbacks.isLastCard) {
      nextBtn.textContent = '✨ Hoàn tất & Xem toàn cảnh trải bài';
    } else {
      const nextLabel = this.callbacks.nextPositionLabel
        ? `Lật lá tiếp theo: [${this.callbacks.nextPositionLabel}] ➔`
        : 'Lật lá tiếp theo ➔';
      nextBtn.textContent = nextLabel;
    }

    nextBtn.addEventListener('click', () => {
      this.callbacks.onNext();
    });

    actionRow.appendChild(nextBtn);
    root.appendChild(actionRow);

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
