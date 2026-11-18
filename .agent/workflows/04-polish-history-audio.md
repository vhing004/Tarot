---
id: W04
name: polish-history-audio
phase: P3
description: Lịch sử bói, chia sẻ ảnh kết quả, âm thanh, hiệu ứng nến/khói, cài đặt, polish UI.
requires: [W03, P2 hoàn thành]
rules: [R00, R01, R02, R03, R05, R06, R07]
next: W05
---
# W04: Hoàn thiện trải nghiệm (P3)

## Mục tiêu
Bản demo hoàn chỉnh: lịch sử, chia sẻ, âm thanh, hiệu ứng, cài đặt. **Không thêm tính năng mới ngoài danh sách**; ý tưởng mới đi qua [W10](10-add-feature.md).

## Entry gate
P2 `[x]` (G1, G2, G3, G5). Nhánh `phase/p3-polish`.

## Rule áp dụng
[R03](../rules/R03-performance.md) (hiệu ứng không phá ngân sách), [R05 §5](../rules/R05-content-safety.md) (dữ liệu cá nhân), [R06 §2-3](../rules/R06-security.md).

## Các bước (tuần tự; mỗi bước tự thành một commit)
### 1. Lịch sử (`ui/History.ts`)
- Danh sách lượt bói (mới nhất trước) từ `repo.list()`: ngày, mode, câu hỏi (cắt gọn), kết quả tóm tắt.
- Xem chi tiết = dựng lại `ReadingPanel` từ `Reading` đã lưu (không bói lại).
- Xóa từng lượt, xóa tất cả (có xác nhận). Mọi chữ qua `textContent`.
- Bản ghi hỏng/phiên bản cũ: bỏ qua có thông báo nhẹ ([R06 §3](../rules/R06-security.md)).
- Test thuần: `services/reading.ts` tóm tắt `Reading` (không phụ thuộc DOM).

### 2. Chia sẻ ảnh kết quả
- Dựng ảnh bằng `<canvas>` 2D riêng (nền, tên quẻ/lá, vài dòng tóm tắt, disclaimer, tên game). **Không** nhúng câu hỏi cá nhân mặc định (cho người dùng bật).
- Không dùng `preserveDrawingBuffer`. Nếu chụp cảnh 3D: gọi `renderer.render(...)` rồi `toDataURL` **trong cùng một tick**.
- Chia sẻ bằng `navigator.share` (nếu có) hoặc tải xuống.

### 3. Âm thanh (`core/AudioManager.ts`)
- Nhạc nền loop, SFX: xáo, lật bài, xu rơi, chuông kết quả.
- Chỉ phát sau tương tác đầu tiên (chính sách autoplay). Âm lượng + tắt tiếng lưu vào settings.
- Tải file âm thanh theo mode (không tải hết lúc đầu). Ghi nguồn + giấy phép vào `SOURCES.md` ([R05 §1](../rules/R05-content-safety.md)).
- `dispose()` dừng và giải phóng buffer.

### 4. Hiệu ứng
- Khói/hạt: `Points` (một geometry, một material), số hạt phụ thuộc mức `Quality` ([R03 §5](../rules/R03-performance.md)).
- Nến chập chờn bằng intensity + emissive (đã có từ P0).
- Chuyển cảnh camera bằng GSAP, đều qua `engine.trackTween`.
- Bloom: tùy chọn, **mặc định tắt trên mobile**; tải lười.

### 5. Cài đặt (`ui/Settings.ts`)
Âm lượng, tắt tiếng, chất lượng (Thấp/Vừa/Cao/Tự động), giảm chuyển động (theo `prefers-reduced-motion` làm mặc định), ngôn ngữ (vi; sẵn khung en). Lưu qua một `SettingsRepository` nhỏ dùng cùng cơ chế an toàn của [R06 §3](../rules/R06-security.md).

### 6. Polish UI/UX
Responsive dọc/ngang, bottom sheet trên mobile, trạng thái loading/lỗi/trống, focus bàn phím cho nút, độ tương phản chữ, nút bỏ qua animation ở mọi mode.

### 7. Kiểm tra
- `npm run check`.
- Chạy lại checklist hai mode ([R07 §5](../rules/R07-quality-gates.md)) + lịch sử + chia sẻ + settings.
- **G3** với hiệu ứng/âm thanh bật.
- **G6**: không `innerHTML` động, localStorage an toàn, không gửi câu hỏi ra ngoài.

## Exit gate
**G1, G2, G3, G6** đạt, kèm bằng chứng.
- [ ] Mất mạng vẫn chơi được toàn bộ (không phụ thuộc dịch vụ ngoài).
- [ ] Xóa lịch sử thực sự xóa khỏi `localStorage`.
- [ ] Âm thanh không phát trước tương tác; tắt tiếng được lưu.

## Cập nhật state
P3 `[x]`, tag `v0.3.0`, đặt "Phase hiện tại" = P4.

## Tiếp theo
[W13](13-quality-gate.md) → [W14](14-end-session.md); phiên sau W00 → [W05](05-optimize-performance.md).
