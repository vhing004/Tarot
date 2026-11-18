---
id: W01
name: init-project
phase: P0
description: Dựng khung dự án: Vite + TS, Engine, StateMachine, AssetLoader, Random, repository, Menu, scripts kiểm rule.
requires: [W00, G0]
rules: [R00, R01, R02, R03, R04, R06, R07, R08]
next: W02
---
# W01: Khởi tạo dự án (P0)

## Mục tiêu
Có khung chạy được: menu → chọn mode (mode trống) → quay về; Engine render-on-demand; công cụ kiểm rule hoạt động. **Chưa có Tarot/Quẻ thật.**

## Entry gate
[W00](00-start-session.md) xong (G0). Nhánh `phase/p0-init` đã tạo.

## Rule áp dụng
[R01](../rules/R01-architecture.md) (cấu trúc), [R02](../rules/R02-code-style.md), [R03](../rules/R03-performance.md) (render-on-demand), [R04](../rules/R04-fairness-divination.md) (Random), [R06](../rules/R06-security.md), [R08](../rules/R08-git-release.md).

## Các bước (làm tuần tự, commit sau mỗi bước)
### 1. Scaffold
```bash
npm create vite@latest . -- --template vanilla-ts
npm i three gsap
npm i -D vitest @types/three
```
Commit: `chore(build): scaffold vite + ts`.

### 2. Cấu hình
- `tsconfig.json` theo [R02 §1](../rules/R02-code-style.md), thêm alias `@/*` → `src/*`.
- `vite.config.ts`: alias `@`, `build.target: 'es2020'`, `manualChunks: { three: ['three'] }`.
- Vitest: `test.environment = 'node'`, include `src/**/*.test.ts`.
- Sao chép `templates/package-scripts.json` vào `scripts` của `package.json`.
- `mkdir scripts` và sao chép `templates/check-rules.mjs` → `scripts/check-rules.mjs`.
- Nối `templates/gitignore.append` vào `.gitignore`; tạo `.env.example`.
- Sao chép `templates/_headers` → `public/_headers`.
Commit: `chore(build): configure ts strict, vitest, scripts`.

### 3. Dựng thư mục theo [R01 §4](../rules/R01-architecture.md)
Tạo đủ thư mục rỗng có `.gitkeep`. Tạo `shared/types.ts` (TarotCard, DrawnCard, Hexagram, CoinLine, Reading, TarotResult, DivinationResult, ReadingRepository, Topic), `shared/constants.ts`, `shared/i18n.ts`, `shared/strings.vi.ts`.

### 4. Logic thuần nền tảng
- `core/Random.ts` đúng như [R04 §2](../rules/R04-fairness-divination.md).
- Test: `core/__tests__/random.test.ts` (shuffle hoán vị đúng, `nextInt` biên, phân phối đơn giản không lệch rõ rệt trên 10⁴ mẫu).
- `services/repository.ts`: `LocalRepository` (key `fh.readings.v1`, `schemaVersion`, try/catch, type guard, giới hạn 100 bản ghi, [R06 §3](../rules/R06-security.md)) + test với `localStorage` giả.

### 5. Core 3D
- `core/Engine.ts`: renderer, camera, resize, `requestRender()`, `trackTween()`, đăng ký `updaters`, tạm dừng khi tab ẩn, dev hook `__fh` ([R03 §3](../rules/R03-performance.md), [R07 §3](../rules/R07-quality-gates.md)).
- `core/StateMachine.ts` (như mẫu trong spec): `go(name, payload)`, gọi `exit` của state cũ rồi `enter` của state mới.
- `core/dispose.ts` theo [R03 §4](../rules/R03-performance.md).
- `core/AssetLoader.ts`: `LoadingManager` + progress; GLTF + Draco (decoder đặt ở `public/draco/`), texture cache; hàm `loadTexture(url)` có fallback khi lỗi.
- `core/AudioManager.ts`: khung rỗng (phát sau tương tác đầu tiên), hoàn thiện ở W04.
- `core/Quality.ts`: khung + hằng số mức chất lượng, hoàn thiện ở W05.

### 6. Mode & UI khung
- `modes/Mode.ts` theo [R01 §5](../rules/R01-architecture.md).
- `modes/tarot/TarotMode.ts` và `modes/divination/DivinationMode.ts`: **bản rỗng** đầy đủ vòng đời (cảnh có bàn tròn + 1 đèn nến chập chờn), `dispose()` thật.
- `main.ts`: Loading → Menu; `startMode(id)` dùng `import()` động; thoát mode gọi `exit()` rồi `dispose()`.
- `ui/Menu.ts` (Tarot | Gieo quẻ | Lịch sử (vô hiệu) | Cài đặt (vô hiệu)), `ui/styles/` theme tím đêm + vàng đồng, responsive. Dùng `textContent`, chuỗi qua `t()`.

### 7. Kiểm tra
- `npm run dev`: menu hiện, vào/ra từng mode, console sạch.
- `npm run check:rules`: cố ý thêm 1 dòng `import 'three'` vào `shared/` để chắc script **bắt được**, rồi xóa.
- `npm run check`.
- Chạy G3 (lifecycle) trên 2 mode rỗng: vào/ra 3 lần, ghi baseline.

## Exit gate
**G0, G1, G2** đạt; G3 baseline đã ghi. Bằng chứng ghi vào nhật ký gate.
- [ ] Menu → mode → menu hoạt động, import động tách chunk (xem output `vite build`).
- [ ] `check-rules` bắt được vi phạm thử.
- [ ] Đứng yên ≥ 5 giây không render frame (render-on-demand).

## Cập nhật state
Đánh dấu P0 `[x]`, tag `v0.0.1`, ghi kích thước chunk vào nhật ký gate, cập nhật "Phase hiện tại" = P1, nhánh = `phase/p1-tarot`.

## Tiếp theo
Chạy [W13](13-quality-gate.md) để đóng phase, rồi [W14](14-end-session.md); phiên sau bắt đầu W00 → [W02](02-build-tarot-mode.md).
