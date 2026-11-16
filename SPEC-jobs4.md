# SPEC — 🧑‍⚕️ Đóng vai nghề: nhiệm vụ mới cho cả 10 nghề

> Phiên bản spec: **draft2** (sửa theo review, mục 15) · Ngày: 2026-11-16 · Dựa trên app 0.70.1. **Bố mẹ đã duyệt draft2 (2026-11-16, theo review — mục 14)**; làm theo 10 bản ở mục 12. **Đã làm:** 0.71.0 Nông trại (ghi chú mục 16).
> - **draft2, sửa theo review:** mẫu tháp AB / AAB (4.2); Đồ bỏ quên mức 2 chỉ hỏi người có dấu hiệu (5.1); thời tiết ngoài cửa sổ là nguồn chuẩn cho mọi câu (9 và mọi việc thời tiết); Cứu hỏa tách *scared* (chăn) khỏi bước giúp thứ hai (11); bảng món mức 1 / mức 3 của Đầu bếp (3.1); khóa bước đã xong ở việc hai bước (1); trạng thái Stop / Go của Cảnh sát (10); mã `seen` và thẻ nhiễu Nông trại (2.1); Bưu tá dạy "nơi nào – xe nào" trước khi hỏi suy luận (8); thời lượng lượt, dữ liệu thiếu, seed (1); 10 bản theo nghề (12); test JOBS4-30…39.
> - draft1: **Phần 1** (mục 1–5) — 4 nghề của `SPEC-jobs3.md`, mỗi nghề **hai nhiệm vụ mới**; **Phần 2** (mục 6–11) — 6 nghề cũ, mỗi nghề **một nhiệm vụ mới** (bố mẹ chọn ý tưởng 2026-11-16).
> Bổ sung cho `SPEC-jobs3.md` mục 4–7 và cho `SPEC-jobs.md` / `SPEC-jobs2.md` / `SPEC-doctor2.md` / `SPEC-fire2.md` (cách chơi hiện có của mọi nghề — **giữ nguyên**). Cùng cách làm với `SPEC-jobs2.md` (nhiệm vụ mới cho 4 nghề cũ): mỗi nghề thêm **ca kiểu mới** xen với ca cũ, **việc nhỏ cuối lượt**, hoặc **việc nhỏ giữa đường**.

# Phần 1 — Nông trại, Đầu bếp nhí, Thợ xây, Xe buýt

## 1. Luật chung
- **Giữ toàn bộ luật của `SPEC-jobs3.md` mục 2** (kế hoạch lượt + bản lưu, đáp án luôn đủ, `claim`, giọng và nghe lại, ≤ 5 thao tác con mỗi ca, câu theo mức, ưu tiên từ chưa gặp) và **mục 1 của `SPEC-jobs2.md`** (bước có đáp án / bước khám phá, ba lớp dữ liệu, chỉ ghi tiến độ khi đúng ngay lần đầu, dữ liệu thiếu không làm lỗi).
- **Lượt không dài thêm nhiều:** ca mới **thay** một ca cũ (lượt vẫn 3 ca). Việc nhỏ (đầu lượt, giữa đường, đầu / cuối ca, cuối lượt) **có làm lượt dài thêm** dù không thêm ca — mỗi việc nhỏ ≤ ~20 giây, tối đa 3 thao tác.
- **Thời lượng mục tiêu cả lượt** (để kiểm thử, đo bằng chế độ chạy thật, bé thao tác bình thường): mức 1 ~2 phút, mức 2 ~2–3 phút, mức 3 ≤ 3 phút. Đây **không** phải giới hạn ép bé: bé chậm thì không tự bỏ việc, không tự làm hộ (trừ luật "không bỏ ai" đã có của Xe buýt).
- **Việc hai bước** (chọn thẻ thời tiết / cảm xúc rồi chọn đồ; chọn đồ rồi chọn chỗ; chọn màu rồi chọn phần nhà): bước 1 đúng thì **khóa** và lưu ngay; nhầm ở bước 2 chỉ nhắc lại yêu cầu của bước 2, **không** bắt làm lại bước 1. Ra nền rồi quay lại đúng bước đang làm.
- **Kế hoạch tái tạo được:** cùng seed → cùng kế hoạch cả lượt (mọi ca, mọi việc nhỏ, mọi đáp án, thẻ nhiễu). Bất biến được kiểm **trên cả lượt**, không chỉ từng ca (ví dụ ca D Đầu bếp đã dùng *milk* thì Dọn bếp không dùng *milk*).
- **Dữ liệu thiếu:** thiếu dữ liệu / ảnh / âm thanh của một việc mới thì dùng hình vẽ / emoji / câu nói dự phòng; nếu vẫn không đủ để có **đúng một đáp án** thì **bỏ việc mới đó** ở lượt này (dùng lại ca cũ nó thay), không bao giờ lỗi cả lượt. Giọng đọc lỗi: phụ đề + hình vẫn đủ để chơi.
- **Tiến độ:** không tăng `practiceCount` / "đã gặp" khi chọn sai, khi đáp án đã nhún (nhầm lần 2), khi việc tự xong, hay với từ chỉ xuất hiện làm **thẻ nhiễu**.
- **Ôn bài 4 nghề này chưa dùng:**

  | Nghề | Việc mới | Ôn bài có sẵn | Từ / câu **mới** |
  |---|---|---|---|
  | 👩‍🌾 Nông trại | Ca D — Trời hôm nay | **Weather** (*hot, cold, rainy*; *sunny* chỉ là thẻ nhiễu), Food (*water*), Animals | *blanket, "Go inside!"* |
  | | Good night, farm! (cuối lượt, mọi mức) | **Animals** + tiếng kêu (Ai kêu thế?) | *"Go in!", "Good night!"* |
  | 👨‍🍳 Đầu bếp nhí | Ca D — Món nóng, món lạnh | **Weather** (*hot, cold*), Feelings (*hungry*), Food (*milk, water*) | *soup, ice cream, "Something hot, please!"* |
  | | Dọn bếp (cuối lượt, mức 2–3) | Food (*milk, bread, egg*), *in* (Trốn tìm) | *sink, fridge, cupboard, "Clean up!"* |
  | 👷 Thợ xây | Ca C — Sơn nhà | **Colors**, *big / small* | *paint*; ôn *roof, wall, door, window* của nghề |
  | | Ca D — Xây tháp | Colors, số 1–5, **mẫu lặp** | *block, tower, "What comes next?"* |
  | 🚌 Xe buýt | Đồ bỏ quên (cuối lượt, mức 2–3) | **Family** | *Whose … is this?*, *hat, bag, glasses, teddy* |
  | | Thời tiết trên đường (giữa trạm 1 và 2, mọi mức) | **Weather** (*rainy, sunny, cold*) | *wipers, sunglasses* |
- **Nguyên tắc nội dung** (thêm vào `SPEC-jobs3.md` mục 1):
  - Nông trại: thú lạnh / nóng / ướt chỉ hơi khó chịu (run nhẹ, thè lưỡi, lông ướt), **không** ốm, không kêu đau. Bé giúp xong thì thú vui ngay.
  - Đầu bếp: đồ nóng chỉ có **hơi nóng bốc lên**, không có lửa; đưa đồ nóng thì chú nói *"Hot! Careful!"*, khách thổi *"Phew, phew!"* rồi mới ăn.
  - Xe buýt: đồ bỏ quên luôn được trả lại; không ai buồn lâu.

---

## 2. 👩‍🌾 Nông trại

### 2.1 Ca D — Trời hôm nay (Weather)
Trời đổi, một con vật thấy khó chịu; bé chọn **việc giúp đúng với thời tiết**.

| Thời tiết | Cảnh (vẽ đè lên nền) | Con vật | Đồ đúng → hoạt ảnh | Câu |
|---|---|---|---|---|
| *hot* | mặt trời đỏ to, sóng nhiệt | thè lưỡi, giọt mồ hôi | **xô nước** 🪣 → nước đổ vào máng, thú uống | bác nông dân: *"It's hot!"* · thú: *"Water, please!"* |
| *cold* | tuyết rơi nhẹ, mái chuồng trắng | run nhẹ | **chăn** → chăn kẻ ô khoác lên lưng thú | *"It's cold!"* · *"A blanket, please!"* |
| *rainy* | mưa rơi, vũng nước | lông ướt, nhỏ giọt | **cửa chuồng** → cửa mở, thú chạy vào, ló đầu ra cửa sổ | *"It's rainy!"* · thú: *"Go inside, please!"* |
- Thú là con vật của Ca A (`farm-animals.js`), khác con vật đã cho ăn trong lượt (2.7). Giúp xong: thú vui, *"Thank you!"*; trời trở lại nắng.
- Ba đồ (xô nước, chăn, cửa chuồng) **vẽ SVG khác dáng hẳn nhau**, không dùng emoji; luôn nằm cùng chỗ trên màn (bên phải chuồng).
- Tiếng mưa / gió dùng `sfx.js` (tổng hợp, nhỏ), không thêm mp3.

| Mức | Bé làm | Thao tác |
|---|---|---|
| 1 | Cảnh rõ + bác nông dân nói thời tiết; **chỉ đồ đúng sáng / nhún**, nghe câu rồi chạm. Không có nhầm — hoạt ảnh là phần dạy | 1 |
| 2 | Cảnh rõ, bác nói thời tiết, **3 đồ không sáng**; thú xin đồ ở dạng ngắn. Nhầm: *"That's the blanket. It's hot! Water, please!"* | 1 |
| 3 | Bác hỏi trước: *"What's the weather?"* → **3 thẻ thời tiết** (vẽ: ☀️🔥 hot, ❄️ cold, 🌧 rainy, ☀️ sunny — 3 thẻ khác nhau, đúng một thẻ khớp cảnh) → bé chạm thẻ → *"Yes! It's cold!"* → rồi chọn đồ như mức 2 nhưng thú **không** xin đồ (chỉ run / thè lưỡi / ướt) | 2 |

| Thao tác | Tính nhầm? |
|---|---|
| Mức 2–3: chạm đồ sai; mức 3: chạm thẻ thời tiết sai (*"That's sunny. Look at the snow!"*) | Có |
| Mức 1: chạm đồ không sáng (đồ đúng nhún); chạm thú / trời | Không |

- **Kế hoạch:** thời tiết là một trong 3 tình huống *hot / cold / rainy*, chọn loại **ít gặp nhất** theo `seen` (bằng nhau thì ngẫu nhiên) để 3 loại đều nhau qua các lượt. Mức 3: 2 thẻ nhiễu lấy từ 3 từ còn lại trong *hot, cold, rainy, sunny*, khác nhau, không trùng thẻ đúng. *sunny* chỉ là thẻ nhiễu: không ghi tiến độ, không ghi `seen`.
- **Lượt** (thay `SPEC-jobs3.md` 4.4):

  | Mức | 3 ca |
  |---|---|
  | 1 | A + B + **D** (thay A thứ hai) |
  | 2 | A + **D** + (B hoặc C — luân phiên theo `rounds`), thứ tự ngẫu nhiên |
  | 3 | A (cửa chuồng) + **D** (thẻ thời tiết) + (B trứng màu hoặc C màu + cỡ + số — luân phiên) |
- **Tiến độ:** từ Weather (*hot / cold / rainy*) "đã gặp" khi chọn đúng ngay lần đầu (mức 2: đồ; mức 3: thẻ thời tiết); *water* (Food) khi giúp đúng ở *hot*. `seen` ghi **mã tình huống**: `weather:hot`, `weather:cold`, `weather:rainy` (dùng để chia đều ở trên) — không ghi tên đồ (xô / chăn / cửa chuồng chỉ là hình, không phải từ dạy).

### 2.2 Good night, farm! (cuối lượt, mọi mức)
Sau ca thứ ba, trời tối dần, trăng lên. Bác nông dân: *"Good night, farm! Time for bed!"* — **3 con vật** đứng ngoài sân, bé đưa từng con về chuồng.

| Mức | Bé làm | Tính nhầm? |
|---|---|---|
| 1 | chạm **con nào cũng được** → con vật kêu tiếng của nó, đi vào chuồng; bác đếm *"One! Two! Three!"* | Không (khám phá) |
| 2 | bác gọi tên **lần lượt**: *"Cow, go in!"* → bé chạm bò. Chạm con khác: con đó kêu, *"That's the pig. Cow, go in!"* | Có |
| 3 | bác gọi bằng **tiếng kêu**: phát tiếng (file của Ai kêu thế?) + *"Who says moo? Go in!"* → bé chạm bò. Chạm con khác: con đó kêu tiếng của nó (tính nhầm) | Có |
- Đủ 3 con: cửa chuồng đóng, đèn chuồng tắt, *"Shh! Good night!"* → Hoan hô + sticker. 3 thao tác, ≤ ~20 giây.
- **Kế hoạch:** 3 con khác nhau và **khác tiếng** trong 6 con của `farm-animals.js`; ưu tiên con đã gặp trong lượt (ôn lại), thiếu thì bốc thêm. Mỗi yêu cầu khớp **đúng một** con trên sân. Không phát được file tiếng thì bác nói tiếng kêu (*"Moo!"*) — vẫn làm được.
- Sau 2 lần nhắc (mức 2–3): con đúng nhún và chờ (không tự đi vào — không có ai bị bỏ lại vì bé luôn làm tiếp được).
- **Tiến độ:** con vật bài Animals (*cow, duck, pig*) khi chạm đúng ngay lần đầu (mức 2–3). Không ghi lại con đã ghi ở ca A trong cùng lượt (`recorded`).

---

## 3. 👨‍🍳 Đầu bếp nhí

### 3.1 Ca D — Món nóng, món lạnh
Khách thấy nóng / lạnh; bé chọn món hợp rồi đưa ra.

- **Món** (vẽ SVG, đồ nóng có **hơi nóng bốc lên**, đồ lạnh có **đá / tuyết nhỏ**, để dáng và dấu hiệu nhìn là biết):

  | Món | Nóng / lạnh | Dấu hiệu |
  |---|---|---|
  | *soup* | nóng | bát súp, 3 sợi hơi cong |
  | *hot milk* | nóng | cốc sữa, hơi bốc |
  | *ice cream* | lạnh | ốc quế, 2 viên kem |
  | *cold milk* | lạnh | ly sữa cao, 2 viên đá |
  | *cold water* | lạnh | ly nước, 2 viên đá |

| Mức | Khách | Khay | Bé làm |
|---|---|---|---|
| 1 | khách lạnh (**run, quàng khăn**): *"I'm cold!"* → chú: *"Something hot!"*; khách nóng (**quạt tay, mồ hôi**): *"I'm hot!"* → chú: *"Something cold!"*. Món đúng **nhún**; dấu hiệu nóng / lạnh trên món (hơi / đá) đủ to để nhìn là thấy | 2 món: 1 nóng, 1 lạnh | chọn món → đưa (không tính nhầm) |
| 2 | khách **không** có dấu hiệu, chỉ nói: *"Something cold, please!"* | 3 món: đúng **một** món khớp | chọn món → đưa |
| 3 | gọi đúng món: *"Hot milk, please!"* | 4 món, có **cùng món khác nóng / lạnh** (*hot milk* + *cold milk*) và **cùng nóng / lạnh khác món** (*soup*) — phải nghe cả hai từ | chọn món → đưa |
- **Mức 3 — bảng tổ hợp cố định** (đúng một món khớp; có cùng món khác nóng / lạnh hoặc cùng nóng / lạnh khác món, nên phải nghe cả câu):

  | Khách gọi | 4 món trên khay |
  |---|---|
  | *hot milk* | hot milk, cold milk, soup, ice cream |
  | *cold milk* | cold milk, hot milk, cold water, ice cream |
  | *soup* | soup, hot milk, ice cream, cold water |
  | *ice cream* | ice cream, cold milk, soup, hot milk |
  | *cold water* | cold water, cold milk, hot milk, soup |
  Thứ tự món trên khay xáo theo seed. Mức 2: 3 món = món đúng (nóng / lạnh theo câu) + 2 món phía ngược lại.
- **Đưa món:** bé chạm món → món lên đĩa → bé chạm khách → món bay tới.
  - Món nóng: chú *"Hot! Careful!"* lúc món bay; khách *"Phew, phew!"* (thổi) → *"Yummy! Thank you!"*.
  - Món lạnh: khách *"Brr! Yummy!"* → *"Thank you!"*.
  - Khách hết run / hết mồ hôi, cười.
- Chọn sai: món bật về khay, khách: *"That's ice cream. Something hot, please!"* (tính nhầm). Mức 3: *"That's cold milk. Hot milk, please!"*.

| Thao tác | Tính nhầm? |
|---|---|
| Chọn món sai (mức 2–3) | Có |
| Mức 1 chọn món sai (món đúng nhún); chạm khách khi chưa có món trên đĩa (khách nhắc lại món); chạm món lúc đang bay | Không |

- **Kế hoạch:** mức 2–3 khay luôn có **đúng một** món khớp (2.2 của `SPEC-jobs3.md`); nóng / lạnh bốc đều; khách là bạn thú khác khách của các ca khác trong lượt.
- **Lượt** (thay `SPEC-jobs3.md` 5.4): ca B (bánh nướng, động từ) **giữ**; ca D thay **A ở lượt lẻ, C ở lượt chẵn** (theo `rounds`), để bánh mì kẹp và trang trí vẫn xuất hiện đều.
- **Tiến độ:** *hot / cold* (Weather) khi chọn đúng ngay lần đầu; *milk / water* (Food) ở mức 3 khi món đúng có từ đó. `seen`: mã món (*soup, ice cream*).

### 3.2 Dọn bếp (cuối lượt, mức 2–3)
Khách về hết. Chú đầu bếp: *"Clean up time!"* — trên bàn còn vài đồ; bếp có **3 chỗ cất** vẽ SVG khác dáng hẳn nhau: **bồn rửa** (*sink*, vòi nước), **tủ lạnh** (*fridge*, cao, trắng, tay nắm dài), **tủ bát** (*cupboard*, gỗ, hai cánh).

- Mỗi đồ có **đúng một chỗ hợp lý**, cố định trong dữ liệu: *milk, juice* → fridge · *bowl, cup* (đã dùng, có vết bẩn) → sink · *bread, egg box* → cupboard.

| Mức | Bé làm | Thao tác |
|---|---|---|
| 2 | đồ cần cất **nhún**, chú nói chỗ: *"The milk goes in the fridge!"* → bé chạm **chỗ cất** → đồ bay vào, cửa tủ đóng | 2 đồ × 1 = 2 |
| 3 | trên bàn **3 đồ**, không đồ nào nhún: *"Put the bread in the cupboard!"* → bé chạm **đồ** rồi chạm **chỗ** | 2 đồ × 2 = 4 |
- Hai yêu cầu nói **lần lượt** (*"Now put the bowl in the sink!"*). Xong: bếp sáng bóng ✨, chú *"All clean! Good job!"* → Hoan hô + sticker.
- Mức 1 không có việc này (lượt mức 1 giữ nguyên).

| Thao tác | Tính nhầm? |
|---|---|
| Chạm chỗ sai: đồ bay tới rồi về, *"That's the sink. In the fridge, please!"* | Có |
| Mức 3 chạm đồ sai: *"That's the bowl. The bread, please!"* | Có |
| Chạm chỗ khi chưa chọn đồ (mức 3): đồ cần cất không nhún, chú nhắc lại câu | Không |
| Chạm tủ / bồn lúc đồ đang bay | Không |
- **Kế hoạch:** 2 đồ có **hai chỗ khác nhau**; mức 3 đồ thứ ba (nhiễu) cũng ở trên bàn và cũng có chỗ của nó, để bé phải nghe tên đồ. Không dùng đồ đã là đáp án ở ca khác trong lượt (2.7 — ví dụ ca D đã có *milk* thì dọn bếp không dùng *milk*).
- **Tiến độ:** *milk, bread, egg* (Food) khi chọn đúng đồ ngay lần đầu (mức 3). `seen`: *sink, fridge, cupboard*.

---

## 4. 👷 Thợ xây

### 4.1 Ca C — Sơn nhà
Sơn **chính ngôi nhà bé vừa xây ở ca A** của lượt — bạn thú: *"Paint my house, please!"*

- Khay: **3–4 thùng sơn** (Colors), cọ sơn. Bé chạm **thùng sơn** (cọ nhúng màu, đầu cọ đổi màu) rồi chạm **phần nhà** → cọ quét, phần đó đổi màu (*swish*).
- Màu được gọi **khác màu hiện tại** của phần đó (sơn phải thấy đổi). Chỉ hỏi phần **có trong ngôi nhà** đã xây.

| Mức | Câu | Bé làm | Thao tác |
|---|---|---|---|
| 1 | phần cần sơn **sáng viền**; chú: *"Red, please!"* | chọn đúng thùng màu → cọ tự quét phần đang sáng | 3 phần × 1 = 3 |
| 2 | bạn thú: *"Paint the door blue!"* (phần + màu, không phần nào sáng) | chọn thùng màu rồi chạm phần | 2 phần × 2 = 4 |
| 3 | nhà có **2 cửa sổ to / nhỏ**: *"Paint the small window yellow!"*; yêu cầu thứ hai nói **sau** khi xong yêu cầu đầu: *"Now paint the roof green!"* | như mức 2, phải nghe cả cỡ | 2 phần × 2 = 4 |
- Sơn xong: nhà sáng lên, bạn thú: *"My beautiful house!"*

| Thao tác | Tính nhầm? |
|---|---|
| Chọn thùng sai màu: cọ không nhúng, *"That's yellow. Blue, please!"* | Có |
| Có màu trên cọ rồi chạm sai phần: *"That's the wall. The door, please!"* | Có |
| Mức 3 chạm sai cỡ: *"That's the big window. The small window, please!"* | Có |
| Chạm phần nhà khi cọ chưa có màu (cọ nhún); chạm lại thùng đã chọn | Không |
| Đổi ý chọn thùng khác **đúng** màu khi cọ đã có màu sai — không xảy ra (thùng sai không nhúng) | — |

- **Kế hoạch:** lập cùng lúc với ca A (ca C dùng `plan.house` của ca A). Mức 3 cần ngôi nhà có 2 cửa sổ to / nhỏ: kế hoạch ca A mức 3 khi lượt có ca C luôn có bước *"Two … windows"* với hai cỡ khác nhau — nếu không thì bốc lại (`planChecked`).
- **Ra nền:** lưu màu cọ hiện tại + các phần đã sơn; quay lại thấy nhà đã sơn tới đâu, cọ giữ màu.
- **Lượt** (thay `SPEC-jobs3.md` 6.3): mọi mức **A + (B hoặc D) + C** — ca C thay A thứ hai; B (sửa đường) và D (xây tháp, 4.2) luân phiên theo `rounds`. Ca A luôn đứng trước ca C.
- **Tiến độ:** màu (Colors) khi chọn đúng thùng ngay lần đầu; *big / small* như Cảnh sát (mức 3). `seen`: mã phần nhà (*roof, wall, door, window*) khi sơn đúng phần ngay lần đầu.

### 4.2 Ca D — Xây tháp (đếm, mẫu lặp)
Bạn thú: *"A tall tower, please!"* — bé chạm khối trong khay, khối bay lên chồng trên đỉnh tháp (*click*), chú thợ xây đếm.

| Mức | Câu | Khay | Bé làm |
|---|---|---|---|
| 1 | *"Three blocks, please!"* (1–3) | một màu | chạm đủ số khối |
| 2 | *"Four yellow blocks!"* (2–5) | **2 màu** | chỉ khối đúng màu lên tháp, đủ số thì xong |
| 3 | tháp có sẵn **mẫu lặp** (AB: 4 khối; AAB: 3 khối — dưới); chú: *"What comes next?"* | 3 màu | đặt **2 khối tiếp theo** đúng mẫu |
- **Mẫu lặp mức 3** (màu từ bài Colors, A ≠ B):

  | Kiểu | Tháp có sẵn | Bé đặt | Chú đọc sau khối thứ nhất |
  |---|---|---|---|
  | AB | A, B, A, B (4 khối) | A, rồi B | *"Red, blue, red, blue, red!"* → *"What comes next?"* |
  | AAB | A, A, B (3 khối) | A, rồi A | *"Red, red, blue, red!"* → *"What comes next?"* |
  Câu đọc **sinh từ dãy khối thật** trên tháp (không viết cứng). Xong: chú đọc cả tháp (*"Red, red, blue, red, red!"*). Tháp xong cao 6 (AB) / 5 (AAB) khối.
- Xong: tháp lắc lư nhẹ (**không đổ**), bạn thú cắm lá cờ trên đỉnh: *"Hooray! A tall tower!"*. Tối đa 5 thao tác (mức 2 tổng khối ≤ 5).

| Thao tác | Tính nhầm? |
|---|---|
| Mức 2 khối sai màu: khối về khay, *"That's a blue block. Yellow blocks, please!"* | Có |
| Mức 3 khối sai mẫu: khối về khay, chú đọc lại **dãy đang có** trên tháp rồi *"What comes next?"* | Có |
| Đã đủ số rồi chạm thêm khối: *"That's enough!"* | Không |
| Mức 1 mọi thao tác (chỉ có một màu) | Không |
- **Kế hoạch:** mức 2 số khối đúng màu trong khay **≥ số được hỏi**, có ≥ 1 khối màu kia (như trứng màu `SPEC-jobs3.md` 4.2); mức 3 khay có đủ khối cho 2 bước tiếp theo, cộng 1 màu không có trong mẫu.
- **Lượt:** như 4.1 — **A + (B hoặc D) + C**. Sửa đường và xây tháp xen nhau; xây nhà (A) và sơn nhà (C) luôn có.
- **Tiến độ:** màu (Colors) khi đặt đúng ngay lần đầu (mức 2–3); số chưa ghi "đã gặp" (như Cứu hỏa). `seen`: *block, tower*.

---

## 5. 🚌 Xe buýt

### 5.1 Đồ bỏ quên (cuối lượt, mức 2–3)
Ở bến cuối, sau *"Everybody off! Bye-bye!"*, mọi người đứng trên vỉa hè; trên ghế xe còn một món đồ.

- Bác tài: *"Oh! A hat! Whose hat is this?"* → bé chạm **đúng người** trên vỉa hè → đồ bay tới người đó → người đó: *"My hat! Thank you!"* (mức 1 không có việc này — lượt mức 1 giữ nguyên).
- Chỉ hỏi đồ của **người đã đi xe trong lượt** (đã `riding`, giờ `off` ở bến cuối hoặc vẫn đứng ở trạm của mình — xem dưới).

| Người | Đồ (mức 2 — là **dấu hiệu** của người đó) | Đồ (mức 3 — không phải dấu hiệu) |
|---|---|---|
| *grandma* | *glasses* (kính tròn) | *book* |
| *grandpa* | *hat* (mũ nồi) | *umbrella* |
| *mummy* | *bag* (túi xách) | *phone* |
| *daddy* | — (cà vạt không bỏ quên được) | *ball* |
| *sister* | — | *teddy* |
| *baby* | — | *bottle* (người lớn nói thay: *"Baby's bottle! Thank you!"*) |

| Mức | Bé làm | Thao tác |
|---|---|---|
| 2 | Người bỏ quên **thiếu đúng dấu hiệu đó** trên hình (ông không đội mũ) — nhìn là tìm được; câu *"Whose hat is this?"* | 1 |
| 3 | Đồ không phải dấu hiệu nên **phải nghe**: bác tài *"It's Grandpa's umbrella!"* → bé chạm ông. Nhiều nhất 2 đồ, nói **lần lượt** (*"Now … It's Sister's teddy!"*) | 1–2 |
- Chạm người khác: người đó lắc đầu *"Not mine!"* (tính nhầm); bác tài nhắc lại câu. Sau 2 lần nhắc, người đúng **tự quay lại lấy** (như luật không bỏ ai, `SPEC-jobs3.md` 7.5: không tính đúng, không ghi tiến độ).
- **Ai đứng trên vỉa hè:** mọi người xuống ở bến cuối, cộng (mức 3) những người đã xuống ở trạm 2–3 **không** đứng đó → chỉ hỏi đồ của người đứng ở bến cuối. Vỉa hè luôn có **≥ 2 người**; nếu chỉ còn 1 người thì **bỏ việc này** ở lượt đó (không có đáp án để chọn).
- **Mức 2 chỉ hỏi người có dấu hiệu bỏ quên được** (*grandma, grandpa, mummy*). *daddy, sister, baby* vẫn có thể đứng trên vỉa hè làm người nhiễu. Kế hoạch lượt mức 2 bảo đảm ở bến cuối có **≥ 1 người trong ba người này** và ≥ 2 người tất cả (chọn `alightStop: end` cho họ khi lập hành khách); không được thì bốc lại (`planChecked`). Mức 3 dùng cả 6 người (đáp án được nói ra).
- **Bất biến:** mức 2 — dấu hiệu bị thiếu chỉ khớp **đúng một** người trên vỉa hè (bà mất kính thì ông vẫn đeo kính — người thiếu kính là duy nhất); mức 3 — mỗi đồ khớp đúng một người, hai đồ thuộc hai người khác nhau.
- **Tiến độ:** từ Family khi trả đồ đúng ngay lần đầu (cùng mã "đã gặp" của Family như khi đón). `seen`: mã đồ (*hat, bag, glasses, teddy…*).
- Lượt dài thêm ≤ ~20 giây; Hoan hô + sticker sau khi trả đồ xong.

### 5.2 Thời tiết trên đường (giữa trạm 1 và trạm 2, mọi mức)
Xe chạy được một đoạn thì trời đổi. Xe **chạy chậm lại và đỗ bên lề** (không bắt bé bấm lúc xe đang chạy), bác tài nói thời tiết; bé chạm **đúng nút trên bảng lái**.

| Thời tiết | Cảnh | Nút → hoạt ảnh | Câu |
|---|---|---|---|
| *rainy* | mưa rơi, kính xe đầy giọt | **gạt nước** → cần gạt quét qua lại, kính trong | *"It's rainy! Wipers on!"* |
| *sunny* | nắng chói, bác tài nheo mắt | **kính râm** → kính đeo lên mắt bác tài | *"It's sunny! Sunglasses on!"* |
| *cold* | tuyết rơi, hành khách run | **cửa sổ** → cửa sổ kéo lên, hành khách hết run | *"It's cold! Windows up!"* |

| Mức | Bé làm | Thao tác |
|---|---|---|
| 1 | cảnh rõ, bác nói câu; **chỉ nút đúng sáng / nhún** — không có nhầm | 1 |
| 2 | cảnh rõ, bác chỉ nói thời tiết (*"It's rainy!"*), **3 nút không sáng**. Nhầm: *"That's the window. It's rainy! Wipers!"* | 1 |
| 3 | bác hỏi *"What's the weather?"* → **3 thẻ thời tiết** (đúng một thẻ khớp cảnh) → rồi chọn nút như mức 2 | 2 |
- Xong: *"Good job! Let's go!"* → xe chạy tiếp tới trạm 2. Trời trở lại nắng ở trạm 2 (để biển màu trạm nhìn rõ).
- **Mức 3 có đèn đỏ** (`SPEC-jobs3.md` 7.4): đèn đỏ **không** ở chặng trạm 1 → 2 (chặng này đã có thời tiết); chọn trong chặng 2 → 3 hoặc 3 → bến cuối.
- **Kế hoạch:** thời tiết bốc đều, ưu tiên từ Weather có `practiceCount` thấp. Trong lượt, nếu cùng ngày bé đã chơi Nông trại ca D thì không cần tránh — ôn lại là tốt; chỉ tránh **trùng trong một lượt** (một nghề).
- **Ra nền:** lưu thời tiết + bước (thẻ đã chọn ở mức 3); quay lại thấy xe đỗ bên lề, cảnh thời tiết, chỉ nói lại yêu cầu.

| Thao tác | Tính nhầm? |
|---|---|
| Mức 2–3 chạm nút sai; mức 3 chạm thẻ thời tiết sai | Có |
| Mức 1 chạm nút không sáng (nút đúng nhún); chạm còi / bàn đạp lúc đang đỗ (còi kêu, xe không chạy) | Không |
- **Tiến độ:** *rainy, sunny, cold* (Weather) khi chọn đúng ngay lần đầu (mức 2: nút; mức 3: thẻ). `seen`: *wipers, sunglasses*.

---

# Phần 2 — Nhiệm vụ mới cho 6 nghề cũ

Cùng luật mục 1. Mỗi nghề đã có một đợt nhiệm vụ mới (`SPEC-doctor2.md`, `SPEC-jobs2.md`, `SPEC-fire2.md`) — **giữ nguyên tất cả**; đợt này mỗi nghề thêm **một** việc, ôn các bài chưa nghề nào dùng nhiều: **Feelings** (*scared, sad, sleepy, hungry*), **Weather** (cả 6 từ), **Vehicles**.

| Nghề | Việc mới | Kiểu | Ôn bài có sẵn | Từ / câu **mới** |
|---|---|---|---|---|
| 🩺 Bác sĩ nhí | Dỗ bạn thú (6) | việc nhỏ đầu một ca bệnh, mọi mức | **Feelings** (*scared, sad, sleepy, hungry*) | *"Don't be scared!", teddy, hug, pillow* |
| 🛒 Bán hàng | Quầy đồ theo thời tiết (7) | ca mới, thay 1 ca khách, mọi mức | **Weather** (*rainy, sunny, cold, hot*) | *umbrella, sunglasses, scarf, fan* |
| 📮 Bưu tá | Chọn xe đưa thư (8) | ca mới, thay 1 thư, mọi mức | **Vehicles** (*boat, plane, train, bike*) | *"By boat!", "How do we go?"* |
| 👩‍🏫 Cô giáo nhí | Bảng thời tiết (9) | mở đầu lượt, sau điểm danh, mọi mức | **Weather** (cả 6 từ) | *"How's the weather today?"* |
| 👮 Cảnh sát | Điều khiển ngã tư (10) | ca mới, thay 1 ca tìm đồ, mọi mức | **Vehicles** (*car, bus, bike*), Colors | *"Go!", "Stop!"* |
| 🚒 Lính cứu hỏa | Bạn thú còn sợ (11) | việc nhỏ cuối ca cứu, mức 2–3 | **Feelings** (*scared, happy*) | *blanket, "You're safe now!"* |

**Nguyên tắc nội dung** (thêm):
- Bác sĩ: bạn thú sợ **"đi khám"** nói chung — **không** có kim tiêm, không có dụng cụ đáng sợ trên màn. Dỗ xong bạn vui ngay.
- Cứu hỏa: bạn thú chỉ hơi sợ (run nhẹ, mắt to), không khóc lớn, không bị thương; được đắp chăn / ôm thì cười.
- Cảnh sát: xe chạy chậm, đi lần lượt, không bao giờ có hai xe cùng đi vào ngã tư; không có va chạm.

---

## 6. 🩺 Bác sĩ nhí — Dỗ bạn thú
Đầu **một** ca bệnh mỗi lượt (ca được chọn khi lập kế hoạch lượt, không phải ca mới Đo chiều cao / Khám mắt): bạn thú vào phòng khám, chưa chịu ngồi lên giường — mặt có cảm xúc, nói cảm xúc của mình. Bé chọn **cách giúp hợp với cảm xúc** rồi ca bệnh chạy như cũ.

| Cảm xúc | Mặt bạn thú | Cách giúp → hoạt ảnh | Câu |
|---|---|---|---|
| *scared* | mắt to, run nhẹ, nấp sau ghế | **gấu bông** 🧸 → bạn ôm gấu, hết run | bạn: *"I'm scared!"* · Bông: *"Don't be scared! Here's a teddy!"* |
| *sad* | mắt cụp, giọt nước mắt nhỏ | **ôm** (hai cánh tay 🤗) → Bông ôm bạn | *"I'm sad."* · *"A big hug!"* |
| *sleepy* | mắt lim dim, 💤 | **gối** → bạn ngả đầu, ngáp, tỉnh dậy vui | *"I'm sleepy…"* · *"A pillow! Rest a little!"* |
| *hungry* | xoa bụng | **quả táo** 🍎 → bạn ăn | *"I'm hungry!"* · *"An apple for you!"* |
- Mặt cảm xúc **nhẹ nhàng**: *sad* chỉ một giọt nước mắt nhỏ, *scared* chỉ mắt to + run nhẹ — không có mặt khóc to / hoảng sợ. Dùng lại bộ mặt bạn thú của `patients.js` (thêm mắt / miệng cảm xúc như mặt người của Xe buýt — một bộ vẽ, đổi mắt / miệng). Bốn đồ giúp vẽ SVG, khác dáng hẳn nhau.
- Giúp xong: bạn cười, *"Thank you! I'm happy now!"* → ngồi lên giường → ca bệnh bắt đầu như cũ.

| Mức | Bé làm | Thao tác |
|---|---|---|
| 1 | chỉ *scared* hoặc *sad*; **chỉ đồ đúng nhún** — bạn nói cảm xúc, Bông nói câu giúp; không có nhầm | 1 |
| 2 | 4 cảm xúc; bạn **nói** cảm xúc, khay **3 đồ** không nhún. Nhầm: *"That's a pillow. I'm scared!"* | 1 |
| 3 | bạn **không nói**, chỉ có mặt; Bông hỏi *"How does Kitty feel?"* → **3 thẻ mặt cảm xúc** → chạm đúng → *"Kitty is scared!"* → chọn đồ như mức 2 | 2 |

| Thao tác | Tính nhầm? |
|---|---|
| Mức 2–3: đồ sai; mức 3: thẻ cảm xúc sai (*"That's sleepy. Look at Kitty!"*) | Có |
| Mức 1: chạm đồ không nhún (đồ đúng nhún); chạm bạn thú / giường | Không |
- **Kế hoạch:** một ca bệnh mỗi lượt có việc này; cảm xúc bốc theo mức, ưu tiên từ Feelings có `practiceCount` thấp; mức 3 thẻ nhiễu khác nhau, không trùng thẻ đúng. Lượt **không thêm ca** (việc nhỏ ≤ ~15 giây).
- **Tiến độ:** từ Feelings khi chọn đúng ngay lần đầu (mức 2: đồ; mức 3: thẻ mặt). `seen`: *teddy, hug, pillow*.

---

## 7. 🛒 Bán hàng — Quầy đồ theo thời tiết
Ca mới, **thay 1 ca khách** (mọi mức; mức 2–3 vẫn có trả xu + đưa túi như ca thường, `SPEC-jobs2.md` 2.4). Cạnh quầy có **kệ đồ dùng** (riêng với kệ đồ ăn) và **cửa sổ** thấy trời bên ngoài.

| Thời tiết (cửa sổ) | Món đúng | Hình (SVG) |
|---|---|---|
| *rainy* — mưa rơi | *umbrella* | ô sọc mở |
| *sunny* — nắng chói | *sunglasses* | kính râm đen |
| *cold* — tuyết rơi | *scarf* | khăn len quấn |
| *hot* — mặt trời đỏ, sóng nhiệt | *fan* | quạt tay giấy |
- **Ngoại lệ có chủ ý** với `SPEC-jobs.md` mục 3 ("không bán đồ không ăn được"): chỉ kệ đồ dùng của ca này có 4 món trên; kệ đồ ăn giữ nguyên luật cũ.

| Mức | Khách | Kệ đồ dùng | Bé làm |
|---|---|---|---|
| 1 | *"It's rainy! Can I have an umbrella, please?"* + bong bóng hình món | 2 món | đưa món |
| 2 | chỉ nói thời tiết: *"It's cold! Can you help me?"* (khách run nhẹ) | 3 món, đúng **một** hợp thời tiết | đưa món hợp thời tiết |
| 3 | khách không nói thời tiết; Bông: *"Look outside! What's the weather?"* → **3 thẻ thời tiết** → *"It's sunny!"* → khách: *"What do I need?"* | 4 món | chọn thẻ rồi đưa món |
- Đúng: khách dùng ngay (mở ô, đeo kính, quấn khăn, phẩy quạt): *"Thank you! Now I'm ready!"*.
- Nhầm: món về kệ, khách: *"That's a scarf. It's hot!"* (tính nhầm). Mức 3 thẻ sai: *"That's rainy. Look outside!"* (tính nhầm).
- **Mức 3, hai bước:** chọn đúng thẻ → thẻ dán lên cửa sổ, **khóa bước 1** (lưu ngay); khách nhắc lại thời tiết một lần (*"Yes! It's sunny!"*) rồi *"What do I need?"*. Nút Bông / nhắc 10 giây ở bước 2 chỉ phát lại *"What do I need?"*. Chọn sai món: chỉ nhắc lại bước 2, **không** hỏi lại thời tiết.
- **Kế hoạch:** thời tiết bốc đều, ưu tiên từ Weather có `practiceCount` thấp; mỗi yêu cầu khớp đúng một món / một thẻ. Ca thay ca khách **thứ hai** của lượt (ca đầu luôn là khách đồ ăn như cũ). Cảnh cửa sổ là **nguồn chuẩn**: mọi câu của khách / Bông nói đúng thời tiết đó.
- **Tiến độ:** *rainy, sunny, cold, hot* (Weather) khi chọn đúng ngay lần đầu (mức 2: món; mức 3: thẻ). Món đồ dùng không ghi "đã gặp" (chưa có bài); `seen`: *umbrella, sunglasses, scarf, fan*.

---

## 8. 📮 Bưu tá — Chọn xe đưa thư
Ca mới, **thay 1 thư** (mọi mức; lượt vẫn 5 việc). Một lá thư **gửi đi xa**: Bông chỉ **bản đồ nhỏ** — nơi nhận nằm ở chỗ chỉ một loại xe tới được. Bé chọn xe → xe chở thư đi (hoạt ảnh ~2 giây) → bạn thú nơi đó nhận: *"A letter for me! Thank you!"*

| Nơi nhận (bản đồ) | Xe đúng | Lý do nhìn thấy |
|---|---|---|
| hòn đảo giữa biển | *boat* ⛵ | có biển xanh bao quanh, không có đường |
| thành phố sau núi cao, rất xa | *plane* ✈️ | núi chắn đường, có mây |
| nhà ga cuối đường ray | *train* 🚂 | chỉ có đường ray tới |
| nhà ngay bên kia công viên | *bike* 🚲 | đường nhỏ trong công viên, gần |
- Xe dùng hình của bài **Vehicles** (ảnh bố mẹ đã thêm → emoji / SVG).

| Mức | Bông nói | Khay xe | Bé làm |
|---|---|---|---|
| 1 | *"Let's go by boat!"* — xe đúng nhún | 2 xe | chọn xe (dạy tên) |
| 2 | *"By train, please!"* — không nhún, **phải nghe** | 3 xe | chọn xe theo tên |
| 3 | *"This letter goes to the island! How do we go?"* — không nói tên xe | 4 xe | nhìn bản đồ, chọn xe **hợp đường đi** → Bông *"By boat! Good idea!"* |
- Nhầm: xe đó chạy tới mép bản đồ rồi dừng (*"Oops! A car can't go on the sea!"* ở mức 3; mức 1–2: *"That's a car. By boat, please!"*) → về khay (tính nhầm; mức 1 không tính — xe đúng nhún).
- **Dạy "nơi nào – xe nào" trước khi hỏi suy luận:** ở mức 1–2, xe đúng chở thư tới nơi nhận và Bông nói luôn lý do bằng hình: *"The sea! A boat!"* / *"The mountains! A plane!"* / *"The train tracks! A train!"* / *"The park! A bike!"* (chỉ tay vào biển / núi / đường ray / công viên). Mức 3 chỉ dùng **nơi nhận bé đã gặp ở mức 1–2** (`seen` mã nơi nhận); nơi chưa gặp thì Bông nói câu dạy đó **trước** khi hỏi. Nhầm lần 1 ở mức 3: Bông chỉ vào biển / núi… và nói câu dạy, rồi hỏi lại.
- **Thiếu hình xe** (bài Vehicles bị xóa, ảnh lỗi): dùng emoji / SVG dự phòng; nếu vẫn không đủ xe cho khay thì bỏ ca này ở lượt đó (thư thường).
- **Mức 3 đáp án duy nhất:** mỗi nơi nhận chỉ một xe hợp (bảng trên); khay không có hai xe cùng hợp (ví dụ không có *boat* và *ship* cùng lúc). Xe nhiễu lấy từ *car, bus* và các xe còn lại.
- **Tiến độ:** từ Vehicles khi chọn đúng ngay lần đầu (mức 2–3). `seen`: mã nơi nhận.

---

## 9. 👩‍🏫 Cô giáo nhí — Bảng thời tiết
**Mở đầu lượt, sau điểm danh** (mọi mức, ≤ ~15 giây): góc lớp có **bảng thời tiết** (khung trống) và cửa sổ lớp thấy trời. Bông: *"How's the weather today?"*

| Mức | Cửa sổ | Thẻ | Bé làm |
|---|---|---|---|
| 1 | thời tiết rõ; Bông nói luôn *"It's sunny!"* | 2 thẻ, thẻ đúng nhún | chạm thẻ → thẻ bay lên bảng |
| 2 | thời tiết rõ; **một bạn trong lớp** nói *"It's rainy!"* | 3 thẻ, không nhún | chọn theo câu nghe |
| 3 | thời tiết rõ; **không ai nói** | 4 thẻ | nhìn cửa sổ, chọn → cả lớp: *"It's windy!"* |
- **Cửa sổ là nguồn chuẩn:** kế hoạch chọn **một** thời tiết cho buổi học; cảnh cửa sổ, câu của Bông (mức 1), câu của bạn trong lớp (mức 2), câu cả lớp nói sau khi đúng (mọi mức) đều sinh từ đúng thời tiết đó — không bao giờ có câu nói khác cảnh. (Các câu ví dụ trong bảng trên là ví dụ cho từng mức riêng, không cùng một buổi.)
- 6 thẻ thời tiết của bài **Weather**: *sunny, rainy, cloudy, windy, hot, cold* (ảnh bài học bố mẹ thêm → hình vẽ). Thẻ gắn lên bảng ở lại suốt lượt (góc lớp).
- Xong: cả lớp nói theo câu thời tiết, Bông: *"Let's start class!"* → hình đầu tiên.
- **Mức 3 đáp án duy nhất:** cảnh *hot* / *sunny* dễ nhầm nên **không cùng nằm trong một bộ thẻ**; tương tự *cold* / *cloudy* không cùng bộ nếu cảnh tuyết có mây.
- Nhầm (mức 2–3): thẻ rơi về, *"That's cloudy. Look outside!"* (tính nhầm). Mức 1 không tính nhầm.
- **Tiến độ:** từ Weather khi chọn đúng ngay lần đầu (mức 2–3).

---

## 10. 👮 Cảnh sát — Điều khiển ngã tư
Ca mới, **thay 1 ca tìm đồ** (mọi mức). Bé (cảnh sát) đứng giữa ngã tư, xe chờ ở các ngả, đèn của bé là **gậy điều khiển**. Bông: *"Let's help the cars!"*

- Bông gọi một xe: *"The bus, go!"* → bé chạm xe đó → xe chạy qua ngã tư, ra khỏi màn: *"Beep beep! Thank you!"*. **Chỉ một xe chạy mỗi lúc**; xe chưa được gọi đứng yên.

| Mức | Xe chờ | Câu | Thao tác |
|---|---|---|---|
| 1 | 3 xe **khác loại** (*car, bus, bike*), xe được gọi nhún | *"The bus, go!"* | 3 xe lần lượt |
| 2 | 4 xe: 2 loại × 2 màu (*red car, blue car, red bus, blue bus*), không nhún | *"The red car, go!"* | 3 lần |
| 3 | 4 xe như mức 2 + **một lần "Stop!"**: một **xe đạp** đi tới từ ngả khác (xe thứ năm, chỉ có ở bước này), Bông *"The bike, stop!"* → bé chạm xe đó → xe dừng trước vạch; rồi gọi tiếp *"Now the blue bus, go!"* | 3–4 lần |
- **Trạng thái mỗi xe:** `waiting` (đứng ở ngả của mình) → `go` (chạy qua ngã tư rồi ra khỏi màn, **không** được gọi lại) · xe đạp mức 3: `coming` (đang đi tới) → `stopped` (dừng trước vạch, **vẫn ở trên màn**, không tự chạy tiếp). Xe `stopped` chỉ chạy khi có lệnh *"… go!"* gọi đúng nó (có thể là lệnh cuối của ca). Mọi lúc **nhiều nhất một xe** đang chạy.
- **Mức 3 — kế hoạch lệnh cố định thứ tự:** Go → **Stop** (xe đạp) → Go → Go (xe đạp). Mỗi lệnh khớp đúng một xe ở đúng trạng thái (lệnh Go chỉ gọi xe `waiting` / `stopped`; lệnh Stop chỉ gọi xe `coming`). Xe đạp `coming` đi rất chậm và **chờ ở trước vạch** cho tới khi bé chạm (không có lúc "trễ quá").
- Nhầm lúc lệnh Stop: chạm xe đang `waiting` → xe đó bấm còi, không chạy, *"That's the red car. The bike, stop!"* (tính nhầm); xe đạp vẫn chờ trước vạch.
- Nhầm: xe bé chạm bấm còi nhẹ, không chạy: *"That's the blue car. The red car, go!"* (tính nhầm; mức 1 không tính — xe đúng nhún).
- **Kế hoạch:** mỗi câu khớp đúng một xe đang chờ (mức 2: bốn tổ hợp loại × màu, như đồ mức 2 của ca tìm đồ); xe đã đi thì không gọi lại. Màu từ bài Colors.
- Hết xe: *"Good job, officer!"*. Dùng lại hình xe và đèn của ca đèn giao thông (`SPEC-jobs2.md` 5.1).
- **Tiến độ:** *car, bus, bike* (Vehicles) và màu (Colors) khi chạm đúng ngay lần đầu (mức 2–3).

---

## 11. 🚒 Lính cứu hỏa — Bạn thú còn sợ
**Cuối ca cứu** (cây hoặc trong nhà, mức 2–3 — mức 1 không có ca cứu): bạn thú vừa ra ngoài, còn run: *"I'm scared!"*. Bông: *"You're safe now!"* — bé giúp bạn **hai bước**, rồi bạn vui lại.

1. **Hết sợ (*scared* → an toàn):** bé chạm **chăn** (chăn nhún, như lính cứu hỏa thật) → chăn khoác lên vai bạn, hết run: *"I'm safe now."* Bước này **luôn** giải quyết *scared*, không tính nhầm.
2. **Giúp thêm:** mức 2 bạn nói một điều cần **khác *scared*** và bé chọn đồ hợp; mức 3 bé chọn mặt cảm xúc của bạn **sau khi** được giúp.

| Mức | Bước 2 | Thao tác |
|---|---|---|
| 2 | bạn: *"I'm thirsty."* (→ **cốc nước**) hoặc *"I'm sad."* (→ **ôm**). Khay 3 đồ: cốc nước, ôm, **gấu bông** — gấu bông luôn là **đồ nhiễu** (không bao giờ là đáp án ở bước này) | 2 |
| 3 | sau chăn, Bông hỏi *"How does Kitty feel now?"* → bạn đã **cười** → **3 thẻ mặt** (*happy, scared, sad*) → bé chọn *happy* → *"Kitty is happy! Hooray!"* | 2 |
- Xong: bạn thú vẫy tay *"Thank you, firefighter!"* → ca sau. Việc nhỏ ≤ ~15 giây, không thêm ca.
- Hành trình cảm xúc: **sợ → được an toàn (chăn) → cần giúp thêm → vui**. Khác với Bác sĩ (mục 6): Bác sĩ dạy **nhận ra** cảm xúc và chọn cách giúp; Cứu hỏa dạy cảm xúc **thay đổi** sau khi được cứu. *scared* không bao giờ được hỏi lại ở bước 2.

| Thao tác | Tính nhầm? |
|---|---|
| Bước 1 chạm chỗ khác (chăn nhún); chạm bạn thú | Không |
| Mức 2 đồ sai ở bước 2 (*"That's a teddy. I'm thirsty!"*); mức 3 thẻ mặt sai (*"Look! Kitty is smiling!"*) | Có |
- *thirsty* không có trong bài Feelings: câu của bạn thú có phụ đề, không ghi tiến độ cho *thirsty*.
- **Tiến độ:** *sad, scared, happy* (Feelings) khi chọn đúng ngay lần đầu. `seen`: *blanket*.

---

## 12. Mốc làm
| Mốc | Nghề | Nội dung | Nghiệm thu |
|---|---|---|---|
| **F2** | 👩‍🌾 Nông trại | Ca D — Trời hôm nay (2.1) | 500 seed mỗi mức: đúng một đồ khớp thời tiết, thẻ thời tiết khác nhau; xô / chăn / cửa chuồng khác dáng trên ảnh chụp |
| **F3** | 👩‍🌾 Nông trại | Good night, farm! (2.2) | 3 con khác nhau, khác tiếng; mỗi yêu cầu khớp đúng một con; không phát được file tiếng vẫn làm được |
| **C2** | 👨‍🍳 Đầu bếp nhí | Ca D — Món nóng, món lạnh (3.1) | mức 3 khay luôn có cặp cùng món khác nóng / lạnh và đúng một món khớp; *"Hot! Careful!"* chỉ với món nóng |
| **C3** | 👨‍🍳 Đầu bếp nhí | Dọn bếp (3.2) | mỗi đồ đúng một chỗ hợp lý; 2 đồ hai chỗ khác nhau; không trùng đồ đã là đáp án ở ca khác |
| **B2** | 👷 Thợ xây | Ca C — Sơn nhà (4.1) | màu gọi luôn khác màu hiện tại; chỉ hỏi phần có trong nhà; mức 3 có 2 cửa sổ to / nhỏ |
| **B3** | 👷 Thợ xây | Ca D — Xây tháp (4.2) | mức 2 đủ khối đúng màu; mức 3 mẫu AB / AAB, khay đủ khối cho 2 bước; tháp không bao giờ đổ |
| **U2** | 🚌 Xe buýt | Đồ bỏ quên (5.1) | vỉa hè < 2 người thì bỏ việc; mức 2 dấu hiệu thiếu là duy nhất; không ai bị bỏ lại với đồ của mình |
| **U3** | 🚌 Xe buýt | Thời tiết trên đường (5.2) | xe đỗ hẳn rồi mới hỏi; đèn đỏ mức 3 không cùng chặng; lượt mức 3 (thời tiết + đèn đỏ + đồ bỏ quên) vẫn ≤ 3 phút |
| **DR4** | 🩺 Bác sĩ nhí | Dỗ bạn thú (6) | đúng một ca bệnh mỗi lượt có việc này; mỗi cảm xúc đúng một đồ; mức 3 thẻ mặt khác nhau; không có kim tiêm trên màn |
| **SH3** | 🛒 Bán hàng | Quầy đồ theo thời tiết (7) | thay ca khách thứ hai; mỗi thời tiết đúng một món; trả xu + đưa túi như ca thường |
| **PO2** | 📮 Bưu tá | Chọn xe đưa thư (8) | mức 3 mỗi nơi nhận chỉ một xe hợp; lượt vẫn 5 việc |
| **TE3** | 👩‍🏫 Cô giáo nhí | Bảng thời tiết (9) | mở đầu (điểm danh + thời tiết) ≤ ~25 giây; *hot / sunny* không cùng bộ thẻ |
| **PL3** | 👮 Cảnh sát | Điều khiển ngã tư (10) | một xe chạy mỗi lúc; mỗi câu khớp đúng một xe đang chờ |
| **FF4** | 🚒 Lính cứu hỏa | Bạn thú còn sợ (11) | chỉ sau ca cứu (mức 2–3); mức 3 hỏi cảm xúc sau khi giúp (*happy*) |
- Mã mốc Phần 2 nối tiếp mã đã dùng ở `SPEC-doctor2.md` (DR1–DR3), `SPEC-jobs2.md` (SH1–2, PO1, TE1–2, PL1–2), `SPEC-fire2.md` (FF1–3).
- **Kế hoạch bản (theo review — gộp theo nghề, 10 bản, từ app 0.70.1):**

  | Bản | Mốc | Nghề |
  |---|---|---|
  | 0.71.0 | F2 + F3 | 👩‍🌾 Nông trại |
  | 0.72.0 | C2 + C3 | 👨‍🍳 Đầu bếp nhí |
  | 0.73.0 | B2 + B3 | 👷 Thợ xây |
  | 0.74.0 | U2 + U3 | 🚌 Xe buýt (đo thời lượng lượt mức 3) |
  | 0.75.0 | DR4 | 🩺 Bác sĩ nhí |
  | 0.76.0 | SH3 | 🛒 Bán hàng |
  | 0.77.0 | PO2 | 📮 Bưu tá |
  | 0.78.0 | TE3 | 👩‍🏫 Cô giáo nhí |
  | 0.79.0 | PL3 | 👮 Cảnh sát |
  | 0.80.0 | FF4 | 🚒 Lính cứu hỏa |
  Số bản có thể lệch nếu xen bản sửa lỗi. Mỗi bản chơi thử với bé rồi mới làm bản sau. **Không** gộp cả 14 việc vào một lần code.
- Trước khi code mỗi nghề: đọc lại spec gốc của nghề đó (`SPEC-jobs.md`, `SPEC-jobs2.md`, `SPEC-jobs3.md`, `SPEC-doctor2.md`, `SPEC-fire2.md`) để không ghi đè luật cũ; test cũ của nghề phải qua nguyên.

## 13. Kiểm thử
- **Unit (mỗi việc):** kế hoạch 500 seed mỗi mức thỏa bất biến của từng mục; câu không rỗng / không *undefined*, đúng *a / an*, số ít / nhiều, đúng độ dài theo mức; ca ≤ 5 thao tác con; một từ là đáp án nhiều nhất ở một ca; ca mới thay đúng một ca cũ, lượt vẫn 3 ca.
- **Unit, cả lượt:** 500 seed mỗi mức kiểm bất biến **giữa các ca trong cùng lượt** (từ đáp án không lặp ca, ca cũ bị thay đúng một, thời lượng ước tính theo số thao tác + câu nói); cùng seed → cùng kế hoạch.
- **UI (chế độ nhanh):** một lượt mỗi mức → sticker; nhầm → câu nhầm đúng tên thứ vừa chạm; nhầm lần 2 → đáp án nhún; ra nền giữa việc quay lại đúng bước; 🧹 không ghi tiến độ lần hai; giọng đọc lỗi vẫn chơi hết.

| Mã | Ca | Mong đợi |
|---|---|---|
| JOBS4-01 | Nông trại mức 1 ca D, chạm đồ không sáng | đồ đúng nhún, **không** tính nhầm |
| JOBS4-02 | Nông trại mức 3 ca D, chạm thẻ *sunny* khi trời tuyết | *"That's sunny. Look at the snow!"*, tính nhầm; chưa sang bước chọn đồ |
| JOBS4-03 | Nông trại, ra nền sau khi chọn thẻ thời tiết đúng | quay lại ở bước chọn đồ, thẻ không hỏi lại, tiến độ Weather không ghi lần hai |
| JOBS4-04 | Đầu bếp mức 3, chọn *cold milk* khi khách gọi *hot milk* | *"That's cold milk. Hot milk, please!"*, tính nhầm, món về khay |
| JOBS4-05 | Đầu bếp, đưa món nóng | *"Hot! Careful!"* → *"Phew, phew!"* → *"Yummy! Thank you!"*; món lạnh không có *"Hot! Careful!"* |
| JOBS4-06 | Đầu bếp, lượt lẻ / lượt chẵn | lượt lẻ không có bánh mì kẹp, lượt chẵn không có trang trí; luôn có bánh nướng |
| JOBS4-07 | Thợ xây mức 2, chạm phần nhà khi cọ chưa có màu | cọ nhún, không tính nhầm |
| JOBS4-08 | Thợ xây mức 2, có màu đúng rồi chạm sai phần | *"That's the wall. The door, please!"*, tính nhầm, tường không đổi màu, cọ giữ màu |
| JOBS4-09 | Thợ xây, ra nền giữa ca C | nhà giữ các phần đã sơn, cọ giữ màu, chỉ nói lại yêu cầu |
| JOBS4-10 | Xe buýt mức 2, vỉa hè có ông + bà, đồ là kính của bà | bà không đeo kính, ông vẫn đeo; chạm ông → *"Not mine!"*, tính nhầm |
| JOBS4-11 | Xe buýt mức 3, chỉ còn 1 người ở bến cuối | không có việc đồ bỏ quên; Hoan hô + sticker ngay |
| JOBS4-12 | Xe buýt, bé không chạm gì ở đồ bỏ quên | sau 2 lần nhắc người đúng tự lấy đồ, không ghi Family, lượt vẫn xong |
| JOBS4-13 | Mọi việc mới: chạm liên tục lúc có hoạt ảnh | không nhận trùng (`claim`), bước không xong hai lần |
| JOBS4-14 | Nông trại Good night mức 1, chạm cùng một con 2 lần | con đó vào chuồng một lần, đếm một lần |
| JOBS4-15 | Nông trại Good night mức 3, chạm vịt khi hỏi *"Who says moo?"* | vịt kêu *quack*, tính nhầm, vịt vẫn ở ngoài |
| JOBS4-16 | Đầu bếp dọn bếp mức 3, chạm tủ lạnh khi chưa chọn đồ | không tính nhầm, chú nhắc lại câu |
| JOBS4-17 | Đầu bếp dọn bếp, ca D đã có *milk* | dọn bếp không có *milk* (2.7) |
| JOBS4-18 | Thợ xây xây tháp mức 3 mẫu AB, đặt sai màu | khối về khay, chú đọc lại mẫu, tính nhầm; tháp giữ 4 khối |
| JOBS4-19 | Thợ xây, lượt lẻ / lượt chẵn | luôn có xây nhà + sơn nhà; sửa đường và xây tháp luân phiên |
| JOBS4-20 | Xe buýt thời tiết mức 2, chạm kính râm khi *rainy* | *"That's the sunglasses. It's rainy! Wipers!"*, tính nhầm, xe vẫn đỗ |
| JOBS4-21 | Xe buýt, ra nền khi xe đang đỗ chờ thời tiết | quay lại: xe đỗ bên lề, cảnh thời tiết còn, chỉ nói lại yêu cầu; kế hoạch không đổi |
| JOBS4-22 | Bác sĩ mức 2, bạn *scared*, chạm gối | *"That's a pillow. I'm scared!"*, tính nhầm; ca bệnh chưa bắt đầu |
| JOBS4-23 | Bác sĩ, ra nền sau khi dỗ xong | quay lại ở ca bệnh, không hỏi dỗ lại, Feelings không ghi lần hai |
| JOBS4-24 | Bán hàng mức 2, khách *"It's cold!"*, đưa quạt | *"That's a fan. It's cold!"*, tính nhầm, quạt về kệ; ca đầu của lượt vẫn là khách đồ ăn |
| JOBS4-25 | Bưu tá mức 3, nơi nhận là đảo, chọn ô tô | ô tô dừng ở mép biển, *"Oops! A car can't go on the sea!"*, tính nhầm |
| JOBS4-26 | Cô giáo mức 1, chạm thẻ không nhún | thẻ đúng nhún, không tính nhầm; thẻ đúng ở lại bảng suốt lượt |
| JOBS4-27 | Cảnh sát mức 2, chạm *blue car* khi gọi *red car* | xe xanh bấm còi, không chạy; tính nhầm; không có hai xe cùng chạy |
| JOBS4-28 | Cứu hỏa mức 3, chọn *scared* sau khi đắp chăn | *"Look! Kitty is smiling!"*, tính nhầm |
| JOBS4-29 | 6 nghề cũ: test cũ của nghề | vẫn qua ở cả 3 mức; mỗi lượt đúng một ca cũ bị thay (Bán hàng, Bưu tá, Cảnh sát) |
| JOBS4-30 | Thợ xây xây tháp mức 3 mẫu AAB | tháp có sẵn 3 khối; câu đọc sau khối thứ nhất là *"Red, red, blue, red!"* (đúng dãy thật); hai khối đúng là A, A |
| JOBS4-31 | Cô giáo, 500 seed | mọi câu thời tiết (Bông / bạn / cả lớp) trùng thời tiết cửa sổ; không có kế hoạch mâu thuẫn |
| JOBS4-32 | Cứu hỏa mức 2, 500 seed | bước 2 không bao giờ là *scared*; gấu bông không bao giờ là đáp án bước 2 |
| JOBS4-33 | Xe buýt mức 2, 500 seed | người được hỏi luôn là *grandma / grandpa / mummy*; luôn ≥ 2 người ở bến cuối; không có kế hoạch không giải được |
| JOBS4-34 | Đầu bếp mức 3, mọi tổ hợp | mỗi tổ hợp đúng một món khớp; có món cùng loại khác nóng / lạnh hoặc cùng nóng / lạnh khác món |
| JOBS4-35 | Bán hàng mức 3, chọn đúng thời tiết rồi chọn sai món | chỉ nhắc *"What do I need?"*, thẻ thời tiết vẫn dán, không hỏi lại thời tiết |
| JOBS4-36 | Cảnh sát mức 3, xe đạp đã Stop | xe đạp đứng trước vạch, không tự chạy; chỉ chạy khi có lệnh Go gọi nó; xe đã Go không được gọi lại |
| JOBS4-37 | Bưu tá, thiếu hình xe Vehicles | dùng hình dự phòng; không đủ xe thì lượt dùng thư thường, không có ca không đáp án |
| JOBS4-38 | Mọi việc mới: ra nền đúng lúc Olly / Bông đang nói | quay lại không nói trùng câu, không tự xong bước, không ghi tiến độ |
| JOBS4-39 | Mọi việc mới: thiếu ảnh / file tiếng / giọng đọc | vẫn chơi hết bằng hình vẽ, emoji, phụ đề; Good night mức 3 bác nói tiếng kêu |

## 14. Đã chốt (2026-11-16 — bố mẹ chọn "theo review")
| Câu hỏi | Chốt |
|---|---|
| 1. Chọn 8 việc Phần 1 | **Giữ cả 8** |
| 2. Thời tiết Nông trại | **Giữ *hot, cold, rainy*; chưa thêm *windy*** (để dành cho việc khác) |
| 3. Đầu bếp ca D | **Thay A / C luân phiên** theo `rounds` |
| 4. Đồ bỏ quên mức 1 | **Chưa làm** — chỉ mức 2–3 |
| 5. Xe buýt mức 3 | **Giữ cả ba** (thời tiết, đèn đỏ, đồ bỏ quên); đo thời lượng thật ở bản 0.74.0, chỉ bỏ đèn đỏ ở lượt có đồ bỏ quên nếu quá dài |
| 6. Bác sĩ và Cứu hỏa cùng Feelings | **Giữ cả hai** (nhận ra cảm xúc ↔ cảm xúc thay đổi) |
| 7. Bán hàng đồ không ăn được | **Đồng ý**, quầy đồ dùng riêng |
| 8. Thứ tự | **Phần 1 trước**, rồi Phần 2 |
| 9. Cách làm | **10 bản gộp theo nghề** (bảng mục 12), thử với bé sau mỗi bản; không gộp cả 14 |

<details><summary>Câu hỏi gốc (draft1–2)</summary>

1. **Chọn 8 việc này?** Ứng viên khác nếu muốn đổi: Đầu bếp — *Pizza* (đặt topping theo màu + số, gần trang trí); Thợ xây — *Xây tháp cao / thấp* (*tall / short*, chưa có bài); Nông trại — *windy* (gió thổi bay mũ bác nông dân).
2. **Nông trại ca D dùng 3 thời tiết** (*hot, cold, rainy*) — *sunny* chỉ là thẻ nhiễu ở mức 3 vì "nắng đẹp" không cần giúp gì. Có muốn thêm *windy* (gió thổi bay mũ bác nông dân, bé chạm giữ mũ) không?
3. **Đầu bếp ca D thay A / C luân phiên** — hay thay hẳn ca C (trang trí) ở mức 1 cho lượt ngắn?
4. **Xe buýt đồ bỏ quên chỉ mức 2–3** — mức 1 có cần bản dễ (một người, đồ là dấu hiệu, chỉ để làm quen) không?
5. **Xe buýt mức 3** giờ có thời tiết + đèn đỏ + đồ bỏ quên trong một lượt — nếu lượt dài quá 3 phút khi thử với bé, bỏ đèn đỏ ở lượt có đồ bỏ quên?
6. **Bác sĩ (mục 6) và Cứu hỏa (mục 11) cùng ôn Feelings** — Bác sĩ: nhiều cảm xúc → chọn cách giúp; Cứu hỏa: luôn từ *scared* sang *happy*. Giữ cả hai hay đổi Cứu hỏa sang việc khác (ví dụ *"Which truck?"* — chọn xe cứu hỏa trong bãi xe, ôn Vehicles + Colors)?
7. **Bán hàng bán đồ không ăn được** (ô, kính, khăn, quạt) — được không, hay đổi sang đồ uống nóng / lạnh (*hot milk, cold water*) để giữ luật "chỉ bán đồ ăn"?
8. **Thứ tự làm cả 14 việc:** Phần 1 trước (4 nghề mới, bé đang chơi nhiều) rồi Phần 2? Hay xen kẽ?
9. **Cách làm:** 14 bản (mỗi mốc một bản), **10 bản gộp theo nghề** (bảng mục 12 — review đề xuất), hay gộp Phần 1 thành một bản và Phần 2 thành một bản? (Không gộp cả 14 vào một lần code.)

</details>

## 15. Trả lời review (draft2, 2026-11-16)
| Review | Đã sửa |
|---|---|
| A1 tháp AAB 3 khối nhưng bảng ghi 4; câu đọc viết cứng kiểu AB | Bảng AB (4 khối) / AAB (3 khối); câu đọc sinh từ dãy thật (4.2); JOBS4-30 |
| A2 Đồ bỏ quên mức 2: *daddy / sister / baby* không có dấu hiệu | Mức 2 chỉ hỏi *grandma / grandpa / mummy*; kế hoạch bảo đảm ≥ 1 người như vậy ở bến cuối (5.1); JOBS4-33 |
| A3 Cô giáo: câu nói khác cảnh cửa sổ | Câu trong bảng là ví dụ riêng từng mức (không phải một buổi) — **ghi rõ thêm**: cửa sổ là nguồn chuẩn, mọi câu sinh từ đúng thời tiết đó (9); JOBS4-31 |
| A4 Cứu hỏa: *scared* vừa là trạng thái đầu vừa là đáp án bước 2 | Bước 1 chăn luôn giải quyết *scared*; bước 2 chỉ *thirsty / sad*, gấu bông là đồ nhiễu (11); JOBS4-32 |
| A5 Đầu bếp: mức 1 khách nóng chưa rõ; mức 3 chưa có tổ hợp | Mức 1 đủ hai chiều + món đúng nhún; bảng 5 tổ hợp mức 3 (3.1); JOBS4-34 |
| A6 Bán hàng mức 3: sau khi chọn thẻ đúng thì sao | Khóa bước 1, nhắc lại chỉ bước 2 (7) + luật chung việc hai bước (1); JOBS4-35 |
| A7 Cảnh sát: trạng thái Stop / Go | Bảng trạng thái xe, thứ tự lệnh mức 3, nhầm lúc Stop (10); JOBS4-36 |
| A8 Nông trại: *sunny* và mã `barn` | *sunny* chỉ thẻ nhiễu, không ghi gì; `seen` dùng mã tình huống `weather:*` (2.1) |
| 2.1 Bưu tá mức 3 đòi kiến thức chưa dạy | Mức 1–2 Bông nói lý do (*"The sea! A boat!"*); mức 3 chỉ dùng nơi đã gặp, nơi mới thì dạy trước; nhầm lần 1 chỉ vào biển / núi (8) |
| 2.2 Đầu bếp mức 1 phải nhìn được | Dấu hiệu hơi / đá đủ to, món đúng nhún (3.1) |
| 2.3 Thời lượng lượt | Mục tiêu 2 / 2–3 / ≤ 3 phút để kiểm thử, không ép bé (1) |
| 3 Dữ liệu và kỹ thuật (kế hoạch, lưu, `claim`, giọng, dữ liệu thiếu, tiến độ, seed) | Phần lớn đã có trong luật chung (`SPEC-jobs3.md` 2.1–2.4, `SPEC-jobs2.md` 1); ghi rõ áp dụng cho cả 14 việc + thêm seed, dữ liệu thiếu, tiến độ thẻ nhiễu (1); JOBS4-37…39 |
| 3.1 Kiểm thử tổ hợp giữa các ca | Unit cả lượt (13) |
| 4 Mốc 8 / 6 / gộp | 10 bản theo nghề, có số bản dự kiến 0.71.0 → 0.80.0 (12); câu 9 sửa lại |
| B Bác sĩ: mặt buồn không quá đáng sợ | Mặt cảm xúc nhẹ nhàng (6) |
| 5 Đề xuất trả lời mục 14 | Review đề xuất: giữ cả 8 việc Phần 1; Nông trại giữ *hot / cold / rainy*, chưa thêm *windy*; Đầu bếp luân phiên A / C; Đồ bỏ quên chưa cần mức 1; Xe buýt mức 3 giữ cả ba rồi đo; giữ cả Bác sĩ và Cứu hỏa; đồng ý quầy đồ dùng; Phần 1 trước; 10 bản theo nghề — **chờ bố mẹ chốt** |

## 16. Ghi chú khi làm
### 0.71.0 — 👩‍🌾 Nông trại (F2 + F3)
- **Code:** `jobs/farm.js` thêm `makeWeatherCase`, `makeNight` / `nightOk`, `eggsOrPick`, câu nói ca D + Good night; `planRound(level, { rounds })` (B / C luân phiên theo `farmGame.rounds`), kế hoạch có `night`; kế hoạch cố định của mức cũng có ca D + `night`. `screens/farm.js` thêm ca D (`wcard` → `help`) và Good night (`night`).
- **Ca D:** lớp trời vẽ bằng CSS (mưa sọc xiên chạy, tuyết chấm rơi, mặt trời đỏ + nền cam) — không thêm ảnh. Thú dùng mặt "chưa vui" của Ca A nhưng **không có bong bóng 💭** (không đói), kèm dấu 💦 / ❄️ (run nhẹ) / 💧. Ba đồ giúp vẽ SVG ở góc trên phải: xô nước, chăn kẻ ô, cửa chuồng gỗ chéo. Giúp đúng: nóng → thú hết mồ hôi; lạnh → chăn khoác lên thân; mưa → thú đi về phía chuồng (thu nhỏ); trời tạnh, thú cười, *"Thank you!"*.
- **Mức 3:** đồ giúp **chỉ hiện sau khi chọn đúng thẻ thời tiết** (một bước một lúc; trên điện thoại thẻ và đồ không chồng lên nhau). Thẻ dùng emoji của bài Weather (🥵 🥶 🌧️ ☀️), không có chữ.
- **Good night:** trời xanh đậm + 🌙, 3 con ngồi ngoài sân bên phải chuồng; vào chuồng là trượt về phía chuồng rồi mờ đi. Con vào chuồng kêu tiếng của nó (file của Ai kêu thế?, không phát được thì bác nông dân nói tiếng kêu). Mức 1 bác đếm *"One! Two! Three!"*; mức 2–3 không đếm (đã có câu gọi). Đủ 3 con: chuồng tối lại, *"Shh! Good night!"* → Hoan hô + sticker.
- **Tiến độ:** một từ chỉ ghi "đã gặp" **một lần mỗi lượt** (ví dụ *cow* đã ghi ở ca A thì Good night không ghi lại).
- **Ra nền:** ca D lưu bước thẻ (`wcard`) và đồ; Good night lưu con đã vào chuồng; quay lại Good night không nói lại câu mở đầu.
- Test: unit `farm.test.js` (500 seed mỗi mức: loại ca theo mức + `rounds`, ca D, Good night, chia đều thời tiết, câu nói); UI `jobs4.spec.js` (JOBS4-01, 02, 03, 14, 15, mức 2 nhầm đồ + B / C luân phiên); `jobs3.spec.js` cập nhật bộ giải Nông trại cho các bước mới. Ảnh chụp iPad + điện thoại 390 px (mức 1 và 3: thẻ, đồ giúp, Good night).
