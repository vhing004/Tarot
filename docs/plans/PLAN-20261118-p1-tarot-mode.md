# Kế hoạch Thực hiện: Xây dựng Chế độ Tarot MVP (Phase P1 / W02)

- **Mã kế hoạch**: `PLAN-20261118-p1-tarot-mode`
- **Phase**: P1 (Tarot MVP)
- **Workflow tương ứng**: W02 (Build Tarot Mode)
- **Mục tiêu**: Xây dựng hoàn chỉnh chế độ Tarot MVP với 22 lá Ẩn Chính (Major Arcana), quy trình trải bài chuẩn phong cách 3D (xáo bài, trải bài quạt, chọn 1 hoặc 3 lá, lật bài 3D xuôi/ngược), giải đoán ngữ nghĩa theo chủ đề/vị trí, nhập câu hỏi có kiểm soát an toàn nội dung, lưu lịch sử tự động và dọn dẹp bộ nhớ tuyệt đối.

---

## 1. Phân tích & Yêu cầu Kỹ thuật

### 1.1 Nguyên tắc kiến trúc & tính công bằng (R01, R04)
- **Vùng thuần (`src/modes/tarot/logic/**`)**:
  - `deck.ts`: Hàm `drawCards(deck, n, rng)` xáo bài bằng `shuffle()` (Fisher-Yates) và chốt `reversed = rng.nextInt(2) === 1`. Kết quả bói được chốt **1 lần duy nhất** ngay khi xáo bài trước khi diễn hoạt.
  - `spreads.ts`: Định nghĩa kiểu và vị trí trải bài: `single: ['present']`, `three: ['past', 'present', 'future']`.
  - `interpret.ts`: Tạo lời giải đoán có cấu trúc từ lá bài, vị trí trải bài, trạng thái xuôi/ngược và chủ đề (`Topic`).
  - Toàn bộ thư mục `logic` cấm import `three`, `gsap`, hay DOM API; test 100% bằng Vitest.
- **Tầng hiển thị 3D (`src/modes/tarot/view/**`)**:
  - `Card.ts`: Dùng chung 1 `BoxGeometry` mỏng và 1 material mặt sau (`back.webp`) cho tất cả các lá bài (R03 §2, §5). Texture mặt trước chỉ được nạp khi lá bài được chọn/lật (tải lười - lazy loading). Hiệu ứng lật bài bằng GSAP xoay quanh trục kết hợp `engine.trackTween()`.
  - `DeckView.ts`: Quản lý animation xáo bài, xòe quạt trên bàn bói, tương tác chọn lá bài thông qua Three.js `Raycaster` và Pointer Events (`touch-action: none`).
- **Máy trạng thái Tarot FSM (`TarotMode.ts`)**:
  - Luồng tuần tự: `INTRO -> QUESTION -> SHUFFLE -> SPREAD -> PICK -> REVEAL -> READING -> SAVE`.
  - Có nút "Bỏ qua animation" để nhảy thẳng đến kết quả cuối của cùng một `TarotResult`.
  - Hủy toàn bộ tween GSAP, listener và gọi `dispose()` sạch sẽ khi thoát ra Menu (Gate G3).

### 1.2 Dữ liệu & Bản quyền nội dung (R05)
- Dữ liệu 22 lá Ẩn Chính Rider-Waite-Smith (1909, Public Domain):
  - `src/modes/tarot/data/cards.json`: 22 lá (id 0..21, name, nameVi, image, keywords, upright, reversed).
  - Ảnh mặt bài và mặt sau được lưu tại `public/textures/tarot/` dạng `.webp` nhẹ, tối ưu tải.
  - Ghi nhận đầy đủ nguồn gốc và giấy phép trong `src/modes/tarot/data/SOURCES.md` (Gate G5).

### 1.3 Giao diện & An toàn người dùng (R05, R06)
- `src/ui/QuestionForm.ts`: Cho phép nhập câu hỏi, chọn chủ đề (`general`, `love`, `career`, `money`, `health`), chọn kiểu trải (1 lá hoặc 3 lá).
  - Tích hợp `isSensitiveQuestion()`: Nếu câu hỏi có dấu hiệu tự hại/khủng hoảng, dừng bói và hiển thị thông điệp hỗ trợ ấm áp, không gửi ra ngoài.
- `src/ui/ReadingPanel.ts`: Hiển thị chi tiết từng lá (tên, từ khóa, vị trí, xuôi/ngược), tổng hợp lời giải, disclaimer bắt buộc. Sử dụng HTML overlay kết hợp `textContent` chống XSS.

---

## 2. Danh sách File dự kiến tạo mới / cập nhật

### Dữ liệu & Assets
- `src/modes/tarot/data/cards.json` (22 lá Ẩn Chính)
- `src/modes/tarot/data/SOURCES.md` (Ghi nhận bản quyền RWS 1909 Public Domain)
- `public/textures/tarot/back.webp` & `00-fool.webp` ... `21-world.webp` (Bộ texture WebP tối ưu)

### Logic Thuần (Pure Zones)
- `src/modes/tarot/logic/deck.ts`
- `src/modes/tarot/logic/spreads.ts`
- `src/modes/tarot/logic/interpret.ts`
- `src/modes/tarot/logic/__tests__/deck.test.ts`
- `src/modes/tarot/logic/__tests__/interpret.test.ts`
- `src/modes/tarot/data/__tests__/data.test.ts` (kiểm tra toàn vẹn schema JSON và file ảnh)

### Tầng Đồ họa 3D (Three.js + GSAP)
- `src/modes/tarot/view/Card.ts` (Đối tượng lá bài 3D, flip tween)
- `src/modes/tarot/view/DeckView.ts` (Chồng bài, xáo bài, xòe quạt, raycast click)
- `src/modes/tarot/TarotMode.ts` (Nâng cấp FSM 8 trạng thái, phối hợp View + Logic + UI)

### Giao diện UI (HTML Overlay)
- `src/ui/QuestionForm.ts` (Form câu hỏi, chủ đề, kiểu trải)
- `src/ui/ReadingPanel.ts` (Bảng kết quả lời giải, responsive bottom sheet)
- `src/ui/styles/tarot.css` (hoặc mở rộng `src/ui/styles/main.css`)
- `src/shared/strings.vi.ts` (Bổ sung chuỗi ngôn ngữ cho Tarot)

---

## 3. Các bước thực hiện tuần tự

1. **Bước 1: Chuyển nhánh Git**
   - Tạo và chuyển sang nhánh `phase/p1-tarot`.
2. **Bước 2: Chuẩn bị Dữ liệu & Asset Tarot**
   - Tạo file `cards.json` với 22 lá Ẩn Chính chuẩn Rider-Waite.
   - Tạo các texture bài WebP và mặt sau bài tại `public/textures/tarot/`.
   - Tạo `src/modes/tarot/data/SOURCES.md`.
   - Viết unit test `data.test.ts` kiểm tra 22 ID duy nhất, trường dữ liệu đầy đủ và file ảnh tồn tại.
3. **Bước 3: Triển khai Logic thuần & Unit Tests**
   - Triển khai `deck.ts`, `spreads.ts`, `interpret.ts`.
   - Viết test trong `src/modes/tarot/logic/__tests__/`: kiểm tra không lặp lá, đủ số lá, phân phối `reversed`, lời giải chính xác theo vị trí và chủ đề.
4. **Bước 4: Triển khai View 3D (`Card.ts`, `DeckView.ts`)**
   - `Card.ts`: Tạo mesh mỏng với geometry dùng chung, flip animation qua GSAP có đăng ký `trackTween`.
   - `DeckView.ts`: Hiệu ứng xáo bài (shuffle animation), trải quạt (spread animation), tính toán vị trí raycast khi người dùng click/chạm chọn lá bài.
5. **Bước 5: Nâng cấp `TarotMode.ts` (FSM)**
   - Xây dựng FSM với 7 trạng thái: `INTRO -> QUESTION -> SHUFFLE -> SPREAD -> PICK -> REVEAL -> READING -> SAVE`.
   - Chốt kết quả bói qua RNG ngay bước đầu, view chỉ diễn hoạt theo kết quả.
   - Lưu kết quả vào `LocalRepository` trong state `SAVE`.
6. **Bước 6: Xây dựng UI Overlay (`QuestionForm`, `ReadingPanel`)**
   - Triển khai `QuestionForm` và `ReadingPanel` an toàn XSS (`textContent`).
   - Xử lý chặn câu hỏi nhạy cảm và hiện thông điệp hỗ trợ.
7. **Bước 7: Kiểm tra & Chạy Cổng chất lượng (Quality Gates)**
   - Chạy `npm run check` (typecheck, vitest, check:rules, build).
   - Kiểm tra vòng đời G3 (vào/ra TarotMode 3 lần liên tiếp, đo `renderer.info.memory`).
   - Cập nhật nhật ký gate trong `PROJECT_STATE.md` và `PROJECT_PLAN.md`.
   - Tạo git commit và tag `v0.1.0`.

---

## 4. Tiêu chí Hoàn thành (Definition of Done cho P1)
- [ ] Chơi trọn vẹn 1 lượt bói Tarot: Nhập câu hỏi -> Xáo bài -> Trải bài quạt 3D -> Chọn 1 hoặc 3 lá -> Lật bài 3D -> Đọc lời giải tại ReadingPanel -> Tự động lưu vào lịch sử.
- [ ] `npm run check` pass 100% (không lỗi TypeScript, tests pass, 0 vi phạm rule-check, build tạo chunk `tarot` tách riêng).
- [ ] Rút 1 lá hoặc 3 lá hiển thị đúng vị trí (Quá khứ / Hiện tại / Tương lai) và xuôi/ngược khớp chính xác với kết quả đã chốt.
- [ ] Không có rò rỉ bộ nhớ khi vào/ra mode Tarot nhiều lần.
- [ ] Ghi nhận đầy đủ nguồn gốc bản quyền trong `SOURCES.md`.
