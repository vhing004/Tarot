---
id: W07
name: extend-supabase-ai-i18n
phase: P5
description: Mở rộng sau v1.0: đủ 78 lá/64 quẻ, Supabase, AI diễn giải, i18n, PWA. Mỗi mục độc lập.
requires: [W06, v1.0.0]
rules: [R00, R01, R04, R05, R06, R07, R08]
next: W13 sau mỗi mục
---
# W07: Mở rộng (P5)

Mỗi mục **độc lập**: một nhánh `feat/<mục>`, một gate riêng, một tag minor. Thứ tự khuyến nghị: 7A → 7B → 7C → 7D → 7E. Không làm hai mục cùng lúc.

## Entry gate chung
v1.0.0 đã phát hành (G7). `npm run check` xanh. Mục mới được ghi vào PROJECT_STATE trước khi làm.

---
## 7A. Đủ 78 lá Tarot & 64 quẻ
Dùng [W12](12-add-content-data.md). Mỗi lô ≤ 10 mục/commit.
**Exit**: G5; đổi `CONTENT_STATUS` thành `full` **chỉ khi** 78 lá + 64 quẻ đủ (test dữ liệu chuyển sang chế độ nghiêm ngặt). Tag `v1.1.0`.

## 7B. Supabase (tài khoản + đồng bộ lịch sử)
Rule: [R06 §4](../rules/R06-security.md).
1. Thêm `@supabase/supabase-js` (trong allowlist). `.env.example` thêm `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
2. SQL (chạy trong SQL Editor):
```sql
create table public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('tarot','divination')),
  question text,
  topic text,
  result jsonb not null,
  interpretation text,
  schema_version int not null default 1,
  created_at timestamptz not null default now()
);
alter table public.readings enable row level security;
create policy "own: select" on public.readings for select using (auth.uid() = user_id);
create policy "own: insert" on public.readings for insert with check (auth.uid() = user_id);
create policy "own: delete" on public.readings for delete using (auth.uid() = user_id);
create index on public.readings (user_id, created_at desc);
```
3. `services/repository.ts`: thêm `SupabaseRepository` (cùng interface `ReadingRepository`); chọn repo theo trạng thái đăng nhập; lỗi mạng/DB → rơi về `LocalRepository`.
4. UI: đăng nhập (email magic link hoặc OAuth), đăng xuất, "đồng bộ lịch sử cục bộ lên tài khoản" (hỏi xác nhận, không tự động đẩy).
5. Test thuần cho phần ánh xạ `Reading` ↔ bản ghi DB và migration.
**Exit**: G1, G2, G6 (thử truy cập dữ liệu của user khác phải bị từ chối; không `service_role` ở client). Lưu ý: project free có thể bị tạm dừng khi không hoạt động; game phải chơi được khi DB không phản hồi. Tag `v1.2.0`.

## 7C. AI diễn giải
Rule: [R06 §6](../rules/R06-security.md), [R05 §3-5](../rules/R05-content-safety.md).
1. Function trung gian (Cloudflare Pages Functions hoặc Supabase Edge Function); khóa API nằm ở biến môi trường **server**.
2. Prompt hệ thống cố định ở server: giọng nhẹ nhàng, không khẳng định tuyệt đối, không tư vấn y tế/pháp lý/tài chính, độ dài giới hạn.
3. Giới hạn lượt/người/ngày, timeout, xử lý lỗi hạn mức bằng thông điệp thân thiện; lọc câu hỏi nhạy cảm **trước** khi gọi.
4. Client `services/ai.ts` (thuần, `fetch` qua endpoint của mình); hiển thị bằng `textContent`; có nút bật/tắt và thông báo "câu hỏi sẽ được gửi tới dịch vụ AI".
5. Cache theo `Reading.id`; lỗi AI → rơi về lời giải có sẵn trong JSON.
**Exit**: G1, G2, G6 (không lộ khóa; rate limit đã thử). Chi phí API được người dùng chấp thuận và ghi vào Quyết định. Tag `v1.3.0`.

## 7D. i18n (vi/en)
1. Hoàn thiện `shared/i18n.ts` + `strings.en.ts`; nội dung bài/quẻ thêm trường theo ngôn ngữ (hoặc file JSON riêng theo ngôn ngữ, tải lười).
2. Test: mọi key trong `strings.vi.ts` đều có trong `strings.en.ts`.
**Exit**: G1, G2, G5. Tag `v1.4.0`.

## 7E. PWA
1. Manifest + service worker (cache asset có hash, chiến lược cache-first cho asset tĩnh, network-first cho dữ liệu).
2. Chiến lược cập nhật: thông báo khi có bản mới, không tự reload giữa lượt bói.
3. Kiểm offline thật (Application → Service Workers → Offline).
**Exit**: G1, G4 (không tụt hiệu năng), G7 (kiểm trên preview). Nếu cần thêm thư viện ngoài allowlist: dừng và hỏi ([R00 §4](../rules/R00-core.md)). Tag `v1.5.0`.

---
## Cập nhật state (mỗi mục)
Thêm dòng mục vào bảng phase (P5.x), ghi gate + tag, cập nhật Quyết định nếu đổi kiến trúc.

## Tiếp theo
[W13](13-quality-gate.md) → [W14](14-end-session.md) sau mỗi mục.
