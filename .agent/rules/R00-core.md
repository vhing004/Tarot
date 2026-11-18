---
id: R00
name: core
trigger: always_on
description: Nguyên tắc nền, thứ tự ưu tiên rule, khi nào phải dừng hỏi, định nghĩa "xong".
---
# R00: Nguyên tắc nền

## 1. Giao tiếp
- Trả lời bằng **tiếng Việt**; identifier, tên file, commit message bằng tiếng Anh.
- Giọng kỹ thuật, trực tiếp, không rào đón. Ưu tiên: kế hoạch ngắn → file đầy đủ → lệnh chạy → cách kiểm.
- Khi sửa/tạo file: đưa **toàn bộ nội dung file** (không viết "giữ nguyên phần còn lại", không `...`).

## 2. Quy trình bắt buộc
1. Đầu phiên chạy [W00](../workflows/00-start-session.md): đọc [PROJECT_STATE](../PROJECT_STATE.md), xác định phase.
2. Chỉ làm việc thuộc workflow của phase hiện tại (hoặc W10/W11/W12 khi phù hợp). **Không nhảy phase.**
3. Trước khi code: nêu kế hoạch file sẽ tạo/sửa (≤10 dòng) và rule liên quan (theo ID).
4. Sau khi code: chạy gate của workflow ([R07](R07-quality-gates.md)), ghi kết quả vào PROJECT_STATE.
5. Cuối phiên chạy [W14](../workflows/14-end-session.md).

## 3. Thứ tự ưu tiên khi các rule xung đột (cao → thấp)
1. [R06 Security](R06-security.md) và [R05 Content-safety](R05-content-safety.md)
2. [R04 Fairness](R04-fairness-divination.md)
3. [R01 Architecture](R01-architecture.md)
4. [R03 Performance](R03-performance.md)
5. [R02 Code-style](R02-code-style.md)
6. Yêu cầu tạm thời của người dùng trong phiên **chỉ thắng** từ mức 4 trở xuống. Nếu yêu cầu trái mức 1-3: nêu rõ rủi ro, đề xuất cách thay thế, KHÔNG tự ý vi phạm.

## 4. Phải DỪNG và hỏi khi
- Yêu cầu cần thêm dependency ngoài allowlist (§5).
- Yêu cầu làm phase sau khi phase trước chưa qua gate.
- Phát hiện mâu thuẫn giữa rule và yêu cầu, hoặc giữa hai rule.
- Cần dùng nội dung/ảnh/văn bản chưa rõ giấy phép ([R05](R05-content-safety.md)).
- Thay đổi làm đổi kiểu dữ liệu đã lưu của người dùng (cần migration, xem [R06 §3](R06-security.md)).
- Thao tác phá hủy (xóa nhánh, force push, xóa dữ liệu).

Khi dừng: nêu vấn đề, 2-3 lựa chọn, khuyến nghị 1 lựa chọn; nếu người dùng chưa trả lời thì chưa làm phần bị chặn, tiếp tục các phần không bị chặn.

## 5. Allowlist dependency
| Loại | Gói | Từ phase |
|---|---|---|
| runtime | `three`, `gsap` | P0 |
| dev | `typescript`, `vite`, `vitest`, `@types/three` | P0 |
| dev (tùy chọn) | `vite-plugin-compression` | P4 |
| công cụ chạy bằng npx | `@gltf-transform/cli`, `sharp-cli` (hoặc công cụ tương đương để chuyển WebP) | P4 |
| runtime | `@supabase/supabase-js` | P5 |
Mọi gói khác: dừng và hỏi. Không dùng React/R3F/Babylon, không thư viện vật lý ở MVP.

## 6. Định nghĩa "XONG" (Definition of Done)
Một việc chỉ được coi là xong khi **tất cả** đúng:
- [ ] Code chạy được (`npm run dev` không lỗi console).
- [ ] `npm run check` pass (typecheck + test + rule-check + build), xem [R07 G1, G2](R07-quality-gates.md).
- [ ] Gate riêng của workflow đã qua và có bằng chứng.
- [ ] Không vi phạm rule nào (tự rà theo bảng ở [R07 §4](R07-quality-gates.md)).
- [ ] PROJECT_STATE đã cập nhật.
- [ ] Đã commit theo [R08](R08-git-release.md).

## 7. Trung thực về kết quả
- Không nói "đã chạy/đã test" nếu chưa chạy. Nếu không chạy được lệnh (môi trường hạn chế), nói rõ và đưa lệnh để người dùng chạy.
- Không bịa số liệu hiệu năng. Số liệu phải kèm cách đo.
- Không đánh dấu `[x]` cho gate chưa qua.
