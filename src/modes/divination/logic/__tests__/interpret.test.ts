import { describe, expect, it } from 'vitest';
import { lookupHexagram } from '@/modes/divination/logic/lookup';
import { buildDivinationInterpretation } from '@/modes/divination/logic/interpret';
import type { DivinationResult } from '@/shared/types';

describe('Divination Interpretation & Lookup (R04, R05)', () => {
  it('lookupHexagram tìm thấy đúng quẻ Thuần Càn', () => {
    const qian = lookupHexagram('111111');
    expect(qian.id).toBe(1);
    expect(qian.nameVi).toContain('Thuần Càn');
    expect(qian.lines.length).toBe(6);
  });

  it('lookupHexagram ném lỗi khi key không hợp lệ', () => {
    expect(() => lookupHexagram('111')).toThrow('không hợp lệ');
    expect(() => lookupHexagram('abcdef')).toThrow('không hợp lệ');
  });

  it('lookupHexagram trả về fallback khi quẻ chưa có trong tập mẫu', () => {
    const fallback = lookupHexagram('101100');
    expect(fallback.id).toBe(0);
    expect(fallback.nameVi).toContain('Đang cập nhật');
  });

  it('tạo lời giải đoán đầy đủ cho quẻ có hào động và quẻ biến', () => {
    const result: DivinationResult = {
      lines: [
        { coins: [3, 3, 3], sum: 9, yang: true, moving: true }, // Hào 1 động
        { coins: [3, 2, 2], sum: 7, yang: true, moving: false },
        { coins: [3, 2, 2], sum: 7, yang: true, moving: false },
        { coins: [3, 2, 2], sum: 7, yang: true, moving: false },
        { coins: [3, 2, 2], sum: 7, yang: true, moving: false },
        { coins: [3, 2, 2], sum: 7, yang: true, moving: false },
      ],
      primaryKey: '111111',
      changedKey: '011111',
      movingLines: [1],
    };

    const qian = lookupHexagram('111111');
    const gou = lookupHexagram('011111');
    const interp = buildDivinationInterpretation(result, qian, gou, 'career', 'Dự án này thế nào?');

    expect(interp).toContain('Dự án này thế nào?');
    expect(interp).toContain('QUẺ CHỦ: Thuần Càn');
    expect(interp).toContain('CÁC HÀO ĐỘNG (1 hào):');
    expect(interp).toContain('Sơ Cửu (Hào 1)');
    expect(interp).toContain('QUẺ BIẾN: Thiên Phong Cấu');
  });
});
