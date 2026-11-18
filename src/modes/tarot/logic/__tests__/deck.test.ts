import { describe, expect, it } from 'vitest';
import { drawCards } from '@/modes/tarot/logic/deck';
import type { RandomSource } from '@/core/Random';
import type { TarotCard } from '@/shared/types';

const mockDeck: TarotCard[] = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  name: `Card ${i}`,
  nameVi: `Lá bài ${i}`,
  image: `/textures/tarot/${i}.webp`,
  keywords: ['thử nghiệm'],
  upright: 'Nghĩa xuôi',
  reversed: 'Nghĩa ngược',
}));

describe('Tarot Deck Logic (R04 §3)', () => {
  it('rút 1 lá duy nhất và không vượt quá số lá', () => {
    const drawn = drawCards(mockDeck, ['present']);
    expect(drawn.length).toBe(1);
    expect(drawn[0]?.position).toBe('present');
    expect(typeof drawn[0]?.reversed).toBe('boolean');
  });

  it('rút 3 lá không trùng lặp lá nào', () => {
    const positions = ['past', 'present', 'future'];
    const drawn = drawCards(mockDeck, positions);
    expect(drawn.length).toBe(3);

    const ids = drawn.map((d) => d.card.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
    expect(drawn.map((d) => d.position)).toEqual(positions);
  });

  it('xác định xuôi/ngược bằng RandomSource giả lập', () => {
    // Luôn trả về 1 cho nextInt(2) => reversed = true
    const reverseRng: RandomSource = {
      nextInt(max) {
        if (max === 2) return 1;
        return 0;
      },
    };

    const drawn = drawCards(mockDeck, ['present'], reverseRng);
    expect(drawn[0]?.reversed).toBe(true);

    // Luôn trả về 0 cho nextInt(2) => reversed = false
    const uprightRng: RandomSource = {
      nextInt(max) {
        if (max === 2) return 0;
        return 0;
      },
    };

    const drawnUpright = drawCards(mockDeck, ['present'], uprightRng);
    expect(drawnUpright[0]?.reversed).toBe(false);
  });

  it('ném lỗi khi số lá yêu cầu rút vượt quá số lá trong bộ bài', () => {
    const tooMany = Array.from({ length: 25 }, (_, i) => `pos_${i}`);
    expect(() => drawCards(mockDeck, tooMany)).toThrow('không hợp lệ');
  });
});
