import { describe, expect, it } from 'vitest';
import { summarizeReading } from '@/services/reading';
import type { Reading } from '@/shared/types';

describe('Reading Summary Service (R05 §5)', () => {
  it('tóm tắt chính xác lượt bói Tarot', () => {
    const reading: Reading = {
      id: 'tarot-1',
      mode: 'tarot',
      question: 'Chuyện tình cảm có tiến triển không?',
      topic: 'love',
      createdAt: 1700000000000,
      result: {
        spread: 'single',
        cards: [
          {
            card: {
              id: 6,
              name: 'The Lovers',
              nameVi: 'Cặp Đôi',
              image: '/textures/tarot/06-lovers.webp',
              keywords: ['tình cảm'],
              symbolism: ['Hai nhân vật', 'Thiên thần'],
              reflectionPrompts: ['Điều gì kết nối bạn với người kia?'],
              upright: 'Hòa hợp',
              reversed: 'Mâu thuẫn',
            },
            reversed: false,
            position: 'present',
          },
        ],
      },
      interpretation: 'Một mối quan hệ hòa hợp sâu sắc.',
    };

    const summary = summarizeReading(reading);
    expect(summary.title).toContain('Tarot: Cặp Đôi');
    expect(summary.subtitle).toContain('Tình cảm');
    expect(summary.previewText).toBe('"Chuyện tình cảm có tiến triển không?"');
    expect(summary.timeFormatted).toBeDefined();
  });

  it('tóm tắt chính xác lượt bói Kinh Dịch có hào động', () => {
    const reading: Reading = {
      id: 'div-1',
      mode: 'divination',
      question: '',
      topic: 'career',
      createdAt: 1700000000000,
      result: {
        lines: [
          { coins: [3, 3, 3], sum: 9, yang: true, moving: true },
          { coins: [3, 2, 2], sum: 7, yang: true, moving: false },
          { coins: [3, 2, 2], sum: 7, yang: true, moving: false },
          { coins: [3, 2, 2], sum: 7, yang: true, moving: false },
          { coins: [3, 2, 2], sum: 7, yang: true, moving: false },
          { coins: [3, 2, 2], sum: 7, yang: true, moving: false },
        ],
        primaryKey: '111111',
        changedKey: '011111',
        movingLines: [1],
      },
      interpretation: 'Thời kỳ chuyển hóa mạnh mẽ.',
    };

    const summary = summarizeReading(reading);
    expect(summary.title).toContain('Thuần Càn (Trời) ➔');
    expect(summary.subtitle).toContain('1 hào động • Công việc');
    expect(summary.previewText).toContain('Thời kỳ chuyển hóa mạnh mẽ.');
  });
});
