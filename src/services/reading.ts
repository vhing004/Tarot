import type { DivinationResult, Reading, TarotResult } from '@/shared/types';
import { TOPICS } from '@/shared/constants';
import { lookupHexagram } from '@/modes/divination/logic/lookup';

export interface ReadingSummary {
  title: string;
  subtitle: string;
  previewText: string;
  timeFormatted: string;
}

/**
 * Tạo bản tóm tắt ngắn gọn của lượt bói để hiển thị trên danh sách Lịch sử (R05 §5).
 * Hàm thuần (pure zone), không phụ thuộc DOM.
 */
export function summarizeReading(reading: Reading): ReadingSummary {
  const topicObj = TOPICS.find((t) => t.id === reading.topic);
  const topicLabel = topicObj ? topicObj.labelVi : 'Tổng quan';

  const date = new Date(reading.createdAt);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');
  const timeFormatted = `${hours}:${mins} • ${day}/${month}/${date.getFullYear()}`;

  let title = '';
  let subtitle = '';

  if (reading.mode === 'tarot') {
    const res = reading.result as TarotResult;
    const cardNames = res.cards.map((c) => c.card.nameVi).join(' • ');
    title = `Tarot: ${cardNames}`;
    subtitle = `Trải ${res.spread === 'single' ? '1 lá' : '3 lá'} • ${topicLabel}`;
  } else {
    const res = reading.result as DivinationResult;
    const primaryHex = lookupHexagram(res.primaryKey);
    const changedHex = res.changedKey ? lookupHexagram(res.changedKey) : null;

    if (changedHex) {
      title = `Kinh Dịch: ${primaryHex.nameVi} ➔ ${changedHex.nameVi}`;
      subtitle = `${res.movingLines.length} hào động • ${topicLabel}`;
    } else {
      title = `Kinh Dịch: ${primaryHex.nameVi}`;
      subtitle = `Quẻ tĩnh • ${topicLabel}`;
    }
  }

  // Cắt ngắn câu hỏi hoặc lời giải làm previewText
  let previewText = '';
  if (reading.question && reading.question.trim().length > 0) {
    previewText = `"${reading.question.trim()}"`;
  } else {
    // Lấy 1-2 dòng đầu của lời giải
    const firstLine = reading.interpretation.split('\n').find((l) => l.trim().length > 0) ?? '';
    previewText = firstLine.length > 80 ? `${firstLine.slice(0, 80)}...` : firstLine;
  }

  return {
    title,
    subtitle,
    previewText,
    timeFormatted,
  };
}
