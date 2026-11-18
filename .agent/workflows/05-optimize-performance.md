---
id: W05
name: optimize-performance
phase: P4
description: Tối ưu có đo đạc: baseline, render-on-demand, adaptive quality, nén asset, chunk, headers.
requires: [W04, P3 hoàn thành]
rules: [R00, R03, R06, R07]
next: W06
---
# W05: Tối ưu hiệu năng (P4)

## Mục tiêu
Đạt ngân sách [R03 §1](../rules/R03-performance.md) trên desktop và mobile tầm trung. **Mọi tối ưu phải có số đo trước/sau.**

## Entry gate
P3 `[x]` (G1, G2, G3, G6). Nhánh `phase/p4-optimize`.

## Rule áp dụng
[R03](../rules/R03-performance.md) (toàn bộ), [R06 §5](../rules/R06-security.md) (headers), [R07 G4](../rules/R07-quality-gates.md).

## Các bước
### 1. Baseline (BẮT BUỘC trước khi sửa)
Ghi vào nhật ký gate (kèm thiết bị/trình duyệt):
- FPS trung bình ở menu, Tarot (cảnh nặng nhất), Quẻ (lúc gieo xu), bằng DevTools Performance (+ CPU throttle 4x cho mobile giả lập).
- `renderer.info`: `render.calls`, `render.triangles`, `memory.geometries`, `memory.textures`.
- `npm run build`: kích thước từng chunk (raw/gzip).
- Tổng dung lượng `public/` (models, textures, audio).
- Thời gian tải đến khi menu tương tác được (Network, Disable cache).

### 2. Xác định điểm nghẽn
Từ baseline, liệt kê top 3 điểm nghẽn theo tác động. **Chỉ tối ưu top 3**, tránh tối ưu lan man. Ghi vào PROJECT_STATE (mục Quyết định nếu thay đổi thiết kế).

### 3. Kho kỹ thuật (áp dụng theo điểm nghẽn)
| Vấn đề | Cách xử lý |
|---|---|
| Render khi đứng yên | Kiểm render-on-demand ([R03 §3](../rules/R03-performance.md)); đứng yên ≥ 5 giây = 0 frame |
| FPS thấp trên máy yếu | Hoàn thiện `Quality.ts` ([R03 §5](../rules/R03-performance.md)): tắt bloom → tắt shadow → hạ pixel ratio → giảm hạt |
| Texture nặng | Chuyển WebP/KTX2, giảm kích thước; chỉ tải mặt trước khi rút |
| Model nặng | `npx @gltf-transform/cli optimize in.glb out.glb --compress draco` (xem `--help` của phiên bản đang dùng; có thể dùng meshopt) |
| Draw call cao | Chung geometry/material; `InstancedMesh` cho chồng bài |
| JS lớn | Kiểm `manualChunks`, import có chọn lọc từ `three`, tải lười bloom/loader |
| Rò rỉ bộ nhớ | Chạy lại G3 nhiều vòng; sửa `dispose` |
| Tải chậm | `public/_headers` cache immutable ([templates/_headers](../templates/_headers)); bật `vite-plugin-compression` (brotli) nếu host không tự nén |
| GC giật | Bỏ `new` trong `update`; tái sử dụng vector/quaternion |

### 4. Làm từng việc một
Mỗi tối ưu = 1 commit `perf(...)` + đo lại cùng điều kiện + ghi chênh lệch. Tối ưu không cải thiện đo được thì **revert**.

### 5. CSP (tùy chọn)
Thử Content-Security-Policy ở preview trước ([R06 §5](../rules/R06-security.md)); chỉ giữ nếu mọi chức năng (Draco, âm thanh, chia sẻ ảnh) vẫn chạy.

### 6. Kiểm tra cuối
Đo lại toàn bộ baseline; so với ngân sách.

## Exit gate
**G1, G3, G4** đạt.
- [ ] Bảng trước/sau trong nhật ký gate.
- [ ] Đạt mục tiêu FPS (hoặc có quyết định cập nhật mục tiêu kèm lý do).
- [ ] Đứng yên không render; tab ẩn dừng loop.
- [ ] `npm run build` ghi kích thước chunk; không chunk bất thường.

## Cập nhật state
P4 `[x]`, tag `v0.4.0`, đặt "Phase hiện tại" = Deploy.

## Tiếp theo
[W13](13-quality-gate.md) → [W14](14-end-session.md); phiên sau W00 → [W06](06-deploy-cloudflare.md).
