import type { DrawnCard, Topic } from '@/shared/types';
import { POSITION_LABELS_VI } from '@/modes/tarot/logic/spreads';
import { resolveAssetUrl, TOPICS } from '@/shared/constants';
import { getCardTopicMeaning } from '@/modes/tarot/logic/interpret';

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

  mount(
    parent: HTMLElement,
    drawnCard: DrawnCard,
    currentIndex: number,
    totalCount: number,
    topic: Topic = 'general',
    question = '',
  ): void {
    this.unmount();

    const root = document.createElement('div');
    root.className = 'card-inspect-container';

    const card = drawnCard.card;
    const posLabel = POSITION_LABELS_VI[drawnCard.position] ?? drawnCard.position;
    const isReversed = drawnCard.reversed;
    const orientationText = isReversed ? 'Ngược (Reversed)' : 'Xuôi (Upright)';
    const orientationClass = isReversed ? 'badge-reversed' : 'badge-upright';

    const topicObj = TOPICS.find((t) => t.id === topic);
    const topicLabel = topicObj ? topicObj.labelVi : 'Tổng quan';
    const topicMeaning = getCardTopicMeaning(card, isReversed, topic);
    const hasQuestion = question.trim().length > 0;

    // ── 0. Banner Tiêu điểm (Chủ đề & Câu hỏi) ──
    const contextBanner = document.createElement('div');
    contextBanner.className = 'inspect-context-banner';

    const topicBadge = document.createElement('span');
    topicBadge.className = 'inspect-topic-badge';
    topicBadge.textContent = `🔮 Lĩnh vực: ${topicLabel}`;
    contextBanner.appendChild(topicBadge);

    if (hasQuestion) {
      const questionText = document.createElement('span');
      questionText.className = 'inspect-question-text';
      questionText.textContent = `Băn khoăn: "${question.trim()}"`;
      contextBanner.appendChild(questionText);
    }
    root.appendChild(contextBanner);

    // ── Layout 2 cột: ảnh lá bài bên trái, thông tin bên phải ──
    const layout = document.createElement('div');
    layout.className = 'inspect-layout';

    // ── CỘT TRÁI: ảnh lá bài ──
    const imgCol = document.createElement('div');
    imgCol.className = 'inspect-img-col';

    const cardImg = document.createElement('img');
    cardImg.className = isReversed ? 'inspect-card-img reversed' : 'inspect-card-img';
    cardImg.alt = `${card.nameVi} (${card.name})`;
    cardImg.src = resolveAssetUrl(card.image);
    cardImg.onerror = () => {
      cardImg.style.display = 'none';
      const fallbackBox = document.createElement('div');
      fallbackBox.className = 'inspect-card-fallback';
      const fallbackIcon = document.createElement('span');
      fallbackIcon.textContent = '🃏';
      const fallbackText = document.createElement('span');
      fallbackText.textContent = card.nameVi;
      fallbackBox.appendChild(fallbackIcon);
      fallbackBox.appendChild(fallbackText);
      imgCol.appendChild(fallbackBox);
    };
    imgCol.appendChild(cardImg);
    layout.appendChild(imgCol);

    // ── CỘT PHẢI: thông tin ──
    const infoCol = document.createElement('div');
    infoCol.className = 'inspect-info-col';

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
    infoCol.appendChild(header);

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
    infoCol.appendChild(titleRow);

    // 3. Khung lời giải theo Lăng kính Chủ đề (Topic Lens)
    const topicBox = document.createElement('div');
    topicBox.className = 'inspect-topic-box';

    const topicBoxHeader = document.createElement('div');
    topicBoxHeader.className = 'inspect-topic-header';
    topicBoxHeader.textContent = `✨ Lời giải theo lĩnh vực ${topicLabel}:`;
    topicBox.appendChild(topicBoxHeader);

    const topicMeaningEl = document.createElement('p');
    topicMeaningEl.className = 'inspect-topic-meaning';
    topicMeaningEl.textContent = topicMeaning;
    topicBox.appendChild(topicMeaningEl);

    infoCol.appendChild(topicBox);

    // 4. Từ khóa & Biểu tượng cốt lõi
    const keywordsEl = document.createElement('div');
    keywordsEl.className = 'inspect-keywords';
    keywordsEl.textContent = `Từ khóa: ${card.keywords.join(' • ')}`;
    infoCol.appendChild(keywordsEl);

    // 5. Biểu tượng nổi bật
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
      infoCol.appendChild(symbolsBox);
    }

    // 6. Nút chuyển tiếp
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
    infoCol.appendChild(actionRow);

    layout.appendChild(infoCol);
    root.appendChild(layout);

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
