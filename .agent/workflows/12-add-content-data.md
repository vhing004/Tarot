---
id: W12
name: add-content-data
description: Thêm/sửa dữ liệu bài Tarot và quẻ: schema, nguồn/giấy phép, giọng văn, test, CONTENT_STATUS.
requires: [W00, G0]
rules: [R00, R02, R04, R05, R07]
next: W13
---
# W12: Thêm dữ liệu nội dung

## Mục tiêu
Nội dung đúng schema, đúng bản quyền, đúng giọng văn; không phá logic.

## Entry gate
G0. Biết mục tiêu: lô nào (vd 8 lá Cups, quẻ 5-12).

## Các bước
1. **Chọn lô** ≤ 10 mục/commit. Ghi lô vào PROJECT_STATE ("Việc tiếp theo").
2. **Schema**:
   - Tarot: `{ id, name, nameVi, image, keywords[], upright, reversed }` (`id` 0..77; Ẩn Chính 0..21).
   - Quẻ: khóa = chuỗi 6 bit (hào 1 đứng đầu); giá trị `{ id (1..64, thứ tự Văn Vương), name, nameVi, judgement, lines[6] }`.
   - Với quẻ: kiểm khóa bằng quy tắc [R04 §4](../rules/R04-fairness-divination.md) (hạ quái = 3 hào đầu, thượng quái = 3 hào sau, hào 1 ở đầu chuỗi). Đối chiếu các test vector (Càn, Khôn, Truân, Mông, Cấu).
3. **Nguồn & giấy phép** ([R05 §1](../rules/R05-content-safety.md)): ảnh (RWS 1909 public domain hoặc tự vẽ/được cấp phép), âm thanh, font. Thêm dòng vào `SOURCES.md` (file, nguồn, tác giả, giấy phép, yêu cầu ghi công). **Không có dòng = không commit asset.**
4. **Viết lời giải bằng lời của dự án** (không chép bản dịch có bản quyền): ngắn gọn, dễ hiểu, cả mặt tích cực và lưu ý ([R05 §3](../rules/R05-content-safety.md)). Không dự đoán bệnh/chết, không khẳng định y tế/pháp lý/tài chính.
5. **Tối ưu ảnh**: 512x880 `.webp`; tên `NN-<slug>.webp`.
6. **Test dữ liệu** (`data.test.ts`):
   - Tarot: id duy nhất, chuỗi không rỗng, ảnh tồn tại.
   - Quẻ: key `/^[01]{6}$/`, không trùng, `id` duy nhất 1..64, `lines.length === 6`.
   - Nếu `CONTENT_STATUS === 'full'`: đủ 78 lá và đủ 64 quẻ.
7. **`CONTENT_STATUS`**: giữ `sample` cho tới khi đủ dữ liệu; chuyển `full` trong commit riêng, kèm kết quả test chặt.
8. Chạy `npm run check` và mở game xem thử vài mục mới (lời giải hiển thị đúng, ảnh đúng lá).

## Exit gate
**G5** đạt (+ G1, G2). Bằng chứng: kết quả test, trang `SOURCES.md`.

## Cập nhật state
Cập nhật số lượng nội dung (n/78 lá, n/64 quẻ) và `CONTENT_STATUS` trong PROJECT_STATE.

## Tiếp theo
[W13](13-quality-gate.md) → [W14](14-end-session.md).
