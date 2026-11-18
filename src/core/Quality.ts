import type { QualityLevel } from '@/shared/types';

/** Callback gọi khi mức chất lượng thay đổi (do adaptive hoặc người dùng) */
export type QualityChangeCallback = (level: QualityLevel) => void;

/** Kích thước cửa sổ rolling FPS (đơn vị: frame) */
const FPS_WINDOW = 60;
/** Ngưỡng FPS để hạ từ high xuống medium */
const FPS_THRESHOLD_HIGH_TO_MED = 45;
/** Ngưỡng FPS để hạ từ medium xuống low */
const FPS_THRESHOLD_MED_TO_LOW = 38;
/** Chờ ít nhất bao nhiêu frame trước khi xem xét hạ cấu hình (tránh hạ ngay lúc load) */
const WARMUP_FRAMES = 90;

export class Quality {
  private currentLevel: QualityLevel = 'high';
  private adaptiveEnabled: boolean = true;

  /** Rolling window lưu frame times (ms) gần nhất */
  private frameTimes: number[] = [];
  private frameCount = 0;
  private lastChangeFrame = 0;
  /** Số frame tối thiểu giữa hai lần thay đổi cấu hình tự động */
  private changeDebounceFrames = 120;

  private listeners: Set<QualityChangeCallback> = new Set();

  constructor(initialLevel: QualityLevel = 'high', adaptive = true) {
    this.currentLevel = initialLevel;
    this.adaptiveEnabled = adaptive;
  }

  // ─── API công khai ───────────────────────────────────────────────────────

  getLevel(): QualityLevel {
    return this.currentLevel;
  }

  /**
   * Đặt mức chất lượng thủ công (người dùng lựa chọn).
   * Tắt adaptive để không bị ghi đè lại.
   */
  setLevel(level: QualityLevel): void {
    this.adaptiveEnabled = false;
    this.applyLevel(level);
  }

  /**
   * Bật adaptive quality và đặt lại mức ban đầu.
   * Thường gọi khi người dùng chọn "Tự động" trong Settings.
   */
  enableAdaptive(startLevel: QualityLevel = 'high'): void {
    this.adaptiveEnabled = true;
    this.frameTimes = [];
    this.frameCount = 0;
    this.lastChangeFrame = 0;
    this.applyLevel(startLevel);
  }

  get isAdaptive(): boolean {
    return this.adaptiveEnabled;
  }

  isShadowsEnabled(): boolean {
    return this.currentLevel === 'high';
  }

  isBloomEnabled(): boolean {
    return this.currentLevel === 'high';
  }

  /**
   * Số lượng hạt khói được khuyến nghị theo cấu hình hiện tại.
   * SmokeParticles sẽ dùng giá trị này khi tái tạo.
   */
  recommendedParticleCount(): number {
    if (this.currentLevel === 'low') return 25;
    if (this.currentLevel === 'medium') return 50;
    return 90;
  }

  /**
   * Pixel ratio tối đa khuyến nghị theo cấu hình.
   * Engine gọi sau mỗi lần chuyển mức.
   */
  recommendedMaxPixelRatio(): number {
    if (this.currentLevel === 'low') return 1.0;
    if (this.currentLevel === 'medium') return 1.5;
    return 2.0;
  }

  /**
   * Gọi mỗi frame với delta time (ms). Engine hoặc main loop gọi hàm này.
   * Trả về mức mới nếu vừa thay đổi (để Engine cập nhật pixelRatio), ngược lại null.
   */
  recordFrame(dtMs: number): QualityLevel | null {
    this.frameCount++;

    if (!this.adaptiveEnabled) return null;
    // Chờ warmup
    if (this.frameCount < WARMUP_FRAMES) return null;

    // Rolling window
    this.frameTimes.push(dtMs);
    if (this.frameTimes.length > FPS_WINDOW) {
      this.frameTimes.shift();
    }

    // Chỉ kiểm sau khi có đủ dữ liệu
    if (this.frameTimes.length < FPS_WINDOW) return null;

    // Chống debounce: không hạ liên tục
    if (this.frameCount - this.lastChangeFrame < this.changeDebounceFrames) return null;

    const avgFps = this.calcAvgFps();
    const before = this.currentLevel;

    if (this.currentLevel === 'high' && avgFps < FPS_THRESHOLD_HIGH_TO_MED) {
      this.lastChangeFrame = this.frameCount;
      this.applyLevel('medium');
    } else if (this.currentLevel === 'medium' && avgFps < FPS_THRESHOLD_MED_TO_LOW) {
      this.lastChangeFrame = this.frameCount;
      this.applyLevel('low');
    }

    return this.currentLevel !== before ? this.currentLevel : null;
  }

  /**
   * Tính FPS trung bình hiện tại dựa trên rolling window.
   * Trả về 60 khi chưa đủ dữ liệu.
   */
  calcAvgFps(): number {
    if (this.frameTimes.length === 0) return 60;
    const totalMs = this.frameTimes.reduce((sum, v) => sum + v, 0);
    const avgMs = totalMs / this.frameTimes.length;
    return avgMs > 0 ? 1000 / avgMs : 60;
  }

  /** Đăng ký lắng nghe sự kiện thay đổi cấu hình */
  addChangeListener(cb: QualityChangeCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  dispose(): void {
    this.frameTimes = [];
    this.listeners.clear();
  }

  // ─── nội bộ ────────────────────────────────────────────────────────────

  private applyLevel(level: QualityLevel): void {
    if (this.currentLevel === level) return;
    this.currentLevel = level;
    // Reset window để không bị kẹt vòng lặp hạ cấu hình
    this.frameTimes = [];
    this.listeners.forEach((cb) => cb(level));
  }
}
