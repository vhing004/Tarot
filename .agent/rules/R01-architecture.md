---
id: R01
name: architecture
trigger: always_on
description: Lớp kiến trúc, vùng logic thuần, vòng đời Mode, cấu trúc thư mục, quy tắc phụ thuộc.
---
# R01: Kiến trúc

## 1. Tổng thể
Một **Engine** dùng chung + hai **Mode** (Tarot, Divination) tách module, nạp bằng `import()` động.

```
ui (HTML overlay) ──► modes ──► core ──► three/gsap
                         │
                         └──► services (repository, reading) ──► shared (types, constants)
logic (thuần) ◄── modes/*/logic, core/Random.ts, services, shared
```

## 2. Vùng "thuần" (pure zones): CẤM import `three`, `gsap`, DOM
Gồm: `src/shared/**`, `src/services/**`, `src/modes/*/logic/**`, `src/core/Random.ts`.
- Phải chạy được trong Vitest (môi trường node) không cần trình duyệt.
- Không dùng `Math.random` ([R04](R04-fairness-divination.md)).
- Kiểm tự động bằng `scripts/check-rules.mjs` (gate [G2](R07-quality-gates.md)).

## 3. Quy tắc phụ thuộc
- `ui` được gọi `modes`, `services`; **không** import `three`.
- `modes/tarot` và `modes/divination` **không import lẫn nhau**. Thứ dùng chung nằm ở `core/` hoặc `shared/`.
- `core` không import `modes`/`ui`.
- Phụ thuộc đi một chiều như sơ đồ §1; phát hiện vòng lặp thì tách lại.

## 4. Cấu trúc thư mục (chuẩn)
```
src/
├── main.ts
├── core/
│   ├── Engine.ts            # renderer, camera, loop, resize, requestRender
│   ├── StateMachine.ts
│   ├── AssetLoader.ts       # GLTF/Draco/texture, cache, progress
│   ├── AudioManager.ts
│   ├── Random.ts            # RandomSource, randInt, shuffle (THUẦN)
│   ├── Quality.ts           # adaptive quality
│   └── dispose.ts
├── modes/
│   ├── Mode.ts              # interface vòng đời
│   ├── tarot/
│   │   ├── logic/           # THUẦN: deck.ts, spreads.ts, interpret.ts, __tests__/
│   │   ├── view/            # Three.js: Card.ts, DeckView.ts
│   │   ├── TarotMode.ts
│   │   └── data/            # cards.json, SOURCES.md
│   └── divination/
│       ├── logic/           # THUẦN: hexagram.ts, lookup.ts, interpret.ts, __tests__/
│       ├── view/            # Coin.ts, HexagramView.ts
│       ├── DivinationMode.ts
│       └── data/            # hexagrams.json, SOURCES.md
├── services/                # THUẦN: repository.ts, reading.ts, ai.ts (P5)
├── ui/                      # Menu, QuestionForm, ReadingPanel, History, Settings, styles/
└── shared/                  # types.ts, constants.ts, i18n.ts, strings.vi.ts
```
Tạo file mới phải đặt đúng vùng. Không tạo thư mục ngoài cấu trúc này khi chưa ghi quyết định vào PROJECT_STATE.

## 5. Mode lifecycle (bắt buộc)
```ts
export interface ModeContext { engine: Engine; audio: AudioManager; repo: ReadingRepository; t: (k: string) => string }
export interface Mode {
  readonly id: 'tarot' | 'divination';
  init(ctx: ModeContext): Promise<void>; // nạp asset, dựng object (CHƯA thêm vào scene)
  enter(): void;                          // thêm vào scene, khởi động FSM
  update(dt: number): void;
  exit(): void;                           // dừng FSM, kill tween, gỡ khỏi scene, gỡ listener
  dispose(): void;                        // giải phóng geometry/material/texture mà Mode sở hữu
}
```
- Thứ tự gọi: `init → enter → (update…) → exit → dispose`. Vào lại thì `init` lại (hoặc cache có chủ đích, ghi rõ).
- Mọi `addEventListener`, `gsap.to`, `setTimeout` trong Mode phải được theo dõi và hủy ở `exit()`.
- Tài nguyên dùng chung (cache bởi AssetLoader) do AssetLoader sở hữu, Mode **không** dispose.

## 6. State machine
- Mỗi Mode có FSM riêng bằng [StateMachine](../workflows/01-init-project.md); trạng thái là chuỗi literal có kiểu (`type TarotState = 'INTRO' | ...`).
- Chuyển trạng thái chỉ qua `fsm.go(name, payload)`; mỗi state có `enter/exit` và tự dọn.
- Luồng chuẩn: Tarot `INTRO → SHUFFLE → SPREAD → PICK → REVEAL → READING → SAVE`; Quẻ `INTRO → CONCENTRATE → THROW(x6) → BUILD → CHANGE → READING → SAVE`.

## 7. Luồng dữ liệu kết quả
`logic` (chốt kết quả bằng RNG) → `result` (kiểu thuần) → `view` diễn animation theo `result` → `ui` hiển thị diễn giải → `services` lưu `Reading`.
Chiều ngược lại (view/animation → kết quả) là **CẤM** ([R04 §1](R04-fairness-divination.md)).

## 8. Lưu trữ
Chỉ truy cập qua `ReadingRepository` (`LocalRepository` mặc định, `SupabaseRepository` ở P5). Code game không gọi `localStorage`/Supabase trực tiếp.

## 9. Kích thước & độ phức tạp
- Một file một trách nhiệm; file > ~300 dòng cần tách.
- Không abstraction chưa có ≥2 chỗ dùng. Không pattern "enterprise".
