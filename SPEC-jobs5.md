# SPEC — 👨‍🍳 Đầu bếp nhí: ca "Bé đói rồi!" (bé chọn món, bé nấu)

> Phiên bản spec: **draft2** (sửa theo review, mục 10) · Ngày: 2026-11-18 · Dựa trên app 0.81.0. **Bố mẹ đã duyệt draft2 (2026-11-18)**, chốt theo mục 9; làm theo 2 bản ở mục 8. **Đã làm:** 0.82.0 (C4) — ghi chú mục 11.
> - **draft2, sửa theo review:**
>   - lượt nói **mặc định tắt**, không ghi âm, chỉ dùng nhận dạng khi cài đặt "Dùng nhận dạng giọng nói" bật, có lỗi gì cũng bỏ qua (5);
>   - mức 3 chọn sai cảm xúc thì chọn lại ngay (3);
>   - salad mức 2 luôn có chuối (4.2);
>   - cách đếm thao tác (2);
>   - ca E là ca nghề cuối, trước dọn bếp (6);
>   - pizza: đế và nhân chuẩn bị sẵn, thời gian chờ cụ thể (4.1, 4.3);
>   - dọn bếp tránh cả nguyên liệu lẫn dụng cụ của ca E (6);
>   - tách dữ liệu học / dữ liệu cân bằng (7);
>   - Bông ăn cùng chỉ là hoạt ảnh (4.3);
>   - test JOBS5-11…22 (8).
> - draft1: ý tưởng, ba món, lượt nói, xếp ca, tiến độ, test JOBS5-01…10.
>
> Bổ sung cho `SPEC-jobs3.md` mục 5 (Đầu bếp nhí) và `SPEC-jobs4.md` mục 3 (ca D, dọn bếp). Mọi cách chơi hiện có của Đầu bếp **giữ nguyên**, trừ cách xếp ca trong lượt (mục 6).

## 1. Ý tưởng
Ở mọi ca hiện có, **khách gọi món, bé nghe rồi làm theo** (giống trò Bán hàng: bé luôn là người phục vụ). Ca mới đảo vai:

1. Bụng **bé** kêu "ọc ọc". Chú đầu bếp hỏi: *"Are you hungry? What do you want?"*
2. Chú đưa **thực đơn bằng hình**. **Bé tự chọn** món mình thích. Không có đáp án sai ở bước này.
3. Chú: *"A rice ball! Let's make it together!"* Bé và chú cùng nấu món đó theo từng bước.
4. Bé "ăn", Bông ăn cùng: *"Yummy!"* → *"I'm full!"* → sang dọn bếp hoặc sticker.

Ca này **khác trò Bán hàng** ở hai chỗ:
- Bé là người **chọn** món mình muốn, và có thể **nói** món đó (*"Rice ball, please!"*) nếu bố mẹ bật lượt nói.
- Sau khi chọn, bé **tự nấu** món đó qua các động từ mới.

Món không trùng quầy sinh tố của Bán hàng.

## 2. Luật chung
- Giữ toàn bộ luật của `SPEC-jobs3.md` mục 2 và `SPEC-jobs4.md` mục 1:
  - kế hoạch lượt tái tạo được theo seed;
  - ≤ 5 thao tác con mỗi ca;
  - chỉ ghi tiến độ khi đúng ngay lần đầu;
  - ra nền thì quay lại đúng bước;
  - dữ liệu thiếu thì dùng hình dự phòng.
- **Không dao, không lửa bếp**, kể cả trong hoạt ảnh.
  - Cơm đã nấu sẵn trong nồi cơm điện đóng nắp.
  - Hoa quả đã rửa sẵn. Chuối bé tự bóc bằng tay.
  - Đế pizza **đã nặn sẵn** trên khay. Cà chua, nấm, ô liu **đã thái lát sẵn** trong bát.
  - Pizza vào lò đóng cửa có đèn cam, như bánh nướng.
- **Bé chọn món là lựa chọn, không phải câu hỏi.** Chạm thẻ nào cũng đúng, không tính nhầm, không ghi tiến độ cho bước chọn.
- **Ảnh món:** dùng ảnh món của Cho Bông ăn (`feed.js`: *rice-ball, banana, apple, strawberry, pizza…*), kể cả ảnh bố mẹ đã thêm. Thiếu ảnh thì dùng emoji.
- **Cách đếm "≤ 5 thao tác con"** (giới hạn này dùng khi **lập kế hoạch** ca, để ca không quá dài; nó **không** chặn bé giữa chừng):

  | Loại chạm | Tính vào 5? |
  |---|---|
  | Chọn nguyên liệu (quả, lát nhân) | Có |
  | Thực hiện động từ (scoop, peel, spread, bake…) | Có |
  | Chọn cảm xúc (mức 3, mục 3) | Không |
  | Chọn món | Không |
  | Ăn (3 lần chạm) | Không |
  | Lượt nói | Không |
  | Chạm nhầm | Không. Nhầm chỉ tăng số lỗi (sao, đáp án nhún từ lần nhầm thứ hai như mọi ca); bé **luôn** làm tiếp được, không bao giờ kẹt vì nhầm nhiều |

## 3. Mở đầu ca: "Are you hungry?"
| Mức | Diễn biến | Bé làm |
|---|---|---|
| 1 | Bụng kêu (sfx). Chú: *"Are you hungry?"* → Bông nói mẫu: *"Yes! I'm hungry!"* (Bông xoa bụng) | — (nghe) |
| 2 | Như mức 1 | Như mức 1. Nếu bố mẹ bật lượt nói, bé được mời nói *"I'm hungry!"* (mục 5) |
| 3 | Bụng kêu. Chú hỏi: *"How do you feel?"*, hiện **3 thẻ mặt** của bài Feelings: 😋 *hungry*, 😴 *sleepy*, 😊 *happy* | Chạm 😋 → *"You're hungry! Let's cook!"* |

**Mức 3 chạm thẻ sai (😴 / 😊):**
1. Thẻ sai rung nhẹ rồi về chỗ. Thẻ 😋 và các thẻ khác **giữ nguyên** trên màn.
2. Chú: *"That's sleepy."* (hoặc *"That's happy."*). Bụng kêu lại "ọc ọc", rồi chú: *"Listen! How do you feel?"*
3. Bé chọn lại ngay, không quay lại màn trước, không bắt đầu lại ca. Tính nhầm.
4. Nhầm lần thứ hai: thẻ 😋 nhún, như đáp án nhún ở mọi ca.
5. *hungry* chỉ ghi tiến độ khi chọn đúng **ngay lần đầu**.

## 4. Chọn món: "What do you want?"
- Chú: *"What do you want?"* Thực đơn hiện **thẻ món to có hình**. Chú đọc tên từng món khi thẻ hiện ra.
- **Mức 1:** 2 thẻ. **Mức 2–3:** 3 thẻ (đủ 3 món ở mục 4.1).
- Mức 1 bốc 2 món theo `seen`, ưu tiên món **ít làm nhất**. Thứ tự thẻ xáo theo seed.
- Bé chạm thẻ → thẻ phóng to. Chú nhắc tên món: *"A rice ball!"*.
  - Nếu bố mẹ bật lượt nói (mức 2–3): bé được mời nói *"Rice ball, please!"* (mục 5).
  - Sau đó chú: *"Let's make it!"*.
- Nếu bé chọn **đúng món vừa làm ở lần trước**: vẫn được làm. Không chặn sở thích của bé.
- Không chạm gì: sau 10 giây chú nhắc lại *"What do you want?"*, các thẻ nhún một lần. Món **không** tự được chọn hộ.

### 4.1 Ba món
Mỗi món có các bước **động từ mới**. Mỗi động từ có hoạt ảnh rõ **sau khi bé chạm**, và chú nói lại động từ đúng lúc hoạt ảnh chạy, giống bánh nướng.

**🍙 Cơm nắm (*rice ball*)**: dạy từ *rice* (bài Food).

| Bước | Câu | Bé chạm → hoạt ảnh |
|---|---|---|
| scoop | *"Scoop the rice!"* | Chạm muôi → muôi xúc cơm từ nồi lên tay chú (đôi tay đeo găng). Chú: *"Scoop!"* |
| squeeze | *"Squeeze!"* | Chạm đôi tay → tay bóp 3 lần, cơm thành hình tam giác. Chú: *"Squeeze, squeeze, squeeze!"* |
| wrap | *"Wrap it!"* | Chạm lá rong biển → rong biển quấn quanh đáy nắm cơm. Chú: *"Wrap!"* |

**🥗 Salad hoa quả (*fruit salad*)**: dạy từ *banana* (bài Food).

| Bước | Câu | Bé chạm → hoạt ảnh |
|---|---|---|
| (chọn quả) | *"A banana, please!"* | Chạm quả trong khay → quả bay vào bát |
| peel | *"Peel the banana!"* | Chỉ có ở chuối. Chạm chuối → vỏ tách 3 cánh, ruột chuối rơi vào bát thành lát (không dao). Chú: *"Peel!"* |
| mix | *"Mix!"* | Chạm thìa → khuấy 3 vòng. Câu *"Mix, mix, mix!"* đã có ở bánh nướng |

Quả trong khay: *banana, apple, strawberry, mango, grapes*, lấy từ `feed.js`.

**🍕 Pizza**

| Bước | Câu | Bé chạm → hoạt ảnh |
|---|---|---|
| spread | *"Spread the sauce!"* | Chạm bát sốt → thìa trải sốt đỏ thành vòng tròn trên đế bánh. Chú: *"Spread!"* |
| sprinkle | *"Sprinkle the cheese!"* | Chạm bát phô mai → phô mai rắc lấm tấm vàng. Chú: *"Sprinkle!"* |
| (nhân) | *"Two tomatoes!"* | Đặt từng lát lên bánh, chú đếm. Dùng lại cách đặt của ca Trang trí |
| bake | *"In the oven!"* | Như bánh nướng: cửa lò đóng, đèn cam, *tick-tock* ~2 giây, *ding!* |

### 4.2 Bước theo mức
| Món | Mức 1 | Mức 2 | Mức 3 |
|---|---|---|---|
| 🍙 Cơm nắm | scoop → squeeze (2 thao tác) | scoop → squeeze → wrap (3) | 3 bước, chú nói cả chuỗi **một lần** (*"First, scoop the rice. Then, squeeze. Then, wrap it!"*). Bé làm đúng **thứ tự** (3) |
| 🥗 Salad | 2 quả, mỗi lúc chỉ quả cần chọn sáng. Chuối luôn là một quả: banana → peel → quả kia → mix (4) | **Luôn có banana** + 1 quả khác. Khay 4 quả, không quả nào sáng. Chọn banana thì peel ngay sau đó; mix cuối (4) | *"Banana and apple, please! No grapes!"*: banana + 1 quả khác + một quả "No" có trong khay; peel sau banana; mix cuối (4) |
| 🍕 Pizza | spread → sprinkle → bake (3) | spread → sprinkle → 2 lát một loại → bake (5) | spread → sprinkle → **1 + 1 lát hai loại** (*"One tomato and one mushroom!"*) → bake (5) |

- **Mức 1:** chỉ đồ cần chạm **sáng và nhún**. Chạm đồ khác không tính nhầm.
- **Mức 2–3:** mọi đồ cần dùng nằm trên bàn, **cộng thêm 1 đồ nhiễu** lấy từ bếp. Ví dụ cơm nắm có thêm hộp sữa, pizza có thêm muôi.
- **Nhầm** (mức 2–3): đồ bật về chỗ, câu nhắc gọi tên đúng thứ vừa chạm, ví dụ *"That's the spoon. Scoop the rice!"*. Có tính nhầm.
- **Salad, thứ tự quả:** ở mức 2–3 bé chọn hai quả theo thứ tự nào cũng được. Khi đã chọn banana thì bước tiếp theo **luôn** là peel. Vì vậy mọi cách chọn đều có đủ 4 thao tác, không bao giờ thiếu bước peel.
- **Mức 3:**
  - Làm sai thứ tự: chú **chỉ nói bước cần làm** (*"First, scoop the rice!"*, rồi ở bước sau *"Now, squeeze!"*), tính nhầm. Không phát lại cả chuỗi. Bé muốn nghe cả chuỗi thì bấm nút nghe lại.
  - Câu salad đọc **chậm** (tốc độ giọng × 0.85), và thẻ gọi món hiện hình 🍌 🍎 + 🍇 bị gạch chéo.
  - Thả quả "No" vào bát salad: chú chỉ nói *"No grapes, please!"*, quả không vào bát, tính nhầm.
  - Câu *"One tomato and one mushroom!"* cũng đọc chậm, thẻ hiện 🍅 ×1 + 🍄 ×1.
- Nhân pizza: lát cà chua 🍅, nấm 🍄, ô liu 🫒. Lát nào đã đủ số thì chỉ lát đó mờ đi, giống ca Trang trí.

### 4.3 Ăn
- Món xong bay ra đĩa trước mặt bé (góc dưới màn), chú nói *"It's ready!"*.
- **Pizza nóng:** ra lò có hơi nóng bốc lên **2 giây** (giống bánh nướng hiện có).
  - Chạm bánh lúc này: bánh rung, chú *"Hot! Wait!"*, không tính nhầm. Hết 2 giây thì hơi tắt, chú *"It's ready!"*, bánh **tự** bay ra đĩa.
  - Bé không cần chạm gì để kết thúc thời gian chờ.
- Bé chạm món → mỗi lần chạm món mất một miếng (*nom nom*). **3 lần chạm** là hết đĩa. Sau 5 giây không chạm thì món tự hết.
- **Bông ăn cùng (chỉ hoạt ảnh, không thêm thao tác):** Bông đứng cạnh đĩa, cũng cắn một miếng khi bé cắn. Hết đĩa: Bông *"Yummy!"* → xoa bụng *"I'm full!"*. Câu *I'm full* là từ mới, có phụ đề; hoạt ảnh xoa bụng giúp bé hiểu nghĩa.

## 5. Lượt nói (tùy chọn, mặc định TẮT)
Đây là lần đầu trò Đóng vai nghề cho bé **nói**. Dùng lại `speech/listen.js`, cũng là cách bài học chính đang dùng.

**Bật / tắt:** Cài đặt → Đóng vai nghề → ô **"Cho bé nói khi chơi nghề"**, mặc định **tắt**. Ghi chú dưới ô:
- App đo âm lượng trên máy, không cần mạng.
- Nếu ô "Dùng nhận dạng giọng nói" bật, trình duyệt có thể gửi tiếng nói lên dịch vụ nhận dạng của trình duyệt (Google / Apple), giống bài học chính.
- **Lượt nói không bao giờ ghi âm.**

**Chỉ chạy khi đủ cả ba:**
1. Ô "Cho bé nói khi chơi nghề" bật.
2. Micro **đã sẵn sàng** trong buổi (đã được cấp quyền từ trước, `mic.ready`). Trò nghề **không bao giờ hỏi quyền micro**; chưa có quyền thì bỏ qua lượt nói.
3. Mức 2–3.

Có quyền micro **không** có nghĩa là có nhận dạng:
- Nhận dạng chỉ dùng khi ô "Dùng nhận dạng giọng nói" bật **và** trình duyệt hỗ trợ (`recognizer.enabled`).
- Không có nhận dạng thì lượt nói chỉ đo âm lượng (offline): kết quả chỉ có CÓ TIẾNG hoặc IM LẶNG.

**Diễn biến:**
1. Bóng thoại câu mẫu hiện trên đầu bé, kèm biểu tượng 🎤 nhấp nháy.
2. Bông đọc câu mẫu một lần.
3. App nghe tối đa ~4 giây (`record: false`), có giới hạn cứng 6 giây.

| Kết quả `listen` | Phản hồi |
|---|---|
| KHỚP (nhận ra tên món / *hungry*) | Chú: *"Great talking!"*, ⭐ nhỏ bay vào góc |
| CÓ TIẾNG (không nhận ra từ, hoặc không có nhận dạng) | Chú: *"Good!"* rồi nói lại câu đúng một lần |
| IM LẶNG | Chú nói thay: *"Rice ball, please!"* |
| CHỈ NGHE, lỗi micro / nhận dạng giữa lượt, quá 6 giây | Bỏ qua, đi tiếp ngay |

- Lượt nói **không bao giờ** tính nhầm, không chặn bé đi tiếp, không bắt nói lại, không ảnh hưởng sao hay tiến độ học.
- Nhận dạng báo lỗi thì tắt nhận dạng cho cả buổi, như `recognition.js` đang làm. Lượt sau chỉ đo âm lượng.
- Không làm "nói tên món để chọn" trong C4 / C5 (để sau, nếu lượt nói chạy ổn).

## 6. Xếp ca trong lượt
Hiện mỗi lượt có 3 ca. Bánh nướng (B) luôn có, còn ca D (món nóng/lạnh) thay A hoặc C luân phiên. Ca mới **E** thay **bánh nướng** cứ 3 lượt một lần. Bánh nướng và cơm nắm / pizza đều dạy động từ, nên không mất phần động từ.

**Ca E luôn là ca nghề cuối cùng của lượt, trước phần dọn bếp (mức 2–3) và sticker:** nấu cho khách xong rồi mới nấu cho mình.

| `rounds % 3` | 3 ca |
|---|---|
| 0 | D nóng / lạnh + B bánh nướng + C trang trí |
| 1 | A bánh mì kẹp + B bánh nướng + D nóng / lạnh |
| 2 | A bánh mì kẹp + C trang trí + **E bé đói** |

- **`rounds` ổn định:**
  - Bộ ca được chọn **một lần** khi bắt đầu lượt, theo `chefGame.rounds` lúc đó, rồi lưu trong bản lưu (`plan`).
  - Ra nền / tải lại / cập nhật app giữa lượt: dùng `plan` đã lưu, không tính lại theo `rounds`.
  - `rounds` chỉ tăng khi xong lượt, như hiện nay.
  - Bản lưu của bản cũ (chưa có ca E) vẫn chơi tiếp đúng như cũ.
- **Dọn bếp tránh đồ ca E:** mọi thứ đã **xuất hiện trên bàn** ở ca E (nguyên liệu, dụng cụ, cả đồ nhiễu) không có trong dọn bếp. Ví dụ:
  - salad hoặc pizza có bát → dọn bếp không có *bowl*;
  - cơm nắm có hộp sữa làm đồ nhiễu → không có *milk*.

  Nếu còn ít hơn 2 đồ hợp lệ ở 2 chỗ khác nhau thì bỏ dọn bếp ở lượt đó (luật dữ liệu thiếu của `SPEC-jobs4.md` mục 1).
- Ca E **không** cùng lượt với bánh nướng, nên *bake* chỉ là động từ đáp án ở một ca mỗi lượt (luật 2.7).
- **Thay đổi JOBS4-06:** trước đây "luôn có bánh nướng". Giờ là: bánh nướng có ở 2/3 số lượt, và lượt nào không có bánh nướng thì có ca E.
- **Thời lượng:** ca E dài hơn ca thường vì có thêm chọn món + ăn (+ lượt nói nếu bật). Mục tiêu ≤ ~70 giây. Lượt có ca E vẫn trong mục tiêu của `SPEC-jobs4.md` mục 1 (mức 3 ≤ 3 phút). Nếu đo thấy dài quá thì bỏ lượt nói ở mục 3, chỉ giữ lượt nói ở mục 4.

## 7. Tiến độ và dữ liệu
Có **hai nhóm** dữ liệu, mục đích khác nhau.

**Dữ liệu học** (`practiceCount` / "đã gặp" của bài; chỉ ghi khi đúng ngay lần đầu, một lần mỗi lượt):

| Từ | Bài | Khi nào ghi |
|---|---|---|
| *hungry* | Feelings | Mức 3: chọn 😋 đúng ngay lần đầu |
| *rice* | Food | Mức 2–3: bước *scoop* đúng ngay lần đầu |
| *banana* | Food | Mức 2–3: bước *peel* đúng ngay lần đầu |

**Dữ liệu cân bằng / thống kê** (`chefGame.seen` của nghề; không phải tiến độ học):

| Mã | Mục đích | Khi nào +1 |
|---|---|---|
| `dish:rice-ball`, `dish:salad`, `dish:pizza` | Xếp món ít làm lên trước (mục 4) | Làm xong món |
| `verb:scoop`, `verb:squeeze`, `verb:wrap`, `verb:peel`, `verb:spread`, `verb:sprinkle` | Theo dõi bé đã gặp động từ bao nhiêu lần (chưa có bài động từ) | Xong bước đó |
| `talk:chef` | Đếm lượt nói KHỚP | **Mỗi câu** nói khớp +1 (tối đa 2 mỗi ca: *I'm hungry* và tên món) |

**Bản lưu ra nền:**
- Lưu: bước (`hungry` / `menu` / `talk` / `cook` / `hot` / `eat`), món đã chọn, bước nấu, số miếng đã ăn, đồ đã có trên bàn.
- Quay lại không hỏi chọn món lại, không nói lại câu mở đầu.
- Đang `hot` (pizza nóng) thì quay lại chạy lại 2 giây hơi nóng.
- Đang `talk` thì bỏ qua lượt nói, đi tiếp.

**Hook test:** `window.__kidTest.chefHungryAt` ép vị trí ca E (−1 = lượt không có ca E, để test cũ chạy như trước); `chefDish` ép món; `chefTalk:false` tắt lượt nói.

## 8. Mốc làm và kiểm thử
| Bản | Mốc | Nội dung |
|---|---|---|
| 0.82.0 | **C4** | Ca E: mở đầu (mục 3), chọn món, 🍙 cơm nắm + 🥗 salad, ăn + Bông ăn cùng, xếp ca mới (mục 6), dọn bếp tránh đồ ca E. Chưa có lượt nói |
| 0.83.0 | **C5** | 🍕 Pizza + lượt nói (mục 5) + ô Cài đặt |

Chia hai bản để bé chơi thử phần chọn món + nấu trước. Lượt nói cần thử micro trên iPad Safari và Android Chrome thật, không chỉ micro giả trong test.

**Unit** (`chef.test.js`, 500 seed mỗi mức):
- `rounds % 3` cho đúng 3 ca như bảng mục 6.
- Ca E luôn là ca cuối và không cùng lượt với bánh nướng.
- Mỗi món có số thao tác đúng theo mức (cách đếm mục 2), ≤ 5.
- Salad mức 1–3 luôn có banana. Mọi thứ tự chọn quả đều có peel ngay sau banana.
- Mức 3 salad: quả "No" có trong khay, không trùng 2 quả được gọi. Mức 3 pizza: hai loại nhân khác nhau.
- Đồ nhiễu mức 2–3 không phải đồ cần dùng.
- Dọn bếp không có đồ nào đã xuất hiện trên bàn ca E (cả đồ nhiễu). Không đủ đồ thì không có dọn bếp.
- Câu nói không rỗng, đúng *a / an*, số ít / nhiều (*two tomatoes*).

**UI** (`jobs5.spec.js`):

| Mã | Ca | Mong đợi |
|---|---|---|
| JOBS5-01 | Mức 1, chọn thẻ nào cũng được | Không tính nhầm; làm đúng món đã chọn |
| JOBS5-02 | Mức 3 mở đầu, chạm 😴 | *"That's sleepy."* + bụng kêu + *"Listen! How do you feel?"*, tính nhầm; thẻ còn nguyên; chưa hiện thực đơn |
| JOBS5-03 | Mức 2 cơm nắm, chạm hộp sữa ở bước scoop | *"That's the milk. Scoop the rice!"*, tính nhầm |
| JOBS5-04 | Mức 3 cơm nắm, chạm rong biển trước | *"First, scoop the rice!"*, tính nhầm; không đọc lại cả chuỗi |
| JOBS5-05 | Mức 3 salad, thả nho vào bát | *"No grapes, please!"*, nho không vào bát |
| JOBS5-06 | Pizza ra lò, chạm bánh khi còn hơi | *"Hot! Wait!"*, không tính nhầm; sau 2 giây bánh tự ra đĩa |
| JOBS5-07 | Ăn: 3 lần chạm hoặc chờ 5 giây | Đĩa hết, Bông *"Yummy! I'm full!"* → sang dọn bếp hoặc sticker |
| JOBS5-08 | Ra nền ở bước nấu | Quay lại đúng món, đúng bước, không hỏi lại thực đơn |
| JOBS5-09 | Lượt nói: micro giả trả KHỚP / CÓ TIẾNG / IM LẶNG | *"Great talking!"* / *"Good!"* + câu đúng / chú nói thay; không lần nào tính nhầm |
| JOBS5-10 | `rounds` 0, 1, 2 | Đúng bộ 3 ca của mục 6 |
| JOBS5-11 | Mức 2 salad, chọn quả kia trước rồi banana | Có peel ngay sau banana, mix cuối; tổng 4 thao tác |
| JOBS5-12 | Mức 3 mở đầu, chọn sai rồi chọn 😋 | Vào thực đơn; *hungry* **không** ghi tiến độ |
| JOBS5-13 | Ô lượt nói bật, micro chưa có quyền | Không hiện hộp hỏi quyền; không có lượt nói |
| JOBS5-14 | Micro có, không có nhận dạng | Lượt nói chỉ đo âm lượng: CÓ TIẾNG → *"Good!"* |
| JOBS5-15 | Micro / nhận dạng báo lỗi giữa lượt nói | Đi tiếp ngay, không kẹt |
| JOBS5-16 | Lượt nói, bé không nói không chạm | Chú nói thay rồi tự đi tiếp (≤ 6 giây) |
| JOBS5-17 | Chọn lại món đã làm lượt trước | Vẫn nấu được |
| JOBS5-18 | Tải lại khi đang ăn (đã ăn 1 miếng) | Đĩa còn 2 miếng |
| JOBS5-19 | Tải lại khi pizza đang nóng | Hơi nóng chạy lại 2 giây rồi bánh ra đĩa |
| JOBS5-20 | Dọn bếp sau salad / pizza | Không có *bowl*; không có đồ nào đã ở trên bàn ca E |
| JOBS5-21 | Thiếu ảnh món (xóa ảnh `feed.js`) | Thẻ món và quả hiện emoji |
| JOBS5-22 | Chơi 3 lượt liên tiếp, tải lại giữa lượt 3 | Ca E đúng ở lượt có `rounds % 3 = 2`; tải lại giữ nguyên bộ ca đã chọn |

Test cũ `jobs3.spec.js` và `jobs4.spec.js` của Đầu bếp đặt `chefHungryAt: -1`. Ảnh chụp iPad và điện thoại 390 px (thực đơn, ba món, lúc ăn có Bông).

## 9. Đã chốt (2026-11-18 — theo review)
| Câu hỏi | Đề xuất |
|---|---|
| Ba món cơm nắm, salad, pizza | **Giữ.** Không thêm món ở bản này |
| Ca E thay bánh nướng 1/3 số lượt | **Đồng ý** (mục 6) |
| Có lượt nói không? | **Có, tùy chọn** (mục 5) |
| Mặc định lượt nói | **Tắt**, bố mẹ tự bật |
| Mức 3 nói tên món để chọn | **Chưa làm** trong C4 / C5 |
| Bông ăn cùng | **Có, chỉ hoạt ảnh**, không thêm chạm hay câu hỏi |

## 10. Trả lời review (draft2, 2026-11-18)
| Ý review | Sửa ở |
|---|---|
| P0 2.1 Micro: offline, quyền riêng tư, không coi quyền micro là đủ | Mục 5: mặc định tắt; không hỏi quyền; nhận dạng chỉ khi cài đặt bật + trình duyệt hỗ trợ; ghi rõ nhận dạng có thể gửi tiếng lên dịch vụ trình duyệt; không đo được thì chỉ đo âm lượng (offline); không ghi âm; lỗi gì cũng bỏ qua |
| 2.2 Mức 3 chọn sai cảm xúc | Mục 3: giữ thẻ, bụng kêu lại, hỏi lại, chọn lại; nhầm lần 2 thì 😋 nhún |
| 2.3 Salad mức 2 có bắt buộc chuối? | Mục 4.2: luôn có banana ở mọi mức; peel luôn ngay sau banana; 4 thao tác |
| 2.4 Cách đếm 5 thao tác | Mục 2: bảng loại chạm |
| 2.5 Ca E cuối nhưng còn dọn bếp | Mục 6: "ca nghề cuối, trước dọn bếp và sticker" |
| Cơm nắm: sai thứ tự không đọc lại cả chuỗi | Mục 4.2 |
| Salad: câu "No" dài | Mục 4.2: đọc chậm + thẻ hình có gạch chéo |
| Pizza: đế, lát sẵn, không dao, thời gian chờ | Mục 2, 4.3: chờ 2 giây, bánh tự ra đĩa |
| `rounds` ổn định khi tải lại / cập nhật | Mục 6 |
| Dọn bếp tránh cả nguyên liệu và dụng cụ | Mục 6 |
| Tách dữ liệu học / cân bằng; `talk:chef` | Mục 7: hai bảng; mỗi câu khớp +1 |
| *I'm full* có hoạt ảnh | Mục 4.3: Bông xoa bụng |
| Thêm test biên | Mục 8: JOBS5-11…22 |

**Một điểm mình giữ khác review:** review đề xuất "chạm nhầm tính vào giới hạn 5 thao tác". Mình **không** tính nhầm vào giới hạn. Giới hạn 5 là để lập kế hoạch ca không quá dài. Nếu tính cả nhầm thì bé nhầm nhiều có thể "vượt giới hạn" và kẹt, đúng điều review lo ở lưu ý của mục 2.4. Nhầm vẫn được tính vào sao và đáp án nhún như mọi ca.

## 11. Ghi chú khi làm
### 0.82.0 — C4: ca E (cơm nắm + salad)
- **Code:**
  - `jobs/chef.js` thêm `MENU`, `E_STEPS`, `E_TOOLS`, `FRUITS`, `FEELS`, `makeHungryCase`, `hungryRound`, `hungryCleanAvoid`, `dishActions` và câu nói ca E.
  - `planRound` xếp ca theo `rounds % 3`; lượt có ca E thì dọn bếp tránh đồ ca E (`avoidIds`).
  - `screens/chef.js` thêm trạng thái `feel` → `menu` → `cook` / `fruit` → `eat`.
  - `jobs/kit.js`: câu có `slow: true` đọc chậm × 0.85.
- **Khác bảng mục 6 (đã sửa bảng):** `rounds % 3 = 0` là D thay bánh mì kẹp, `= 1` là D thay trang trí. Như vậy hai lượt đầu giữ đúng như bản cũ (`rounds` 0 / 1), test cũ không phải đổi. Ca E ở `rounds % 3 = 2`.
- **Thực đơn 0.82.0 chỉ có 2 món** (cơm nắm, salad) ở mọi mức. Mức 2–3 có 3 thẻ khi thêm pizza ở 0.83.0.
- **Ảnh:**
  - Thẻ cơm nắm và quả salad dùng ảnh món của Cho Bông ăn (nếu bố mẹ đã thêm), không có thì emoji. Thẻ salad là emoji 🥗.
  - Nồi cơm 🍚, găng tay 🧤, thìa, sữa, trứng dùng emoji (hoặc ảnh Đóng vai). Rong biển vẽ SVG.
  - Nắm cơm vẽ SVG theo bước: tròn → tam giác → quấn rong biển.
- **Bông** đứng chỗ khách: nói *"Yes! I'm hungry!"* (mức 1–2), nhún mỗi miếng bé ăn, xoa bụng *"I'm full!"* (có tiếng ợ nhỏ). Lúc ăn, chú hỏi *"Yummy?"* trước.
- **Ăn:** 5 giây chờ chạy theo **giờ thật**, kể cả ở chế độ chạy nhanh của test, để bé luôn có đủ thời gian tự chạm.
- **Salad mức 2–3:** sau khi bóc chuối, nếu còn quả chưa chọn thì chú nhắc lại cả câu gọi quả.
- **`seen` quả** ghi `fruit:<mã>` (dâu tây trùng mã với đồ trang trí).
- Test:
  - unit `chef.test.js`: 500 seed theo `rounds % 3`, ca E, dọn bếp tránh đồ ca E, câu nói;
  - UI `jobs5.spec.js`: JOBS5-01…05, 07, 08, 10, 11, 12, 18, 20.
  - Các mã còn lại làm ở 0.83.0 (pizza, lượt nói) hoặc kiểm tay: 13–16 (micro), 17 (chọn lại món — không có gì chặn), 19 (pizza), 21 (thiếu ảnh → emoji, cùng cách của trò Bán hàng), 22 (unit kiểm `rounds`, kế hoạch lưu trong bản lưu như mọi nghề).
