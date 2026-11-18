import type { DivinationResult, Reading, TarotResult } from '@/shared/types';
import { lookupHexagram } from '@/modes/divination/logic/lookup';
import { t } from '@/shared/i18n';

/**
 * Dựng ảnh card kết quả bói toán 800x1200 px bằng 2D canvas độc lập (R05 §5, R06 §2).
 * Mặc định không nhúng câu hỏi cá nhân của người dùng để bảo vệ quyền riêng tư.
 */
export async function generateShareCard(
  reading: Reading,
  includeQuestion: boolean = false,
): Promise<string> {
  const width = 800;
  const height = 1200;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể khởi tạo 2D Canvas context');

  // 1. Nền chuyển sắc tím đêm huyền ảo
  const bgGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.4,
    100,
    width / 2,
    height / 2,
    700,
  );
  bgGrad.addColorStop(0, '#24143a');
  bgGrad.addColorStop(0.7, '#110920');
  bgGrad.addColorStop(1, '#080410');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Khung viền đôi mạ vàng đồng
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // 3. Tiêu đề thương hiệu
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f7d877';
  ctx.font = 'bold 36px -apple-system, sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('FORTUNE HUNTER', width / 2, 95);

  ctx.font = '16px -apple-system, sans-serif';
  ctx.fillStyle = '#baa4d8';
  ctx.fillText('CHIÊM BÁI & THẤU SUỐT VẬN MỆNH', width / 2, 125);

  // Đường kẻ phân cách
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
  ctx.beginPath();
  ctx.moveTo(250, 145);
  ctx.lineTo(550, 145);
  ctx.stroke();

  // 4. Nội dung câu hỏi (nếu người dùng bật)
  let currentY = 190;
  if (includeQuestion && reading.question && reading.question.trim().length > 0) {
    ctx.font = 'italic 20px -apple-system, sans-serif';
    ctx.fillStyle = '#e6dcfa';
    ctx.fillText(`"${reading.question.trim()}"`, width / 2, currentY);
    currentY += 45;
  }

  // 5. Thân kết quả theo từng chế độ
  if (reading.mode === 'tarot') {
    const res = reading.result as TarotResult;
    ctx.font = 'bold 28px -apple-system, sans-serif';
    ctx.fillStyle = '#f7d877';
    ctx.fillText(`BÓI BÀI TAROT (${res.spread === 'single' ? 'TRẢI 1 LÁ' : 'TRẢI 3 LÁ'})`, width / 2, currentY + 20);

    currentY += 75;

    // Hiển thị từng lá bài
    for (const card of res.cards) {
      ctx.fillStyle = 'rgba(35, 20, 55, 0.7)';
      ctx.fillRect(80, currentY, width - 160, 95);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.strokeRect(80, currentY, width - 160, 95);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#f7d877';
      ctx.font = 'bold 22px -apple-system, sans-serif';
      const orientation = card.reversed ? '[Ngược]' : '[Xuôi]';
      ctx.fillText(`${card.card.nameVi} (${card.card.name}) ${orientation}`, 105, currentY + 38);

      ctx.fillStyle = '#a498b8';
      ctx.font = '16px -apple-system, sans-serif';
      ctx.fillText(`Từ khóa: ${card.card.keywords.join(', ')}`, 105, currentY + 70);

      currentY += 115;
    }
  } else {
    // Kinh Dịch
    const res = reading.result as DivinationResult;
    const primaryHex = lookupHexagram(res.primaryKey);
    const changedHex = res.changedKey ? lookupHexagram(res.changedKey) : null;

    ctx.font = 'bold 28px -apple-system, sans-serif';
    ctx.fillStyle = '#f7d877';
    ctx.fillText('QUẺ KINH DỊCH', width / 2, currentY + 20);

    currentY += 75;

    // Hộp Quẻ Chủ
    ctx.fillStyle = 'rgba(35, 20, 55, 0.7)';
    ctx.fillRect(80, currentY, width - 160, 110);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.strokeRect(80, currentY, width - 160, 110);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f7d877';
    ctx.font = 'bold 22px -apple-system, sans-serif';
    ctx.fillText(`Quẻ Chủ: ${primaryHex.nameVi} (${primaryHex.name})`, 105, currentY + 40);

    ctx.fillStyle = '#dcd4eb';
    ctx.font = '16px -apple-system, sans-serif';
    const judgePreview =
      primaryHex.judgement.length > 70
        ? `${primaryHex.judgement.slice(0, 70)}...`
        : primaryHex.judgement;
    ctx.fillText(judgePreview, 105, currentY + 75);

    currentY += 130;

    // Hộp Quẻ Biến (nếu có)
    if (changedHex) {
      ctx.fillStyle = 'rgba(35, 20, 55, 0.7)';
      ctx.fillRect(80, currentY, width - 160, 95);
      ctx.strokeStyle = 'rgba(255, 120, 50, 0.4)';
      ctx.strokeRect(80, currentY, width - 160, 95);

      ctx.fillStyle = '#ffaa66';
      ctx.font = 'bold 20px -apple-system, sans-serif';
      ctx.fillText(
        `Quẻ Biến: ${changedHex.nameVi} (${res.movingLines.length} hào động: Hào ${res.movingLines.join(', ')})`,
        105,
        currentY + 40,
      );

      ctx.fillStyle = '#dcd4eb';
      ctx.font = '16px -apple-system, sans-serif';
      ctx.fillText('Thời thế đang trong chu kỳ chuyển dịch.', 105, currentY + 70);

      currentY += 115;
    }
  }

  // 6. Lời khuyên chiêm bái
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f7d877';
  ctx.font = 'bold 18px -apple-system, sans-serif';
  ctx.fillText('— THÔNG ĐIỆP CHIÊM BÁI —', width / 2, currentY + 40);

  ctx.fillStyle = '#f0eaf8';
  ctx.font = '16px -apple-system, sans-serif';
  const adviceLines = wrapText(ctx, reading.interpretation.split('\n')[0] ?? '', width - 180);
  for (let j = 0; j < Math.min(adviceLines.length, 3); j++) {
    ctx.fillText(adviceLines[j]!, width / 2, currentY + 75 + j * 26);
  }

  // 7. Disclaimer bắt buộc (R05 §2)
  ctx.fillStyle = '#8b7e9f';
  ctx.font = 'italic 14px -apple-system, sans-serif';
  ctx.fillText(t('disclaimer'), width / 2, height - 60);

  return canvas.toDataURL('image/png');
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] ?? '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i]!;
    const width = ctx.measureText(`${currentLine} ${word}`).width;
    if (width < maxWidth) {
      currentLine += ` ${word}`;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Chia sẻ ảnh qua navigator.share hoặc tải trực tiếp về máy
 */
export async function shareOrDownloadImage(dataUrl: string, filename: string): Promise<void> {
  try {
    if (navigator.share && navigator.canShare) {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Fortune Hunter - Kết Quả Chiêm Bái',
        });
        return;
      }
    }
  } catch {
    // Chuyển sang tải trực tiếp nếu chia sẻ bị hủy hoặc không hỗ trợ
  }

  // Fallback tải xuống
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
