import { cryptoRandom, type RandomSource } from '@/core/Random';
import type { CoinLine } from '@/shared/types';

/**
 * Gieo 3 đồng xu một lần (R04 §4).
 * Ngửa = 3, Sấp = 2.
 */
export function throwCoins(rng: RandomSource = cryptoRandom): CoinLine {
  // Mỗi xu: 1 là ngửa (3 điểm), 0 là sấp (2 điểm)
  const coins = [0, 1, 2].map(() => (rng.nextInt(2) === 1 ? 3 : 2)) as [
    2 | 3,
    2 | 3,
    2 | 3,
  ];

  const sum = (coins[0] + coins[1] + coins[2]) as 6 | 7 | 8 | 9;
  const yang = sum === 7 || sum === 9;
  const moving = sum === 6 || sum === 9;

  return {
    coins,
    sum,
    yang,
    moving,
  };
}

/**
 * Gieo trọn vẹn 6 hào quẻ Kinh Dịch (R04 §4).
 * Index 0 = Hào 1 (Sơ Hào - dưới cùng).
 * Index 5 = Hào 6 (Thượng Hào - trên cùng).
 */
export function castHexagram(rng: RandomSource = cryptoRandom): CoinLine[] {
  return Array.from({ length: 6 }, () => throwCoins(rng));
}

/**
 * Dựng primaryKey (quẻ chủ), changedKey (quẻ biến) và danh sách hào động từ 6 hào (R04 §4).
 * primaryKey: Ký tự đầu tiên tương ứng với Hào 1 (dưới cùng).
 */
export function buildKeys(lines: readonly CoinLine[]): {
  primaryKey: string;
  changedKey: string | null;
  movingLines: number[];
} {
  if (lines.length !== 6) {
    throw new Error('HEX: cần đúng 6 hào để dựng quẻ');
  }

  // flip = true: đảo hào nếu là hào động
  const bit = (l: CoinLine, flip: boolean) =>
    (flip ? (l.moving ? !l.yang : l.yang) : l.yang) ? '1' : '0';

  const primaryKey = lines.map((l) => bit(l, false)).join('');
  const hasMoving = lines.some((l) => l.moving);
  const changedKey = hasMoving ? lines.map((l) => bit(l, true)).join('') : null;
  const movingLines = lines.flatMap((l, i) => (l.moving ? [i + 1] : []));

  return {
    primaryKey,
    changedKey,
    movingLines,
  };
}
