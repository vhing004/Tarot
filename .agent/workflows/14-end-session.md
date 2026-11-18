---
id: W14
name: end-session
description: Kết thúc phiên: cập nhật state, commit, ghi bàn giao để phiên sau bắt đầu trơn tru.
requires: [W13 nếu đóng phase, hoặc dừng giữa chừng]
rules: [R00, R08]
next: W00 (phiên sau)
---
# W14: Kết thúc phiên

## Mục tiêu
Phiên sau (của bạn hoặc agent khác) bắt đầu chỉ bằng việc đọc PROJECT_STATE, không mất ngữ cảnh.

## Entry gate
Không bắt buộc (có thể dừng giữa chừng), nhưng **không được** để cây làm việc ở trạng thái build hỏng mà không ghi chú.

## Các bước
1. **Chốt code**: `npm run check`. Nếu đỏ và chưa sửa kịp: commit vào nhánh làm việc với tiền tố `wip(...)`, **không** merge `main`, và ghi rõ trong bàn giao.
2. **Commit** theo [R08](../rules/R08-git-release.md); đẩy nhánh lên remote.
3. **Cập nhật [PROJECT_STATE](../PROJECT_STATE.md)**:
   - Mục 1: phase, workflow đang chạy, nhánh, "Việc tiếp theo (1 dòng)".
   - Mục 2: chỉ đánh `[x]` nếu đã qua W13.
   - Mục 3-5: nhật ký gate, quyết định mới, lỗi tồn đọng.
   - Mục 6 **Ghi chú bàn giao** (bắt buộc), gồm:
     - Đã làm (2-5 dòng, theo bước của workflow).
     - Đang dở (file nào, trạng thái nào, vì sao dừng).
     - Bước kế tiếp cụ thể (đúng số bước trong workflow).
     - Lệnh để chạy lại và chạy test.
     - Rủi ro/điều cần hỏi người dùng.
4. **Tóm tắt cho người dùng** (≤10 dòng): xong gì, đang dở gì, cần người dùng quyết định gì.

## Exit gate
- [ ] PROJECT_STATE đã cập nhật, mục 6 đầy đủ.
- [ ] Mọi thay đổi đã commit và đẩy lên (hoặc nêu rõ vì sao chưa).
- [ ] Không có secret/file nháp trong commit.

## Tiếp theo
Phiên sau: [W00](00-start-session.md).
