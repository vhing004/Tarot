import { isSensitiveQuestion, TOPICS } from '@/shared/constants';
import type { DrawnCard, Topic } from '@/shared/types';
import { POSITION_LABELS_VI } from '@/modes/tarot/logic/spreads';

export type AiPerspective = 'empowering' | 'direct_warning' | 'philosophical' | 'actionable';

export interface PerspectiveMetadata {
  id: AiPerspective;
  icon: string;
  titleVi: string;
  descVi: string;
}

export const AI_PERSPECTIVES: readonly PerspectiveMetadata[] = [
  {
    id: 'empowering',
    icon: '🌟',
    titleVi: 'Khích lệ & Tiềm năng',
    descVi: 'Tập trung vào điểm mạnh, cơ hội thuận lợi và hướng giải quyết tươi sáng.',
  },
  {
    id: 'direct_warning',
    icon: '⚠️',
    titleVi: 'Thẳng thắn & Cảnh báo',
    descVi: 'Chỉ rõ các điểm mù, cạm bẫy rủi ro và những điều cần đặc biệt cẩn trọng.',
  },
  {
    id: 'philosophical',
    icon: '🧘',
    titleVi: 'Triết học & Tâm thức',
    descVi: 'Chiêm nghiệm sâu sắc về bài học tâm linh và sự thức tỉnh trưởng thành nội tâm.',
  },
  {
    id: 'actionable',
    icon: '🎯',
    titleVi: 'Hành động Thực tế',
    descVi: 'Đúc kết 3 bước hành động cụ thể, thiết thực có thể thực hiện ngay hôm nay.',
  },
];

export interface TarotAiParams {
  cards: readonly DrawnCard[];
  question: string;
  topic: Topic;
  perspective: AiPerspective;
  apiKey?: string;
  fetchFn?: typeof fetch;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEY_AI_KEY = 'fh_gemini_api_key';

/**
 * Đọc API key đã lưu trong thiết bị người dùng (an toàn, không commit).
 */
export function getSavedAiApiKey(customStorage?: StorageLike): string {
  try {
    const storage = customStorage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    if (storage) {
      const saved = storage.getItem(STORAGE_KEY_AI_KEY);
      if (saved && saved.trim().length > 0) return saved.trim();
    }
  } catch {
    // Tránh crash nếu localStorage bị khóa (R06 §3)
  }
  // Fallback đọc từ biến môi trường Vite nếu có cấu hình sẵn
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? '';
}

/**
 * Lưu API key người dùng vào localStorage.
 */
export function saveAiApiKey(key: string, customStorage?: StorageLike): void {
  try {
    const storage = customStorage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    if (storage) {
      if (key.trim().length === 0) {
        storage.removeItem(STORAGE_KEY_AI_KEY);
      } else {
        storage.setItem(STORAGE_KEY_AI_KEY, key.trim());
      }
    }
  } catch {
    // Bỏ qua nếu storage đầy/bị chặn
  }
}

/**
 * Tạo Prompt hệ thống tích hợp toàn bộ kiến thức Tarot và bối cảnh trải bài.
 */
export function buildTarotAiPrompt(params: TarotAiParams): string {
  const topicObj = TOPICS.find((t) => t.id === params.topic);
  const topicLabel = topicObj ? topicObj.labelVi : 'Tổng quan';
  const perspectiveMeta = AI_PERSPECTIVES.find((p) => p.id === params.perspective) ?? AI_PERSPECTIVES[0]!;

  const cardsSummary = params.cards.map((c, i) => {
    const posLabel = POSITION_LABELS_VI[c.position] ?? c.position;
    const orientation = c.reversed ? 'Ngược (Reversed)' : 'Xuôi (Upright)';
    const meaning = c.reversed ? c.card.reversed : c.card.upright;
    const keywords = c.card.keywords.join(', ');
    const symbols = c.card.symbolism ? c.card.symbolism.join('; ') : '';
    return `Lá ${i + 1} - Vị trí: [${posLabel}]: ${c.card.nameVi} (${c.card.name}) - Chiều: ${orientation}\n  - Từ khóa: ${keywords}\n  - Biểu tượng: ${symbols}\n  - Ý nghĩa cốt lõi: ${meaning}`;
  }).join('\n\n');

  let perspectiveDirective = '';
  switch (params.perspective) {
    case 'empowering':
      perspectiveDirective = 'Phong cách Khích lệ & Tiềm năng: Hãy tập trung chỉ ra những hạt mầm hy vọng, cơ hội bứt phá, sức mạnh nội tại và hướng đi tích cực nhất cho người hỏi. Dùng lời văn ấm áp, thắp sáng niềm tin.';
      break;
    case 'direct_warning':
      perspectiveDirective = 'Phong cách Thẳng thắn & Cảnh báo (Shadow Work): Hãy chỉ ra những điểm mù vô thức, nguy cơ rủi ro tiềm ẩn, ảo tưởng hoặc cạm bẫy mà người hỏi có thể đang bỏ qua. Hãy thẳng thắn, cảnh giác nhưng giàu lòng trắc ẩn và mang tính xây dựng, không gây sợ hãi.';
      break;
    case 'philosophical':
      perspectiveDirective = 'Phong cách Triết học & Tâm thức: Phân tích bài học tâm linh sâu sắc, sự thức tỉnh nội tâm và quy luật chuyển hóa của vũ trụ đằng sau trải bài này. Dẫn dắt người hỏi tự đối thoại với chính mình.';
      break;
    case 'actionable':
      perspectiveDirective = 'Phong cách Hành động Thực tế: Đúc kết trải bài thành 3 bước hành động cụ thể, rõ ràng, thực tế và khả thi nhất mà người hỏi có thể bắt tay vào làm ngay hôm nay để chuyển hóa cục diện.';
      break;
  }

  return `Bạn là một Bậc Thầy Tarot Master thông tuệ, am tường trọn vẹn 78 lá bài Rider-Waite-Smith, triết học cổ mẫu Jung, ngũ hành/4 nguyên tố và tâm lý học thức tỉnh.

BỐI CẢNH TRẢI BÀI CỦA NGƯỜI HỎI:
- Lĩnh vực: ${topicLabel}
- Câu hỏi/Băn khoăn: "${params.question.trim() || 'Muốn lắng nghe thông điệp chỉ dẫn tổng quan vào thời điểm hiện tại'}"
- Các lá bài đã rút được trên bàn bói:
${cardsSummary}

GÓC NHÌN ĐƯỢC CHỌN: ${perspectiveMeta.titleVi} (${perspectiveMeta.icon})
CHỈ DẪN GIỌNG VĂN: ${perspectiveDirective}

YÊU CẦU ĐỊNH DẠNG:
- Trả lời bằng tiếng Việt, súc tích, văn phong huyền bí nhưng tinh tế, ấm áp và trí tuệ (khoảng 250 - 400 từ).
- Tuân thủ nguyên tắc an toàn: Không phán đoán tương lai mang tính áp đặt hay tuyệt đối, không đưa ra kết luận y tế/pháp lý/tài chính.
- Chia thành 3 phần rõ ràng:
  1. [Nhận Diện Năng Lượng]: Khái quát bức tranh tổng thể các lá bài.
  2. [Luận Giải Theo Góc Nhìn]: Đi sâu theo đúng phong cách "${perspectiveMeta.titleVi}".
  3. [Thông Điệp Đúc Kết]: Lời khuyên vàng để người hỏi tĩnh tâm và vững bước.`;
}

/**
 * Bộ tạo lời khuyên thông minh ngoại tuyến (Offline Heuristic Generator)
 * Đảm bảo 100% người dùng luôn nhận được lời khuyên sâu sắc ngay cả khi không có internet hay API key.
 */
export function generateOfflineAiReading(params: TarotAiParams): string {
  const firstCard = params.cards[0];
  const cardName = firstCard ? `${firstCard.card.nameVi} (${firstCard.reversed ? 'Ngược' : 'Xuôi'})` : 'những lá bài';
  const cardMeaning = firstCard ? (firstCard.reversed ? firstCard.card.reversed : firstCard.card.upright) : '';
  const cardKeywords = firstCard ? firstCard.card.keywords.slice(0, 3).join(', ') : 'chuyển hóa, định tâm';

  switch (params.perspective) {
    case 'empowering':
      return `[Nhận Diện Năng Lượng]\nTrải bài phản chiếu một luồng sinh khí đang chuyển động mạnh mẽ quanh bạn. Trọng tâm nằm ở lá bài ${cardName}, mang năng lượng của "${cardKeywords}".\n\n[Luận Giải Khích Lệ & Tiềm Năng]\n${cardMeaning}\nĐây không phải là lúc để nghi ngờ bản thân. Vũ trụ đang trao cho bạn quyền làm chủ hoàn cảnh. Bất kể thử thách nào đang diễn ra, bạn đều đã tích lũy đủ nội lực và kinh nghiệm để biến nghịch cảnh thành bàn đạp vươn lên.\n\n[Thông Điệp Đúc Kết]\nHãy tin tưởng vào trực giác đầu tiên của bạn. Hãy bước đi với lòng dũng cảm, vì những điều tốt đẹp nhất chỉ xuất hiện khi bạn dám mở lòng đón nhận.`;

    case 'direct_warning':
      return `[Nhận Diện Năng Lượng]\nTrải bài nhắc nhở bạn cần dừng lại một nhịp để nhìn thấu bức tranh thực tế. Năng lượng của ${cardName} đang chỉ điểm về "${cardKeywords}".\n\n[Luận Giải Thẳng Thắn & Điểm Mù]\n${cardMeaning}\nĐiểm mù lớn nhất hiện tại có thể là sự vội vã hoặc cố gắng kiểm soát những điều nằm ngoài tầm tay. Hãy cẩn trọng trước những lời hứa hẹn quá hào nhoáng hoặc thói quen trì hoãn đối diện với sự thật. Nếu bạn né tránh giải quyết gốc rễ, bài học này sẽ lặp lại với áp lực lớn hơn.\n\n[Thông Điệp Đúc Kết]\nĐối diện với bóng tối bên trong chính là bước đầu tiên để chạm tới ánh sáng chân thực. Hãy can đảm cắt bỏ những điều không còn phục vụ cho sự bình an của bạn.`;

    case 'philosophical':
      return `[Nhận Diện Năng Lượng]\nNhìn từ tầm cao của tâm thức, sự hiện diện của ${cardName} không phải là sự tình cờ. Nó biểu đạt quy luật chuyển hóa sâu sắc: "${cardKeywords}".\n\n[Chiêm Nghiệm Triết Học & Tâm Thức]\n${cardMeaning}\nCuộc sống vốn là chuỗi nhịp điệu của sự sinh khởi và biến tan. Trải nghiệm bạn đang đi qua thực chất là một lò luyện tâm thức, giúp bạn tách bạch giữa "bản ngã muốn đạt được" và "linh hồn muốn học hỏi". Mọi băn khoăn bên ngoài chỉ là tấm gương phản chiếu những khao khát chưa được lắng nghe bên trong.\n\n[Thông Điệp Đúc Kết]\nĐừng tìm kiếm bình yên ở nơi hoàn cảnh bên ngoài phẳng lặng; hãy tìm kiếm sự tĩnh tại ngay giữa tâm bão bằng sự quán chiếu vô ngã.`;

    case 'actionable':
      return `[Nhận Diện Năng Lượng]\nTừ thông điệp của ${cardName} gắn liền với "${cardKeywords}", năng lượng hiện tại cần được chuyển hóa thành những bước đi cụ thể.\n\n[Chiến Lược Hành Động Thiết Thực]\n1. Định tâm & Làm rõ mục tiêu: Dành ra 15 phút yên tĩnh để viết ra giấy đúng 1 ưu tiên quan trọng nhất mà bạn cần hoàn thành trong tuần này.\n2. Thiết lập ranh giới: ${cardMeaning.slice(0, 100)}... Hãy dứt khoát nói không với những phiền nhiễu tiêu hao năng lượng.\n3. Hành động nhỏ có kỷ luật: Bắt tay thực hiện một hành động đầu tiên ngay hôm nay mà không chần chừ chờ đợi điều kiện hoàn hảo.\n\n[Thông Điệp Đúc Kết]\nSuy nghĩ không làm thay đổi số phận, chỉ có hành động kiên trì và tỉnh thức mới kiến tạo nên thực tại mới.`;
  }
}

/**
 * Gọi Google Gemini AI (hoặc fallback thông minh) để sinh lời giải Tarot sâu sắc.
 */
export async function generateTarotAiReading(params: TarotAiParams): Promise<string> {
  // 1. Kiểm tra an toàn câu hỏi nhạy cảm (Rule R05 §4)
  if (params.question.trim().length > 0 && isSensitiveQuestion(params.question)) {
    return 'Chúng tôi nhận thấy bạn có thể đang trải qua giai đoạn khủng hoảng sâu sắc. Xin hãy tạm gác lại việc bói toán và mở lòng trò chuyện với người thân hoặc chuyên gia tâm lý/y tế để nhận được sự đồng hành an toàn và ấm áp nhất.';
  }

  const apiKey = params.apiKey ?? getSavedAiApiKey();

  // 2. Nếu không có API Key, sử dụng ngay bộ luận giải Offline Heuristic
  if (!apiKey || apiKey.trim().length === 0) {
    // Giả lập độ trễ chiêm nghiệm 600ms tạo cảm giác tự nhiên
    await new Promise((resolve) => setTimeout(resolve, 600));
    return generateOfflineAiReading(params);
  }

  // 3. Nếu có API Key, gọi Google Gemini Flash REST API
  const prompt = buildTarotAiPrompt(params);
  const fetcher = params.fetchFn ?? globalThis.fetch;

  // Hỗ trợ gemini-1.5-flash và gemini-2.0-flash
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 giây timeout

    const response = await fetcher(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Gemini API trả về mã lỗi ${response.status}, kích hoạt bộ luận giải thông minh dự phòng.`);
      return generateOfflineAiReading(params);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text && text.trim().length > 0) {
      return text.trim();
    }

    return generateOfflineAiReading(params);
  } catch (error) {
    console.warn('Lỗi kết nối AI hoặc hết thời gian chờ, chuyển sang bộ luận giải dự phòng:', error);
    return generateOfflineAiReading(params);
  }
}
