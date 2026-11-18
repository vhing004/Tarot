# Kế hoạch Thực hiện: Sửa lỗi Animation Loop, Tarot Transition & UI Button Jitter

## 1. Phân tích Nguyên nhân Gốc rễ

### Vấn đề 1: Không có chuyển đổi xáo bài hay chia bài ở Tarot (bài bị đứng yên)
- **Vị trí**: `src/core/Engine.ts` (hàm `trackTween`), `src/modes/tarot/view/DeckView.ts`, `src/modes/tarot/TarotMode.ts`.
- **Cơ chế lỗi**:
  - `DeckView.playShuffleAnimation(onComplete)` thiết lập `gsap.timeline({ onComplete: () => this.fsm.go('SPREAD') })`.
  - Ngay sau đó gọi `this.engine.trackTween(tl)`.
  - Trong `Engine.ts`: `anim.eventCallback('onComplete', onEnd)` của GSAP ghi đè hoàn toàn callback ban đầu của timeline bằng `onEnd` của Engine.
  - Kết quả: Khi animation xáo bài hoàn thành, `onComplete` ban đầu **không bao giờ được gọi**, FSM kẹt cứng ở `SHUFFLE`, không bao giờ chuyển sang `SPREAD` (chia bài / trải bài quạt).
  - Lỗi này cũng ảnh hưởng tới `playSpreadAnimation` (kẹt không sang `PICK`), `positionPickedCards` (kẹt không sang `REVEAL`), `flip` của `Card3D`, và `toss` của `Coin3D`.

### Vấn đề 2: Chuyển động giật lag / khựng khung hình
- **Vị trí**: `src/core/Engine.ts` (hàm `tick`).
- **Cơ chế lỗi**:
  - Trong vòng lặp `tick`, các `updater` (`TarotMode.update`, khói nến, v.v.) chạy và gọi `engine.requestRender()`.
  - Nhưng ngay sau đó, `Engine.ts` gán `this.needsRender = false;` và kiểm tra `if (this.activeTweens > 0 || this.needsRender)`.
  - Vì `needsRender` vừa bị gán về `false`, nếu không có tween hoạt động thì điều kiện này là `false`, dẫn tới `this.running = false` và vòng lặp `requestAnimationFrame` **bị tắt ngấm ngay sau mỗi frame**!
  - Chỉ khi có tương tác chuột di chuyển hoặc click, `requestRender()` từ listener mới tạm thời kéo loop chạy thêm... đúng 1 frame rồi lại tắt tiếp, gây cảm giác giật cục, tụt FPS nghiêm trọng.

### Vấn đề 3: Các nút UI bị nhảy loạn (Button flickering / jitter)
- **Vị trí**: `src/ui/styles/main.css`.
- **Cơ chế lỗi**:
  - Lớp CSS `.btn-primary:hover`, `.history-item:hover` sử dụng `transform: translateY(-2px);`.
  - Khi con trỏ chuột chạm vào viền nút bấm, nút bị dịch lên 2px ➔ con trỏ chuột lọt ra ngoài phạm vi nút ➔ mất trạng thái `:hover` ➔ nút tụt xuống lại vị trí cũ ➔ con trỏ chuột lại lọt vào nút ➔ lại kích hoạt `:hover`.
  - Hiện tượng này tạo thành một vòng lặp nhấp nháy / rung giật liên tục (vài chục lần mỗi giây) khi rê chuột quanh mép nút.
  - Ngoài ra, `#app-ui` là Flex container nhưng `.menu-container` chưa được cố định tuyệt đối (`position: absolute; top: 0; left: 0; width: 100%; height: 100%;`).

---

## 2. Kế hoạch Khắc phục Chi tiết

### Bước 1: Sửa cơ chế `trackTween` trong `src/core/Engine.ts`
- Trích xuất callback `existingComplete = anim.eventCallback('onComplete')` và `existingInterrupt = anim.eventCallback('onInterrupt')` trước khi bọc lại.
- Gọi callback cũ sau khi `onEnd()` cập nhật xong `activeTweens` và yêu cầu render.
- Đảm bảo 100% các timeline / tween của `DeckView`, `Card3D`, `Coin3D` hoàn thành sẽ kích hoạt bước chuyển tiếp FSM tương ứng.

### Bước 2: Tối ưu Render Loop trong `src/core/Engine.ts`
- Điều chỉnh thứ tự reset cờ trong `tick`:
  ```ts
  const willRender = this.needsRender || this.activeTweens > 0;
  this.needsRender = false;

  for (const updater of this.updaters) {
    updater(dt); // Nếu updater gọi requestRender(), this.needsRender sẽ thành true cho frame sau
  }

  if (willRender || this.needsRender || this.activeTweens > 0) {
    this.renderer.render(this.scene, this.camera);
  }

  if (this.activeTweens > 0 || this.needsRender) {
    this.rafId = requestAnimationFrame(this.tick);
  } else {
    this.running = false;
  }
  ```
- Khi khói nến hay animation đang diễn hoạt, game sẽ duy trì liên tục 60 FPS mượt mà. Khi tất cả dừng (ở màn hình đọc tĩnh / pause), loop sẽ nghỉ ngơi hoàn toàn đạt 0-frame render để tiết kiệm pin.

### Bước 3: Tinh chỉnh CSS chống rung giật Button trong `src/ui/styles/main.css`
- Loại bỏ `transform: translateY(-2px)` trên `:hover` của tất cả các button (`.btn-primary:hover`, `.history-item:hover`, `.menu-sound-toggle-btn:hover`).
- Thay thế bằng hiệu ứng ánh sáng vàng đồng huyền bí: tăng `box-shadow: 0 0 15px rgba(212, 175, 55, 0.45)`, sáng viền `border-color: var(--gold-light)`, và màu nền sáng hơn.
- Cố định `.menu-container` với `position: absolute; top: 0; left: 0; width: 100%; height: 100%;`.

### Bước 4: Kiểm thử và Xác nhận
- Chạy `npm run check` (typecheck, 57 unit tests, check rules, build).
- Kiểm tra trực tiếp trên trình duyệt `http://localhost:5173/`:
  - Vào chế độ Tarot: Bấm "Bắt đầu bói" ➔ Xem hiệu ứng xáo bài ➔ Tự động chuyển mượt mà sang trải bài hình quạt ➔ Chạm chọn lá bài ➔ Lá bài gom ra giữa và lật 3D ➔ Hiện ReadingPanel.
  - Hover chuột vào các nút trên Menu, Form, ReadingPanel: Đảm bảo nút đứng yên vững vàng, phát sáng êm dịu, không còn hiện tượng rung lắc/nhảy loạn.
  - Khung hình đạt 60 FPS mượt mà, không còn hiện tượng khựng giật.

---

## 3. Các file sẽ chỉnh sửa

| File | Hành động | Rule liên quan |
|---|---|---|
| `src/core/Engine.ts` | Sửa (bảo toàn callback tween, sửa render loop order) | R01, R03 §3 |
| `src/ui/styles/main.css` | Sửa (loại bỏ translateY jitter, cố định menu layout) | R02, R03 |
| `docs/plans/PLAN-20261118-fix-animation-loop-ui-jitter.md` | Tạo mới | RULE[user_global] |
