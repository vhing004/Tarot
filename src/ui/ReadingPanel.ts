import { t } from '@/shared/i18n';
import type { DrawnCard, Hexagram, Reading } from '@/shared/types';
import { POSITION_LABELS_VI } from '@/modes/tarot/logic/spreads';
import { generateShareCard, shareOrDownloadImage } from '@/services/share';
import { AiOracleModal } from '@/ui/AiOracleModal';
import { resolveAssetUrl } from '@/shared/constants';

export interface ReadingPanelCallbacks {
  onRetry: () => void;
  onExit: () => void;
  onSaveNotes?: (notes: string) => Promise<void> | void;
}

export class ReadingPanel {
  private element: HTMLElement | null = null;
  private readonly callbacks: ReadingPanelCallbacks;
  private currentReading: Reading | null = null;
  private aiModal: AiOracleModal | null = null;

  constructor(callbacks: ReadingPanelCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Hiển thị kết quả bói bài Tarot
   */
  mount(
    parent: HTMLElement,
    cards: readonly DrawnCard[],
    interpretation: string,
    reading?: Reading,
  ): void {
    this.unmount();
    this.currentReading = reading ?? null;

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

      // Khung ảnh nghệ thuật của lá bài
      const imgWrap = document.createElement('div');
      imgWrap.className = 'reading-card-img-wrap';

      const img = document.createElement('img');
      img.className = drawn.reversed ? 'reading-card-img reversed' : 'reading-card-img';
      img.src = resolveAssetUrl(drawn.card.image);
      img.alt = `${drawn.card.nameVi} (${drawn.card.name})`;
      img.loading = 'lazy';
      img.onerror = () => {
        img.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'reading-card-img-fallback';
        fallback.textContent = '🃏';
        imgWrap.appendChild(fallback);
      };
      imgWrap.appendChild(img);

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

    // Thu thập các câu hỏi phản tư (docs/tarot_game_development_guide.md mục 4 & 13)
    const allPrompts: string[] = [];
    for (const drawn of cards) {
      if (drawn.card.reflectionPrompts) {
        for (const p of drawn.card.reflectionPrompts) {
          if (!allPrompts.includes(p)) allPrompts.push(p);
        }
      }
    }
    if (allPrompts.length > 0) {
      const promptBox = document.createElement('div');
      promptBox.className = 'reflection-prompt-box';
      const promptTitle = document.createElement('h4');
      promptTitle.className = 'reflection-prompt-title';
      promptTitle.textContent = '🔮 Câu Hỏi Phản Tư Dành Cho Bạn (Self-Reflection):';
      promptBox.appendChild(promptTitle);

      const promptList = document.createElement('ul');
      promptList.className = 'reflection-prompt-list';
      for (const p of allPrompts) {
        const li = document.createElement('li');
        li.textContent = p;
        promptList.appendChild(li);
      }
      promptBox.appendChild(promptList);
      cardBox.appendChild(promptBox);
    }

    // Banner / Nút gọi AI Chiêm Nghiệm Tarot Đa Tùy Chọn
    const aiCallout = document.createElement('div');
    aiCallout.className = 'ai-callout-banner';

    const aiIconSpan = document.createElement('span');
    aiIconSpan.className = 'ai-callout-icon';
    aiIconSpan.textContent = '🔮';

    const aiInfo = document.createElement('div');
    aiInfo.className = 'ai-callout-info';
    const aiTitle = document.createElement('strong');
    aiTitle.className = 'ai-callout-title';
    aiTitle.textContent = 'Góc Nhìn Chiêm Nghiệm Chuyên Sâu từ AI Master';
    const aiDesc = document.createElement('span');
    aiDesc.className = 'ai-callout-desc';
    aiDesc.textContent = 'Khám phá lời khuyên theo 4 góc nhìn: Khích lệ, Thẳng thắn cảnh báo rủi ro, Triết học nội tâm hoặc Hành động cụ thể.';
    aiInfo.appendChild(aiTitle);
    aiInfo.appendChild(aiDesc);

    const aiBtn = document.createElement('button');
    aiBtn.className = 'btn btn-primary ai-open-btn';
    aiBtn.textContent = '✨ Tham vấn AI Master';
    aiBtn.addEventListener('click', () => {
      this.openAiModal(cards, parent);
    });

    aiCallout.appendChild(aiIconSpan);
    aiCallout.appendChild(aiInfo);
    aiCallout.appendChild(aiBtn);
    cardBox.appendChild(aiCallout);

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
    reading?: Reading,
  ): void {
    this.unmount();
    this.currentReading = reading ?? null;

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

    // Ô ghi chú chiêm nghiệm cá nhân (docs/tarot_game_development_guide.md mục 13)
    if (this.currentReading && this.callbacks.onSaveNotes) {
      const journalBox = document.createElement('div');
      journalBox.className = 'journal-note-box';

      const journalTitle = document.createElement('h4');
      journalTitle.className = 'journal-note-title';
      journalTitle.textContent = '📝 Nhật Ký Chiêm Nghiệm Cá Nhân:';

      const textarea = document.createElement('textarea');
      textarea.className = 'journal-note-input';
      textarea.placeholder =
        'Ghi lại những cảm nhận, thông điệp đặc biệt hoặc kế hoạch hành động của bạn sau lượt trải bài này...';
      textarea.value = this.currentReading.notes ?? '';

      const saveRow = document.createElement('div');
      saveRow.className = 'journal-save-row';

      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn btn-secondary btn-sm';
      saveBtn.textContent = '💾 Lưu ghi chú';

      const statusSpan = document.createElement('span');
      statusSpan.className = 'journal-save-status';

      saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Đang lưu...';
        try {
          await this.callbacks.onSaveNotes?.(textarea.value);
          statusSpan.textContent = 'Đã lưu vào nhật ký ✨';
          setTimeout(() => {
            statusSpan.textContent = '';
          }, 3000);
        } catch (err) {
          console.error('Lỗi lưu nhật ký:', err);
          statusSpan.textContent = 'Lỗi lưu ghi chú!';
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = '💾 Lưu ghi chú';
        }
      });

      saveRow.appendChild(saveBtn);
      saveRow.appendChild(statusSpan);

      journalBox.appendChild(journalTitle);
      journalBox.appendChild(textarea);
      journalBox.appendChild(saveRow);
      cardBox.appendChild(journalBox);
    }

    // Disclaimer bắt buộc (R05 §2)
    const disclaimer = document.createElement('p');
    disclaimer.className = 'disclaimer-text reading-disclaimer';
    disclaimer.textContent = t('disclaimer');
    cardBox.appendChild(disclaimer);

    // Nhóm nút bấm
    const btnGroup = document.createElement('div');
    btnGroup.className = 'reading-btn-group';

    // Nút chia sẻ ảnh nếu có reading record
    if (this.currentReading) {
      const btnShare = document.createElement('button');
      btnShare.className = 'btn btn-secondary';
      btnShare.textContent = `🖼️ ${t('btn_share_card')}`;
      btnShare.addEventListener('click', async () => {
        if (!this.currentReading) return;
        btnShare.disabled = true;
        btnShare.textContent = 'Đang tạo ảnh...';
        try {
          const imgUrl = await generateShareCard(this.currentReading, false);
          const fname = `fortune_${this.currentReading.mode}_${this.currentReading.id}.png`;
          await shareOrDownloadImage(imgUrl, fname);
        } catch (err) {
          console.error('Không thể tạo ảnh chia sẻ', err);
        } finally {
          btnShare.disabled = false;
          btnShare.textContent = `🖼️ ${t('btn_share_card')}`;
        }
      });
      btnGroup.appendChild(btnShare);
    }

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

  private openAiModal(cards: readonly DrawnCard[], parent: HTMLElement): void {
    this.aiModal?.unmount();
    this.aiModal = new AiOracleModal({
      cards,
      question: this.currentReading?.question ?? '',
      topic: this.currentReading?.topic ?? 'general',
      onClose: () => {
        this.aiModal?.unmount();
        this.aiModal = null;
      },
      onSaveToJournal: (text: string) => {
        const textarea = this.element?.querySelector<HTMLTextAreaElement>('.journal-note-input');
        if (textarea) {
          const current = textarea.value.trim();
          textarea.value = current ? `${current}\n\n[Lời khuyên AI]:\n${text}` : `[Lời khuyên AI]:\n${text}`;
          // Kích hoạt nút lưu nếu có
          const saveBtn = this.element?.querySelector<HTMLButtonElement>('.journal-save-row .btn');
          saveBtn?.click();
        }
      },
    });
    this.aiModal.mount(parent);
  }

  unmount(): void {
    this.aiModal?.unmount();
    this.aiModal = null;
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
