import { describe, expect, it } from 'vitest';
import hexagramsJson from '@/modes/divination/data/hexagrams.json';
import sourcesMd from '@/modes/divination/data/SOURCES.md?raw';
import type { Hexagram } from '@/shared/types';

describe('Hexagrams Data Verification (Gate G5)', () => {
  it('SOURCES.md phải tồn tại và ghi nhận bản quyền hợp lệ', () => {
    expect(typeof sourcesMd).toBe('string');
    expect(sourcesMd.length).toBeGreaterThan(0);
    expect(sourcesMd).toContain('Public Domain');
  });

  it('toàn bộ key trong hexagrams.json phải là chuỗi 6 ký tự nhị phân [01]', () => {
    const data = hexagramsJson as unknown as Record<string, Hexagram>;
    const keys = Object.keys(data);

    expect(keys.length).toBeGreaterThanOrEqual(8);

    for (const key of keys) {
      expect(key).toMatch(/^[01]{6}$/);

      const hex = data[key]!;
      expect(typeof hex.id).toBe('number');
      expect(typeof hex.name).toBe('string');
      expect(hex.name.trim().length).toBeGreaterThan(0);

      expect(typeof hex.nameVi).toBe('string');
      expect(hex.nameVi.trim().length).toBeGreaterThan(0);

      expect(typeof hex.judgement).toBe('string');
      expect(hex.judgement.trim().length).toBeGreaterThan(0);

      expect(Array.isArray(hex.lines)).toBe(true);
      expect(hex.lines.length).toBe(6);
      for (const line of hex.lines) {
        expect(typeof line).toBe('string');
        expect(line.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('phải chứa đầy đủ các quẻ bắt buộc cho test vectors', () => {
    const data = hexagramsJson as unknown as Record<string, Hexagram>;

    expect(data['111111']).toBeDefined(); // Thuần Càn
    expect(data['000000']).toBeDefined(); // Thuần Khôn
    expect(data['100010']).toBeDefined(); // Thủy Lôi Truân
    expect(data['010001']).toBeDefined(); // Sơn Thủy Mông
    expect(data['011111']).toBeDefined(); // Thiên Phong Cấu
  });
});
