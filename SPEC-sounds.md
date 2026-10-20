# SPEC — 🐮 Ai kêu thế? (Who says moo?)

> App **0.26.0** · Ngày: 2026-10-20 · **Đã làm.** Một trò trong Góc trò chơi.
> Bông giả tiếng kêu con vật, bé chạm đúng con vật. Trẻ 3 tuổi rất thích tiếng kêu; trò ngắn, không cần mic.

## 1. Màn hình
```
 🏠  🎲   🐮 Who says moo?          2/5     🐰
                 [🔊 Listen!]
        ┌──────┐   ┌──────┐   ┌──────┐
        │  🐄  │   │  🐖  │   │  🦆  │        ← 2 / 3 / 4 con theo mức
        └──────┘   └──────┘   └──────┘
   phụ đề (hàng riêng, cao cố định)
```
- **🔊 Listen!** và **chạm Bông**: nghe lại tiếng kêu + câu hỏi.
- Điện thoại dọc: 4 con xếp 2 × 2.

## 2. Cách chơi
| Lúc | App |
|---|---|
| Vào trò | *"Listen! Who says that?"* (*Nghe này! Con gì kêu thế nhỉ?*) |
| Mỗi câu | Bông giả tiếng kêu *"Moo! Moo!"* (phụ đề **không** ghi tên con vật, để không lộ đáp án) → *"Who says moo?"* |
| Chạm **đúng** | Thẻ viền xanh, nhún, tiếng hoan hô: *"Yes! The cow says moo!"* → *"Can you say moo?"*, chờ ~2 giây cho bé kêu theo → câu sau |
| Chạm **nhầm** | Thẻ lắc: *"That's the pig! The pig says oink!"* → giả lại tiếng kêu → hỏi lại. Không trừ gì |

- **Gợi ý** (tối đa 2 lần / câu): nhầm 2 lần, hoặc 10 giây không chạm → con đúng sáng lên (10 giây thì kèm tiếng kêu).
- **Một lượt = 5 câu**, con được hỏi không lặp → Hoan hô + **sticker** → về Góc trò chơi.
- **App ra nền rồi quay lại**: chơi tiếp đúng câu đang hỏi.

## 3. Con vật
- **15 con, đều là sticker Dán tranh.** Cùng mã, cùng emoji, và **ảnh bố mẹ đã thay ở Ảnh Dán tranh dùng luôn**.
- Tiếng kêu không trùng nhau.
- Thứ tự quen → lạ:

| Mức 1 (6 con) | thêm ở mức 2 (10 con) | thêm ở mức 3 (15 con) |
|---|---|---|
| cow *moo*, dog *woof*, cat *meow*, duck *quack*, pig *oink*, sheep *baa* | chicken *cluck*, horse *neigh*, bird *tweet*, lion *roar* | frog *ribbit*, monkey *ooh ooh*, owl *hoot*, bee *buzz*, snake *hiss* |

- Tiếng kêu đọc bằng **giọng đọc của máy** (không cần file âm thanh).
- Chọn con được hỏi: ưu tiên con bé **ít gặp** (tiến độ từ vựng theo tên tiếng Anh). Chạm đúng thì ghi **"đã gặp"**.

## 4. Mức
| Mức | Số con để chọn | Nhóm con vật |
|---|---|---|
| 1 (mặc định) | 2 | 6 con quen |
| 2 | 3 | 10 con |
| 3 | 4 | 15 con |
- Tự lên mức sau **3 lượt** chơi xong.
- Bố mẹ khóa mức ở **Cài đặt → Mức chơi Ai kêu thế?** (cài đặt `soundsGame = { level, rounds, lock }`).

## 5. Kiểm thử
- **Unit:**
  - 15 con đều là sticker Dán tranh, tiếng kêu không trùng;
  - câu hỏi theo mức (số lựa chọn, nhóm, không lặp, ưu tiên con ít gặp);
  - câu nói (giả tiếng kêu không lộ tên);
  - lên mức / khóa mức.
- **UI:**
  - mức 1: 2 thẻ; nhầm → câu nhầm, nhầm 2 lần con đúng sáng; đúng → khen + "Can you say …?" → câu 2;
  - 5 câu → sticker, đếm lượt, ghi tiến độ;
  - mức 3: 4 thẻ; 🔊 nghe lại; gợi ý 10 giây;
  - ảnh sticker Dán tranh hiện trong thẻ.
