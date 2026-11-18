---
id: R07
name: quality-gates
trigger: always_on
description: Định nghĩa cổng kiểm G0-G7, lệnh kiểm, tiêu chí đạt, bảng rà soát rule.
---
# R07: Cổng chất lượng (Quality Gates)

Gate = điều kiện **đo được**. Workflow nào cũng nêu rõ gate vào/ra. Kết quả ghi ở "Nhật ký gate" trong [PROJECT_STATE](../PROJECT_STATE.md). Chạy tổng bằng [W13](../workflows/13-quality-gate.md).

## 1. Lệnh chuẩn (thêm vào `package.json` ở W01, xem [templates/package-scripts.json](../templates/package-scripts.json))
| Lệnh | Việc |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | `vitest run` |
| `npm run check:rules` | `node scripts/check-rules.mjs` (R01/R02/R04/R06 tự động) |
| `npm run build` | `tsc --noEmit && vite build` |
| `npm run check` | typecheck + test + check:rules + build |

## 2. Định nghĩa gate
| Gate | Tên | Điều kiện đạt | Cách kiểm |
|---|---|---|---|
| **G0** | Session-ready | Đã đọc PROJECT_STATE; working tree sạch hoặc đã hiểu thay đổi; `npm ci`/`npm install` xong; đúng nhánh phase | W00 |
| **G1** | Code-health | `npm run check` pass, không cảnh báo TypeScript, không lỗi console khi `npm run dev` | lệnh |
| **G2** | Rules-clean | `npm run check:rules` = 0 vi phạm: vùng thuần không import `three`/`gsap`, không `Math.random` trong vùng thuần, không `innerHTML`, không `any`, không secret, `.env` trong `.gitignore`, mỗi `*Mode.ts` có `dispose(` | lệnh |
| **G3** | Lifecycle | Vào/ra mode 3 lần liên tiếp: `renderer.info.memory.geometries` và `.textures` quay về baseline (sai số 0 sau khi trừ tài nguyên cache của AssetLoader); không tween/listener còn sống (DevTools: không còn handler của mode) | thủ công + dev hook (§3) |
| **G4** | Performance | Đạt bảng ngân sách [R03 §1](R03-performance.md); có số đo trước/sau; render-on-demand: đứng yên ≥ 5 giây không render frame | DevTools Performance, `renderer.info`, `vite build` |
| **G5** | Content | Test dữ liệu pass (schema, không trùng, file ảnh tồn tại); mọi asset có dòng trong `SOURCES.md` với giấy phép hợp lệ; `CONTENT_STATUS` đúng thực tế | Vitest + rà `SOURCES.md` |
| **G6** | Security | Không secret trong repo/lịch sử commit mới; không `innerHTML` động; localStorage đọc an toàn; (P5) RLS đã thử truy cập chéo bị từ chối; `npm audit` không có high/critical ở runtime | `check:rules`, `npm audit`, thử thủ công |
| **G7** | Release | Build preview trên Cloudflare Pages chạy đúng; kiểm tra thủ công trên 1 desktop + 1 mobile; header/cache đúng; rollback biết cách | W06 |

## 3. Dev hook cho G3
Trong `Engine.ts`, chỉ ở dev:
```ts
if (import.meta.env.DEV) (window as unknown as { __fh: unknown }).__fh = { info: renderer.info };
```
Quy trình: mở console → ghi baseline `__fh.info.memory` ở menu → vào Tarot → thoát về menu → lặp 3 lần → so sánh `geometries`, `textures`. Ghi 4 con số (trước/sau) vào nhật ký gate.

## 4. Bảng tự rà rule (trước khi báo "xong")
| Rule | Câu hỏi tự rà |
|---|---|
| R01 | File mới đặt đúng vùng? Mode có đủ init/enter/update/exit/dispose? Có import chéo giữa hai mode? |
| R02 | Có `any`? Chuỗi hiển thị đã qua `t()`? Comment "vì sao" đã có ở chỗ khó? |
| R03 | Có `new Vector3` trong `update`? Có render khi đứng yên? Có dispose? |
| R04 | Kết quả chốt ở `logic` trước animation? RNG qua `RandomSource`? Hào dưới lên? |
| R05 | Asset mới có `SOURCES.md`? Giọng văn không khẳng định tuyệt đối? Có disclaimer? |
| R06 | Có secret? `textContent` thay `innerHTML`? localStorage có try/catch + kiểm kiểu? |
| R08 | Commit đúng quy ước? Tag khi qua gate? |

## 5. Gate thủ công cho từng mode (checklist)
**Tarot**: xáo → chọn 1 lá/3 lá → lật → lời giải khớp vị trí/xuôi-ngược → lưu → mở lịch sử thấy lượt vừa lưu → thoát → vào lại không lỗi → mobile chạm được.
**Quẻ**: giữ nút nạp → gieo 6 lần, mỗi lần xu dừng đúng mặt như kết quả → hào hiện đúng từ dưới lên → hào động có đánh dấu → quẻ chủ/biến đúng tên → lưu → thoát/vào lại.
