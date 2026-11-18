# Kế hoạch: Phù Thủy 3D Chân Thực, Hiệu Ứng Tóe Sáng Khi Hover & Thu Bài Về Một Góc Bàn

- **Mã kế hoạch**: `PLAN-20261118-realistic-3d-witch-sparkles-corner-gather`
- **Ngày lập**: 18/11/2026
- **Trạng thái**: Đang chờ duyệt (Pending Approval)
- **Áp dụng các rules**: `R00-core`, `R01-architecture`, `R02-code-style`, `R03-performance`, `R04-fairness-divination`, `R07-quality-gates`.

---

## 1. Yêu cầu & Mục tiêu Cải tiến

Người dùng yêu cầu 3 nội dung trọng tâm:
1. **Hiệu ứng tóe sáng khi hover vào lá bài**:
   - Khi rê chuột / chạm vào bất kỳ lá bài nào, ngoài việc lá bài bay bổng lên mượt mà, quanh lá bài sẽ bùng lên một chùm hạt ánh sáng ma thuật tóe sáng lấp lánh (Magic Sparkle / Golden-Violet Shimmer Burst).
2. **Nâng cấp Phù Thủy 3D chân thực & sống động hơn**:
   - Tạo hình phù thủy chi tiết, tự nhiên hơn:
     - Khuôn mặt thanh thoát có đường nét (sống mũi, cằm V-line, môi, lông mày ma thuật, đôi mắt tím phát quang có chiều sâu).
     - Mái tóc nhiều lớp bồng bềnh uốn lượn tự nhiên qua vai và trước ngực.
     - Trang phục tinh xảo: Mũ phù thủy chóp nhọn uốn lượn mềm mại, áo choàng nhung có đường xẻ tà, cổ áo cao cách điệu, ống tay áo loe mềm và đôi bàn tay có các ngón tay thon thả cử động chân thực.
   - Hoạt cảnh xáo bài chân thực (Realistic Riffle/Bridge Shuffle):
     - Hai bàn tay phù thủy thực sự áp sát mép bài, cử động ngón tay nâng nửa bộ bài lên, uốn cong và đan xen từng lá bài rơi nhịp nhàng kèm bụi ma thuật phát sáng từ các đầu ngón tay.
     - Đầu và thân người chuyển động đồng bộ (hơi cúi người tập trung nhìn bộ bài khi xáo, ngẩng đầu mỉm cười nhẹ và mở rộng tay khi xòe 3 hàng bài).
3. **Khi chọn lá bài: Tất cả các lá bài còn lại tự động thu gom về 1 góc bàn**:
   - Thay vì lặn xuống dưới mặt bàn như trước, toàn bộ các lá bài không được chọn sẽ đồng loạt lướt trượt, xếp chồng lại gọn gàng (gather & stack) về một góc bàn (ví dụ góc trên bên phải bàn bói $X \approx 1.8$, $Z \approx -0.8$).
   - Để lại toàn bộ không gian trung tâm trang nghiêm, tĩnh lặng cho các lá bài được rút bay về vị trí kết quả.

---

## 2. Thiết kế Kỹ thuật Chi tiết

### 2.1. Hiệu ứng Tóe Sáng Ma Thuật khi Hover (`CardSparkles.ts` hoặc tích hợp trong `DeckView.ts`)
- Tạo một hệ thống hạt ánh sáng ma thuật (Particle Sparkle Burst):
  - Gồm ~30 hạt ánh sáng vàng kim (`#ffd700`) và tím ngọc (`#d87093`) phát sáng lung linh.
  - Sử dụng `BufferGeometry` và `PointsMaterial` với texture đốm sáng tròn mờ (procedural canvas texture hoặc math additive blending).
  - Khi hover vào một lá bài:
    - Đặt vị trí chùm hạt quanh lá bài được hover.
    - Kích hoạt tween bùng nổ nhẹ từ tâm lá bài tỏa ra xung quanh (radius ~0.6) rồi tan dần (fade out opacity trong 0.35s).
    - Tạo cảm giác ma thuật bừng tỉnh khi chạm tay vào từng lá bài.

### 2.2. Nâng cấp Phù Thủy 3D Chân Thực (`TarotReader3D.ts`)
- **Tỉ lệ cơ thể & Đường nét**:
  - Dựng khung xương ảo với các nhóm khớp cử động linh hoạt: `headGroup` (cúi/ngẩng/nghiêng), `torsoGroup` (uốn nhẹ), `leftArm` / `rightArm` (khớp vai, khớp khuỷu, cổ tay và bàn tay có ngón).
  - Tóc phù thủy thiết kế dạng nhiều dải uốn lượn (layered cascading hair), ôm nhẹ khuôn mặt và rủ trước ngực.
  - Ánh mắt phù thủy có đồng tử phát sáng tím neon kết hợp mí mắt tạo thần thái bí ẩn, quyền năng.
- **Hoạt cảnh xáo bài chân thực**:
  - `playShuffleGesture()`:
    - Thân người phù thủy hơi cúi nhẹ về phía trước, đầu nghiêng 10 độ dõi mắt theo bộ bài.
    - Bàn tay phải nhấc nửa bộ bài lên cao, xoay nghiêng 15 độ; bàn tay trái giữ nửa bộ bài dưới mặt bàn.
    - Hai tay uốn cong và thả từng lớp lá bài đan xen vào nhau, ngón tay cử động nhấp nhô nhịp nhàng theo tiếng sột soạt xáo bài.
  - `playSpreadGesture()`:
    - Phù thủy ngẩng đầu lên nhìn về phía người chơi, mỉm cười nhẹ.
    - Hai tay vuốt uyển chuyển qua 3 nhịp trải rộng 3 hàng $\times 26$ lá bài ra khắp mặt bàn.
  - `playInviteGesture()`:
    - Hai bàn tay ngửa nhẹ đón chào, giữ tư thế trang nghiêm trong khi người chơi rút bài.

### 2.3. Hiệu ứng Thu Gom Toàn Bộ Bài Còn Lại Về 1 Góc Bàn (`DeckView.ts`)
- **Thuật toán `gatherUnpickedCardsToCorner()`**:
  - Tọa độ góc bàn đích: $X_{\text{corner}} = 1.8$, $Z_{\text{corner}} = -0.75$, $Y_{\text{corner}} = 0.02$.
  - Khi người chơi rút lá bài:
    - Lá bài được rút bay vút lên cao rồi lượn vào ô trải bài trung tâm.
    - Khi đã chọn đủ số lá bài (1 lá hoặc 3 lá):
      - Toàn bộ các lá bài còn lại ở cả 3 hàng đồng loạt trượt lướt mượt mà về góc bàn đích.
      - Từng lá bài xếp chồng lên nhau thành một cọc bài gọn gàng ngay ngắn (mỗi lá chênh $Y$ một chút $0.003$ để tạo độ dày cọc bài).
      - Xoay góc ngay ngắn $rotZ = \pi$ (thẳng hàng song song).
      - GSAP timeline với thời gian 0.65s, `ease: 'power3.inOut'`, độ trễ so le (stagger) cực nhỏ $0.004$ tạo hiệu ứng cả đàn bài lướt dồn về một góc cực kỳ mãn nhãn!

---

## 3. Danh sách File Tạo Mới & Chỉnh Sửa

| Thao tác | Đường dẫn file | Trách nhiệm |
|---|---|---|
| **Tạo mới** | `src/modes/tarot/view/CardSparkles.ts` | Hệ thống hạt ánh sáng ma thuật tóe sáng lấp lánh (Sparkle Burst) khi hover lá bài |
| **Chỉnh sửa** | `src/modes/tarot/view/TarotReader3D.ts` | Nâng cấp toàn diện tạo hình Phù Thủy 3D chân thực (đường nét mặt, tóc uốn, dáng người, cử động tay và đầu khi xáo bài) |
| **Chỉnh sửa** | `src/modes/tarot/view/DeckView.ts` | Tích hợp `CardSparkles` khi hover, triển khai hoạt cảnh thu gom toàn bộ bài còn lại về 1 góc bàn |
| **Chỉnh sửa** | `src/modes/tarot/TarotMode.ts` | Đồng bộ hoạt cảnh phù thủy và kích hoạt thu gom bài về góc |

---

## 4. Kế hoạch Kiểm thử & Quality Gates

1. **Gate G1 (Code health)**:
   - `npm run typecheck`: 0 lỗi TypeScript.
   - `npm run test`: Toàn bộ 65 tests pass 100%.
   - `npm run build`: Build bundle thành công.
2. **Gate G2 (Rules clean)**:
   - `npm run check:rules`: 0 vi phạm (vùng thuần giữ nguyên, không any, không secret).
3. **Gate G3 (Lifecycle & Memory)**:
   - Toàn bộ geometry/material của hạt tóe sáng và Phù Thủy mới được dọn sạch sẽ trong `disposeDeck()` và `disposeReader()`, không rò rỉ bộ nhớ.
4. **Gate G4 (Performance)**:
   - Tối ưu hạt bằng Points nhẹ (<40 hạt), chỉ render khi có chuyển động, duy trì 60fps mượt mà.

---

> **LƯU Ý THEO QUY TẮC BẮT BUỘC**: Agent DỪNG LẠI TẠI ĐÂY và CHỜ NGƯỜI DÙNG DUYỆT PLAN TRƯỚC KHI THỰC HIỆN BẤT KỲ CHỈNH SỬA CODE NÀO!
