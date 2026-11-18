import { TOPICS } from '@/shared/constants';
import type { DrawnCard, Topic } from '@/shared/types';
import { POSITION_LABELS_VI } from '@/modes/tarot/logic/spreads';

/**
 * Tổng hợp lời giải đoán từ các lá bài đã rút theo chủ đề và vị trí (R05 §3).
 */
export function buildTarotInterpretation(
  cards: readonly DrawnCard[],
  topic: Topic,
  question: string,
): string {
  const topicObj = TOPICS.find((t) => t.id === topic);
  const topicLabel = topicObj ? topicObj.labelVi : 'Tổng quan';

  const sections: string[] = [];

  if (question.trim().length > 0) {
    sections.push(`Vấn đề chiêm bái: "${question.trim()}" (Chủ đề: ${topicLabel})`);
  } else {
    sections.push(`Chủ đề chiêm bái: ${topicLabel}`);
  }

  sections.push('');

  for (let i = 0; i < cards.length; i++) {
    const drawn = cards[i];
    if (!drawn) continue;

    const posLabel = POSITION_LABELS_VI[drawn.position] ?? drawn.position;
    const orientation = drawn.reversed ? 'Ngược (Reversed)' : 'Xuôi (Upright)';
    const meaning = drawn.reversed ? drawn.card.reversed : drawn.card.upright;

    sections.push(
      `• Vị trí ${i + 1} [${posLabel}]: ${drawn.card.nameVi} (${drawn.card.name}) - ${orientation}`,
    );
    sections.push(`  Từ khóa: ${drawn.card.keywords.join(', ')}`);
    sections.push(`  Thông điệp: ${meaning}`);
    sections.push('');
  }

  // Lời khuyên tổng kết
  sections.push('Lời khuyên tổng hòa:');
  if (cards.length === 1) {
    const single = cards[0];
    if (single) {
      const guidance = single.reversed
        ? 'Hãy cẩn trọng rà soát lại các khía cạnh chưa rõ ràng và kiên nhẫn với chính mình trước khi hành động.'
        : 'Thời điểm thuận lợi để bạn tự tin tiến bước. Hãy phát huy nguồn năng lượng tích cực này.';
      sections.push(guidance);
    }
  } else {
    sections.push(
      'Hãy nhìn nhận sự liên kết giữa bài học từ quá khứ, hiện trạng đang đối diện và hướng chuyển hóa ở tương lai. Niềm tin và hành động tỉnh thức của bạn sẽ định hình kết quả tốt đẹp nhất.',
    );
  }

  return sections.join('\n');
}
