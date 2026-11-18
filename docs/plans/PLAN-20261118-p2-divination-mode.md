# Kế hoạch Thực hiện: Chế độ Gieo quẻ Kinh Dịch MVP (Phase P2 / W03)

- **Mã kế hoạch**: `PLAN-20261118-p2-divination-mode`
- **Phase**: P2 (Divination Mode MVP)
- **Workflow tương ứng**: W03 (Build Divination Mode)
- **Mục tiêu**: Xây dựng hoàn chỉnh chế độ Gieo quẻ Kinh Dịch (I Ching) bằng phương pháp 3 đồng xu x 6 lần gieo, đảm bảo tính chuẩn xác tuyệt đối về thuật toán (thứ tự hào từ dưới lên, hào động 6 và 9, dựng quẻ chủ và quẻ biến), hoạt họa đồng xu và 6 hào khớp chính xác với kết quả đã chốt trước, tra cứu cơ sở dữ liệu quẻ mẫu và lưu trữ an toàn.

---

## 1. Phân tích & Yêu cầu Kỹ thuật

### 1.1 Nguyên tắc công bằng & Thuật toán Kinh Dịch (R04 §4, §5)
- **Quy tắc gieo 3 đồng xu**:
  - Mỗi đồng xu: Ngửa = 3, Sấp = 2. Tổng điểm `sum` từ 6 đến 9:
    - `sum = 9` (3 ngửa): Hào Dương (Lão Dương) -> **Hào Động**, biến thành Âm.
    - `sum = 8` (2 ngửa, 1 sấp): Hào Âm (Thiếu Âm) -> Hào Tĩnh.
    - `sum = 7` (1 ngửa, 2 sấp): Hào Dương (Thiếu Dương) -> Hào Tĩnh.
    - `sum = 6` (3 sấp): Hào Âm (Lão Âm) -> **Hào Động**, biến thành Dương.
- **Thứ tự hào từ DƯỚI LÊN**:
  - Lần gieo 1 = Hào 1 (Sơ Hào - dưới cùng, index 0).
  - Lần gieo 6 = Hào 6 (Thượng Hào - trên cùng, index 5).
  - `primaryKey`: Chuỗi 6 bit, ký tự đầu tiên là hào 1. Dương = '1', Âm = '0'.
  - `changedKey`: Đảo các hào động. Nếu không có hào động nào -> `null`.
  - `movingLines`: Mảng số thứ tự hào động (1..6).
- **Chốt kết quả bằng CSPRNG trước khi diễn hoạt (R04 §1)**:
  - Khi bắt đầu gieo, toàn bộ 6 lần gieo xu được tính toán sẵn một lần duy nhất qua `castHexagram(cryptoRandom)`. Animation chỉ diễn lại chính xác từng mặt đồng xu và từng vạch hào.
  - Áp dụng đầy đủ toàn bộ bộ test vectors tại R04 §5.

### 1.2 Dữ liệu Quẻ mẫu & Bản quyền (R05 §1)
- `src/modes/divination/data/hexagrams.json`:
  - Khóa bằng chuỗi 6 bit (`/^[01]{6}$/`).
  - Dữ liệu mẫu ban đầu gồm các quẻ bắt buộc để khớp test vector:
    - `"111111"`: Quẻ Càn (Thuần Càn, ID 1)
    - `"000000"`: Quẻ Khôn (Thuần Khôn, ID 2)
    - `"100010"`: Quẻ Thủy Lôi Truân (ID 3)
    - `"010001"`: Quẻ Sơn Thủy Mông (ID 4)
    - `"011111"`: Quẻ Thiên Phong Cấu (ID 44 - quẻ biến mẫu từ Càn động hào 1)
    - Cùng 3-5 quẻ phổ biến khác (Thủy Hỏa Ký Tế, Hỏa Thủy Vị Tế, Địa Thiên Thái, Thiên Địa Bĩ...).
  - Mỗi quẻ gồm: `id, name, nameVi, judgement, lines: [string, string, string, string, string, string]`.
  - Cơ chế dự phòng (fallback): Khi gieo ra quẻ chưa có trong file JSON mẫu, hiển thị thông điệp thân thiện ("Nội dung quẻ này đang được cập nhật") và **vẫn vẽ đầy đủ hình quẻ 3D**, tuyệt đối không crash.
  - `src/modes/divination/data/SOURCES.md`: Ghi nhận nguồn gốc và biên soạn độc quyền lời quẻ (R05 §1).

### 1.3 Tầng Đồ họa 3D (R01, R03)
- `src/modes/divination/view/Coin.ts`:
  - 3 đồng xu 3D dùng chung 1 `CylinderGeometry` dẹt và material kim loại vàng đồng cổ.
  - Diễn hoạt tung xu qua GSAP: Nhấc lên, xoay số vòng nguyên + góc dừng (0 rad nếu ngửa / π rad nếu sấp) để đảm bảo mặt xu dừng lại đúng 100% với giá trị đã chốt (R04 §6). Đăng ký qua `engine.trackTween()`.
- `src/modes/divination/view/HexagramView.ts`:
  - Vẽ trực quan 6 hào từ dưới lên trên đĩa bói:
    - Hào Dương: 1 vạch liền dài.
    - Hào Âm: 2 vạch đứt có khe hở ở giữa.
    - Hào Động: Đánh dấu phát sáng nhẹ và biểu tượng biến hào ở bước `CHANGE`.
- Tuyệt đối không import chéo giữa `tarot` và `divination` (R01 §3). Dọn dẹp sạch sẽ khi `dispose()`.

### 1.4 Máy trạng thái FSM & Giao diện
- Chuỗi trạng thái:
  `INTRO -> CONCENTRATE -> THROW(x6) -> BUILD -> CHANGE -> READING -> SAVE`.
  - `CONCENTRATE`: Giữ nút "Tập trung ý niệm" (thanh năng lượng hiển thị cảm giác huyền bí, không ảnh hưởng kết quả).
  - `THROW`: Lần lượt tung 3 xu và vẽ hào tương ứng từ dưới lên. Có nút bỏ qua animation.
  - `BUILD`: Ghép 6 hào thành quẻ chủ hoàn chỉnh.
  - `CHANGE`: Nếu có hào động, kích hoạt hiệu ứng biến hào thành quẻ biến. Nếu không có hào động, bỏ qua bước này.
  - `READING`: Hiển thị tên quẻ chủ, lời phán (judgement), ý nghĩa các hào động, tên quẻ biến (nếu có).
  - `SAVE`: Tự động lưu `Reading` vào `LocalRepository`.

---

## 2. Danh sách File dự kiến tạo mới / cập nhật

### Logic Thuần (Pure Zones)
- `src/modes/divination/logic/hexagram.ts` (`throwCoins`, `castHexagram`, `buildKeys`)
- `src/modes/divination/logic/lookup.ts` (`lookupHexagram`)
- `src/modes/divination/logic/interpret.ts` (`buildDivinationInterpretation`)
- `src/modes/divination/logic/__tests__/hexagram.test.ts` (100% test vectors R04 §5)
- `src/modes/divination/logic/__tests__/interpret.test.ts`

### Dữ liệu & Assets
- `src/modes/divination/data/hexagrams.json` (quẻ mẫu chuẩn 6 bit)
- `src/modes/divination/data/SOURCES.md`
- `src/modes/divination/data/__tests__/data.test.ts` (kiểm tra toàn vẹn JSON và quy tắc 6 bit)

### Tầng Đồ họa 3D
- `src/modes/divination/view/Coin.ts` (Mesh đồng xu 3D, flip rotation)
- `src/modes/divination/view/HexagramView.ts` (Hiển thị 6 vạch hào 3D từ dưới lên, hiệu ứng hào động)
- `src/modes/divination/DivinationMode.ts` (FSM 7 trạng thái hoàn chỉnh)

### Giao diện & Strings
- Mở rộng `src/ui/ReadingPanel.ts` để hiển thị quẻ chủ, hào động và quẻ biến
- Bổ sung chuỗi ngôn ngữ vào `src/shared/strings.vi.ts`

---

## 3. Các bước thực hiện tuần tự

1. **Bước 1: Chuyển nhánh Git**: Tạo và chuyển sang nhánh `phase/p2-divination`.
2. **Bước 2: Logic thuần test-first**:
   - Viết test vectors trước trong `src/modes/divination/logic/__tests__/hexagram.test.ts`.
   - Cài đặt `hexagram.ts` cho đến khi tất cả các test vectors pass.
3. **Bước 3: Dữ liệu Quẻ mẫu & Lookup**:
   - Tạo `src/modes/divination/data/hexagrams.json` (khóa 6 bit, kèm fallback an toàn).
   - Tạo `src/modes/divination/data/SOURCES.md` và viết test `data.test.ts`.
   - Triển khai `lookup.ts` và `interpret.ts` kèm unit tests.
4. **Bước 4: Tầng hiển thị 3D (`Coin.ts`, `HexagramView.ts`)**:
   - Dựng 3 đồng xu 3D, animation tung rơi lật đúng mặt.
   - Dựng hiển thị 6 hào từ dưới lên với hào dương (liền), hào âm (đứt), hào động (phát sáng).
5. **Bước 5: Hoàn thiện `DivinationMode.ts` (FSM)**:
   - Triển khai toàn bộ luồng FSM `INTRO -> CONCENTRATE -> THROW -> BUILD -> CHANGE -> SAVE -> READING`.
   - Tích hợp lưu trữ `LocalRepository`.
6. **Bước 6: Mở rộng UI ReadingPanel**:
   - Hiển thị thông tin quẻ Kinh Dịch, hào động và quẻ biến với `textContent` an toàn XSS.
7. **Bước 7: Chạy Cổng chất lượng (Quality Gates)**:
   - Kiểm tra `npm run check` (typecheck, vitest, check:rules, build).
   - Kiểm tra vòng đời G3 (vào/ra DivinationMode 3 lần baseline không rò rỉ bộ nhớ).
   - Cập nhật `PROJECT_STATE.md` và `PROJECT_PLAN.md`, gắn tag `v0.2.0`.

---

## 4. Tiêu chí Hoàn thành (Definition of Done cho P2)
- [ ] 100% test vectors tại R04 §5 pass trong Vitest.
- [ ] Gieo 6 lần xu dừng đúng mặt như dữ liệu kết quả, hào vẽ đúng thứ tự từ dưới lên.
- [ ] Quẻ chủ, các hào động (chỉ hào 6 và 9), quẻ biến hiển thị chuẩn xác.
- [ ] `npm run check` pass 100% (không lỗi TS, 0 vi phạm rule-check, build tạo chunk `divination` tách riêng, không import chéo với `tarot`).
- [ ] Bộ nhớ được giải phóng hoàn toàn sau khi thoát mode.
