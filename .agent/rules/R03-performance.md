---
id: R03
name: performance
trigger: always_on
description: Ngân sách hiệu năng, render-on-demand, tài nguyên, dispose, adaptive quality, mobile.
---
# R03: Hiệu năng

## 1. Ngân sách (đo được, kiểm ở gate [G4](R07-quality-gates.md))
| Hạng mục | Mục tiêu |
|---|---|
| FPS | ≥ 60 desktop; ≥ 45 mobile tầm trung |
| JS ban đầu (gzip, chưa gồm chunk mode) | ≤ ~300 KB cho app + three (ghi số đo thực tế; vượt thì phải giải thích) |
| Tổng asset tải trước vào menu | ≤ ~2 MB |
| Tổng model `.glb` | ≤ ~3 MB (nén Draco/meshopt) |
| Texture bài | 512x880, `.webp` (hoặc KTX2) |
| Số đèn | ≤ 3, chỉ 1 đèn đổ bóng (shadow map 1024) |
| Draw call cảnh chính | ghi số đo (`renderer.info.render.calls`), không tăng tuỳ tiện |
Các con số là mục tiêu khởi điểm; nếu đo thấy khác, cập nhật bảng này kèm quyết định trong PROJECT_STATE.

## 2. Nguyên tắc
1. **Đo trước, tối ưu sau.** Không tối ưu vi mô khi chưa có số đo ([W05](../workflows/05-optimize-performance.md)).
2. **Render theo yêu cầu**: chỉ render khi có animation đang chạy, input, resize hoặc `engine.requestRender()`. Đứng yên = 0 frame render.
3. Tạm dừng loop khi tab ẩn (`document.visibilitychange`).
4. `renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2))`.
5. Dùng chung geometry/material (một geometry + một material mặt sau cho mọi lá). Chồng bài nhiều lá → `InstancedMesh` khi đo thấy cần.
6. Tải lười: chỉ tải mặt sau bài + asset của mode đang dùng; mặt trước tải khi rút bài; chunk `three`, `tarot`, `divination` tách riêng.
7. Không `new Vector3/Quaternion/Matrix4` trong `update()`; dùng biến tái sử dụng.
8. Nến chập chờn bằng dao động `intensity` + vật liệu emissive, không thêm đèn.
9. Post-processing (bloom) mặc định tắt trên mobile; bật theo `Quality`.

## 3. Render-on-demand (mẫu)
```ts
// Engine: loop chỉ chạy khi cần
private needsRender = true;
private activeTweens = 0;
requestRender() { this.needsRender = true; if (!this.running) this.start(); }
private tick = (t: number) => {
  const dt = Math.min((t - this.last) / 1000, 0.05); this.last = t;
  this.updaters.forEach((u) => u(dt));
  if (this.needsRender || this.activeTweens > 0) { this.renderer.render(this.scene, this.camera); this.needsRender = false; }
  if (this.activeTweens > 0 || this.needsRender) requestAnimationFrame(this.tick); else this.running = false;
};
```
Animation (GSAP) phải gọi `engine.trackTween(tl)` để tăng/giảm `activeTweens` (onStart/onComplete/onInterrupt).

## 4. Dispose (bắt buộc, [R01 §5](R01-architecture.md))
```ts
export function disposeObject(root: Object3D, opts: { keepShared?: Set<unknown> } = {}) {
  root.traverse((o) => {
    const m = o as Mesh;
    if (m.geometry && !opts.keepShared?.has(m.geometry)) m.geometry.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    mats.forEach((mat) => {
      if (opts.keepShared?.has(mat)) return;
      Object.values(mat).forEach((v) => { if ((v as Texture)?.isTexture) (v as Texture).dispose(); });
      mat.dispose();
    });
  });
  root.removeFromParent();
}
```
- Resource dùng chung (qua AssetLoader cache) đưa vào `keepShared`.
- Kiểm rò rỉ bằng `renderer.info.memory` (gate [G3](R07-quality-gates.md)).

## 5. Adaptive quality (`core/Quality.ts`)
- Đo FPS trung bình 2-3 giây đầu khi vào cảnh 3D.
- Dưới ~45fps: hạ theo thứ tự → tắt bloom → tắt shadow → hạ pixel ratio (tối thiểu 1) → giảm số hạt.
- Lưu mức chất lượng vào settings; cho người dùng chọn thủ công (Thấp/Vừa/Cao).

## 6. Mobile
- `touch-action: none` trên canvas; dùng Pointer Events.
- Tránh texture > 1024 cạnh; tránh shader nặng (nhiều vòng lặp, nhiều texture fetch).
- Kiểm trên thiết bị thật hoặc giả lập throttle CPU 4x trong DevTools.

## 7. Bundle
- `manualChunks: { three: ['three'] }`; mode nạp bằng `import()`.
- Sau mỗi phase chạy `npm run build` và ghi kích thước chunk vào PROJECT_STATE (nhật ký gate).
