import { isSensitiveQuestion, TOPICS } from '@/shared/constants';
import { t } from '@/shared/i18n';
import type { Topic } from '@/shared/types';
import { TAROT_SPREADS, type TarotSpreadType } from '@/modes/tarot/logic/spreads';

export interface QuestionFormData {
  question: string;
  topic: Topic;
  spread: TarotSpreadType;
}

export interface QuestionFormCallbacks {
  onSubmit: (data: QuestionFormData) => void;
  onCancel: () => void;
}

export class QuestionForm {
  private element: HTMLElement | null = null;
  private readonly callbacks: QuestionFormCallbacks;

  constructor(callbacks: QuestionFormCallbacks) {
    this.callbacks = callbacks;
  }

  mount(parent: HTMLElement): void {
    this.unmount();

    const root = document.createElement('div');
    root.className = 'tarot-form-card';

    // Tiêu đề
    const title = document.createElement('h2');
    title.className = 'form-title';
    title.textContent = t('tarot_form_title');
    root.appendChild(title);

    // Khu vực cảnh báo nhạy cảm
    const alertBox = document.createElement('div');
    alertBox.className = 'form-alert-sensitive';
    alertBox.style.display = 'none';
    root.appendChild(alertBox);

    // Form inputs
    const form = document.createElement('form');
    form.className = 'tarot-form-body';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit(textarea.value, selectTopic.value as Topic, selectSpread.value as TarotSpreadType, alertBox);
    });

    // Nhập câu hỏi
    const textarea = document.createElement('textarea');
    textarea.className = 'form-textarea';
    textarea.placeholder = t('tarot_question_placeholder');
    textarea.maxLength = 200;
    textarea.rows = 3;
    form.appendChild(textarea);

    // Chọn chủ đề
    const topicGroup = document.createElement('div');
    topicGroup.className = 'form-group';
    const topicLabel = document.createElement('label');
    topicLabel.textContent = t('tarot_topic_label');
    const selectTopic = document.createElement('select');
    selectTopic.className = 'form-select';
    for (const item of TOPICS) {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.labelVi;
      selectTopic.appendChild(opt);
    }
    topicGroup.appendChild(topicLabel);
    topicGroup.appendChild(selectTopic);
    form.appendChild(topicGroup);

    // Chọn kiểu trải bài
    const spreadGroup = document.createElement('div');
    spreadGroup.className = 'form-group';
    const spreadLabel = document.createElement('label');
    spreadLabel.textContent = t('tarot_spread_label');
    const selectSpread = document.createElement('select');
    selectSpread.className = 'form-select';

    // Các spread tiêu biểu chuyên nghiệp (mục 5 docs/tarot_game_development_guide.md)
    const availableSpreads: TarotSpreadType[] = ['single', 'three_time', 'three_situation', 'three_mind'];
    for (const key of availableSpreads) {
      const def = TAROT_SPREADS[key];
      if (!def) continue;
      const opt = document.createElement('option');
      opt.value = def.type;
      opt.textContent = def.labelVi;
      selectSpread.appendChild(opt);
    }
    spreadGroup.appendChild(spreadLabel);
    spreadGroup.appendChild(selectSpread);
    form.appendChild(spreadGroup);

    // Nút bấm
    const btnGroup = document.createElement('div');
    btnGroup.className = 'form-btn-group';

    const btnSubmit = document.createElement('button');
    btnSubmit.type = 'submit';
    btnSubmit.className = 'btn btn-primary';
    btnSubmit.textContent = t('tarot_btn_start');

    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.className = 'btn btn-secondary';
    btnCancel.textContent = t('btn_back_menu');
    btnCancel.addEventListener('click', () => {
      this.callbacks.onCancel();
    });

    btnGroup.appendChild(btnSubmit);
    btnGroup.appendChild(btnCancel);
    form.appendChild(btnGroup);

    root.appendChild(form);

    this.element = root;
    parent.appendChild(root);
  }

  private handleSubmit(
    question: string,
    topic: Topic,
    spread: TarotSpreadType,
    alertBox: HTMLElement,
  ): void {
    // Kiểm tra câu hỏi nhạy cảm (R05 §4)
    if (isSensitiveQuestion(question)) {
      alertBox.textContent = t('sensitive_warning');
      alertBox.style.display = 'block';
      return;
    }

    alertBox.style.display = 'none';
    this.callbacks.onSubmit({
      question: question.trim(),
      topic,
      spread,
    });
  }

  unmount(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
