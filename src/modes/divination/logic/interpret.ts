import { TOPICS } from '@/shared/constants';
import type { DivinationResult, Hexagram, Topic } from '@/shared/types';

/**
 * Tổng hợp lời diễn giải quẻ Kinh Dịch từ quẻ chủ, hào động và quẻ biến (R04 §4, R05 §3).
 */
export function buildDivinationInterpretation(
  result: DivinationResult,
  primaryHex: Hexagram,
  changedHex: Hexagram | null,
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

  // 1. Quẻ Chủ
  sections.push(`• QUẺ CHỦ: ${primaryHex.nameVi} (${primaryHex.name}) - Mã [${result.primaryKey}]`);
  sections.push(`  Lời Thoán: ${primaryHex.judgement}`);
  sections.push('');

  // 2. Lời Hào Động (nếu có)
  if (result.movingLines.length > 0) {
    sections.push(`• CÁC HÀO ĐỘNG (${result.movingLines.length} hào):`);
    for (const lineNum of result.movingLines) {
      const lineText = primaryHex.lines[lineNum - 1] ?? `Lời Hào ${lineNum} đang cập nhật.`;
      sections.push(`  - ${lineText}`);
    }
    sections.push('');
  } else {
    sections.push('• HÀO ĐỘNG: Không có hào động (Quẻ tĩnh).');
    sections.push('  Tình thế đang ổn định và tuần hoàn theo đúng bản chất của Quẻ Chủ.');
    sections.push('');
  }

  // 3. Quẻ Biến (nếu có)
  if (changedHex && result.changedKey) {
    sections.push(`• QUẺ BIẾN: ${changedHex.nameVi} (${changedHex.name}) - Mã [${result.changedKey}]`);
    sections.push(`  Lời Thoán Biến: ${changedHex.judgement}`);
    sections.push('');
  }

  // 4. Lời khuyên tổng hòa
  sections.push('Lời khuyên chiêm nghiệm:');
  if (result.movingLines.length > 0) {
    sections.push(
      'Hào động chỉ ra điểm mấu chốt của sự chuyển dịch thời thế. Hãy chú tâm vào lời dạy của các hào động và hướng chuyển biến của Quẻ Biến để đưa ra quyết định tỉnh thức và đúng đắn nhất.',
    );
  } else {
    sections.push(
      'Tập trung phát huy nguồn năng lượng cốt lõi của Quẻ Chủ. Giữ tâm thái vững vàng, kiên trì và thuận theo quy luật tự nhiên.',
    );
  }

  return sections.join('\n');
}
