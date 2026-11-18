import type { Topic } from '@/shared/types';

export const TOPICS: readonly { id: Topic; labelVi: string }[] = [
  { id: 'general', labelVi: 'Tổng quan' },
  { id: 'love', labelVi: 'Tình cảm' },
  { id: 'career', labelVi: 'Công việc' },
  { id: 'money', labelVi: 'Tài chính' },
  { id: 'health', labelVi: 'Sức khỏe' },
] as const;

export const MAX_HISTORY_RECORDS = 100;
export const STORAGE_KEY_READINGS = 'fh.readings.v1';
export const STORAGE_KEY_SETTINGS = 'fh.settings.v1';
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Danh sách từ khóa nhạy cảm theo R05 §4 (tự hại, bạo lực, khủng hoảng nghiêm trọng).
 * Khi phát hiện, không thực hiện lượt bói và hiển thị thông điệp hỗ trợ.
 */
export const SENSITIVE_KEYWORDS: readonly string[] = [
  'tự tử',
  'tự sát',
  'chết đi',
  'kết liễu',
  'cắt tay',
  'tự hại',
  'giết người',
  'suicide',
  'kill myself',
  'self harm',
] as const;

export function isSensitiveQuestion(question: string): boolean {
  const normalized = question.toLowerCase();
  return SENSITIVE_KEYWORDS.some((kw) => normalized.includes(kw));
}
