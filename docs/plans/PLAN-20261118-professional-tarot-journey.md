# Kế hoạch Thực hiện: Phát triển Trải nghiệm Tarot Chuyên nghiệp & Có chiều sâu

> **Căn cứ tài liệu**: `docs/tarot_game_development_guide.md`
> **Yêu cầu cốt lõi**: Nâng cấp toàn diện Tarot theo chuẩn chuyên nghiệp, loại bỏ việc trả kết quả tức thì ("mì ăn liền"), xây dựng hành trình trải nghiệm có nhịp điệu (Pacing & Ritual), chiêm nghiệm biểu tượng từng lá bài, và câu hỏi phản tư có chiều sâu.

---

## 1. Phân tích Hiện trạng & Định hướng Nâng cấp

### Hiện trạng:
- Sau khi chọn bài, các lá bài tự động lật nhanh và bảng kết quả `ReadingPanel` lập tức ập ra che kín màn hình 3D.
- Người chơi chưa kịp ngắm nhìn lá bài, không có thời gian tĩnh tâm, không được khám phá biểu tượng hay ý nghĩa riêng biệt của từng lá bài tại từng vị trí.
- Dữ liệu `cards.json` còn đơn giản (chỉ có 1 đoạn văn xuôi và 1 đoạn ngược, thiếu biểu tượng `symbolism` và câu hỏi phản tư `reflection_prompts`).
- Chỉ có 2 kiểu trải bài cơ bản (1 lá và 3 lá quá khứ/hiện tại/tương lai).

### Định hướng Nâng cấp Chuyên nghiệp (theo `tarot_game_development_guide.md`):
1. **Nhịp điệu trải bài (Pacing & Ritual)**:
   - **Không trả về kết quả ngay lập tức**: Chia nhỏ thành các giai đoạn rõ ràng.
   - Sau khi xáo bài và trải bài hình quạt, người chơi tự tay rút từng lá theo chỉ dẫn vị trí.
   - **Giai đoạn Chiêm nghiệm từng lá (Card Inspection & Symbol Exploration)**: Các lá bài được đặt úp trang trọng trên bàn bói. Người chơi tự tay chạm để lật từng lá một. Khi một lá lật lên, giao diện hiển thị thanh thông tin chiêm nghiệm tinh tế: Tên lá bài, Chiều xuôi/ngược, Năng lượng chủ đạo, Ý nghĩa tại vị trí đó, Các biểu tượng trực quan trên lá (`symbolism`). Người chơi bấm "Chiêm nghiệm lá tiếp theo ➔" để sang lá kế tiếp.
   - **Giai đoạn Tổng hợp & Phản tư (Synthesis & Reflection)**: Sau khi đã chiêm nghiệm xong tất cả các lá, người chơi bấm "Xem tổng hòa trải bài". Lúc này mới mở bảng kết quả tổng hợp gồm:
     - Dòng chảy kết nối giữa các lá bài (tương quan, bổ trợ hoặc đối lập).
     - Lời khuyên hành động tỉnh thức và gợi mở.
     - **Câu hỏi phản tư (Reflection Prompt)**: Đặt một câu hỏi sâu sắc để người chơi tự suy ngẫm về bản thân (theo mục 6 & 11.2).
     - **Ghi chú cá nhân (Journal Note)**: Người chơi có thể nhập cảm nhận/suy ngẫm của mình vào lượt bói để lưu lại trong Lịch sử.
2. **Hệ thống Spreads Đa dạng (mục 5.2)**:
   - `single`: Một lá - *Tâm điểm hôm nay / Góc nhìn mới*.
   - `three_time`: Ba lá - *Quá khứ ➔ Hiện tại ➔ Xu hướng tương lai*.
   - `three_situation`: Ba lá - *Tình huống ➔ Thách thức ➔ Gợi ý hành động*.
   - `three_mind`: Ba lá - *Tâm trí (Suy nghĩ) ➔ Trái tim (Cảm xúc) ➔ Đôi tay (Hành động)*.
3. **Chuẩn hóa Dữ liệu 22 lá Ẩn Chính (Schema mục 9 & 11)**:
   - Bổ sung `symbolism`: danh sách các biểu tượng hình ảnh cốt lõi của lá bài.
   - Bổ sung `contextual`: diễn giải theo các ngữ cảnh đời sống (`general`, `work`, `love`, `learning`).
   - Bổ sung `reflection_prompts`: câu hỏi phản tư riêng biệt cho từng lá bài.

---

## 2. Kế hoạch Triển khai Từng bước Chi tiết

### Bước 1: Nâng cấp Kiểu dữ liệu & Dữ liệu 22 lá Ẩn Chính
- Cập nhật `src/shared/types.ts`:
  - Mở rộng `TarotCard`:
    ```ts
    export interface TarotCard {
      id: number;
      name: string;
      nameVi: string;
      image: string;
      keywords: {
        upright: string[];
        reversed: string[];
      };
      symbolism: string[]; // Các biểu tượng cốt lõi trên lá bài
      upright: string;
      reversed: string;
      contextual?: {
        work?: { upright: string; reversed: string };
        love?: { upright: string; reversed: string };
        learning?: { upright: string; reversed: string };
      };
      reflectionPrompts: string[]; // Câu hỏi tự vấn phản tư
    }
    ```
  - Cập nhật `Reading`: thêm trường `notes?: string` (nhật ký ghi chú của người chơi).
- Cập nhật `src/modes/tarot/data/cards.json` bổ sung đầy đủ `symbolism`, `reflectionPrompts`, và `keywords` chuẩn theo hướng dẫn RWS.
- Cập nhật các unit test dữ liệu `data.test.ts` đảm bảo 100% lá bài có đầy đủ các trường mới.

### Bước 2: Nâng cấp Hệ thống Trải bài (`spreads.ts`) & Diễn giải (`interpret.ts`)
- Mở rộng `src/modes/tarot/logic/spreads.ts` với 4 kiểu trải bài: `single`, `three_time`, `three_situation`, `three_mind` kèm mô tả ý nghĩa chi tiết từng vị trí.
- Viết lại hàm `buildTarotInterpretation` trong `src/modes/tarot/logic/interpret.ts` theo cấu trúc Template chuẩn mục 11.2:
  - Chủ đề & Vấn đề chiêm bái.
  - Phân tích chi tiết từng lá theo vị trí và chiều xuôi/ngược.
  - Mối liên kết tương quan giữa các lá (cùng nguyên tố/chất, sự chuyển dịch năng lượng).
  - Lời khuyên hành động chủ động.
  - Câu hỏi phản tư chủ đạo (Reflection Prompt).

### Bước 3: Thiết kế Giao diện Khám phá Từng lá (`CardInspectOverlay.ts`)
- Tạo component UI mới: `src/modes/tarot/ui/CardInspectOverlay.ts`:
  - Hiển thị cố định ở chân màn hình trong không gian 3D khi lá bài được lật.
  - Gồm: Tên lá, vị trí trong trải bài, chiều xuôi/ngược, từ khóa, thông điệp vị trí, danh sách biểu tượng (`symbolism`).
  - Nút bấm: "Lật lá tiếp theo: [Tên vị trí]" hoặc "Xem tổng hợp trải bài ✨".
  - Người chơi cũng có thể chạm trực tiếp vào lá 3D tiếp theo trên bàn bói để lật.

### Bước 4: Tái cấu trúc Máy trạng thái FSM trong `TarotMode.ts`
- Cập nhật FSM:
  `INTRO` ➔ `QUESTION` ➔ `SHUFFLE` ➔ `SPREAD` ➔ `PICK` ➔ **`INSPECT` (Khám phá từng lá tương tác)** ➔ **`SYNTHESIS` (Tổng hợp)** ➔ `SAVE` ➔ `READING` (Xem toàn cảnh).
- Ở trạng thái `PICK`: Khi chọn lá nào, lá đó nhấc lên và bay vào vị trí chỉ định.
- Khi đủ số lá ➔ chuyển sang `INSPECT`:
  - Lá 1 lật lên kèm âm thanh `playCardFlip()` ➔ hiện `CardInspectOverlay` ➔ người chơi ngắm nghía chiêm nghiệm.
  - Người chơi bấm tiếp ➔ Lá 2 lật lên...
  - Tất cả lá đã lật ➔ Người chơi bấm "Xem tổng hợp trải bài ✨" ➔ chuyển sang `SAVE` & `READING`.

### Bước 5: Nâng cấp `ReadingPanel.ts` & Lịch sử
- Bổ sung ô nhập ghi chú cá nhân (Personal Journal Note) trong `ReadingPanel`: người dùng có thể gõ cảm nhận và bấm "Lưu ghi chú vào lịch sử".
- Hiển thị nổi bật mục "Câu hỏi phản tư dành cho bạn" (Reflection Prompt Box) với viền vàng dạ quang huyền bí.
- Cập nhật `HistoryView` hiển thị ghi chú cá nhân nếu có.

### Bước 6: Kiểm thử Toàn diện & Xác minh Chất lượng
- Chạy `npm run check` (typecheck + test + check:rules + build).
- Kiểm tra toàn bộ vòng lặp trải bài trên trình duyệt local để đảm bảo nhịp điệu tĩnh tâm, âm thanh mượt mà, chuyển động 3D lôi cuốn và lời giải sâu sắc.

---

## 3. Các file sẽ tạo / chỉnh sửa

| File | Hành động | Rule liên quan |
|---|---|---|
| `src/shared/types.ts` | Sửa (schema TarotCard mở rộng, notes trong Reading) | R01, R02 |
| `src/modes/tarot/data/cards.json` | Sửa (bổ sung symbolism, reflectionPrompts, keywords) | R05 |
| `src/modes/tarot/data/__tests__/data.test.ts` | Sửa (bổ sung test kiểm tra symbolism, prompts) | R07 G5 |
| `src/modes/tarot/logic/spreads.ts` | Sửa (thêm 4 spread chuyên nghiệp) | R01, R04 §3 |
| `src/modes/tarot/logic/interpret.ts` | Sửa (template tổng hợp sâu sắc, câu hỏi phản tư) | R04, R05 §3 |
| `src/modes/tarot/logic/__tests__/interpret.test.ts` | Sửa (test template diễn giải mới) | R07 G1 |
| `src/modes/tarot/ui/CardInspectOverlay.ts` | Tạo mới (thanh khám phá biểu tượng từng lá 3D) | R01, R02 |
| `src/modes/tarot/TarotMode.ts` | Sửa (FSM tích hợp INSPECT & nhịp điệu chuyên nghiệp) | R01, R03 |
| `src/ui/ReadingPanel.ts` | Sửa (hiển thị Reflection Prompt & ô ghi chú cá nhân) | R02, R05 |
| `src/ui/styles/main.css` | Sửa (CSS cho CardInspectOverlay, Prompt Box, Journal Note) | R02, R03 |

---

## 4. Kế hoạch Commit (R08)
1. `feat(tarot-data): enrich major arcana cards with symbolism, reflection prompts, and context meanings`
2. `feat(tarot-logic): expand spreads and implement deep contextual synthesis with reflection prompts`
3. `feat(tarot-ui): create interactive CardInspectOverlay for progressive card reveal and symbol exploration`
4. `feat(tarot-mode): integrate pacing ritual into Tarot FSM with inspect state and personal journal notes`
5. `feat(ui): update ReadingPanel with reflection prompt box, journal note input, and styling`
6. `docs: update project state and plan for professional tarot experience`
