import { describe, expect, it } from 'vitest';
import { buildTarotInterpretation, getCardTopicMeaning } from '@/modes/tarot/logic/interpret';
import type { DrawnCard } from '@/shared/types';

const mockDrawnCards: DrawnCard[] = [
  {
    card: {
      id: 0,
      name: 'The Fool',
      nameVi: 'Chàng Khờ',
      suit: 'major',
      image: '/textures/tarot/00-fool.webp',
      keywords: ['khởi đầu mới', 'tự do'],
      symbolism: ['Mép vực đá', 'Hoa hồng trắng'],
      upright: 'Hành trình mới đầy hứa hẹn',
      reversed: 'Sự liều lĩnh thiếu cân nhắc',
      reflectionPrompts: ['Bạn đang ngần ngại điều gì trước cơ hội mới?'],
    },
    reversed: false,
    position: 'present',
  },
];

describe('Tarot Interpretation (R05 §3 & docs/tarot_game_development_guide.md)', () => {
  it('tạo lời giải đoán đầy đủ cấu trúc 5 phần chuẩn mực và gắn liền với câu hỏi', () => {
    const text = buildTarotInterpretation(mockDrawnCards, 'career', 'Tôi có nên chuyển việc không?');

    expect(text).toContain('Tôi có nên chuyển việc không?');
    expect(text).toContain('Chàng Khờ');
    expect(text).toContain('Xuôi (Upright');
    expect(text).toContain('Hành trình mới đầy hứa hẹn');
    expect(text).toContain('[Tiêu điểm chiêm bái]');
    expect(text).toContain('[Chiêm nghiệm từng lá theo lăng kính Công việc]');
    expect(text).toContain('[Dòng chảy nhân quả & Giải đáp băn khoăn]');
    expect(text).toContain('[Chiến lược hành động tỉnh thức]');
    expect(text).toContain('[Câu hỏi phản tư dành cho bạn]');
    expect(text).toContain('Bạn đang ngần ngại điều gì trước cơ hội mới?');
  });

  it('xử lý đúng lá bài bị ngược (reversed)', () => {
    const reversedCards: DrawnCard[] = [
      {
        ...mockDrawnCards[0]!,
        reversed: true,
      },
    ];

    const text = buildTarotInterpretation(reversedCards, 'general', '');
    expect(text).toContain('Ngược (Reversed');
    expect(text).toContain('Sự liều lĩnh thiếu cân nhắc');
  });

  it('soi chiếu đúng lăng kính 4 nguyên tố theo từng chủ đề với getCardTopicMeaning', () => {
    const card = mockDrawnCards[0]!.card;

    // Tình cảm (love)
    const loveUpright = getCardTopicMeaning(card, false, 'love');
    expect(loveUpright).toContain('tình cảm');

    // Công việc (career)
    const careerUpright = getCardTopicMeaning(card, false, 'career');
    expect(careerUpright).toContain('sự nghiệp');

    // Tài chính (money)
    const moneyUpright = getCardTopicMeaning(card, false, 'money');
    expect(moneyUpright).toContain('tài chính');

    // Sức khỏe (health)
    const healthReversed = getCardTopicMeaning(card, true, 'health');
    expect(healthReversed).toContain('sức khỏe');
  });
});
