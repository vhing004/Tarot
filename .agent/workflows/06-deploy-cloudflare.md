---
id: W06
name: deploy-cloudflare
phase: Deploy
description: Đưa bản tĩnh lên Cloudflare Pages: cấu hình build, headers, biến môi trường, preview, release, rollback.
requires: [W05, P4 hoàn thành]
rules: [R00, R06, R07, R08]
next: W07
---
# W06: Deploy Cloudflare Pages

## Mục tiêu
Bản production chạy trên Cloudflare Pages (free), có preview theo nhánh, rollback rõ ràng.

## Entry gate
P4 `[x]` (G1, G3, G4). Repo đã đẩy lên GitHub, không chứa secret (G6). Nhánh `chore/deploy`.

## Rule áp dụng
[R06](../rules/R06-security.md), [R07 G6, G7](../rules/R07-quality-gates.md), [R08](../rules/R08-git-release.md).

## Các bước
### 1. Chuẩn bị
- `npm run check` xanh; `npm audit` (high/critical ở runtime phải xử lý, [R06 §7](../rules/R06-security.md)).
- `public/_headers` đã có cache immutable + security headers.
- Kiểm tra giới hạn kích thước file/số file của Cloudflare Pages trong tài liệu hiện hành so với asset của dự án (model/texture/audio). Gói free và điều khoản có thể đổi, đọc lại trang giá/điều khoản trước khi phát hành.

### 2. Tạo project
Cloudflare Dashboard → Workers & Pages → Create → Pages → kết nối repo GitHub:
- Framework preset: Vite (hoặc None)
- Build command: `npm run build`
- Output directory: `dist`
- Node version: đặt biến `NODE_VERSION` (≥ 18) nếu cần.

### 3. Biến môi trường
Settings → Environment variables (Production và Preview tách riêng). Chỉ biến `VITE_*` công khai ([R06 §1](../rules/R06-security.md)). Ở P0-P4 có thể chưa cần biến nào.

### 4. Preview
Đẩy nhánh → nhận URL preview. Kiểm trên preview:
- Chạy hai mode đầy đủ trên 1 desktop + 1 điện thoại thật.
- DevTools Network: asset có `Cache-Control: immutable`, file nén (br/gzip), không 404.
- Console sạch; Draco/âm thanh/chia sẻ ảnh hoạt động; không lỗi CSP (nếu bật).
- Lighthouse (Chrome) ghi điểm Performance; không bắt buộc đạt số cụ thể, nhưng phải ghi lại.

### 5. Release
- Merge nhánh vào `main` ([R08](../rules/R08-git-release.md)); Cloudflare tự build production.
- Mở URL production, lặp lại kiểm tra §4 nhanh.
- Tag `v1.0.0` (chỉ khi G7 đạt).

### 6. Rollback (thử ít nhất 1 lần trên preview)
Cloudflare Pages → Deployments → chọn bản trước → rollback/redeploy; hoặc `git revert` + push. Ghi cách làm vào PROJECT_STATE (mục ghi chú bàn giao).

### 7. Sau deploy
- Ghi URL production vào PROJECT_STATE.
- Đặt cảnh báo/thói quen kiểm hạn mức dùng định kỳ.
- Domain riêng (tùy chọn): gắn trong Cloudflare, kiểm HTTPS.

## Exit gate: G7
- [ ] Preview và production chạy đúng (desktop + mobile thật).
- [ ] Header/cache đúng; không lỗi console.
- [ ] Rollback đã biết cách và đã thử.
- [ ] Không secret trong repo (G6).

## Cập nhật state
Deploy `[x]`, tag `v1.0.0`, ghi URL, đặt "Phase hiện tại" = P5.

## Tiếp theo
[W13](13-quality-gate.md) → [W14](14-end-session.md); mở rộng ở [W07](07-extend-supabase-ai-i18n.md).
