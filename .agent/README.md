# .agent: Bộ điều khiển AI cho Fortune-Hunter

Bộ rule + workflow này buộc mọi AI agent (Claude Code, Antigravity, Cursor...) làm việc **tuần tự, có kiểm soát, có kiểm chứng** trên dự án Fortune-Hunter (game bói Tarot + gieo quẻ 3D, TypeScript + Three.js + Vite).

## 1. Ba nguyên tắc vận hành
1. **State**: [PROJECT_STATE.md](PROJECT_STATE.md) là nguồn sự thật duy nhất về tiến độ. Đọc đầu phiên, cập nhật cuối phiên.
2. **Workflow**: mọi việc đi qua một workflow trong `workflows/`. Không làm "tự do" ngoài workflow.
3. **Gate**: mỗi workflow kết thúc bằng gate kiểm chứng (lệnh chạy được, kết quả đo được). Chưa qua gate thì chưa được đánh dấu xong và chưa được sang phase sau.

## 2. Cấu trúc
```
.agent/
├── README.md                 # file này: mục lục + cách dùng
├── PROJECT_STATE.md          # tiến độ phase, gate, quyết định, lỗi tồn đọng
├── rules/                    # LUẬT (luôn áp dụng), mã R00..R08
│   ├── R00-core.md           # nguyên tắc nền, thứ tự ưu tiên, khi nào phải dừng hỏi
│   ├── R01-architecture.md   # lớp, vùng "thuần", Mode lifecycle, cấu trúc thư mục
│   ├── R02-code-style.md     # TypeScript strict, đặt tên, xử lý lỗi, i18n
│   ├── R03-performance.md    # ngân sách hiệu năng, render-on-demand, dispose
│   ├── R04-fairness-divination.md  # RNG, thuật toán gieo quẻ, test vector
│   ├── R05-content-safety.md # bản quyền, nội dung nhạy cảm, disclaimer
│   ├── R06-security.md       # secret, XSS, localStorage, Supabase RLS, AI proxy
│   ├── R07-quality-gates.md  # định nghĩa G0..G7 + lệnh kiểm
│   └── R08-git-release.md    # nhánh, commit, tag, rollback
├── workflows/                # QUY TRÌNH (làm theo thứ tự), mã W00..W14
│   ├── 00-start-session.md
│   ├── 01-init-project.md        # P0
│   ├── 02-build-tarot-mode.md    # P1
│   ├── 03-build-divination-mode.md  # P2
│   ├── 04-polish-history-audio.md   # P3
│   ├── 05-optimize-performance.md   # P4
│   ├── 06-deploy-cloudflare.md
│   ├── 07-extend-supabase-ai-i18n.md  # P5
│   ├── 10-add-feature.md
│   ├── 11-fix-bug.md
│   ├── 12-add-content-data.md
│   ├── 13-quality-gate.md
│   └── 14-end-session.md
└── templates/                # mẫu để copy
    ├── phase-report.md · bug-report.md · decision-record.md
    ├── check-rules.mjs       # script kiểm rule tự động (Node, chạy được trên Windows)
    ├── package-scripts.json  # scripts cần thêm vào package.json
    ├── _headers              # cache + security headers cho Cloudflare Pages
    └── gitignore.append
```

## 3. Sơ đồ liên kết
```
                    ┌─────────────────────────────┐
                    │  PROJECT_STATE.md (nguồn sự thật) │
                    └──────────────▲──────────────┘
                                   │ đọc/ghi
 W00 start ─► W01 init(P0) ─► W02 tarot(P1) ─► W03 quẻ(P2) ─► W04 polish(P3)
                                                                   │
              W07 extend(P5) ◄─ W06 deploy ◄─ W05 optimize(P4) ◄───┘

 Mỗi workflow Wxx ──(trước khi đóng)──► W13 quality-gate ──► W14 end-session
 Ngoài luồng phase:  W10 add-feature · W11 fix-bug · W12 add-content-data
 Rule R00..R08 áp dụng cho TẤT CẢ workflow; gate G0..G7 định nghĩa tại R07.
```

## 4. Tra nhanh: tình huống → workflow
| Tình huống | Workflow |
|---|---|
| Bắt đầu mọi phiên làm việc | [W00](workflows/00-start-session.md) |
| Chưa có code, dựng khung | [W01](workflows/01-init-project.md) |
| Làm chế độ Tarot | [W02](workflows/02-build-tarot-mode.md) |
| Làm chế độ gieo quẻ | [W03](workflows/03-build-divination-mode.md) |
| Lịch sử, chia sẻ, âm thanh, hiệu ứng | [W04](workflows/04-polish-history-audio.md) |
| Chậm, giật, nặng | [W05](workflows/05-optimize-performance.md) |
| Đưa lên Cloudflare Pages | [W06](workflows/06-deploy-cloudflare.md) |
| Supabase / AI / i18n / PWA / đủ 78 lá, 64 quẻ | [W07](workflows/07-extend-supabase-ai-i18n.md) |
| Thêm tính năng mới ngoài kế hoạch | [W10](workflows/10-add-feature.md) |
| Sửa lỗi | [W11](workflows/11-fix-bug.md) |
| Thêm/sửa dữ liệu bài, quẻ | [W12](workflows/12-add-content-data.md) |
| Đóng phase / kiểm tra tổng | [W13](workflows/13-quality-gate.md) |
| Kết thúc phiên | [W14](workflows/14-end-session.md) |

## 5. Cách gắn vào công cụ
- **Claude Code**: tạo `CLAUDE.md` ở gốc repo với nội dung:
  ```
  # Fortune-Hunter
  Bắt buộc đọc và tuân thủ `.agent/README.md`.
  Việc đầu tiên của MỌI phiên: chạy `.agent/workflows/00-start-session.md`.
  Rule: `.agent/rules/*`. Tiến độ: `.agent/PROJECT_STATE.md`.
  ```
- **Antigravity**: thư mục `.agent/` được nhận tự động (rules luôn bật, workflows gọi bằng tên).
- **Công cụ khác**: dán `R00-core.md` + workflow hiện tại vào đầu cuộc trò chuyện.
- Nhắn khởi động: `Chạy W00, sau đó làm workflow của phase hiện tại.`

## 6. Quy ước ID và liên kết
- Rule: `R00..R08`. Workflow: `W00..W14`. Gate: `G0..G7`. Quyết định: `D-001...` (ghi trong PROJECT_STATE).
- Khi nhắc tới rule/gate trong code review hoặc báo cáo, dùng ID (vd: "vi phạm R01 §2", "chưa qua G3").
- Link giữa các file dùng đường dẫn tương đối. Đổi tên/di chuyển file thì phải sửa mọi link (kiểm bằng `node scripts/check-rules.mjs --links`).

## 7. Bảo trì bộ .agent
- Sửa rule/workflow = một commit riêng, tiền tố `chore(agent):`, và ghi lý do vào mục "Quyết định" của PROJECT_STATE.
- Không để rule mâu thuẫn nhau; nếu có, theo thứ tự ưu tiên tại R00 §3 và sửa rule bị thua cho khớp.
- Mỗi workflow phải có đủ: Mục tiêu, Entry gate, Rule áp dụng, Các bước, Exit gate, Cập nhật state, Tiếp theo.
