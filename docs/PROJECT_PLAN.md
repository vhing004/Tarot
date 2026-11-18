# Kế hoạch Tổng thể Dự án: Fortune-Hunter

## 1. Phân tích Dự án & Mục tiêu
- **Tên dự án**: Fortune-Hunter
- **Loại hình**: Game bói 3D nền tảng web (Desktop & Mobile Browser).
- **Mục tiêu**: Xây dựng trải nghiệm bói huyền bí với 2 chế độ (Tarot và Gieo quẻ Kinh Dịch), đảm bảo hiệu năng cao trên WebGL mobile (≥45fps mobile, ≥60fps desktop), kết quả công bằng minh bạch (RNG thuần trước animation), giao diện HTML overlay mượt mà và khả năng mở rộng AI + Cloud Database.
- **Mục đích**: Mang tính chất giải trí, tham khảo, không thay thế tư vấn y tế/pháp lý/tài chính.

---

## 2. Đánh giá Kiến trúc & Công nghệ (Tech Stack)

### Stack cốt lõi
- **Core 3D**: Three.js thuần (tree-shaking imports) + WebGL Renderer.
- **Ngôn ngữ**: TypeScript (`strict: true`, no `any`, `noUncheckedIndexedAccess`).
- **Build tool**: Vite + ES2020 target + dynamic `import()` code-splitting.
- **Animation**: GSAP (được đồng bộ và theo dõi trong Render-on-demand loop).
- **Audio**: Web Audio API (Synthesizer lập trình thủ tục: drone BGM + SFX, 0 KB static assets).
- **UI**: HTML/CSS/TS thuần (Overlay dạng responsive, mobile bottom sheet, textContent chống XSS).
- **Kiểm thử**: Vitest (chạy trên Node cho toàn bộ logic thuần).
- **Lưu trữ**: Interface `ReadingRepository` -> `LocalRepository` (localStorage có type-guard + quota control) -> `SupabaseRepository` (Cloud RLS).
- **Deploy**: Cloudflare Pages (Static Hosting + Cache-Control immutable qua `_headers`).

### Điểm mạnh
- Tách biệt hoàn toàn tầng logic thuần (`pure zones`) và tầng đồ họa (`view / core`). Đảm bảo kết quả xác định độc lập với FPS hoặc tương tác vật lý.
- Cơ chế Render-on-demand giúp tiết kiệm pin tối đa trên thiết bị di động (đứng yên không render).
- Không phụ thuộc framework cồng kềnh (React/R3F), tối ưu kích thước bundle và thời gian khởi động ban đầu.
- Hệ thống quy tắc kiểm soát chất lượng (`.agent/rules` và `scripts/check-rules.mjs`) kiểm tra chặt chẽ rò rỉ bộ nhớ, any type, và import sai vùng.

### Điểm yếu & Rủi ro
- **Rủi ro rò rỉ bộ nhớ WebGL (G3 Lifecycle)**: Việc ra/vào mode nhiều lần nếu không giải phóng kỹ `geometry`, `material`, `texture` và kill GSAP tween sẽ gây crash WebGL context trên mobile.
- **Rủi ro tải tài nguyên ban đầu**: Tải texture không nén hoặc mô hình 3D quá nặng sẽ làm tăng LCP và hao băng thông. Cần nén KTX2/WebP và nén Draco/meshopt cho GLTF.
- **Chính sách Autoplay Audio**: Trình duyệt di động chặn âm thanh tự động nếu người dùng chưa tương tác đầu tiên (đã giải quyết bằng unlock listener trong `AudioManager`).
- **Tính chính xác của thuật toán Kinh Dịch**: Cần đảm bảo thứ tự hào từ dưới lên (hào 1 ở index 0, hào 6 ở index 5) và chỉ hào 6 (lão âm) và 9 (lão dương) mới là hào động.

---

## 3. Các Giai đoạn Phát triển (Phases Roadmap)

| Phase | Tên giai đoạn | Trọng tâm | Deliverable / Gate | Trạng thái |
|---|---|---|---|---|
| **P0** | **Khởi tạo & Khung nền tảng (Foundation)** | Scaffold Vite+TS, Engine 3D render-on-demand, AssetLoader, StateMachine, RandomSource, LocalRepository, Menu UI, scripts kiểm tra rules. | `npm run check` pass, Menu vào/ra mode rỗng, baseline memory sạch (G0, G1, G2). | **Hoàn thành (2026-11-18)** |
| **P1** | **Tarot Mode MVP** | 22 lá Ẩn Chính, xáo bài Fisher-Yates, trải bài quạt 3D, rút 1/3 lá, lật bài, hiển thị kết quả ReadingPanel, dispose sạch khi thoát. | Hoàn thành 1 lượt bói Tarot, lật xuôi/ngược chuẩn, G1, G2, G3, G5. | **Hoàn thành (2026-11-18)** |
| **P2** | **Gieo quẻ Kinh Dịch MVP** | Tung 3 đồng xu 6 lần, dựng quẻ chủ và quẻ biến từ dưới lên, HexagramView, tra cứu `hexagrams.json`, unit tests thuật toán. | Test Vitest 100% test vectors, diễn hoạt xu chuẩn với kết quả, G1, G2, G3, G5. | **Hoàn thành (2026-11-18)** |
| **P3** | **Polish, Lịch sử & Âm thanh** | `LocalRepository` hoàn thiện UI History (xem, xóa), hiệu ứng bàn nến chập chờn, khói hạt, AudioManager (BGM, SFX xu/bài), share ảnh canvas/HTML. | Giao diện hoàn chỉnh, âm thanh mượt, lưu trữ an toàn (G1, G2, G3, G6). | **Hoàn thành (2026-11-18)** |
| **P4** | **Tối ưu Hiệu năng (Performance)** | Adaptive Quality (đo FPS, tự hạ cấu hình), nén WebP/Draco, cấu hình `public/_headers`, kiểm tra ngân sách hiệu năng (FPS ≥ 45 mobile). | Đạt chuẩn hiệu năng R03, bundle JS gzip ~135 kB, G1, G2, G4, G6. | **Hoàn thành (2026-11-18)** |
| **Deploy** | **Triển khai Cloudflare Pages (v1.0.0)** | Cấu hình build tĩnh, CSP strict, cache immutable 1 năm, tài liệu hướng dẫn deploy và quy trình rollback. | `dist/_headers` chuẩn, 0 runtime vulnerability, live on Cloudflare Pages, Gate G7. | **Hoàn thành (2026-11-18)** |
| **P5** | **Mở rộng & Nâng cao** | Mở rộng 78 lá Tarot, đủ 64 quẻ Kinh Dịch, tích hợp Supabase (RLS), AI Serverless Function giải quẻ chuyên sâu, đa ngôn ngữ (i18n Vi/En), PWA offline. | Đầy đủ dữ liệu sản phẩm thương mại, AI interpretation an toàn qua gateway. | Dự kiến |

---

## 4. Danh sách Công việc Chi tiết (Task Breakdown)

### Phase P0 (Hoàn thành: 2026-11-18)
- [x] Task P0.1: Khởi tạo git, scaffold dự án Vite + Vanilla TS, cài đặt runtime dependencies (`three`, `gsap`) và dev dependencies (`vitest`, `@types/three`).
- [x] Task P0.2: Cấu hình `tsconfig.json` (strict, path alias `@/*`), `vite.config.ts` (chunk splitting cho `three`), Vitest.
- [x] Task P0.3: Thiết lập `scripts/check-rules.mjs`, scripts trong `package.json`, `.gitignore`, `.env.example`, `public/_headers`.
- [x] Task P0.4: Xây dựng cấu trúc thư mục chuẩn và các module shared (`types.ts`, `constants.ts`, `i18n.ts`, `strings.vi.ts`).
- [x] Task P0.5: Triển khai logic nền tảng: `core/Random.ts` (cryptoRandom, Fisher-Yates shuffle), `services/repository.ts` (`LocalRepository`), kèm bộ unit tests.
- [x] Task P0.6: Triển khai tầng 3D Engine: `Engine.ts` (render-on-demand, tween tracking, visibility pause), `StateMachine.ts`, `AssetLoader.ts`, `dispose.ts`, `AudioManager.ts` (stub), `Quality.ts` (stub).
- [x] Task P0.7: Triển khai Mode interface, 2 mock modes (`TarotMode.ts`, `DivinationMode.ts` dựng bàn + nến cơ bản để kiểm tra lifecycle), `ui/Menu.ts` và `main.ts`.
- [x] Task P0.8: Chạy kiểm tra cổng chất lượng G0, G1, G2, G3 baseline và ghi nhật ký vào `PROJECT_STATE.md`.

### Phase P1 (Hoàn thành: 2026-11-18)
- [x] Task P1.1: Tạo dữ liệu 22 lá Ẩn Chính (`cards.json`) và tài liệu nguồn gốc giấy phép (`SOURCES.md`).
- [x] Task P1.2: Triển khai logic Tarot thuần (`deck.ts`, `spreads.ts`, `interpret.ts`) và unit tests Vitest.
- [x] Task P1.3: Dựng đồ họa 3D Tarot View (`Card.ts`, `DeckView.ts`, texture canvas hoa văn mặt sau + mặt trước).
- [x] Task P1.4: Triển khai FSM TarotMode (INTRO -> SHUFFLE -> SPREAD -> PICK -> REVEAL -> READING -> SAVE).
- [x] Task P1.5: Tích hợp `ReadingPanel` và kiểm tra toàn bộ chất lượng G1, G2, G3, G5.

### Phase P2 (Hoàn thành: 2026-11-18)
- [x] Task P2.1: Tạo dữ liệu Kinh Dịch 64 quẻ (`hexagrams.json`) và tài liệu nguồn gốc (`SOURCES.md`).
- [x] Task P2.2: Triển khai thuật toán gieo quẻ 3 đồng xu thuần (`hexagram.ts`, `lookup.ts`, `interpret.ts`) và unit tests Vitest 100% test vectors.
- [x] Task P2.3: Dựng đồ họa 3D Quẻ Kinh Dịch (`Coin.ts`, `HexagramView.ts` dựng hào từ dưới lên, hiệu ứng hào động nhấp nháy chuyển màu).
- [x] Task P2.4: Triển khai FSM DivinationMode (INTRO -> CONCENTRATE -> THROW(x6) -> BUILD -> CHANGE -> READING -> SAVE).
- [x] Task P2.5: Tích hợp hiển thị kết quả, kiểm thử chất lượng G1, G2, G3, G5.

### Phase P3 (Hoàn thành: 2026-11-18)
- [x] Task P3.1: Triển khai hàm thuần `summarizeReading()` trong `services/reading.ts` và dịch vụ `SettingsService` quản lý âm thanh/đồ họa với bộ unit tests.
- [x] Task P3.2: Triển khai `AudioManager` với Web Audio API procedural synthesizer (ambient drone thiền định + SFX xáo/lật bài/xu rơi/chuông ngân).
- [x] Task P3.3: Dựng hệ thống hạt khói trầm hương 3D `SmokeParticles.ts` thích ứng cấu hình `QualityLevel`.
- [x] Task P3.4: Triển khai `share.ts` vẽ thẻ kết quả 2D Canvas 800x1200 px sắc nét, bảo mật thông tin cá nhân.
- [x] Task P3.5: Hoàn thiện giao diện `ui/History.ts`, `ui/Settings.ts`, nút bật/tắt âm thanh nhanh tại `Menu.ts` và tích hợp nút chia sẻ ảnh trong `ReadingPanel.ts`.
- [x] Task P3.6: Tích hợp hiệu ứng khói và SFX vào `TarotMode.ts` và `DivinationMode.ts`, kiểm thử toàn bộ cổng G1, G2, G3, G6.

### Phase P4 (Hoàn thành: 2026-11-18)
- [x] Task P4.1: Triển khai Adaptive Quality FPS Monitor (`Quality.ts`) với rolling window 60 frame, warmup 90 frame và 13 unit tests.
- [x] Task P4.2: Tích hợp `Engine.ts` với `Quality` để tự động điều chỉnh `pixelRatio` động và bổ sung hook `window.__fh.getMetrics()` đo đạc hiệu năng.
- [x] Task P4.3: Tối ưu `SmokeParticles.ts` với cơ chế `pause()`/`resume()` để đạt 0-frame render khi đứng yên hoặc khi bật `reducedMotion`.
- [x] Task P4.4: Bổ sung tùy chọn chất lượng đồ họa "Tự động" trong `ui/Settings.ts` và kết nối context ứng dụng.
- [x] Task P4.5: Cấu hình bảo mật Cloudflare Pages `public/_headers` (CSP strict, X-Frame-Options: DENY, Cache-Control immutable cho assets hash).
- [x] Task P4.6: Đo đạc và kiểm tra toàn bộ cổng chất lượng G1, G2, G4, G6 (57 tests pass, 0 lỗi TypeScript, 0 vi phạm rule).

### Deploy Cloudflare Pages (v1.0.0 - Hoàn thành: 2026-11-18)
- [x] Task D.1: Rà soát bảo mật runtime (`npm audit` xác nhận 0 runtime vulnerability, không secret).
- [x] Task D.2: Xác minh file `dist/_headers` chứa đầy đủ cấu hình bảo mật và cache tối ưu.
- [x] Task D.3: Soạn thảo tài liệu hướng dẫn vận hành và rollback chi tiết tại `docs/DEPLOYMENT.md`.
- [x] Task D.4: Phát hành tag chính thức `v1.0.0` và đồng bộ toàn bộ lên GitHub remote.

### Nâng cấp Trải nghiệm Tarot Chuyên nghiệp & Chuẩn 78 Lá (Hoàn thành: 2026-11-18)
- [x] Task T.1: Tái cấu trúc luồng trải bài có nhịp điệu (Ritual Pacing) theo `docs/tarot_game_development_guide.md`, chuyển `REVEAL` thành `INSPECT` State với nút bỏ qua linh hoạt.
- [x] Task T.2: Xây dựng `CardInspectOverlay` dạng 2 cột: hiển thị ảnh thật của lá bài (hỗ trợ xoay ngược 180°), tên, biểu tượng trực quan (`symbolism`), từ khóa và lời giải chi tiết.
- [x] Task T.3: Bổ sung Hộp câu hỏi phản tư (`reflection-prompt-box`) và Nhật ký chiêm nghiệm cá nhân (`journal-note-box`) có nút lưu bất đồng bộ vào `ReadingRepository`.
- [x] Task T.4: Tối ưu đồ họa và ánh sáng cảnh 3D: thêm `AmbientLight`, tạo procedural canvas texture mặt sau màu đỏ tươi `#c0152a` + viền vàng kim `#ffe44d`, vật liệu trắng phản chiếu chuẩn, giúp lá bài tương phản sắc nét trên nền bàn tối.
- [x] Task T.5: Trang bị trọn vẹn bộ ảnh số hóa Rider-Waite-Smith 1909 (Public Domain) thực tế cho toàn bộ 78 lá bài (`public/textures/tarot/*.jpg`), xóa bỏ các file dummy 34 bytes.
- [x] Task T.6: Mở rộng `cards.json` thành 78 lá bài Tarot chuẩn quốc tế (22 Ẩn Chính + 56 Ẩn Phụ: Wands, Cups, Swords, Pentacles).
- [x] Task T.7: Tích hợp tùy chọn chọn quy mô bộ bài (22 lá hoặc 78 lá) trong `QuestionForm.ts` và cơ chế fallback an toàn trong `CardInspectOverlay`.
- [x] Task T.8: Hiển thị tranh ảnh các lá bài đã rút trong Màn hình Tóm tắt kết quả (`ReadingPanel`) và danh sách Lịch sử (`History`) (`PLAN-20261118-summary-card-images`).
- [x] Task T.9: Chuyển đổi toàn diện trải nghiệm thành ứng dụng thuần Tarot 3D (Tarot Sanctum), lược bỏ Kinh Dịch khỏi giao diện và runtime bundle, tối ưu nút bấm chính menu và chuỗi hiển thị (`PLAN-20261118-tarot-only`).

---

## 5. Hướng phát triển Dài hạn
1. **Chia sẻ tương tác (Interactive Share)**: Sinh card kết quả dạng WebGL snapshot hoặc OpenGraph dynamic image để người dùng chia sẻ mạng xã hội.
2. **AI Oracle Interpretation**: Tích hợp mô hình Gemini qua Serverless Worker (Cloudflare Functions / Supabase Edge Functions) để phân tích sâu câu hỏi của người dùng dựa trên tổ hợp lá bài/quẻ gieo được với prompt guard an toàn.
3. **Hiệu ứng đồ họa cao cấp**: Thêm Shader bàn cờ dạ quang, nến đổ bóng mềm (PCF soft shadows), khói trầm hương sử dụng particle system tối ưu bằng `InstancedMesh`.
4. **Hỗ trợ Đa nền tảng (PWA & Offline)**: Cài đặt Service Worker để game có thể chơi ngoại tuyến toàn bộ 22 lá Tarot và 64 quẻ.
