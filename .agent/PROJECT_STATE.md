# PROJECT_STATE: Fortune-Hunter

> Nguồn sự thật về tiến độ. Agent ĐỌC file này đầu phiên (W00) và CẬP NHẬT cuối phiên (W14).
> Chỉ đổi `[ ]` thành `[x]` khi đã qua gate tương ứng (định nghĩa ở [R07](rules/R07-quality-gates.md)) và có bằng chứng (lệnh + kết quả) ghi ở "Nhật ký gate".

## 1. Trạng thái hiện tại
- **Phase hiện tại**: P4 (sẵn sàng khởi động)
- **Workflow đang chạy**: W05 (Tối ưu hiệu năng, Adaptive Quality & Chuẩn bị Cloudflare Pages)
- **Nhánh git**: `phase/p3-polish` (sắp merge vào `main`)
- **Việc tiếp theo (1 dòng)**: Bắt đầu W05: Đo đạc FPS và memory thực tế, triển khai Adaptive Quality hoàn chỉnh và chuẩn bị cấu hình deploy.
- **CONTENT_STATUS**: `sample` (22 lá Ẩn Chính / ~8 quẻ mẫu). Đổi thành `full` chỉ khi đủ dữ liệu (xem W12).

## 2. Bảng phase
| Phase | Workflow | Nội dung | Hoàn thành | Gate đã qua | Tag |
|---|---|---|---|---|---|
| P0 | [W01](workflows/01-init-project.md) | Khung dự án, Engine, Menu, repo | [x] | G0 G1 G2 G3 | `v0.0.1` |
| P1 | [W02](workflows/02-build-tarot-mode.md) | Tarot MVP (22 lá) | [x] | G1 G2 G3 G5 | `v0.1.0` |
| P2 | [W03](workflows/03-build-divination-mode.md) | Gieo quẻ MVP | [x] | G1 G2 G3 G5 | `v0.2.0` |
| P3 | [W04](workflows/04-polish-history-audio.md) | Lịch sử, chia sẻ, âm thanh, hiệu ứng | [x] | G1 G2 G3 G6 | `v0.3.0` |
| P4 | [W05](workflows/05-optimize-performance.md) | Tối ưu hiệu năng | [ ] | G1 G3 G4 | `v0.4.0` |
| Deploy | [W06](workflows/06-deploy-cloudflare.md) | Cloudflare Pages | [ ] | G7 | `v1.0.0` |
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

## 4. Quyết định (Decision log)
| ID | Ngày | Quyết định | Lý do | Ảnh hưởng rule/workflow |
|---|---|---|---|---|
| D-001 | 2026-11-18 | Stack: TypeScript + Three.js + Vite, UI thuần HTML/CSS | Kiểm soát render, dễ tối ưu | R01, R03 |
| D-002 | 2026-11-18 | Kết quả bói chốt bằng RNG trước, animation diễn lại | Công bằng, tái hiện được | R04 |
| D-003 | 2026-11-18 | Hosting mặc định Cloudflare Pages; localStorage trước, Supabase sau | Free, băng thông tĩnh không giới hạn | R06, W06, W07 |
| D-004 | 2026-11-18 | Render-on-demand theo dõi activeTweens và updaters | Tiết kiệm pin tối đa cho thiết bị di động | R03, W01 |
| D-005 | 2026-11-18 | BoxGeometry dùng chung + lazy load front texture cho 22 lá bài | Tối ưu draw call, bộ nhớ GPU và tốc độ tải | R03, W02 |
| D-006 | 2026-11-18 | Chốt toàn bộ 6 hào bằng castHexagram ở CONCENTRATE | Đúng nguyên tắc R04 §1, animation xu khớp kết quả 100% | R04, W03 |
| D-007 | 2026-11-18 | Synthesizer âm thanh thuần Web Audio API thay vì file tĩnh | Tiết kiệm 100% băng thông audio asset (0 KB), chạy offline 100%, không lo bản quyền | R01, R05, W04 |
| D-008 | 2026-11-18 | Vẽ ảnh chia sẻ trên 2D Canvas độc lập (800x1200 px) | Không cần preserveDrawingBuffer trên WebGL (tốn GPU), bảo vệ riêng tư câu hỏi | R03, R05, R06, W04 |

## 5. Lỗi tồn đọng / nợ kỹ thuật
| ID | Mô tả | Mức | Phase phát hiện | Workflow xử lý |
|---|---|---|---|---|
| | Không có | | | |

## 6. Ghi chú bàn giao phiên gần nhất
- Đã hoàn thành toàn bộ Phase P3 (W04): Lịch sử bói toán, Âm thanh Web Audio API, Hiệu ứng Khói trầm hương 3D và Tạo ảnh chia sẻ kết quả.
- Đầy đủ trải nghiệm âm thanh tương tác: Drone thiền định nền, tiếng xáo bài, tiếng lật bài, tiếng xu rơi vang vọng kim loại, chuông ngân kết quả.
- Giao diện Lịch sử cho phép xem lại các quẻ bói trong quá khứ, xóa từng quẻ hoặc xóa tất cả.
- Bước kế tiếp: Chuyển sang Phase P4 (W05) để thực hiện tối ưu hiệu năng chuyên sâu và chuẩn bị deploy Cloudflare Pages.
