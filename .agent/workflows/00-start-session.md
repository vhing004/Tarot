---
id: W00
name: start-session
description: Bắt đầu MỌI phiên: đọc trạng thái, kiểm môi trường, chọn workflow, công bố kế hoạch.
requires: []
rules: [R00, R07]
next: workflow của phase hiện tại (xem PROJECT_STATE)
---
# W00: Bắt đầu phiên

## Mục tiêu
Đưa agent vào đúng ngữ cảnh, đúng phase, môi trường sạch, trước khi chạm vào code.

## Entry gate
Không có (đây là cổng đầu).

## Rule áp dụng
[R00](../rules/R00-core.md) (quy trình), [R07](../rules/R07-quality-gates.md) (G0).

## Các bước
1. **Đọc** [PROJECT_STATE](../PROJECT_STATE.md): phase hiện tại, workflow đang chạy, việc tiếp theo, lỗi tồn đọng, ghi chú bàn giao.
2. **Đọc** [README](../README.md) §4 để chọn workflow; nếu yêu cầu của người dùng không thuộc phase hiện tại → xử lý theo [R00 §4](../rules/R00-core.md) (dừng và hỏi) hoặc dùng W10/W11/W12.
3. **Kiểm môi trường** (nếu đã có code):
   - `git status` (cây làm việc sạch? đúng nhánh phase? nếu không, ghi nhận và hỏi trước khi ghi đè).
   - `node -v` (≥ 18) và `npm ci` (hoặc `npm install` nếu chưa có lockfile).
   - `npm run check`: nếu đỏ **trước khi làm gì**, ghi vào "Lỗi tồn đọng" và sửa bằng [W11](11-fix-bug.md) trước.
4. **Xác nhận phase**: nêu 1 câu: "Phase hiện tại là PN, workflow Wxx, bước tiếp theo là ...".
5. **Công bố kế hoạch phiên** (≤10 dòng): file sẽ tạo/sửa, rule liên quan (theo ID), gate sẽ chạy, rủi ro.
6. Chuyển sang workflow đã chọn.

## Exit gate: G0
- [ ] Đã đọc PROJECT_STATE.
- [ ] Đúng nhánh, hiểu rõ trạng thái git.
- [ ] `npm run check` xanh (hoặc lỗi đã được ghi nhận).
- [ ] Kế hoạch phiên đã công bố.

## Cập nhật state
Ghi G0 vào nhật ký gate (ngày, "đạt", ghi chú). Nếu phiên mới đổi nhánh thì cập nhật mục 1 của PROJECT_STATE.

## Tiếp theo
Workflow của phase hiện tại: W01 → W02 → W03 → W04 → W05 → W06 → W07 (xem bảng phase trong PROJECT_STATE).
