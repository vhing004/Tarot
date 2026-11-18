# Kế hoạch: Tối ưu Trải nghiệm Điện thoại & Tự động Triển khai CI/CD

> **Mã kế hoạch**: `PLAN-20261118-mobile-opt-and-cicd`  
> **Ngày lập**: 18/11/2026  
> **Trạng thái**: Chờ người dùng duyệt  
> **Mục tiêu**: Tối ưu hóa toàn diện giao diện và tương tác 3D Tarot 78 lá trên điện thoại di động (màn hình dọc, thao tác chạm/vuốt, camera tự thích ứng, Safe Area) và kích hoạt pipeline CI/CD tự động build & deploy lên nền tảng trực tuyến công khai.

---

## 1. Phân tích Hiện trạng & Thách thức trên Thiết bị Di động

### 1.1. Thách thức hiển thị & tương tác trên Mobile
1. **Góc nhìn camera dọc (Portrait Aspect Ratio < 1.0)**:
   - Hiện tại camera cố định ở `(0, 4, 7)` với góc mở dọc cố định 45°. Khi hiển thị trên điện thoại dọc (tỷ lệ $\approx 9:16$ hoặc $0.5$–$0.56$), góc nhìn ngang bị thu hẹp mạnh khiến 2 bên cánh của 78 lá bài xòe ra bị tràn ra ngoài viền màn hình.
   - Cần cơ chế **Adaptive Camera**: tự động tính toán khoảng cách hoặc FOV dựa trên tỷ lệ màn hình thực tế để toàn bộ bộ bài 78 lá và nhân vật phù thủy luôn hiển thị cân đối và đầy đủ.
2. **Thao tác Chạm & Lướt (Touch & Pan Deck)**:
   - Trên màn hình nhỏ, 78 lá xếp lớp có thể khó nhắm chính xác lá mong muốn nếu người dùng không thể kéo lướt qua lại.
   - Cần hỗ trợ thao tác **kéo/vuốt ngang (swipe/pan)** để lướt nhẹ bộ bài, kết hợp phân biệt rõ giữa thao tác vuốt (pan) và chạm (tap để chọn bài, ngưỡng di chuyển $< 10\text{px}$).
3. **Bố cục 3 lá bài đã chọn & Khung nhận bài**:
   - Trên màn hình hẹp ($\le 400\text{px}$), khoảng cách giữa 3 lá bài cận cảnh cần co giãn theo chiều ngang để không che khuất nhau và khớp tự nhiên với 3 slot `[QUÁ KHỨ] [HIỆN TẠI] [TƯƠNG LAI]`.
   - Bổ sung `padding-bottom: env(safe-area-inset-bottom, 1rem)` để không bị đè bởi thanh điều hướng cử chỉ trên iPhone và Android.
4. **Hiệu năng & Tiết kiệm pin**:
   - Giữ nguyên `pixelRatio` cap ở mức 1.5 trên mobile (theo R03 §6).
   - Tối ưu raycasting và sự kiện chạm `pointer` phản hồi tức thì dưới $16\text{ms}$.

### 1.2. Hiện trạng CI/CD
- File `.github/workflows/deploy.yml` đã được định nghĩa sẵn, tự động chạy `npm run check` (typecheck + test + check:rules + build) và triển khai lên GitHub Pages khi có commit đẩy lên nhánh `main`.
- Mã nguồn hiện tại có 6 commit đã hoàn thiện tại local chưa được đẩy lên GitHub remote `origin/main`.
- Đã cấu hình `base: './'` trong `vite.config.ts`, sẵn sàng chạy trên cả GitHub Pages lẫn Cloudflare Pages.

---

## 2. Kế hoạch Thực hiện Chi tiết

### Giai đoạn 1: Tối ưu Camera & Khung nhìn Mobile
- **File sửa**: `src/core/Engine.ts`, `src/modes/tarot/TarotMode.ts`
- **Nội dung**:
  - Trong `Engine.onResize` và khi khởi tạo, tính toán hệ số phóng thích ứng (`cameraFitFactor`) theo tỷ lệ `aspect = width / height`.
  - Nếu màn hình là portrait (`aspect < 1.0`), camera tự động lùi về sau theo trục Z và nâng nhẹ trục Y (`Z = 7 / Math.min(1, aspect * 1.35)`) để 78 lá bài không bị tràn mép.
  - Cập nhật ma trận chiếu của camera mượt mà, gọi `requestRender()`.

### Giai đoạn 2: Tối ưu Thao tác Chạm/Vuốt & Trải nghiệm Chọn bài trên Mobile
- **File sửa**: `src/modes/tarot/view/DeckView.ts`
- **Nội dung**:
  - Bổ sung tương tác vuốt ngang nhẹ (horizontal pan): khi người dùng chạm và kéo ngang, nhóm bài xòe dịch chuyển góc nhẹ nhàng trong phạm vi an toàn, giúp dễ dàng ngắm và chọn lá ở mép.
  - Phân tách cử chỉ: lưu tọa độ chạm ban đầu (`startX, startY`). Nếu quãng đường dịch chuyển $< 10\text{px}$ thì xác định là `TAP` (chọn bài); nếu $\ge 10\text{px}$ thì xác định là `SWIPE/PAN` (lướt bài).
  - Tự động co giãn khoảng cách 3 lá cận cảnh (`spacing`) dựa trên độ rộng màn hình (từ `1.05` ở desktop xuống `0.75`–`0.85` ở mobile) để 3 lá bài hiển thị vừa vặn, không bị tràn ra ngoài màn hình điện thoại.

### Giai đoạn 3: Tối ưu Bố cục Giao diện HTML Overlay trên Mobile
- **File sửa**: `src/ui/styles/tarot-slots.css`, `src/ui/styles/main.css`
- **Nội dung**:
  - Bổ sung hỗ trợ Safe Area: `padding-bottom: max(0.75rem, env(safe-area-inset-bottom))`.
  - Tinh chỉnh kích thước 3 slot trên màn hình siêu hẹp ($\le 380\text{px}$ và $\le 480\text{px}$) với tỷ lệ vàng, đảm bảo nút "Xác nhận lựa chọn" to rõ, đạt chuẩn touch target $\ge 48\text{px}$.
  - Đảm bảo overlay lật bài `CardInspectOverlay` cuộn mượt mà trên mobile, hiển thị rõ ràng cả ảnh bài và lời giải mà không bị che khuất.

### Giai đoạn 4: Hoàn tất CI/CD & Tự động Triển khai Trực tuyến
- **File kiểm tra**: `.github/workflows/deploy.yml`, `package.json`
- **Nội dung**:
  - Chạy toàn bộ bộ kiểm tra chất lượng `npm run check` (Vitest, Typecheck, Check-rules, Build).
  - Đẩy các commit lên GitHub remote: `git push origin main`.
  - Kích hoạt pipeline GitHub Actions tự động build và xuất bản lên GitHub Pages.
  - Cung cấp đường dẫn truy cập trực tuyến chính thức cùng hướng dẫn kích hoạt nhanh trên GitHub Repo / Cloudflare Pages.

---

## 3. Danh sách File Thay đổi Dự kiến

| STT | File | Mục đích |
|---|---|---|
| 1 | `src/core/Engine.ts` | Thêm camera aspect adapter tự động lùi góc nhìn trên mobile portrait |
| 2 | `src/modes/tarot/view/DeckView.ts` | Thêm phân tách chạm/lướt và co giãn vị trí bài cận cảnh theo màn hình |
| 3 | `src/ui/styles/tarot-slots.css` | Tối ưu Safe Area, touch targets và responsive slot trên mobile |
| 4 | `.github/workflows/deploy.yml` | Rà soát và đảm bảo tương thích 100% với môi trường CI GitHub Actions |

---

## 4. Xác nhận từ Người dùng

Theo quy tắc bắt buộc của dự án, tôi đã hoàn thành việc phân tích và lập kế hoạch chi tiết ở trên.

Vui lòng phản hồi **"duyệt"** (hoặc góp ý thêm) để tôi tiến hành triển khai các bước tối ưu mobile và kích hoạt CI/CD deploy ngay lập tức!
