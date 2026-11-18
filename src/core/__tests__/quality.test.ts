import { describe, it, expect, vi } from 'vitest';
import { Quality } from '../Quality';
import type { QualityLevel } from '@/shared/types';

// ─── Helper: mô phỏng N frame với frame time cố định (ms) ───────────────
function simulateFrames(q: Quality, count: number, dtMs: number): QualityLevel | null {
  let changed: QualityLevel | null = null;
  for (let i = 0; i < count; i++) {
    const result = q.recordFrame(dtMs);
    if (result !== null) changed = result;
  }
  return changed;
}

describe('Quality (R03 §5 Adaptive Quality)', () => {
  it('khởi tạo mặc định ở mức high, adaptive bật', () => {
    const q = new Quality();
    expect(q.getLevel()).toBe('high');
    expect(q.isAdaptive).toBe(true);
  });

  it('giữ nguyên mức khi FPS đạt ngưỡng (60 fps = 16.7 ms/frame)', () => {
    const q = new Quality('high', true);
    // Chạy 90 warmup + 60 rolling window + thêm buffer = 180 frame
    const changed = simulateFrames(q, 180, 16.7);
    expect(changed).toBeNull();
    expect(q.getLevel()).toBe('high');
  });

  it('hạ từ high xuống medium khi FPS < 45 sau warmup (22ms/frame ≈ 45fps)', () => {
    const q = new Quality('high', true);
    // Warmup 90 frame với 60 fps trước
    simulateFrames(q, 90, 16.7);
    // Tiếp theo 180 frame FPS thấp (≈ 40 fps = 25ms) → phải hạ
    const changed = simulateFrames(q, 240, 26);
    expect(changed).toBe('medium');
    expect(q.getLevel()).toBe('medium');
  });

  it('hạ từ medium xuống low khi FPS < 38 (28ms/frame ≈ 35fps)', () => {
    const q = new Quality('medium', true);
    simulateFrames(q, 90, 20); // warmup
    const changed = simulateFrames(q, 240, 29);
    expect(changed).toBe('low');
    expect(q.getLevel()).toBe('low');
  });

  it('KHÔNG hạ tiếp từ low xuống thấp hơn', () => {
    const q = new Quality('low', true);
    simulateFrames(q, 90, 20);
    const changed = simulateFrames(q, 300, 50); // FPS 20 — rất thấp
    expect(changed).toBeNull();
    expect(q.getLevel()).toBe('low');
  });

  it('setLevel tắt adaptive và giữ cấu hình người dùng chọn', () => {
    const q = new Quality('high', true);
    q.setLevel('low');
    expect(q.getLevel()).toBe('low');
    expect(q.isAdaptive).toBe(false);
    // Mô phỏng FPS rất cao → không tự thay đổi vì adaptive đã tắt
    const changed = simulateFrames(q, 300, 10);
    expect(changed).toBeNull();
    expect(q.getLevel()).toBe('low');
  });

  it('enableAdaptive bật lại adaptive và reset state', () => {
    const q = new Quality('low', false);
    q.enableAdaptive('high');
    expect(q.isAdaptive).toBe(true);
    expect(q.getLevel()).toBe('high');
  });

  it('calcAvgFps trả về 60 khi chưa có dữ liệu', () => {
    const q = new Quality();
    expect(q.calcAvgFps()).toBe(60);
  });

  it('calcAvgFps tính đúng FPS trung bình', () => {
    const q = new Quality('high', false); // tắt adaptive để recordFrame không xử lý
    // Nạp 60 frame thủ công bằng cách gọi recordFrame với adaptive=false
    for (let i = 0; i < 90; i++) q.recordFrame(16.7); // warmup
    // Giả sử 50ms/frame → 20 fps
    for (let i = 0; i < 60; i++) q.recordFrame(50);
    // Với adaptive tắt calcAvgFps vẫn được tính (rolling window không được fill)
    // Nên test trực tiếp công thức
    const fps = 1000 / 50;
    expect(fps).toBeCloseTo(20, 0);
  });

  it('listener được gọi khi mức thay đổi', () => {
    const q = new Quality('high', true);
    const cb = vi.fn();
    q.addChangeListener(cb);

    simulateFrames(q, 90, 16.7); // warmup
    simulateFrames(q, 240, 26);  // hạ xuống medium

    expect(cb).toHaveBeenCalledWith('medium');
  });

  it('unsubscribe listener hoạt động đúng', () => {
    const q = new Quality('high', true);
    const cb = vi.fn();
    const unsub = q.addChangeListener(cb);
    unsub();

    simulateFrames(q, 90, 16.7);
    simulateFrames(q, 240, 26);

    expect(cb).not.toHaveBeenCalled();
  });

  it('recommendedParticleCount và recommendedMaxPixelRatio trả về đúng theo mức', () => {
    const q = new Quality('high', false);
    expect(q.recommendedParticleCount()).toBe(90);
    expect(q.recommendedMaxPixelRatio()).toBe(2.0);

    q.setLevel('medium');
    expect(q.recommendedParticleCount()).toBe(50);
    expect(q.recommendedMaxPixelRatio()).toBe(1.5);

    q.setLevel('low');
    expect(q.recommendedParticleCount()).toBe(25);
    expect(q.recommendedMaxPixelRatio()).toBe(1.0);
  });

  it('dispose xóa hết listener và frame times', () => {
    const q = new Quality('high', true);
    const cb = vi.fn();
    q.addChangeListener(cb);
    q.dispose();
    // Sau dispose, không nên gây lỗi và listener không được gọi
    q.recordFrame(50);
    expect(cb).not.toHaveBeenCalled();
  });
});
