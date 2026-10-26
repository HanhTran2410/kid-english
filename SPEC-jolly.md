# SPEC — 🐍 Âm & ghép vần (Jolly Phonics)

> Phiên bản spec: **draft1** · Ngày: 2026-10-26 · **JP1 đã làm** (app 0.37.0). Kiểu học phonics thứ hai, bên cạnh "Chữ cái ABC" (`SPEC-phonics.md`).
> Theo cách của **Jolly Phonics** (synthetic phonics): học **âm** của chữ (không phải tên chữ) theo thứ tự **s-a-t-i-p-n**, mỗi âm có một **động tác tay** và một câu chuyện nhỏ; học xong vài âm thì **ghép âm thành từ** (*s-a-t → sat*).
> Âm rời là **file ghi âm thật** (Wikimedia Commons, bố mẹ đã nghe duyệt 6 âm nhóm 1 ngày 2026-10-26) — giọng đọc của máy không đọc được âm rời. Bố mẹ **không cần ghi âm**.

## 1. Mục tiêu
- Bé nghe và nhận ra **âm** /s/ /a/ /t/ /i/ /p/ /n/, gắn âm với **chữ** và **động tác**.
- Bé nghe được âm đầu của từ quen (*sun* bắt đầu bằng /s/).
- Bé **ghép 2–3 âm thành từ** khi nghe (*p-i-n → pin*) — nền tảng để tự đọc sau này.
- Không bắt nói, không dùng mic, không phạt; mỗi bài ngắn (~3–5 phút) cho bé 3 tuổi.

**Nguyên tắc (bắt buộc):**
- **Không bao giờ dùng giọng máy cho âm rời.** Âm rời luôn phát từ file (`app/sounds/phonics/<âm>.mp3`). Giọng máy chỉ đọc **từ trọn vẹn** và câu của Bông.
- Trong mục này Bông **gọi chữ bằng âm, không bằng tên** ("the /s/ letter", không phải "the letter S") — tránh lẫn với mục ABC, nơi chữ được gọi bằng tên.
- Chữ **thường** (s a t…) là chính, như Jolly Phonics; chữ hoa chỉ xuất hiện ở mục ABC.

## 2. Vị trí trong app
- **🔤 Phonics** (màn danh sách bài) có thêm tab chủ đề **"🐍 Âm & ghép vần"** bên cạnh các bài ABC. Bài là loại `phonics` với `mode: "jolly"` (dùng chung khung bài, tiến độ, sticker, Học tiếp / Học lại, sao lưu / chia sẻ).
- Bài có sẵn (`builtin`), tự thêm một lần như các bài phonics khác.

## 3. Nội dung nhóm 1 (s a t i p n)

| Âm | File | Động tác (Bông làm mẫu, chữ hướng dẫn cho bố mẹ) | Câu chuyện của Bông | Từ có âm đầu (nghe – chọn hình) |
|---|---|---|---|---|
| **s** | `s.mp3` | tay lượn như con rắn | *"The snake says sss!"* | sun ☀️, sock 🧦, snake 🐍 |
| **a** | `a.mp3` | ngón tay bò lên cánh tay như kiến | *"Ants on my arm! a, a, a!"* | ant 🐜, apple 🍎, alligator 🐊 |
| **t** | `t.mp3` | quay đầu trái phải như xem tennis | *"Watch the tennis! t, t, t!"* | tiger 🐯, teddy 🧸, tent ⛺ |
| **i** | `i.mp3` | ngón tay làm râu chuột ở mũi | *"The little mouse says i, i, i!"* | insect 🐛, ink 🖋️, igloo (ảnh, emoji 🧊) |
| **p** | `p.mp3` | thổi nến sinh nhật | *"Blow out the candles! p, p, p!"* | pig 🐷, pen 🖊️, pizza 🍕 |
| **n** | `n.mp3` | dang tay như máy bay | *"The plane goes nnn!"* | nest 🪺, nose 👃, net 🥅 |

- **Từ ghép được (chỉ dùng 6 âm này, có hình rõ):** ant 🐜, pin 📌, pan 🍳, tap 🚰, nap 😴, sit 🪑, sip 🥤, tin 🥫. Từ đọc bằng giọng máy (đọc từ trọn vẹn thì đúng).
- **Bài có sẵn (3 bài, bài sau mở được ngay — không khóa):**
  1. **Sounds s a t** — 3 âm + ghép *sat, at* (nghe);
  2. **Sounds i p n** — 3 âm + ôn s a t;
  3. **Blend it! (s a t i p n)** — ghép âm thành từ với 8 từ trên.
- Ảnh: emoji mặc định; ảnh lưới thay được như bài phonics (Góc bố mẹ → bài → "Ảnh"), theo từ.

## 4. Các bước của một bài âm (bài 1, 2)
Với **mỗi âm**:
1. **Gặp âm** — chữ thường thật to giữa màn (màu riêng của âm), Bông kể câu chuyện + làm động tác (hình Bông nhún theo động tác, dòng chữ nhỏ cho bố mẹ: *"Cùng bé: tay lượn như con rắn"*), phát âm rời 2 lần. **Chạm chữ** = nghe lại âm. ▶ đi tiếp.
2. **Nghe âm đầu** — *"Which one starts with sss?"* (phát âm rời trong câu: *"Which one starts with"* + [file s] + *"?"*): 3 hình, một hình có âm đầu đúng, hai hình có âm đầu khác (lấy từ các âm khác của nhóm). Chạm hình → Bông đọc từ.
3. **Tìm chữ** — phát âm rời, *"Find the letter!"* — 3 thẻ chữ thường trong nhóm.

Cuối bài: **ghép âm bằng tai** (mục 5, 2–3 lượt với từ dùng âm đã học) → Hoan hô + sticker.

## 5. Ghép âm (bài 3 và cuối bài 1, 2)
```
  [ p ]  [ i ]  [ n ]        ← thẻ chữ; thẻ sáng khi phát âm của nó
     ↘    ↓    ↙
        [ pin ] 📌           ← chữ trượt lại gần nhau, Bông đọc "pin!"
```
1. **Nghe ghép (oral blending)**: Bông: *"Listen!"* → phát lần lượt [p] [i] [n] (cách ~0,4 giây, thẻ chữ sáng theo) → *"What is it?"* → 3 hình (1 đúng + 2 từ khác cùng nhóm). Đúng: chữ trượt lại thành từ, Bông đọc *"Pin! p-i-n, pin!"* (âm từ file, từ bằng giọng máy).
2. **Mức dễ trước**: từ 2 âm (*at, an, in, it*) rồi mới 3 âm.
3. Nhầm: Bông đọc tên hình vừa chạm, phát lại 3 âm, chọn lại; nhầm 2 lần hình đúng nhún (luật nhầm chung của app).
4. **Không** bắt bé tự đọc chữ (chưa đọc được); chữ hiện để bé thấy âm ↔ chữ.
5. Từ 2 âm (*at, in, it, an*) và *sat* không có hình rõ → bé **xem Bông ghép** (thẻ sáng theo âm, chữ trượt lại, Bông đọc từ), không có câu hỏi chọn hình.

## 6. Âm thanh
- 6 file âm rời trong `app/sounds/phonics/` (~5–7 KB/file), lưu offline (service worker). Phát qua WebAudio như tiếng Ai kêu thế? (iOS đã mở khóa từ lần chạm "Bắt đầu"); lỗi / âm thanh bị khóa → hiện chữ to + rung thẻ, **không** đọc bằng giọng máy.
- Câu có âm rời ở giữa (*"Which one starts with [s]?"*): nói phần trước → phát file → nói phần sau; phụ đề hiện *"Which one starts with /s/?"*.
- **Nguồn + giấy phép** ghi trong `app/sounds/CREDITS.md`: s, n, a, i — bản ghi IPA trên Wikimedia Commons (CC BY-SA 3.0: Peter Isotalo; Denelson83); t, p — phần bật hơi đầu *En-us-tap.ogg*, *En-us-pin.ogg* (Dvortygirl, public domain). Cách cắt (đoạn giây) ghi lại để làm lại được.

## 7. Tiến độ
- Mỗi âm một khóa **`sound:s`** (riêng, không lẫn `letter:s` của mục ABC — tên chữ và âm là hai việc khác nhau).
- Luật sao như phonics: chọn đúng ngay lần đầu +1⭐ (tối đa một lần mỗi âm mỗi lượt, tối đa 5⭐, không trừ); gặp âm ghi "đã gặp".
- Từ ghép được (pin, pan…) ghi "đã gặp" trong tiến độ từ vựng → có thể xuất hiện ở Ôn tập.
- Bài âm **chưa** đưa vào Ôn tập / Học cùng Bông (câu hỏi Ôn tập của chữ đọc tên chữ — sẽ làm câu hỏi âm riêng sau).
- Góc bố mẹ → Bé đã học: thêm hàng **Âm (Jolly)**: s a t i p n với số sao.

## 8. Nhóm sau
Jolly Phonics có 42 âm / 7 nhóm: (2) c k e h r m d · (3) g o u l f b · (4) ai j oa ie ee or · (5) z w ng v oo oo · (6) y x ch sh th th · (7) qu ou oi ue er ar.
- Mỗi nhóm làm như nhóm 1: **tìm file âm → cắt → trang nghe thử cho bố mẹ duyệt → thêm bài**.
- Âm đôi (ai, oa, ie, ee, ou, oi…) khó tìm bản ghi rời hơn; nếu không có bản tốt thì âm đó dùng cách "âm trong từ" (*"ai — like rain"*) và ghi rõ trong spec của nhóm.

## 9. Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **JP1** | 6 file âm vào app + CREDITS; 3 bài nhóm 1 (gặp âm, nghe âm đầu, tìm chữ, ghép âm bằng tai); tab "Âm & ghép vần"; tiến độ `sound:`; Góc bố mẹ hiện tiến độ âm | Không có chỗ nào đọc âm rời bằng giọng máy (test); chơi hết 3 bài → sticker |
| JP2 | Nhóm 2 (c k e h r m d): trang nghe thử → bài | Bố mẹ duyệt âm trước |

## 10. Kiểm thử
- **Unit:** 8 từ ghép chỉ dùng âm nhóm 1; từ âm đầu đúng âm (không trùng âm đầu với đáp án nhiễu); mỗi âm có file trong `app/sounds/phonics/`; câu của Bông không chứa tên chữ ("letter S").
- **UI:** gặp âm → phát file (`data-sound-from="file"`), không gọi giọng máy cho âm rời; nghe âm đầu / tìm chữ / ghép âm đúng sai; Học tiếp; hết bài → sticker; tiến độ `sound:s`.
- **Thử tay với bé:** bé có bắt chước động tác không; ghép 3 âm có quá khó không (nếu khó, chỉ giữ từ 2 âm ở JP1).

## 11. Đã chốt (2026-10-26)
1. **Tab mới "🐍 Âm & ghép vần" trong 🔤 Phonics** (màn hình chính không đổi). Nhãn tab trong app là **"🐍 Sounds"** (chủ đề `Sounds`, như các tab chủ đề tiếng Anh khác); Góc bố mẹ ghi loại bài "🐍 Âm & ghép vần".
2. **Động tác:** dòng chữ hướng dẫn cho bố mẹ + Bông nhún theo (không vẽ hình riêng).
3. **Ghép âm:** cả từ 2 âm (*at, in*) và 3 âm (*pin, sat*), từ 2 âm trước.
