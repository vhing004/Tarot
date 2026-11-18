# Kế hoạch: Sáng Viền Khi Hover, Tách Vị Trí 3 Lá Đã Chọn & Thu Nhỏ Bài Thừa Về Cạnh Tay Phù Thủy

- **Mã kế hoạch**: `PLAN-20261118-card-hover-glowing-border`
- **Ngày lập**: 18/11/2026
- **Trạng thái**: Đang chờ duyệt (Pending Approval)
- **Áp dụng các rules**: `R00-core`, `R01-architecture`, `R02-code-style`, `R03-performance`, `R04-fairness-divination`, `R07-quality-gates`.

---

## 1. Yêu cầu & Vấn đề Cần Khắc Phục

1. **Hiệu ứng Sáng Viền khi Hover (Glowing Border Effect)**:
   - Khi hover vào bất kỳ lá bài nào, ngoài việc bay bổng lên cao và phát ra hạt lấp lánh `CardSparkles`, 4 cạnh mép viền của lá bài sẽ **bừng sáng rực rỡ với vầng hào quang viền vàng kim ma thuật (Golden Magic Rim Glow)**.
2. **Khắc phục lỗi: Bài chọn bị trùng với bài được tráo trên bàn**:
   - *Hiện trạng*: Khi người chơi bấm chọn bài, lá bài đáp xuống tọa độ $Z \approx 0.45$ nằm đè lên các lá bài của 3 hàng đang xòe trên bàn, gây rối mắt và che khuất nhau.
   - *Giải pháp mới*:
     - Khi người chơi click chọn từng lá bài: Lá bài được rút sẽ bay bổng lên cao trên không trung ($Y \approx 0.7$, $Z \approx 0.95$), lơ lửng phía trước tầm mắt người chơi ở vị trí riêng biệt, không chạm vào mặt bàn.
     - Sau khi đã chọn đủ số lá bài (1 lá hoặc 3 lá), toàn bộ bài thừa được thu gọn sạch sẽ về góc bàn (xem mục 3), sau đó các lá bài được chọn mới nhẹ nhàng đáp xuống vị trí trung tâm bàn bói ($Z \approx 0.25$, $Y \approx 0.06$) với khoảng cách dàn đều ngay ngắn, trang trọng, hoàn toàn độc tôn trên mặt bàn bói!
3. **Hiệu ứng thu nhỏ toàn bộ bài còn lại về cạnh tay phù thủy (Shrink & Gather Beside Witch Hand)**:
   - Khi đã chọn đủ bài: Toàn bộ các lá bài không được chọn ở cả 3 hàng sẽ đồng loạt lướt trượt về phía góc bàn bên cạnh tay phải của phù thủy ($X \approx 1.25, Z \approx -1.35$), **thu nhỏ kích thước (`scale` từ $1.0 \to 0.65$)**, xếp chồng lên nhau thành một cọc bài nhỏ xinh tinh xảo đặt cạnh tay phù thủy.
   - Toàn bộ không gian mặt bàn được dọn sạch 100%, sẵn sàng cho giai đoạn lật bài và luận giải.

---

## 2. Thiết kế Kỹ thuật Chi tiết

### 2.1. Khung Viền Phát Sáng Hào Quang (`Card3D.ts`)
- Thêm một `glowRimMesh` hình chữ nhật bao quanh mép lá bài:
  - Sử dụng hình học viền `BoxGeometry(1.04, 1.76, 0.016)` hoặc đường viền hình ống `LineSegments`/khung mỏng.
  - Vật liệu: `MeshBasicMaterial` màu vàng kim ma thuật (`0xffeb60`), `transparent: true`, `opacity: 0`, `blending: AdditiveBlending`.
- Phương thức điều khiển:
  - `setHoverGlow(hovered: boolean)`:
    - Khi `hovered = true`: Tween `opacity` lên $1.0$ và scale nhẹ $1.04$ trong $0.22s$.
    - Khi `hovered = false`: Tween `opacity` về $0$ trong $0.25s$.

### 2.2. Hoạt cảnh Rút Bài Tách Biệt & Thu Nhỏ Bài Thừa Về Cạnh Tay Phù Thủy (`DeckView.ts`)
- **Tách biệt lá bài rút (`animateCardDraw`)**:
  - Khi click chọn lá thứ $i$:
    - Lá bài tắt hover glow, bay vút lên cao $Y \approx 0.7$, lơ lửng ở vị trí $X_{\text{slot}}$, $Z \approx 0.95$ (lơ lửng phía trước tầm nhìn, không chạm mặt bàn đang xòe bài).
- **Thu nhỏ và dọn bài thừa về cạnh tay phù thủy (`gatherUnpickedCardsToWitchHand`)**:
  - Tọa độ cọc bài cạnh tay phù thủy: $X_{\text{witch}} = 1.25$, $Z_{\text{witch}} = -1.35$, $Y = 0.02$.
  - Toàn bộ các lá bài thừa được tween đồng thời:
    - Vị trí: Trượt lướt về $(X_{\text{witch}}, Y + \text{stackIndex} \times 0.002, Z_{\text{witch}})$.
    - Kích thước: `scale.set(0.65, 0.65, 0.65)` (thu nhỏ xinh xắn thành cọc bài phụ).
    - Góc xoay: Xếp thẳng hàng vuông vức.
    - Thời gian: $0.65s$, `ease: 'power3.inOut'`, stagger nhẹ $0.004s$.
- **Hạ cánh trang trọng các lá đã chọn xuống trung tâm bàn**:
  - Sau khi bài thừa đã thu gọn về cạnh tay phù thủy và mặt bàn hoàn toàn trống trải:
    - Các lá bài được chọn nhẹ nhàng hạ từ trên cao ($Y: 0.7 \to 0.06$) xuống vị trí trung tâm bàn bói ($Z: 0.95 \to 0.25$), dàn hàng ngang đều đặn với khoảng cách đẹp mắt.
    - Chuyển mượt mà sang trạng thái lật bài (`INSPECT`).

---

## 3. Danh sách File Chỉnh Sửa

| Thao tác | Đường dẫn file | Trách nhiệm |
|---|---|---|
| **Chỉnh sửa** | `src/modes/tarot/view/Card.ts` | Bổ sung khung viền hào quang phát sáng (`glowRimMesh`) và hàm `setHoverGlow(hovered)` |
| **Chỉnh sửa** | `src/modes/tarot/view/DeckView.ts` | Tích hợp sáng viền khi hover; hoạt cảnh rút bài lơ lửng trên cao; hoạt cảnh thu nhỏ bài thừa về cạnh tay phù thủy ($scale \to 0.65$) và hạ các lá đã chọn xuống tâm bàn |
| **Chỉnh sửa** | `src/modes/tarot/TarotMode.ts` | Đồng bộ luồng rút bài mới và chuyển trạng thái mượt mà |

---

## 4. Kế hoạch Kiểm thử & Quality Gates

1. **Gate G1 (Code health)**:
   - `npm run typecheck`: 0 lỗi TypeScript.
   - `npm run test`: 65/65 tests tiếp tục pass 100%.
   - `npm run build`: Build bundle thành công.
2. **Gate G2 (Rules clean)**:
   - `npm run check:rules`: 0 vi phạm rule (không any, không innerHTML, không secret).
3. **Gate G3 (Lifecycle & Memory)**:
   - Đảm bảo toàn bộ mesh viền sáng và cọc bài thu nhỏ được giải phóng sạch sẽ khi `disposeCard()` và `disposeDeck()`.
4. **Gate G4 (Performance)**:
   - Duy trì 60fps mượt mà, render-on-demand chỉ chạy khi tween hoạt động.

---

> **LƯU Ý THEO QUY TẮC BẮT BUỘC**: Agent DỪNG LẠI TẠI ĐÂY và CHỜ NGƯỜI DÙNG DUYỆT PLAN TRƯỚC KHI THỰC HIỆN BẤT KỲ CHỈNH SỬA CODE NÀO!
