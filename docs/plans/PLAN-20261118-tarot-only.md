# Kế hoạch Triển khai: Tối ưu Toàn bộ Game Thành Ứng dụng Thuần Tarot 3D

> **Mã kế hoạch**: `PLAN-20261118-tarot-only`  
> **Ngày lập**: 18/11/2026  
> **Trạng thái**: Đã hoàn thành  
> **Mục tiêu**: Tái định vị và tối ưu hóa dự án thành trải nghiệm chiêm bái **thuần Tarot 3D** (Tarot Sanctum), lược bỏ chế độ Kinh Dịch khỏi giao diện và luồng ứng dụng, tinh gọn menu và tập trung 100% tài nguyên cho nghệ thuật bài Tarot 78 lá.

---

## 1. Phân tích & Định hướng Thực hiện

1. **Giao diện Menu chính (`Menu.ts`)**:
   - Gỡ bỏ nút "Gieo quẻ Kinh Dịch".
   - Chuyển nút chính thành **"Bắt đầu Chiêm bái Tarot"** (nổi bật, trang trọng ở vị trí trung tâm).
   - Giữ nguyên các chức năng tiện ích: Nút Bật/Tắt âm thanh, "Lịch sử chiêm bái", "Cài đặt hệ thống".
   - Tinh chỉnh tiêu đề và mô tả: *"Fortune Hunter: Tarot Sanctum - Không gian Chiêm bái Tarot 3D Huyền bí"*.

2. **Luồng Điều phối Ứng dụng (`main.ts`)**:
   - Đơn giản hóa `startMode`: Loại bỏ hoàn toàn việc nạp động `DivinationMode`, chỉ khởi tạo `TarotMode`.
   - Tối ưu `openReadingDetail`: Loại bỏ logic hiển thị Quẻ Kinh Dịch, tập trung hiển thị chi tiết trải bài Tarot (có đầy đủ tranh vẽ 78 lá, xuôi/ngược, từ khóa, biểu tượng, nhật ký).
   - Tối ưu Bundle: Giảm dung lượng build, loại bỏ chunk Kinh Dịch khỏi luồng tải chính.

3. **Màn hình Lịch sử & Cài đặt (`History.ts`, `strings.vi.ts`)**:
   - Điều chỉnh chuỗi hiển thị: Thay "Lịch sử quẻ" thành "Lịch sử trải bài", danh sách lịch sử hiển thị các lượt bói Tarot với thumbnails tranh vẽ lá bài đẹp mắt.
   - Thư mục `src/modes/divination`: Giữ nguyên ở dạng mã nguồn độc lập/archive, không nạp vào runtime bundle (đảm bảo an toàn dữ liệu, không xóa file tùy tiện theo Rule 5).

---

## 2. Các Bước Thực Hiện Chi Tiết

- **Bước 1**: Cập nhật `src/ui/Menu.ts`:
  - Lược bỏ `btnDivination`, cập nhật `MenuCallbacks` chuyển thành `onStartTarot: () => void`.
  - Tối ưu nút bấm chính "Bắt đầu Chiêm bái Tarot" với hiệu ứng ánh sáng vàng kim sang trọng.
- **Bước 2**: Cập nhật `src/main.ts`:
  - Bỏ import `lookupHexagram` và `DivinationResult`.
  - Kết nối nút bấm từ Menu trực tiếp vào `TarotMode`.
  - Đơn giản hóa hàm xem lại lịch sử `openReadingDetail`.
- **Bước 3**: Cập nhật `src/shared/strings.vi.ts`:
  - Đồng bộ văn phong thuần Tarot (tiêu đề, phụ đề, nút bấm, nhãn lịch sử).
- **Bước 4**: Kiểm tra chất lượng:
  - Chạy `npm run check` (typecheck + test + check:rules + build).
  - Đảm bảo 100% tests pass, 0 lỗi TypeScript, 0 vi phạm rule.
- **Bước 5**: Cập nhật tài liệu tiến độ `docs/PROJECT_PLAN.md`, `.agent/PROJECT_STATE.md` và commit Git.

---

## 3. Xin ý kiến Người dùng

Tôi đã chuẩn bị sẵn sàng kế hoạch trên. Vui lòng phản hồi **"duyệt"** để tôi tiến hành triển khai ngay!
