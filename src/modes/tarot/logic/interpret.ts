import { TOPICS } from '@/shared/constants';
import type { DrawnCard, Topic } from '@/shared/types';
import { POSITION_LABELS_VI } from '@/modes/tarot/logic/spreads';

/**
 * Tổng hợp lời giải đoán từ các lá bài đã rút theo mẫu chuẩn mực (docs/tarot_game_development_guide.md mục 11.2).
 * Tránh dự đoán tuyệt đối, tập trung vào dòng chảy biểu tượng, hành động tỉnh thức và câu hỏi phản tư.
 */
export function buildTarotInterpretation(
  cards: readonly DrawnCard[],
  topic: Topic,
  question: string,
): string {
  const topicObj = TOPICS.find((t) => t.id === topic);
  const topicLabel = topicObj ? topicObj.labelVi : 'Tổng quan';

  const sections: string[] = [];

  // 1. [Chủ đề chính]
  if (question.trim().length > 0) {
    sections.push(`[Chủ đề chiêm bái]\nTrải bài gợi mở về vấn đề: "${question.trim()}" (Lĩnh vực: ${topicLabel}).`);
  } else {
    sections.push(`[Chủ đề chiêm bái]\nTrải bài tĩnh tâm cho lĩnh vực: ${topicLabel}.`);
  }

  sections.push('');

  // 2. [Từng lá]
  sections.push('[Chiêm nghiệm từng lá]');
  for (let i = 0; i < cards.length; i++) {
    const drawn = cards[i];
    if (!drawn) continue;

    const posLabel = POSITION_LABELS_VI[drawn.position] ?? drawn.position;
    const orientation = drawn.reversed ? 'Ngược (Reversed - Năng lượng nội tâm / Chậm rãi)' : 'Xuôi (Upright - Năng lượng biểu hiện / Thuận dòng)';
    const meaning = drawn.reversed ? drawn.card.reversed : drawn.card.upright;
    const symbols = drawn.card.symbolism && drawn.card.symbolism.length > 0
      ? `\n  Biểu tượng cốt lõi: ${drawn.card.symbolism.join('; ')}`
      : '';

    sections.push(
      `• Vị trí ${i + 1} [${posLabel}]: ${drawn.card.nameVi} (${drawn.card.name}) — ${orientation}\n  Từ khóa: ${drawn.card.keywords.join(', ')}${symbols}\n  Lời thông điệp: ${meaning}`,
    );
  }

  sections.push('');

  // 3. [Dòng chảy liên kết & Tương quan]
  sections.push('[Dòng chảy tương quan]');
  if (cards.length === 1) {
    const single = cards[0];
    if (single) {
      if (single.reversed) {
        sections.push(
          'Lá bài ngược cho thấy đây là giai đoạn năng lượng hướng vào nội tâm. Mọi chuyển biến bên ngoài đang phản ánh những bài học chưa giải quyết trọn vẹn bên trong bạn.',
        );
      } else {
        sections.push(
          'Lá bài xuôi mang đến một nguồn năng lượng rõ ràng, thông suốt. Hãy cởi mở đón nhận và tận dụng thời điểm này để thể hiện thế mạnh bản thân.',
        );
      }
    }
  } else {
    const reversedCount = cards.filter((c) => c.reversed).length;
    if (reversedCount === 0) {
      sections.push(
        'Tất cả các lá bài đều ở thế xuôi, cho thấy một dòng chảy năng lượng tự nhiên, rõ ràng và thuận lợi để hành động theo đúng kế hoạch.',
      );
    } else if (reversedCount === cards.length) {
      sections.push(
        'Các lá bài đều ở chiều ngược, ngụ ý rằng các câu trả lời bạn đang tìm kiếm nằm ở sự soi chiếu nội tâm và tháo gỡ những khúc mắc bên trong trước khi tác động ra ngoại cảnh.',
      );
    } else {
      sections.push(
        'Sự đan xen giữa các chiều năng lượng cho thấy hành trình này vừa đòi hỏi sự chủ động ngoại cảnh vừa cần sự kiên nhẫn nhìn nhận lại nội tâm để không vội vã.',
      );
    }
  }

  sections.push('');

  // 4. [Gợi ý hành động]
  sections.push('[Gợi ý hành động]');
  if (cards.length === 1) {
    const single = cards[0];
    const tip = single?.reversed
      ? 'Hãy chậm lại một nhịp, cẩn trọng rà soát lại các khía cạnh chưa rõ ràng và kiên nhẫn với chính mình trước khi đưa ra quyết định.'
      : 'Thời điểm thuận lợi để bạn tự tin tiến bước. Hãy kiên định với mục tiêu và giữ vững sự trong sáng của tâm trí.';
    sections.push(tip);
  } else {
    sections.push(
      'Hãy xâu chuỗi bài học từ điểm xuất phát, nhận diện rõ những thách thức thực tế và kiên định với định hướng dài hạn. Quyền chủ động và lựa chọn sáng suốt luôn nằm trong tay bạn.',
    );
  }

  sections.push('');

  // 5. [Câu hỏi phản tư - Reflection Prompt]
  sections.push('[Câu hỏi phản tư dành cho bạn]');
  const prompts: string[] = [];
  for (const c of cards) {
    if (c.card.reflectionPrompts && c.card.reflectionPrompts.length > 0) {
      const p = c.card.reflectionPrompts[0];
      if (p && !prompts.includes(p)) prompts.push(p);
    }
  }

  if (prompts.length > 0) {
    for (const p of prompts) {
      sections.push(`❓ ${p}`);
    }
  } else {
    sections.push('❓ Điều gì trong hoàn cảnh này đang nằm hoàn toàn trong tầm kiểm soát và khả năng chủ động của bạn?');
  }

  return sections.join('\n');
}
