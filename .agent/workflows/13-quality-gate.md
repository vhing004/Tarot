---
id: W13
name: quality-gate
description: Chạy tuần tự các gate liên quan trước khi đóng phase/việc; lập báo cáo; cập nhật state.
requires: [workflow vừa làm xong các bước]
rules: [R00, R07, R08]
next: W14
---
# W13: Cổng chất lượng (đóng phase / đóng việc)

## Mục tiêu
Xác nhận bằng bằng chứng rằng một phase hoặc một việc thật sự xong. Đây là **cửa duy nhất** để đánh dấu `[x]`.

## Entry gate
Workflow đang làm đã xong mọi bước và tự rà bảng [R07 §4](../rules/R07-quality-gates.md).

## Các bước (chạy theo thứ tự; dừng ở gate đầu tiên đỏ, sửa rồi chạy lại từ đó)
1. **G1** `npm run check`, rồi `npm run dev` kiểm console sạch.
2. **G2** `npm run check:rules` (đã nằm trong `check`; đọc kỹ báo cáo).
3. **G3** (nếu phase có 3D/mode): vào/ra 3 lần, ghi bốn con số bộ nhớ trước/sau.
4. **G4** (nếu P4 hoặc thay đổi có thể ảnh hưởng hiệu năng): đo theo [R03 §1](../rules/R03-performance.md).
5. **G5** (nếu đụng dữ liệu/asset): test dữ liệu + `SOURCES.md`.
6. **G6** (nếu đụng lưu trữ, mạng, UI chữ động, secret): `npm audit` + rà thủ công + (P5) thử RLS.
7. **G7** (chỉ khi deploy): theo [W06](06-deploy-cloudflare.md).
8. Chạy **checklist thủ công** của mode liên quan ([R07 §5](../rules/R07-quality-gates.md)).
9. **Lập báo cáo** theo [templates/phase-report.md](../templates/phase-report.md): gate đã qua, số đo, lỗi tồn đọng, rủi ro, việc tiếp theo.

## Exit gate
Tất cả gate bắt buộc của workflow (xem bảng phase trong PROJECT_STATE) đều đạt **và có bằng chứng**.
- Nếu còn gate đỏ: **không** đánh dấu `[x]`, không tag, không merge `main`; ghi nguyên nhân vào "Lỗi tồn đọng" và quay lại workflow gây ra.

## Cập nhật state
1. Ghi từng gate vào "Nhật ký gate" (ngày, gate, lệnh/cách đo, kết quả).
2. Đánh dấu phase `[x]` trong bảng phase.
3. Merge nhánh vào `main` theo [R08](../rules/R08-git-release.md), tạo tag theo bảng phase.
4. Đặt "Phase hiện tại" và "Nhánh git" cho phase kế tiếp.

## Tiếp theo
[W14](14-end-session.md).
