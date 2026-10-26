# SPEC — 🗨️ Chủ đề mới cho "Nói chuyện với Bông"

> Phiên bản spec: **draft2** (sửa theo review QA, mục 10) · Ngày: 2026-10-26 · **TT1 đã làm** (app 0.38.0). Bổ sung cho `SPEC-talk.md` (khung bài, kiểu lượt, cuộc gọi 📞, tiến độ — **không đổi**).
> Bố mẹ chọn: thêm cả 4 nhóm **Sinh hoạt hằng ngày · Đi chơi · Đồ chơi & chơi cùng · Lễ phép & nhờ giúp**; mỗi bài **6–8 lượt** như bài hiện có (~2–3 phút).

## 1. Mục tiêu
- Bé nghe và nói những câu tiếng Anh **dùng được ngay trong ngày**: lúc ăn, tắm, đi ngủ, ra công viên, chơi đồ chơi, xin – cảm ơn – xin lỗi.
- Bố mẹ nói lại được các câu này ngoài đời (*"Wash your hands!"*, *"More, please?"*, *"Good night!"*) → bé gặp câu nhiều lần.
- Chỉ dùng **6 kiểu lượt đã có** (`greeting`, `free`, `choice`, `yesNo`, `askBack`, `action`), các nét mặt và hiệu ứng đã có → chủ yếu là **thêm nội dung**, ít code, ít rủi ro.

## 2. Vị trí trong app
- 8 bài có sẵn mới, thêm vào danh sách **Talk with Bông**. Danh sách đã tự chia **tab chủ đề** (như tab 🐍 Sounds bên Phonics):

| Tab | Bài |
|---|---|
| ⭐ All | tất cả 13 bài |
| 👋 Talk | 5 bài hiện có (giữ nguyên) |
| 🏠 Every day | 🍽️ Mealtime · 🛁 Bath time · 🌙 Bedtime |
| 🌳 Out & about | 🛝 At the park · ☀️ Weather |
| 🧸 Play | 🧸 My toys · 🙈 Hide and seek |
| 🙏 Manners | 🙏 Please & thank you |

- Tab chỉ hiện khi có **từ 2 giá trị `topic` khác nhau** (một tab chỉ có 1 bài vẫn được, như 🙏 Manners).
- Thẻ **⭐ Ôn từ đã học** không thuộc tab nào: luôn ở **cuối lưới của mọi tab**, không tính là bài.
- Bài **tự thêm một lần** trên máy đã dùng app: app ghi danh sách **mã bài** đã thêm (`talkLessonsSeeded`); mỗi lần mở app, thêm các mã chưa có trong danh sách — **không phụ thuộc** `TALK_BUILTIN_VERSION`. Máy mới: đủ 13 bài. Máy cũ: thêm đúng 8 bài, một lần, không trùng, không đụng tiến độ / ảnh / tên bài của 5 bài cũ.
- Bài mở được ngay, không khóa. Mỗi bài vẫn mở đầu bằng **📞 cuộc gọi** (nếu bật), có Học tiếp / Học lại, Hoan hô + sticker.

## 3. Nội dung 8 bài
Ký hiệu: **B:** Bông nói · **Bé:** câu mẫu cho bé nói (bong bóng chat; bé nói hoặc chạm) · **→** Bông đáp · 👍 / 👎 hai nhánh của `yesNo`. `{name}` = tên bé trong hồ sơ.

Hành vi từng kiểu lượt **giữ nguyên như `SPEC-talk.md`** (không tạo hành vi mới):
- `greeting` / `free`: Bông nói → bé nói câu mẫu (hoặc chạm bong bóng) → Bông đáp.
- `choice`: Bông hỏi → bé chạm 1 hình → Bông đọc câu mẫu **của hình đó** → bé nói theo → Bông đáp **câu riêng của hình đó**. Không có đáp án sai (bé chọn theo ý mình).
- `yesNo`: như `choice` với 2 nút 👍 / 👎; **mỗi nhánh có câu mẫu và câu đáp riêng** (không bắt buộc là "Yes/No" — vd. 👍 *"More, please!"* / 👎 *"All done!"*).
- `askBack`: Bông mời (*"Now you ask me!"*) → bé nói câu hỏi mẫu (chạm để nghe) → Bông trả lời **một câu cố định** (không phụ thuộc lượt trước).
- `action`: bé chạm hình → hiệu ứng + Bông đáp → tự sang lượt sau.
- Mỗi lượt ghi tiến độ **một lần mỗi lượt học**; chạm nhanh nhiều lần không tính thêm (luật hiện tại).

### 🏠 3.1 🍽️ Mealtime — Giờ ăn
1. *(action 🧼)* B: *"Wash your hands first!"* — chạm → *"Scrub, scrub! Clean hands!"* 👏
2. *(yesNo)* B: *"Are you hungry?"* — 👍 *"Yes, I am!"* → *"Let's eat!"* / 👎 *"No, I'm not!"* → *"Okay! Let's eat when you're ready."*
3. *(choice, kho `foods` như bài cũ)* B: *"What do you want to eat?"* — Bé: *"Rice, please!"*… → Bông đáp câu riêng của món như bài cũ (vd. *"Yummy! A yellow banana!"*; món thích của bé theo hồ sơ → *"I know! You like rice!"*, xem mục 5).
4. *(free)* B: *"Is it yummy?"* — Bé: *"Yummy, yummy!"* → *"Yummy in my tummy!"*
5. *(yesNo)* B: *"Do you want more?"* — 👍 *"More, please!"* → *"Here you are!"* / 👎 *"All done!"* → *"Okay! All done!"*
6. *(askBack)* *"Now you ask me!"* — Bé: *"Are you hungry?"* → *"Yes! I want a carrot! Crunch, crunch!"* 🥕
7. *(action 😋)* B: *"Rub your tummy!"* — chạm → *"Mmm! Full tummy!"* 💕

### 🏠 3.2 🛁 Bath time — Tắm & đánh răng
1. *(yesNo, hình bồn tắm 🛁)* B: *"Is it bath time?"* — 👍 *"Yes!"* → *"Yay! Splash time!"* / 👎 *"Not yet!"* → *"Okay! Let's brush our teeth first!"*
2. *(choice)* B: *"What's in the bath?"* (3 hình: vịt cao su, thuyền đồ chơi, bong bóng xà phòng) — 🦆 *"A duck!"* → *"Quack, quack!"* · ⛵ *"A boat!"* → *"Toot, toot!"* · 🫧 *"Bubbles!"* → *"Pop, pop, pop!"*
3. *(action 💦)* B: *"Splash, splash!"* — chạm → *"Wow! Big splash!"* 🎉
4. *(free)* B: *"Wash your hair. Rub, rub!"* — Bé: *"Rub, rub!"* → *"So clean!"*
5. *(action 🪥)* B: *"Brush your teeth! Brush, brush, brush!"* — chạm → *"Shiny teeth!"* 🎉
6. *(askBack)* *"Now you ask me!"* — Bé: *"Did you brush your teeth?"* → *"Yes! Look! So shiny!"* (Bông cười tươi)
7. *(action 😁)* B: *"Show me your smile!"* — chạm → *"What a clean smile!"* 💕

### 🏠 3.3 🌙 Bedtime — Đi ngủ
1. *(yesNo)* B: *"Are you sleepy?"* — 👍 *"Yes, I am."* → *"Let's get ready for bed."* (Bông buồn ngủ) / 👎 *"No, I'm not!"* → *"Okay! One more story!"*
2. *(action 👕)* B: *"Put on your pajamas!"* — chạm → *"Cozy pajamas!"* 👏
3. *(choice)* B: *"What do you sleep with?"* — 🧸 *"My teddy!"* → *"Hello, teddy!"* · 🐰 *"My bunny!"* → *"Like me!"* · 🛏️ *"My blanket!"* → *"So warm!"* (hình chăn: `draw` ghi rõ "a soft blanket")
4. *(choice)* B: *"Which story?"* — 🐻 *"The bear story!"* → *"Once upon a time, a big brown bear…"* · 🚀 *"The rocket story!"* → *"Once upon a time, a rocket flew to the moon…"* · 🐟 *"The fish story!"* → *"Once upon a time, a little fish…"*
5. *(action 🥱)* B: *"Big yawn! Aaah!"* — chạm → *"Sleepy, sleepy…"* (Bông buồn ngủ)
6. *(greeting)* B: *"Good night, {name}!"* — Bé: *"Good night!"*
7. *(askBack)* *"Now you say good night to me!"* — Bé: *"Good night, Bông!"* → *"Good night! Sweet dreams!"*
8. *(action 😴)* B: *"Close your eyes. Shh…"* — chạm → *"Sleep tight!"* 💕
- Câu kết của bài này nhỏ nhẹ: *"Sweet dreams, {name}!"* (chưa có tên: *"Sweet dreams!"*), thay câu kết chung.

### 🌳 3.4 🛝 At the park — Công viên
1. *(yesNo)* B: *"Do you want to go to the park?"* — 👍 *"Yes! Let's go!"* → *"Yay! Let's go!"* / 👎 *"No, thank you."* → *"Okay! Maybe next time! Let's pretend!"* (bài vẫn đi tiếp như chơi giả vờ)
2. *(action 👟)* B: *"Put on your shoes!"* — chạm → *"Ready! Let's go!"* 👏
3. *(choice)* B: *"What do you want to play?"* — 🛝 *"The slide!"* → *"Whee! Down we go!"* · 🎠 *"The swing!"* (`draw`: xích đu) → *"Up and down! Up and down!"* · ⚽ *"The ball!"* → *"Kick! Goal!"*
4. *(action 🏃)* B: *"Run, run, run!"* — chạm → *"You are so fast!"* 🎉
5. *(askBack)* *"Bông is too slow! Say it!"* — Bé: *"Wait for me!"* → *"Okay! I'm waiting for you!"* (Bông ngạc nhiên)
6. *(choice)* B: *"What can you see?"* — 🐦 *"A bird!"* → *"Tweet, tweet!"* · 🐶 *"A dog!"* → *"Woof, woof!"* · 🌸 *"A flower!"* → *"So pretty!"*
7. *(action 👋)* B: *"Time to go home! Wave bye-bye to the park!"* — chạm → *"Bye-bye, park! See you soon!"* 💕

### 🌳 3.5 ☀️ Weather — Thời tiết & mặc gì
1. *(choice)* B: *"What's the weather like today?"* — ☀️ *"It's sunny!"* → *"Sunny! Let's put on a hat!"* · 🌧️ *"It's rainy!"* → *"Rainy! Let's get an umbrella!"* · 🥶 *"It's cold!"* → *"Brr! Let's put on a coat!"*
2. *(choice)* B: *"What do you need?"* — 🧢 *"My hat!"* → *"Here's your hat!"* · ☂️ *"My umbrella!"* → *"Here's your umbrella!"* · 🧥 *"My coat!"* → *"Here's your coat!"*
3. *(action 🌧️)* B: *"Make the rain! Pitter-patter!"* — chạm → *"Pitter-patter, pitter-patter!"* 🎉
4. *(yesNo, hình ☔)* B: *"Do you like the rain?"* — 👍 *"Yes, I do!"* → *"Me too! Splash in the puddles!"* / 👎 *"No, I don't!"* → *"That's okay! Let's stay inside!"*
5. *(askBack)* *"Now you ask me!"* — Bé: *"Do you like the sun?"* → *"Yes! I like the sun! It's warm!"* (Bông vui). Câu đáp `askBack` cố định nên không hỏi thời tiết hôm nay — tránh mâu thuẫn với lựa chọn ở lượt 1.
6. *(action 🌈)* B: *"Look! A rainbow! Say wow!"* — chạm → *"Wow! So pretty!"* 🎉
7. *(free)* B: *"Bye-bye, rain! Hello, sun!"* — Bé: *"Hello, sun!"* → *"The sun says hello!"* (Bông vui)

### 🧸 3.6 🧸 My toys — Đồ chơi
1. *(free, hình ⚽)* B: *"What's this?"* — Bé: *"It's a ball!"* → *"Yes! A ball! Bounce, bounce!"*
2. *(free, hình 🚗)* B: *"What's this?"* — Bé: *"It's a car!"* → *"Beep, beep!"*
3. *(choice)* B: *"What do you want to play with?"* — 🧸 *"My teddy!"* → *"Big hug, teddy!"* · 🧱 *"My blocks!"* → *"Build it up! Tall, tall!"* · 🚂 *"My train!"* → *"Choo-choo!"*
4. *(askBack)* *"Now you ask me!"* — Bé: *"Can I play too?"* → *"Yes! Let's play together!"*
5. *(yesNo)* B: *"Can I have a turn?"* — 👍 *"Yes, here you are!"* → *"Thank you! You are so kind!"* / 👎 *"Not now!"* → *"Okay! I can wait!"*
6. *(greeting)* B: *"I had a turn. Now it's your turn!"* — câu mẫu bé nói theo: *"My turn!"*
7. *(action 🧺)* B: *"Tidy up time! Put the toys away!"* — chạm → *"All clean! Good job!"* 👏

### 🧸 3.7 🙈 Hide and seek — Trốn tìm
1. *(yesNo)* B: *"Let's play hide and seek! Okay?"* — 👍 *"Okay!"* → *"Yay!"* / 👎 *"No, thank you."* → *"Okay! Maybe next time! Let's pretend!"*
2. *(action 🙈)* B: *"Close your eyes and count! One, two, three!"* — chạm → *"Ready or not, here I come!"* 🎉
3. *(askBack)* *"Now you call me!"* — Bé: *"Where are you, Bông?"* → *"I'm here! Can you find me?"*
4. *(choice)* B: *"Where am I?"* — 🛏️ *"Under the bed!"* → *"Peekaboo! I was under the bed!"* · 📦 *"In the box!"* → *"Peekaboo! I was in the box!"* · 🌳 *"Behind the tree!"* → *"Peekaboo! I was behind the tree!"* (Bông ngạc nhiên). `draw` vẽ **thỏ trắng nấp đúng chỗ đó** (dưới gầm giường, trong hộp, sau cây).
5. *(greeting)* B: *"Peekaboo!"* — Bé: *"Peekaboo!"*
6. *(action 🫣)* B: *"Your turn to hide! Cover your eyes!"* — chạm → *"Where is {name}? … There you are!"* 💕 (chưa có tên: *"Where are you? … There you are!"*)
7. *(yesNo)* B: *"Do you want to play again?"* — 👍 *"Yes, again!"* → *"Yay! Next time, okay?"* / 👎 *"No, thank you."* → *"Okay! That was fun!"*

### 🙏 3.8 🙏 Please & thank you — Lễ phép
1. *(choice, kho `foods`)* B: *"What do you want?"* — Bé: *"Rice, please!"*… → *"Good asking! You said please!"* (câu đáp chung của lượt, thay câu riêng của món)
2. *(free)* B: *"Here you are!"* — Bé: *"Thank you!"* → *"You're welcome!"*
3. *(yesNo, hình 🥕)* B: *"Oops! I dropped my carrot. Can you help me?"* — 👍 *"Yes, I can!"* → *"Thank you! You are so kind!"* / 👎 *"Not now."* → *"That's okay. I can do it!"*
4. *(askBack)* *"Now you ask Bông for help!"* — Bé: *"Help me, please!"* → *"Of course! I can help you!"*
5. *(free)* B: *"Oh! I bumped you. I'm sorry!"* (Bông buồn) — Bé: *"That's okay!"* → *"Thank you! Friends?"*
6. *(askBack)* *"Now you ask me!"* — Bé: *"Can I have a cookie, please?"* → *"Yes! Here you are!"* 🍪
7. *(action 🙏)* B: *"Let's say thank you! Hands together!"* — chạm → *"Thank you! You're welcome!"* 💕 (không yêu cầu ôm)

## 4. Hình và ảnh
- Mặc định là emoji. Mỗi lượt / lựa chọn có **mô tả hình** (`draw`, bằng chữ) cho prompt ảnh lưới → bố mẹ thay bằng ảnh được ở Góc bố mẹ → bài → "Ảnh cho từng hình" (như 5 bài cũ, SPEC-talk 13.3). Chưa có ảnh thì emoji.
- Hình nào emoji chưa rõ (xích đu 🎠, chăn 🛏️, chỗ nấp của Bông) thì `draw` ghi rõ để ảnh thay đúng.
- Không có ảnh người thật trong bài có sẵn (bài chia sẻ được lên Thư viện bài, repo công khai).

## 5. Tiến độ và dữ liệu
- Như bài hội thoại cũ: mỗi lượt một khóa `talk:<mã bài>:<mã lượt>` (mã bài cố định: `talk-meal`, `talk-bath`, `talk-bed`, `talk-park`, `talk-weather`, `talk-toys`, `talk-hide`, `talk-manners`).
- Lượt chọn món ở bài 3.1 và 3.8 dùng kho `foods` + `remember: 'food'` **như bài "How are you?" hiện có**: "món thích" là ô **Món thích** do bố mẹ chọn trong *Hồ sơ của bé* (lưu theo **mã món**); lượt chọn **không ghi đè** ô này. Bé chọn đúng món thích → *"I know! You like rice!"*; chọn món khác → câu đáp thường; hồ sơ chưa có món thích → luôn câu đáp thường (không lỗi).
- Sticker, Học tiếp / Học lại: **theo luật chung hiện tại của app** (spec này không đổi); Học lại không xóa tiến độ.
- `{name}` khi chưa có tên: dùng bản câu không tên (`…NoProfile`) như bài cũ — không bao giờ đọc nguyên văn `{name}`.

## 6. Code cần đổi (ít)
- `talk.js`: thêm 8 bài vào `builtInTalkLessons()`, mỗi bài có `topic` riêng (`Every day`, `Out & about`, `Play`, `Manners`); 5 bài cũ giữ `topic: 'Talk'`.
- Emoji cho tab chủ đề mới (🏠 🌳 🧸 🙏) ở chỗ map emoji của tab.
- Câu kết riêng cho Bedtime (`outro` của bài — trường đã có), có bản không tên.
- **Không** đổi `TALK_BUILTIN_VERSION` (5 bài cũ không đổi; bài mới được thêm theo mã bài — mục 2).

## 7. Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **TT1** | 8 bài (mục 3) + 4 tab chủ đề + tự thêm bài trên máy cũ | Unit + UI ở mục 8 qua; chơi hết một bài mỗi tab → sticker |

## 8. Kiểm thử
**Unit**
- Cả 13 bài có sẵn qua `validateTalkLesson`; mã bài không trùng; mã lượt không trùng trong bài; mỗi bài 6–8 lượt.
- Mỗi lựa chọn `choice` có câu đáp riêng (trừ lượt dùng kho `foods`); mỗi nhánh `yesNo` có câu mẫu + câu đáp.
- Mọi hình (lượt, động tác, lựa chọn) có `draw` bằng chữ; hai hình khác nhau không trùng `draw`.
- Không hồ sơ (không tên, không món thích): mọi câu sau khi ghép không còn `{…}`; Bedtime kết bằng *"Sweet dreams!"*.

**UI** (theo bảng TC của review)
| ID | Ca | Kết quả mong đợi |
|---|---|---|
| TC01 | Cài mới | 13 bài; tab ⭐ All / 👋 Talk / 🏠 Every day / 🌳 Out & about / 🧸 Play / 🙏 Manners, đúng số bài mỗi tab |
| TC02–04 | Máy cũ đã có 5 bài (có tiến độ, đã đổi tên một bài) → mở app 2 lần | Thêm đúng 8 bài, không trùng; 5 bài cũ giữ tiến độ, tên |
| TC05–06 | Chọn một lựa chọn `choice` / nhánh 👎 `yesNo` | Bông đọc đúng câu mẫu và câu đáp của lựa chọn / nhánh đó |
| TC08–09 | Chơi hết Bedtime có tên / không tên | Câu kết *"Sweet dreams, Na!"* / *"Sweet dreams!"*, không đọc `{name}` |
| TC10 | Please & thank you, hồ sơ không có món thích | Câu đáp thường, không lỗi |
| TC13 | Thẻ ⭐ Ôn từ đã học | Ở cuối lưới ở mọi tab, không tính là bài |
| TC14 | Chơi hết một bài mỗi tab mới | Hết bài → sticker |
- TC07 (chạm nhanh), TC11 (ảnh thay), TC12 (Học lại) dùng chung code với 5 bài cũ và đã có test — không viết lại.
- **Thử tay với bé:** câu nào dài quá bé không nói theo được thì rút ngắn ở bản sau.

## 9. Cần bố mẹ chốt
1. Danh sách câu ở mục 3 — có câu nào muốn đổi / bỏ / thêm (ví dụ món ăn, đồ chơi quen của bé)?
2. 5 bài cũ để ở tab **"👋 Talk"** — hay đổi tên tab thành **"👋 Me & you"** cho rõ hơn?

## 10. Trả lời review QA (draft2)
| Điểm review | Xử lý |
|---|---|
| P1 seed khi không đổi `TALK_BUILTIN_VERSION` | Đã đối chiếu code: seed theo **mã bài** (`talkLessonsSeeded`), không theo số phiên bản → máy cũ vẫn nhận 8 bài, một lần. Ghi ở mục 2 + test TC02–04. Không cần biến mới. |
| P1 kiểu lượt khớp câu trả lời (*More, please!* / *All done!*) | `yesNo` hiện có cho mỗi nhánh câu mẫu + câu đáp riêng → không sửa logic chung. Hành vi 6 kiểu ghi ở đầu mục 3; đánh dấu 👍 / 👎 từng nhánh. |
| P1 tôn trọng lời từ chối | Park, Hide and seek: *"Okay! Maybe next time!"*; Mealtime: *"Let's eat when you're ready."*; Please & thank you: bỏ "hug", thành *"Let's say thank you! Hands together!"*. |
| P1 quy tắc chuyển lượt | Theo `SPEC-talk.md`, tóm tắt ở đầu mục 3 (không tạo hành vi mới). |
| Bedtime *"Who sleeps with you?"* | Đổi *"What do you sleep with?"*. |
| Weather `askBack` mơ hồ | Câu đáp `askBack` cố định → đổi thành *"Do you like the sun?"* → *"Yes! I like the sun! It's warm!"*. |
| Câu đáp chung cho nhiều lựa chọn | Mỗi lựa chọn có câu đáp riêng (chọn truyện, đồ cần mang, chỗ nấp). |
| My toys *"My turn! … your turn"* | Ghi rõ: Bông nói *"I had a turn. Now it's your turn!"*, bé nói theo *"My turn!"*. |
| `remember: 'food'` | Là ô **Món thích** do bố mẹ nhập (mã món), lượt chọn không ghi đè → *"You like rice"* đúng nghĩa; chưa có món thích → câu đáp thường. |
| Sticker một lần / Học lại | Theo luật chung hiện tại của app, spec này không đổi. |
| Tab Manners 1 bài, điều kiện "từ 2 chủ đề" | Đúng: điều kiện là ≥ 2 giá trị `topic`; ghi ở mục 2. |
| Thêm test TC01–TC14 | Đưa vào mục 8; TC07 / TC11 / TC12 dùng chung code đã có test. |
