# Kế hoạch Triển khai: Hiển thị Ảnh Các Lá Bài Đã Chọn Trong Phần Tóm Tắt & Lịch Sử

> **Mã kế hoạch**: `PLAN-20261118-summary-card-images`  
> **Ngày lập**: 18/11/2026  
> **Trạng thái**: Đã hoàn thành  
> **Mục tiêu**: Bổ sung hình ảnh thực tế của các lá bài đã rút vào màn hình tóm tắt kết quả (`ReadingPanel`) và danh sách lịch sử (`History`), giúp người chơi có cái nhìn trực quan toàn cảnh sau khi hoàn tất trải bài.

---

## 1. Phân tích Yêu cầu & Hiện trạng

- **Hiện trạng `ReadingPanel.ts`**:
  - Trong lưới các lá bài kết quả (`reading-cards-grid`), mỗi lá bài hiện tại chỉ hiển thị thông tin văn bản (nhãn vị trí, tên lá, từ khóa, ý nghĩa) mà **chưa có thẻ hình ảnh**.
  - Người dùng sau khi lật từng lá ở bước 3D, khi vào màn hình tổng kết toàn cảnh muốn được nhìn lại hình ảnh của tất cả các lá bài đã rút cạnh nhau để chiêm nghiệm dòng chảy tương quan.
- **Hiện trạng `History.ts`**:
  - Danh sách lịch sử chỉ hiển thị chữ tóm tắt, chưa có thumbnail ảnh bài của các lượt bói Tarot.

---

## 2. Giải pháp Thiết kế Chi tiết

### A. Màn hình Kết quả Chiêm bái (`ReadingPanel.ts`)
- Trong mỗi thẻ bài `.reading-card-item`:
  - Thêm phần khung ảnh lá bài `.reading-card-img-wrap`:
    - Thẻ `<img>` với `src = drawn.card.image`.
    - Tự động xoay ngược 180° (`transform: rotate(180deg)`) nếu lá bài ở trạng thái đảo ngược (`drawn.reversed`).
    - Viền mạ vàng kép tinh xảo, bóng đổ dạ quang huyền bí, tỷ lệ chuẩn Tarot 1:1.72 (chiều rộng ~110px, tự co giãn trên mobile).
    - Có cơ chế fallback icon nếu ảnh gặp sự cố nạp.
  - Bố cục hài hòa: Ảnh lá bài đặt ở trên cùng trang trọng ➔ Bên dưới là Nhãn vị trí ➔ Tên lá bài ➔ Huy hiệu Xuôi/Ngược ➔ Từ khóa ➔ Lời chiêm nghiệm.

### B. Danh sách Lịch sử (`History.ts`)
- Với các bản ghi Tarot: Hiển thị hàng thumbnail ảnh nhỏ (~32x50px) của các lá bài đã rút ngay trong thẻ lịch sử, giúp người dùng dễ dàng nhận diện và hồi tưởng lại lượt bói khi xem lại lịch sử.

### C. Giao diện & Hiệu năng
- CSS được tối ưu mượt mà, responsive chuẩn trên cả điện thoại di động và máy tính.
- Tuân thủ Rule R06: Dùng `createElement` và gán thuộc tính `src`, `alt`, không dùng `innerHTML`.

---

## 3. Các Bước Thực Hiện

1. **Bước 1**: Cập nhật `src/ui/ReadingPanel.ts` bổ sung khung ảnh lá bài cho từng thẻ trong `.reading-cards-grid`.
2. **Bước 2**: Cập nhật `src/ui/History.ts` hiển thị thumbnails các lá bài trong thẻ lịch sử.
3. **Bước 3**: Cập nhật `src/ui/styles/main.css` tạo kiểu dáng cho `.reading-card-img-wrap`, `.reading-card-img`, `.history-thumbnails`.
4. **Bước 4**: Chạy `npm run check` (typecheck + test + check:rules + build) đảm bảo 100% xanh.

---

## 4. Bằng chứng Phê duyệt
Vui lòng phản hồi **"duyệt"** để tôi bắt đầu thực hiện ngay!
