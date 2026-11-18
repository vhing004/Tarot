import {
  AI_PERSPECTIVES,
  generateTarotAiReading,
  getSavedAiApiKey,
  saveAiApiKey,
  type AiPerspective,
} from '@/services/ai';
import type { DrawnCard, Topic } from '@/shared/types';

export interface AiOracleModalOptions {
  cards: readonly DrawnCard[];
  question: string;
  topic: Topic;
  onClose: () => void;
  onSaveToJournal?: (text: string) => void;
}

export class AiOracleModal {
  private element: HTMLElement | null = null;
  private currentPerspective: AiPerspective = 'empowering';
  private isGenerating = false;
  private readonly options: AiOracleModalOptions;

  constructor(options: AiOracleModalOptions) {
    this.options = options;
  }

  mount(parent: HTMLElement): void {
    this.unmount();

    const backdrop = document.createElement('div');
    backdrop.className = 'ai-modal-backdrop';

    const dialog = document.createElement('div');
    dialog.className = 'ai-modal-dialog';

    // ── 1. Header ──
    const header = document.createElement('div');
    header.className = 'ai-modal-header';

    const titleBox = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'ai-modal-title';
    title.textContent = '🔮 Chiêm Nghiệm Tarot AI Master';

    const subtitle = document.createElement('p');
    subtitle.className = 'ai-modal-subtitle';
    subtitle.textContent = 'Chọn góc nhìn bạn mong muốn để AI đúc kết lời giải sâu sắc nhất.';
    titleBox.appendChild(title);
    titleBox.appendChild(subtitle);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'ai-modal-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Đóng';
    closeBtn.addEventListener('click', () => {
      this.options.onClose();
    });

    header.appendChild(titleBox);
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    // ── 2. Bộ chọn Góc nhìn Chiêm nghiệm (Perspective Selector) ──
    const selectorSection = document.createElement('div');
    selectorSection.className = 'ai-perspective-section';

    const selectorLabel = document.createElement('div');
    selectorLabel.className = 'ai-section-label';
    selectorLabel.textContent = 'CHỌN GÓC NHÌN LỜI KHUYÊN:';
    selectorSection.appendChild(selectorLabel);

    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'ai-perspectives-grid';

    const descEl = document.createElement('div');
    descEl.className = 'ai-perspective-desc';

    const updatePerspectiveDesc = (id: AiPerspective) => {
      const p = AI_PERSPECTIVES.find((item) => item.id === id);
      descEl.textContent = p ? `💡 ${p.descVi}` : '';
    };

    AI_PERSPECTIVES.forEach((p) => {
      const card = document.createElement('button');
      card.className = `ai-perspective-btn ${p.id === this.currentPerspective ? 'active' : ''}`;
      
      const icon = document.createElement('span');
      icon.className = 'ai-perspective-icon';
      icon.textContent = p.icon;

      const name = document.createElement('span');
      name.className = 'ai-perspective-name';
      name.textContent = p.titleVi;

      card.appendChild(icon);
      card.appendChild(name);

      card.addEventListener('click', () => {
        if (this.isGenerating) return;
        this.currentPerspective = p.id;
        cardsGrid.querySelectorAll('.ai-perspective-btn').forEach((b) => b.classList.remove('active'));
        card.classList.add('active');
        updatePerspectiveDesc(p.id);
        void triggerGeneration();
      });

      cardsGrid.appendChild(card);
    });

    selectorSection.appendChild(cardsGrid);
    selectorSection.appendChild(descEl);
    updatePerspectiveDesc(this.currentPerspective);
    dialog.appendChild(selectorSection);

    // ── 3. Khu vực Kết quả luận giải ──
    const resultBox = document.createElement('div');
    resultBox.className = 'ai-result-box';

    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'ai-loading-indicator';
    loadingIndicator.style.display = 'none';

    const spinner = document.createElement('div');
    spinner.className = 'ai-loading-spinner';
    const loadingText = document.createElement('span');
    loadingText.textContent = 'Đang hòa nhịp năng lượng và phân tích biểu tượng các lá bài...';
    loadingIndicator.appendChild(spinner);
    loadingIndicator.appendChild(loadingText);
    resultBox.appendChild(loadingIndicator);

    const textContentEl = document.createElement('div');
    textContentEl.className = 'ai-result-content';
    resultBox.appendChild(textContentEl);

    dialog.appendChild(resultBox);

    // ── 4. Thanh công cụ & Cấu hình API Key (Collapsible) ──
    const settingsToggleRow = document.createElement('div');
    settingsToggleRow.className = 'ai-config-toggle-row';

    const configToggleBtn = document.createElement('button');
    configToggleBtn.className = 'ai-config-toggle-btn';
    configToggleBtn.textContent = '⚙️ Cấu hình Gemini API Key (Miễn phí / Tùy chọn)';

    const configBox = document.createElement('div');
    configBox.className = 'ai-config-box';
    configBox.style.display = 'none';

    configToggleBtn.addEventListener('click', () => {
      configBox.style.display = configBox.style.display === 'none' ? 'block' : 'none';
    });

    const keyInputGroup = document.createElement('div');
    keyInputGroup.className = 'ai-key-input-group';

    const keyInput = document.createElement('input');
    keyInput.type = 'password';
    keyInput.className = 'ai-key-input';
    keyInput.placeholder = 'Dán Gemini API Key (để trống để dùng AI offline)';
    keyInput.value = getSavedAiApiKey();

    const saveKeyBtn = document.createElement('button');
    saveKeyBtn.className = 'btn btn-secondary ai-save-key-btn';
    saveKeyBtn.textContent = 'Lưu Key';
    saveKeyBtn.addEventListener('click', () => {
      saveAiApiKey(keyInput.value);
      saveKeyBtn.textContent = '✓ Đã lưu';
      setTimeout(() => {
        saveKeyBtn.textContent = 'Lưu Key';
      }, 2000);
    });

    keyInputGroup.appendChild(keyInput);
    keyInputGroup.appendChild(saveKeyBtn);

    const keyHint = document.createElement('p');
    keyHint.className = 'ai-key-hint';
    keyHint.textContent = '💡 Bạn có thể tạo API Key Google Gemini hoàn toàn miễn phí tại aistudio.google.com trong 30 giây. Nếu không nhập, game luôn dùng bộ luận giải ngoại tuyến tự động.';

    configBox.appendChild(keyInputGroup);
    configBox.appendChild(keyHint);

    settingsToggleRow.appendChild(configToggleBtn);
    dialog.appendChild(settingsToggleRow);
    dialog.appendChild(configBox);

    // ── 5. Action Footer ──
    const footer = document.createElement('div');
    footer.className = 'ai-modal-footer';

    const leftBtns = document.createElement('div');
    leftBtns.className = 'ai-footer-left';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-secondary';
    copyBtn.textContent = '📋 Sao chép';
    copyBtn.addEventListener('click', () => {
      const textToCopy = textContentEl.textContent ?? '';
      if (textToCopy.trim().length > 0) {
        void navigator.clipboard?.writeText(textToCopy);
        copyBtn.textContent = '✓ Đã chép!';
        setTimeout(() => {
          copyBtn.textContent = '📋 Sao chép';
        }, 2000);
      }
    });

    const journalBtn = document.createElement('button');
    journalBtn.className = 'btn btn-secondary';
    journalBtn.textContent = '📝 Lưu vào Nhật ký';
    journalBtn.addEventListener('click', () => {
      const text = textContentEl.textContent ?? '';
      if (text.trim().length > 0 && this.options.onSaveToJournal) {
        this.options.onSaveToJournal(text);
        journalBtn.textContent = '✓ Đã lưu vào Nhật ký';
        setTimeout(() => {
          journalBtn.textContent = '📝 Lưu vào Nhật ký';
        }, 2000);
      }
    });

    leftBtns.appendChild(copyBtn);
    if (this.options.onSaveToJournal) {
      leftBtns.appendChild(journalBtn);
    }

    const reGenBtn = document.createElement('button');
    reGenBtn.className = 'btn btn-primary';
    reGenBtn.textContent = '✨ Luận giải lại';
    reGenBtn.addEventListener('click', () => {
      void triggerGeneration();
    });

    footer.appendChild(leftBtns);
    footer.appendChild(reGenBtn);
    dialog.appendChild(footer);

    backdrop.appendChild(dialog);
    this.element = backdrop;
    parent.appendChild(backdrop);

    // Hàm gọi sinh lời luận giải
    const triggerGeneration = async () => {
      if (this.isGenerating) return;
      this.isGenerating = true;

      loadingIndicator.style.display = 'flex';
      textContentEl.textContent = '';
      reGenBtn.disabled = true;

      try {
        const fullText = await generateTarotAiReading({
          cards: this.options.cards,
          question: this.options.question,
          topic: this.options.topic,
          perspective: this.currentPerspective,
        });

        loadingIndicator.style.display = 'none';

        // Hiển thị nội dung với từng đoạn (R06: dùng textContent)
        const paragraphs = fullText.split('\n\n');
        for (const p of paragraphs) {
          if (p.trim().length === 0) continue;
          const pEl = document.createElement('p');
          pEl.className = 'ai-paragraph';
          pEl.textContent = p.trim();
          textContentEl.appendChild(pEl);
        }
      } catch (err) {
        console.error('Lỗi sinh lời giải AI:', err);
        loadingIndicator.style.display = 'none';
        const errEl = document.createElement('p');
        errEl.className = 'ai-error-text';
        errEl.textContent = 'Đã xảy ra sự cố khi kết nối, vui lòng bấm Luận giải lại.';
        textContentEl.appendChild(errEl);
      } finally {
        this.isGenerating = false;
        reGenBtn.disabled = false;
      }
    };

    // Tự động khởi chạy lần đầu tiên
    void triggerGeneration();
  }

  unmount(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
