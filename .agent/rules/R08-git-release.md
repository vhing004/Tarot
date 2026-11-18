---
id: R08
name: git-release
trigger: always_on
description: Quy ước nhánh, commit, tag, PR, release và rollback.
---
# R08: Git & phát hành

## 1. Nhánh
- `main`: luôn build được, đã qua gate; chỉ merge từ nhánh phase/feature.
- `phase/pN-<tên>` (vd `phase/p1-tarot`), `feat/<tên>`, `fix/<tên>`, `chore/<tên>`.
- Một phase = một nhánh; merge vào `main` khi qua gate của phase.

## 2. Commit (Conventional Commits, tiếng Anh)
`<type>(<scope>): <mô tả ngắn>`; type: `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `chore`, `build`.
Scope gợi ý: `core`, `tarot`, `divination`, `ui`, `services`, `data`, `agent`.
Ví dụ: `feat(divination): build primary/changed hexagram keys`, `test(divination): add vectors for line order`.
- Commit nhỏ, mỗi commit build được. Không gộp nhiều việc không liên quan.
- Cập nhật `.agent/` dùng `chore(agent): ...` ([README §7](../README.md)).

## 3. Trước khi commit
1. `npm run check` pass ([G1/G2](R07-quality-gates.md)).
2. Không có `console.log` gỡ lỗi, không `.env`, không file nháp.
3. Đã cập nhật PROJECT_STATE nếu đổi trạng thái/quyết định.

## 4. Tag & release
- Qua gate cuối phase: merge vào `main` + tag theo bảng phase trong [PROJECT_STATE](../PROJECT_STATE.md) (`v0.1.0`...). Ghi báo cáo phase ([templates/phase-report.md](../templates/phase-report.md)).
- Release công khai (`v1.0.0`) chỉ sau gate G7 ([W06](../workflows/06-deploy-cloudflare.md)).
- Semver: thay đổi dữ liệu lưu không tương thích = tăng minor/major + migration ([R06 §3](R06-security.md)).

## 5. Rollback
- Lỗi sau deploy: redeploy bản trước ở Cloudflare Pages (chọn deployment cũ) hoặc `git revert <commit>` rồi push; không force-push `main`.
- Ghi sự cố vào PROJECT_STATE mục "Lỗi tồn đọng" và chạy [W11](../workflows/11-fix-bug.md).

## 6. Cấm
- Force-push `main`, xóa tag đã phát hành, commit trực tiếp lên `main` khi chưa qua gate.
- Commit file lớn không nén (model/texture chưa tối ưu) ([R03](R03-performance.md)).
