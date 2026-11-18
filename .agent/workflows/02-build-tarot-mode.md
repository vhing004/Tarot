---
id: W02
name: build-tarot-mode
phase: P1
description: Tarot MVP: 22 lá Ẩn Chính, xáo, trải 1/3 lá, lật 3D, lời giải, lưu lịch sử.
requires: [W01, P0 hoàn thành]
rules: [R00, R01, R02, R03, R04, R05, R06, R07]
next: W03
---
# W02: Chế độ Tarot (P1)

## Mục tiêu
Chơi trọn một lượt Tarot: nhập câu hỏi → xáo → trải → chọn → lật → đọc lời giải → lưu.

## Entry gate
P0 `[x]` trong [PROJECT_STATE](../PROJECT_STATE.md) (G0, G1, G2 đã đạt). Nhánh `phase/p1-tarot`.

## Rule áp dụng
[R01](../rules/R01-architecture.md), [R03](../rules/R03-performance.md), [R04 §3, §6](../rules/R04-fairness-divination.md), [R05](../rules/R05-content-safety.md), [R06](../rules/R06-security.md).

## Các bước (tuần tự; mỗi bước commit + `npm run check`)
### 1. Dữ liệu (theo [W12](12-add-content-data.md))
- `modes/tarot/data/cards.json`: 22 lá Ẩn Chính, trường: `id (0..21), name, nameVi, image, keywords[], upright, reversed` (khớp `TarotCard`).
- Ảnh `public/textures/tarot/NN-<slug>.webp` (512x880) + `back.webp`. Ghi nguồn vào `data/SOURCES.md` ([R05 §1](../rules/R05-content-safety.md)).
- Test `data.test.ts`: id duy nhất 0..21, chuỗi không rỗng, file ảnh tồn tại (`fs.existsSync`).

### 2. Logic thuần (`modes/tarot/logic/`)
- `deck.ts`: `drawCards(deck, n, rng)` theo [R04 §3](../rules/R04-fairness-divination.md).
- `spreads.ts`: `SPREADS = { single: ['present'], three: ['past','present','future'] }` (có kiểu).
- `interpret.ts`: ghép lời giải từ lá + vị trí + xuôi/ngược + chủ đề (`Topic`); thuần, trả chuỗi theo `t()` key hoặc đoạn có cấu trúc.
- `sensitive.ts` (hoặc ở `shared/`): `isSensitiveQuestion(text)` ([R05 §4](../rules/R05-content-safety.md)).
- Test: không lặp lá, đủ n lá, `reversed` phân bố hợp lý với RNG giả, vị trí đúng, ghép lời giải đủ trường, nhạy cảm bắt đúng/không bắt nhầm.

### 3. View (`modes/tarot/view/`)
- `Card.ts`: dùng **chung** một `BoxGeometry` mỏng và một material mặt sau; material mặt trước tạo khi cần; `flip(toReversed)` bằng GSAP, gọi `engine.trackTween`.
- `DeckView.ts`: chồng bài, animation xáo, xòe quạt, vị trí chọn.
- Texture mặt trước tải khi rút bài; thất bại thì dùng placeholder ([R02 §3](../rules/R02-code-style.md)).

### 4. TarotMode + FSM
`INTRO → SHUFFLE → SPREAD → PICK → REVEAL → READING → SAVE` ([R01 §6](../rules/R01-architecture.md)).
- Khi vào `SHUFFLE` gọi `drawCards` **một lần** và giữ `result`; các state sau chỉ diễn `result` ([R04 §1](../rules/R04-fairness-divination.md)).
- "Chọn lá" = chọn vị trí trong bộ đã xáo ([R04 §3](../rules/R04-fairness-divination.md)).
- Có nút bỏ qua animation.
- `exit()` hủy tween/listener; `dispose()` giải phóng.

### 5. UI
- `ui/QuestionForm.ts`: nhập câu hỏi (giới hạn độ dài), chọn chủ đề, chọn trải 1/3 lá; câu hỏi nhạy cảm → thông điệp hỗ trợ, không bói.
- `ui/ReadingPanel.ts`: tên lá, từ khóa, nghĩa theo vị trí, tổng hợp, disclaimer ([R05 §2](../rules/R05-content-safety.md)); mobile dùng bottom sheet; mọi chữ động qua `textContent`.

### 6. Lưu
State `SAVE`: tạo `Reading` (`mode: 'tarot'`) và `repo.save`. Lỗi lưu → thông báo, không crash.

### 7. Kiểm tra
- `npm run check`.
- Checklist thủ công Tarot ([R07 §5](../rules/R07-quality-gates.md)) trên desktop + mobile giả lập.
- **G3**: vào/ra Tarot 3 lần, ghi `geometries/textures` trước/sau.
- **G5**: test dữ liệu + `SOURCES.md` đủ.

## Exit gate
**G1, G2, G3, G5** đạt, kèm bằng chứng. Không lỗi console. Ngoài ra:
- [ ] Rút 1 lá và 3 lá, xuôi/ngược hiển thị đúng với `result`.
- [ ] Lịch sử lưu được (kiểm trong devtools Application → localStorage).
- [ ] Chunk `tarot` tách riêng.

## Cập nhật state
P1 `[x]`, tag `v0.1.0`, ghi số đo vào nhật ký gate, đặt "Phase hiện tại" = P2, `CONTENT_STATUS` vẫn `sample`.

## Tiếp theo
[W13](13-quality-gate.md) → [W14](14-end-session.md); phiên sau W00 → [W03](03-build-divination-mode.md).
