# Kế hoạch Triển khai: Bộ 78 Lá Bài Tarot Chuẩn Rider-Waite & Hệ Thống Artwork Trực Quan

> **Mã kế hoạch**: `PLAN-20261118-full-78-tarot-deck-and-artwork`  
> **Ngày lập**: 18/11/2026  
> **Trạng thái**: Chờ người dùng duyệt  
> **Mục tiêu**: Giải quyết dứt điểm lỗi lá bài không có ảnh khi lật (do toàn bộ file `.webp` hiện tại chỉ là placeholder dummy 34 bytes) và mở rộng toàn diện hệ thống từ 22 lá Ẩn Chính lên đủ **78 lá Tarot chuẩn quốc tế**.

---

## 1. Phân tích Hiện trạng & Nguyên nhân Gốc rễ

1. **Vì sao ảnh không hiển thị khi lật?**
   - Đã kiểm tra trực tiếp thư mục `public/textures/tarot/`: Tất cả các file từ `00-fool.webp` đến `21-world.webp` đều chỉ có kích thước **34 bytes** (đây là các file rỗng được tạo tạm ở Phase P1).
   - Vì file ảnh rỗng không có dữ liệu pixel, trình duyệt hiển thị khung đen rỗng trong thẻ `<img>` và Three.js không thể map texture lên mặt trước của lá bài 3D.
2. **Yêu cầu mở rộng 78 lá Tarot**:
   - Hiện tại dữ liệu `cards.json` chỉ có 22 lá Ẩn Chính (Major Arcana, ID 0 đến 21).
   - Cần cấu trúc dữ liệu chuẩn mực cho toàn bộ 78 lá (22 Ẩn Chính + 56 Ẩn Phụ: Gậy, Chén, Kiếm, Tiền).

---

## 2. Giải pháp Kỹ thuật Chi tiết

### A. Hệ thống Dữ liệu Chuẩn 78 Lá Tarot (`cards.json`)
Mỗi lá bài trong 78 lá sẽ tuân thủ schema đầy đủ theo `src/shared/types.ts`:
- **22 lá Ẩn Chính (Major Arcana)**: ID 0 - 21 (The Fool đến The World).
- **56 lá Ẩn Phụ (Minor Arcana)**:
  - **14 lá Gậy (Wands - Lửa / Hành động, Ý chí)**: Ace đến 10, Page, Knight, Queen, King.
  - **14 lá Chén (Cups - Nước / Cảm xúc, Trực giác)**: Ace đến 10, Page, Knight, Queen, King.
  - **14 lá Kiếm (Swords - Khí / Trí tuệ, Thách thức)**: Ace đến 10, Page, Knight, Queen, King.
  - **14 lá Tiền (Pentacles - Đất / Vật chất, Sự nghiệp)**: Ace đến 10, Page, Knight, Queen, King.
- Đầy đủ: `name`, `nameVi`, `suit`, `keywords`, `symbolism` (biểu tượng visual), `upright`, `reversed`, `reflectionPrompts`.

### B. Giải pháp Artwork Nghệ thuật Cho 78 Lá Bài
Để đảm bảo lá bài hiển thị **ngay lập tức, sắc nét, đẹp mắt và đúng giấy phép bản quyền (R05 §1 Public Domain RWS 1909)**:
- **Phương án tối ưu**: Tải bộ ảnh số hóa Rider-Waite-Smith 1909 (Public Domain) chuẩn chất lượng cao và chuyển đổi sang WebP nén tối ưu (300x516 px, ~15-25 KB/lá).
- Đồng thời tích hợp cơ chế fallback tự động (nếu ảnh chưa nạp xong hoặc lỗi mạng, hệ thống tự động sinh card art phong cách cổ điển với khung viền vàng, biểu tượng suit và số La Mã, không bao giờ để khung ảnh bị đen rỗng).

### C. Tương thích 3D & Chế độ Chơi
- Form câu hỏi `QuestionForm.ts`: Cho phép người dùng tùy chọn trải bài với **22 lá Ẩn Chính (Tâm điểm tâm linh)** hoặc **Đầy đủ 78 lá (Toàn cảnh sâu sắc)**.
- Duy trì chuẩn hiệu năng (R03 §5): Lazy load texture chỉ khi lá bài được chọn và lật.

---

## 3. Các Bước Thực Hiện

1. **Bước 1**: Tạo/tải đầy đủ 78 file ảnh WebP chuẩn Rider-Waite-Smith đặt vào `public/textures/tarot/` (dung lượng tối ưu, hiển thị sắc nét).
2. **Bước 2**: Mở rộng `src/modes/tarot/data/cards.json` thành đủ 78 lá bài với đầy đủ từ khóa, ý nghĩa xuôi/ngược, biểu tượng chiêm nghiệm và câu hỏi phản tư.
3. **Bước 3**: Cập nhật `src/shared/types.ts` (bổ sung `suit?: 'major' | 'wands' | 'cups' | 'swords' | 'pentacles'`) và cập nhật các unit test tương ứng.
4. **Bước 4**: Cập nhật `src/ui/QuestionForm.ts` cho phép người dùng chọn chế độ bộ bài (22 lá hoặc 78 lá).
5. **Bước 5**: Kiểm tra hiển thị hình ảnh trên 3D mặt trước bài và trên `CardInspectOverlay`, đảm bảo ảnh hiện lên rõ ràng, đẹp mắt sau khi lật.
6. **Bước 6**: Chạy `npm run check` (typecheck + test + check:rules + build) đảm bảo 100% xanh.

---

## 4. Bằng chứng Phê duyệt
Vui lòng phản hồi **"duyệt"** để tôi bắt đầu triển khai ngay theo kế hoạch trên!
