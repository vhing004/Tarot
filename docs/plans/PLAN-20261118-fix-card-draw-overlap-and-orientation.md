# Kế hoạch: Khắc Phục Lỗi Lá Bài Được Chọn Bị Đè Trùng Lên Bài Trên Bàn & Tối Ưu Góc Nhìn Lá Bài Rút

- **Mã kế hoạch**: `PLAN-20261118-fix-card-draw-overlap-and-orientation`
- **Ngày lập**: 18/11/2026
- **Trạng thái**: Đang chờ duyệt (Pending Approval)
- **Áp dụng các rules**: `R00-core`, `R01-architecture`, `R02-code-style`, `R03-performance`, `R04-fairness-divination`, `R07-quality-gates`.

---

## 1. Phân Tích Thực Trạng Từ Ảnh Chụp Thực Tế Của Người Dùng

Từ ảnh chụp người dùng cung cấp (`media_1795001373385_c1f696fc.jpg`), ta thấy rõ 3 nhược điểm lớn làm giảm tính thẩm mỹ:
1. **Lá bài đã chọn bị nằm đè / trùng lấp lên các lá bài chưa chọn**:
   - Khi người chơi click chọn bài, lá bài đáp xuống ở độ cao thấp ($Y \approx 0.1$) và tọa độ $Z \approx 0.45$ nằm lẫn lộn ngay trên hàng bài đang xòe, tạo cảm giác lộn xộn và che khuất nhau.
2. **Góc xoay lá bài bị dẹt mỏng (nhìn thấy mép dao)**:
   - Lá bài khi rút về phía người chơi có góc nghiêng chưa vuông góc với tia nhìn camera `(0, 4, 7)`, khiến người chơi nhìn từ trên xuống thấy cạnh viền mỏng dẹt như một lưỡi dao nằm lơ lửng, không nhìn thấy rõ mặt bài chữ nhật đứng.
3. **Mặt bàn chưa được dọn sạch dứt khoát**:
   - Khi người chơi chọn bài, các lá bài thừa chưa được thu gọn về góc cạnh tay phù thủy ngay, dẫn đến tình trạng bài chọn và bài thừa tranh chấp không gian bàn bói.

---

## 2. Thiết Kế & Giải Pháp Tối Ưu

### 2.1. Căn Chỉnh Góc Nhìn & Tọa Độ Lá Bài Đang Rút (Player Hand Slot)
- Camera đặt tại `(0, 4, 7)`, nhìn xiên góc $\approx 30^\circ$ xuống tâm `(0, 0, 0)`.
- Khi người chơi click chọn 1 lá bài:
  - Lá bài được rút **lập tức bay bổng lên cao vượt hẳn mặt bàn** và tiến thẳng về **vị trí cận cảnh trước mắt người chơi (dưới góc nhìn camera)**:
    - Tọa độ: $Z_{\text{hand}} \approx 3.2$, $Y_{\text{hand}} \approx 2.1$ (nằm hẳn ngoài và cao hơn toàn bộ mặt bàn xòe bài).
    - Dàn ngang cân đối trước ngực:
      - 1 lá: $X = 0$
      - 3 lá: $X_0 = -1.15$, $X_1 = 0$, $X_2 = +1.15$
    - **Góc xoay vuông góc với camera**:
      - $rotX = \text{Math.PI} / 2 - 0.52$ rad (đúng bằng góc nghiêng của camera).
      - Nhờ đó, người chơi sẽ nhìn thấy **trọn vẹn mặt lưng bài hình chữ nhật đứng thẳng thớm, to rõ, sắc nét** trước mắt, hoàn toàn không bị dẹt mỏng hay che khuất.

### 2.2. Dọn Sạch Bài Thừa Về Cạnh Tay Phù Thủy Ngay Khi Chọn Đủ
- Khi người chơi đã bấm chọn đủ số lá bài (1 lá hoặc 3 lá):
  - **Tất cả các lá bài còn lại trên bàn lập tức đồng loạt lướt trượt, thu nhỏ kích thước (`scale: 0.5`)** về cọc bài gọn gàng nằm sát cạnh bàn tay phải của phù thủy ($X \approx 1.6, Z \approx -1.3$).
  - Toàn bộ 3 hàng bài biến mất khỏi mặt bàn trong $0.5s$, để lại mặt bàn nhung đen hoàn toàn trống trải, sạch bóng 100%!

### 2.3. Bay Ra Giữa Bàn & Lật Bài Trang Trọng
- Ngay sau khi mặt bàn đã được dọn sạch sẽ:
  - Các lá bài đang ở trước mắt người chơi nhẹ nhàng **lướt từ trên cao đáp xuống chính giữa mặt bàn bói**:
    - Tọa độ giữa bàn: $X \in \{-1.3, 0, 1.3\}$, $Y = 0.05$, $Z = 0.25$.
    - Góc xoay: Nằm phẳng ngay ngắn trên mặt bàn nhung.
  - Sau khi đáp xuống giữa bàn: Kích hoạt hoạt cảnh **lật mở từng lá bài (Reveal/Inspect)**, xoay từ mặt sau sang mặt trước hiển thị tranh Rider-Waite 1909 rực rỡ và bảng luận giải chi tiết.

---

## 3. Danh sách File Chỉnh Sửa

| Thao tác | Đường dẫn file | Trách nhiệm |
|---|---|---|
| **Chỉnh sửa** | `src/modes/tarot/view/DeckView.ts` | Tính toán góc xoay $rotX$ vuông góc camera; tọa độ cận cảnh người chơi ($Y: 2.1, Z: 3.2$); dọn sạch bài thừa thu nhỏ về góc và hạ bài chọn xuống giữa bàn |
| **Chỉnh sửa** | `src/modes/tarot/TarotMode.ts` | Đảm bảo chuyển trạng thái FSM đồng bộ nhịp nhàng sau khi các lá bài đáp xuống giữa bàn |

---

## 4. Kế hoạch Kiểm thử & Quality Gates

1. **Gate G1 (Code health)**:
   - `npm run typecheck`: 0 lỗi TypeScript.
   - `npm run test`: 65/65 tests tiếp tục pass 100%.
   - `npm run build`: Build bundle thành công.
2. **Gate G2 (Rules clean)**:
   - `npm run check:rules`: 0 vi phạm rule.
3. **Gate G3 (Lifecycle & Memory)**:
   - Đảm bảo toàn bộ tween và scale của lá bài được reset sạch sẽ khi thoát hoặc chơi lại.
4. **Gate G4 (Performance)**:
   - 60fps mượt mà, chuyển động bay và thu bài êm ái.

---

> **LƯU Ý THEO QUY TẮC BẮT BUỘC**: Agent DỪNG LẠI TẠI ĐÂY và CHỜ NGƯỜI DÙNG DUYỆT PLAN TRƯỚC KHI THỰC HIỆN BẤT KỲ CHỈNH SỬA CODE NÀO!
