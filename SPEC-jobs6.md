# SPEC — 🧑‍⚕️ Đóng vai nghề: nói chọn món, đồ bỏ quên mức 1, thú nông trại khám bệnh, 5 nghề mới

> Phiên bản spec: **draft2** (sửa theo review, mục 13) · Ngày: 2026-11-20 · Dựa trên app 0.87.1. **Bố mẹ đã duyệt (2026-11-20).** Đã làm: 0.88.0, 0.89.0. Ghi chú khi làm: mục 14.
> - draft1: bản đầu, 8 bản, 7 câu hỏi.
> - **draft2, sửa theo review:** giới hạn thao tác mỗi mức + luật tiến độ + lưu / chạm trùng / giọng lỗi / micro lỗi cho mọi bản (mục 1.1); Đầu bếp khớp tên món theo từ, một lần chọn duy nhất giữa chạm và micro (2); Xe buýt dấu hiệu nhìn thấy, không trách (3); Bác sĩ kiểm vùng chạm riêng từng con, tiếng lỗi không kẹt (4); Thợ cắt tóc bỏ tóc giả, ít lọn (5); Nha sĩ một khách, chạm là tự chải, không đếm răng mức 1, kẹo không tính nhầm (6); Họa sĩ tách kỹ năng, "tô màu tự do" (7); Làm vườn sửa logic trời mưa, mức 1 hai bước (8); Người giữ thú bỏ tiếng ngựa cho ngựa vằn, voi = big, hươu = tall (9); trang chọn nghề, checklist nội dung (10, 11); chốt 7 câu hỏi (12).
>
> Bố mẹ đã chọn (2026-11-20): Bác sĩ thú y = **thêm thú nông trại vào Bác sĩ nhí** (không thẻ nghề mới); nghề mới **💇 Thợ cắt tóc, 🦷 Nha sĩ, 🧑‍🎨 Họa sĩ, 🧑‍🌾 Làm vườn, 🦁 Người giữ thú** (không làm Phi công); Đầu bếp mức 3 **vừa nói vừa chạm**.
> Bổ sung cho `SPEC-jobs.md`, `SPEC-jobs3.md` (khung chung mục 2.1–2.7), `SPEC-roles.md`, `SPEC-jobs4.md`, `SPEC-jobs5.md`. Nghề hiện có **giữ nguyên**, trừ phần ghi rõ ở mục 2–4.

## 1. Tóm tắt, thứ tự làm
Làm **lần lượt, mỗi bản một việc**; bé chơi thử bản trước rồi mới làm bản sau. **Không code nhiều nghề cùng lúc.**

| Bản | Việc | Mục |
|---|---|---|
| 0.88.0 | 👨‍🍳 Đầu bếp mức 3: bé nói tên món để chọn | 2 |
| 0.89.0 | 🚌 Xe buýt: đồ bỏ quên mức 1 | 3 |
| 0.90.0 | 🩺 Bác sĩ nhí: 3 bệnh nhân thú nông trại (bò, cừu, ngựa) | 4 |
| 0.91.0 | 💇 Thợ cắt tóc + trang chọn nghề 11–15 thẻ | 5, 10 |
| 0.92.0 | 🦷 Nha sĩ | 6 |
| 0.93.0 | 🧑‍🎨 Họa sĩ | 7 |
| 0.94.0 | 🧑‍🌾 Làm vườn | 8 |
| 0.95.0 | 🦁 Người giữ thú | 9 |

| Nghề | Ôn bài có sẵn | Từ / câu **mới** của nghề |
|---|---|---|
| 💇 Thợ cắt tóc | Colors, Đếm hình (*star, heart, circle*), số 1–3 | *hair, long, short, wash, dry, comb, cut, clip* |
| 🦷 Nha sĩ | **Body** (*mouth*), Food, số 1–5 | *teeth, brush, rinse, "Open wide!", "Say aah!", candy* |
| 🧑‍🎨 Họa sĩ | **Colors**, **Đếm hình**, *big / small* | *paint, picture, sun, cloud, tree, house* |
| 🧑‍🌾 Làm vườn | **Weather**, Colors, số 1–3 | *seed, water, flower, grow, watering can* |
| 🦁 Người giữ thú | Animals (tiếng kêu), Food, *big / small* | *elephant, giraffe, monkey, panda, penguin, zebra, lion; banana, leaves, bamboo, fish; tall* |

### 1.1 Luật chung cho mọi bản trong spec này (bắt buộc)
**Thao tác** (thao tác = một lần chạm / kéo có chủ đích của bé; hoạt ảnh tự chạy, câu nói, nhắc **không** tính):

| Mức | Một ca | Câu |
|---|---|---|
| 1 | **≤ 2 thao tác** | 1–3 từ |
| 2 | **≤ 3 thao tác** | 2–5 từ |
| 3 | ≤ 5 thao tác; chuỗi nói một lần **≤ 3 bước**, sai thứ tự chỉ nhắc bước cần làm | dài hơn nhưng chia nhịp, luôn có hình đi kèm |
- **Lượt** 3 ca, mục tiêu **2–3 phút** (mức 1 gần 2 phút). Đo thời lượng thật ở mỗi bản; quá thì giảm số đồ trong khoảng của mức, không thêm ca.
- Mỗi thao tác đúng **có phản hồi ngay** (nảy, tiếng, đồ bay), không đợi hết ca.
- **Không dùng câu chỉ dẫn bé chưa học** làm câu chính. *"That's enough!"* không dùng: đủ số thì đồ thừa **tự ẩn khỏi khay** và ca tự xong.
- Mọi từ mới **xuất hiện cùng hình** (đồ nảy lên khi được đọc tên lần đầu trong lượt).
- Câu tiếng Việt (phụ đề / giọng Việt khi bố mẹ bật) dịch tự nhiên, theo cơ chế phụ đề của nghề cũ.

**Tiến độ** (giống nghề cũ, nói rõ lại):
1. Từ của **bài có sẵn** chỉ ghi "đã gặp" khi bé làm **đúng ngay lần đầu** ở bước dùng từ đó.
2. Chạm sai trước, được nhún gợi ý, hoặc tự hoàn thành sau 2 lần nhắc: **không** ghi.
3. Từ mới của nghề chỉ ghi `seen` (không coi là đã học).
4. Một từ **ghi nhiều nhất một lần mỗi lượt** (`recorded` trong bản lưu); hoạt ảnh / callback chạy lại không ghi lần hai.

**Lưu, chạm trùng, giọng, micro** (kế thừa `SPEC-jobs3.md` 2.1–2.4, áp dụng nguyên cho 5 nghề mới và phần sửa nghề cũ):
- Kế hoạch lượt lập **một lần** (`planRound`), lưu ngay khi bắt đầu; bản lưu `{ roundId, level, plan, caseIndex, step, stepState, recorded, wrongs }` lưu **ngay khi nhận thao tác**, trước hoạt ảnh.
- Ra nền rồi quay lại (≤ 10 phút, cùng mức): đúng ca, đúng bước, trạng thái ổn định cuối, chỉ nói lại câu yêu cầu; không bốc lại, không ghi lại tiến độ. **Tắt hẳn app:** lượt mới — như 10 nghề cũ (bản lưu trong bộ nhớ). Muốn lưu qua khi tắt app thì làm chung cho mọi nghề ở spec khác.
- Mọi thứ chạm / kéo được dùng `claim(id)`: tính một lần; đồ đã xong không nhận nữa; bước sau chỉ nhận khi bước trước xong (khóa bước); một đồ không chạy hai hoạt ảnh cùng lúc; câu nói đi qua hàng `talk` (không chồng tiếng).
- **Giọng đọc lỗi:** phụ đề + hình vẫn hiện, thao tác vẫn làm được, không chờ giọng, không tự đọc lại liên tục (chỉ nhắc theo luật 10 giây).
- **File tiếng (con vật, sfx) lỗi:** bỏ qua tiếng, câu nói và ca vẫn chạy.
- **Micro / nhận dạng lỗi:** dừng nghe, đi tiếp bằng chạm; tắt nhận dạng cho cả buổi như `recognition.js`.

---

## 2. 👨‍🍳 Đầu bếp nhí — mức 3: nói tên món để chọn (0.88.0)
Thay lượt nói "sau khi chọn" ở mức 3 (`SPEC-jobs5.md` mục 5). Mức 2 **giữ nguyên**.

**Điều kiện:** ô "Cho bé nói khi chơi nghề" bật, mức 3, `app.mic.ready`, nhận dạng giọng nói chạy được (chưa lỗi trong buổi). **Thiếu một điều kiện → chọn bằng chạm như cũ** (chỉ đo âm lượng thì không biết món, nên không nghe ở thực đơn; lượt nói sau khi chạm vẫn chạy như 0.83.0 nếu ô bật và mic sẵn sàng).

**Cách chơi:**
1. Chú: *"What do you want?"* → 3 thẻ món hiện như cũ, **chạm được ngay**.
2. Cùng lúc 🎤 nhấp nháy dưới thẻ; lần đầu trong lượt chú nói thêm *"Say it, or touch it!"*. Nghe **một lần**, tối đa 6 giây (`listen`, `record: false`). **Không tự bật micro lại** ở chỗ này.
3. **Khớp một món** → thẻ đó nảy, sáng → *"Pizza! Great talking!"* → ⭐ bay → nấu. `talk:chef` +1.
4. **Không khớp / im lặng / hết giờ / lỗi:** 🎤 tắt, thẻ nhún nhẹ, chú *"Touch one!"* → chờ chạm (nhắc 10 giây theo luật chung). Không tính nhầm, không bắt nói lại.

**Chọn một lần duy nhất** (`claim('menu')`):
- Ai đến trước thắng: **chạm thẻ trước** → chọn theo chạm, dừng nghe, **bỏ kết quả micro** về sau; **kết quả giọng khớp trước** → chọn theo giọng, khóa thẻ (chạm sau không làm gì).
- Đã chọn bằng chạm thì **không** có lượt nói sau đó.

**Khớp tên món** (hàm thuần `matchDish(text, menu)`, unit test):
- Chuẩn hóa: chữ thường, bỏ dấu câu, tách **từ**. Khớp **theo cụm từ nguyên vẹn** (ranh giới từ), không khớp chuỗi con (*"pizzas"* ✓ dạng số nhiều cho phép; *"rice"* trong *"price"* ✗).
- Cụm của từng món, chỉ tính món **đang có trên thực đơn**:
  - 🍙 *rice ball* ← "rice ball", "rice balls", "rice";
  - 🥗 *fruit salad* ← "fruit salad", "salad", "fruit";
  - 🍕 *pizza* ← "pizza", "pizzas".
  - Cụm dài xét trước cụm ngắn ("fruit salad" là một món, không thành "fruit" + "salad").
- Ví dụ: *"pizza please"* → pizza · *"I want pizza"* → pizza · *"I like cake"* → không · *"salad"* → fruit salad · *"pizza and rice ball"* → pizza (món nói trước) · *"price"* → không.
- Hai món trong câu: lấy **cụm hoàn chỉnh xuất hiện trước**. Có từ phủ định (*"no pizza"*, *"not pizza"*) → coi như không khớp.
- Ra nền giữa lúc nghe: dừng nghe; quay lại hiện thẻ chờ chạm. 🧹: dừng nghe.
- **Hook test:** `__kidTest.chefTalkResult` thêm dạng `{ text: 'pizza please' }`.

## 3. 🚌 Xe buýt — đồ bỏ quên mức 1 (0.89.0)
Bản **làm quen**: một đồ, đồ là **dấu hiệu nhìn thấy được** của chủ.

- Mức 1 có 3 người trên vỉa hè bến cuối. Kế hoạch mức 1 bảo đảm **≥ 1** người trong *grandma / grandpa / mummy* (người có dấu hiệu: kính tròn / mũ nồi / túi xách); không được thì bốc lại (`planChecked`).
- Bác tài: *"Oh! A hat!"* → đồ bay lên giữa xe, to, xoay nhẹ. Đồ vẽ **giống hệt** dấu hiệu trên người (`ITEM_SVG`).
- **Nhìn là biết chủ:**
  - chủ **thiếu đúng dấu hiệu đó** trên hình, có bong bóng ❓ nhỏ trên đầu, nhìn quanh;
  - hai người còn lại **đủ dấu hiệu của mình**; không ai khác trên vỉa hè có cùng loại dấu hiệu bị thiếu (bất biến);
  - không dựa vào suy đoán theo tuổi, giới, sở thích ("mũ là của ông") — chỉ dựa vào chỗ thiếu nhìn thấy được.
- Bác tài: *"Whose hat?"* → bé chạm chủ → đồ bay tới, chủ đội / đeo lại → *"My hat! Thank you!"*. **1 thao tác.**
- Chạm người khác: người đó lắc đầu nhẹ *"Not mine!"*, **không âm sai, không tính nhầm** ở mức 1; bác tài nhắc lại. Sau 2 lần nhắc người đúng tự lấy (không ghi tiến độ).
- **Bất biến mức 1:** `lost.length === 1`, đồ = `SIGN` của chủ, chủ ở vỉa hè, dấu hiệu thiếu là duy nhất. Sửa `lostOk` + unit 500 seed.
- **Tiến độ:** Family khi đúng ngay lần đầu; `seen` mã đồ.

## 4. 🩺 Bác sĩ nhí — bạn thú nông trại (0.90.0)
Không thêm thẻ nghề; thêm 3 bệnh nhân vào Bác sĩ nhí.

| Bệnh nhân | Tên | Tiếng lúc vào (file có sẵn) | Cao độ |
|---|---|---|---|
| 🐮 bò | *Moo-Moo* (Bò Moo) | `cow.mp3` | 0.8 |
| 🐑 cừu | *Baa-Baa* (Cừu Baa) | `sheep.mp3` | 1.3 |
| 🐴 ngựa | *Neigh-Neigh* (Ngựa Hí) | `horse.mp3` | 1.0 |

- **Hình:** đứng hai chân, cùng viewBox 240 × 300 và tư thế 4 bạn thú hiện có, dùng chung `SPOTS`. Màu lông, sừng, bờm lấy từ thú Nông trại. **Tay = chân trước, chân = chân sau** (đặt đúng chỗ `hand` / `foot` của `SPOTS`). Sừng, bờm, tai dài **không lấn** sang vùng khác: phần lấn ra ngoài vùng `head` / `ear` là vùng không chạm.
- **Kiểm vùng chạm riêng từng con:** ảnh chụp có vẽ đè vòng `SPOTS` cho mỗi con (như ghi nhớ "Olly scene hit accuracy"); mỗi vùng trên hình phải nằm trong vòng của nó. Ảnh bố mẹ thay vẫn dùng vùng của hình vẽ.
- **Lúc vào phòng:** kêu tiếng của mình (file) → rồi nói triệu chứng *"Moo! My foot hurts!"*. File lỗi: bỏ tiếng, câu vẫn chạy.
- **Ca:** dùng chung 11 ca có sẵn. Thêm ca **`muddy`** (mức 1, chỉ thú nông trại):
  - Bò / cừu / ngựa **vào phòng đã có vết bùn nâu to ở chân** (thấy trước khi nghe), *"Moo! I'm muddy!"* / *"Tớ lấm bùn hết rồi!"*.
  - Bước: chạm chân → đưa **miếng bọt biển** 🧽 vàng có bọt (đồ chữa mới `sponge`, câu *"A sponge, please!"*; nảy + đọc tên khi hiện ở khay) → bùn tan thành bọt, *"Clean! Thank you!"*. 2 thao tác.
- **Bốc:** 7 bạn, ưu tiên ít gặp (`seen` mã bệnh nhân), một lượt 3 bạn khác nhau. `muddy` chỉ gặp với thú nông trại.
- **Tiến độ:** *cow* (Animals) "đã gặp" khi chữa xong ca của bò, đúng ngay mọi bước. *sheep, horse, sponge, muddy*: `seen`.
- Ảnh bố mẹ: 3 bệnh nhân mới thay được ảnh như 4 bạn cũ (prompt, ảnh gọn trong khung).

---

## 5. 💇 Thợ cắt tóc (Hairdresser) — `hair` (0.91.0)
**Người lớn bên trái:** cô thợ cắt tóc (tạp dề tím). **Khách:** 4 bạn thú của Bác sĩ nhí, có **lớp tóc** SVG riêng trên đầu (dài / ngắn, đổi màu được). Bông phụ giúp đeo tạp dề nhỏ.

**Nguyên tắc nội dung:** kéo chỉ chạm tóc, không gần mắt / tai; sấy ấm; không cạo, không ai khóc; tóc rơi thành lọn mềm. Đổi màu tóc là **phép màu đồ chơi** (vẩy lấp lánh), không có lọ hóa chất.

### 5.1 Ca A — Gội, sấy, chải (động từ)
- Mỗi bước **một thao tác**, hoạt ảnh tự chạy: chạm vòi sen → bọt, *"Splash!"* · chạm máy sấy → tóc bồng, *"Whoosh!"* · kéo lược qua tóc **một lần** → tóc mượt.
- Mức 1: *"Wash!"* → *"Dry!"* (2), đồ đúng nảy nhẹ.
- Mức 2: *"Wash, please!"* → *"Dry, please!"* → *"Comb, please!"* (3); khay 4 đồ (vòi sen, máy sấy, lược, gương nhiễu). Sai: *"That's the mirror. Dry, please!"*.
- Mức 3: cô nói cả chuỗi một lần *"Wash, dry, and comb!"* (đọc chậm); sai thứ tự: *"First, wash!"* (như cơm nắm).

### 5.2 Ca B — Dài / ngắn
- **Không có tóc giả.** *long / short* dạy bằng **hình đối chiếu**: khách tóc dài tới vai cạnh khách tóc ngắn.
- Mức 1: một khách tóc dài: *"Short, please!"* → chạm kéo → chạm tóc → *xoẹt*, tóc ngắn, lọn rơi → *"Short! I love it!"* (2).
- Mức 2: 2 khách chờ (một dài, một ngắn). Cô: *"Long hair first!"* → bé chạm khách tóc dài (ghế xoay ra) → kéo → tóc (3). Chạm khách tóc ngắn: *"That's short hair. Long hair, please!"* (tính nhầm).
- Mức 3: như mức 2 với 3 khách (tóc dài hai màu khác nhau + một ngắn): *"Long yellow hair first!"* → chạm khách → kéo → tóc → *"Pink, please!"* → chạm lọ lấp lánh hồng trong 3 lọ (4).

### 5.3 Ca C — Kẹp tóc (hình, số, màu)
- Khay ít đồ, to, cách xa nhau. Chạm hoặc kéo kẹp lên tóc đều được.
- Mức 1: *"A star, please!"* → khay 2 kẹp (⭐ / ●) → 1 thao tác.
- Mức 2: *"Two hearts!"* (1–3) → khay 3 loại × 2 cái.
- Mức 3: *"Two red hearts!"* → có kẹp tim màu khác làm nhiễu (≤ 6 kẹp).
- Đủ số: kẹp còn lại **tự bay về hộp**, ca xong. Sai loại: *"That's a star. Hearts, please!"* (tính nhầm).
- Chỉ dùng hình bé đã gặp ở Đếm hình (như Thợ xây mức 3).

### 5.4 Lượt
- Mức 1: A → B → C. Mức 2–3: thứ tự ngẫu nhiên; mỗi ca một khách. Cuối lượt khách soi gương *"Beautiful!"* → Hoan hô + sticker.
- **Tiến độ:** màu (Colors) khi chọn màu / kẹp đúng ngay; hình (Đếm hình) khi kẹp đúng ngay; số khi đủ kẹp không nhầm. `seen`: *hair, long, short, wash, dry, comb, cut, clip*.

## 6. 🦷 Nha sĩ (Dentist) — `dentist` (0.92.0)
Chăm răng khỏe, khác ca `tooth` của Bác sĩ nhí. **Người lớn bên trái:** cô nha sĩ (áo trắng, khẩu trang kéo xuống cằm để thấy mặt cười). **Một khách cho cả lượt** (một lần khám: mở miệng → chải → dặn ăn), mọi mức — ít chuyển cảnh, dễ theo dõi.

**Nguyên tắc nội dung:** không khoan, nhổ, tiêm, đau; không "sâu răng" đen. Răng **to, tròn, trắng**; "bẩn" là **mẩu rau xanh nhỏ** dính trên răng, chải là sạch. Kết thúc luôn *"Great teeth!"*.

### 6.1 Ca A — "Open wide!"
- Mức 1: *"Open wide!"* → bé chạm miệng → khách *"Aah!"*, miệng mở to, răng lấp lánh (1).
- Mức 2: như mức 1, rồi *"How many teeth?"* → 2–5 răng, 3 thẻ số (2). Luật thẻ số như Cứu hỏa.
- Mức 3: như mức 1, rồi 1–2 răng có mẩu rau: *"Oops, food! Touch it!"* → bé chạm răng có mẩu rau, mẩu rau bay đi (2–3). Chạm răng sạch: răng lấp lánh, *"That's clean!"* (tính nhầm, nhẹ).

### 6.2 Ca B — Chải, súc
- **Chạm bàn chải là tự chải** (hoạt ảnh qua lại, bọt, *"Brush, brush!"*). Không bắt kéo nhiều lần.
- Mức 1: *"Brush!"* → chạm bàn chải (1).
- Mức 2–3: *"Brush!"* → *"Rinse!"* → chạm cốc → *"Gargle!"* (tiếng ùng ục `sfx`), nhổ vào bồn → ✨ (2). Khay có nhiễu (lược, thìa): *"That's a comb. Brush, please!"*.
- Khóa bước: bàn chải đã dùng mờ đi, cốc chỉ nhận một lần, hoạt ảnh súc không lặp.

### 6.3 Ca C — Đồ ăn tốt cho răng
- Món tốt: 🍎 *apple*, 🥕 *carrot*, 🥛 *milk*, 🧀 *cheese*. Món "ít thôi": 🍬 *candy*, 🍭 *lollipop*, 🥤 *soda*.
- Mức 1: *"Good for teeth?"* → 2 món (1 tốt + 1 kẹo) → chạm món tốt → món vào giỏ, *"Yummy! Apple!"* (1).
- Mức 2: 4 món, kéo / chạm 2 món tốt vào giỏ (2). Mức 3: 5 món, 3 món tốt (3); cô đọc tên mỗi món vào giỏ.
- **Chạm kẹo / nước ngọt:** món lắc nhẹ, cô cười *"Candy? Not too much!"* + hình 🍬 nhỏ cạnh chiếc đồng hồ cát (*"thỉnh thoảng thôi"*); **không tính nhầm, không âm sai**, rồi nhắc lại câu. Không có *"Bad!"*, không có răng đau.

### 6.4 Lượt
- A → B → C, một khách. Cuối: khách cười khoe răng *"Great teeth!"* → sticker.
- **Tiến độ:** *mouth* (Body) khi chạm miệng đúng ngay; *apple, carrot, milk, cheese* (Food) khi chọn đúng ngay; số khi chọn thẻ đúng ngay. `seen`: *teeth, brush, rinse, candy, lollipop, soda*.

## 7. 🧑‍🎨 Họa sĩ (Painter) — `paint` (0.93.0)
**Người lớn bên trái:** cô họa sĩ (mũ nồi đỏ, bảng màu). **Khách:** bạn thú đặt tranh. Khác trò Tô màu: **nghe rồi tô**, màu là đáp án; mỗi vùng chạm một lần là tô kín.

**Cách tô:** chạm lọ màu (cọ chấm màu, lọ sáng viền) → chạm vùng → tô kín, *"Swish!"*. Màu là đáp án nên **không thay bằng ảnh**.

### 7.1 Ca A — Tô theo màu
- Tranh 2–4 vùng to (mặt trời, mây, cây, nhà).
- Mức 1: **vùng cần tô luôn nhấp nháy**; *"Yellow!"* (cô chỉ nói màu), bảng 3 màu → chạm màu → chạm vùng (2).
- Mức 2: không nhấp nháy; *"The sun, yellow!"* (vùng + màu), bảng 4 màu (2). Một câu, một vùng.
- Mức 3: *"Paint the sun yellow!"* rồi *"Now the tree green!"* — hai vùng, **nói lần lượt** (4).
- Sai màu: vùng nhận màu rồi phai lại, khách *"Hmm, a red sun? Yellow, please!"* (tính nhầm). Sai vùng: *"That's the cloud. The sun, please!"* (tính nhầm).

### 7.2 Ca B — Hình (mỗi mức một kỹ năng)
- Khung có **nét chấm mờ** của vài hình; chạm nét chấm → hình hiện ra, tô màu.
- Mức 1 — **nhận biết theo tên:** *"A circle!"*, 2 nét chấm (tròn / vuông) (1).
- Mức 2 — **nhận biết, nhiều lựa chọn hơn:** 3 nét chấm, thêm *triangle, star, heart* (1).
- Mức 3 — **số + cỡ:** *"Two big circles!"*: tròn to / nhỏ lẫn nhau, đúng 2 tròn to (2).
- Chỉ dùng hình bé đã gặp ở Đếm hình (như Thợ xây mức 3).

### 7.3 Ca C — Tô màu tự do
- *"Your picture! Any color!"* — tranh **4 vùng cố định**, bé tự chọn màu cho từng vùng, không đúng / sai, không vẽ bằng ngón tay.
- Xong khi tô đủ 4 vùng **hoặc** bấm ✓ (hiện sau vùng đầu tiên). Tranh vào khung, treo lên tường tiệm, khách *"Beautiful!"*. **Không lưu** (chỉ hiện cuối lượt).
- Không tính thao tác tối đa của mức (là phần thưởng), nhưng ≤ 4 vùng.

### 7.4 Lượt
- Mức 1: A → B → C. Mức 2–3: A, B thứ tự ngẫu nhiên, C cuối.
- **Tiến độ:** màu (Colors) khi tô đúng ngay; hình (Đếm hình) khi chọn đúng ngay. Ca C không ghi. `seen`: *paint, picture* + mã vùng (*sun, cloud, tree, house*).

## 8. 🧑‍🌾 Làm vườn (Gardener) — `garden` (0.94.0)
Chăm **cây, hoa**, không có con vật nuôi. **Người lớn bên trái:** bà làm vườn (mũ rộng vành, găng tay xanh). **Khách:** bạn thú xin hoa (ca C).

**Nguyên tắc nội dung:** không thuốc trừ sâu, không ai bị ong đốt; bướm, ong bay qua cho vui.

### 8.1 Ca A — Trồng hoa
- Mức 1: hố đất có sẵn. *"Seed!"* → kéo / chạm hạt vào hố → *"Water!"* → chạm bình tưới (2) → **mặt trời tự ra**, mầm mọc, hoa nở → *"It's growing!"*.
- Mức 2: *"Seed!"* → *"Water!"* → *"Sun!"* (chạm mây, mây trôi, mặt trời ra) (3). Khay có nhiễu (bình sữa, thìa).
- Mức 3: bà nói một lần *"Seed, water, sun!"*; sai thứ tự chỉ nhắc bước cần làm (3).

### 8.2 Ca B — Thời tiết
Cửa sổ thời tiết là **nguồn chuẩn** cho câu (như Nông trại 2.1). Mỗi thời tiết **một việc có lý do nhìn thấy** và một thao tác:

| Thời tiết | Bà nói | Bé làm | Kết quả |
|---|---|---|---|
| ☀️ *sunny* | *"It's sunny! Water, please!"* | chạm bình tưới | hoa héo → tươi lại |
| 🌧️ *rainy* | *"It's rainy! Umbrella, please!"* | đưa **ô cho bà** để bà ra vườn | bà che ô ra vườn, mưa tưới hoa, *"The rain helps!"* |
| 💨 *windy* (mức 2–3) | *"It's windy! A stick, please!"* | chạm cọc | cây cao đang nghiêng được buộc vào cọc, đứng thẳng |
| ❄️ *cold* (mức 3) | *"It's cold!"* | chạm tấm phủ | tấm phủ đắp lên luống, hoa ấm |
- Mức 1: *sunny* / *rainy*, đồ đúng nảy; khay 2 đồ (1).
- Mức 2: 3 thời tiết, khay 3 đồ, câu có tên đồ (1).
- Mức 3: 4 thời tiết; bà **chỉ tả trời** (*"It's windy!"*), bé tự chọn đồ (1). Sai: *"Hmm, it's windy. A stick!"* (tính nhầm).
- Không có ca nào đáp án là "không làm gì".

### 8.3 Ca C — Hái hoa cho khách
- Mức 1: *"Red flowers!"* → 2 bông đỏ trong luống 2 màu → chạm từng bông (2).
- Mức 2: *"Three red flowers!"* (1–3), 3 màu (≤ 3).
- Mức 3: *"Two big yellow flowers!"* (màu + số + cỡ), bất biến như hái táo của Nông trại (2).
- Đủ số: luống ngừng nhận, bông bay thành bó, bà đếm. Sai màu: *"That's blue. Red, please!"* (tính nhầm).

### 8.4 Lượt
- Mức 1: A → B → C. Mức 2–3: thứ tự ngẫu nhiên, A không đứng cuối.
- **Tiến độ:** thời tiết (Weather) khi chọn đồ đúng ngay ở mức 3 (mức 1–2 câu đã có tên đồ → chỉ `seen` mã thời tiết); màu, số khi đúng ngay. `seen`: *seed, water, flower, grow, watering can, stick*.

## 9. 🦁 Người giữ thú (Zookeeper) — `zoo` (0.95.0)
Thú hoang trong vườn thú (Nông trại là vật nuôi). **Người lớn bên trái:** chú giữ thú (mũ rộng vành, áo kaki). Thú vẽ SVG cùng kiểu thú Nông trại, emoji dự phòng, bố mẹ thay ảnh được.

**Nguyên tắc nội dung:** chuồng rộng có cây, không song sắt nặng nề, không roi; **sư tử chỉ ngủ / ngáp / kêu / chào**, không cho ăn, không săn mồi, không tấn công; bé không vào chuồng sư tử.

| Thú | Tiếng | Thức ăn | Đặc điểm nhìn thấy |
|---|---|---|---|
| 🐘 *elephant* | kèn (`sfx`) | *bananas* | **big** |
| 🦒 *giraffe* | không | *leaves* (cành lá trên cao) | **tall** |
| 🐒 *monkey* | `monkey.mp3` | *banana* | small |
| 🐼 *panda* | không | *bamboo* | |
| 🐧 *penguin* | không | *fish* | small |
| 🦓 *zebra* | **không** (không dùng tiếng ngựa) | *grass* | sọc đen trắng |
| 🦁 *lion* | `lion.mp3` | — | chỉ ở ca C |
- Voi và khỉ cùng ăn chuối: **không cùng một ca A** (đáp án duy nhất).

### 9.1 Ca A — Cho ăn
- Như Nông trại 4.1: *"The monkey is hungry!"* → khay thức ăn → đúng thì nhai *"Yummy!"*.
- Mức 1: bong bóng thức ăn luôn hiện, khay 2 đồ (1).
- Mức 2: chỉ nghe *"Bamboo, please!"*, khay 3 đồ; bong bóng hiện sau lần nhầm đầu (1).
- Mức 3: *"Who eats bamboo?"* — 3 thú đứng sẵn, bé đưa bamboo cho đúng con (2: chọn đồ có sẵn trên tay chú → chạm thú).

### 9.2 Ca B — To / nhỏ, cao
- Mức 1: *"Who is big?"* → voi / khỉ → chạm voi (1).
- Mức 2: *"Who is big?"* / *"Who is small?"* / *"Who is tall?"* (hươu cạnh chim cánh cụt) — 2 thú, khác nhau rõ (1).
- Mức 3: *"Two small animals!"* → 4 thú, đúng 2 con nhỏ (2). Không so sánh nhất (*biggest*).

### 9.3 Ca C — Ai kêu thế?
- Chuồng có rèm lá; chỉ dùng thú **có tiếng**: sư tử, khỉ, voi.
- Mức 1: 2 chuồng; nghe một tiếng → *"Who's that?"* → chạm chuồng → rèm vén, thú chào (1). Sư tử: ngáp, *"Roar! Hello!"*.
- Mức 2: 3 chuồng (1).
- Mức 3: 3 chuồng, **2 tiếng lần lượt**, nghỉ rõ ≥ 1,5 giây giữa hai tiếng, mở theo thứ tự (2); nút 🔊 nghe lại từng tiếng. Thêm câu *"Lions are big. We stay outside!"* khi mở chuồng sư tử (chỉ mức 3).
- Chạm sai chuồng: rèm hé, thú trong đó kêu / vẫy, *"Not me!"* (tính nhầm).

### 9.4 Lượt
- Mức 1: A → C → A (hai thú khác nhau). Mức 2–3: A + B + C thứ tự ngẫu nhiên.
- **Tiến độ:** thú vườn thú là từ mới (`seen`); thức ăn có trong bài Food ghi "đã gặp" khi đúng ngay; *big / small* `seen`.

---

## 10. Chung cho 5 nghề mới
- **Khung:** `jobs/kit.js`; mỗi nghề `jobs/<mã>.js` (file thuần + unit: kế hoạch lượt, bất biến 500 seed mỗi mức, số thao tác ≤ mục 1.1, số từ theo mức) + `screens/<mã>.js`. Bố cục hai bên (`roles`), người lớn bên trái vào `JOB_PEOPLE` (thay ảnh, có prompt), Bông đội đồ theo nghề.
- **Mức:** `hairGame`, `dentistGame`, `paintGame`, `gardenGame`, `zooGame` = `{ level, rounds, lock, seen }` — chỉ là **mức và tiến độ**; trạng thái đang chơi nằm trong bản lưu (mục 1.1). 3 lượt lên một mức (tối đa 3); khóa mức ở Cài đặt → Đóng vai nghề. Sao lưu / chia sẻ như nghề cũ.
- **Ảnh nền** mỗi nghề (`jobs/backgrounds.js`, prompt). Không thay bằng ảnh thứ là đáp án (màu, hình, số, dài / ngắn, thời tiết).
- **Âm thanh:** file có sẵn; tiếng mới (sấy, súc miệng, cọ, kèn voi, nước tưới) bằng `sfx.js`.
- **Lượt nói** chưa thêm vào 5 nghề mới.
- **Trang chọn nghề 10 → 15 thẻ:**
  - Mọi thẻ đều mở (không có thẻ khóa). Thứ tự cố định: 10 nghề cũ rồi 💇 🦷 🧑‍🎨 🧑‍🌾 🦁 — thẻ cũ **không đổi chỗ** khi thêm nghề.
  - Màn ngang 5 × 3; màn dọc 3 cột; cuộn dọc khi không vừa, không cuộn ngang. Thẻ cuối không bị che bởi thanh dưới / vùng an toàn (`safe-area-inset-bottom`).
  - **Cuộn không bấm nhầm:** thẻ chỉ mở khi nhấc tay mà ngón chưa di chuyển quá 10px.
  - Ảnh chụp kiểm: iPad ngang / dọc, điện thoại nhỏ (375 × 667) ngang / dọc, với 11 và 15 thẻ.

## 11. Mốc và kiểm thử
| Bản | Nghiệm thu | Test |
|---|---|---|
| 0.88.0 | Nói đúng món → chọn món; chạm vẫn được lúc nghe; chạm và giọng cùng lúc → chỉ một món; im / lỗi / sai tên → "Touch one!" không kẹt, không nghe lại; thiếu điều kiện → chạm như cũ | unit `matchDish` (bảng ví dụ mục 2); UI JOBS6-01…06 (micro giả, kể cả chạm đúng lúc có kết quả) |
| 0.89.0 | Mức 1 luôn có 1 đồ, chủ thiếu dấu hiệu duy nhất + ❓, chạm nhầm không âm sai | unit `lostOk` 500 seed mức 1; UI JOBS6-07, 08 |
| 0.90.0 | Vùng chạm đúng trên từng con (ảnh chụp có vòng `SPOTS`); kêu tiếng trước; tiếng lỗi không kẹt; `muddy` thấy bùn trước khi nghe | unit bốc 3 bạn khác nhau, `muddy` chỉ thú nông trại; UI JOBS6-09…11 |
| 0.91.0 – 0.95.0 | Mỗi nghề: 3 mức chơi hết lượt; số thao tác ≤ mục 1.1; lượt 2–3 phút (đo tay); bất biến 500 seed; ảnh chụp iPad + điện thoại | unit `<nghề>.test.js`; UI `<nghề>.spec.js`: mỗi ca × mức, nhầm, gợi ý, tự hoàn thành sau 2 nhắc, chạm trùng / chạm nhanh khi đang hoạt ảnh, ra nền giữa ca (đúng ca, đúng bước, không ghi lại tiến độ), 🧹, giọng đọc lỗi (không kẹt) |

**Checklist nội dung** (kiểm tay mỗi bản, ghi kết quả vào mục ghi chú):
- Câu tiếng Anh tự nhiên, đúng ngữ pháp, đúng số từ theo mức.
- Tên đồ / con vật / động từ nhất quán giữa câu, phụ đề, hình.
- Phụ đề tiếng Việt tự nhiên.
- Mỗi câu yêu cầu có **đúng một** đáp án hợp lý trên màn.
- Âm thanh khớp hình (không dùng tiếng con này cho con khác).
- Từ mới luôn có hình đi kèm.
- Không có hình / câu đáng sợ, không trách bé.
- Mỗi bản: chạy **toàn bộ** unit + UI trước khi commit. Bé chán / khó → bố mẹ báo, sửa ở bản sau.

## 12. Đã chốt (2026-11-20 — theo review)
1. **Thợ cắt tóc:** không tóc giả; mức 1 *short*, mức 2 thêm *long* bằng hình đối chiếu, mức 3 kết hợp màu.
2. **Đổi màu tóc mức 3:** giữ, là phép màu đồ chơi (lấp lánh), không hóa chất.
3. **Nha sĩ — kẹo / nước ngọt:** giữ, câu *"Not too much!"*, không tính nhầm, không hình đáng sợ.
4. **Nha sĩ:** một khách cả lượt (mọi mức), mức 1 ít thao tác.
5. **Họa sĩ tô màu tự do:** chỉ hiện cuối lượt, không lưu album.
6. **Người giữ thú:** giữ sư tử (ngủ, ngáp, kêu, chào; không cho ăn).
7. **Thứ tự:** 💇 → 🦷 → 🧑‍🎨 → 🧑‍🌾 → 🦁.

## 13. Trả lời review (draft2, 2026-11-20)
| Review | Sửa |
|---|---|
| Mức 1 quá nhiều thao tác (Nha sĩ, Thợ cắt tóc, Làm vườn) | Bảng giới hạn mục 1.1 (mức 1 ≤ 2 / ca); Nha sĩ không đếm răng mức 1, chạm là tự chải; cắt tóc một lần chạm; Làm vườn mức 1 hai bước, mặt trời tự ra |
| Câu tiếng Anh khó | Bỏ *"That's enough!"* (đồ thừa tự ẩn); *"Touch the dirty teeth!"* → *"Oops, food! Touch it!"* có mẩu rau nhìn thấy; *"Who eats bamboo?"* chỉ mức 3; *"Two small animals!"* chỉ mức 3; *"Lions are big…"* chỉ mức 3 |
| Thiếu giới hạn thời gian / thao tác | Mục 1.1 |
| Luật tiến độ chưa thống nhất | Mục 1.1 (4 luật); bỏ ghi *eyes / ears* ở Thợ cắt tóc |
| Đầu bếp: khớp theo từ, chạm ↔ micro, không bật lại micro | Mục 2: `matchDish` theo cụm từ, phủ định, `claim('menu')`, nghe một lần |
| Xe buýt: dấu hiệu trực quan | Mục 3: thiếu đúng dấu hiệu + ❓, người khác đủ dấu hiệu, không suy đoán theo tuổi / giới, không âm sai |
| Bác sĩ: vùng chạm từng con, `muddy`, tiếng lỗi | Mục 4: ảnh chụp vòng `SPOTS` từng con, sừng / bờm không lấn; bùn thấy trước, bọt biển rõ; file lỗi không kẹt |
| Thợ cắt tóc: tóc giả, ít kẹp | Mục 5: bỏ tóc giả, hình đối chiếu; khay ≤ 2 đồ mức 1 |
| Nha sĩ: đếm răng, kéo chải, khóa bước | Mục 6 |
| Họa sĩ: tách kỹ năng; "tranh tự do" | Mục 7.2 mỗi mức một kỹ năng; 7.3 "tô màu tự do" 4 vùng |
| Làm vườn: logic trời mưa, bỏ *dig* | Mục 8.2 trời mưa đưa ô cho bà (có thao tác, có lý do), không đáp án "không làm gì"; bỏ *dig* |
| Người giữ thú: tiếng ngựa cho ngựa vằn, voi / hươu, mức 3 hai tiếng | Mục 9: ngựa vằn không tiếng; voi = big, hươu = tall; hai tiếng nghỉ ≥ 1,5 giây, có nghe lại |
| Lưu trạng thái, chạm trùng, giọng lỗi | Mục 1.1 (kế thừa `SPEC-jobs3.md` 2.1–2.4, nói rõ lại); `{ level, rounds, lock, seen }` chỉ là mức |
| Checklist nội dung | Mục 11 |
| Trang chọn nghề 15 thẻ | Mục 10: không thẻ khóa, không đổi chỗ, cuộn không bấm nhầm, vùng an toàn, ảnh chụp 4 cỡ màn |
| Tắt hẳn app giữa ca | Giữ như 10 nghề cũ (lượt mới); làm chung cho mọi nghề ở spec khác nếu cần |

## 14. Ghi chú khi làm
### 0.88.0 — 👨‍🍳 nói tên món (mục 2)
- `jobs/chef.js`: `matchDish(text, menu)` / `matchDishAlts(alts, menu)` (cụm từ nguyên vẹn, cụm dài trước, món trên thực đơn, món nói trước, phủ định *no / not / don't* → không khớp); câu `SAY_OR_TOUCH_LINE`, `TOUCH_ONE_LINE`, `saidDishLine` (*"Pizza! Great talking!"*).
- `screens/chef.js`: `menuListenOn()` = mức 3 + lượt nói bật + `mic.ready` + `recognizer.enabled`. Thẻ chạm được ngay (trạng thái `menu` từ lúc chú hỏi); sau câu hỏi + *"Say it, or touch it!"* nghe **một lần** ≤ 6 giây (`listen` với `matcher` = `matchDishAlts`, không ghi âm). Chọn món chung một chỗ `chooseDish` (`taken.take('dish')`): chạm thì hủy nghe (`AbortController`), giọng khớp thì khóa thẻ. 🧹 / ra nền cũng hủy nghe; quay lại thì chờ chạm, không nghe lại.
- Thiếu nhận dạng (chỉ đo âm lượng) ở mức 3: như 0.83.0 (chạm rồi lượt nói *"Pizza, please!"*). Mức 3 có nhận dạng: chạm thì **không** có lượt nói sau.
- Test: unit `matchDish` (bảng ví dụ); UI `jobs6.spec.js` JOBS6-01…06 (`chefTalkResult = { text, delay?, error? }`, `delay` là thời gian thật).

### 0.89.0 — 🚌 đồ bỏ quên mức 1 (mục 3)
- `jobs/bus.js`: `makeLost` mức 1 như mức 2 (một đồ `SIGN` của người có dấu hiệu trên vỉa hè); `lostOk` mức 1–2 bắt buộc đúng 1 đồ; `fallbackPlan(1)` có kính của bà. Câu mức 1 *"Oh! A hat! Whose hat?"* (kính: *"Oh! Glasses! Whose glasses?"*).
- `screens/bus.js`: mức 1–2 người bỏ quên vẽ thiếu dấu hiệu; mức 1 thêm class `asking` (❓ trên đầu, nghiêng đầu nhìn quanh). Chạm nhầm mức 1: *"Not mine!"*, không `boing`, không tính nhầm (vẫn gộp chạm trùng 0,4 giây); trả đúng vẫn ghi Family + `seen`.
- Test: unit bus (500 seed mức 1 luôn 1 đồ, câu mức 1); UI JOBS6-07, 08; sửa test Xe buýt mức 1 cũ (giờ có đồ bỏ quên).
- Kèm: `app/shared/index.json` thêm `sieu-nhan-an-toan-2026-11-20.zip` (bố mẹ tải lên GitHub).
- Sửa 2 test hay lỗi khi chạy cả bộ (máy chậm): SAFE-S2-02 ghi lại lúc hình nhắc lại hiện (MutationObserver) thay vì bắt đúng khoảnh khắc; JOBS4-27 chỉ kiểm không có xe khác chạy (xe đúng có thể đã chạy xong).
