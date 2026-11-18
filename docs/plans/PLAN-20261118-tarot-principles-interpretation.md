# Kế hoạch: Nâng cấp Hệ thống Luận giải Tarot Chuẩn Nguyên Tắc Truyền Thống

> **Mã kế hoạch**: `PLAN-20261118-tarot-principles-interpretation`  
> **Ngày lập**: 18/11/2026  
> **Trạng thái**: Chờ người dùng duyệt  
> **Mục tiêu**: Xây dựng bộ máy luận giải Tarot theo nguyên tắc truyền thống Rider-Waite-Smith: phân nhánh ý nghĩa 78 lá bài theo 4 nguyên tố (Tình duyên, Sự nghiệp, Tài chính, Sức khỏe), kết nối dòng chảy nhân quả Quá khứ → Hiện tại → Tương lai để giải đáp trực diện, sâu sắc cho Câu hỏi và Chủ đề của người dùng.

---

## 1. Phân tích Hiện trạng & Nguyên tắc Tarot Cần Áp Dụng

### 1.1. Vấn đề hiện tại
- Dữ liệu 78 lá bài (`cards.json`) chỉ chứa 1 đoạn văn ý nghĩa chung (`upright`, `reversed`), không phân nhánh theo lĩnh vực.
- Màn hình lật bài (`CardInspectOverlay`) hiển thị văn mẫu chung, không nhắc đến Câu hỏi hay Chủ đề của người chơi.
- Màn hình kết quả (`ReadingPanel`) chỉ in 1 dòng tiêu đề câu hỏi, các phần phân tích bên dưới là văn mẫu rập khuôn, không trả lời thẳng vào điều người dùng thắc mắc.

### 1.2. 4 Nguyên tắc Tarot Truyền Thống Bắt Buộc Áp Dụng
1. **Nguyên lý 4 Nguyên Tố & 4 Bộ Ẩn Phụ (Suits & Elements)**:
   - **Tình cảm / Mối quan hệ**: Nguyên tố Nước (Bộ Cốc - Cups) $\rightarrow$ Cảm xúc, trực giác, sự thấu cảm, gắn kết tâm hồn.
   - **Công việc / Sự nghiệp**: Nguyên tố Lửa (Bộ Gậy - Wands) $\rightarrow$ Đam mê, ý chí, sáng tạo, hành động và danh tiếng.
   - **Tài chính / Tiền bạc**: Nguyên tố Đất (Bộ Tiền - Pentacles) $\rightarrow$ Nguồn lực vật chất, tính thực tế, tích lũy và đầu tư.
   - **Tư duy / Thử thách tâm lý**: Nguyên tố Khí (Bộ Kiếm - Swords) $\rightarrow$ Lý trí, sự thật, rào cản suy nghĩ, quyết định khó khăn.
   - **Ẩn Chính (Major Arcana)**: Bài học tinh thần, quy luật nhân quả, bước ngoặt định mệnh.
2. **Cấu trúc Dòng chảy Nhân Quả (Narrative Arc 3 Lá)**:
   - **Quá khứ (Root Cause)**: Hạt mầm, thói quen hoặc biến cố đã tạo nên bối cảnh hiện tại của câu hỏi.
   - **Hiện tại (Current Dynamics & Blind Spots)**: Năng lượng đang chi phối, thách thức tức thời và điểm mù cần nhận diện.
   - **Tương lai (Potential Outcome & Agency)**: Xu hướng diễn biến tự nhiên, tiềm năng phát triển và hành động tỉnh thức để làm chủ kết quả.
3. **Chiều Xuôi / Ngược (Upright / Reversed)**:
   - Xuôi: Năng lượng biểu hiện rõ ràng, thuận dòng tự nhiên.
   - Ngược: Năng lượng nội tâm hóa, ứ đọng, hoặc cần điều chỉnh sự thái quá/thiếu hụt; không phải điềm xấu mà là cơ hội chữa lành từ bên trong.
4. **Nguyên tắc An toàn & Trao Quyền (Rule R05)**:
   - Không phán xét định mệnh tuyệt đối ("sẽ chia tay", "chắc chắn phá sản").
   - Trọng tâm luôn nằm ở sự thức tỉnh, câu hỏi phản tư và quyền chủ động (Free Will) của người hỏi.

---

## 2. Kế hoạch Triển khai Chi tiết

### Giai đoạn 1: Xây dựng Bộ máy Luận giải Ngữ cảnh Chủ đề thuần (`interpret.ts`)
- **File**: `src/modes/tarot/logic/interpret.ts` (Vùng thuần - Pure Zone)
- **Nội dung**:
  1. Xây dựng hàm thuần `getCardTopicMeaning(card, reversed, topic)`:
     - Soi chiếu biểu tượng và từ khóa của từng lá bài qua lăng kính của 4 chủ đề: Tình duyên (`love`), Công việc (`career`), Tài chính (`money`), Sức khỏe (`health`), Tổng quan (`general`).
     - Tự động thích ứng sắc thái cho cả lá Xuôi và lá Ngược.
  2. Nâng cấp hàm `buildTarotInterpretation(cards, topic, question)`:
     - **Phần 1: Bối cảnh Chiêm bái & Tiêu điểm**: Xác lập câu hỏi và bối cảnh năng lượng.
     - **Phần 2: Luận giải 3 Vị trí theo Lăng kính Chủ đề**: Mỗi lá bài giải thích trực tiếp theo ý nghĩa của chủ đề và vị trí Quá khứ / Hiện tại / Tương lai.
     - **Phần 3: Dòng chảy Nhân quả Trả lời Trực diện Câu hỏi**: Xâu chuỗi câu chuyện 3 lá giải đáp cụ thể cho băn khoăn của người dùng.
     - **Phần 4: Lời khuyên Hành động Thiết thực & Cảnh báo Điểm mù**.
     - **Phần 5: Câu hỏi Phản tư Sâu sắc (Self-Reflection Prompts)**.

### Giai đoạn 2: Nâng cấp Màn hình Lật từng lá bài (`CardInspectOverlay.ts`)
- **File**: `src/modes/tarot/ui/CardInspectOverlay.ts`, `src/modes/tarot/TarotMode.ts`
- **Nội dung**:
  - Truyền `topic` và `question` vào `CardInspectOverlay`.
  - Hiển thị huy hiệu bối cảnh: `Lĩnh vực: [Tên lĩnh vực]` và `Băn khoăn: "[Câu hỏi]"` ở phần đầu màn hình.
  - Hiển thị song song:
    + **Ý nghĩa chuyên sâu theo Chủ đề** (ví dụ: Ý nghĩa trong Tình duyên / Công việc).
    + Biểu tượng cốt lõi & Từ khóa truyền thống của bộ Rider-Waite-Smith 1909.

### Giai đoạn 3: Nâng cấp Màn hình Kết quả Tổng hợp (`ReadingPanel.ts`)
- **File**: `src/ui/ReadingPanel.ts`, `src/ui/styles/main.css`
- **Nội dung**:
  - Thiết kế khối **"Băn khoăn & Tiêu điểm Trải bài"** trang trọng ở đầu bảng kết quả, hiển thị rõ ràng câu hỏi và chủ đề.
  - Thẻ tóm tắt của từng lá bài trong lưới hiển thị ý nghĩa gắn liền với chủ đề đã chọn.
  - Khu vực luận giải được cấu trúc theo 4 phần rõ ràng: Cội nguồn $\rightarrow$ Thực tại $\rightarrow$ Tiềm năng tương lai $\rightarrow$ Lời khuyên hành động trả lời thẳng vào câu hỏi.

### Giai đoạn 4: Kiểm thử, Đảm bảo Quy tắc & Đồng bộ CI/CD
- **File**: `src/modes/tarot/logic/__tests__/interpret.test.ts`
- **Nội dung**:
  - Bổ sung unit tests cho hàm luận giải theo chủ đề: kiểm tra tính nhất quán, không rỗng, phản hồi chính xác khi có câu hỏi và khi không có câu hỏi.
  - Chạy `npm run check` (TypeScript, Vitest, check:rules, build).
  - Cập nhật `PROJECT_PLAN.md` và `.agent/PROJECT_STATE.md`.
  - Push lên GitHub remote `main` để kích hoạt CI/CD tự động deploy lên GitHub Pages.

---

## 3. Danh sách File Thay đổi Dự kiến

| STT | File | Vùng | Mục đích |
|---|---|---|---|
| 1 | `src/modes/tarot/logic/interpret.ts` | Logic thuần | Thêm bộ luận giải theo lăng kính chủ đề & dòng chảy câu hỏi |
| 2 | `src/modes/tarot/logic/__tests__/interpret.test.ts` | Test thuần | Unit tests kiểm thử bộ luận giải chủ đề và câu hỏi |
| 3 | `src/modes/tarot/ui/CardInspectOverlay.ts` | UI Tarot | Hiển thị bối cảnh câu hỏi và ý nghĩa lá bài theo chủ đề khi lật |
| 4 | `src/modes/tarot/TarotMode.ts` | Mode FSM | Kết nối `topic` và `question` vào các màn hình hiển thị |
| 5 | `src/ui/ReadingPanel.ts` | UI chung | Hiển thị tiêu điểm câu hỏi và luận giải dòng chảy nhân quả |
| 6 | `src/ui/styles/main.css` | Stylesheet | Căn chỉnh giao diện khối câu hỏi và huy hiệu chủ đề |

---

## 4. Xác nhận từ Người dùng

Theo quy tắc bắt buộc của dự án, tôi đã hoàn thành kế hoạch chi tiết ở trên.

Vui lòng phản hồi **"duyệt"** để tôi bắt đầu thực hiện các bước nâng cấp ngay lập tức!
