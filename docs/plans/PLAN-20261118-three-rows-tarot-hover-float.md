# Kế hoạch: Thầy Bói Phù Thủy 3D, Chia 3 Hàng 26 Lá Bài & Hiệu Ứng Hover Bay Lên Mượt Mà

- **Mã kế hoạch**: `PLAN-20261118-three-rows-tarot-hover-float`
- **Ngày lập**: 18/11/2026
- **Trạng thái**: Đang chờ duyệt (Pending Approval)
- **Áp dụng các rules**: `R00-core`, `R01-architecture`, `R02-code-style`, `R03-performance`, `R04-fairness-divination`, `R07-quality-gates`.

---

## 1. Yêu cầu & Mục tiêu Tổng thể

1. **Tạo hình Thầy Bói thành Phù Thủy 3D (Witch Character 3D)**:
   - Biến đổi nhân vật ngồi đối diện bàn thành hình tượng **Phù Thủy (Witch / Sorceress)** quyền năng, bí ẩn và cuốn hút:
     - **Mũ phù thủy chóp nhọn kinh điển (Pointed Witch Hat)**: Vành nón rộng uốn cong huyền bí, chóp nón cao vuốt nhọn uốn cong nhẹ về phía sau, chân nón thắt đai da tím thẫm cùng khóa cài mặt trăng lưỡi liềm vàng kim (`Crescent Moon Buckle`).
     - **Mái tóc phù thủy buông dài**: Tóc bạch kim ánh tím buông lơi qua hai bên vai và sau lưng.
     - **Gương mặt thanh thoát & ánh mắt ma thuật**: Ẩn dưới vành nón là ánh mắt phát sáng tím ngọc (`Glowing mystic eyes`) dõi theo bộ bài.
     - **Áo choàng phù thủy (Witch Robe & Corset)**: Cổ áo dựng cao huyền bí (high collar), cầu vai áo choàng nhung đen thẫm, vạt áo rủ mềm mại.
     - **Ống tay áo loe phù thủy (Bell Sleeves)** & **Bàn tay ma thuật**: Cổ tay áo rộng loe đặc trưng, bàn tay thanh mảnh đeo nhẫn cổ, cử chỉ uyển chuyển điều khiển các lá bài.
     - **Dây chuyền pha lê phát quang (Glowing Crystal Pendant)**: Viên ngọc tím treo trước ngực nhấp nháy theo nhịp thở.
2. **Xáo bài chia ra 3 hàng, mỗi hàng 26 lá bài (3-Row Spread)**:
   - Với bộ bài Tarot chuẩn 78 lá: Chia đều hoàn hảo thành **3 hàng $\times 26$ lá bài** uốn lượn cánh cung trên mặt bàn nhung.
     - **Hàng 1 (Xa nhất / Hàng trên)**: 26 lá bài uốn cong nhẹ ở $Z \approx -0.55$.
     - **Hàng 2 (Ở giữa / Hàng trung tâm)**: 26 lá bài ở $Z \approx 0.15$, độ cao cơ sở $Y$ nâng nhẹ để không bị che khuất.
     - **Hàng 3 (Gần người chơi nhất / Hàng dưới)**: 26 lá bài ở $Z \approx 0.85$, trải rộng ngay trước tầm tay.
   - Thao tác phù thủy xòe bài: Phù thủy vuốt hai bàn tay qua 3 tầng không gian, 3 hàng bài lướt ra mượt mà theo từng lớp.
3. **Hiệu ứng Hover từng lá bài bay lên mượt mà (Smooth Float Up Interaction)**:
   - Khi chuột/ngón tay rê qua bất kỳ lá bài nào trong 3 hàng:
     - Lá bài đó **bay bổng lên cao ($Y + 0.35$)**, nhích nhẹ về phía trước và nghiêng góc nhìn trực diện camera.
     - Viền vàng kim bừng sáng, nổi bật hoàn toàn khỏi hàng bài để người chơi chiêm ngưỡng rõ ràng.
   - Khi rời chuột (unhover): Lá bài lướt nhẹ nhàng hạ cánh êm ái về lại hàng với GSAP tween `power2.inOut` (0.28s).
   - Khi click chọn: Lá bài bay vút lên cao rồi lượn vào ô trải bài đã chọn.

---

## 2. Thiết kế Kỹ thuật Chi tiết

### 2.1. Nâng cấp `src/modes/tarot/view/TarotReader3D.ts` thành Phù Thủy 3D (Witch 3D)
- **Cấu trúc hình học (Procedural 3D Mesh nhẹ, chuẩn R03)**:
  - `hatBrimMesh`: Vành nón rộng phù thủy (`CylinderGeometry(0.72, 0.72, 0.02, 32)` uốn lượn nhẹ).
  - `hatConeMesh`: Chóp nón nhọn cong (`ConeGeometry(0.38, 0.95, 24)` uốn cong về phía sau).
  - `hatBeltMesh` & `moonBuckleMesh`: Đai nón vàng kim có biểu tượng trăng lưỡi liềm.
  - `hairGroup`: Tóc dài bạch kim huyền ảo rủ xuống hai bên vai.
  - `faceMesh` & `eyesMesh`: Khuôn mặt thanh tú với đôi mắt phát quang màu tím/hổ phách ma thuật.
  - `collarMesh`: Cổ áo choàng dựng cao kiêu hãnh.
  - `pendantMesh`: Viên pha lê tím lơ lửng phát sáng nhịp nhàng.
  - `sleevesGroup`: Ống tay áo loe rộng (bell sleeves) cử động linh hoạt cùng cẳng tay.
  - `handsGroup`: Đôi bàn tay đeo nhẫn thuật xáo và vuốt bài.
- **Hoạt cảnh sống động**:
  - `playIdle()`: Thở nhẹ, viên pha lê trước ngực dao động độ sáng huyền ảo.
  - `playShuffleGesture()`: Hai tay phù thủy nâng 2 nửa bộ bài, ma thuật luân chuyển khi đan xen bài.
  - `playSpreadGesture()`: Cử chỉ lướt tay 3 nhịp trải 3 hàng bài uốn lượn trên bàn.
  - `playInviteGesture()`: Đôi bàn tay ngửa nhẹ đón chào người chơi rút bài.

### 2.2. Nâng cấp `src/modes/tarot/view/DeckView.ts` cho Bố cục 3 Hàng 26 Lá
- **Tính toán tọa độ 3 hàng**:
  ```ts
  const ROWS = 3;
  const CARDS_PER_ROW = 26; // Chuẩn 78 lá (hoặc chia đều nếu 22 lá)
  // Mỗi row có radius, targetZ, baseY riêng biệt
  ```
- **Xòe bài 3 tầng**:
  - Row 0: $Z = -0.55$, $Y = 0.02 + i \times 0.001$, bán kính cong $R = 3.0$
  - Row 1: $Z = 0.15$, $Y = 0.05 + i \times 0.001$, bán kính cong $R = 2.7$
  - Row 2: $Z = 0.85$, $Y = 0.08 + i \times 0.001$, bán kính cong $R = 2.4$
- **Hover bay lên mượt mà (Smooth Float)**:
  - Dùng `gsap.to(card.position, { y: base.y + 0.35, z: base.z + 0.12, duration: 0.28, ease: 'power2.out' })`.
  - Quản lý map tween độc lập cho từng lá bài: Khi quét chuột nhanh qua nhiều lá, lá nào rời chuột lập tức hạ cánh êm ái, lá mới bay lên tức thì mà không giật cục.
  - Render-on-demand: Cập nhật render qua `engine.requestRender()`.

---

## 3. Danh sách File Tạo Mới & Chỉnh Sửa

| Thao tác | Đường dẫn file | Trách nhiệm |
|---|---|---|
| **Chỉnh sửa** | `src/modes/tarot/view/TarotReader3D.ts` | Biến đổi tạo hình thành Phù Thủy 3D (mũ chóp nhọn, tóc dài, mắt sáng ma thuật, cổ áo dựng, tay áo loe, pha lê) |
| **Chỉnh sửa** | `src/modes/tarot/view/DeckView.ts` | Thuật toán chia 3 hàng $\times 26$ lá bài, hoạt cảnh xòe 3 tầng và cơ chế hover bay lên mượt mà |
| **Chỉnh sửa** | `src/modes/tarot/TarotMode.ts` | Điều phối đồng bộ hoạt cảnh xòe 3 hàng và rút bài từ 3 hàng |
| **Chỉnh sửa** | `src/shared/strings.vi.ts` | Cập nhật câu chữ phù hợp ("Phù thủy đang xáo bài...", "Phù thủy đang trải 3 hàng bài...") |

---

## 4. Kế hoạch Kiểm thử & Quality Gates

1. **Gate G1 (Code health)**:
   - `npm run typecheck`: 0 lỗi TypeScript.
   - `npm run test`: 65/65 tests tiếp tục pass 100%.
   - `npm run build`: Build bundle thành công.
2. **Gate G2 (Rules clean)**:
   - `npm run check:rules`: 0 vi phạm (vùng thuần giữ nguyên, không any, không secret).
3. **Gate G3 (Lifecycle & Memory)**:
   - Đảm bảo toàn bộ geometries/materials mới của Phù Thủy 3D được dọn dẹp sạch sẽ trong `disposeReader()`, không rò rỉ bộ nhớ.
4. **Gate G4 (Performance)**:
   - 60fps mượt mà khi hover lướt qua các lá bài của cả 3 hàng, 0-frame render khi đứng yên.

---

> **LƯU Ý THEO QUY TẮC BẮT BUỘC**: Agent DỪNG LẠI TẠI ĐÂY và CHỜ NGƯỜI DÙNG DUYỆT PLAN TRƯỚC KHI THỰC HIỆN BẤT KỲ CHỈNH SỬA CODE NÀO!
