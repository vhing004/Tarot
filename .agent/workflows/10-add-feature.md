---
id: W10
name: add-feature
description: Quy trình thêm tính năng ngoài kế hoạch phase: phân loại, mini-spec, kiểm rule, làm, kiểm gate.
requires: [W00, G0]
rules: [R00, R01, R02, R03, R04, R05, R06, R07, R08]
next: W13
---
# W10: Thêm tính năng

## Mục tiêu
Cho phép thay đổi có kiểm soát mà không phá kiến trúc, không nhảy phase bừa bãi.

## Entry gate
G0 ([W00](00-start-session.md)). Phase hiện tại không đang ở giữa gate dang dở.

## Các bước
1. **Phân loại**:
   - Thuộc phase hiện tại → làm trong workflow phase đó (không dùng W10).
   - Thuộc phase sau → ghi vào PROJECT_STATE "Việc tiếp theo/Ghi chú", **không làm bây giờ**.
   - Ngoài kế hoạch → tiếp tục W10.
2. **Mini-spec** (≤15 dòng, ghi vào PROJECT_STATE mục Quyết định, ID `D-xxx`): mục tiêu, người dùng nhận được gì, file/vùng bị ảnh hưởng, dữ liệu lưu mới (cần migration?), rủi ro hiệu năng/bảo mật/nội dung.
3. **Kiểm rule** bằng bảng [R07 §4](../rules/R07-quality-gates.md). Nếu cần dependency mới, đụng R04/R05/R06, hoặc đổi kiểu dữ liệu lưu → **dừng và hỏi** ([R00 §4](../rules/R00-core.md)).
4. **Thiết kế tối thiểu**: file mới đặt vùng nào ([R01 §4](../rules/R01-architecture.md)); logic thuần trước, view sau.
5. **Test-first cho logic thuần**; sau đó view/UI.
6. **Nhánh** `feat/<tên>`; commit nhỏ ([R08](../rules/R08-git-release.md)).
7. **Kiểm**: `npm run check`; nếu có 3D/animation → G3; nếu đụng asset → G5; nếu đụng lưu trữ/mạng → G6; nếu có thể ảnh hưởng FPS → đo G4 mục liên quan.
8. Cập nhật tài liệu: PROJECT_STATE (+ README nếu thêm workflow/rule mới).

## Exit gate
G1, G2 + gate phù hợp ở bước 7. Có bằng chứng trong nhật ký gate.

## Cập nhật state
Ghi quyết định `D-xxx` thành "đã triển khai", tag minor nếu người dùng thấy tính năng.

## Tiếp theo
[W13](13-quality-gate.md) → [W14](14-end-session.md).
