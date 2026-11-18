import hexagramsJson from '@/modes/divination/data/hexagrams.json';
import type { Hexagram } from '@/shared/types';

const hexagramMap = hexagramsJson as unknown as Record<string, Hexagram>;

/**
 * Tra cứu quẻ Kinh Dịch từ chuỗi khóa 6 bit (R04 §4).
 * Nếu quẻ chưa có trong tập dữ liệu mẫu (sample), trả về fallback an toàn để không crash (W03 §2).
 */
export function lookupHexagram(key: string): Hexagram {
  if (!/^[01]{6}$/.test(key)) {
    throw new Error(`HEX: mã quẻ "${key}" không hợp lệ, phải là chuỗi 6 ký tự 0 và 1`);
  }

  const found = hexagramMap[key];
  if (found) {
    return found;
  }

  // Fallback an toàn cho CONTENT_STATUS = 'sample' (W03 §2)
  return {
    id: 0,
    name: `Hexagram ${key}`,
    nameVi: `Quẻ [${key}] (Đang cập nhật)`,
    judgement:
      'Nội dung diễn giải chi tiết cho quẻ này đang được ban biên tập hoàn thiện. Bạn hãy chiêm nghiệm cấu trúc âm dương của 6 hào quẻ trên bàn.',
    lines: [
      'Hào 1: Đang cập nhật lời hào.',
      'Hào 2: Đang cập nhật lời hào.',
      'Hào 3: Đang cập nhật lời hào.',
      'Hào 4: Đang cập nhật lời hào.',
      'Hào 5: Đang cập nhật lời hào.',
      'Hào 6: Đang cập nhật lời hào.',
    ],
  };
}
