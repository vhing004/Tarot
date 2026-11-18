# Kế hoạch Triển khai: Triển khai Ứng dụng để Bạn bè Dùng thử Trực tuyến

> **Mã kế hoạch**: `PLAN-20261118-deploy-public-access`  
> **Ngày lập**: 18/11/2026  
> **Trạng thái**: Chờ người dùng duyệt  
> **Mục tiêu**: Thiết lập cấu hình triển khai (deployment) cho ứng dụng Tarot 3D lên dịch vụ web tĩnh miễn phí tốc độ cao (GitHub Pages kết hợp Cloudflare Pages / Vercel), cấp phát đường link công khai để bạn bè có thể mở trên điện thoại hoặc máy tính và trải nghiệm ngay lập tức.

---

## 1. Phân tích & Lựa chọn Nền tảng Triển khai

Hiện tại mã nguồn mới nhất đã được đẩy đầy đủ lên GitHub: `https://github.com/vhing004/Tarot.git`.

Để có đường link trực tuyến công khai nhanh và ổn định nhất cho bạn bè truy cập:

1. **Phương án 1 (GitHub Pages - Tự động 100% qua GitHub Actions)**:
   - **Ưu điểm**: Sẵn có ngay trên repository của bạn, hoàn toàn miễn phí, tự động build và cập nhật mỗi khi có commit mới.
   - **Đường dẫn dự kiến**: `https://vhing004.github.io/Tarot/`
   - **Yêu cầu kỹ thuật**: Cấu hình `base: './'` trong `vite.config.ts` để tài nguyên nạp được ở mọi subpath, thêm workflow `.github/workflows/deploy.yml`.

2. **Phương án 2 (Cloudflare Pages - Khuyến nghị theo chuẩn W06 của dự án)**:
   - **Ưu điểm**: Băng thông không giới hạn, CDN phủ khắp 300+ thành phố trên thế giới, có sẵn file bảo mật `public/_headers` tối ưu cache 1 năm.
   - **Đường dẫn dự kiến**: `https://tarot-sanctum.pages.dev` (hoặc tên bạn chọn).
   - **Cách kích hoạt**: 2 click kết nối repo tại `dash.cloudflare.com`.

3. **Phương án 3 (Vercel)**:
   - **Ưu điểm**: Đơn giản, tự động nhận diện Vite project.
   - **Đường dẫn dự kiến**: `https://tarot-*.vercel.app`.

---

## 2. Các Bước Thực Hiện

- **Bước 1**: Cập nhật `vite.config.ts` với thuộc tính `base: './'` để ứng dụng tương thích đa nền tảng (chạy hoàn hảo trên cả GitHub Pages, Cloudflare Pages, Vercel và máy cục bộ).
- **Bước 2**: Tạo file tự động hóa `.github/workflows/deploy.yml` để kích hoạt GitHub Actions tự động build và xuất bản GitHub Pages.
- **Bước 3**: Chạy `npm run check` đảm bảo kiểm tra chất lượng không lỗi.
- **Bước 4**: Push lên GitHub remote `main`.
- **Bước 5**: Hướng dẫn bạn kích hoạt GitHub Pages (chỉ cần 1 nút gạt trong Settings của GitHub) hoặc kết nối Cloudflare Pages để nhận link chia sẻ cho bạn bè.

---

## 3. Xác nhận từ Người dùng

Vui lòng phản hồi **"duyệt"** để tôi cấu hình và kích hoạt hệ thống tự động triển khai ngay!
