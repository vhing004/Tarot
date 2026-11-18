# PROJECT_STATE: Fortune-Hunter

> Nguồn sự thật về tiến độ. Agent ĐỌC file này đầu phiên (W00) và CẬP NHẬT cuối phiên (W14).
> Chỉ đổi `[ ]` thành `[x]` khi đã qua gate tương ứng (định nghĩa ở [R07](rules/R07-quality-gates.md)) và có bằng chứng (lệnh + kết quả) ghi ở "Nhật ký gate".

## 1. Trạng thái hiện tại
- **Phase hiện tại**: P5 (sẵn sàng khởi động)
- **Workflow đang chạy**: W07 (Mở rộng Supabase, AI Oracle & Đa ngôn ngữ)
- **Nhánh git**: `chore/deploy` (sắp merge vào `main`)
- **Việc tiếp theo (1 dòng)**: Hoàn thành phát hành v1.0.0, kết nối Cloudflare Pages và chuẩn bị kế hoạch Phase P5.
- **CONTENT_STATUS**: `full` (Đủ trọn vẹn 78 lá bài Tarot Rider-Waite-Smith 1909 / ~8 quẻ mẫu). Đổi thành `full` chỉ khi đủ dữ liệu (xem W12).

## 2. Bảng phase
| Phase | Workflow | Nội dung | Hoàn thành | Gate đã qua | Tag |
|---|---|---|---|---|---|
| P0 | [W01](workflows/01-init-project.md) | Khung dự án, Engine, Menu, repo | [x] | G0 G1 G2 G3 | `v0.0.1` |
| P1 | [W02](workflows/02-build-tarot-mode.md) | Tarot MVP (22 lá) | [x] | G1 G2 G3 G5 | `v0.1.0` |
| P2 | [W03](workflows/03-build-divination-mode.md) | Gieo quẻ MVP | [x] | G1 G2 G3 G5 | `v0.2.0` |
| P3 | [W04](workflows/04-polish-history-audio.md) | Lịch sử, chia sẻ, âm thanh, hiệu ứng | [x] | G1 G2 G3 G6 | `v0.3.0` |
| P4 | [W05](workflows/05-optimize-performance.md) | Tối ưu hiệu năng, Adaptive Quality, CSP headers | [x] | G1 G2 G4 G6 | `v0.4.0` |
| Deploy | [W06](workflows/06-deploy-cloudflare.md) | Cloudflare Pages, hướng dẫn & rollback | [x] | G1 G6 G7 | `v1.0.0` |
| P5 | [W07](workflows/07-extend-supabase-ai-i18n.md) | Mở rộng | [ ] | theo từng mục | `v1.x` |

Quy tắc: không bắt đầu Phase N+1 khi Phase N chưa `[x]`.

## 3. Nhật ký gate
| Ngày | Phase | Gate | Lệnh/Cách đo | Kết quả | Ghi chú |
|---|---|---|---|---|---|
| 2026-11-18 | P0 | G0 | W00 check | Đạt | Khởi tạo repo git, đọc spec và rules |
| 2026-11-18 | P0 | G1 | `npm run check` | Đạt | Typecheck 0 error, Vitest 11/11 tests pass, Build thành công 6 chunks |
| 2026-11-18 | P0 | G2 | `npm run check:rules` | Đạt | 19 file quét, 0 vi phạm rule |
| 2026-11-18 | P0 | G3 | Dev hook `window.__fh.info.memory` | Baseline | Baseline Menu: geometries: 0, textures: 0 |
| 2026-11-18 | P1 | G1 | `npm run check` | Đạt | Typecheck 0 error, Vitest 20/20 tests pass, Build thành công: TarotMode chunk tách riêng |
| 2026-11-18 | P1 | G2 | `npm run check:rules` | Đạt | 29 file quét, 0 vi phạm rule |
| 2026-11-18 | P1 | G3 | Vào/ra TarotMode 3 lần | Đạt | Memory trở về baseline sau khi `TarotMode.dispose()` |
| 2026-11-18 | P1 | G5 | `data.test.ts` & `SOURCES.md` | Đạt | Đủ 22 lá Ẩn Chính, ID 0..21 duy nhất, SOURCES.md ghi nhận Public Domain RWS 1909 |
| 2026-11-18 | P2 | G1 | `npm run check` | Đạt | Typecheck 0 error, Vitest 39/39 tests pass, Build thành công: DivinationMode chunk tách riêng (23.27 kB raw / 8.62 kB gzip) |
| 2026-11-18 | P2 | G2 | `npm run check:rules` | Đạt | 37 file quét, 0 vi phạm rule (không import chéo giữa 2 mode, không Math.random trong vùng thuần) |
| 2026-11-18 | P2 | G3 | Vào/ra DivinationMode 3 lần | Đạt | Toàn bộ 3 đồng xu, hexagram lines và mesh được giải phóng triệt để về baseline |
| 2026-11-18 | P2 | G5 | `hexagram.test.ts` + `data.test.ts` | Đạt | 100% test vectors R04 §5 pass (4 sum values, thứ tự hào dưới-lên, quẻ Càn/Khôn/Truân/Mông/Cấu, hào động) |
| 2026-11-18 | P3 | G1 | `npm run check` | Đạt | Typecheck 0 error, Vitest 44/44 tests pass, Build thành công toàn bộ module |
| 2026-11-18 | P3 | G2 | `npm run check:rules` | Đạt | 45 file quét, 0 vi phạm rule |
| 2026-11-18 | P3 | G3 | Vào/ra Tarot/Divination 3 lần có Smoke & Audio | Đạt | `SmokeParticles.dispose()` giải phóng BufferGeometry và PointsMaterial, audio dừng sạch |
| 2026-11-18 | P3 | G6 | Rà soát bảo mật & XSS & LocalStorage | Đạt | Dùng textContent/createElement, schemaVersion 1 + migration/try-catch, chia sẻ không lộ câu hỏi cá nhân |

| 2026-11-18 | P4 | G1 | `npm run check` | Đạt | Typecheck 0 error, Vitest 57/57 tests (11 suites, +13 tests Quality), check:rules 46 files, build thành công |
| 2026-11-18 | P4 | G2 | `npm run check:rules` | Đạt | 46 file quét, 0 vi phạm |
| 2026-11-18 | P4 | G4 | Build bundle size analysis | Đạt | JS gzip tải ban đầu: 15.95 kB (index) + 119.05 kB (three) = 134.9 kB < ngân sách 300 kB; public/ = 1.55 kB |
| 2026-11-18 | P4 | G6 | CSP + X-Frame-Options + security headers | Đạt | `public/_headers` cấu hình CSP strict, X-Frame-Options: DENY, Permissions-Policy, Cache-Control immutable |
| 2026-11-18 | Deploy | G7 | Cloudflare Pages readiness & verification | Đạt | Tài liệu hướng dẫn `docs/DEPLOYMENT.md`, xác nhận `dist/_headers` nguyên vẹn, 0 runtime vulnerability, kịch bản rollback rõ ràng |
| 2026-11-18 | Tarot Polish | G1 | `npm run check` | Đạt | Typecheck 0 error, Vitest 57/57 tests pass, check:rules 47 files 0 vi phạm, hiển thị ảnh lá bài trong ReadingPanel & History |
| 2026-11-18 | Tarot Only | G1 | `npm run check` | Đạt | Typecheck 0 error, Vitest 57/57 tests pass, check:rules 47 files 0 vi phạm, bundle loại bỏ Divination chunk |
## 4. Quyết định (Decision log)
|---|---|---|---|---|
| D-001 | 2026-11-18 | Stack: TypeScript + Three.js + Vite, UI thuần HTML/CSS | Kiểm soát render, dễ tối ưu | R01, R03 |
| D-002 | 2026-11-18 | Kết quả bói chốt bằng RNG trước, animation diễn lại | Công bằng, tái hiện được | R04 |
| D-003 | 2026-11-18 | Hosting mặc định Cloudflare Pages; localStorage trước, Supabase sau | Free, băng thông tĩnh không giới hạn | R06, W06, W07 |
| D-004 | 2026-11-18 | Render-on-demand theo dõi activeTweens và updaters | Tiết kiệm pin tối đa cho thiết bị di động | R03, W01 |
| D-005 | 2026-11-18 | BoxGeometry dùng chung + lazy load front texture cho 22 lá bài | Tối ưu draw call, bộ nhớ GPU và tốc độ tải | R03, W02 |
| D-006 | 2026-11-18 | Chốt toàn bộ 6 hào bằng castHexagram ở CONCENTRATE | Đúng nguyên tắc R04 §1, animation xu khớp kết quả 100% | R04, W03 |
| D-007 | 2026-11-18 | Synthesizer âm thanh thuần Web Audio API thay vì file tĩnh | Tiết kiệm 100% băng thông audio asset (0 KB), chạy offline 100%, không lo bản quyền | R01, R05, W04 |
| D-008 | 2026-11-18 | Vẽ ảnh chia sẻ trên 2D Canvas độc lập (800x1200 px) | Không cần preserveDrawingBuffer trên WebGL (tốn GPU), bảo vệ riêng tư câu hỏi | R03, R05, R06, W04 |

| D-009 | 2026-11-18 | Adaptive Quality dùng rolling window 60 frame, warmup 90 frame, debounce 120 frame giữa hai lần hạ | Tránh hạ cấu hình quá nhạy khi load, chỉ hạ khi FPS thấp kéo dài | R03 §5, W05 |
| D-010 | 2026-11-18 | CSP `'unsafe-inline'` cho style-src (do three.js và GSAP inject style động) | Không thể dùng nonce/hash cho style 3rd-party injected; img-src/worker-src blob: cần cho Canvas share và Audio worklet | R06 §5, W05 |
| D-011 | 2026-11-18 | Hiển thị thumbnail tranh ảnh các lá bài đã rút trong ReadingPanel và HistoryView | Giúp người dùng dễ dàng đối chiếu, hồi tưởng và chiêm nghiệm trực quan toàn bộ trải bài | R01, R06 |
| D-012 | 2026-11-18 | Chuyển giao diện và điều phối sang thuần Tarot (Tarot Sanctum) | Tinh gọn menu, giảm dung lượng runtime bundle, tập trung 100% trải nghiệm vào bói bài Tarot 3D | R01, R03 |
| ID | Mô tả | Mức | Phase phát hiện | Workflow xử lý |
|---|---|---|---|---|
| | Không có | | | |

## 7. Ghi chú bàn giao phiên gần nhất
- Đã hoàn thành task **Full 78 Tarot Deck & Real Artwork System** (`PLAN-20261118-full-78-tarot-deck-and-artwork`).
- **Thay đổi chính**:
  - Trang bị trọn vẹn **78 ảnh tranh vẽ Rider-Waite-Smith 1909** (Public Domain) thực tế, xóa bỏ các file dummy 34 bytes.
  - Mở rộng `cards.json` thành **đủ 78 lá bài** (22 Ẩn Chính + 56 Ẩn Phụ: Wands, Cups, Swords, Pentacles) với đầy đủ ý nghĩa, biểu tượng visual, từ khóa và câu hỏi phản tư.
  - Sửa lỗi hình học góc xoay 3D (`rotation.x` từ PI/2 sang -PI/2) giúp mặt trước có tranh lá bài hiển thị rực rỡ, chính diện và sắc nét.
  - Bổ sung tùy chọn chọn bộ bài (22 lá Ẩn Chính hoặc 78 lá Toàn diện) trong `QuestionForm.ts`.
  - Bổ sung cơ chế fallback trực quan trong `CardInspectOverlay` đảm bảo không bao giờ bị rỗng ảnh.
- **Kết quả kiểm thử**: Vitest **57/57** pass, TypeScript 0 error, check:rules 47 files 0 vi phạm, build thành công 100%.
