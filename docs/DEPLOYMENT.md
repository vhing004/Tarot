# Hướng dẫn Triển khai: Cloudflare Pages (Workflow W06)

Tài liệu hướng dẫn triển khai ứng dụng **Fortune-Hunter** lên nền tảng **Cloudflare Pages** (Static Site Hosting miễn phí, băng thông không giới hạn, CDN phân tán toàn cầu).

---

## 1. Yêu cầu & Thông số Cấu hình

| Hạng mục | Giá trị cấu hình | Ghi chú |
|---|---|---|
| **Dịch vụ** | Cloudflare Pages | Nằm trong mục *Workers & Pages* trên Cloudflare Dashboard |
| **Kho mã nguồn Git** | `https://github.com/vhing004/Fortune_Hunter` | Kết nối qua GitHub App Integration |
| **Nhánh chính (Production)** | `main` | Tự động build và deploy khi có commit mới |
| **Nhánh Preview** | Mọi nhánh khác (ví dụ: `phase/*`, `feat/*`, `chore/*`) | Tự động tạo link preview độc lập |
| **Framework preset** | `Vite` (hoặc `None`) | |
| **Lệnh build (Build command)** | `npm run build` | Thực hiện `tsc --noEmit && vite build` |
| **Thư mục đầu ra (Output directory)** | `dist` | Chứa toàn bộ static files và `_headers` |
| **Phiên bản Node.js** | `>=18` (khuyến nghị `20`) | Đặt biến môi trường `NODE_VERSION=20` nếu cần |
| **Biến môi trường (Environment variables)** | Không cần | Phiên bản MVP chạy 100% offline tĩnh và client-side RNG |

---

## 2. Hướng dẫn Từng bước Kết nối trên Cloudflare Dashboard

### Bước 2.1: Tạo Project mới
1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Chọn menu **Workers & Pages** ở thanh điều hướng bên trái.
3. Bấm **Create application** ➔ chuyển sang tab **Pages** ➔ chọn **Connect to Git**.
4. Chọn tài khoản GitHub của bạn và chọn repository `vhing004/Fortune_Hunter`. Bấm **Begin setup**.

### Bước 2.2: Thiết lập Cấu hình Build
- **Project name**: `fortune-hunter` (hoặc tên bạn muốn, link mặc định sẽ là `fortune-hunter.pages.dev`).
- **Production branch**: `main`.
- **Framework preset**: Chọn `Vite`.
- **Build command**: `npm run build`.
- **Build output directory**: `dist`.
- **Root directory**: Để trống (mặc định là `/`).

*(Tùy chọn)* Trong mục **Environment variables**, bấm **Add variable**:
- Variable name: `NODE_VERSION`
- Value: `20`

Bấm **Save and Deploy**. Cloudflare sẽ bắt đầu kéo mã nguồn và tiến hành build tự động (~30-60 giây).

---

## 3. Danh mục Kiểm tra Cổng Chất lượng G7 (Verification Checklist)

Sau khi Cloudflare build xong, truy cập vào URL được cấp phát (ví dụ: `https://fortune-hunter.pages.dev`) và kiểm tra:

### 3.1. Kiểm tra Tiêu đề Bảo mật & Bộ nhớ đệm (Headers & Caching)
Mở Chrome DevTools (`F12` hoặc `Ctrl + Shift + I`) ➔ Chuyển tab **Network**:
1. Chọn file `index.html`:
   - Header phản hồi phải có: `Cache-Control: no-cache` (luôn kiểm bản mới).
   - Header bảo mật:
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: DENY`
     - `Referrer-Policy: strict-origin-when-cross-origin`
     - `Content-Security-Policy: ...`
2. Chọn bất kỳ file trong `/assets/*.js` hoặc `/assets/*.css`:
   - Header phản hồi phải có: `Cache-Control: public, max-age=31536000, immutable`.
   - Nội dung được nén tự động qua Brotli (`br`) hoặc Gzip (`gzip`).

### 3.2. Kiểm tra Trải nghiệm Ứng dụng & Không lỗi Console
- **Menu chính**: Giao diện hiển thị sắc nét, nút Bật/Tắt âm thanh hoạt động.
- **Chế độ Tarot**:
  - Nhập câu hỏi ➔ Xáo bài ➔ Trải bài quạt ➔ Rút 1 hoặc 3 lá ➔ Lật bài 3D ➔ Hiển thị diễn giải kết quả.
  - Bấm nút **🖼️ Chia sẻ ảnh kết quả**: Canvas 2D render ảnh 800x1200 px tải về mượt mà, không vi phạm CSP blob/data URL.
- **Chế độ Gieo quẻ Kinh Dịch**:
  - Tung xu 6 lần ➔ Dựng quẻ chủ và quẻ biến từ dưới lên ➔ Lời giải chi tiết ➔ Lưu lịch sử.
- **Lịch sử & Cài đặt**:
  - Mở Lịch sử: Xem lại quẻ vừa bói, xóa quẻ.
  - Mở Cài đặt: Tùy chỉnh âm lượng, chọn chế độ chất lượng (Tự động / Thấp / Vừa / Cao).
- **Âm thanh Web Audio API**: BGM drone và SFX hoạt động không bị trình duyệt chặn sau khi chạm/click lần đầu.
- **Console sạch**: Không có cảnh báo lỗi đỏ hoặc CSP violation.

---

## 4. Quy trình Rollback Tức thời (Khi xảy ra sự cố)

Trong trường hợp một bản deploy mới gặp sự cố hoặc lỗi phát sinh trên production:

### Cách 1: Rollback qua Cloudflare Dashboard (Khuyến nghị - Nhanh nhất)
1. Truy cập Cloudflare Dashboard ➔ **Workers & Pages** ➔ Chọn project `fortune-hunter`.
2. Chuyển sang tab **Deployments**.
3. Tìm bản build ổn định trước đó trong danh sách lịch sử deploy.
4. Bấm vào biểu tượng dấu ba chấm (`...`) bên cạnh bản build đó ➔ Chọn **Rollback to this deployment**.
5. Xác nhận: Cloudflare sẽ ngay lập tức trỏ tên miền chính về bản build đó trong vòng 1-2 giây mà không cần build lại.

### Cách 2: Rollback qua Git
1. Dùng lệnh `git revert` để đảo ngược commit lỗi trên nhánh `main`:
   ```powershell
   git revert HEAD
   git push origin main
   ```
2. Cloudflare Pages sẽ nhận webhook và tự động build lại phiên bản đã đảo ngược.
