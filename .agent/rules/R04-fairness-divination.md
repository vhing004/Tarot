---
id: R04
name: fairness-divination
trigger: always_on
description: RNG công bằng, kết quả chốt trước animation, thuật toán gieo quẻ và Tarot, test vector.
---
# R04: Công bằng & thuật toán bói

## 1. Nguyên tắc vàng
**Kết quả chốt bằng RNG trong `logic/` TRƯỚC; animation chỉ diễn lại đúng kết quả đó.**
- Cấm để vật lý, FPS, thời điểm click, hay trạng thái render ảnh hưởng kết quả.
- Cấm tính ngược kết quả từ trạng thái 3D.
- `view` nhận `result` (kiểu thuần) làm đầu vào và chỉ đọc.

## 2. RNG
- Mọi kết quả bói dùng `crypto.getRandomValues`. **Cấm `Math.random` trong vùng thuần** (kiểm bởi `check-rules`). Hiệu ứng thẩm mỹ (hạt, độ lệch xoay) ở `view/` được dùng `Math.random`.
- Logic nhận `RandomSource` vào để test được:
```ts
// core/Random.ts (THUẦN)
export interface RandomSource { nextInt(maxExclusive: number): number }

export const cryptoRandom: RandomSource = {
  nextInt(max) {
    if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) throw new Error('RNG: max không hợp lệ');
    // rejection sampling: tránh modulo bias
    const limit = Math.floor(2 ** 32 / max) * max;
    const buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0]! >= limit);
    return buf[0]! % max;
  },
};

export function shuffle<T>(items: readonly T[], rng: RandomSource = cryptoRandom): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a; // Fisher-Yates
}
```
- Test dùng `RandomSource` giả (dãy cố định) để tái hiện.

## 3. Tarot
- `drawCards(deck, n, rng)`: `shuffle` rồi lấy `n` lá đầu; mỗi lá `reversed = rng.nextInt(2) === 1`. Không lá nào lặp trong một lượt.
- Vị trí (`position`) theo trải bài: `single` → `['present']`; `three` → `['past','present','future']`.
- Người chơi "chọn" lá trên bàn chỉ là **chọn vị trí** trong bộ bài đã xáo sẵn (kết quả đã chốt), không đổi phân phối xác suất.

## 4. Gieo quẻ (Kinh Dịch bằng 3 đồng xu)
Mỗi lần gieo = 3 xu. Ngửa = 3, sấp = 2. `sum` = tổng.
| Số xu ngửa | sum | Hào | Động |
|---|---|---|---|
| 3 | 9 | dương (lão dương) | **có**, biến thành âm |
| 2 | 8 | âm (thiếu âm) | không |
| 1 | 7 | dương (thiếu dương) | không |
| 0 | 6 | âm (lão âm) | **có**, biến thành dương |

- Gieo 6 lần. **Hào xếp từ dưới lên**: lần 1 = hào 1 (dưới cùng) … lần 6 = hào 6 (trên cùng). Hào 1-3 = quẻ hạ (nội), hào 4-6 = quẻ thượng (ngoại).
- `primaryKey`: chuỗi 6 ký tự, **ký tự đầu là hào 1**; dương = `'1'`, âm = `'0'`.
- Quẻ biến: đảo các hào động; `changedKey = null` nếu không có hào động.
- Tra quẻ: `hexagrams[primaryKey]` (JSON khóa bằng chuỗi 6 bit). Không tính toán lại tên quẻ bằng công thức riêng.
- Lời giải: quẻ chủ (`judgement`) + lời các hào động (`lines[n-1]`) + quẻ biến.

```ts
// modes/divination/logic/hexagram.ts (THUẦN)
export function throwCoins(rng: RandomSource): CoinLine {
  const coins = [0, 1, 2].map(() => (rng.nextInt(2) === 1 ? 3 : 2)) as [2 | 3, 2 | 3, 2 | 3];
  const sum = (coins[0] + coins[1] + coins[2]) as 6 | 7 | 8 | 9;
  return { coins, sum, yang: sum === 7 || sum === 9, moving: sum === 6 || sum === 9 };
}
export function castHexagram(rng: RandomSource): CoinLine[] {
  return Array.from({ length: 6 }, () => throwCoins(rng)); // index 0 = hào 1 (dưới)
}
export function buildKeys(lines: readonly CoinLine[]) {
  if (lines.length !== 6) throw new Error('HEX: cần đúng 6 hào');
  const bit = (l: CoinLine, flip: boolean) => ((flip ? !l.yang : l.yang) ? '1' : '0');
  const primaryKey = lines.map((l) => bit(l, false)).join('');
  const hasMoving = lines.some((l) => l.moving);
  const changedKey = hasMoving ? lines.map((l) => bit(l, l.moving)).join('') : null;
  const movingLines = lines.flatMap((l, i) => (l.moving ? [i + 1] : []));
  return { primaryKey, changedKey, movingLines };
}
```

## 5. Test vector bắt buộc (Vitest)
| Case | Đầu vào | Kỳ vọng |
|---|---|---|
| 3 ngửa | coins [3,3,3] | sum 9, yang, moving |
| 3 sấp | coins [2,2,2] | sum 6, âm, moving |
| 2 ngửa | [3,3,2] | sum 8, âm, tĩnh |
| 1 ngửa | [3,2,2] | sum 7, dương, tĩnh |
| Thứ tự hào | hào 1 = dương, hào 2-6 = âm (tĩnh) | `primaryKey = "100000"` (KHÔNG phải `"000001"`) |
| Càn | 6 hào dương tĩnh | `"111111"` → id 1 |
| Khôn | 6 hào âm tĩnh | `"000000"` → id 2 |
| Truân | quẻ hạ Chấn (dương ở dưới), quẻ thượng Khảm | `"100010"` → id 3 |
| Mông | quẻ hạ Khảm, quẻ thượng Cấn | `"010001"` → id 4 |
| Quẻ biến | hào 1 là lão dương (9), hào 2-6 dương tĩnh (7) | `primary "111111"`, `changed "011111"` (id 44), `movingLines [1]` |
| Không hào động | 6 hào tĩnh | `changedKey === null` |
| Dữ liệu | mọi key trong `hexagrams.json` | 6 ký tự `[01]`, không trùng; khi `CONTENT_STATUS='full'` đủ 64 key |
| Shuffle | RNG giả | hoán vị đúng, đủ phần tử, không trùng |
| RNG biên | `nextInt(1)` | luôn 0; `nextInt(0)` ném lỗi |

## 6. Animation đúng kết quả
- Xu: biết trước `faceUp` cho từng xu; animation xoay số vòng nguyên + (0 hoặc π) để dừng đúng mặt.
- Lật bài: bài hướng xuôi/ngược xác định bằng `reversed`, animation kết thúc ở góc tương ứng.
- Có nút "bỏ qua animation": nhảy thẳng tới trạng thái cuối của cùng `result`.

## 7. Gỡ lỗi
- Chế độ dev có thể `?seed=` để dùng RNG giả tái hiện lượt bói. **Cấm** đưa seed vào bản production (bọc bằng `import.meta.env.DEV`).
