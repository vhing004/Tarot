---
id: W11
name: fix-bug
description: Quy trình sửa lỗi: tái hiện, test hồi quy trước, nguyên nhân gốc, sửa tối thiểu, kiểm gate.
requires: [W00, G0]
rules: [R00, R01, R03, R04, R06, R07, R08]
next: W13
---
# W11: Sửa lỗi

## Mục tiêu
Sửa đúng nguyên nhân gốc, có test chặn tái phát, không phá chỗ khác.

## Entry gate
G0. Có mô tả lỗi (dùng [templates/bug-report.md](../templates/bug-report.md)).

## Các bước
1. **Tái hiện**: ghi các bước, môi trường (trình duyệt, thiết bị), kết quả mong đợi vs thực tế. Không tái hiện được thì hỏi thêm thông tin, **không đoán rồi sửa**.
2. **Khoanh vùng**: lỗi ở vùng nào ([R01 §4](../rules/R01-architecture.md)): logic thuần, view, UI, lưu trữ, build?
3. **Test hồi quy trước** (nếu thuộc logic thuần): viết test đỏ tái hiện lỗi. Lỗi view/animation: viết checklist tái hiện thủ công rõ ràng.
4. **Tìm nguyên nhân gốc**: trả lời "vì sao" (không chỉ "ở đâu"). Ghi 1-2 câu vào bug report.
5. **Sửa tối thiểu**: đổi ít nhất có thể. Gặp lỗi liên quan [R04](../rules/R04-fairness-divination.md) (thứ tự hào, RNG, hào động) → thêm test vector vào bộ test bắt buộc.
6. **Kiểm**: test mới xanh; `npm run check`; G3 nếu đụng vòng đời; G4 nếu đụng render; G6 nếu đụng bảo mật/lưu trữ.
7. **Rà lỗi tương tự**: tìm các chỗ khác có cùng mẫu lỗi (grep), sửa hoặc ghi vào "Lỗi tồn đọng".
8. **Commit**: `fix(<scope>): <mô tả>` + nhắc test hồi quy ([R08 §2](../rules/R08-git-release.md)).

## Lỗi bảo mật / lộ secret
Ưu tiên cao nhất: thu hồi/đổi khóa, xóa khỏi repo **và** xử lý lịch sử, thông báo người dùng ([R06 §1](../rules/R06-security.md)). Sau đó mới viết test/bản vá.

## Exit gate
G1, G2 + test hồi quy xanh; lỗi không còn tái hiện bằng các bước ban đầu.

## Cập nhật state
Xóa/đóng mục trong "Lỗi tồn đọng"; ghi nguyên nhân gốc nếu có bài học đáng nhớ (thêm vào Quyết định nếu đổi rule).

## Tiếp theo
[W13](13-quality-gate.md) → [W14](14-end-session.md).
