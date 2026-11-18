---
id: W03
name: build-divination-mode
phase: P2
description: Gieo quẻ MVP: 3 xu x 6 lần, dựng quẻ chủ/biến, tra 64 quẻ (mẫu ~8), animation đúng kết quả.
requires: [W02, P1 hoàn thành]
rules: [R00, R01, R03, R04, R05, R06, R07]
next: W04
---
# W03: Chế độ Gieo quẻ (P2)

## Mục tiêu
Chơi trọn một lượt gieo quẻ, kết quả **đúng tuyệt đối** theo thuật toán và animation khớp kết quả.

## Entry gate
P1 `[x]` (G1, G2, G3, G5). Nhánh `phase/p2-divination`.

## Rule áp dụng
[R04](../rules/R04-fairness-divination.md) (trọng tâm), [R01](../rules/R01-architecture.md), [R03](../rules/R03-performance.md), [R05](../rules/R05-content-safety.md).

## Các bước (tuần tự)
### 1. Logic thuần TRƯỚC (làm test-first)
- Viết `__tests__/hexagram.test.ts` với **toàn bộ test vector** ở [R04 §5](../rules/R04-fairness-divination.md) (chạy đỏ trước).
- `logic/hexagram.ts`: `throwCoins`, `castHexagram`, `buildKeys` (theo [R04 §4](../rules/R04-fairness-divination.md)). Chạy test đến khi xanh.
- `logic/lookup.ts`: `lookupHexagram(key)` từ JSON, ném lỗi rõ nếu key không có.
- `logic/interpret.ts`: ghép quẻ chủ + lời các hào động + quẻ biến.
- **Không** viết view khi test logic chưa xanh.

### 2. Dữ liệu
- `modes/divination/data/hexagrams.json` khóa bằng chuỗi 6 bit; **mẫu ~8 quẻ** gồm bắt buộc `111111`, `000000`, `100010`, `010001`, `011111` (để khớp test vector) + 3 quẻ khác. Lời quẻ viết lại bằng lời của dự án ([R05 §1](../rules/R05-content-safety.md)).
- `CONTENT_STATUS` giữ `sample`: lượt gieo ra key chưa có dữ liệu mẫu phải hiện thông báo thân thiện ("nội dung quẻ này đang cập nhật") **và vẫn hiện hình quẻ**, không crash.
- Test dữ liệu: key hợp lệ `/^[01]{6}$/`, không trùng, `lines.length === 6`, có `SOURCES.md`.

### 3. View
- `Coin.ts`: `CylinderGeometry` dẹt dùng chung geometry/material cho 3 xu; hàm `animateCoin(mesh, faceUp, delay)` theo [R04 §6](../rules/R04-fairness-divination.md) (số vòng xoay nguyên + 0/π), gọi `engine.trackTween`.
- `HexagramView.ts`: vẽ 6 hào từ **dưới lên** (nét liền = dương, nét đứt = âm), đánh dấu hào động (ký hiệu/phát sáng nhẹ), animation biến hào ở bước `CHANGE`.

### 4. DivinationMode + FSM
`INTRO → CONCENTRATE → THROW(x6) → BUILD → CHANGE → READING → SAVE`.
- Vào `CONCENTRATE`: chốt **toàn bộ** 6 lần gieo bằng `castHexagram(cryptoRandom)` **một lần**, lưu `lines`. `THROW` thứ i chỉ diễn `lines[i]`.
- `CONCENTRATE`: giữ nút nạp (thanh năng lượng) chỉ là hiệu ứng, **không** ảnh hưởng kết quả.
- `CHANGE` bỏ qua nếu `changedKey === null`.
- Nút bỏ qua animation nhảy thẳng tới `READING` với cùng `result`.
- `exit()`/`dispose()` đầy đủ.

### 5. UI
Dùng lại `QuestionForm` (ẩn lựa chọn trải bài), `ReadingPanel` mở rộng hiển thị: tên quẻ chủ, lời quẻ, hào động (hào số mấy + lời), quẻ biến. Disclaimer, `textContent`.

### 6. Lưu
`Reading` (`mode: 'divination'`, `result: DivinationResult` gồm `lines`, `primaryKey`, `changedKey`, `movingLines`).

### 7. Kiểm tra
- `npm run test`: toàn bộ test vector xanh.
- Kiểm tay: bật `?seed=` (chỉ dev, [R04 §7](../rules/R04-fairness-divination.md)) với dãy xu biết trước, so hình quẻ và tên quẻ với kỳ vọng.
- Mỗi lần gieo, xu dừng **đúng mặt** như `lines[i].coins` (quay video/xem từng lần, ghi 6 kết quả đối chiếu).
- **G3** (vào/ra 3 lần) và checklist quẻ ([R07 §5](../rules/R07-quality-gates.md)).

## Exit gate
**G1, G2, G3, G5** đạt. Thêm:
- [ ] Test vector R04 §5 100% xanh.
- [ ] 20 lượt ngẫu nhiên: hào đúng thứ tự dưới-lên, hào động chỉ ở sum 6/9, quẻ biến khớp quy tắc.
- [ ] Chunk `divination` tách riêng; không có import chéo với `tarot` (G2).

## Cập nhật state
P2 `[x]`, tag `v0.2.0`, đặt "Phase hiện tại" = P3. Ghi số đo vào nhật ký gate.

## Tiếp theo
[W13](13-quality-gate.md) → [W14](14-end-session.md); phiên sau W00 → [W04](04-polish-history-audio.md).
