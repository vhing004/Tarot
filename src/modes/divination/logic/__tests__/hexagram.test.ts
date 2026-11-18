import { describe, expect, it } from 'vitest';
import type { RandomSource } from '@/core/Random';
import type { CoinLine } from '@/shared/types';
import {
  buildKeys,
  castHexagram,
  throwCoins,
} from '@/modes/divination/logic/hexagram';

describe('Hexagram Logic & Test Vectors (R04 §4, §5)', () => {
  it('3 ngửa -> sum 9, yang, moving', () => {
    // RNG luôn trả về 1 (ngửa = 3)
    const rngAlwaysHeads: RandomSource = { nextInt: () => 1 };
    const line = throwCoins(rngAlwaysHeads);
    expect(line.coins).toEqual([3, 3, 3]);
    expect(line.sum).toBe(9);
    expect(line.yang).toBe(true);
    expect(line.moving).toBe(true);
  });

  it('3 sấp -> sum 6, âm, moving', () => {
    // RNG luôn trả về 0 (sấp = 2)
    const rngAlwaysTails: RandomSource = { nextInt: () => 0 };
    const line = throwCoins(rngAlwaysTails);
    expect(line.coins).toEqual([2, 2, 2]);
    expect(line.sum).toBe(6);
    expect(line.yang).toBe(false);
    expect(line.moving).toBe(true);
  });

  it('2 ngửa -> sum 8, âm, tĩnh', () => {
    // Dãy trả về: ngửa (1), ngửa (1), sấp (0)
    let step = 0;
    const rng: RandomSource = {
      nextInt: () => {
        const val = step < 2 ? 1 : 0;
        step++;
        return val;
      },
    };
    const line = throwCoins(rng);
    expect(line.coins).toEqual([3, 3, 2]);
    expect(line.sum).toBe(8);
    expect(line.yang).toBe(false);
    expect(line.moving).toBe(false);
  });

  it('1 ngửa -> sum 7, dương, tĩnh', () => {
    // Dãy trả về: ngửa (1), sấp (0), sấp (0)
    let step = 0;
    const rng: RandomSource = {
      nextInt: () => {
        const val = step === 0 ? 1 : 0;
        step++;
        return val;
      },
    };
    const line = throwCoins(rng);
    expect(line.coins).toEqual([3, 2, 2]);
    expect(line.sum).toBe(7);
    expect(line.yang).toBe(true);
    expect(line.moving).toBe(false);
  });

  it('Thứ tự hào: hào 1 = dương, hào 2-6 = âm (tĩnh) -> primaryKey = "100000"', () => {
    const lines: CoinLine[] = [
      { coins: [3, 2, 2], sum: 7, yang: true, moving: false }, // Hào 1 (dưới cùng, index 0)
      { coins: [3, 3, 2], sum: 8, yang: false, moving: false }, // Hào 2
      { coins: [3, 3, 2], sum: 8, yang: false, moving: false }, // Hào 3
      { coins: [3, 3, 2], sum: 8, yang: false, moving: false }, // Hào 4
      { coins: [3, 3, 2], sum: 8, yang: false, moving: false }, // Hào 5
      { coins: [3, 3, 2], sum: 8, yang: false, moving: false }, // Hào 6 (trên cùng, index 5)
    ];

    const { primaryKey, changedKey, movingLines } = buildKeys(lines);
    expect(primaryKey).toBe('100000');
    expect(changedKey).toBeNull();
    expect(movingLines).toEqual([]);
  });

  it('Càn: 6 hào dương tĩnh -> "111111"', () => {
    const lines: CoinLine[] = Array.from({ length: 6 }, () => ({
      coins: [3, 2, 2],
      sum: 7,
      yang: true,
      moving: false,
    }));

    const { primaryKey, changedKey } = buildKeys(lines);
    expect(primaryKey).toBe('111111');
    expect(changedKey).toBeNull();
  });

  it('Khôn: 6 hào âm tĩnh -> "000000"', () => {
    const lines: CoinLine[] = Array.from({ length: 6 }, () => ({
      coins: [3, 3, 2],
      sum: 8,
      yang: false,
      moving: false,
    }));

    const { primaryKey, changedKey } = buildKeys(lines);
    expect(primaryKey).toBe('000000');
    expect(changedKey).toBeNull();
  });

  it('Truân: quẻ hạ Chấn (1,0,0), quẻ thượng Khảm (0,1,0) -> "100010"', () => {
    const lines: CoinLine[] = [
      { coins: [3, 2, 2], sum: 7, yang: true, moving: false }, // Hào 1: dương
      { coins: [3, 3, 2], sum: 8, yang: false, moving: false }, // Hào 2: âm
      { coins: [3, 3, 2], sum: 8, yang: false, moving: false }, // Hào 3: âm
      { coins: [3, 3, 2], sum: 8, yang: false, moving: false }, // Hào 4: âm
      { coins: [3, 2, 2], sum: 7, yang: true, moving: false }, // Hào 5: dương
      { coins: [3, 3, 2], sum: 8, yang: false, moving: false }, // Hào 6: âm
    ];

    const { primaryKey } = buildKeys(lines);
    expect(primaryKey).toBe('100010');
  });

  it('Mông: quẻ hạ Khảm (0,1,0), quẻ thượng Cấn (0,0,1) -> "010001"', () => {
    const lines: CoinLine[] = [
      { coins: [3, 3, 2], sum: 8, yang: false, moving: false }, // Hào 1: âm
      { coins: [3, 2, 2], sum: 7, yang: true, moving: false }, // Hào 2: dương
      { coins: [3, 3, 2], sum: 8, yang: false, moving: false }, // Hào 3: âm
      { coins: [3, 3, 2], sum: 8, yang: false, moving: false }, // Hào 4: âm
      { coins: [3, 3, 2], sum: 8, yang: false, moving: false }, // Hào 5: âm
      { coins: [3, 2, 2], sum: 7, yang: true, moving: false }, // Hào 6: dương
    ];

    const { primaryKey } = buildKeys(lines);
    expect(primaryKey).toBe('010001');
  });

  it('Quẻ biến: hào 1 là lão dương (9), hào 2-6 dương tĩnh (7) -> primary "111111", changed "011111", movingLines [1]', () => {
    const lines: CoinLine[] = [
      { coins: [3, 3, 3], sum: 9, yang: true, moving: true }, // Hào 1: lão dương (động)
      { coins: [3, 2, 2], sum: 7, yang: true, moving: false }, // Hào 2: thiếu dương (tĩnh)
      { coins: [3, 2, 2], sum: 7, yang: true, moving: false }, // Hào 3
      { coins: [3, 2, 2], sum: 7, yang: true, moving: false }, // Hào 4
      { coins: [3, 2, 2], sum: 7, yang: true, moving: false }, // Hào 5
      { coins: [3, 2, 2], sum: 7, yang: true, moving: false }, // Hào 6
    ];

    const { primaryKey, changedKey, movingLines } = buildKeys(lines);
    expect(primaryKey).toBe('111111');
    expect(changedKey).toBe('011111'); // Hào 1 biến thành âm (0)
    expect(movingLines).toEqual([1]);
  });

  it('castHexagram tạo ra đúng 6 hào từ CSPRNG', () => {
    const mockRng: RandomSource = { nextInt: () => 0 };
    const lines = castHexagram(mockRng);
    expect(lines.length).toBe(6);
    expect(lines.every((l) => l.sum === 6)).toBe(true);
  });

  it('buildKeys ném lỗi nếu không đủ 6 hào', () => {
    const badLines: CoinLine[] = [
      { coins: [3, 3, 2], sum: 8, yang: false, moving: false },
    ];
    expect(() => buildKeys(badLines)).toThrow('HEX: cần đúng 6 hào');
  });
});
