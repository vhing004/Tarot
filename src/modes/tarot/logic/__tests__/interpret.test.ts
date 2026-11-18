import { describe, expect, it } from 'vitest';
import { buildTarotInterpretation } from '@/modes/tarot/logic/interpret';
import type { DrawnCard } from '@/shared/types';

const mockDrawnCards: DrawnCard[] = [
  {
    card: {
      id: 0,
      name: 'The Fool',
      nameVi: 'Chàng Khờ',
      image: '/textures/tarot/00-fool.webp',
      keywords: ['khởi đầu mới', 'tự do'],
      upright: 'Hành trình mới đầy hứa hẹn',
      reversed: 'Sự liều lĩnh thiếu cân nhắc',
    },
    reversed: false,
    position: 'present',
  },
];

describe('Tarot Interpretation (R05 §3)', () => {
  it('tạo lời giải đoán đầy đủ trường cho trải 1 lá', () => {
    const text = buildTarotInterpretation(mockDrawnCards, 'career', 'Tôi có nên chuyển việc không?');

    expect(text).toContain('Tôi có nên chuyển việc không?');
    expect(text).toContain('Chàng Khờ');
    expect(text).toContain('Xuôi (Upright)');
    expect(text).toContain('Hành trình mới đầy hứa hẹn');
    expect(text).toContain('Lời khuyên tổng hòa:');
  });

  it('xử lý đúng lá bài bị ngược (reversed)', () => {
    const reversedCards: DrawnCard[] = [
      {
        ...mockDrawnCards[0]!,
        reversed: true,
      },
    ];

    const text = buildTarotInterpretation(reversedCards, 'general', '');
    expect(text).toContain('Ngược (Reversed)');
    expect(text).toContain('Sự liều lĩnh thiếu cân nhắc');
  });
});
