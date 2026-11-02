# SPEC — 🌸 Mẫu câu (Sentence patterns)

> Phiên bản spec: **draft2 (đã chốt)** · Ngày: 2026-11-02 · **Đã làm P1, P2, P3 trong app 0.61.0, trừ "Ôn tập / Học cùng Bông lấy câu mẫu"** (ghi chú khi code ở mục 12).
> - **Câu hỏi đã chốt (theo đề xuất):** nút riêng trên màn hình chính; không bắt buộc học Từ vựng trước; v1 chỉ khung **đúng một** chỗ trống.
> - **draft2 (sau review):**
>   - nhận dạng giọng nói chia 3 mức (từ khóa / một phần câu / cả câu), sao câu chỉ cho cả câu;
>   - phần D không nói "Try again" mà dẫn bé tới hình đúng;
>   - bài ngắn hơn (phần B 4 hình), hết giờ chờ thì nhắc trước rồi chỉ tự chọn **một** hình;
>   - mạo từ có `article` riêng từng từ; bài Body đổi khung thành *I have {a} ___.* (sửa lỗi *This is my eyes*);
>   - Food bỏ *water*, thêm *apples*;
>   - khóa tiến độ theo khung đã chuẩn hóa + `concept`;
>   - bài quá 6 từ thì báo lỗi, không tự cắt;
>   - quy tắc chọn trò chơi và chọn "từ ít sao" rõ ràng; P1 chia 3 mốc nhỏ.
>
> Ý tưởng từ tranh "khung câu" (ví dụ *11. Weather — It is ___.*, *12. Farm Animals — I can see a ___.*): một **câu mẫu có chỗ trống** ở giữa, xung quanh là các hình. Bé học **một câu**, thay từng từ vào chỗ trống: *It is sunny. It is rainy. It is windy…*
> Khác với các mục đang có:
> - *Từ vựng* dạy **từng từ** (*cow*);
> - *Câu nói* dạy **câu hằng ngày cố định** (*Wash your face*);
> - *Nói chuyện với Bông* là **hỏi – đáp**;
> - *Mẫu câu* dạy **một khung câu dùng lại được** với nhiều từ. Bé 3 tuổi nói được câu đầy đủ đầu tiên nhờ lặp đi lặp lại cùng một khung.

## 1. Mục tiêu
- Bé nói được **câu đầy đủ** (*It is sunny!*), không chỉ từ đơn (*sunny*).
- Bé hiểu **khung câu cố định, chỉ một chỗ thay đổi**: nghe nhiều lần *It is …* với nhiều từ khác nhau.
- Dùng lại từ bé **đã học** ở mục Từ vựng (thời tiết, con vật, đồ ăn…): bài mẫu câu nâng từ đơn lên thành câu.
- Màn hình **giống tấm tranh khung câu** mà bố mẹ quen (vòng tròn câu ở giữa, các hình quanh), nhưng **chạm được, nói được**.
- **Không chấm sai:** không nói "wrong", không "Try again". Bé chạm nhầm thì Bông nói tên hình đó và dẫn bé tới hình đúng; bé nói được từ khóa thôi cũng được khen, rồi Bông nói mẫu cả câu.

## 2. Vị trí và màn hình
- **Màn hình chính → 🌸 Sentences / Mẫu câu** (nút riêng, cạnh *Câu nói*). Danh sách bài: mỗi thẻ hiện **khung câu** (*It is ___.*) + hàng emoji các từ (☀️🌧️☁️💨🥵🥶).
- Màn học là **"tấm tranh khung câu"**:
```
 🏠  ▶                    🌦️ Weather                     🐰
              ┌──────┐
     ┌──────┐ │ ☀️   │ ┌──────┐
     │ 🌧️   │ │sunny │ │ ☁️    │
     │rainy │ └──┬───┘ │cloudy│
     └───┬──┘  ╭─┴──────╮ └──┬───┘
         └─────│ It is  │────┘        ← vòng câu ở giữa: khung câu + chỗ trống nhấp nháy
         ┌─────│ ____ . │────┐
     ┌───┴──┐  ╰─┬──────╯ ┌──┴───┐
     │ 💨   │    │        │ 🥵    │
     │windy │ ┌──┴───┐    │ hot  │
     └──────┘ │ 🥶    │    └──────┘
              │ cold │
              └──────┘
   phụ đề (hàng riêng): Trời nắng.
```
- **Vòng câu ở giữa** (màu hồng nhạt như tranh): chữ to, **chỗ trống** là gạch dưới nhấp nháy nhẹ. Khi một từ được chọn, **hình nhỏ + chữ** của từ đó trượt vào chỗ trống.
- **Các vòng hình** xếp quanh, mỗi vòng một màu nền nhạt, có **đường nối màu** tới vòng câu (như tranh):
  - 4 hình: trên, trái, phải, dưới;
  - 5 hình: 1 trên, 2 ngang, 2 dưới;
  - 6 hình: thêm 1 dưới giữa.
- **Điện thoại dọc:** vòng câu ở trên, các hình xếp lưới 2 hoặc 3 cột bên dưới (đường nối bỏ).
- Phụ đề tiếng Việt ở hàng riêng (*Trời nắng.*), không đè lên tranh.
- Nút **👆 Show me** nhỏ cạnh vòng câu (phần A): chạm thì Bông chọn giúp một hình chưa chạm, cho bố mẹ / bé chủ động thay vì chờ.

## 3. Luồng một bài (mục tiêu 2–4 phút)
Bé tương tác nhanh thì xong khoảng 2–3 phút; có chờ mic thì tối đa khoảng 4 phút. Bé mất hứng thì bố mẹ chạm ▶ bỏ qua phần đang làm; lần học sau Học tiếp đúng chỗ.

| Phần | Số lượt | Mốc |
|---|---|---|
| A. Khám phá | mọi hình (4–6) | P1a |
| B. Nói theo | **4 hình** | P1b |
| C. Bé tự nói | 3 hình | P2 |
| D. Trò chơi | 2 câu | P2 |
| Kết thúc | bài hát + sticker | P1c (sticker), P2 (bài hát) |

### A. Khám phá tranh (nghe)
1. Bông đọc tên bài và khung câu: *"Weather! It is …"* (chỗ trống nhấp nháy).
2. Bông chạm thử một hình (hình trên cùng): hình **trượt vào chỗ trống** → *"It is sunny!"*. Từ đang đọc sáng lên theo nhịp (*It · is · sunny*).
3. *"Your turn! Tap a picture!"* — bé chạm hình nào thì hình đó vào chỗ trống, Bông đọc cả câu. Vòng hình đã chạm có **dấu ✓ nhỏ**. Chạm lại hình đã ✓ thì Bông đọc lại câu đó.
4. **Bé không chạm:**
   - 10 giây: Bông nhắc một lần *"Tap a picture!"*, một hình chưa chạm nảy nhẹ;
   - thêm 10 giây: Bông tự chọn **một** hình chưa chạm (như bấm 👆 Show me), rồi lại chờ bé;
   - Bông **không tự đi liền** các hình còn lại; mỗi lần chỉ một hình, giữa các lần luôn chờ bé.
5. Mọi hình có ✓ → sang phần B.

### B. Nói theo (nghe → nói lại cả câu), 4 hình
- Chọn 4 hình theo thứ tự ở mục 4.5. Từng hình: hình sáng lên, trượt vào chỗ trống, Bông nói *"It is rainy!"* rồi bật mic.
- **Nối dần cho bé dễ nói** (hai hình đầu): Bông nói chậm theo cụm *"It is … rainy!"*, khung đọc trước, từ khóa đọc sau.
- Nghe bé theo SPEC mục 4.3.1, kết quả chia **3 mức** (cách nhận ở mục 4.4):

| Bé nói | Mức | Bông | Tiến độ |
|---|---|---|---|
| *"It is rainy"* | **cả câu** | *"Great job!"* + sao bay, nói lại câu mẫu | **sao câu** |
| *"is rainy"*, *"it rainy"* | **một phần câu** | *"Good! It is rainy!"*, mời nói lại **một lần**: *"Say it with me: It is rainy!"* | đã thử câu |
| *"rainy"* | **từ khóa** | *"Yes! Rainy! It is rainy!"*, mời nói lại **một lần** | đã nói từ |
| Có tiếng, không nhận ra chữ | — | *"Good try! It is rainy!"* | — |
| Im lặng | — | *"Let's try! It is rainy!"*, chờ thêm một lần rồi đi tiếp | — |
- Lần "mời nói lại" chỉ một lần mỗi hình; lần đó bé nói được cả câu thì vẫn có sao câu.

### C. Bé tự nói (hình → câu), 3 hình
- Chỗ trống **trống lại**. Một hình nảy lên (Bông không nói từ): *"What's the weather? Tell me!"* (câu `prompt` của bài).
- Bé nói câu (hoặc từ khóa) → hình trượt vào chỗ trống, Bông nhắc lại câu đầy đủ. Kết quả chia 3 mức như phần B.
- Bé chưa nói được: sau 4 giây, **chữ của từ hiện mờ** trong chỗ trống làm gợi ý; lần 2 thì Bông nói mẫu.
- Chọn 3 hình theo thứ tự ở mục 4.5 (khác 4 hình của phần B nếu đủ hình; bài 4–5 hình thì được trùng).

### D. Trò chơi, 2 câu
**Kiểu trò chơi:**
- **listenTap — nghe → chạm:** Bông nói cả câu *"I can see a duck!"*. Bé chạm hình:

| Bé chạm | Bông |
|---|---|
| Đúng | *"Yes! I can see a duck!"* + sao bay |
| Hình khác, lần 1 | Hình đó nảy nhẹ (không lắc): *"That's a pig! Can you find the duck?"* |
| Hình khác, lần 2 | *"Look! Here's the duck!"* — hình đúng sáng, Bông đọc cả câu, đi tiếp |

- **reveal — ló dần:** một vòng hình bị **mây che**, bé chạm mây để mở dần (như *Ló dần* ở Từ vựng) → *"I can see a … cow!"*. Bé nói trước khi mở hết thì Bông khen *"You guessed it!"*.
- **realLife — câu của con:** chỉ bài có `ask` (ví dụ Weather: *"Look outside! What's the weather today?"*). Bé chạm hình hợp với hôm nay → *"It is cloudy today!"*. **Không có đúng / sai**, chỉ 1 câu.

**Chọn trò chơi** (một lượt có 2 câu):
1. Các kiểu hợp lệ: `listenTap`, `reveal`, và `realLife` nếu bài có `ask`.
2. Không dùng lại **kiểu chính** của lần học gần nhất của bài này (khi có ≥ 2 kiểu hợp lệ).
3. Trong các kiểu còn lại, chọn ngẫu nhiên kiểu chính cho câu 1. Câu 2:
   - bài có `ask`: câu 2 là `realLife`, trừ khi câu 1 đã là `realLife`; khi đó câu 2 là `listenTap`;
   - bài không có `ask`: câu 2 là kiểu hợp lệ còn lại.
4. Hình được hỏi trong `listenTap` / `reveal` chọn theo mục 4.5.
5. Lưu kiểu chính vào tiến độ của bài (`lastGame`).

### Kết thúc
- Tranh **đầy đủ**: mọi hình có ✓, vòng câu đọc lần lượt cả các câu thật nhanh như bài hát (*It is sunny, it is rainy, …*), các hình nảy theo nhịp (P2).
- Hoan hô + sticker (màn quà sẵn có).

## 4. Nội dung

### 4.1 Khung câu
- Mỗi bài = **một khung** + **4–6 từ** (khuyên dùng 5–6; tối thiểu 4, tối đa 6). Khung có **đúng một** chỗ trống `___`.
- v1 **không** hỗ trợ khung 2 chỗ trống (*I can see a brown horse*).
- Câu tiếng Việt viết riêng cho từng từ (không ghép máy móc): *Trời nắng / Trời mưa / Trời có gió*; *Con thấy con bò / Con thấy con vịt*.

### 4.2 Mạo từ
- Khung viết `{a}` ở chỗ cần mạo từ: `I can see {a} ___.`, `I have {a} ___.`
- Mỗi từ có thể có `article`: `"a"` | `"an"` | `"none"` | `"auto"` (mặc định `auto`).
  - `auto`: bắt đầu bằng nguyên âm a, e, i, o, u → *an*, còn lại → *a*.
  - Ghi rõ khi `auto` đoán sai: *unicorn* → `"a"`, *hour* → `"an"`; số nhiều / không đếm được → `"none"` (*eyes*, *rice*).
- Khung không có `{a}` thì bỏ qua `article`.
- Prompt tạo bài (mục 4.6) dặn AI ghi `article` cho mọi từ số nhiều / không đếm được và các từ ngoại lệ.

### 4.3 Bài có sẵn (dùng lại từ của các bài Từ vựng có sẵn)
| # | Bài | Khung | Từ | `ask` (phần D) |
|---|---|---|---|---|
| 1 | 🌦️ Weather | It is ___. | sunny, rainy, cloudy, windy, hot, cold | What's the weather today? |
| 2 | 😊 Feelings | I am ___. | happy, sad, angry, sleepy, hungry, scared | How are you today? |
| 3 | 🐶 Animals | I can see {a} ___. | dog, cat, cow, duck, pig, bird | — |
| 4 | 🍚 Food | I like ___. | rice, bread, eggs, bananas, apples, milk | What do you like? |
| 5 | 🎨 Colors | It is ___. | red, blue, yellow, green, pink, orange | — |
| 6 | 🚗 Vehicles | I can see {a} ___. | car, bus, train, plane, boat, bike | — |
| 7 | 🏃 Actions | I can ___. | jump, run, clap, dance, swim, sing | — (bé làm động tác) |
| 8 | 👃 Body | I have {a} ___. | nose, mouth (`a`); eyes, ears, hands, feet (`none`) | — (bé chỉ vào người mình) |
- Thứ tự trong danh sách như cột **#**: Weather và Feelings trước vì bé liên hệ được với đời sống hằng ngày.
- **Body** đổi khung từ *This is my ___* (sai với số nhiều: *This is my eyes*) thành **I have {a} ___**: *I have a nose. I have eyes. I have hands.* Đúng ngữ pháp, bé nói về chính mình.
- **Weather** dùng *hot / cold* thay cho *snowy* như tranh mẫu: hợp với thời tiết ở Việt Nam, và trùng bài Từ vựng.
- **Food** dùng số nhiều cho câu tự nhiên (*I like eggs*); bỏ *water* (không phải món "thích"), thêm *apples*. Câu đọc dùng số nhiều, ảnh dùng `concept` số ít (*egg*, *banana*, *apple*).
- Từ của các bài trùng từ của bài Từ vựng có sẵn cùng chủ đề (trừ *apples* và động từ của *Actions*), nên có sẵn ảnh, sẵn tiến độ.
- Khung lặp lại giữa các bài (*It is* ở Weather và Colors, *I can see* ở Animals và Vehicles) là **cố ý**: bé nhận ra khung quen.

### 4.4 Nhận câu bé nói (3 mức)
- **Chuẩn hóa** câu nhận dạng và khung: chữ thường, bỏ dấu câu, mở rút gọn (*it's → it is*, *i'm → i am*, *can't* giữ nguyên), số ít / số nhiều của từ khóa coi như nhau (*egg* = *eggs*).
- **Từ của khung** chia 2 loại:
  - **từ chính:** mọi từ của khung trừ mạo từ (*a, an, the*). Ví dụ *It is ___* → *it, is*; *I can see {a} ___* → *i, can, see*;
  - **từ phụ:** mạo từ, không bắt buộc (nhận dạng trẻ em hay mất từ ngắn).
- Kết quả:
  - **cả câu** = có từ khóa **và đủ mọi từ chính** của khung;
  - **một phần câu** = có từ khóa và **ít nhất một** từ chính, nhưng chưa đủ;
  - **từ khóa** = chỉ có từ khóa;
  - không có từ khóa = "có tiếng" (*"it is"* thôi cũng là có tiếng).
- Không quan tâm thứ tự từ và từ thừa (*"it is rainy today"* vẫn là cả câu).

### 4.5 Chọn hình cho phần B, C, D ("từ ít sao")
Xếp các từ của bài theo thứ tự:
1. Từ **chưa có sao câu** trước;
2. ít sao câu hơn trước;
3. lần luyện câu gần nhất **cũ hơn** trước (chưa luyện bao giờ coi như cũ nhất);
4. bằng nhau thì ngẫu nhiên.

Phần B lấy 4 từ đầu; phần C lấy 3 từ đầu **sau khi bỏ 4 từ của phần B** (thiếu thì lấy lại từ đầu danh sách); phần D lấy từ đầu danh sách chưa dùng trong phần D của lượt này.

### 4.6 Bố mẹ tạo bài mới
- Góc bố mẹ → **Tạo bài mẫu câu**, như các loại bài khác: chọn chủ đề + khung (gợi ý sẵn: *It is ___ / I am ___ / I can see {a} ___ / I like ___ / I have {a} ___ / I can ___ / I want ___ / Where is the ___?*), app ghép prompt cho AI trả JSON, bố mẹ dán vào.
- Bài **không hợp lệ thì báo lỗi rõ, không tự sửa nội dung**: *"Bài có 7 từ. Mỗi bài 4–6 từ."*, *"Khung cần đúng một chỗ trống ___."*. Từ trùng: báo lỗi, chỉ ra từ nào.
- Ảnh: dùng lại ảnh mới nhất của `concept` ở các bài khác; chưa có thì emoji. Bố mẹ thêm ảnh bằng **ảnh lưới 3 × 2** như bài từ vựng (prompt kiểu tranh tròn, nền nhạt).

## 5. Tiến độ, phần thưởng
- **Khóa khung** = khung đã chuẩn hóa (chữ thường, bỏ dấu câu, bỏ khoảng trắng thừa, mọi `____` thành `___`, `{a}` giữ nguyên): *"It is ____."* và *"it is ___"* cùng là `it is ___`. Bài có thể ghi `frameId` riêng để ép khóa (bài có sẵn ghi sẵn).
- **Sao câu:** khóa `pattern:<khóa khung>|<concept>` (ví dụ `pattern:it is ___|sunny`). Chỉ **cả câu** mới thêm sao. "Một phần câu" / "từ khóa" ghi lần luyện (`practicedAt`, mức cao nhất bé đạt), không thêm sao. Không bao giờ trừ sao.
- **Sao khung:** `frame:<khóa khung>` = số `concept` khác nhau bé đã nói **cả câu** với khung đó, gộp mọi bài (Weather + Colors cùng cộng cho *it is ___*). Góc bố mẹ thấy: *"Bé nói được khung **It is ___** với 7 từ"*.
- **Từ vựng:** từ khóa bé nói (bất kỳ mức nào) ghi "đã luyện" cho `concept` ở kho chung.
- **Ghi âm:** như Từ vựng, mỗi câu tối đa 1 bản ghi / ngày, lưu bản đầu tiên có tiếng. Góc bố mẹ nghe lại bé nói *"It is sunny!"*.
- **Ôn tập / Học cùng Bông:** lấy thêm câu mẫu theo mục 4.5 (kiểu phần C: hình → bé nói câu).

## 6. Ảnh
- Ưu tiên ảnh có sẵn của `concept` (cùng phong cách tròn, nền nhạt như tranh). Không có ảnh thì emoji to trong vòng màu.
- Không dùng nguyên tấm tranh khung câu làm một ảnh: ảnh không biết vùng nào là hình nào, không chạm / trượt được.

## 7. Trạng thái và ca biên
```
intro → explore (chạm) → say (4 hình) → yourTurn (3 hình) → game (2 câu) → song → reward
```
- Lưu chỗ dừng **sau mỗi bước** (như bài học khác); Học tiếp / Học lại.
- ▶ bỏ qua bước đang làm; 🏠 thoát. Đổi bước thì câu nói / hoạt ảnh / hẹn giờ chờ cũ dừng ngay (mã lượt).
- Chạm hình **trong lúc Bông đang nói** ở phần A: bỏ qua (không chen câu). 👆 Show me cũng chờ Bông nói xong.
- Không có mic: phần B, C dùng **chế độ chỉ nghe** (*"Your turn!"*, chờ 3 giây, Bông nói mẫu); không có sao câu từ lượt đó.
- **Giảm chuyển động:** hình không trượt mà hiện thẳng trong chỗ trống; chỗ trống không nhấp nháy mà gạch dưới đậm; mây ở trò ló dần mờ dần thay vì bay.

## 8. Dữ liệu
```json
{ "version": 1, "kind": "patterns", "builtin": "patterns-weather",
  "title": "Weather", "titleVi": "Thời tiết", "emoji": "🌦️",
  "frame": "It is ___.", "frameVi": "Trời ___.", "frameId": "it is ___",
  "prompt": "What's the weather? Tell me!", "promptVi": "Trời thế nào? Con nói đi!",
  "ask": "What's the weather today?", "askVi": "Hôm nay trời thế nào?",
  "words": [
    { "word": "sunny", "concept": "sunny", "emoji": "☀️", "vi": "nắng", "sentenceVi": "Trời nắng." },
    { "word": "eggs", "concept": "egg", "article": "none", "emoji": "🥚", "vi": "trứng", "sentenceVi": "Con thích trứng." }
  ] }
```
- `concept`: tên chuẩn của thứ trong hình (số ít), dùng tìm ảnh và ghi tiến độ; thiếu thì lấy `word`.
- `prompt` (phần C) thiếu thì dùng *"Tell me!"*; `ask` không bắt buộc.
- `validatePatternLesson` (báo lỗi, không tự sửa nội dung): khung có đúng một `___`; 4–6 từ; `word` / `concept` không trùng; `article` hợp lệ. Chỉ tự điền chỗ **thiếu**: `concept` ← `word`, `sentenceVi` ← ghép từ `frameVi` + `vi`.
- Bài có sẵn có `builtin` cố định, tự thêm vào máy cũ **một lần** (như bài số, phonics).

## 9. Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **P1a** — tranh | Nút Mẫu câu, danh sách; màn "tranh khung câu" (iPad); phần A (chạm → trượt vào chỗ trống → đọc câu, ✓, nhắc 10 giây, 👆 Show me, tự chọn một hình); bài Weather | Chạm hình → đúng câu; không tự đi liền nhiều hình |
| **P1b** — nói | Phần B (4 hình, nối dần), nhận câu 3 mức, sao câu, ghi lần luyện | Ba mức đúng bảng mục 3.B; chỉ "cả câu" có sao |
| **P1c** — hoàn thiện | Lưu chỗ dừng / Học tiếp; điện thoại dọc; bài Animals (mạo từ); kết thúc + sticker | Ra nền rồi quay lại đúng bước; điện thoại không tràn ngang |
| **P2** | Phần C, D (3 kiểu trò chơi, quy tắc chọn); bài hát cuối; 6 bài có sẵn còn lại; sao khung; ghi âm | Gợi ý chữ mờ; không lặp kiểu trò chơi chính; sao khung gộp 2 bài |
| **P3** | Tạo bài mẫu câu (prompt + dán JSON, báo lỗi rõ), ảnh lưới 3 × 2; Ôn tập / Học cùng Bông lấy câu mẫu | Bài lỗi bị từ chối kèm lý do; ảnh dùng lại đúng `concept` |

## 10. Kiểm thử
**Unit**
- Ghép câu: `It is ___.` + sunny → *It is sunny.*; `I can see {a} ___.` + egg (`auto`) → *an egg*; + horse → *a horse*; + unicorn (`a`) → *a unicorn*; `I have {a} ___.` + eyes (`none`) → *I have eyes.*
- Nhận câu: *"it is rainy"* → cả câu; *"it's rainy"* → cả câu; *"is rainy"* → một phần; *"rainy"* → từ khóa; *"it is"* → có tiếng; *"I can see duck"* (thiếu *a*) → cả câu; *"I like egg"* với *eggs* → cả câu.
- Khóa khung: *"It is ____."*, *"it is ___"*, *"It is ___!"* → cùng `it is ___`.
- Kiểm tra bài: 0 hoặc 2 chỗ trống → lỗi; 3 từ / 7 từ → lỗi (không cắt); từ trùng → lỗi; `article: "the"` → lỗi.
- Chọn hình (mục 4.5): từ chưa có sao đứng trước; bằng sao thì luyện cũ hơn đứng trước.
- Chọn trò chơi: 50 lần liên tiếp không lần nào trùng kiểu chính với lần trước; bài không có `ask` không bao giờ ra `realLife`.
- Sao câu chỉ tăng ở mức cả câu; sao khung gộp 2 bài cùng khung.

**UI (chế độ nhanh)**
- Mở Weather → *"Weather! It is …"* → Bông chạm mẫu *sunny* → bé chạm *rainy* → hình vào chỗ trống, *"It is rainy!"*, vòng rainy có ✓.
- Không chạm 10 giây → *"Tap a picture!"*; thêm 10 giây → Bông chọn đúng **một** hình rồi dừng chờ.
- Phần B: giả nhận dạng *"rainy"* → *"Yes! Rainy! It is rainy!"* + mời nói lại một lần; giả *"it is rainy"* → *"Great job!"*, sao câu +1; giả *"is rainy"* → *"Good! It is rainy!"*, không có sao.
- Phần D (listenTap): chạm sai → *"That's a pig! Can you find the duck?"* (không có "Try again"); sai lần 2 → *"Look! Here's the duck!"*.
- Phần C: 4 giây im lặng → chữ mờ trong chỗ trống.
- Ra nền rồi quay lại: Học tiếp đúng bước.
- Điện thoại dọc: lưới, không tràn ngang.

**Thử tay với bé:** bé có nói được cả câu không hay chỉ từ (nếu chỉ từ thì giữ "nối dần" cho cả 4 hình); bài có quá dài không; bé có thích 👆 Show me không; bài hát cuối có vui không.

## 11. Câu hỏi đã chốt
1. **Nút riêng** "🌸 Mẫu câu" trên màn hình chính, không đặt trong mục Câu nói.
2. **Không bắt buộc** học bài Từ vựng cùng chủ đề trước. Phần A + B đã dạy từ.
3. Sao câu chỉ cho **cả câu** = từ khóa + đủ mọi từ chính của khung (mạo từ không bắt buộc). Một phần câu / chỉ từ khóa được khen và ghi lần luyện, không có sao.
4. v1 chỉ khung **đúng một** chỗ trống; khung 2 chỗ trống để sau.

## 12. Ghi chú khi code (0.61.0)
- **Chưa làm:** Ôn tập / Học cùng Bông lấy câu mẫu (mục 5, mốc P3). Bài mẫu câu chưa vào Ôn tập, Trò chơi tổng hợp, Học cùng Bông.
- **Tên trường:** bài lưu danh sách hình ở `slots` (không phải `words`), để các phần dành cho bài từ vựng (Ôn tập, tạo bài, Bắt bong bóng…) không nhầm bài mẫu câu là bài từ vựng. Bài AI trả về viết `words` vẫn nhận (đổi thành `slots` khi lưu).
- **Sao khung** không lưu bản ghi `frame:` riêng mà **tính** từ các bản ghi `pattern:<khung>|…` có sao (cùng kết quả, không lệch nhau).
- **Câu đời thật** có thêm `askTail` (*today*): *It is cloudy today!*, *I am happy today!*; bài Food không có (*I like milk!*).
- **Nghe câu bé nói:** `listen()` nhận cách so khớp riêng và trả về các phương án nhận dạng (`heard`). Mẫu câu chỉ **dừng nghe sớm khi bé nói đủ câu** (dừng khi mới nghe từ khóa thì cắt ngang lúc bé đang nói).
- **Từ khóa tìm trong phần ngoài khung:** so lỏng theo âm thì *it* ≈ *hot*, nên *"it is"* từng bị tính là đủ câu *It is hot*; giờ bỏ các từ của khung trước khi tìm từ khóa.
- **Phần D, chạm nhầm:** khung có `{a}` (danh từ) thì *"That's a pig! Can you find the duck?"*; khung khác thì Bông đọc câu của hình vừa chạm (*"It is sunny! Can you find rainy?"*).
- **Ló dần:** mây có 3 lớp, mỗi lần chạm bớt một lớp; còn một lớp thì Bông hỏi `prompt` và nghe bé đoán (4 giây). Chữ dưới hình ẩn khi còn mây.
- **Màn hình chính 9 nút:** 5 + 4 trên màn rộng, 3 × 3 trên iPhone / iPad dọc (đã chụp thử iPad 1180 × 820 và iPhone 390 × 664: vừa khít, không cuộn).
- **Sửa kèm:** "chữ ký" bài khi khôi phục sao lưu của *Đếm hình* và *Đếm hình mới* trùng nhau (cùng chế độ, cùng số 1–10); giờ có thêm `set`.
