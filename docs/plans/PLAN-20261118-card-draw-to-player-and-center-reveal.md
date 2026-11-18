# Kế hoạch: Hoạt Cảnh Rút Bài Bay Gần Về Phía Người Chọn, Sau Đó Bay Ra Giữa Bàn Và Lật Bài

- **Mã kế hoạch**: `PLAN-20261118-card-draw-to-player-and-center-reveal`
- **Ngày lập**: 18/11/2026
- **Trạng thái**: Đang chờ duyệt (Pending Approval)
- **Áp dụng các rules**: `R00-core`, `R01-architecture`, `R02-code-style`, `R03-performance`, `R04-fairness-divination`, `R07-quality-gates`.

---

## 1. Yêu cầu & Trải nghiệm Người Dùng Mục Tiêu

Người dùng yêu cầu điều chỉnh lại hoạt cảnh khi rút bài Tarot:
1. **Khi chọn từng lá bài**: Lá bài được chọn sẽ **bay bổng và tiến gần về phía người chọn (gần camera / trước tầm mắt người chơi)**, tạo cảm giác trực giác người chơi thực sự "cầm / rút" lá bài đó về phía mình.
2. **Sau khi chọn xong đủ các lá bài**:
   - Toàn bộ bài thừa thu nhỏ và trượt về cạnh tay phù thủy, dọn sạch 100% mặt bàn.
   - Các lá bài đang ở gần người chơi sẽ **đồng loạt bay lướt ra giữa bàn bói** ($Z \approx 0.2$, dàn đều trang trọng).
   - Ngay sau đó tiến hành **lật bài (Reveal / Inspect)** từng lá, hiển thị tranh Rider-Waite rực rỡ và nội dung luận giải.

---

## 2. Thiết kế Kỹ thuật Chi tiết

### 2.1. Tọa độ Cận Cảnh Người Chọn (Close to Player)
- Camera đặt tại `(0, 4, 7)` nhìn về `(0, 0, 0)`.
- Vị trí cận cảnh người chọn (Player Hand / Close View):
  - Tọa độ: $Z_{\text{player}} \approx 2.4 - 2.8$, $Y_{\text{player}} \approx 1.35 - 1.55$.
  - Góc nghiêng: $rotX = \text{Math.PI} / 2 - 0.55$ (nghiêng thẳng góc vào tầm mắt người chơi).
  - Tỉ lệ dàn ngang:
    - Nếu trải 1 lá: $X = 0$, $Y = 1.45$, $Z = 2.6$.
    - Nếu trải 3 lá: Dàn ngang trước ngực người chơi:
      - Lá 1 (Quá khứ): $X \approx -0.95$, $Y \approx 1.45$, $Z \approx 2.6$
      - Lá 2 (Hiện tại): $X \approx 0.0$, $Y \approx 1.48$, $Z \approx 2.6$
      - Lá 3 (Tương lai): $X \approx 0.95$, $Y \approx 1.45$, $Z \approx 2.6$

### 2.2. Hoạt cảnh Rút Bài & Chuyển Vị Trí Ra Giữa Bàn (`DeckView.ts`)
1. **Giai đoạn Rút từng lá (`animateCardDraw`)**:
   - Khi người chơi click vào lá bài thứ $i$:
     - Lá bài bay vút lên khỏi hàng bài, trôi lướt nhanh và êm ái về **vị trí cận cảnh người chọn** trước tầm mắt ($X_{\text{player}}, Y_{\text{player}}, Z_{\text{player}}$).
     - Điểm xuyết âm thanh rút bài thanh thoát.
     - Người chơi có thể chiêm ngưỡng cự ly gần lá bài vừa rút trong khi tiếp tục chạm chọn lá tiếp theo.
2. **Giai đoạn Thu dọn bài thừa & Bay ra giữa bàn (`dismissAndPositionPickedCards`)**:
   - Khi đã chọn đủ số lá bài:
     - **Bước 1 (0.0s - 0.6s)**: Toàn bộ bài thừa ở 3 hàng đồng loạt lướt trượt, thu nhỏ `scale: 0.65` về cọc bài bên cạnh tay phù thủy ($X \approx 1.25, Z \approx -1.35$), giải phóng hoàn toàn mặt bàn.
     - **Bước 2 (0.45s - 1.1s)**: Các lá bài đang ở gần người chọn đồng loạt **bay lướt từ trước mắt người chơi ra vị trí giữa bàn bói**:
       - Tọa độ giữa bàn: $X = \text{startX} + i \times \text{spacing}$, $Y = 0.06$, $Z = 0.22$.
       - Góc xoay: $rotX = \text{Math.PI} / 2, rotZ = \text{Math.PI}$ (úp mặt sau ngay ngắn trên bàn bói).
     - **Bước 3 (1.1s)**: Hoàn tất bay ra giữa bàn, kích hoạt callback `onComplete` để FSM chuyển mượt mà sang `INSPECT` (lật từng lá bài).

### 2.3. Điều phối FSM trong `TarotMode.ts`
- Cập nhật `handleCardPicked`:
  - Khi đã đủ số lá bài:
    - Vô hiệu hóa tương tác (`disableInteraction()`).
    - Gọi hàm chuyển cảnh mới: Thu bài thừa về góc cạnh tay phù thủy, đồng thời đưa các lá bài đã chọn từ vị trí người chơi bay ra giữa bàn.
    - Khi các lá đã đáp xuống giữa bàn: Gọi `this.fsm.go('INSPECT')` để bắt đầu hoạt cảnh lật bài 3D và hiển thị bảng luận giải.

---

## 3. Danh sách File Chỉnh Sửa

| Thao tác | Đường dẫn file | Trách nhiệm |
|---|---|---|
| **Chỉnh sửa** | `src/modes/tarot/view/DeckView.ts` | Triển khai tọa độ cận cảnh người chọn khi rút bài; hoạt cảnh bay từ cận cảnh ra giữa bàn sau khi thu bài thừa |
| **Chỉnh sửa** | `src/modes/tarot/TarotMode.ts` | Đồng bộ luồng chuyển tiếp từ bước rút bài sang lật bài ở giữa bàn |

---

## 4. Kế hoạch Kiểm thử & Quality Gates

1. **Gate G1 (Code health)**:
   - `npm run typecheck`: 0 lỗi TypeScript.
   - `npm run test`: 65/65 tests tiếp tục pass 100%.
   - `npm run build`: Build bundle thành công.
2. **Gate G2 (Rules clean)**:
   - `npm run check:rules`: 0 vi phạm rule (không any, không innerHTML, không secret).
3. **Gate G3 (Lifecycle & Memory)**:
   - Toàn bộ tween và vị trí bài được reset sạch sẽ khi thoát hoặc chơi lại.
4. **Gate G4 (Performance)**:
   - Duy trì 60fps mượt mà trên Three.js.

---

> **LƯU Ý THEO QUY TẮC BẮT BUỘC**: Agent DỪNG LẠI TẠI ĐÂY và CHỜ NGƯỜI DÙNG DUYỆT PLAN TRƯỚC KHI THỰC HIỆN BẤT KỲ CHỈNH SỬA CODE NÀO!
