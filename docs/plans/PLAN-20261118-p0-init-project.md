# Kế hoạch Thực hiện: Khởi tạo Khung Dự án (P0 / W01)

- **Mã kế hoạch**: `PLAN-20261118-p0-init-project`
- **Phase**: P0 (Foundation)
- **Workflow tương ứng**: W00 -> W01 (Khởi tạo dự án)
- **Mục tiêu**: Thiết lập toàn bộ khung dự án chạy được từ Vite + TypeScript strict, Engine 3D Three.js có cơ chế Render-on-demand, StateMachine, AssetLoader, module Random thuần chuẩn CSPRNG, LocalRepository an toàn XSS, hệ thống UI Menu, 2 Mode rỗng để kiểm chứng vòng đời (lifecycle), và hệ thống scripts kiểm tra quy tắc (check-rules).

---

## 1. Phân tích & Yêu cầu Kỹ thuật
- **Tuân thủ quy tắc kiến trúc (R01)**:
  - Tách biệt vùng thuần (`src/shared/**`, `src/services/**`, `src/core/Random.ts`) không được phép import `three`, `gsap`, hay DOM API.
  - Phụ thuộc một chiều: `ui -> modes -> core -> three/gsap`.
- **Hiệu năng & Vòng đời (R03, R07)**:
  - Engine chỉ render khi có tween active, input, resize hoặc có yêu cầu `requestRender()`. Khi đứng yên ở menu, số frame render phải dừng lại.
  - Tạm dừng loop khi tab bị ẩn (`visibilitychange`).
  - Mỗi Mode phải có đầy đủ vòng đời `init() -> enter() -> update(dt) -> exit() -> dispose()`. Mọi tài nguyên Mesh/Material/Texture mà Mode tạo ra phải được dọn dẹp sạch sẽ khi `dispose()`.
  - Thiết lập hook dev `window.__fh = { info: renderer.info }` để đo baseline rò rỉ bộ nhớ (Gate G3).
- **Tính công bằng & Ngẫu nhiên (R04)**:
  - `core/Random.ts` sử dụng `crypto.getRandomValues` kết hợp rejection sampling để tránh modulo bias.
  - Cấm sử dụng `Math.random` trong logic bói toán.
- **An toàn & Bảo mật (R05, R06)**:
  - UI thuần sử dụng `textContent`, cấm sử dụng `innerHTML` với biến dữ liệu ngoài.
  - `LocalRepository` đọc `localStorage` có bọc try/catch, kiểm tra type guard, giới hạn 100 bản ghi, chống crash khi storage đầy hoặc bị chặn.
  - Thiết lập file `.env.example`, bổ sung `.env*` vào `.gitignore`, tạo `public/_headers` với cache immutable cho assets.

---

## 2. Danh sách các file dự kiến tạo mới / cấu hình

### Cấu hình gốc & Scripts
- `package.json` (scaffold + scripts: `typecheck`, `test`, `check:rules`, `build`, `check`)
- `tsconfig.json` (strict, paths alias `@/*` -> `src/*`)
- `vite.config.ts` (alias, build target es2020, manualChunks cho `three`)
- `.gitignore` (bao gồm các rule append từ template)
- `.env.example`
- `public/_headers` (cache immutable cho assets)
- `scripts/check-rules.mjs` (sao chép từ template để kiểm tra tự động các rule R01/R02/R04/R06)

### Module Vùng Thuần (Pure Zones)
- `src/shared/types.ts` (TarotCard, DrawnCard, Hexagram, CoinLine, Reading, TarotResult, DivinationResult, ReadingRepository, Topic...)
- `src/shared/constants.ts` (TOPICS, MAX_HISTORY_RECORDS, KEY_READINGS...)
- `src/shared/strings.vi.ts` (toàn bộ từ khóa ngôn ngữ UI)
- `src/shared/i18n.ts` (hàm `t(key)`)
- `src/core/Random.ts` (RandomSource, cryptoRandom, shuffle Fisher-Yates)
- `src/services/repository.ts` (LocalRepository với type guard và schema migration sẵn sàng)

### Module 3D Engine & Core
- `src/core/Engine.ts` (renderer, scene, camera, resize, render-on-demand loop, trackTween, visibility listener, dev hook `__fh`)
- `src/core/StateMachine.ts` (FSM generic hỗ trợ enter/exit sạch)
- `src/core/AssetLoader.ts` (quản lý load GLTF Draco, Texture, LoadingManager và cache)
- `src/core/AudioManager.ts` (khung stub)
- `src/core/Quality.ts` (khung stub)
- `src/core/dispose.ts` (hàm `disposeObject` hỗ trợ whitelist `keepShared`)

### Module Modes & UI
- `src/modes/Mode.ts` (Interface ModeContext và Mode)
- `src/modes/tarot/TarotMode.ts` (Stub Mode dựng bàn + 1 nến chập chờn, kiểm chứng lifecycle)
- `src/modes/divination/DivinationMode.ts` (Stub Mode dựng bàn + 1 nến chập chờn, kiểm chứng lifecycle)
- `src/ui/Menu.ts` (Giao diện Menu chính dạng HTML overlay, chuyển mode)
- `src/ui/styles/main.css` (Giao diện màu tím đêm + vàng đồng, responsive, touch-action: none cho canvas)
- `src/main.ts` (Điểm khởi động, khởi tạo Engine, nạp động các mode khi người dùng bấm chọn)
- `index.html` (Canvas container + UI root)

### Unit Tests
- `src/core/__tests__/random.test.ts` (test cryptoRandom, shuffle, boundary max, rejection sampling)
- `src/services/__tests__/repository.test.ts` (test lưu, đọc, xóa, xử lý dữ liệu hỏng)

---

## 3. Các bước thực hiện tuần tự

1. **Bước 1: Khởi tạo Git & Scaffold**
   - Chạy `git init` và tạo nhánh `phase/p0-init`.
   - Scaffold Vite TypeScript vanilla: `npm create vite@latest . -- --template vanilla-ts`.
   - Cài đặt runtime: `npm i three gsap`.
   - Cài đặt dev: `npm i -D vitest @types/three`.

2. **Bước 2: Thiết lập cấu hình chuẩn**
   - Cập nhật `tsconfig.json`, `vite.config.ts`.
   - Sao chép `templates/check-rules.mjs` vào `scripts/check-rules.mjs`.
   - Cập nhật `scripts` trong `package.json` (`typecheck`, `test`, `check:rules`, `build`, `check`).
   - Cấu hình `.gitignore`, `.env.example`, `public/_headers`.

3. **Bước 3: Dựng module thuần & Unit Tests**
   - Tạo `shared/types.ts`, `shared/constants.ts`, `shared/strings.vi.ts`, `shared/i18n.ts`.
   - Triển khai `core/Random.ts` và viết unit test `core/__tests__/random.test.ts`.
   - Triển khai `services/repository.ts` và viết unit test `services/__tests__/repository.test.ts`.
   - Chạy `npm run test` để đảm bảo test pass 100%.

4. **Bước 4: Xây dựng Core 3D Engine & State Machine**
   - Triển khai `core/Engine.ts`, `core/StateMachine.ts`, `core/dispose.ts`, `core/AssetLoader.ts`, `core/AudioManager.ts`, `core/Quality.ts`.
   - Tích hợp render-on-demand với `activeTweens` và listener visibility.
   - Thêm dev hook `window.__fh`.

5. **Bước 5: Xây dựng UI & Modes rỗng**
   - Định nghĩa `modes/Mode.ts`.
   - Xây dựng `modes/tarot/TarotMode.ts` và `modes/divination/DivinationMode.ts` (dựng scene bàn bói 3D cơ bản và nến).
   - Xây dựng `ui/Menu.ts` và stylesheet `ui/styles/main.css`.
   - Nối vào `src/main.ts` với dynamic `import()` cho từng mode.

6. **Bước 6: Kiểm tra Cổng chất lượng (Quality Gates)**
   - Chạy `npm run check` (typecheck + vitest + check:rules + vite build).
   - Thử nghiệm cố ý vi phạm rule (ví dụ import `three` trong `shared`) để đảm bảo script `check-rules.mjs` chặn được.
   - Kiểm tra vòng đời G3 (vào ra mode 3 lần, kiểm tra `renderer.info.memory`).
   - Kiểm tra render-on-demand (đứng yên không render).
   - Cập nhật nhật ký gate trong `.agent/PROJECT_STATE.md`.

---

## 4. Kế hoạch kiểm thử & Tiêu chuẩn hoàn thành (Definition of Done)
- [ ] Lệnh `npm run check` pass 100% (không lỗi TS, không lỗi Vitest, 0 vi phạm rule-check, build thành công sinh 3 chunk riêng: vendor three, tarot, divination).
- [ ] Giao diện Menu hiển thị đẹp mắt, phong cách tím đêm + vàng đồng huyền bí, bấm chọn mode chuyển cảnh 3D mượt mà và có nút quay lại Menu.
- [ ] Không có `any`, không có `Math.random` trong logic bói toán, không có `innerHTML` với biến dữ liệu.
- [ ] Memory baseline được ghi nhận đầy đủ trong `PROJECT_STATE.md`.
