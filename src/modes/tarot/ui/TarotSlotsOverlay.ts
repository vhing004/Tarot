import type { TarotSpreadType } from '@/modes/tarot/logic/spreads';
import { TAROT_SPREADS, POSITION_LABELS_VI } from '@/modes/tarot/logic/spreads';

export interface TarotSlotsCallbacks {
  onConfirm: () => void;
}

/**
 * TarotSlotsOverlay — Khu vực 3 Slot nhận bài [ QUÁ KHỨ ] [ HIỆN TẠI ] [ TƯƠNG LAI ]
 * Bao gồm thanh tiến trình 0/3..3/3 và nút "Xác nhận lựa chọn" phát sáng.
 * Dùng textContent/createElement (R06 §2). Responsive desktop/tablet/mobile (R03 §6).
 */
export class TarotSlotsOverlay {
  private root: HTMLElement | null = null;
  private slotEls: HTMLElement[] = [];
  private dotEls: HTMLElement[] = [];
  private progressTextEl: HTMLElement | null = null;
  private confirmBtnEl: HTMLElement | null = null;
  private callbacks: TarotSlotsCallbacks;

  private totalSlots = 3;
  private filledCount = 0;
  private positionKeys: readonly string[] = ['past', 'present', 'future'];

  constructor(callbacks: TarotSlotsCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Gắn overlay vào DOM, thiết lập số slot theo trải bài
   */
  mount(parent: HTMLElement, spreadType: TarotSpreadType): void {
    this.unmount();

    const def = TAROT_SPREADS[spreadType];
    this.positionKeys = def ? def.positions : ['past', 'present', 'future'];
    this.totalSlots = this.positionKeys.length;
    this.filledCount = 0;

    // Import CSS nếu chưa được load
    if (!document.querySelector('link[href*="tarot-slots.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/src/ui/styles/tarot-slots.css';
      document.head.appendChild(link);
    }

    const overlay = document.createElement('div');
    overlay.className = 'tarot-slots-overlay';

    // ── Hàng 3 Slot ──
    const slotsRow = document.createElement('div');
    slotsRow.className = 'tarot-slots-row';
    this.slotEls = [];

    for (let i = 0; i < this.totalSlots; i++) {
      const posKey = this.positionKeys[i] ?? 'present';
      const posLabel = POSITION_LABELS_VI[posKey] ?? posKey;

      const slot = document.createElement('div');
      slot.className = 'tarot-card-slot empty';
      slot.dataset['slotIndex'] = String(i);

      const icon = document.createElement('div');
      icon.className = 'tarot-slot-icon';
      icon.textContent = '✦';

      const label = document.createElement('div');
      label.className = 'tarot-slot-label';
      label.textContent = posLabel;

      slot.appendChild(icon);
      slot.appendChild(label);
      slotsRow.appendChild(slot);
      this.slotEls.push(slot);
    }

    overlay.appendChild(slotsRow);

    // ── Thanh tiến trình ──
    const progressBar = document.createElement('div');
    progressBar.className = 'tarot-progress-bar';

    const progressText = document.createElement('div');
    progressText.className = 'tarot-progress-text';
    progressText.textContent = `Đã chọn: 0/${this.totalSlots} lá bài`;
    this.progressTextEl = progressText;

    const dots = document.createElement('div');
    dots.className = 'tarot-progress-dots';
    this.dotEls = [];

    for (let i = 0; i < this.totalSlots; i++) {
      const dot = document.createElement('div');
      dot.className = 'tarot-progress-dot';
      dots.appendChild(dot);
      this.dotEls.push(dot);
    }

    progressBar.appendChild(progressText);
    progressBar.appendChild(dots);
    overlay.appendChild(progressBar);

    // ── Nút Xác nhận lựa chọn ──
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'tarot-confirm-btn';
    confirmBtn.type = 'button';

    const btnIcon = document.createElement('span');
    btnIcon.className = 'tarot-confirm-btn-icon';
    btnIcon.textContent = '✦';

    const btnText = document.createElement('span');
    btnText.textContent = 'Xác nhận lựa chọn';

    confirmBtn.appendChild(btnIcon);
    confirmBtn.appendChild(btnText);
    confirmBtn.addEventListener('click', () => {
      this.callbacks.onConfirm();
    });
    this.confirmBtnEl = confirmBtn;
    overlay.appendChild(confirmBtn);

    parent.appendChild(overlay);
    this.root = overlay;
  }

  /**
   * Đánh dấu slot thứ slotIndex đang được nhắm đến (lá bài đang bay tới)
   */
  targetSlot(slotIndex: number): void {
    const slot = this.slotEls[slotIndex];
    if (!slot) return;
    slot.classList.remove('empty');
    slot.classList.add('targeted');
  }

  /**
   * Đánh dấu slot thứ slotIndex đã nhận bài thành công, bắn hạt sáng
   */
  fillSlot(slotIndex: number): void {
    const slot = this.slotEls[slotIndex];
    if (!slot) return;

    slot.classList.remove('targeted', 'empty');
    slot.classList.add('filled');

    // Thêm biểu tượng xác nhận vào slot
    const preview = document.createElement('div');
    preview.className = 'tarot-slot-card-preview';
    preview.textContent = '✦';
    slot.appendChild(preview);

    // Bắn hạt sáng ma thuật
    this.burstSlotParticles(slot);

    this.filledCount++;
    this.updateProgress();
  }

  /**
   * Cập nhật thanh tiến trình và bật nút Xác nhận khi đủ lá
   */
  private updateProgress(): void {
    if (this.progressTextEl) {
      if (this.filledCount >= this.totalSlots) {
        this.progressTextEl.textContent = `✦ Đã chọn đủ ${this.totalSlots}/${this.totalSlots} lá bài ✦`;
      } else {
        this.progressTextEl.textContent = `Đã chọn: ${this.filledCount}/${this.totalSlots} lá bài`;
      }
    }

    // Cập nhật chấm tiến trình
    for (let i = 0; i < this.dotEls.length; i++) {
      const dot = this.dotEls[i];
      if (!dot) continue;
      if (i < this.filledCount) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    }

    // Hiện nút Xác nhận khi đủ số lá
    if (this.filledCount >= this.totalSlots && this.confirmBtnEl) {
      this.confirmBtnEl.classList.add('visible');
    }
  }

  /**
   * Ẩn nút Xác nhận (sau khi người dùng đã nhấn)
   */
  hideConfirmButton(): void {
    if (this.confirmBtnEl) {
      this.confirmBtnEl.classList.remove('visible');
      this.confirmBtnEl.style.display = 'none';
    }
  }

  /**
   * Ẩn toàn bộ overlay (gọi trước hoạt cảnh INSPECT)
   */
  hide(): void {
    if (this.root) {
      this.root.style.opacity = '0';
      this.root.style.pointerEvents = 'none';
      setTimeout(() => {
        if (this.root) this.root.style.display = 'none';
      }, 400);
    }
  }

  /**
   * Gỡ overlay khỏi DOM và dọn dẹp
   */
  unmount(): void {
    if (this.root) {
      this.root.remove();
      this.root = null;
    }
    this.slotEls = [];
    this.dotEls = [];
    this.progressTextEl = null;
    this.confirmBtnEl = null;
    this.filledCount = 0;
  }

  /**
   * Bắn hạt sáng ma thuật từ slot khi nhận bài thành công
   */
  private burstSlotParticles(slotEl: HTMLElement): void {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'slot-particle';
      const angle = (i / count) * Math.PI * 2;
      const dist = 20 + Math.random() * 20; // allow:R02-any view decoration
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      p.style.left = '50%';
      p.style.top = '50%';
      p.style.transform = `translate(${tx}px, ${ty}px)`;
      p.style.animationDelay = `${i * 0.04}s`;
      slotEl.appendChild(p);
      setTimeout(() => p.remove(), 1200);
    }
  }
}
