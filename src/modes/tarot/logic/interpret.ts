import { TOPICS } from '@/shared/constants';
import type { DrawnCard, TarotCard, Topic } from '@/shared/types';
import { POSITION_LABELS_VI } from '@/modes/tarot/logic/spreads';

/**
 * Soi chiếu ý nghĩa của lá bài qua lăng kính của Chủ đề đã chọn (Rider-Waite-Smith 1909)
 * Tôn trọng 4 nguyên tố: Cốc (Tình cảm), Gậy (Sự nghiệp), Tiền (Tài chính), Kiếm (Thách thức & Tư duy)
 */
export function getCardTopicMeaning(card: TarotCard, reversed: boolean, topic: Topic): string {
  const baseMeaning = reversed ? card.reversed : card.upright;
  const suit = card.suit ?? 'major';

  switch (topic) {
    case 'love': {
      if (reversed) {
        if (suit === 'cups') {
          return `Trong tình cảm, năng lượng ngược báo hiệu sự ứ đọng cảm xúc hoặc tổn thương chưa được thổ lộ. Hãy lắng nghe trái tim và học cách chia sẻ chân thành thay vì né tránh. (${baseMeaning})`;
        }
        if (suit === 'swords') {
          return `Cảnh báo những lời nói sắc nhọn, sự hoài nghi hoặc nỗi đau quá khứ làm rạn nứt niềm tin. Cần buông bỏ cái tôi lý trí để mở đường cho sự cảm thông. (${baseMeaning})`;
        }
        if (suit === 'wands') {
          return `Ngọn lửa đam mê có dấu hiệu nguội lạnh hoặc sự nóng vội, áp đặt làm đối phương cảm thấy ngột ngạt. Hãy điều hòa lại nhịp điệu của cả hai. (${baseMeaning})`;
        }
        if (suit === 'pentacles') {
          return `Áp lực tiền bạc, gánh nặng đời thường hoặc sự toan tính đang làm phai nhạt tình cảm. Cần dành thời gian chất lượng nuôi dưỡng cảm xúc. (${baseMeaning})`;
        }
        return `Bài học tâm thức lớn về tình cảm. Hãy nhìn sâu vào nội tâm để nhận diện điều mình thực sự khao khát trước khi đòi hỏi từ người khác. (${baseMeaning})`;
      } else {
        if (suit === 'cups') {
          return `Dòng chảy cảm xúc ngọt ngào, chân thành và thấu hiểu. Thời điểm tuyệt vời để mở lòng đón nhận tình cảm mới hoặc hâm nóng mối quan hệ sẵn có. (${baseMeaning})`;
        }
        if (suit === 'swords') {
          return `Cần sự thẳng thắn, rõ ràng và trung thực. Một cuộc đối thoại chân thành, cởi mở sẽ giải tỏa mọi nút thắt băn khoăn bấy lâu trong tình cảm. (${baseMeaning})`;
        }
        if (suit === 'wands') {
          return `Ngọn lửa đam mê bùng cháy, sự cuốn hút mãnh liệt và những bước tiến chủ động đầy hứng khởi trong tình yêu. Hãy tự tin bày tỏ cảm xúc. (${baseMeaning})`;
        }
        if (suit === 'pentacles') {
          return `Tình cảm phát triển dựa trên sự an toàn, tin cậy và cam kết vững chắc. Hai bạn đang cùng nhau xây dựng nền tảng vững bền cho tương lai. (${baseMeaning})`;
        }
        return `Một bước ngoặt tinh thần quan trọng trong tình cảm. Năng lượng này soi sáng bài học định mệnh giúp bạn trưởng thành và đón nhận tình yêu đích thực. (${baseMeaning})`;
      }
    }

    case 'career': {
      if (reversed) {
        if (suit === 'wands') {
          return `Trong công việc, lá bài ngược báo hiệu sự thiếu lửa, cạn kiệt cảm hứng hoặc hành động bốc đồng thiếu chiến lược. Hãy dừng lại định tâm trước khi tiến bước. (${baseMeaning})`;
        }
        if (suit === 'pentacles') {
          return `Tiến độ công việc bị chậm lại, kết quả chưa tương xứng với công sức hoặc thiếu kỹ năng thực tế. Cần tập trung nâng cao năng lực chuyên môn. (${baseMeaning})`;
        }
        if (suit === 'swords') {
          return `Bất đồng quan điểm, môi trường làm việc cạnh tranh gay gắt hoặc áp lực phê phán. Tránh đối đầu trực diện, hãy giữ sự bình tĩnh và chuyên nghiệp. (${baseMeaning})`;
        }
        if (suit === 'cups') {
          return `Cảm giác mất phương hướng hoặc công việc hiện tại không còn mang lại niềm vui tinh thần. Hãy tìm lại động lực và mục tiêu nghề nghiệp nguyên bản. (${baseMeaning})`;
        }
        return `Bài học chuyển hóa trong sự nghiệp. Đây là thời điểm kiên nhẫn vượt qua thử thách để tái cấu trúc lại định hướng dài hạn thay vì bỏ cuộc. (${baseMeaning})`;
      } else {
        if (suit === 'wands') {
          return `Thời điểm bứt phá mạnh mẽ trong sự nghiệp. Nguồn năng lượng tiên phong, ý tưởng đổi mới và sự quyết đoán sẽ giúp bạn tạo nên dấu ấn nổi bật. (${baseMeaning})`;
        }
        if (suit === 'pentacles') {
          return `Thành quả cụ thể, công việc vững vàng và sự đền đáp xứng đáng cho nỗ lực kiên trì. Nền tảng chuyên môn của bạn đang phát huy hiệu quả tối đa. (${baseMeaning})`;
        }
        if (suit === 'swords') {
          return `Tầm nhìn chiến lược sắc bén, tư duy lý trí rõ ràng và khả năng đàm phán xuất sắc. Hãy dứt khoát đưa ra quyết định để làm chủ tình thế. (${baseMeaning})`;
        }
        if (suit === 'cups') {
          return `Môi trường làm việc hòa thuận, hợp tác ăn ý và sự thỏa mãn tinh thần từ công việc bạn yêu thích. Các mối quan hệ nghề nghiệp đang hỗ trợ bạn rất tốt. (${baseMeaning})`;
        }
        return `Một cơ hội lớn mở ra trên con đường sự nghiệp. Hãy tự tin bước lên nấc thang mới để hiện thực hóa năng lực và sứ mệnh của bạn. (${baseMeaning})`;
      }
    }

    case 'money': {
      if (reversed) {
        if (suit === 'pentacles') {
          return `Về tài chính, cảnh báo nguy cơ thất thoát, chi tiêu thiếu kiểm soát hoặc đầu tư kém hiệu quả. Cần siết chặt ngân sách và thận trọng với các cam kết tiền bạc. (${baseMeaning})`;
        }
        if (suit === 'swords') {
          return `Cảnh báo các điều khoản hợp đồng mập mờ, rủi ro pháp lý hoặc quyết định tài chính vội vã trong lúc lo lắng. Hãy kiểm tra kỹ giấy tờ và số liệu. (${baseMeaning})`;
        }
        if (suit === 'wands') {
          return `Hấp tấp bỏ vốn vào những cơ hội mạo hiểm chưa thẩm định kỹ. Cần tiết chế sự bốc đồng và lên kế hoạch dự phòng rủi ro. (${baseMeaning})`;
        }
        if (suit === 'cups') {
          return `Chi tiêu theo cảm xúc để xoa dịu áp lực tâm lý. Hãy tách bạch giữa nhu cầu thực tế và ham muốn nhất thời. (${baseMeaning})`;
        }
        return `Bài học về việc làm chủ nguồn lực tài chính. Hãy cẩn trọng trước những lời hứa hẹn quá hào nhoáng và tập trung vào sự an toàn bền vững. (${baseMeaning})`;
      } else {
        if (suit === 'pentacles') {
          return `Dòng tiền lưu thông thuận lợi, cơ hội gia tăng thu nhập và tích lũy vững chắc. Kế hoạch tài chính kỷ luật đang đem lại quả ngọt rõ ràng. (${baseMeaning})`;
        }
        if (suit === 'swords') {
          return `Quản lý tài chính minh bạch, phân tích số liệu sắc sảo và quyết đoán loại bỏ những khoản chi bất hợp lý để bảo vệ nguồn lực. (${baseMeaning})`;
        }
        if (suit === 'wands') {
          return `Cơ hội kinh doanh mới đầy triển vọng hoặc dự án bắt đầu sinh lời. Hãy năng động nắm bắt thời cơ để mở rộng nguồn thu. (${baseMeaning})`;
        }
        if (suit === 'cups') {
          return `Sự đủ đầy cả về vật chất lẫn tinh thần. Nguồn tài chính được sử dụng để chăm lo và kiến tạo niềm vui ý nghĩa cho bản thân và gia đình. (${baseMeaning})`;
        }
        return `Bước chuyển biến tích cực về vận thế tài chính. Những quyết định sáng suốt lúc này sẽ đặt nền móng thịnh vượng vững chắc cho tương lai. (${baseMeaning})`;
      }
    }

    case 'health': {
      if (reversed) {
        return `Cảnh báo sự mệt mỏi, căng thẳng tích tụ hoặc thói quen sinh hoạt thiếu điều độ. Hãy ưu tiên nghỉ ngơi, lắng nghe cơ thể và chăm sóc sức khỏe tinh thần. (${baseMeaning})`;
      }
      return `Nguồn sinh lực dồi dào, khả năng phục hồi tốt và sự cân bằng thân - tâm - trí. Hãy duy trì lối sống lành mạnh và giữ vững sự an yên nội tại. (${baseMeaning})`;
    }

    default: // 'general'
      return baseMeaning;
  }
}

/**
 * Tổng hợp lời giải đoán từ các lá bài đã rút theo chuẩn mực Tarot Rider-Waite-Smith:
 * Kết nối mạch truyện Quá khứ → Hiện tại → Tương lai để giải đáp trực diện câu hỏi và chủ đề.
 */
export function buildTarotInterpretation(
  cards: readonly DrawnCard[],
  topic: Topic,
  question: string,
): string {
  const topicObj = TOPICS.find((t) => t.id === topic);
  const topicLabel = topicObj ? topicObj.labelVi : 'Tổng quan';
  const hasQuestion = question.trim().length > 0;
  const cleanQuestion = question.trim();

  const sections: string[] = [];

  // 1. [Tiêu điểm chiêm bái]
  sections.push('[Tiêu điểm chiêm bái]');
  if (hasQuestion) {
    sections.push(`Lĩnh vực: ${topicLabel} • Băn khoăn: "${cleanQuestion}"`);
  } else {
    sections.push(`Lĩnh vực: ${topicLabel} (Thông điệp chiêm nghiệm tổng thể)`);
  }
  sections.push('');

  // 2. [Chiêm nghiệm từng lá theo lăng kính chủ đề]
  sections.push(`[Chiêm nghiệm từng lá theo lăng kính ${topicLabel}]`);
  for (let i = 0; i < cards.length; i++) {
    const drawn = cards[i];
    if (!drawn) continue;

    const posLabel = POSITION_LABELS_VI[drawn.position] ?? drawn.position;
    const orientation = drawn.reversed ? 'Ngược (Reversed)' : 'Xuôi (Upright)';
    const topicMeaning = getCardTopicMeaning(drawn.card, drawn.reversed, topic);
    const symbols = drawn.card.symbolism && drawn.card.symbolism.length > 0
      ? `\n  • Biểu tượng cốt lõi: ${drawn.card.symbolism.join('; ')}`
      : '';

    sections.push(
      `• Vị trí ${i + 1} [${posLabel}]: ${drawn.card.nameVi} (${drawn.card.name}) — ${orientation}\n  • Từ khóa: ${drawn.card.keywords.join(', ')}${symbols}\n  • Lời giải theo lĩnh vực ${topicLabel}: ${topicMeaning}`,
    );
  }
  sections.push('');

  // 3. [Dòng chảy nhân quả Quá khứ - Hiện tại - Tương lai giải đáp băn khoăn]
  sections.push('[Dòng chảy nhân quả & Giải đáp băn khoăn]');
  if (cards.length >= 3) {
    const cardPast = cards[0];
    const cardPresent = cards[1];
    const cardFuture = cards[2];

    const pastDesc = cardPast ? `${cardPast.card.nameVi} (${cardPast.reversed ? 'chiều ngược' : 'chiều xuôi'})` : 'quá khứ';
    const presentDesc = cardPresent ? `${cardPresent.card.nameVi} (${cardPresent.reversed ? 'chiều ngược' : 'chiều xuôi'})` : 'hiện tại';
    const futureDesc = cardFuture ? `${cardFuture.card.nameVi} (${cardFuture.reversed ? 'chiều ngược' : 'chiều xuôi'})` : 'tương lai';

    if (hasQuestion) {
      sections.push(
        `Soi chiếu vào câu hỏi "${cleanQuestion}":\n` +
        `• Cội rễ vấn đề (Quá khứ - ${pastDesc}): Những trải nghiệm hoặc thói quen cũ đã đặt nền móng và dẫn bạn đến tình huống băn khoăn hiện tại.\n` +
        `• Trọng tâm thực tại (Hiện tại - ${presentDesc}): Đây là điểm mấu chốt quyết định. Thách thức lớn nhất đang nằm ở việc bạn có nhận diện đúng điểm mù và dám đối diện với thực tế hay không.\n` +
        `• Tiềm năng chuyển hóa (Tương lai - ${futureDesc}): Xu hướng tự nhiên của câu hỏi này đang mở ra theo hướng trên. Tuy nhiên, tương lai không phải số mệnh đóng đinh mà là kết quả của những lựa chọn bạn đưa ra ngay từ hôm nay.`,
      );
    } else {
      sections.push(
        `Mạch chảy thời gian cho thấy:\n` +
        `• Nền tảng (${pastDesc}) đã tôi luyện bạn qua những trải nghiệm vừa qua.\n` +
        `• Thực tại (${presentDesc}) đòi hỏi sự tập trung trọn vẹn vào bài học trước mắt.\n` +
        `• Xu hướng (${futureDesc}) hứa hẹn sự chuyển biến tích cực nếu bạn kiên định giữ vững sự tỉnh thức.`,
      );
    }
  } else if (cards.length === 1) {
    const single = cards[0];
    if (single) {
      const orientText = single.reversed ? 'ngược' : 'xuôi';
      if (hasQuestion) {
        sections.push(
          `Giải đáp cho câu hỏi "${cleanQuestion}": Lá bài ${single.card.nameVi} ở chiều ${orientText} mang thông điệp tập trung thẳng vào năng lượng "${single.card.keywords.slice(0, 2).join(' & ')}". Hãy chú ý vào lời khuyên cụ thể của lá bài để định hướng hành động.`,
        );
      } else {
        sections.push(
          `Thông điệp trọng tâm: Lá bài ${single.card.nameVi} (${orientText}) soi chiếu vào trạng thái nội tâm của bạn thời điểm này, nhắc nhở về sự cân bằng và làm chủ hoàn cảnh.`,
        );
      }
    }
  } else {
    sections.push(
      'Dòng chảy năng lượng giữa các lá bài cho thấy sự đan xen giữa thử thách ngoại cảnh và sự soi chiếu nội tâm. Lời giải đáp nằm ở việc bạn giữ vững sự chủ động của chính mình.',
    );
  }
  sections.push('');

  // 4. [Chiến lược hành động tỉnh thức]
  sections.push('[Chiến lược hành động tỉnh thức]');
  if (cards.length === 1) {
    const single = cards[0];
    const tip = single?.reversed
      ? 'Hãy chậm lại một nhịp, cẩn trọng rà soát lại các khía cạnh chưa rõ ràng và kiên nhẫn với chính mình trước khi đưa ra quyết định.'
      : 'Thời điểm thuận lợi để bạn tự tin tiến bước. Hãy kiên định với mục tiêu và giữ vững sự trong sáng của tâm trí.';
    sections.push(tip);
  } else {
    const reversedCount = cards.filter((c) => c.reversed).length;
    if (reversedCount === 0) {
      sections.push(
        'Tất cả các lá bài đều ở chiều xuôi, cho thấy dòng chảy năng lượng thuận lợi. Hãy chủ động hành động theo đúng kế hoạch với sự tự tin và quyết tâm.',
      );
    } else if (reversedCount === cards.length) {
      sections.push(
        'Các lá bài đều ở chiều ngược, ngụ ý rằng câu trả lời cho băn khoăn của bạn nằm ở việc tháo gỡ những vướng mắc nội tâm trước khi cố gắng thay đổi hoàn cảnh bên ngoài.',
      );
    } else {
      sections.push(
        'Sự đan xen giữa các chiều năng lượng nhắc nhở bạn: vừa cần linh hoạt thích ứng với hoàn cảnh thực tế, vừa phải kiên định giữ vững các giá trị cốt lõi của bản thân.',
      );
    }
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
