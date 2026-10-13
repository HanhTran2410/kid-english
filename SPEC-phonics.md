# SPEC — Mục "Phonics" (chữ cái và âm, kiểu sơ đồ tư duy)

> Phiên bản spec: **1.1** · Ngày: 2026-10-13
> - draft1 → chốt 2026-10-13: A–Z, "A is for ant", 6 từ (mục tiêu), P-a + P-b một lượt, nút thứ 8.
> - **1.0 — đã làm P-a + P-b trong app 0.8.0.**
> - **1.1 — sửa theo review (app 0.8.1):** âm mục tiêu cho từng chữ; bỏ *orange* (sai âm với giọng Mỹ); đáp án nhiễu không cùng âm đầu (C/K/Q); chạm được ngay khi nhánh đang mọc; chữ đã học thì sơ đồ mở ngay; Q nhắc "Q and U go together"; máy cũ tự cập nhật bộ từ; sửa chỗ mâu thuẫn về số chữ mỗi bài; thêm cấu trúc dữ liệu, luật tính sao và checklist nghiệm thu.

**Phạm vi kỹ thuật:** mục học mới trong app hiện tại, dùng chung khung học (🏠, Bông, nút ▶, 🔊 nghe lại), tiến độ, sticker, Ôn tập, Trò chơi 🎲, ảnh lưới, sao lưu / chia sẻ bài. 0 đồng, chạy offline.

## 1. Mục tiêu
- Bé 3 tuổi **nhận ra chữ cái** (hoa và thường: **A a**) và **liên kết chữ với âm đầu của từ quen thuộc** (A — *ant*, *apple*), qua hình minh họa.
- Học kiểu **sơ đồ tư duy**: chữ ở giữa, các từ tỏa ra; bé tự chạm khám phá.
- Chưa dạy ghép vần (c-a-t → *cat*) ở bản đầu (mục 12).

## 2. Âm chữ: tên chữ ≠ âm chữ ≠ âm đầu của từ
- **Tên chữ** A = /eɪ/; **âm chính** của A trong *ant* = /æ/. Một chữ có thể có nhiều âm (C: *cat* /k/, *city* /s/) — bản đầu **chỉ dạy một âm mục tiêu** mỗi chữ (`sound`, mục 4), chọn từ có **âm đầu đúng âm đó** theo giọng Mỹ của app.
- Câu **"A is for ant!"** là lời giới thiệu thân thiện, giúp bé **liên kết chữ với từ**; nó **không tự dạy âm rời** /æ/. Vì vậy:
  - Tô màu chữ cái mang âm trong từ (*<b>a</b>nt*) và cho bé nghe từ mẫu.
  - Trò chơi chỉ yêu cầu **nhận biết chữ** và **phân loại từ theo âm đầu thực tế**; **không** yêu cầu bé phát âm âm rời, không dùng mic.
- **Giọng đọc của máy không đọc được âm rời** đáng tin cậy → âm rời chỉ có khi **bố mẹ ghi âm** (P-c, mục 9).

## 3. Màn hình sơ đồ (mỗi chữ một màn)
```
            🐜 ant
               \
  🪓 axe —   [ A a ]  — 🍎 apple
               /     \
   🧑‍🚀 astronaut   🐊 alligator      (+ 🚑 ambulance)
```
- **Giữa:** thẻ tròn to **"A a"**, mỗi chữ một màu cố định.
- **Nhánh:** 3–6 thẻ **hình + chữ** quanh vòng tròn, chữ mang âm được tô màu, có đường nối.
- **Lần đầu học chữ:** nhánh **mọc ra lần lượt** trong lúc Bông đọc từng từ. **Bé chạm được ngay** thẻ đã hiện: Bông dừng đọc lần lượt, các nhánh còn lại hiện hết, rồi đọc từ bé vừa chạm.
- **Chữ đã học (lần sau):** sơ đồ **mở ngay**, chỉ nghe câu giới thiệu, không chạy lại hiệu ứng.
- **Chạm thẻ từ:** thẻ to ra, Bông đọc *"A, ant!"* (X: *"Box!"*); chạm lại thì đọc lại.
- **Chạm chữ giữa:** chỉ nghe lại câu giới thiệu *"A! A is for ant!"* — **không** đọc lại cả 6 từ.
- **Viền màu trên thẻ đã chạm** = "đã khám phá trong lượt này", **không** có nghĩa là bé đã thuộc từ.
- Chạm đủ các từ → sao bay + *"Great! You found all the A words!"* rồi sang bước sau. **Nút ▶ luôn hiện**, không bắt chạm hết.
- **iPhone dọc vẫn hiện 6 thẻ** (đã kiểm tra trên khổ 390 × 664: thẻ ~95 px, hình và chữ đủ rõ) — không cần nút "More". iPad: 6 thẻ quanh vòng tròn.

## 4. Nội dung có sẵn và cấu trúc dữ liệu
- **26 chữ A–Z**, mỗi chữ **mục tiêu 6 từ** quen với bé 3 tuổi, có emoji (offline). Chữ khó có ít từ vừa đúng âm vừa quen vừa có hình rõ thì dùng **3–5 từ chính xác** thay vì cố đủ 6: E 5, I 5, O 4, Q 3, U 3, X 4, Y 5, Z 4.
- Bộ từ đã rà theo âm mục tiêu: C toàn /k/ (cat, car, cup…), G toàn /ɡ/ (goat, grapes… — không *giraffe*), I /ɪ/, O /ɒ/ (**không *orange*** — giọng Mỹ đọc /ɔːr/), U /ʌ/, Y là phụ âm /j/ (yo-yo, yarn), Z /z/ (zebra, zipper), Q /kw/ (queen, question, quilt — Bông nói thêm *"Q and U go together!"*).
- **Ngoại lệ chữ X** (`inside: true`): âm /ks/ nằm **trong / cuối từ** (box, fox, six, taxi). Bông nói *"X! Box has X!"*, câu hỏi là *"Which one **has** X?"* (không dùng "starts with"), tô chữ x ở vị trí của nó. Không dùng *xylophone* (đọc /z/).
- **5 bài**: A–F, G–L, M–R (6 chữ), S–V, W–Z (4 chữ). Quy tắc: **mỗi bài tối đa 6 chữ, bài cuối có thể ít hơn**; mỗi chữ có sơ đồ và trò riêng.
- Bài lưu trong kho `lessons` (không nâng cấp IndexedDB):
```json
{
  "kind": "phonics", "builtin": "phonics-a-f", "title": "Letters A–F", "topic": "Phonics", "emoji": "🐜",
  "letters": [
    { "letter": "a", "sound": "/æ/", "inside": false,
      "words": [ { "en": "ant", "emoji": "🐜" }, { "en": "apple", "emoji": "🍎" } ] },
    { "letter": "x", "sound": "/ks/", "inside": true, "words": [ { "en": "box", "emoji": "📦" } ] }
  ]
}
```
  - Mã ổn định: chữ = `letter`, từ = `en` (trong một chữ); `builtin` cho bài có sẵn.
  - **Máy cũ:** khi mở app, bài có sẵn (`builtin`) **tự cập nhật** `letters` theo dữ liệu mới (ví dụ bỏ *orange*), giữ tên, số bài, chỗ học dở, số lần học.
- **Ảnh:** emoji mặc định; Góc bố mẹ có mục **"Ảnh chữ Aa"** cho từng chữ — ảnh lưới AI, **mỗi ô một từ theo đúng thứ tự dữ liệu**, ảnh không có chữ in sẵn; lưu trong kho `images` theo bài + từ. Không có ảnh hoặc ảnh lỗi thì dùng emoji, bài không hỏng. Không bắt buộc tạo ảnh.

## 5. Các bước của một bài
Với từng chữ: **1. Sơ đồ** (mục 3) → **2. Tìm từ đúng âm**: *"Which one starts with A?"* (X: *"Which one has X?"*), 1 hình của chữ + 2 hình **không bắt đầu bằng chữ đó và cũng không cùng âm đầu** (câu hỏi C không có hình *kite*).

Cuối bài (bài ≥ 2 chữ): **chữ hoa – chữ thường** (tối đa 4 lượt), **nghe từ chọn chữ** (tối đa 4 lượt), **bắt bóng chữ** (mỗi chữ của bài một lần, tối đa 6) → Hoan hô + sticker.

## 6. Trò chơi (chạm chọn, không nói, không phạt)
| Trò | Cách chơi | Quy tắc đáp án |
|---|---|---|
| **Tìm từ đúng âm** | *"Which one starts with A?"* — 3 hình | Đáp án lấy từ dữ liệu; nhiễu không cùng chữ / cùng âm đầu |
| **Chữ hoa – chữ thường** | *"Big F. Find the small F!"* — 3 chữ thường | Thẻ chọn **cùng một màu** (màu không lộ đáp án); không có cặp dễ nhầm hình (b/d, p/q, b/p, d/q, m/w, n/u) |
| **Nghe từ, chọn chữ** | Hình cái nĩa + *"Fork! Which letter?"* — 3 thẻ "Aa" | Không có chữ cùng âm đầu (Kite: không có thẻ C/Q) |
| **Bắt bóng chữ** | Bóng có chữ lơ lửng, *"Pop the B!"* — 4 bóng | Như chữ hoa – chữ thường |

Chọn sai: thẻ lắc, Bông nói thẻ đó là gì, mời chọn lại; sai 2 lần thì đáp án sáng lên, đi tiếp. Nút 🔊 nghe lại câu hỏi ở mọi trò.

## 7. Tiến độ và sao
- Mỗi chữ có khóa **`letter:a`** (riêng, không lẫn từ vựng). Trạng thái: **chưa học** (không có bản ghi) → **đang học** (`practiceCount > 0`) → **thuộc** (≥ 3⭐).
- **Sao chỉ cộng khi chọn đúng ngay lần đầu** ở một trò, **tối đa một lần mỗi chữ mỗi lượt học**; tối đa 5⭐; **không bao giờ trừ**. Chọn sai chỉ ghi lịch sử (`attempts`).
- Mở sơ đồ / chạm đủ từ **chỉ ghi "đã gặp"** (`practiceCount`), không cộng sao. Chơi lại vẫn được khen nhưng sao không tăng quá giới hạn trên.
- **Từ trong sơ đồ:** chạm một từ ghi "đã gặp" cho từ đó trong tiến độ từ vựng (không cộng sao) → từ đó có thể xuất hiện trong Ôn tập; **tiến độ chữ cái và tiến độ thuộc từ là hai việc riêng**.
- **Ôn tập / Trò chơi 🎲** có thêm câu hỏi "chữ hoa – chữ thường" và "nghe từ chọn chữ" cho chữ đã học.
- Sao lưu / khôi phục / chia sẻ bài: như các loại bài khác (bài phonics có `letters`; tiến độ `letter:` gộp theo luật chung).

## 8. Màn hình chính
- Nút thứ 8 **🔤 Phonics / Chữ cái**; lưới 2 × 4 (iPhone / iPad dọc), 4 × 2 (iPad ngang) — vừa khít.

## 9. P-c (chưa làm): ghi âm âm rời, đọc vần, tô chữ
- **Bố mẹ ghi âm âm của từng chữ** trong Góc bố mẹ; app phát bản ghi khi chạm chữ giữa sơ đồ (sau câu giới thiệu). Hướng dẫn ghi âm hiện ngay cạnh nút ghi:
  - Âm **kéo dài được** (/s/, /f/, /m/, /n/, /l/, /z/, /v/, /h/ thở ra) đọc liền ~1 giây: "sssss".
  - Âm **bật ngắn** (/p/, /t/, /k/, /b/, /d/, /ɡ/) đọc thật ngắn, **không kèm "ờ"** phía sau ("p", không phải "pờ").
  - Nguyên âm đọc âm ngắn trong từ mẫu (/æ/ như đầu *ant*), không đọc tên chữ.
- **Đọc vần theo nhịp:** nút 🎵 ở sơ đồ — *"A, A, ant! A, A, apple!"*, thẻ sáng theo nhịp.
- **Tô chữ bằng ngón tay:** chữ nét đứt, số và mũi tên thứ tự nét; vuốt đúng thì nét sáng.

## 10. Tạo bài phonics bằng AI (sau)
Prompt dặn: từ có **âm đầu đúng âm mục tiêu** của chữ (không *arm* cho A, không *orange* cho O với giọng Mỹ), danh từ cụ thể dễ vẽ, kèm `sound`, đánh dấu ngoại lệ như X.

## 11. Checklist nghiệm thu (P-a + P-b)
| Mục | Trạng thái | Kiểm tra bởi |
|---|---|---|
| Đủ 26 chữ A–Z, hoa – thường đúng cặp | ✅ | unit |
| Từ đúng âm mục tiêu; X có quy tắc ngoại lệ; không *arm*, *orange* | ✅ | unit |
| Không trùng mã / hình, không thiếu emoji | ✅ | unit |
| Sơ đồ đúng trên iPhone dọc và iPad | ✅ | ảnh chụp giả lập (chưa thử máy thật) |
| Chạm được thẻ khi nhánh khác đang mọc | ✅ | UI |
| Giọng đọc đọc đúng; chạm lại đọc lại; chạm chữ giữa chỉ đọc câu giới thiệu | ✅ | UI |
| Nút ▶ luôn dùng được; quay lại bài không kẹt (Học tiếp / Học lại); chữ đã học mở ngay | ✅ | UI |
| Sao không tăng nhiều lần trong một lượt; không trừ | ✅ | unit + UI |
| Từ đã gặp liên kết với Ôn tập; chữ cái có trong Ôn tập / Trò chơi 🎲 | ✅ | unit + UI |
| Sao lưu / khôi phục giữ bài và tiến độ | ✅ | dùng chung luật sao lưu (có test chung) |
| Chạy offline bằng emoji khi chưa có ảnh | ✅ | mặc định (không cần mạng) |
| Đáp án lấy từ dữ liệu, không theo vị trí cố định; nhiễu không cùng âm | ✅ | unit |
| Không bắt nói / không dùng mic; chọn sai không bị phạt | ✅ | UI |
| Máy cũ tự cập nhật bộ từ của bài có sẵn | ✅ | UI |

## 12. Sau này
Ghép vần CVC (s-a-t → *sat*), "Ai lạc nhóm?", tạo bài phonics bằng AI, P-c (mục 9).
