# SPEC — Mục mới "Phonics" (chữ cái và âm, kiểu sơ đồ tư duy)

> Phiên bản spec: **draft1** · Ngày: 2026-10-13 · Dựa trên app 0.7.0
> Trạng thái: **đã chốt 2026-10-13** (mục 12 theo đề xuất: A–Z, "A is for ant", 6 từ, P-a + P-b, nút thứ 8).
> Ghi chú khi code: chữ khó có ít từ đúng âm + emoji (Q, U, X, Z…) dùng 3–5 từ; 26 chữ chia 5 bài: A–F, G–L, M–R, S–V, W–Z.
> **Đã làm P-a + P-b trong app 0.8.0:** sơ đồ (nhánh mọc ra, chạm từ nào đọc từ đó, chạm chữ giữa nghe lại), tìm từ đúng âm, chữ hoa – chữ thường (thẻ chọn cùng một màu để màu không lộ đáp án), nghe từ chọn chữ, bắt bóng chữ; chữ cái trong Ôn tập / Trò chơi 🎲; Góc bố mẹ: tiến độ từng chữ + ảnh lưới cho từng chữ; nút thứ 8. Chưa làm: bố mẹ ghi âm âm rời, đọc vần theo nhịp, tô chữ bằng ngón tay (P-c), tạo bài phonics bằng AI.

**Phạm vi kỹ thuật:** một mục học mới trong app hiện tại (cùng link, cùng app), dùng chung khung học (🏠, Bông, nút ▶, 🔊 nghe lại), tiến độ, sticker, Ôn tập, Trò chơi 🎲, ảnh lưới, sao lưu / chia sẻ bài. 0 đồng, chạy offline.

## 1. Mục tiêu
- Bé 3 tuổi **nhận ra chữ cái** (hoa và thường: **A a**) và **âm của chữ** (A nói /æ/ như trong *ant*), qua các **từ quen thuộc bắt đầu bằng âm đó** có hình minh họa.
- Học kiểu **sơ đồ tư duy**: chữ ở giữa, các từ tỏa ra xung quanh. Bé tự chạm để khám phá, chạm từ nào nghe từ đó.
- Chưa dạy đọc ghép vần (c-a-t → cat) ở bản đầu (để sau, mục 11).

## 2. Lưu ý quan trọng về "âm" (phonics ≠ bảng chữ cái)
- Phonics dạy **âm chính** của chữ, không phải tên chữ: A trong *ant, apple* là /æ/. **Không dùng *arm*** (âm /ɑː/), không dùng *eye* cho E, *one* cho O… — bé sẽ nghe lẫn âm. Bộ từ có sẵn (mục 4) chọn đúng âm chính; prompt cho AI (mục 9) cũng dặn như vậy.
- **Giọng đọc của máy (TTS) đọc tên chữ và đọc từ tốt, nhưng KHÔNG đọc được âm rời** (/æ/, /s/…) một cách đáng tin cậy. Cách xử lý đề xuất (câu hỏi 12.2):
  1. Mặc định: Bông nói **"A. A is for ant!"** và đọc chậm từ, **tô màu chữ cái đầu** trong từ (*<b>a</b>nt*) để bé thấy âm nằm ở đâu — không cần âm rời.
  2. Thêm: **bố mẹ ghi âm** âm của từng chữ (26 bản ghi ngắn, mỗi bản 1 giây: "/æ/ /æ/ /æ/") trong Góc bố mẹ — app dùng bản ghi này mỗi khi cần âm rời. App đã có sẵn chức năng ghi âm.
  3. (Không chọn) Đóng gói sẵn file âm thanh trong app: phải tìm nguồn có bản quyền phù hợp, tăng dung lượng app.

## 3. Màn hình sơ đồ (mỗi chữ một màn)
```
            🐜 ant
               \
  🍎 apple —  [ A a ]  — 🐊 alligator
               /     \
     🚑 ambulance    🧑‍🚀 astronaut
```
- **Giữa:** thẻ tròn to **"A a"** (chữ hoa + chữ thường, mỗi chữ cái một màu cố định). Chạm → Bông: *"A! A is for ant, apple…"* (hoặc âm ghi sẵn của bố mẹ).
- **Nhánh:** 4–6 từ tỏa quanh, mỗi từ là một thẻ **hình + chữ**, chữ cái đầu tô màu của chữ. Đường nối từ giữa ra từng thẻ.
- **Mở dần:** lúc vào màn, các nhánh **mọc ra lần lượt** (đường nối kéo dài, thẻ bật ra) trong lúc Bông đọc từng từ — bé thấy "cây" lớn lên.
- **Bé chạm từ nào** → thẻ to ra, Bông đọc: *"Ant! A — ant!"*; chạm lại thì đọc lại. Thẻ đã chạm có dấu ✓ nhỏ; chạm đủ các từ → sao bay + *"Great! You found all the A words!"*.
- iPhone dọc: 4 từ (2 trên, 2 dưới) để thẻ đủ to; iPad: 6 từ quanh vòng tròn.
- Không có nút ▶ bắt buộc — bé khám phá tự do; nút **"Next letter →"** to ở góc để sang chữ tiếp.

## 4. Nội dung có sẵn (không cần AI)
- 26 chữ, mỗi chữ **6 từ** quen với bé 3 tuổi, có emoji (chạy ngay, offline), ví dụ:

| Chữ | Từ (âm chính) |
|---|---|
| A a /æ/ | ant 🐜, apple 🍎, alligator 🐊, ambulance 🚑, astronaut 🧑‍🚀, axe 🪓 *(hoặc bỏ axe nếu không muốn)* |
| B b | ball ⚽, bear 🐻, banana 🍌, bus 🚌, bee 🐝, book 📖 |
| C c /k/ | cat 🐱, car 🚗, cake 🍰, cup ☕, cow 🐮, carrot 🥕 |
| S s | sun ☀️, sock 🧦, snake 🐍, star ⭐, spoon 🥄, sandwich 🥪 |
| … | (đủ 26 chữ; X dùng từ **kết thúc** bằng x: box 📦, fox 🦊 — vì gần như không có từ trẻ em bắt đầu bằng /ks/) |

- Chia thành **bài 6 chữ** theo thứ tự đã chốt (câu hỏi 12.1), ví dụ bài 1: **s a t i p n** (thứ tự Jolly Phonics — sớm ghép được từ: *sat, pin, tap*) hoặc **A–F** (theo bảng chữ cái).
- Ảnh: emoji mặc định; bố mẹ thay bằng **ảnh lưới AI** như bài từ vựng (một ảnh lưới cho các từ của một chữ hoặc cả bài, có mũi tên nếu là bộ phận chi tiết).

## 5. Các bước của một bài phonics (6 chữ)
Với từng chữ:
1. **Sơ đồ** (mục 3): nhánh mọc ra, Bông đọc từng từ; bé chạm khám phá (tự đi tiếp sau khi chạm đủ hoặc bấm "Next").
2. **Tìm từ đúng âm** (trò nhỏ, chọn 1 trong 3): *"Which one starts with A?"* — 1 hình bắt đầu bằng A, 2 hình của chữ khác.

Cuối bài: các trò ở mục 6 + Hoan hô + sticker.

## 6. Trò chơi (chạm chọn, không bắt nói)
| Trò | Cách chơi | Ghi chú |
|---|---|---|
| **Chữ hoa – chữ thường** | Hiện **A**, bé chọn **a** trong 3 chữ thường | Thẻ chữ to, màu của chữ |
| **Nghe từ, chọn chữ** | Bông: *"Sun! Which letter?"* — bé chọn **S** trong 3 chữ | Tô chữ đầu khi đáp đúng |
| **Bắt bóng chữ** | Bóng bay chữ cái bay lên; Bông: *"Pop the B!"*, bé chạm bóng đúng (bóng nổ) | Vui, vận động tay; 8–10 lượt |
| **Ai lạc nhóm?** | 3 hình bắt đầu bằng S, 1 hình không — bé chạm hình lạc | Bản sau (khó hơn với bé 3 tuổi) |

## 7. Tô chữ bằng ngón tay (đề xuất, bản sau)
- Chữ to nét đứt, **có số và mũi tên thứ tự nét**; bé dùng ngón tay vuốt theo; vuốt đúng hướng thì nét sáng lên, xong chữ thì Bông khen.
- Hợp với bé 3 tuổi (vận động tinh), chạy offline, không cần mic.

## 8. Bài hát / đọc vần (đề xuất)
- Nút **🎵 "Sing"** ở màn sơ đồ: Bông đọc vần theo nhịp *"A, A, ant! A, A, apple! A, A, alligator!"* (dùng giọng đọc + nhịp vỗ tay của app), các thẻ sáng lần lượt theo nhịp. Bé nghe nhiều lần không chán.

## 9. Tạo thêm bài bằng AI (tùy chọn)
- Góc bố mẹ → **Tạo bài phonics**: chọn chữ (hoặc nhóm chữ) → **Copy prompt** → AI trả JSON (chữ, âm, 4–6 từ + emoji + `imagePrompt`) → Dán → Xem trước → Lưu. Prompt dặn: từ **bắt đầu bằng âm chính** của chữ (không *arm* cho A), danh từ cụ thể dễ vẽ, phù hợp bé 3 tuổi, tránh từ đã có.

## 10. Dữ liệu và tiến độ
- Bài phonics lưu trong kho `lessons` với `kind: "phonics"` (như bài số) — **không nâng cấp IndexedDB**; ảnh trong kho `images`; sao lưu / chia sẻ bài như bài khác.
- Tiến độ: khóa **`letter:a`** cho từng chữ (sao chỉ tăng, không trừ — giống câu / số); từ trong sơ đồ dùng chung tiến độ từ vựng (từ *apple* học ở đây cũng tính cho Ôn tập).
- **Ôn tập / Trò chơi 🎲**: thêm loại câu hỏi "Nghe từ, chọn chữ" và "Chữ hoa – chữ thường" cho chữ đã học.
- Màn hình chính: nút thứ 8 **🔤 Phonics / Chữ cái** (lưới 2 × 4 trên iPhone dọc, 4 × 2 trên iPad — đầy đủ, không lẻ).

## 11. Kế hoạch làm (đề xuất)
| Bước | Nội dung |
|---|---|
| P-a | Nút Phonics + dữ liệu 26 chữ × 6 từ (emoji) + bài 1 (6 chữ) + màn **sơ đồ** + bước "Tìm từ đúng âm" + tiến độ `letter:` |
| P-b | Trò **chữ hoa – chữ thường**, **nghe từ chọn chữ**, **bắt bóng chữ**; đưa vào Ôn tập / Trò chơi 🎲; ảnh lưới AI cho từ |
| P-c | **Bố mẹ ghi âm âm chữ**; **bài hát / đọc vần**; **tô chữ bằng ngón tay** |
| Sau | Ghép vần CVC (s-a-t → *sat*), tạo bài phonics bằng AI, "Ai lạc nhóm?" |

## 12. Câu hỏi cần bố mẹ chốt
| # | Câu hỏi | Đề xuất |
|---|---|---|
| 1 | Thứ tự chữ: **bảng chữ cái A–Z** hay **s a t i p n…** (Jolly Phonics) | **A–Z** cho bé 3 tuổi (quen bài hát ABC, bố mẹ dễ theo); s-a-t-i-p-n hợp hơn khi bé bắt đầu ghép vần |
| 2 | Âm của chữ: chỉ dùng **"A is for ant"** + tô chữ đầu, hay thêm **bố mẹ ghi âm** âm rời | Bản đầu dùng "A is for ant"; ghi âm âm rời ở P-c |
| 3 | Mỗi chữ mấy từ | **6 từ** (iPhone hiện 4, vuốt / chạm "More" để xem 2 từ còn lại) — hay chỉ **4 từ** cho gọn |
| 4 | Làm những phần nào trước | **P-a + P-b** một lượt |
| 5 | Thêm nút thứ 8 trên màn hình chính | Đồng ý |
