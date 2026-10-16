# SPEC — Bài từ vựng hấp dẫn hơn: "Ló dần" khi giới thiệu từ + Truyện chạm được

> Phiên bản spec: **draft2** · Ngày: 2026-10-16 · Dựa trên app 0.15.0 (SPEC.md mục 4.3 A và D)
> - draft1: bản đầu, bố mẹ chốt mục 9 theo đề xuất.
> - **draft2 — sửa theo review (QA)**: một đồng hồ chung cho màn ló dần (8 giây gồm cả lượt đoán, nhịp tự mở theo kiểu che); quy tắc một luồng tiếng (chỉ giữ tiếng của lần chạm cuối); lượt Tìm **tối đa 2 câu / truyện**; bài cũ / bài mới với câu không có từ của bài; nhân vật lạ; thời điểm bắt đầu chạm tự do; chạm chữ; `sound` quá dài thì bỏ (không cắt). Chi tiết ở mục 10.
> - Trạng thái: **đã làm cả 3 mốc W-a, W-b, W-c trong app 0.16.0**.

## 1. Vì sao làm
Hiện nay trong bài từ vựng (📚 Words):
- **Phần A — Thẻ từ**: hình hiện ra ngay, Bông đọc *"Cow!"*, bé nói theo. Bé biết ngay đáp án nên không có chút tò mò nào.
- **Phần D — Truyện**: mỗi màn hình một câu, Bông đọc, bé **chỉ nghe** (trừ câu có `repeat`). Đây là phần bé dễ chán nhất.

Mục tiêu: bé 3 tuổi **tò mò, được chạm, được bất ngờ**, nhưng bài **không dài hơn nhiều** (mỗi thẻ thêm ~6–8 giây; truyện thêm ~5 giây mỗi câu). Giữ nguyên các nguyên tắc của app: không bao giờ nói "sai", không bắt nói, nút ▶ luôn bỏ qua được, không bao giờ kẹt, chạy offline, 0 đồng.

## 2. Phạm vi
| Có | Không (để sau) |
|---|---|
| A: màn **ló dần** trước mỗi thẻ từ (3 kiểu, đổi lần lượt), lượt **đoán** *"What's this?"* | Bé kéo / vẽ để mở hình |
| D: **chạm nhân vật trong truyện** → nhân vật động đậy + kêu / nói; **chạm từng chữ** → Bông đọc chữ đó; chữ sáng theo giọng đọc | Tạo ảnh minh họa cho từng câu truyện |
| D: lượt **"Tìm…"** sau mỗi câu có từ của bài: *"Where's the cow? Tap the cow!"* | Tính ⭐ cho lượt chạm trong truyện (chỉ ghi "đã gặp", mục 7) |
| D: trang kết **"The end!"**, mọi nhân vật vẫy tay, chạm tự do | Bé nói theo cả câu truyện |
| Dữ liệu: trường mới `sound` cho từ (*"Moo moo!"*), bảng tiếng kêu có sẵn cho bài cũ | |
| Cài đặt: bật / tắt "ló dần" | |

## 3. Phần A — "Ló dần" (Peek-a-boo)

### 3.1. Luồng một thẻ
```
che hình → Bông tò mò → bé mở dần (chạm) / tự mở dần → [đoán] "What's this?" → mở hết + "Ta-da!" → thẻ từ như cũ
```
1. **Che hình**: thẻ từ hiện ra nhưng hình **bị che**, chữ tiếng Anh dưới hình cũng **ẩn**. Bông đổi nét mặt **ngạc nhiên** (mood `surprise` đã có), nói *"Ooh! What's hiding here?"* (mỗi thẻ một câu khác nhau, xem 3.4).
2. **Mở dần**: bé **chạm vào phần che** để mở từng mảng (mỗi lần chạm kêu "pop" + vài ngôi sao bay ra). Nếu bé không chạm, **cứ ~1,5 giây app tự mở một mảng**. Trong lúc chờ có tiếng **trống lăn** nhỏ (Web Audio).
3. **Đoán** (khi đã mở khoảng **60%**): Bông hỏi *"What's this?"*, mic mở **tối đa ~4 giây** (đúng quy tắc mục 4.3.1, mic chỉ mở sau khi Bông nói xong).
   - Nhận ra đúng từ → *"Yes! You guessed it!"* + vỗ tay.
   - Có tiếng nhưng không nhận ra / chỉ đo được âm lượng → *"Good guess!"*.
   - Im lặng → không nói gì thêm (không hỏi lại).
   - **Không bao giờ nói "sai"**, đoán gì cũng mở hết hình.
4. **Mở hết**: các mảng còn lại bay đi cùng lúc, tiếng **"Ta-da!"** (Web Audio) + hình **nảy lên** + pháo giấy nhỏ, chữ tiếng Anh hiện ra.
5. Sau đó **thẻ từ chạy như cũ** (SPEC 4.3 A): Bông đọc *"Cow!"* → mic → *"Can you say cow?"* nếu im lặng → khen → sang thẻ sau. Ghi âm, ⭐ giữ nguyên quy tắc cũ (mục 7).

### 3.2. Ba kiểu che (đổi lần lượt theo thứ tự từ trong bài, để lần nào cũng mới lạ)
| Kiểu | Che bằng | Bé làm gì | Dùng khi |
|---|---|---|---|
| 🫧 **Bong bóng** | Lưới **3 × 3** bong bóng màu phủ kín hình | Chạm bong bóng → nổ "pop" | Mọi hình |
| 🎭 **Rèm cửa** | Hai cánh rèm đỏ (trái / phải), mỗi lần chạm kéo mở thêm 1/3 | Chạm rèm | Mọi hình |
| 🌑 **Hình bóng** | Hình chỉ còn **bóng đen** (CSS `brightness(0)`), mỗi lần chạm sáng dần màu | Chạm hình | **Chỉ emoji** hoặc ảnh nền trong suốt; ảnh thường (nền trắng) thì đổi sang bong bóng |

- Mảng che **to** (mỗi bong bóng ≥ 1/3 cạnh thẻ, tối thiểu 90 px) để ngón tay bé chạm trúng.
- Thẻ đầu tiên của bài dùng **bong bóng** (dễ hiểu nhất) và Bông dặn thêm một lần *"Tap, tap, tap!"* kèm bàn tay 👆 nhún trên một bong bóng.

### 3.3. Thời lượng và nhịp
| Bước | Thời gian |
|---|---|
| Tự mở một mảng (nếu bé không chạm) | ~1,5 giây |
| Tối đa cho cả màn ló dần (kể cả đoán) | ~8 giây; hết giờ tự mở hết |
| Mic lượt đoán | tối đa ~4 giây |
- Bé chạm nhanh thì xong nhanh (có thể ~3 giây).
- **▶**: mở hết ngay (bỏ lượt đoán) rồi vào thẻ từ. Chạm lung tung khi Bông đang nói: vẫn mở mảng (không nhảy bước).
- **Giảm chuyển động** (máy bật Reduce Motion): không bay / nảy, mảng che **mờ dần** tại chỗ.

### 3.4. Câu của Bông (đổi vòng để không nhàm)
- Mở đầu: *"Ooh! What's hiding here?"* · *"Peek-a-boo! Who's there?"* · *"Something is hiding!"* · *"Let's find out!"*
- Đoán: *"What's this?"* (luôn câu này — đúng mẫu bé đã học)
- Đúng: *"Yes! You guessed it!"* · Có tiếng: *"Good guess!"* · Mở hết: *"Ta-da!"*
- Phụ đề tiếng Việt (khi chạm 🔊): *Cái gì đang trốn đây?* · *Ú òa! Ai đấy?* · *Có gì đang trốn kìa!* · *Cùng xem nào!* · *Đây là gì?*

### 3.5. Khi nào **không** ló dần
- Cài đặt **"Giới thiệu từ kiểu ló dần"** tắt (mặc định **bật**, mục 9).
- **Học tiếp** giữa thẻ: thẻ đang dở bắt đầu lại từ màn ló dần (chỗ dừng vẫn lưu theo thẻ như cũ).
- Ôn tập / Học cùng Bông / Trò chơi: **không** dùng (ở đó bé đã biết từ, cần nhịp nhanh).

## 4. Phần D — Truyện chạm được

### 4.1. Màn hình mỗi câu
```
┌──────────────────────────────────────────────┐
│   (sân khấu: trời + cỏ, rất đơn giản)         │
│        🐄            🐷        ← nhân vật      │
├──────────────────────────────────────────────┤
│   The  cow  says  moo!   ← chữ to, chạm được  │
└──────────────────────────────────────────────┘
```
- **Sân khấu**: nền đơn giản (trời + đất, vẽ CSS/SVG, đổi màu theo câu cho vui). Trên sân khấu là **nhân vật** = hình của **các từ trong bài có trong câu** (ảnh bố mẹ đã thêm, không có thì emoji), to ≥ 120 px. Câu không có từ nào của bài: sân khấu chỉ có Bông.
- Nhân vật **đi vào** từ hai bên khi câu bắt đầu (trượt + nảy).
- **Chữ**: câu chữ to như hiện nay, từ của bài vẫn tô màu + emoji. Thêm: **chữ sáng lần lượt theo giọng Bông** (karaoke, mục 4.4).

### 4.2. Chạm
| Bé chạm | Kết quả |
|---|---|
| **Nhân vật** | Nhân vật **động đậy** (nảy / lắc / quay, mỗi lần một kiểu) + **tiếng của nó**: `sound` của từ (*"Moo moo!"*), không có thì bảng tiếng kêu có sẵn (mục 5.2), không có nữa thì đọc tên to vui (*"Cake!"*). Kèm vài trái tim / ngôi sao bay |
| **Một chữ** trong câu | Chữ nảy lên, Bông đọc **chữ đó** (từ của bài: đọc từ + tiếng kêu) |
| **Khoảng trống sân khấu** | Vài ngôi sao lấp lánh tại chỗ chạm (cho bé thích chạm lung tung, không làm gì khác) |
- Bông đang đọc câu mà bé chạm: **vẫn cho chạm** (hiệu ứng + tiếng ngắn), nhưng không cắt ngang câu đang đọc — tiếng kêu đợi Bông đọc xong mới phát (một luồng tiếng tại một thời điểm, như SPEC-talk mục 4).

### 4.3. Luồng một câu
1. Nhân vật vào sân khấu → Bông đọc câu (chữ sáng theo).
2. **Câu có `repeat`** (như hiện nay): *"Your turn: Moo moo!"* → mic → khen. Giữ nguyên.
3. **Lượt "Tìm"** — câu có ít nhất một từ của bài: thêm **một nhân vật lạ** (từ khác trong bài) lên sân khấu, Bông hỏi *"Where's the cow? Tap the cow!"*.
   - Chạm đúng → nhân vật kêu + nhảy + *"Yes! The cow!"*.
   - Chạm nhân vật khác → nó kêu tiếng của nó (*"Oink oink! That's the pig!"*) — **không nói sai**, chờ tiếp.
   - ~6 giây không chạm đúng → nhân vật đúng **phát sáng + nảy**, Bông nói *"Here's the cow!"*, đi tiếp.
   - Mỗi câu chỉ một lượt Tìm; câu có nhiều từ của bài thì hỏi từ **đầu tiên** trong câu.
4. Thời gian **chạm tự do** ~2 giây rồi tự sang câu sau (▶ sang ngay). Bé đang chạm liên tục thì chờ tới khi ngưng ~2 giây (tối đa ~8 giây).

### 4.4. Chữ sáng theo giọng (karaoke)
- Dùng sự kiện `boundary` của giọng đọc khi máy có hỗ trợ; **Safari iOS không đáng tin** → ước lượng: chia thời lượng câu theo độ dài từng chữ (tốc độ đọc trong Cài đặt).
- Lệch một chút cũng được — chỉ để mắt bé đi theo chữ, không chấm điểm.

### 4.5. Trang kết **"The end!"**
- Sau câu cuối: tất cả nhân vật của truyện đứng trên sân khấu, **vẫy tay**, chữ to *"The end!"*, Bông nói *"The end! Bye-bye, friends!"*.
- Bé chạm tự do tối đa ~6 giây (mỗi nhân vật kêu tiếng của mình), rồi sang màn Hoan hô + sticker như cũ.

## 5. Dữ liệu

### 5.1. Trường mới `sound` (không bắt buộc)
```json
{ "en": "cow", "vi": "con bò", "emoji": "🐄", "sentence": "The cow says moo!", "sound": "Moo moo!", "imagePrompt": "..." }
```
- Chuỗi ngắn ≤ 4 từ / 30 ký tự: tiếng kêu (*"Moo moo!"*, *"Beep beep!"*, *"Choo choo!"*) hoặc câu cảm thán hợp với vật (*"Yummy!"* cho đồ ăn, *"Bounce, bounce!"* cho quả bóng).
- Kiểm tra bài: quá dài thì cắt (lỗi nhẹ, cảnh báo vàng); không phải chuỗi thì bỏ.
- **Prompt tạo bài** thêm: *"sound": tiếng kêu của con vật / phương tiện / đồ vật biết kêu; vật không kêu thì một câu cảm thán ngắn hợp với nó; không bịa tiếng kêu cho đồ ăn.* và *mỗi câu truyện nhắc ít nhất một từ của bài* (để có nhân vật để chạm).
- Bài cũ không có `sound`: dùng bảng 5.2.

### 5.2. Bảng tiếng kêu có sẵn (cho bài cũ, khớp cả số nhiều)
cow → *Moo moo!* · dog → *Woof woof!* · cat → *Meow!* · duck → *Quack quack!* · pig → *Oink oink!* · sheep → *Baa baa!* · goat → *Maa maa!* · horse → *Neigh!* · chicken / hen → *Cluck cluck!* · chick → *Cheep cheep!* · rooster → *Cock-a-doodle-doo!* · frog → *Ribbit!* · bee → *Buzz buzz!* · bird → *Tweet tweet!* · owl → *Hoo hoo!* · lion → *Roar!* · tiger → *Roar!* · monkey → *Ooh ooh ah ah!* · elephant → *Toot!* · mouse → *Squeak!* · snake → *Hiss!* · car → *Beep beep!* · bus → *Beep beep!* · train → *Choo choo!* · truck → *Honk honk!* · airplane / plane → *Zoom!* · boat → *Toot toot!* · clock → *Tick tock!* · phone → *Ring ring!* · bell → *Ding dong!* · drum → *Boom boom!*
- Không có trong bảng → đọc tên to vui (*"Apple!"*).
- Bố mẹ sửa được `sound` từng từ ở **Quản lý bài → bài → từ** (ô "Tiếng / câu khi chạm", nút 🔊 nghe thử) — mốc W-c.

### 5.3. Cài đặt
| Khóa | Mặc định | Ý nghĩa |
|---|---|---|
| `wordReveal` | `true` | Phần A dùng màn ló dần |
- Truyện chạm được **luôn bật** (không làm bài dài thêm đáng kể, ▶ luôn bỏ qua được).

## 6. Âm thanh mới (Web Audio, không cần file)
| Tên | Dùng | Mô tả |
|---|---|---|
| `drumroll` | lúc đang mở dần | tiếng "rrrr" nhỏ, lặp, tắt khi đoán / mở hết |
| `tada` | mở hết hình | hai nốt đi lên + tiếng lấp lánh |
| `sparkle` | chạm khoảng trống / nhân vật | vài nốt cao ngắn |
- `pop` (đã có) cho mỗi mảng che.

## 7. Tiến độ (⭐) — không đổi ý nghĩa
| Việc | Ghi nhận |
|---|---|
| Lượt đoán ở màn ló dần có tiếng | Như "có lên tiếng" cũ: +1, tối đa 1 lần/ngày/từ, **chỉ đưa tới 2⭐** — dùng chung lượt với bước nói của thẻ (không cộng hai lần trong một thẻ) |
| Chạm nhân vật / chữ trong truyện | Không tính ⭐ (chỉ chơi) |
| Lượt "Tìm" trong truyện | Ghi "đã gặp" (`practiceCount`); **không** cộng / trừ ⭐ (⭐ từ chọn hình vẫn chỉ ở phần C và Ôn tập) |

## 8. Kế hoạch làm (3 mốc)
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **W-a** | Ló dần: 3 kiểu che, tự mở dần, lượt đoán, Ta-da, âm thanh mới, cài đặt bật / tắt | Không chạm gì vẫn tự xong ≤ ~8 giây/thẻ; ▶ mở ngay; không có mic vẫn chạy; ảnh nền trắng không dùng kiểu bóng đen |
| **W-b** | Truyện: sân khấu + nhân vật, chạm nhân vật / chữ / khoảng trống, karaoke, lượt Tìm, trang The end | Không chạm vẫn tự đi hết truyện; chạm khi Bông đang đọc không đọc chồng; câu không có từ của bài vẫn hiện bình thường |
| **W-c** | Trường `sound`: kiểm tra bài, prompt tạo bài, bảng có sẵn, sửa ở Quản lý bài | Bài cũ có tiếng kêu từ bảng; bài mới có `sound` từ AI; sửa xong nghe ngay |

### 8.1. Kiểm tra
| Mục | Bởi |
|---|---|
| Thứ tự kiểu che theo từ; ảnh nền trắng → không dùng bóng đen | unit |
| Tự mở hết trong thời gian tối đa; ▶ mở ngay | UI |
| Đoán: nhận ra → "You guessed it"; có tiếng → "Good guess"; im lặng → không hỏi lại; không bao giờ "sai" | UI (giả lập nhận dạng) |
| Tìm nhân vật trong câu: khớp cả số nhiều (cows); câu có 2 từ → hỏi từ đầu | unit |
| Tiếng khi chạm: `sound` → bảng → tên | unit |
| Kiểm tra `sound`: cắt chuỗi dài, bỏ kiểu sai; prompt có dặn `sound` | unit |
| Chạm nhân vật đúng / khác / không chạm ở lượt Tìm; trang The end; không đọc chồng | UI |
| Ghi âm, ⭐, Học tiếp không đổi so với trước | UI (test cũ vẫn qua) |
| Ngón tay bé trên iPad: chạm bong bóng / rèm / nhân vật dễ trúng | **iPad thật** |

## 9. Cần bố mẹ chốt (đề xuất in đậm)
| # | Câu hỏi | Đề xuất |
|---|---|---|
| 1 | Ló dần cho **mọi thẻ** hay chỉ thẻ đầu / vài thẻ? | **Mọi thẻ**, kiểu che đổi lần lượt; bài 6 từ thêm ~45 giây |
| 2 | Có lượt **đoán bằng giọng** (*"What's this?"*) không, hay chỉ chạm mở? | **Có**, mic tối đa 4 giây, không bao giờ nói sai |
| 3 | Lượt **Tìm** trong truyện: mọi câu có từ của bài hay tối đa 2 câu / truyện? | ~~Mọi câu có từ của bài~~ → **tối đa 2 câu / truyện** (đổi theo review: tránh biến truyện thành bài kiểm tra) |
| 4 | Trang **The end** có không? | **Có**, chạm tự do tối đa ~6 giây |
| 5 | Màn ló dần có cài đặt bật / tắt? | **Có**, mặc định bật |

## 10. Sửa theo review (draft2) — quy tắc đã chốt và đã làm trong 0.16.0

### 10.1. Thời gian màn ló dần — một đồng hồ chung
- **T0** = lúc hình bị che. Đồng hồ tổng **8 giây tính từ T0, GỒM cả lượt đoán**. Bé chạm thì mở mảng ngay, **không đặt lại** đồng hồ.
- Nhịp tự mở **theo kiểu che** để tới ngưỡng đoán (~60%) sau **~3 giây**: bong bóng 6/9 mảng → **0,5 giây/mảng**; rèm / hình bóng 2/3 bước → **1,5 giây/bước** (draft1 ghi 1,5 giây/mảng cho mọi kiểu → bong bóng mất ~9 giây, vượt 8 giây).
- Lượt đoán nghe **tối đa 4 giây và không quá thời gian còn lại** (trừ ~0,3 giây); còn **< 1,5 giây** thì bỏ lượt đoán, mở hết luôn.
- Hết đồng hồ: hủy câu đang đọc / mic đang nghe, mở hết, vào thẻ từ. Không có mic: bỏ lượt đoán (không "Your turn!").
- Rèm: trạng thái theo **bước** 0 → 1/3 → 2/3 → mở hết (chạm liên tục không ra trạng thái lạ). Thứ tự kiểu che theo **thứ tự từ trong bài** (Học tiếp vẫn đúng kiểu của thẻ đó, màn ló dần bắt đầu lại).

### 10.2. Một luồng tiếng
1. Mỗi lúc chỉ một câu đọc **hoặc** một lượt mic.
2. **▶**: dừng câu đang đọc / mic, bỏ tiếng đang chờ, chuyển ngay (ở màn ló dần: chỉ mở hết hình, không bỏ cả thẻ).
3. Rời màn / app ra nền: hủy mọi đồng hồ, câu đọc, mic của màn cũ (dùng chung cơ chế hủy của bài học).
4. Chạm trong lúc Bông đang nói: hiệu ứng hình hiện ngay; **tiếng chỉ giữ của lần chạm CUỐI**, phát khi Bông đọc xong — không xếp hàng dồn. Mic đang nghe (lượt repeat): chạm không phát tiếng (mic thu nhầm). Sang câu mới: bỏ tiếng đang chờ.
5. Mic không có / bị từ chối: chạy luồng không mic, không xin quyền lặp lại.
6. Lượt đoán và lượt nói theo là hai lượt riêng; sao "lên tiếng" **tối đa 1 lần/ngày/từ** (không cộng hai lần trong một thẻ).

### 10.3. Truyện
- **Bài mới** (prompt mới): *"khi đọc tự nhiên"* mỗi câu truyện nhắc ít nhất một từ của bài — không ép viết gượng. **Bài cũ**: vẫn cho câu không có từ của bài → sân khấu chỉ có Bông, không có lượt Tìm. Kiểm tra bài **không** từ chối câu truyện thiếu từ của bài.
- **Lượt Tìm: tối đa 2 câu / truyện**, chọn trước khi học (mỗi lần học như nhau): đi theo thứ tự câu, mỗi câu lấy từ của bài **chưa làm đích** xuất hiện trước nhất; chưa đủ 2 thì cho lặp từ đích. Từ lặp trong câu chỉ một lượt Tìm.
- **Nhân vật lạ**: một từ khác của bài **không có trong câu**, đứng trước hoặc sau ngẫu nhiên, các nhân vật xếp hàng ngang có khoảng cách (không chồng), mỗi nhân vật ≥ 110 px. Không có từ phù hợp (bài 1 từ / câu chứa mọi từ): **chỉ nhân vật đích**, lượt Tìm vẫn chạy. Chỉ chạm nhân vật đích mới xong lượt.
- **Thời điểm chạm tự do**: chỉ bắt đầu **sau khi** câu, lượt repeat và lượt Tìm (nếu có) xong; sang câu sau khi không có chạm mới **2 giây**, tối đa **8 giây** tính từ lúc bắt đầu chạm tự do.
- **Chạm chữ**: mỗi chữ một ô riêng, **dấu câu dính vào chữ** (không là ô riêng), Bông đọc chữ **không kèm dấu câu**; chữ ngoài bài chỉ đọc chữ; từ của bài (ô tô màu, chạm chữ hay emoji đều như nhau) đọc từ + tiếng kêu và nhân vật đó động đậy; chữ lặp lại: mỗi ô đọc đúng chữ của ô đó.
- **Karaoke**: luôn dùng ước lượng theo độ dài chữ và tốc độ đọc (không dựa vào sự kiện `boundary`); Bông đọc xong thì sáng hết.

### 10.4. `sound`
- Bỏ khoảng trắng thừa. **Rỗng / sai kiểu / quá 4 từ / quá 30 ký tự → bỏ** (dùng tiếng có sẵn), **không cắt giữa chừng**; quá dài thì màn xem trước báo cảnh báo vàng.
- Bảng có sẵn: tra **số ít chỉ khi dạng gốc có trong bảng** (cows → cow, buses → bus; *grapes* không có "grape" → đọc *"Grapes!"*), có tên khác (hen / chicken, plane / airplane).
- Quản lý bài: ô **"🔊 Khi chạm"** mỗi từ (gợi ý là tiếng có sẵn), nút **Nghe**; để trống = dùng tiếng có sẵn; áp dụng ngay lần chạm sau.

### 10.5. Kiểm tra đã có
| Mục | Bởi |
|---|---|
| Kiểu che theo thứ tự từ; ảnh thật không dùng hình bóng; nhịp tự mở tới ngưỡng ≤ 3 giây, còn đủ 4 giây nghe trong 8 giây; nghe đoán theo thời gian còn lại | unit |
| Tiếng khi chạm (sound → bảng → tên, số nhiều, tên khác, grapes); cleanSound bỏ chuỗi hỏng / dài | unit |
| Nhân vật trong câu (số nhiều, nhiều chữ, lặp), nhân vật lạ, kế hoạch Tìm (≤ 2, từ khác nhau, câu không có từ), nhân vật trang The end, karaoke | unit |
| Kiểm tra bài giữ / bỏ `sound` + cảnh báo; bài cũ không có `sound`; prompt có `sound` + câu truyện nhắc từ | unit |
| Học hết bài: thấy 3 kiểu che, bong bóng 9 mảng, "Tap, tap, tap!", ≤ 2 lượt Tìm, The end, quà | UI |
| Tốc độ thật: chạm bong bóng nổ; ▶ chỉ mở hết, vẫn ở thẻ đó, thẻ chạy tiếp | UI |
| Tắt ló dần trong Cài đặt | UI |
| Lượt Tìm tốc độ thật: chạm nhân vật lạ → "Meow! That's the cat!"; chạm chữ → đọc chữ; chạm đúng → "Moo moo! Yes! The cow!" | UI |
| Sửa tiếng khi chạm ở Quản lý bài → lưu, nghe thử, để trống về tiếng có sẵn | UI |
| Ngón tay bé trên iPad, chạm nhanh, không mạng, Reduce Motion, Web Audio sau khi vào bài | **iPad thật** |
