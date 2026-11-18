import { cryptoRandom, type RandomSource, shuffle } from '@/core/Random';
import type { DrawnCard, TarotCard } from '@/shared/types';

/**
 * Rút N lá bài ngẫu nhiên từ bộ bài Tarot (R04 §3).
 * Kết quả được chốt bằng CSPRNG trước khi diễn hoạt.
 */
export function drawCards(
  deck: readonly TarotCard[],
  positions: readonly string[],
  rng: RandomSource = cryptoRandom,
): DrawnCard[] {
  const count = positions.length;
  if (count <= 0 || count > deck.length) {
    throw new Error(`Tarot: số lá rút (${count}) không hợp lệ (bộ bài có ${deck.length} lá)`);
  }

  // Xáo trộn toàn bộ bộ bài bằng Fisher-Yates
  const shuffled = shuffle(deck, rng);

  const drawn: DrawnCard[] = [];
  for (let i = 0; i < count; i++) {
    const card = shuffled[i];
    if (!card) {
      throw new Error(`Tarot: không tìm thấy lá bài tại vị trí index ${i}`);
    }

    // Xác định lá bài xuôi (upright) hay ngược (reversed) bằng RNG
    const reversed = rng.nextInt(2) === 1;
    const position = positions[i] ?? `pos_${i}`;

    drawn.push({
      card,
      reversed,
      position,
    });
  }

  return drawn;
}
