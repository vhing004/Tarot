---
id: R02
name: code-style
trigger: always_on
description: TypeScript strict, đặt tên, xử lý lỗi, UI string/i18n, comment.
---
# R02: Phong cách code

## 1. TypeScript
`tsconfig.json` bắt buộc: `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`, `"noFallthroughCasesInSwitch": true`, `"exactOptionalPropertyTypes": false`, `"target": "ES2020"`, `"moduleResolution": "bundler"`.
- Cấm `any` (kiểm bởi `check-rules`). Ngoại lệ: dòng có `// allow:R02-any <lý do>`.
- Dùng `unknown` + hàm kiểm kiểu cho dữ liệu ngoài (JSON, localStorage, API).
- Kiểu dữ liệu cốt lõi nằm ở `shared/types.ts`; không khai báo lặp.
- Dùng `as const` + union literal thay `enum`.

## 2. Đặt tên
- File class: `PascalCase.ts`; file hàm/logic: `camelCase.ts`; hằng: `UPPER_SNAKE_CASE`.
- Hàm là động từ (`drawCards`, `buildReading`); boolean bắt đầu `is/has/can`.
- Tên theo nghiệp vụ: `primaryKey`, `changedKey`, `movingLines`, `reversed`, không dùng tên mơ hồ (`data`, `tmp`, `obj`).

## 3. Xử lý lỗi
- Logic thuần: trả kết quả hoặc `throw new Error('<mã>: <mô tả>')` với điều kiện sai rõ ràng (vd quẻ không tồn tại).
- Biên hệ thống (load asset, localStorage, mạng): `try/catch`, hiển thị thông báo thân thiện qua UI, ghi `console.error` kèm ngữ cảnh. Không nuốt lỗi im lặng.
- Load asset thất bại: có phương án dự phòng (vd mặt bài placeholder) để game không treo.

## 4. Chuỗi hiển thị / i18n
- Mọi chuỗi người dùng thấy nằm ở `shared/strings.vi.ts`, truy cập qua `t('key')` (`shared/i18n.ts`). Không hardcode chuỗi trong logic/UI.
- Nội dung bài/quẻ ở file JSON, không ở `.ts`.

## 5. Comment
- Tiếng Việt, ngắn, giải thích **vì sao** (không giải thích cái hiển nhiên).
- Bắt buộc comment ở: thứ tự hào (dưới lên), hào động (6 và 9), lý do dùng RNG-trước-animation, các số "ma thuật" của hiệu năng.

## 6. Import & module
- Import tuyệt đối từ `src/` qua alias `@/` (cấu hình trong `tsconfig` + `vite.config.ts`).
- Chỉ import phần cần dùng từ `three` (`import { Mesh, BoxGeometry } from 'three'`) để tree-shaking; loader từ `three/examples/jsm/...`.
- Không side-effect khi import (không chạy code ở top-level ngoài khai báo).

## 7. Định dạng
- 2 dấu cách, dấu nháy đơn, có dấu chấm phẩy, tối đa ~100 ký tự/dòng.
- Không để `console.log` gỡ lỗi trong commit (dùng `console.error/warn` có chủ đích; log dev bọc trong `if (import.meta.env.DEV)`).
