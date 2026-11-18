# Kế hoạch: Thêm Người Ngồi Xáo Bài & Hiệu Ứng Xòe Bài Rút Bài Chân Thực (Tarot Reader & Interactive Fan Spread)

- **Mã kế hoạch**: `PLAN-20261118-tarot-reader-and-fan-spread`
- **Ngày lập**: 18/11/2026
- **Trạng thái**: Đang chờ duyệt (Pending Approval)
- **Áp dụng các rules**: `R00-core`, `R01-architecture`, `R02-code-style`, `R03-performance`, `R04-fairness-divination`, `R05-content-safety`, `R06-security`, `R07-quality-gates`.

---

## 1. Bối cảnh & Mục tiêu

Hiện tại, phòng bói bài Tarot (`TarotMode.ts`) đã có bàn đá tròn, nến lập lòe, khói hương nghi ngút và bộ bài 3D đủ 78 lá phong cách RWS 1909. Tuy nhiên:
1. **Thiếu nhân vật Thầy Bói (Tarot Reader)**: Bàn bói đối diện trống trải, bộ bài tự tách làm hai và tự đan vào nhau mà không có người điều khiển, làm giảm tính đắm chìm (immersion) và sự huyền bí.
2. **Hiệu ứng xòe bài và rút bài còn đơn điệu**: Bài hiện tại bung ra một góc quạt tĩnh, người chơi click vào thì lá bài bay thẳng về vị trí đọc bài. Chưa có cảm giác "lướt tay trên quạt bài", chưa có tương tác hover nhô bài lên, chưa có động tác rút bài bay lượn sống động và trực quan theo từng lá (1/1 lá hoặc 1/3, 2/3, 3/3 lá).

### Mục tiêu cụ thể:
1. **Thêm nhân vật Tarot Reader 3D (Thầy bói huyền bí)** ngồi đối diện người chơi qua bàn bói:
   - Dựng bằng Three.js Procedural 3D (áo choàng trùm đầu bí ẩn - Mystic Hooded Robe, vai, ngực, đôi cánh tay và bàn tay với nhẫn huyền thuật).
   - Thiết kế tối ưu hiệu năng (R03): Sử dụng các khối hình học cơ bản kết hợp vật liệu chuẩn PBR (vải nhung tối, viền chỉ vàng cổ, bóng tối che khuất gương mặt), ánh nến hắt ngược tạo hiệu ứng chiaroscuro ma mị. Không tốn dung lượng download asset ngoài.
   - Hoạt cảnh (Animations qua GSAP/Tween):
     - **Idle**: Thở nhẹ, dáng ngồi trang nghiêm, tay đặt gần mép bàn.
     - **Shuffle**: Hai tay vươn ra cầm 2 nửa bộ bài, cử động nâng lên và đan bài nhịp nhàng đồng bộ với animation xáo bài và tiếng sột soạt.
     - **Spread**: Hai bàn tay uyển chuyển lướt sang hai bên, xòe bộ bài ra bàn thành dải quạt đều đặn.
     - **Pick**: Hai tay thu về thế mời nhẹ nhàng, dõi theo người chơi rút từng lá bài.
2. **Nâng cấp Hiệu ứng Xòe Bài & Cơ chế Rút Bài tương tác cao (Interactive Ribbon Fan & Tactile Draw)**:
   - **Xòe bài Ribbon/Fan**: Từng lá bài trượt lướt mượt mà thành hình cánh cung duyên dáng trên mặt bàn trước mặt người chơi.
   - **Tương tác Hover/Touch lướt bài**: Khi rê chuột hoặc vuốt ngón tay qua quạt bài, lá bài được trỏ tới sẽ nhô cao lên (~0.08) và phát sáng viền nhẹ, kèm âm thanh lướt thẻ bài khẽ chạm, tạo cảm giác xúc giác (tactile feeling) chân thật.
   - **Động tác Rút bài (Draw step-by-step)**:
     - Khi người chơi click chọn 1 lá bài, lá bài đó trượt bay lên cao, lơ lửng rồi hạ nhẹ nhàng xuống vị trí chỉ định (Slot 1, 2, hoặc 3).
     - UI hiển thị hướng dẫn tiến độ trực quan: *"Đã chọn [1/3] - Hãy chọn lá tiếp theo cho Hiện Tại"*.
     - Sau khi rút đủ số lá bài, các lá bài còn lại tự động gom lại hoặc lặn xuống êm ái, chuyển mượt sang giai đoạn Lật bài (Inspect) và Luận giải.
3. **Tuyệt đối tuân thủ R04 §1 (Công bằng)**: Kết quả bói đã chốt bằng CSPRNG trước đó. Người chơi bấm chọn lá bất kỳ trên quạt bài thì lá bài đó sẽ nhận dữ liệu theo thứ tự đã chốt sẵn, đảm bảo tính công bằng và toán học không đổi.

---

## 2. Kiến trúc & Thiết kế kỹ thuật

### 2.1. Module mới: `src/modes/tarot/view/TarotReader3D.ts`
- Kế thừa `THREE.Group`.
- Các bộ phận cấu thành:
  - `hoodMesh`: Nón trùm đầu uốn cong bao quanh khuôn mặt tối đen (`faceVoidMesh` màu đen nhung triệt tiêu phản xạ).
  - `torsoMesh`: Thân áo choàng nhung tím thẫm viền vàng kim.
  - `leftArmGroup` / `rightArmGroup`: Cánh tay, cẳng tay và bàn tay (`leftHandMesh`, `rightHandMesh` chi tiết với các ngón tay khép mở và nhẫn ngọc bí thuật).
- Các phương thức animation:
  - `playIdle()`: Dao động nhẹ nhàng theo trục Y (hơi thở huyền bí).
  - `playShuffleAnimation(duration: number)`: Hai tay vươn ra giữa bàn, cử động nhấc tách và đan bài nhịp nhàng.
  - `playSpreadGesture(duration: number)`: Hai tay vuốt ngang từ tâm sang hai bên, mở rộng quạt bài.
  - `playInviteGesture()`: Thu tay về ngực hoặc hạ đặt nhẹ nhàng hai bên bàn.
  - `disposeReader()`: Giải phóng toàn bộ geometry và material theo chuẩn R01 §5 và R03 §4.

### 2.2. Nâng cấp `src/modes/tarot/view/DeckView.ts`
- Bổ sung hiệu ứng Hover / Pointer Move:
  - Lắng nghe `pointermove` trên canvas WebGL. Raycast tìm lá bài đang hover.
  - Khi hover vào 1 lá bài chưa rút: Dùng tween nhấc nhẹ `y: +0.08`, nghiêng nhẹ góc theo hướng chuột. Khi rời chuột (unhover): Trả về vị trí cũ.
  - Giới hạn render theo yêu cầu (`engine.requestRender()`), chỉ render khi có hover/tween.
- Cải tiến `playSpreadAnimation()`:
  - Xòe dải cung đều đặn (Fan Spread), góc nhìn từ trên xuống dễ bấm cả trên desktop lẫn mobile.
- Nâng cấp `positionPickedCards()` và `drawSelectedCard()`:
  - Rút từng lá (interactive draw): Cho phép người chơi bấm chọn từng lá bài một cách chủ động.
  - Mỗi lần bấm: Lá bài được chọn kích hoạt hoạt cảnh rút bay lên cao lơ lửng rồi đáp xuống vị trí slot bài.

### 2.3. Tích hợp trong `src/modes/tarot/TarotMode.ts`
- Khởi tạo `TarotReader3D` trong `init()`, thêm vào `this.group` đối diện bàn (`position.set(0, 0, -2.1)`).
- Điều phối nhịp nhàng giữa Reader và Deck trong máy trạng thái (FSM):
  - State `SHUFFLE`: Reader vươn tay xáo bài cùng lúc DeckView xáo bài.
  - State `SPREAD`: Reader thực hiện cử chỉ xòe bài, các lá bài bung ra hình cánh cung.
  - State `PICK`: Reader giữ cử chỉ mời, thanh trạng thái hiển thị rõ: *"Hãy chọn lá bài thứ 1/3 (Quá khứ)..."*.
  - State `INSPECT`: Reader dõi mắt/hướng về các lá bài đã rút.
- Quản lý vòng đời `dispose()`: Dọn dẹp sạch `tarotReader.disposeReader()`, không để rò rỉ bộ nhớ (đạt gate G3).

---

## 3. Danh sách các file dự kiến tạo mới & chỉnh sửa

| Thao tác | Đường dẫn file | Trách nhiệm |
|---|---|---|
| **Tạo mới** | `src/modes/tarot/view/TarotReader3D.ts` | Nhân vật Thầy Bói 3D procedural (hood, robe, arms, hands) + animation xáo/xòe/mời bài |
| **Chỉnh sửa** | `src/modes/tarot/view/DeckView.ts` | Nâng cấp hiệu ứng xòe dải quạt, raycast hover nhô bài, hoạt cảnh rút từng lá bài bay lên slot |
| **Chỉnh sửa** | `src/modes/tarot/TarotMode.ts` | Tích hợp TarotReader3D vào scene, đồng bộ FSM với các động tác của Reader, cập nhật UI đếm số lá rút |
| **Chỉnh sửa** | `src/shared/strings.vi.ts` | Bổ sung các chuỗi mô tả trạng thái rút từng lá bài (1/1, 1/3, 2/3, 3/3) |

---

## 4. Kế hoạch kiểm thử & Quality Gates

1. **Gate G1 (Code health)**:
   - `npm run typecheck`: 0 lỗi TypeScript.
   - `npm run test`: Toàn bộ các test suites hiện tại (57 tests) tiếp tục pass 100%.
   - `npm run build`: Build thành công, không phát sinh cảnh báo.
2. **Gate G2 (Rules clean)**:
   - `npm run check:rules`: 0 vi phạm (vùng thuần giữ nguyên, không có `any`, không `innerHTML`, không `Math.random` trong logic).
3. **Gate G3 (Lifecycle & Memory)**:
   - Vào / ra `TarotMode` 3 lần liên tiếp: Đảm bảo toàn bộ geometries và materials của `TarotReader3D` và `DeckView` được dọn sạch, `renderer.info.memory` trở về baseline sau khi `dispose()`.
4. **Gate G4 (Performance)**:
   - Đảm bảo render-on-demand hoạt động chuẩn xác: Đứng yên không tốn CPU/GPU frame render; khi rê chuột hover lá bài hoặc chạy animation thì render 60fps mượt mà.

---

> **LƯU Ý THEO QUY TẮC BẮT BUỘC**: Agent DỪNG LẠI TẠI ĐÂY và CHỜ NGƯỜI DÙNG DUYỆT PLAN TRƯỚC KHI THỰC HIỆN BẤT KỲ CHỈNH SỬA CODE NÀO!
