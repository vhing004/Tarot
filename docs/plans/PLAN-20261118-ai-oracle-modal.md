# Kế hoạch Triển khai: Tích hợp Modal AI Chiêm Nghiệm Tarot Đa Tùy Chọn

> **Mã kế hoạch**: `PLAN-20261118-ai-oracle-modal`  
> **Ngày lập**: 18/11/2026  
> **Trạng thái**: Đã hoàn thành  
> **Mục tiêu**: Tích hợp một Modal AI thông minh (sử dụng Gemini Flash Free Tier kết hợp Offline Heuristic Fallback) cho phép người chơi chọn các góc nhìn/option chiêm nghiệm khác nhau (Khích lệ tích cực, Thẳng thắn cảnh báo rủi ro, Triết học nội tâm, Hành động cụ thể), sinh ra lời luận giải sâu sắc dựa trên toàn bộ tri thức biểu tượng Tarot 78 lá.

---

## 1. Phân tích Yêu cầu & Kiến trúc Giải pháp

### 1.1. Các Tùy chọn Góc nhìn Chiêm nghiệm (Advice Perspectives)
Người dùng có thể chọn 1 trong 4 phong cách giải đoán chuyên sâu:
1. 🌟 **Khích lệ & Tiềm năng (Uplifting & Empowering)**:
   - Tập trung vào tài nguyên nội lực, cơ hội thuận lợi, niềm tin và hướng giải quyết tươi sáng.
2. ⚠️ **Thẳng thắn & Cảnh báo (Direct & Shadow Work - Góc nhìn phản tỉnh / rủi ro)**:
   - Chỉ rõ điểm mù, cạm bẫy tiềm ẩn, ảo tưởng, cảnh báo những hệ quả xấu nếu tiếp tục duy trì thói quen hoặc quyết định bốc đồng.
3. 🧘 **Triết học & Tâm thức Sâu sắc (Philosophical & Soul Wisdom)**:
   - Chiêm nghiệm dưới góc nhìn tâm linh cổ mẫu (Jungian Archetypes), quy luật nhân quả và bài học trưởng thành của linh hồn.
4. 🎯 **Chiến lược & Hành động Thực tế (Actionable & Practical Steps)**:
   - Đúc kết thành 3 bước hành động cụ thể, rõ ràng mà người hỏi có thể thực hiện ngay trong đời sống hàng ngày.

### 1.2. Kho Tri thức Tarot Cung cấp cho AI
- Prompt hệ thống (`Tarot Master System Prompt`) được thiết kế đóng vai một Bậc Thầy Tarot thấu thị và nhân ái, am tường trọn vẹn:
  - 78 lá bài Rider-Waite-Smith (22 Ẩn Chính + 56 Ẩn Phụ: Gậy/Cốc/Kiếm/Tiền).
  - Ngũ hành/4 nguyên tố (Lửa, Nước, Khí, Đất) và sự cân bằng tương hỗ giữa các lá.
  - Chiều lá xuôi (năng lượng biểu hiện ra ngoài) và chiều lá ngược (năng lượng tích tụ hoặc tắc nghẽn bên trong).
  - Tương quan vị trí trải bài (Hiện tại, hoặc Quá khứ ➔ Hiện tại ➔ Tương lai).

### 1.3. Cơ chế AI Miễn Phí (Free AI Engine) & An Toàn Bảo Mật (R06)
- **Công nghệ**: Dùng API `fetch` chuẩn (không cài thêm thư viện runtime).
- **Mô hình**: Google Gemini Free Tier (`gemini-1.5-flash` hoặc `gemini-2.0-flash`) cực nhanh và miễn phí.
- **Quản lý Khóa**:
  - Người dùng có thể dán API Key cá nhân (miễn phí từ Google AI Studio) được lưu cục bộ trong `localStorage`, hoặc đọc từ biến môi trường nếu có.
- **Offline Heuristic Fallback**:
  - Nếu chưa có API key hoặc thiết bị mất kết nối mạng, hệ thống tự động kích hoạt bộ giải đoán offline giàu tri thức tương ứng với từng option, đảm bảo luôn có câu trả lời tức thì, sâu sắc, không bị treo.
- **Bảo mật & Content Safety (R05 & R06)**:
  - Kiểm tra từ khóa nhạy cảm trước khi gửi.
  - Render nội dung an toàn bằng `textContent` (chống XSS), không dùng `innerHTML`.

---

## 2. Thiết kế Thành phần & Giao diện

1. **`src/services/ai.ts` (Tầng dịch vụ thuần)**:
   - Hàm `generateTarotAiReading(params: TarotAiParams): Promise<string>`.
   - Xây dựng prompt có cấu trúc, tích hợp tri thức 78 lá, kết hợp câu hỏi, các lá bài đã rút và option đã chọn.
   - Xử lý timeout (15s), bắt lỗi và rơi về Offline Fallback mượt mà.

2. **`src/ui/AiOracleModal.ts` (Giao diện Modal)**:
   - Tiêu đề: *"🔮 Chiêm Nghiệm Chuyên Sâu Cùng AI Oracle"*.
   - Khung chọn 4 Options (dạng nút bấm biểu tượng trực quan, highlight khi chọn).
   - Ô nhập/cấu hình API Key nhanh (có nút hướng dẫn lấy key miễn phí, ẩn sau icon bánh răng).
   - Vùng hiển thị kết quả với hiệu ứng dạ quang tím/vàng, hiệu ứng gõ chữ (stream/typewriter).
   - Nút *"Sao chép"* và *"Lưu vào Nhật ký"*.

3. **Tích hợp vào `ReadingPanel.ts`**:
   - Thêm nút kêu gọi hành động nổi bật: **"🔮 Khám phá Góc nhìn AI Chiêm nghiệm"** đặt ngay trên bảng kết quả tóm tắt.

4. **Tối ưu CSS (`main.css`)**:
   - Kiểu dáng glassmorphism huyền bí, hiệu ứng ánh sáng animation tinh tế, tối ưu trải nghiệm trên cả điện thoại di động.

---

## 3. Các Bước Triển khai

1. **Bước 1**: Xây dựng `src/services/ai.ts` với đầy đủ System Prompt, các option phong cách và bộ Heuristic Generator offline.
2. **Bước 2**: Viết unit test trong `src/services/__tests__/ai.test.ts` đảm bảo logic prompt và fallback pass 100%.
3. **Bước 3**: Xây dựng UI Component `src/ui/AiOracleModal.ts`.
4. **Bước 4**: Tích hợp nút kích hoạt trong `src/ui/ReadingPanel.ts`.
5. **Bước 5**: Thêm CSS styling trong `src/ui/styles/main.css`.
6. **Bước 6**: Chạy `npm run check` (typecheck + test + check:rules + build) đảm bảo 100% xanh.
7. **Bước 7**: Cập nhật `docs/PROJECT_PLAN.md`, `.agent/PROJECT_STATE.md` và commit Git.

---

## 4. Xác nhận từ Người dùng

Kế hoạch đã sẵn sàng. Vui lòng phản hồi **"duyệt"** để tôi tiến hành lập trình ngay!
