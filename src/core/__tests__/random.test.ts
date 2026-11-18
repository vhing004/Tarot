import { describe, expect, it } from 'vitest';
import { cryptoRandom, type RandomSource, shuffle } from '@/core/Random';

describe('Random Module (R04)', () => {
  it('cryptoRandom.nextInt(1) luôn trả về 0', () => {
    for (let i = 0; i < 50; i++) {
      expect(cryptoRandom.nextInt(1)).toBe(0);
    }
  });

  it('cryptoRandom.nextInt ném lỗi khi max <= 0 hoặc không phải số nguyên', () => {
    expect(() => cryptoRandom.nextInt(0)).toThrow('RNG: max không hợp lệ');
    expect(() => cryptoRandom.nextInt(-5)).toThrow('RNG: max không hợp lệ');
    expect(() => cryptoRandom.nextInt(1.5)).toThrow('RNG: max không hợp lệ');
  });

  it('cryptoRandom.nextInt(max) luôn nằm trong khoảng [0, max - 1]', () => {
    const max = 6;
    for (let i = 0; i < 1000; i++) {
      const val = cryptoRandom.nextInt(max);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(max);
    }
  });

  it('shuffle hoán vị đúng với RandomSource giả lập', () => {
    // Dãy trả về tuần tự từ RNG giả lập
    const mockRng: RandomSource = {
      nextInt(max) {
        return max - 1; // Luôn lấy phần tử cuối, không đổi vị trí
      },
    };
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input, mockRng);
    expect(result).toEqual([1, 2, 3, 4, 5]);
    expect(result).not.toBe(input); // Đảm bảo tạo bản sao mới
  });

  it('shuffle bảo toàn đầy đủ các phần tử ban đầu', () => {
    const cards = Array.from({ length: 22 }, (_, i) => i);
    const shuffled = shuffle(cards);
    expect(shuffled.length).toBe(22);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(cards);
  });

  it('kiểm tra phân phối thống kê trên 10^4 mẫu ngẫu nhiên', () => {
    const counts = [0, 0, 0, 0];
    const total = 10000;
    for (let i = 0; i < total; i++) {
      const v = cryptoRandom.nextInt(4);
      counts[v] = (counts[v] ?? 0) + 1;
    }
    // Mỗi giá trị mong muốn ~2500, kiểm tra dung sai 2000 - 3000
    for (let i = 0; i < 4; i++) {
      const c = counts[i] ?? 0;
      expect(c).toBeGreaterThan(2000);
      expect(c).toBeLessThan(3000);
    }
  });
});
