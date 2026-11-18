# Kế hoạch Thực hiện: Workflow W06 - Triển khai lên Cloudflare Pages

## 1. Mục tiêu & Phạm vi
- **Mục tiêu**: Đưa bản tĩnh Fortune-Hunter lên dịch vụ **Cloudflare Pages** (miễn phí, băng thông không giới hạn, CDN toàn cầu), thiết lập cơ chế preview tự động theo nhánh git, hướng dẫn kết nối Cloudflare Dashboard và quy trình Rollback tức thời theo [W06](../../.agent/workflows/06-deploy-cloudflare.md).
- **Phạm vi áp dụng**:
  - Nhánh git: `chore/deploy`.
  - Kiểm tra tính sẵn sàng của gói build: `dist/` chứa `index.html`, các chunks tách riêng (`three`, `TarotMode`, `DivinationMode`) và file `_headers` (CSP strict, Cache-Control immutable).
  - Soát lỗi bảo mật runtime: `npm audit` xác nhận 0 lỗ hổng ở runtime dependencies (`three`, `gsap`) theo [R06 §7](../../.agent/rules/R06-security.md).
  - Tạo tài liệu vận hành chi tiết `docs/DEPLOYMENT.md` hướng dẫn cấu hình Cloudflare Pages, thiết lập Build settings, kiểm tra Gate G7 và kịch bản Rollback.
  - Cập nhật `.agent/PROJECT_STATE.md` và `docs/PROJECT_PLAN.md`.

---

## 2. Thông số Cấu hình Cloudflare Pages
- **Kho mã nguồn GitHub**: `https://github.com/vhing004/Fortune_Hunter`
- **Framework preset**: `Vite` (hoặc `None`)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`
- **Node.js version**: `20` (hoặc `>=18`)
- **Environment variables**: Không yêu cầu biến môi trường bí mật ở phiên bản MVP tĩnh (an toàn tuyệt đối theo R06 §1).
- **Headers & Routing**: Đã tích hợp sẵn file `dist/_headers` gồm CSP, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` và cache vĩnh viễn 1 năm cho assets băm tên (`/assets/*`).

---

## 3. Kế hoạch Triển khai Từng bước

### Bước 1: Soát lỗi Bảo mật Runtime & Gói Build
- Xác nhận lại `npm run check` (typecheck + vitest + check:rules + build).
- Kiểm tra nội dung `dist/_headers` đảm bảo nguyên vẹn khi Vite xuất bản.
- Xác nhận không có secret nào bị lọt vào mã nguồn hay git history.

### Bước 2: Tạo Tài liệu Hướng dẫn Triển khai & Rollback (`docs/DEPLOYMENT.md`)
- Hướng dẫn từng bước kết nối GitHub repo trên giao diện Cloudflare Dashboard.
- Các chỉ số kiểm tra cổng chất lượng Gate G7 trên đường dẫn Preview và Production (Header kiểm tra qua DevTools Network, WebGL hoạt động mượt mà trên di động).
- Hướng dẫn quy trình Rollback tức thời:
  - Cách 1: Rollback qua Cloudflare Dashboard (chỉ 1 click: chọn deployment cũ và bấm *Rollback to this deployment*).
  - Cách 2: `git revert` và push lên nhánh `main`.

### Bước 3: Đẩy Nhánh `chore/deploy` và Hợp nhất vào `main`
- Commit nhánh `chore/deploy` với thông điệp: `chore(deploy): prepare cloudflare pages deployment guide and verified build headers`.
- Push nhánh `chore/deploy` lên GitHub remote.
- Merge vào `main` và gắn tag release chính thức **`v1.0.0`** (Milestone v1.0).
- Push tag `v1.0.0` và nhánh `main` lên GitHub remote.

### Bước 4: Cập nhật Trạng thái Dự án
- Cập nhật `.agent/PROJECT_STATE.md`: Đánh dấu Deploy `[x]`, tag `v1.0.0`, chuyển sang phase tiếp theo (P5: Mở rộng Supabase / AI).
- Cập nhật `docs/PROJECT_PLAN.md`.

---

## 4. Các file sẽ tạo / chỉnh sửa

| File | Hành động | Rule liên quan |
|---|---|---|
| `docs/DEPLOYMENT.md` | Tạo mới (tài liệu hướng dẫn deploy & rollback) | R00, W06 |
| `docs/plans/PLAN-20261118-w06-deploy-cloudflare.md` | Tạo mới (kế hoạch chi tiết) | RULE[user_global] |
| `.agent/PROJECT_STATE.md` | Cập nhật (nhật ký gate G7, tag v1.0.0) | R00, R07 |
| `docs/PROJECT_PLAN.md` | Cập nhật (tiến độ hoàn thành v1.0.0) | R00 |

---

## 5. Kế hoạch Commit (R08)
- `chore(deploy): prepare cloudflare pages deployment guide and verified build headers`
- `docs: update project state and plan for official v1.0.0 release`
- Merge vào `main` và gắn tag `v1.0.0`.
