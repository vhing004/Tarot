import { t } from '@/shared/i18n';
import type { DrawnCard, Hexagram } from '@/shared/types';
import { POSITION_LABELS_VI } from '@/modes/tarot/logic/spreads';

export interface ReadingPanelCallbacks {
  onRetry: () => void;
  onExit: () => void;
}

export class ReadingPanel {
  private element: HTMLElement | null = null;
  private readonly callbacks: ReadingPanelCallbacks;

  constructor(callbacks: ReadingPanelCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Hiển thị kết quả bói bài Tarot
   */
  mount(parent: HTMLElement, cards: readonly DrawnCard[], interpretation: string): void {
    this.unmount();

    const root = document.createElement('div');
    root.className = 'reading-panel-container';

    const cardBox = document.createElement('div');
    cardBox.className = 'reading-card-box';

    // Tiêu đề
    const title = document.createElement('h2');
    title.className = 'reading-title';
    title.textContent = t('tarot_reading_title');
    cardBox.appendChild(title);

    // Danh sách thẻ bài Tarot
    const cardsList = document.createElement('div');
    cardsList.className = 'reading-cards-grid';

    for (let i = 0; i < cards.length; i++) {
      const drawn = cards[i]!;
      const cardItem = document.createElement('div');
      cardItem.className = 'reading-card-item';

      const posTitle = document.createElement('span');
      posTitle.className = 'card-position-badge';
      posTitle.textContent = POSITION_LABELS_VI[drawn.position] ?? drawn.position;

      const cardName = document.createElement('h3');
      cardName.className = 'card-name-text';
      cardName.textContent = `${drawn.card.nameVi} (${drawn.card.name})`;

      const cardOrientation = document.createElement('div');
      cardOrientation.className = drawn.reversed
        ? 'card-badge badge-reversed'
        : 'card-badge badge-upright';
      cardOrientation.textContent = drawn.reversed ? 'Ngược (Reversed)' : 'Xuôi (Upright)';

      const keywords = document.createElement('p');
      keywords.className = 'card-keywords';
      keywords.textContent = `Từ khóa: ${drawn.card.keywords.join(' • ')}`;

      const desc = document.createElement('p');
      desc.className = 'card-meaning';
      desc.textContent = drawn.reversed ? drawn.card.reversed : drawn.card.upright;

      cardItem.appendChild(posTitle);
      cardItem.appendChild(cardName);
      cardItem.appendChild(cardOrientation);
      cardItem.appendChild(keywords);
      cardItem.appendChild(desc);
      cardsList.appendChild(cardItem);
    }
    cardBox.appendChild(cardsList);

    this.appendCommonFooter(cardBox, interpretation);

    root.appendChild(cardBox);
    this.element = root;
    parent.appendChild(root);
  }

  /**
   * Hiển thị kết quả gieo quẻ Kinh Dịch
   */
  mountDivination(
    parent: HTMLElement,
    primaryHex: Hexagram,
    changedHex: Hexagram | null,
    movingLines: readonly number[],
    interpretation: string,
  ): void {
    this.unmount();

    const root = document.createElement('div');
    root.className = 'reading-panel-container';

    const cardBox = document.createElement('div');
    cardBox.className = 'reading-card-box';

    // Tiêu đề
    const title = document.createElement('h2');
    title.className = 'reading-title';
    title.textContent = t('divination_reading_title');
    cardBox.appendChild(title);

    // Khu vực hiển thị Quẻ Chủ & Quẻ Biến
    const hexContainer = document.createElement('div');
    hexContainer.className = 'reading-cards-grid';

    // 1. Quẻ Chủ
    const primaryItem = document.createElement('div');
    primaryItem.className = 'reading-card-item hex-card-item';

    const pBadge = document.createElement('span');
    pBadge.className = 'card-position-badge';
    pBadge.textContent = 'QUẺ CHỦ (CHÍNH QUẺ)';

    const pName = document.createElement('h3');
    pName.className = 'card-name-text';
    pName.textContent = `${primaryHex.nameVi} (${primaryHex.name})`;

    const pJudge = document.createElement('p');
    pJudge.className = 'card-meaning';
    pJudge.textContent = primaryHex.judgement;

    primaryItem.appendChild(pBadge);
    primaryItem.appendChild(pName);
    primaryItem.appendChild(pJudge);
    hexContainer.appendChild(primaryItem);

    // 2. Các Hào Động (nếu có)
    if (movingLines.length > 0) {
      const movingItem = document.createElement('div');
      movingItem.className = 'reading-card-item moving-lines-item';

      const mBadge = document.createElement('span');
      mBadge.className = 'card-position-badge';
      mBadge.textContent = `HÀO ĐỘNG (${movingLines.map((n) => `Hào ${n}`).join(', ')})`;

      movingItem.appendChild(mBadge);

      for (const lineNum of movingLines) {
        const lineText = primaryHex.lines[lineNum - 1];
        if (lineText) {
          const lP = document.createElement('p');
          lP.className = 'card-meaning moving-line-text';
          lP.textContent = `• ${lineText}`;
          movingItem.appendChild(lP);
        }
      }
      hexContainer.appendChild(movingItem);
    }

    // 3. Quẻ Biến (nếu có)
    if (changedHex) {
      const changedItem = document.createElement('div');
      changedItem.className = 'reading-card-item hex-card-item';

      const cBadge = document.createElement('span');
      cBadge.className = 'card-position-badge';
      cBadge.textContent = 'QUẺ BIẾN (CHIÊM ĐOÁN TƯƠNG LAI)';

      const cName = document.createElement('h3');
      cName.className = 'card-name-text';
      cName.textContent = `${changedHex.nameVi} (${changedHex.name})`;

      const cJudge = document.createElement('p');
      cJudge.className = 'card-meaning';
      cJudge.textContent = changedHex.judgement;

      changedItem.appendChild(cBadge);
      changedItem.appendChild(cName);
      changedItem.appendChild(cJudge);
      hexContainer.appendChild(changedItem);
    }

    cardBox.appendChild(hexContainer);

    this.appendCommonFooter(cardBox, interpretation);

    root.appendChild(cardBox);
    this.element = root;
    parent.appendChild(root);
  }

  private appendCommonFooter(cardBox: HTMLElement, interpretation: string): void {
    // Phần diễn giải chi tiết
    const interpSection = document.createElement('div');
    interpSection.className = 'reading-interpretation-section';
    const interpHeader = document.createElement('h4');
    interpHeader.textContent = 'Lời Khuyên Chiêm Nghiệm:';
    const interpText = document.createElement('p');
    interpText.className = 'interpretation-body';
    interpText.textContent = interpretation;

    interpSection.appendChild(interpHeader);
    interpSection.appendChild(interpText);
    cardBox.appendChild(interpSection);

    // Disclaimer bắt buộc (R05 §2)
    const disclaimer = document.createElement('p');
    disclaimer.className = 'disclaimer-text reading-disclaimer';
    disclaimer.textContent = t('disclaimer');
    cardBox.appendChild(disclaimer);

    // Nhóm nút bấm
    const btnGroup = document.createElement('div');
    btnGroup.className = 'reading-btn-group';

    const btnRetry = document.createElement('button');
    btnRetry.className = 'btn btn-primary';
    btnRetry.textContent = t('btn_retry');
    btnRetry.addEventListener('click', () => {
      this.callbacks.onRetry();
    });

    const btnExit = document.createElement('button');
    btnExit.className = 'btn btn-secondary';
    btnExit.textContent = t('btn_back_menu');
    btnExit.addEventListener('click', () => {
      this.callbacks.onExit();
    });

    btnGroup.appendChild(btnRetry);
    btnGroup.appendChild(btnExit);
    cardBox.appendChild(btnGroup);
  }

  unmount(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
