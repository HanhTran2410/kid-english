# SPEC — 🫧 Bắt bong bóng (Pop the bubbles)

> App **0.26.0** · Ngày: 2026-10-20 · **Đã làm.** Một trò trong Góc trò chơi.
> Bong bóng bay lên, Bông nói cần bắt quả nào, bé chạm cho vỡ. Phản hồi nhanh, vui tay; ôn màu, số và từ của mọi bài.

## 1. Chọn kiểu bong bóng
- 3 thẻ to: **🎨 Colors / Màu sắc**, **🔢 Numbers / Số**, **🐱 Words / Từ vựng**.
- **Từ vựng** lấy từ có emoji của các **bài từ vựng**:
  - bé đã học ≥ 4 từ thì chỉ lấy từ đã học (ôn bài), chưa đủ thì lấy mọi từ;
  - không đủ 4 từ có emoji thì thẻ mờ, không chọn được.

## 2. Màn hình
```
 🏠  🫧   🫧 Colors        [🔴 cần bắt]     🐰
              ● ● ● ○ ○ ○ ○ ○                ← đã bắt 3 / 8
 ┌─────────────────────────────────────────┐
 │     (🟡)          (🔴)                   │
 │            (🔵)            (🟢)          │  ← bong bóng bay từ dưới lên, lắc nhẹ
 └─────────────────────────────────────────┘
   phụ đề (hàng riêng)
```
- **Thẻ cần bắt** (góc trên) và **chạm Bông**: nghe lại câu.
- Bong bóng **màu**: tô màu cả quả. **Số**: chữ số to. **Từ**: emoji.

## 3. Cách chơi
| Lúc | App |
|---|---|
| Vào | *"Let's pop the bubbles!"* → *"Pop the red one!"* / *"Pop number three!"* / *"Pop the cat!"* |
| Chạm **đúng** | "Bụp", quả vỡ, chấm đếm sáng: *"Yes! Red!"* / *"Yes! Number three!"* / *"Yes! The cat!"* → câu cần bắt mới |
| Chạm **nhầm** | Quả **vẫn vỡ** (vui tay), Bông nói tên nó: *"Blue!"*. Nhầm lần 2, 4… thì nhắc lại câu cần bắt. Không trừ gì |
| 10 giây không bắt được | Quả cần bắt **lấp lánh** (viền vàng), Bông nhắc lại |
| Bắt đủ **8 lần** | *"Pop, pop, pop! Great job!"* → Hoan hô + **sticker** → về Góc trò chơi |

- **Bong bóng:**
  - mới thả mỗi ~0,9 giây, không quá số tối đa trên màn;
  - **luôn có ít nhất một quả cần bắt** (chưa có thì quả mới chắc chắn là nó), **tối đa 2 quả cần bắt** cùng lúc; còn lại 30% là quả cần bắt;
  - thả theo 5 làn ngang, không trùng làn của 2 quả vừa thả, luôn nằm trọn trong khung;
  - bay hết màn trong 7–9 giây rồi biến mất.
- **Thứ tự cần bắt:** mỗi loại của lượt ít nhất một lần, không bắt cùng loại hai lần liền. Ưu tiên thứ bé ít gặp.
- **Tiến độ:** bắt đúng thì ghi **"đã gặp"**:
  - màu theo tên màu (*red*, chung với bài Colors);
  - số theo `number:n` (chung với bài số);
  - từ theo từ của bài.
- **Giảm chuyển động:** bong bóng không bay; hiện đứng yên ở 8 ô cố định (không đè nhau), sống 7–9 giây.

## 4. Mức
| Mức | Số loại / lượt | Số | Bay hết màn | Tối đa trên màn |
|---|---|---|---|---|
| 1 (mặc định) | 3 | 1–5 | 9 giây | 5 |
| 2 | 4 | 1–10 | 8 giây | 6 |
| 3 | 6 | 1–10 | 7 giây | 7 |
- Tự lên mức sau **3 lượt** (mọi kiểu bong bóng tính chung).
- Bố mẹ khóa mức ở **Cài đặt → Mức chơi Bắt bong bóng** (`bubblesGame = { level, rounds, lock }`).

## 5. Kiểm thử
- **Unit:**
  - 7 màu tươi; số 1–5 / 1–10 theo mức; từ có emoji, không trùng;
  - kế hoạch lượt (số loại, 8 lần, mỗi loại ít nhất một lần, không lặp liền, ưu tiên ít gặp);
  - quả mới luôn đảm bảo có quả cần bắt;
  - câu nói; khóa tiến độ; lên mức / khóa mức.
- **UI (chế độ nhanh, giảm chuyển động):**
  - màu: nhầm → nói tên màu, chấm không đổi; đúng → khen, chấm sáng;
  - 8 lần → sticker, đếm lượt, ghi tiến độ màu;
  - số: mức 1 chỉ 1–5, ghi `number:n`;
  - từ: emoji của bài;
  - gợi ý 10 giây.
