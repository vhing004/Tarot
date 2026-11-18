# Kế hoạch Thực hiện: Hoàn thiện Trải nghiệm, Lịch sử, Âm thanh & Hiệu ứng (Phase P3 / W04)

- **Mã kế hoạch**: `PLAN-20261118-p3-polish-history-audio`
- **Phase**: P3 (Polish, History, Audio & Effects)
- **Workflow tương ứng**: W04 (Polish History Audio)
- **Mục tiêu**: Xây dựng trải nghiệm trọn vẹn và hoàn thiện cho game bói 3D Fortune-Hunter: giao diện quản lý lịch sử bói toán (xem lại, xóa từng lượt, xóa tất cả), công cụ xuất ảnh chia sẻ mạng xã hội (bằng 2D canvas bảo mật dữ liệu cá nhân), hệ thống âm thanh Web Audio AudioManager (BGM ambient huyền bí, SFX xáo bài/lật bài/xu rơi/chuông kết quả), hiệu ứng hạt khói trầm hương 3D (`Points`), bảng cài đặt (âm lượng, chất lượng, giảm chuyển động) và mở khóa các tính năng trên Menu chính.

---

## 1. Phân tích & Yêu cầu Kỹ thuật

### 1.1 Quản lý Lịch sử Bói toán & Dữ liệu thuần (R05 §5, R06 §2-3)
- `src/services/reading.ts` (Vùng thuần):
  - Hàm thuần `summarizeReading(reading: Reading): { title: string; subtitle: string; previewText: string }` giúp tạo tóm tắt ngắn gọn hiển thị trong danh sách lịch sử mà không phụ thuộc DOM, có unit test đầy đủ.
- `src/ui/History.ts` (HTML Overlay):
  - Danh sách các lượt bói từ `repo.list()`, sắp xếp mới nhất lên đầu.
  - Xem chi tiết: Tái sử dụng `ReadingPanel` để hiển thị lại chính xác kết quả bói mà không sinh lượt bói mới.
  - Xóa lượt bói: Cho phép xóa từng bản ghi hoặc xóa toàn bộ lịch sử (có hộp thoại xác nhận).
  - Sử dụng 100% `textContent` chống tấn công XSS (R06 §2).
  - Tự động bỏ qua an toàn nếu gặp bản ghi lỗi từ localStorage (R06 §3).

### 1.2 Công cụ Tạo & Chia sẻ Ảnh Kết quả (R05 §5, R06 §2)
- `src/services/share.ts`:
  - Dựng thẻ bài kết quả kích thước chuẩn chia sẻ (800x1200 px) bằng `<canvas>` 2D độc lập:
    - Nền chuyển sắc tím đêm huyền bí + khung viền vàng đồng sang trọng.
    - Tiêu đề "Fortune Hunter" và biểu tượng huyền bí.
    - Tên và hình ảnh/biểu tượng các lá bài hoặc Quẻ chủ / Quẻ biến.
    - Lời khuyên/thông điệp chiêm bái cốt lõi.
    - Dòng disclaimer bắt buộc theo R05 §2.
    - **Bảo mật dữ liệu cá nhân (R05 §5)**: Mặc định KHÔNG nhúng câu hỏi cá nhân vào ảnh chia sẻ, có tùy chọn cho người dùng bật nếu muốn.
  - Sử dụng Web Share API (`navigator.share`) nếu thiết bị hỗ trợ, tự động chuyển về tải ảnh PNG xuống nếu chạy trên desktop/trình duyệt không hỗ trợ Web Share.

### 1.3 Hệ thống Âm thanh Huyền bí AudioManager (Web Audio API)
- `src/core/AudioManager.ts`:
  - Xây dựng hệ thống âm thanh synthesizer kết hợp Web Audio API:
    - **Ưu điểm vượt trội**: Không phụ thuộc file mp3/ogg ngoại vi, dung lượng cực nhẹ (0 KB asset tải ngoài), không lo gián đoạn mạng, hoạt động 100% offline.
    - **BGM (Nhạc nền)**: Ambient drone huyền ảo với dao động tần số thấp êm dịu, tạo cảm giác thiền định, huyền bí của phòng bói cổ xưa.
    - **SFX (Hiệu ứng âm thanh)**:
      - Xáo bài (Shuffle): Tiếng xào xạc nhẹ nhàng của thẻ bài.
      - Lật bài (Flip): Âm thanh lật thẻ bài dứt khoát.
      - Tung xu (Coin toss): Tiếng kim loại ngân vang lách cách tự nhiên khi xu va chạm.
      - Chuông kết quả (Chime): Tiếng chuông Tây Tạng / chuông gió thanh khiết ngân vang khi hoàn tất quẻ.
  - Giải quyết chính sách Autoplay: Tự động kích hoạt sau tương tác đầu tiên của người dùng (`pointerdown`/`keydown`).
  - Hỗ trợ lưu trữ cài đặt âm lượng và trạng thái tắt tiếng (Mute) trong localStorage.

### 1.4 Hiệu ứng 3D Khói Trầm Hương & Ánh Sáng (R03 §1, §5)
- `src/core/SmokeParticles.ts`:
  - Dựng hệ thống hạt khói trầm hương bốc lên từ lư hương bằng Three.js `Points` (1 `BufferGeometry` + 1 `PointsMaterial`).
  - Tái sử dụng tọa độ hạt, di chuyển bốc lên và xoay nhẹ nhàng trong `update(dt)`, không tạo `new Vector3` mỗi frame (R03 §2).
  - Tự động điều chỉnh số lượng hạt theo mức cấu hình `Quality` (Low: 25 hạt, Medium: 60 hạt, High: 120 hạt).
  - Giải phóng sạch tài nguyên geometry/material khi `dispose()`.

### 1.5 Bảng Cài đặt & Tối ưu UI/UX (R06 §3)
- `src/services/settings.ts`:
  - Lưu trữ cấu hình: `volume` (0..1), `muted` (boolean), `quality` ('low' | 'medium' | 'high'), `reducedMotion` (boolean).
  - Nhận diện mặc định `prefers-reduced-motion` từ hệ thống người dùng.
- `src/ui/Settings.ts`:
  - Modal cài đặt thân thiện, điều chỉnh âm lượng, chất lượng đồ họa và hiệu ứng chuyển động.
- Cập nhật `src/ui/Menu.ts`:
  - Mở khóa các nút "Lịch sử" và "Cài đặt".
  - Thêm nút bật/tắt âm thanh nhanh (Sound Toggle) trên góc trên giao diện.

---

## 2. Danh sách File dự kiến tạo mới / cập nhật

### Tầng Dịch vụ & Logic Thuần (Pure Zones)
- `src/services/reading.ts` (Hàm thuần tóm tắt Reading)
- `src/services/settings.ts` (Quản lý cài đặt cấu hình)
- `src/services/share.ts` (Dựng ảnh canvas 2D và chia sẻ)
- `src/services/__tests__/reading.test.ts` (Unit test tóm tắt quẻ)
- `src/services/__tests__/settings.test.ts` (Unit test lưu trữ settings)

### Tầng Đồ họa & Audio
- `src/core/AudioManager.ts` (Hoàn thiện Web Audio API: BGM drone + SFX xu/bài/chuông)
- `src/core/SmokeParticles.ts` (Hệ thống hạt khói 3D tối ưu)
- Cập nhật `src/modes/tarot/TarotMode.ts` (tích hợp SFX xáo/lật/chuông và hiệu ứng khói)
- Cập nhật `src/modes/divination/DivinationMode.ts` (tích hợp SFX tung xu/chuông và hiệu ứng khói)

### Tầng Giao diện Người dùng (HTML Overlay)
- `src/ui/History.ts` (Bảng xem danh sách, chi tiết, xóa lịch sử)
- `src/ui/Settings.ts` (Modal cài đặt âm thanh, đồ họa, giảm chuyển động)
- Cập nhật `src/ui/Menu.ts` (kích hoạt các nút Lịch sử, Cài đặt, nút bật/tắt loa)
- Cập nhật `src/ui/ReadingPanel.ts` (bổ sung nút "Chia sẻ ảnh kết quả")
- Cập nhật `src/ui/styles/main.css` (styles cho History, Settings, Share, Audio Toggle)
- Cập nhật `src/shared/strings.vi.ts` (chuỗi ngôn ngữ bổ sung)

---

## 3. Các bước thực hiện tuần tự

1. **Bước 1: Chuyển nhánh Git**: Tạo và chuyển sang nhánh `phase/p3-polish`.
2. **Bước 2: Logic thuần Reading & Settings**:
   - Triển khai `reading.ts` và `settings.ts`.
   - Viết unit tests và đảm bảo test pass 100%.
3. **Bước 3: Hoàn thiện AudioManager (Web Audio Synthesizer)**:
   - Viết các bộ tạo dao động âm thanh (oscillator synthesizer) cho BGM drone, tiếng xáo bài, tiếng lật bài, tiếng đồng xu ngân vang, tiếng chuông huyền bí.
   - Thêm bộ điều khiển âm lượng, mute/unmute và lưu trữ settings.
4. **Bước 4: Tạo Hệ thống Khói Trầm Hương 3D (`SmokeParticles.ts`)**:
   - Dựng Three.js `Points`, cập nhật vị trí hạt theo delta time, tích hợp vào cảnh bàn bói của TarotMode và DivinationMode.
5. **Bước 5: Xây dựng Giao diện Lịch sử (`ui/History.ts`) & Chia sẻ Ảnh (`services/share.ts`)**:
   - Dựng modal Lịch sử xem lại kết quả chi tiết qua `ReadingPanel`.
   - Thêm nút xóa từng mục và xóa tất cả.
   - Dựng canvas xuất ảnh kết quả chi tiết có thương hiệu Fortune Hunter và disclaimer.
6. **Bước 6: Xây dựng Bảng Cài đặt (`ui/Settings.ts`) & Tích hợp Menu**:
   - Mở khóa các nút trên Menu chính, thêm icon loa ở góc màn hình.
   - Nối âm thanh vào các sự kiện tương tác của cả 2 chế độ.
7. **Bước 7: Chạy Cổng chất lượng (Quality Gates)**:
   - Chạy `npm run check` (typecheck, vitest, check:rules, build).
   - Kiểm tra G3 (đảm bảo khói và âm thanh giải phóng sạch khi đổi mode).
   - Cập nhật `PROJECT_STATE.md` và `PROJECT_PLAN.md`, gắn tag `v0.3.0`.

---

## 4. Tiêu chí Hoàn thành (Definition of Done cho P3)
- [ ] Mở được bảng Lịch sử từ Menu, xem lại chi tiết bất kỳ lượt bói Tarot hoặc Kinh Dịch nào đã lưu.
- [ ] Chức năng xóa từng lượt và xóa toàn bộ lịch sử hoạt động chính xác và an toàn.
- [ ] Nút "Chia sẻ ảnh" tạo ra bức ảnh kết quả đẹp mắt, định dạng PNG rõ nét, có disclaimer và tên game.
- [ ] Âm thanh BGM và SFX hoạt động mượt mà, không phát trước khi người dùng chạm màn hình, tắt tiếng được lưu lại.
- [ ] Hiệu ứng khói hạt nhẹ nhàng, đạt 60fps desktop và ≥45fps mobile.
- [ ] `npm run check` pass 100% không lỗi.
