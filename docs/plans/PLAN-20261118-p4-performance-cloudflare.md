# Kế hoạch Thực hiện: Phase P4 - Tối ưu Hiệu năng & Chuẩn bị Cloudflare Pages (Workflow W05)

## 1. Mục tiêu & Phạm vi
- **Mục tiêu**: Đạt toàn diện ngân sách hiệu năng theo [R03 §1](../../.agent/rules/R03-performance.md) trên cả Desktop (≥60 FPS) và Mobile tầm trung (≥45 FPS), tối ưu hóa Render-on-demand, hoàn thiện hệ thống đo FPS tự thích ứng cấu hình (`Adaptive Quality`), và cấu hình đầy đủ Cloudflare Pages Headers (`public/_headers`) kèm chính sách CSP an toàn theo [R06 §5](../../.agent/rules/R06-security.md).
- **Phạm vi áp dụng**:
  - `src/core/Quality.ts`: Hoàn thiện thuật toán đo FPS rolling window, tự động hạ cấu hình (tắt shadow/bloom, giảm pixel ratio, giảm số hạt khói) khi FPS < 45.
  - `src/core/__tests__/quality.test.ts`: Bộ unit test cho `Quality`.
  - `src/core/Engine.ts`: Tích hợp cập nhật pixel ratio động từ `Quality`, bổ sung dev hook đo metrics chi tiết (`render.calls`, `triangles`, `memory`).
  - `src/core/SmokeParticles.ts`: Tích hợp chế độ giảm chuyển động (`reducedMotion`) và tái sử dụng biến để không tạo rác GC trong `update()`.
  - `public/_headers`: Cấu hình tối ưu bảo mật và cache: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy` (CSP) an toàn cho Three.js WebGL + Web Audio + Canvas blob export, `Cache-Control` immutable cho bundle assets có hash.
  - Đo đạc số liệu trước/sau (Baseline vs Optimized) và ghi nhận vào `.agent/PROJECT_STATE.md`.

---

## 2. Phân tích Hiện trạng & Baseline Đo lường

### Số đo Baseline ban đầu:
- **Kích thước Bundle (`npm run build`)**:
  - `index.html`: 0.70 kB (gzip: 0.41 kB)
  - `index.css`: 11.99 kB (gzip: 2.94 kB)
  - `index.js` (App entry): 46.46 kB (gzip: 15.10 kB)
  - `three.js`: 475.57 kB (gzip: 119.05 kB)
  - `TarotMode.js`: 24.86 kB (gzip: 8.97 kB)
  - `DivinationMode.js`: 13.08 kB (gzip: 4.66 kB)
  - `QuestionForm.js`: 76.28 kB (gzip: 29.98 kB)
  - **Tổng JS ban đầu tải vào Menu**: ~134.15 kB gzip (Ngân sách R03: ≤ 300 kB gzip ➔ **ĐẠT XUẤT SẮC**).
- **Dung lượng thư mục `public/`**: 1.55 kB (Không tải trước file media nặng, âm thanh procedural 0 KB ➔ **ĐẠT XUẤT SẮC**).
- **Điểm cần nâng cấp**:
  - `Quality.ts` đang ở dạng stub tĩnh, chưa đo FPS thực tế để tự động thích ứng với thiết bị yếu.
  - Khi người dùng ở trạng thái đọc kết quả (`ReadingPanel`), khói trầm hương vẫn chạy updater liên tục gây hao pin không cần thiết nếu thiết bị yếu hoặc bật `reducedMotion`.
  - File `public/_headers` chưa có cấu hình CSP (`Content-Security-Policy`) và `X-Frame-Options`.

---

## 3. Kế hoạch Triển khai Chi tiết

### Bước 1: Nâng cấp `Adaptive Quality` (`src/core/Quality.ts`) và Unit Tests
- Xây dựng cơ chế theo dõi frame time trong 2-3 giây đầu hoặc rolling window:
  - Tích hợp hàm `recordFrame(currentTime)` tính toán FPS trung bình.
  - Nếu chế độ cấu hình là `auto` (hoặc bật thích ứng) và FPS trung bình < 45 fps kéo dài:
    - Hạ mức cấu hình: `high` ➔ `medium` (tắt shadow/bloom).
    - Nếu vẫn < 40 fps: `medium` ➔ `low` (pixel ratio hạ về 1.0, hạt khói giảm về 40 hạt).
  - Cho phép người dùng can thiệp thủ công từ `SettingsModal` (chọn Thấp / Vừa / Cao / Tự động).
  - Viết unit test đầy đủ kiểm tra chuyển mức cấu hình, fallback khi FPS thấp, và giữ nguyên cấu hình khi chọn thủ công.

### Bước 2: Tối ưu `Engine.ts` và Render-on-demand
- Thêm phương thức `setPixelRatio(ratio: number)` để cập nhật trực tiếp renderer khi `Quality` thay đổi.
- Bổ sung dev hook `window.__fh.getMetrics()` trả về:
  - `fps`: FPS tức thời và trung bình.
  - `drawCalls`: `renderer.info.render.calls`.
  - `triangles`: `renderer.info.render.triangles`.
  - `geometries`: `renderer.info.memory.geometries`.
  - `textures`: `renderer.info.memory.textures`.
- Tối ưu Render-on-demand khi mở `ReadingPanel` hoặc bật `reducedMotion`: tạm dừng updater của `SmokeParticles` để đạt 0 frame render khi không có tương tác.

### Bước 3: Tối ưu Garbage Collection (GC) trong các vòng lặp Render
- Rà soát các file view 3D:
  - `SmokeParticles.ts`: Tái sử dụng mảng tọa độ và Float32Array, không tạo object mới trong `update(dt)`.
  - `Coin.ts`: Tái sử dụng Vector3 cho tính toán vị trí/góc xoay.

### Bước 4: Hoàn thiện Cloudflare Headers & Content Security Policy (CSP)
- Cập nhật `public/_headers`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy`:
    `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; worker-src 'self' blob:; media-src 'self'; connect-src 'self'; font-src 'self' data:;`
  - `Cache-Control: public, max-age=31536000, immutable` cho `/assets/*`.
  - `Cache-Control: no-cache` cho `/index.html`.

### Bước 5: Chạy Kiểm thử Cổng Chất lượng G1, G3, G4, G6
- Chạy `npm run check` (typecheck + vitest + check:rules + build).
- Kiểm tra tính tương thích và bảo mật của CSP.
- Ghi nhận nhật ký gate G4 vào `.agent/PROJECT_STATE.md`.

---

## 4. Các file sẽ tạo / chỉnh sửa

| File | Hành động | Rule liên quan |
|---|---|---|
| `src/core/Quality.ts` | Sửa (triển khai FPS monitor và adaptive degradation) | R01, R03 §5 |
| `src/core/__tests__/quality.test.ts` | Tạo mới (unit tests cho Quality logic) | R02, R07 G1 |
| `src/core/Engine.ts` | Sửa (setPixelRatio động, metrics dev hook) | R01, R03 §2, R07 G4 |
| `src/core/SmokeParticles.ts` | Sửa (hỗ trợ tạm dừng khi reducedMotion / idle) | R03 §2, R03 §3 |
| `src/ui/Settings.ts` | Sửa (thêm tùy chọn chất lượng "Tự động") | R02, R03 §5 |
| `public/_headers` | Sửa (thêm CSP, X-Frame-Options) | R06 §5 |
| `.agent/PROJECT_STATE.md` | Sửa (ghi nhận nhật ký gate G4, trạng thái P4) | R00, R07 |
| `docs/PROJECT_PLAN.md` | Sửa (cập nhật tiến độ hoàn thành P4) | R00 |

---

## 5. Kế hoạch Commit & Release (R08)
- Commit 1: `feat(core): implement adaptive quality FPS monitor and unit tests`
- Commit 2: `perf(engine): add dynamic pixel ratio control and dev metrics hook`
- Commit 3: `perf(particles): support reduced motion and idle throttling in smoke system`
- Commit 4: `feat(ui): add auto quality option to settings modal`
- Commit 5: `chore(cloudflare): configure strict CSP, security headers, and immutable cache`
- Commit 6: `docs: complete phase P4 performance optimization and update project state`
- Merge vào `main` và gắn tag `v0.4.0`.
