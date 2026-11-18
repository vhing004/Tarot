# Kế hoạch Triển khai: Quy trình Rút bài Tarot 78 lá với Khu vực 3 Slot [Quá khứ - Hiện tại - Tương lai] & Nút Xác nhận

> **Mã kế hoạch**: `PLAN-20261118-tarot-78-fan-slots-flow`  
> **Ngày lập**: 2026-11-18  
> **Trạng thái**: Chờ duyệt (Pending Approval)  
> **Mục tiêu**: Hoàn thiện toàn diện quy trình Tarot 78 lá chuẩn quốc tế: Phù thủy xáo bài -> Trải bài đan xen 3 hàng hình cung -> Chọn lần lượt 3 lá bài bay cong Bézier vào 3 khung nhận bài `[ QUÁ KHỨ ] [ HIỆN TẠI ] [ TƯƠNG LAI ]` -> Tiến trình 0/3..3/3 -> Nút "Xác nhận lựa chọn" -> Lật bài từng lá và hiển thị kết quả chi tiết.

---

## 1. Phân tích Hiện trạng & Yêu cầu Kỹ thuật

### 1.1. Hiện trạng dự án
- **Công nghệ & Thư viện**: Dự án sử dụng Vanilla TypeScript + Three.js + GSAP + HTML/CSS overlay. Tuân thủ nghiêm ngặt **R00 Allowlist** (không dùng React / Framer Motion; GSAP là giải pháp chuẩn công nghiệp tối ưu 60fps cho cả 3D Three.js và DOM overlay).
- **Dữ liệu & Hình ảnh**: Đã có sẵn toàn bộ 78 lá bài Tarot chuẩn quốc tế (`src/modes/tarot/data/cards.json`) và 78 file ảnh số hóa Rider-Waite-Smith 1909 (`public/textures/tarot/*.jpg`).
- **Phù thủy 3D & Hiệu ứng**: Đã có `TarotReader3D` (cử chỉ xáo bài, trải bài, mời rút bài), `CardSparkles` (hạt tóe sáng khi hover), `Card.ts` (khung viền vàng phát sáng `glowRimMesh`).
- **Điểm cần nâng cấp theo đặc tả mới**:
  1. **Khu vực nhận bài 3 Slot trực quan ở phía dưới**: Hiện tại bài được bay về phía trước người chơi trong không gian 3D nhưng chưa có khung nhận bài đồ họa 2D/3D ghi rõ nhãn `[ QUÁ KHỨ ]`, `[ HIỆN TẠI ]`, `[ TƯƠNG LAI ]`, chưa có hiệu ứng bắt sáng slot khi lá bài đáp vào.
  2. **Thanh tiến trình chọn bài**: Cần hiển thị tiến trình `0/3`, `1/3`, `2/3`, `3/3` rõ ràng theo phong cách Mystic Fantasy.
  3. **Bước Xác nhận Lựa chọn (Ready State)**: Sau khi chọn đủ 3 lá bài, không tự động lật ngay mà hiển thị nút **"Xác nhận lựa chọn"**. Người dùng bấm nút này mới bắt đầu hoạt cảnh thu gọn bài thừa và lật mở bài từng lá một cách trang trọng.
  4. **Chống spam click (Moving State Lock)**: Khóa click khi một lá bài đang trong quá trình di chuyển cong Bézier vào slot, ngăn chặn click đúp hoặc chọn quá 3 lá.
  5. **Quản lý danh sách `availableCards` và `selectedCards`**: Loại bỏ tức thì khỏi danh sách tương tác, đảm bảo 100% không trùng lặp lá bài.

---

## 2. Thiết kế Kiến trúc & Giải pháp Chi tiết

### 2.1. Cấu trúc Component Mới & Sửa đổi
```
src/
├── modes/tarot/
│   ├── ui/
│   │   ├── TarotSlotsOverlay.ts    # [TẠO MỚI] Khung 3 Slot Quá khứ - Hiện tại - Tương lai + Tiến trình + Nút Xác nhận
│   │   └── CardInspectOverlay.ts   # [TÁI SỬ DỤNG] Lật xem chi tiết từng lá sau khi xác nhận
│   ├── view/
│   │   ├── DeckView.ts             # [NÂNG CẤP] Quản lý available/selected, bay cong Bézier vào 3 slot, khóa isMoving
│   │   └── TarotReader3D.ts        # [GIỮ NGUYÊN] Cử chỉ xáo bài, mời rút bài
│   └── TarotMode.ts                # [NÂNG CẤP] Máy trạng thái FSM: SHUFFLE -> SPREAD -> SELECTING (MOVING) -> READY -> INSPECT -> READING
├── styles/
│   └── tarot-slots.css             # [TẠO MỚI] Giao diện Mystic Fantasy tím đậm, viền vàng kim, responsive desktop/mobile
```

### 2.2. Chi tiết Component `TarotSlotsOverlay.ts`
- **Giao diện 3 Khung Slot**:
  - Đặt ở phía dưới màn hình (Bottom Dock):
    - `[ Ô 1: QUÁ KHỨ ]` (Xấp xỉ góc dưới bên trái, tương ứng tọa độ 3D $X = -1.35$)
    - `[ Ô 2: HIỆN TẠI ]` (Xấp xỉ góc dưới chính giữa, tương ứng tọa độ 3D $X = 0$)
    - `[ Ô 3: TƯƠNG LAI ]` (Xấp xỉ góc dưới bên phải, tương ứng tọa độ 3D $X = 1.35$)
  - Mỗi khung slot có:
    - Viền vàng kim ma thuật nhấp nháy nhẹ (dashed/glow gold border).
    - Nhãn vị trí: "QUÁ KHỨ", "HIỆN TẠI", "TƯƠNG LAI".
    - Trạng thái `empty` (trống), `targeted` (đang bay vào), `filled` (đã nhận bài thành công kèm hiệu ứng chớp sáng vàng kim).
- **Thanh Tiến trình (Selection Progress)**:
  - Hiển thị: "Đã chọn: 0/3 lá bài", "1/3 lá bài", "2/3 lá bài", "3/3 lá bài (Sẵn sàng)".
  - 3 chấm ngọc phát sáng tím/vàng tương ứng với từng lá đã rút.
- **Nút "Xác nhận lựa chọn" (Confirm Button)**:
  - Mặc định ẩn / mờ.
  - Khi đạt `3/3`: Nút trồi lên với hiệu ứng hào quang vàng kim ma thuật, cho phép người dùng click để bắt đầu nghi thức lật bài.

### 2.3. Logic Rút bài & Di chuyển Cong Bézier (`DeckView.ts`)
- **Quản lý danh sách**:
  - `availableCards: Card3D[]`: Các lá bài còn lại trên 3 hàng xòe bài.
  - `selectedCards: Card3D[]`: 3 lá bài đã được chọn theo thứ tự [0, 1, 2].
- **Chống spam click**:
  - Biến cờ `private isMoving = false;`
  - Khi người dùng click lá bài hợp lệ: đặt `isMoving = true;`, tạm khóa pointer events.
  - Di chuyển lá bài theo quỹ đạo cong Bézier mượt mà (GSAP tween vị trí $X, Y, Z$ và góc xoay $rotX, rotY, rotZ$ hướng vuông góc trực diện với camera trong slot).
  - Khi lá bài chạm vị trí slot: kích hoạt hiệu ứng đặt bài thành công trên `TarotSlotsOverlay`, mở lại `isMoving = false`.
- **Dọn bàn & Chuẩn bị lật**:
  - Khi người dùng nhấn nút "Xác nhận lựa chọn":
    - Toàn bộ bài thừa trong `availableCards` đồng loạt thu nhỏ (`scale: 0.5`) và lướt về góc cọc bài bên tay phải phù thủy ($X = 1.6, Z = -1.3$).
    - 3 lá bài trong slot dịch chuyển nhẹ nhàng vào vị trí tâm điểm sẵn sàng cho hoạt cảnh lật bài 180° theo trục Y.

### 2.4. Máy trạng thái State Machine (`TarotMode.ts`)
- `IDLE` / `QUESTION`: Nhập câu hỏi, chọn trải 3 lá Dòng thời gian và bộ 78 lá.
- `SHUFFLE`: Phù thủy cử động xáo bài (3–4 giây), thuật toán Fisher-Yates CSPRNG chốt kết quả trước (R04).
- `SPREAD`: Xòe 78 lá bài thành 3 hàng đan xen hình cánh cung cân đối.
- `SELECTING`: Bật tương tác hover sáng viền + hạt ánh sáng ma thuật. Người dùng click chọn từng lá:
  - Lá 1 -> Bay vào slot [QUÁ KHỨ] (cập nhật tiến trình 1/3).
  - Lá 2 -> Bay vào slot [HIỆN TẠI] (cập nhật tiến trình 2/3).
  - Lá 3 -> Bay vào slot [TƯƠNG LAI] (cập nhật tiến trình 3/3, kích hoạt chuyển sang trạng thái `READY`).
- `READY`: Khóa click chọn thêm. Hiển thị nút "Xác nhận lựa chọn" phát sáng lung linh.
- `INSPECT` / `REVEALING`: Sau khi xác nhận, gom bài thừa và lật bài lần lượt từng lá (Quá khứ -> Hiện tại -> Tương lai) kèm độ trễ và âm thanh ngân vang.
- `READING`: Hiển thị bảng tổng kết luận giải chi tiết và AI Oracle.

---

## 3. Kế hoạch Triển khai Từng bước

1. **Bước 1**: Tạo file CSS `src/styles/tarot-slots.css` với phong cách Mystic Fantasy (tím huyền bí `#1a0933`, viền vàng kim `#d4af37`, glow animation, responsive).
2. **Bước 2**: Xây dựng component `src/modes/tarot/ui/TarotSlotsOverlay.ts` với đầy đủ 3 khung nhận bài, thanh tiến trình và nút Xác nhận lựa chọn.
3. **Bước 3**: Cập nhật `src/modes/tarot/view/DeckView.ts` hoàn thiện logic `availableCards`, `selectedCards`, cờ `isMoving`, chuyển động Bézier vào 3 slot tương ứng.
4. **Bước 4**: Nâng cấp `src/modes/tarot/TarotMode.ts` tích hợp `TarotSlotsOverlay`, kết nối trạng thái `READY` và nút Xác nhận lựa chọn.
5. **Bước 5**: Kiểm tra chất lượng `npm run check` (TypeScript strict, Vitest unit tests, Rule check, Vite build).

---

## 4. Kế hoạch Kiểm thử & Tiêu chí Đạt (DoD)
- [ ] Xáo bài 78 lá bài mượt mà với cử chỉ Phù thủy 3D trong 3–4 giây.
- [ ] 78 lá bài trải đều đan xen 3 hàng không góc chết.
- [ ] Hover vào từng lá bài có hào quang vàng kim và hạt sáng ma thuật.
- [ ] Chọn lần lượt 3 lá: lá 1 bay vào [QUÁ KHỨ], lá 2 bay vào [HIỆN TẠI], lá 3 bay vào [TƯƠNG LAI].
- [ ] Slot nhận bài phát sáng khi nhận bài thành công; tiến trình cập nhật 0/3 -> 1/3 -> 2/3 -> 3/3.
- [ ] Chống spam click: không thể click chọn thêm khi lá đang bay hoặc khi đã đủ 3 lá; không bao giờ bị trùng lặp lá bài.
- [ ] Nút "Xác nhận lựa chọn" hiện ra trang trọng khi đủ 3 lá; người dùng bấm nút mới bắt đầu lật bài.
- [ ] Lần lượt lật từng lá bài 180° kèm âm thanh và lời giải chi tiết.
- [ ] `npm run check` pass 100% (0 lỗi TypeScript, 0 lỗi Vitest, 0 vi phạm rule).
