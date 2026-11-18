export type TarotSpreadType = 'single' | 'three' | 'three_time' | 'three_situation' | 'three_mind';

export interface TarotSpreadPosition {
  key: string;
  labelVi: string;
  descriptionVi: string;
}

export interface TarotSpreadDefinition {
  type: TarotSpreadType;
  labelVi: string;
  descriptionVi: string;
  positions: readonly string[];
  positionDetails: readonly TarotSpreadPosition[];
}

export const TAROT_SPREADS: Record<TarotSpreadType, TarotSpreadDefinition> = {
  single: {
    type: 'single',
    labelVi: 'Trải 1 lá: Tâm điểm hôm nay',
    descriptionVi: 'Phù hợp cho một chủ đề tĩnh tâm, câu hỏi ngắn hoặc một góc nhìn mới cần chú ý.',
    positions: ['present'],
    positionDetails: [
      {
        key: 'present',
        labelVi: 'Tâm điểm / Góc nhìn mới',
        descriptionVi: 'Chủ đề trọng tâm hoặc thông điệp soi sáng cho thời điểm hiện tại.',
      },
    ],
  },
  three: {
    type: 'three',
    labelVi: 'Trải 3 lá: Dòng thời gian',
    descriptionVi: 'Quá khứ ➔ Hiện tại ➔ Hướng chuyển hóa tương lai.',
    positions: ['past', 'present', 'future'],
    positionDetails: [
      { key: 'past', labelVi: 'Quá khứ / Gốc rễ', descriptionVi: 'Nền tảng hoặc kinh nghiệm đã định hình nên tình huống hiện tại.' },
      { key: 'present', labelVi: 'Hiện tại / Thực tế', descriptionVi: 'Trạng thái và năng lượng đang diễn ra xung quanh bạn.' },
      { key: 'future', labelVi: 'Tương lai / Hướng đi', descriptionVi: 'Xu hướng chuyển biến tự nhiên nếu bạn tiếp tục con đường này.' },
    ],
  },
  three_time: {
    type: 'three_time',
    labelVi: 'Trải 3 lá: Dòng thời gian',
    descriptionVi: 'Quá khứ ➔ Hiện tại ➔ Hướng chuyển hóa tương lai.',
    positions: ['past', 'present', 'future'],
    positionDetails: [
      { key: 'past', labelVi: 'Quá khứ / Gốc rễ', descriptionVi: 'Nền tảng hoặc kinh nghiệm đã định hình nên tình huống hiện tại.' },
      { key: 'present', labelVi: 'Hiện tại / Thực tế', descriptionVi: 'Trạng thái và năng lượng đang diễn ra xung quanh bạn.' },
      { key: 'future', labelVi: 'Tương lai / Hướng đi', descriptionVi: 'Xu hướng chuyển biến tự nhiên nếu bạn tiếp tục con đường này.' },
    ],
  },
  three_situation: {
    type: 'three_situation',
    labelVi: 'Trải 3 lá: Tình huống – Thách thức – Lời khuyên',
    descriptionVi: 'Phân tích bản chất hoàn cảnh, nhận diện trở ngại và tìm ra giải pháp khả thi.',
    positions: ['situation', 'challenge', 'advice'],
    positionDetails: [
      { key: 'situation', labelVi: 'Tình huống', descriptionVi: 'Bản chất sự việc khách quan đang được xem xét.' },
      { key: 'challenge', labelVi: 'Thách thức', descriptionVi: 'Yếu tố gây khó khăn, cản trở hoặc bài học cần vượt qua.' },
      { key: 'advice', labelVi: 'Lời khuyên', descriptionVi: 'Góc nhìn gợi ý hoặc hành động cụ thể bạn nên cân nhắc.' },
    ],
  },
  three_mind: {
    type: 'three_mind',
    labelVi: 'Trải 3 lá: Tâm trí – Trái tim – Hành động',
    descriptionVi: 'Đồng bộ hóa giữa tư duy lý trí, cảm xúc nội tâm và bước đi thực tế.',
    positions: ['mind', 'heart', 'action'],
    positionDetails: [
      { key: 'mind', labelVi: 'Tâm trí (Lý trí)', descriptionVi: 'Cách bạn đang tư duy và những suy nghĩ chi phối.' },
      { key: 'heart', labelVi: 'Trái tim (Cảm xúc)', descriptionVi: 'Những cảm xúc sâu kín, khao khát hoặc nỗi bận lòng.' },
      { key: 'action', labelVi: 'Hành động (Thực tế)', descriptionVi: 'Bước đi cụ thể để hiện thực hóa sự hòa hợp giữa lý trí và cảm xúc.' },
    ],
  },
} as const;

export const POSITION_LABELS_VI: Record<string, string> = {
  present: 'Hiện tại / Tâm điểm',
  past: 'Quá khứ / Gốc rễ',
  future: 'Tương lai / Hướng đi',
  situation: 'Tình huống thực tại',
  challenge: 'Thách thức cần chú ý',
  advice: 'Lời khuyên hành động',
  mind: 'Tâm trí (Lý trí)',
  heart: 'Trái tim (Cảm xúc)',
  action: 'Hành động cụ thể',
};
