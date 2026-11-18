export interface RandomSource {
  nextInt(maxExclusive: number): number;
}

/**
 * Trình sinh số ngẫu nhiên mật mã (CSPRNG) sử dụng Rejection Sampling
 * để loại bỏ hoàn toàn modulo bias (R04 §2).
 */
export const cryptoRandom: RandomSource = {
  nextInt(max: number): number {
    if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) {
      throw new Error('RNG: max không hợp lệ, phải là số nguyên > 0 và <= 2^32');
    }
    if (max === 1) {
      return 0;
    }

    // Rejection sampling để tránh sai lệch phân phối (modulo bias)
    const limit = Math.floor((2 ** 32) / max) * max;
    const buf = new Uint32Array(1);
    do {
      crypto.getRandomValues(buf);
    } while ((buf[0] as number) >= limit);

    return (buf[0] as number) % max;
  },
};

/**
 * Xáo trộn mảng dùng giải thuật Fisher-Yates không làm thay đổi mảng gốc.
 */
export function shuffle<T>(items: readonly T[], rng: RandomSource = cryptoRandom): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const temp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = temp;
  }
  return a;
}
