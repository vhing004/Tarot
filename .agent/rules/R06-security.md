---
id: R06
name: security
trigger: always_on
description: Secret, XSS, localStorage an toàn, Supabase RLS, AI proxy, header, phụ thuộc.
---
# R06: Bảo mật

## 1. Secret
- Không commit `.env*` (trừ `.env.example` không chứa giá trị thật). Kiểm bởi `check-rules` + [G6](R07-quality-gates.md).
- Frontend chỉ có biến `VITE_*` công khai: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Cấm** `service_role` key, khóa API AI, token deploy ở frontend, trong repo, hoặc trong log. Lỡ commit = coi như lộ: thu hồi/đổi khóa ngay, báo người dùng, không chỉ xóa file.

## 2. XSS
- **Cấm** `innerHTML`, `insertAdjacentHTML`, `dangerouslySetInnerHTML` với dữ liệu động (kiểm bởi `check-rules`).
- Hiển thị chữ do người dùng nhập (câu hỏi), nội dung JSON, lời AI bằng `textContent` hoặc tạo node qua `createElement`.
- Ngoại lệ HTML tĩnh do chính dự án viết: `// allow:R06-xss <lý do>`, và không chứa biến.

## 3. localStorage
- Mọi đọc `localStorage` bọc `try/catch` (có thể bị chặn/đầy) và `JSON.parse` + **kiểm kiểu** (`unknown` → type guard).
- Dữ liệu lưu có `schemaVersion`. Đổi cấu trúc = viết migration (hàm thuần có test) trước khi đổi; dữ liệu hỏng thì bỏ qua bản ghi đó, không làm crash.
- Giới hạn số bản ghi (~100) và dung lượng; xử lý `QuotaExceededError`.

## 4. Supabase (P5)
- Bật **RLS** trên mọi bảng; policy theo `auth.uid() = user_id` (select/insert/delete). Không tạo bảng mà chưa có policy.
- Anon key công khai là chấp nhận được **chỉ khi** RLS đúng. Kiểm bằng cách thử truy cập dữ liệu người khác (phải bị từ chối).
- Bảo vệ khỏi project free bị pause: không phụ thuộc DB để chơi game; lỗi mạng/DB → rơi về `LocalRepository`.

## 5. Header & CSP (Cloudflare Pages `public/_headers`)
Mẫu ở [templates/_headers](../templates/_headers): `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, cache immutable cho asset có hash.
CSP là tùy chọn, thêm ở P4 và thử trên preview trước (lưu ý: Draco/worker cần `worker-src blob:`, WASM có thể cần `'wasm-unsafe-eval'`).

## 6. AI diễn giải (P5)
- Chỉ gọi qua **function trung gian** (Cloudflare Pages Functions/Workers hoặc Supabase Edge Functions); khóa nằm ở biến môi trường phía server.
- Giới hạn: số lượt/người/ngày, độ dài câu hỏi, timeout; trả lỗi thân thiện khi hết hạn mức.
- Lọc câu hỏi nhạy cảm **trước** khi gọi ([R05 §4](R05-content-safety.md)). Prompt hệ thống cố định ở server (không cho client ghi đè).
- Coi phản hồi AI là **không tin cậy**: hiển thị bằng `textContent`, cắt độ dài, không thực thi.
- Cache theo `Reading.id`; không gửi thông tin định danh.

## 7. Phụ thuộc
- Chỉ dùng allowlist ([R00 §5](R00-core.md)); ghim phiên bản bằng lockfile, commit `package-lock.json`.
- Chạy `npm audit` trước release; lỗ hổng mức high/critical ở dependency runtime phải xử lý hoặc ghi quyết định.
- Cài phiên bản đã phát hành ổn định; tránh bản vừa ra trong vài ngày.

## 8. Quyền riêng tư
Không thu thập định danh, không cookie theo dõi. Nếu thêm analytics: phải ẩn danh, không gồm nội dung câu hỏi, và ghi quyết định vào PROJECT_STATE.
