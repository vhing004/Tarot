import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildTarotAiPrompt,
  generateOfflineAiReading,
  generateTarotAiReading,
  saveAiApiKey,
  getSavedAiApiKey,
  AI_PERSPECTIVES,
  type TarotAiParams,
} from '@/services/ai';
import type { DrawnCard } from '@/shared/types';

describe('Tarot AI Oracle Service (ai.ts)', () => {
  const mockCard: DrawnCard = {
    position: 'present',
    reversed: false,
    card: {
      id: 0,
      name: 'The Fool',
      nameVi: 'Chàng Khờ',
      image: '/textures/tarot/ar00.jpg',
      keywords: ['khởi đầu mới', 'tự do', 'tiềm năng vô hạn'],
      symbolism: ['Mép vực đá', 'Hoa hồng trắng'],
      upright: 'Một hành trình mới mở ra trước mắt. Can đảm bước tới.',
      reversed: 'Sự liều lĩnh hoặc ngập ngừng trước khởi đầu.',
      reflectionPrompts: ['Bạn đang ngần ngại điều gì?'],
      suit: 'major',
    },
  };

  const baseParams: TarotAiParams = {
    cards: [mockCard],
    question: 'Tôi có nên chuyển việc vào lúc này không?',
    topic: 'career',
    perspective: 'empowering',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('định nghĩa đầy đủ 4 phong cách góc nhìn chiêm nghiệm', () => {
    expect(AI_PERSPECTIVES).toHaveLength(4);
    const ids = AI_PERSPECTIVES.map((p) => p.id);
    expect(ids).toContain('empowering');
    expect(ids).toContain('direct_warning');
    expect(ids).toContain('philosophical');
    expect(ids).toContain('actionable');
  });

  it('xây dựng Prompt AI chi tiết chứa đầy đủ bối cảnh và chỉ dẫn góc nhìn', () => {
    const prompt = buildTarotAiPrompt(baseParams);
    expect(prompt).toContain('Bậc Thầy Tarot Master');
    expect(prompt).toContain('Chàng Khờ (The Fool)');
    expect(prompt).toContain('Tôi có nên chuyển việc vào lúc này không?');
    expect(prompt).toContain('Khích lệ & Tiềm năng');

    const warningPrompt = buildTarotAiPrompt({
      ...baseParams,
      perspective: 'direct_warning',
    });
    expect(warningPrompt).toContain('Thẳng thắn & Cảnh báo');
  });

  it('bộ giải đoán ngoại tuyến (Offline Heuristic) sinh lời giải sắc bén theo từng phong cách', () => {
    const p1 = generateOfflineAiReading({ ...baseParams, perspective: 'empowering' });
    expect(p1).toContain('[Luận Giải Khích Lệ & Tiềm Năng]');
    expect(p1).toContain('Chàng Khờ');

    const p2 = generateOfflineAiReading({ ...baseParams, perspective: 'direct_warning' });
    expect(p2).toContain('[Luận Giải Thẳng Thắn & Điểm Mù]');

    const p3 = generateOfflineAiReading({ ...baseParams, perspective: 'philosophical' });
    expect(p3).toContain('[Chiêm Nghiệm Triết Học & Tâm Thức]');

    const p4 = generateOfflineAiReading({ ...baseParams, perspective: 'actionable' });
    expect(p4).toContain('[Chiến Lược Hành Động Thiết Thực]');
  });

  it('chặn câu hỏi nhạy cảm và trả về thông điệp hỗ trợ an toàn (Rule R05 §4)', async () => {
    const result = await generateTarotAiReading({
      ...baseParams,
      question: 'Tôi muốn tự tử thì phải làm sao',
    });
    expect(result).toContain('khủng hoảng sâu sắc');
    expect(result).toContain('chuyên gia tâm lý/y tế');
  });

  it('tự động dùng bộ luận giải offline khi không có API key', async () => {
    const result = await generateTarotAiReading({
      ...baseParams,
      apiKey: '',
    });
    expect(result).toContain('[Nhận Diện Năng Lượng]');
    expect(result).toContain('Chàng Khờ');
  });

  it('gọi Gemini API thành công khi có API key và fetch trả về 200', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'Lời luận giải AI trực tiếp từ Gemini API vô cùng sâu sắc.' }],
            },
          },
        ],
      }),
    } as unknown as Response);

    const result = await generateTarotAiReading({
      ...baseParams,
      apiKey: 'test-fake-gemini-key',
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toBe('Lời luận giải AI trực tiếp từ Gemini API vô cùng sâu sắc.');
  });

  it('rơi về bộ luận giải offline an toàn khi API trả về lỗi 500', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);

    const result = await generateTarotAiReading({
      ...baseParams,
      apiKey: 'test-fake-gemini-key',
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toContain('[Nhận Diện Năng Lượng]');
  });

  it('lưu và đọc API key từ storage an toàn', () => {
    const map = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => { map.set(k, v); },
      removeItem: (k: string) => { map.delete(k); },
    };

    saveAiApiKey('my-secret-key-123', mockStorage);
    expect(getSavedAiApiKey(mockStorage)).toBe('my-secret-key-123');

    saveAiApiKey('', mockStorage);
    expect(getSavedAiApiKey(mockStorage)).toBe('');
  });
});
