# SPEC — 🧑‍⚕️ Đóng vai nghề: nhiệm vụ mới cho Bán hàng, Bưu tá, Cô giáo nhí, Cảnh sát

> Phiên bản spec: **draft2** (sửa theo review, mục 10) · Ngày: 2026-10-26 · **Chưa làm** (làm sau Bác sĩ DR2–DR3). Bổ sung cho `SPEC-jobs.md` mục 3–6 (cách chơi hiện có của 4 nghề — **giữ nguyên**).
> Cùng khung với Cứu hỏa (`SPEC-fire2.md`) và Bác sĩ (`SPEC-doctor2.md`): mỗi nghề thêm **việc mở đầu lượt**, **ca kiểu mới** xen với ca cũ, và / hoặc **việc nhỏ cuối ca / cuối lượt**.

## 1. Luật chung (áp dụng cho mọi việc mới)
- Mỗi việc gắn với **từ / mẫu câu mới** hoặc **ôn bài đã có** (màu, số, hình, đồ ăn, hành động, con vật).
- **Giữ nguyên luật của khung nghề** (`jobs/kit.js`): phụ đề có người nói; nhắc sau 10 giây (tối đa 2 lần mỗi bước); nhận thao tác đúng ngay cả khi đang có người nói; 🧹 chơi lại; mức + khóa mức; lượt xong → Hoan hô + sticker (một lần).
- **Bước có đáp án** (bảng "Tính nhầm? Có" từng nghề): nhầm → câu nhầm nói đúng tên thứ vừa chạm + nhắc lại yêu cầu; nhầm lần 2 → đáp án nhún; chạm nhầm cùng chỗ trong 0,4 giây gộp làm một. **Bước khám phá** (bảng "Không"): không tăng bộ đếm nhầm, chỉ nhắc / nhún.
- **Ba lớp dữ liệu, tách rõ** (như Cứu hỏa / Bác sĩ đã làm):
  1. **Kế hoạch lượt** — lập **một lần** khi bắt đầu lượt (mọi ca, đáp án, đồ, số sao…), nằm trong bản lưu chơi tiếp của nghề; ra nền không bốc lại; chỉ lập lại ở lượt mới / 🧹.
  2. **Trạng thái bước** — lưu **ngay sau mỗi thao tác được nhận** (trước hoạt ảnh); quay lại hiện trạng thái ổn định cuối cùng, chỉ nói lại câu hỏi, không chạy lại hoạt ảnh đã xong.
  3. **Tiến độ học** — ghi bằng hàm có sẵn, **chỉ khi đúng ngay lần đầu** ở bước có đáp án; tập `recorded` của lượt chặn ghi lặp (ra nền / 🧹 / chạm nhanh). Sticker cuối lượt và `rounds` ghi một lần.
- **Chỉ ghi tiến độ dựa trên thao tác app xác minh được** (chạm / chọn đúng). Câu "bé nói theo" chỉ là lời mời, không ghi tiến độ (máy không có / không dùng mic).
- **Lượt không dài thêm nhiều:** ca mới **thay** một ca cũ (số ca / thư / hình mỗi lượt giữ như cũ); việc mở đầu ≤ ~15 giây; câu giao tiếp dài tách thành từng câu ngắn, có ngắt.
- **Dữ liệu thiếu không làm lỗi:** mọi danh sách (món, đồ trong hộp, bạn thú, hành động) lọc trước khi lập kế hoạch; thiếu thì bù bằng **bộ mặc định có sẵn**; không bao giờ hỏi về đồ / bạn không có trên màn hình.

---

## 2. 🛒 Bán hàng
Từ mới: *fruit, drink, bag, smoothie, have a nice day*; ôn đồ ăn (bài Food), số.

### 2.1 Dữ liệu
- **Nhóm món** (bảng cố định trong `jobs/shop.js`, theo mã món của Cho Bông ăn):

  | Nhóm | Món | Làm sinh tố? |
  |---|---|---|
  | `fruit` | banana, apple, orange, grapes, strawberry, watermelon, mango, coconut | có: banana, apple, orange, strawberry, watermelon, mango |
  | `drink` | milk, juice, water (và món bố mẹ thêm có `kind: drink`) | không (sữa do máy tự rót) |
  | `other` | các món còn lại (và món bố mẹ thêm loại `food`) | không |
- Món không hợp lệ ở Cho Bông ăn bị bỏ như hiện nay; không đủ món cho thùng hàng thì lấy thêm từ danh sách món có sẵn.

### 2.2 Bày kệ (mở đầu lượt — SH1)
| Mức | Thùng hàng | Giỏ | Bé làm |
|---|---|---|---|
| 1 | 3 món (fruit / drink) | 🍎 Fruit, 🥤 Drinks | **chạm** món → món bay vào giỏ đúng, Bông: *"Bananas are fruit!"* — **làm quen, không có nhầm** |
| 2 | 4 món (chỉ fruit / drink) | 🍎 Fruit, 🥤 Drinks | **kéo** món vào giỏ (hoặc chạm món rồi chạm giỏ); giỏ sai: *"Milk is a drink! Put it in the drinks basket."* |
| 3 | 4 món (fruit / drink / other) | + 🍞 **Other food** | như mức 2, ba giỏ |
- Hoàn thành khi **mọi món trong thùng** đã vào giỏ đúng. Xong: *"The shop is open!"* → khách đầu tiên.

### 2.3 Quầy sinh tố (ca mới, thay 1 ca khách, mức 2–3 — SH2)
- Đơn sinh sẵn: mức 2 **một quả** (*"Can I have a banana smoothie, please?"*), mức 3 **hai quả khác nhau** (*"…a banana and strawberry smoothie…"*), chỉ quả có cột "Làm sinh tố".
- Bé kéo / chạm quả vào **máy xay** (khay có quả của đơn + 2 quả nhiễu). Đủ quả → bé chạm **nút máy xay** → Bông: *"And some milk!"* (máy tự rót) → tiếng *whirr* → ly sinh tố.
- **Màu ly** cố định theo quả: banana vàng, strawberry hồng, mango cam, orange cam nhạt, watermelon đỏ, apple xanh nhạt; hai quả = **ly màu quả đầu tiên, lớp trên màu quả thứ hai**.
- Xong: *"Here you are! A banana smoothie!"* → khách: *"Yummy! Thank you!"* → bước trả xu như ca thường (mức 2–3) → đưa túi (2.4).

| Trạng thái | Thao tác nhận | Sang |
|---|---|---|
| `blend-add` | quả đúng còn thiếu → vào máy | `blend-add` (còn thiếu) / `blend-ready` (đủ) |
| `blend-add` | quả sai → *"That's an apple. I want banana!"* (nhầm) | `blend-add` |
| `blend-add` | chạm nút máy xay → máy rung + nhắc quả còn thiếu (không nhầm) | `blend-add` |
| `blend-ready` | chạm nút máy xay | `blend-done` → trả xu |

### 2.4 Đưa túi và chào khách (cuối mỗi ca, mọi mức — SH1)
- Điều kiện mở: **ca đã đủ món** và (mức 2–3) **đã bỏ đủ xu vào két** theo cơ chế xu hiện có (`SPEC-jobs.md` mục 3).
- Túi giấy hiện trên quầy, Bông: *"Put it in the bag!"* → bé chạm túi (món bay vào túi) → Bông: *"Give it to Kitty!"* → bé chạm khách → túi bay tới khách.
- Lời chào tách câu ngắn: Bông *"Have a nice day!"* — ngắt ~1 giây — khách *"You too!"* — khách *"Bye-bye!"*.
- Chạm chỗ khác: túi / khách nhún (không nhầm).

| Thao tác | Tính nhầm? |
|---|---|
| Món vào giỏ sai (mức 2–3), quả sai cho máy xay | Có |
| Mọi thao tác bày kệ mức 1; chạm máy xay khi chưa đủ quả; chạm chỗ khác lúc đưa túi | Không |

**Tiến độ:** món bày kệ đúng ngay lần đầu (mức 2–3) và quả sinh tố đúng ngay lần đầu ghi "đã gặp" từ món (như bán hàng hiện nay); *fruit / drink* không ghi (chưa có bài).

---

## 3. 📮 Bưu tá (PO1)
Từ mới: *stamp, parcel, knock, what's inside?*; ôn hình (Shapes), màu, từ đã học.

### 3.1 Dán tem (mở đầu lượt)
- 3 lá thư; khay tem SVG (sao / tim / tròn / vuông × đỏ / xanh dương / vàng / xanh lá), sinh sẵn bằng **cùng hàm sinh bộ sticker của Bác sĩ** (`planSticker` + `matchesSticker`).
- Mức 1: **làm quen** — tem nào cũng được, Bông nói tên tem bé chọn: *"A red star stamp!"*; không ghi tiến độ.
- Mức 2: theo hình: *"A heart stamp, please!"* (3 tem khác hình, đúng một khớp).
- Mức 3: hình + màu: *"A blue circle stamp, please!"* (4 tem, đúng một khớp cả hai).
- Mỗi thư một tem → hoàn thành khi 3 thư đều có tem: *"Ready to go!"*.

### 3.2 Giao bưu kiện (ca mới, thay 1 thư, mọi mức)
- **Đồ trong hộp** (sinh sẵn khi lập kế hoạch): từ trong bài từ vựng trên máy bé đã gặp (`practiceCount > 0`), chỉ lấy **danh từ đếm được một từ** có emoji hoặc ảnh; mạo từ *a / an* theo chữ cái đầu; thiếu thì **bộ mặc định** (*a ball, a teddy, a car, an apple, a cat, a book*). Không lặp đồ trong lượt.
- Bông: *"A parcel for the green house!"* (mức 2: số nhà; mức 3: tên bạn thú — như thư; giữ dấu "!" như câu thư hiện có để giọng đọc vui). Chọn nhà theo luật thư.
- Tới nhà: *"Knock on the door!"* → bé chạm cửa → *"Knock, knock!"* → bạn thú: *"A parcel! What's inside?"*
- Mức 3, trước khi mở: bạn thú đoán *"Is it a car?"* — câu đoán sinh sẵn: 50% đúng đồ thật, 50% một đồ khác cùng nguồn → bé 👍 / 👎; đúng → Bông *"Yes! Let's look!"* / *"No? Let's look!"*.
- Bé chạm hộp → hộp mở, đồ nhảy ra → Bông: *"It's a ball!"* (mời bé nói theo ~2 giây, không chấm) → bạn thú: *"A ball! Thank you!"*.

| Trạng thái | Thao tác nhận | Sang |
|---|---|---|
| `drive` (chọn nhà) | nhà đúng / sai (nhầm) | `knock` / `drive` |
| `knock` | chạm cửa (chạm cửa sổ / bạn thú: cửa nhún, không nhầm) | `guess` (mức 3) / `open` |
| `guess` | 👍 / 👎 đúng / sai (nhầm) | `open` / `guess` |
| `open` | chạm hộp | `reveal` → thư sau |

| Thao tác | Tính nhầm? |
|---|---|
| Tem sai (mức 2–3), nhà sai, 👍/👎 sai (mức 3) | Có |
| Tem mức 1, chạm cửa sổ / bạn thú, chạm hộp | Không |

**Tiến độ:** hình (mức 2) / hình + màu (mức 3) của tem đúng ngay lần đầu; từ của đồ trong hộp **chỉ ở mức 3** khi trả lời 👍/👎 đúng ngay lần đầu (thao tác xác minh được).

---

## 4. 👩‍🏫 Cô giáo nhí
Từ mới: *Good morning, class!, here!, stand up, sit down, clap your hands, jump, wave*; ôn tên bạn thú, số.

### 4.1 Dữ liệu lớp
- **Lớp sinh sẵn** mỗi lượt: 3 (mức 1) / 4 bạn (mức 2–3) trong 4 bạn thú có sẵn (Teddy, Kitty, Puppy, Piggy), chỗ ngồi cố định trong lượt. Mọi câu gọi tên chỉ dùng bạn **có trong lớp**.

### 4.2 Điểm danh (mở đầu lượt — TE1)
- Bé chạm chuông 🔔 → *"Good morning, class!"* → cả lớp: *"Good morning, teacher!"* (chuông: không nhầm).
- Bông (lớp trưởng) gọi lần lượt từng bạn: *"Where's Kitty?"* → bé **phải chạm đúng bạn** → bạn giơ tay: *"Here!"*.
- Mức 1: bạn được gọi **nhún sẵn** (gợi ý); chạm nhầm → bạn đó *"I'm Puppy! Kitty is over there!"* — **không tính nhầm** (làm quen tên). Mức 2–3: không nhún sẵn, chạm nhầm **tính nhầm**.
- Hoàn thành khi mọi bạn đã "Here!".

### 4.3 Hoạt động lớp — "Classroom actions" (ca mới, thay 1 hình — TE1)
- Đổi tên từ "Teacher says" (không chơi luật "chỉ làm khi nghe Teacher says").
- Thẻ hành động sinh sẵn: mức 1: 3 thẻ (*stand up, sit down, clap your hands*); mức 2–3: 5 thẻ (+ *jump, wave*); hình từ bài **Actions** (ảnh bố mẹ thêm → emoji / SVG).
- Mức 1 (**khám phá**): Bông *"What do we do, teacher?"* → bé chạm thẻ **nào cũng được** → Bông đọc lệnh *"Stand up!"* → cả lớp làm → bé làm theo nếu muốn. 3 lệnh. Không nhầm, không ghi tiến độ.
- Mức 2–3: lần lượt 3 yêu cầu sinh sẵn: một bạn xin *"Can we jump, teacher?"* → bé chạm đúng thẻ → *"Jump!"* → cả lớp nhảy. Thẻ sai: *"That's clap. We want to jump!"* (nhầm).

### 4.4 Phát sao cuối buổi (cuối lượt, mức 2–3 — TE2)
- Sinh sẵn: **2 bạn**, mức 2 mỗi bạn **1–2 sao**, mức 3 **2–3 sao**.
- Bông: *"Two stars for Kitty!"* → bé chạm hộp sao, mỗi chạm một sao bay vào vở bạn, Bông đếm *"One! Two!"*; đủ → *"Thank you, teacher!"* → bạn sau.
- Chạm thừa khi đã đủ: bạn đó *"I have two stars! Thank you!"* — không nhầm, không thêm sao.
- Kết lượt: *"Goodbye, class!"* → *"Goodbye, teacher!"* → sticker cho bé.

| Thao tác | Tính nhầm? |
|---|---|
| Chạm nhầm bạn khi điểm danh (mức 2–3), thẻ hành động sai (mức 2–3) | Có |
| Chuông; điểm danh mức 1; thẻ mức 1; chạm thừa sao | Không |

**Tiến độ:** từ hành động khi chọn đúng ngay lần đầu (mức 2–3); số sao không ghi (đếm theo Bông, không có đáp án để chọn).

---

## 5. 👮 Cảnh sát
Từ mới: *stop, go, wait, red light, green light, look left, look right, cross the road*; ôn màu, quần áo (bài Mặc đồ).
**Đây là trò đóng vai giả lập**, không phải hướng dẫn an toàn giao thông đầy đủ. Góc bố mẹ có ghi chú: *"Trò đóng vai. Ngoài đường: dừng lại, nhìn hai phía, luôn qua đường cùng người lớn."*

### 5.1 Đèn giao thông (ca mới, thay 1 ca tìm đồ, mọi mức — PL1)
- Ngã tư giả lập: **một đèn cho xe** (đỏ / vàng / xanh), một vạch kẻ đường, xe đồ chơi xếp hàng chờ. Luật **của màn chơi** (cố định, nói rõ trong câu): *xe chỉ đi khi đèn xe xanh và vạch kẻ không có ai*.
- **Kịch bản sinh sẵn** (3 lượt mỗi ca), mỗi lượt có `crossing: true | false` (có bạn thú đang đi trên vạch kẻ hay không).

| Mức | Bé làm | Đúng |
|---|---|---|
| 1 | **Học màu đèn**: Bông *"Make it green!"* / *"Make it red!"* → bé chạm đúng màu đèn | xanh → *"Green — go!"* xe chạy; đỏ → *"Red — stop!"* xe dừng. Màu sai: *"That's yellow. Make it green!"* (nhầm) |
| 2 | Xe hỏi *"Can I go?"* → bé chọn đỏ / xanh theo `crossing` | có người trên vạch → **đỏ** (*"Red — stop! A friend is crossing."*); vạch trống → **xanh** (*"Green — go!"*) |
| 3 | như mức 2, thêm lượt **vàng**: Bông *"The light is changing. Make it yellow!"* | vàng → *"Yellow — slow down!"*, xe chậm lại rồi dừng |
- Mức 2–3 bật xanh khi `crossing: true`: xe **không** chạy, Bông *"Wait! A friend is crossing!"* (nhầm). **Không có cảnh va chạm.** Bật đỏ khi vạch trống: *"The road is clear. Make it green!"* (nhầm).

| Trạng thái | Thao tác nhận | Sang |
|---|---|---|
| `ask` | màu đúng | `move` (xe chạy / dừng, ~1 giây) → lượt sau / hết ca |
| `ask` | màu sai (nhầm) | `ask` |
| `move` | chạm đèn / xe (không nhầm, bỏ qua) | `move` |

### 5.2 Giúp bạn qua đường (ca mới, mức 2–3 — PL2a)
- Bạn thú ở mép đường: *"Can you help me cross the road?"* Đèn **cho người đi bộ** ban đầu **đỏ** (hình người đỏ), có nút bấm.
- Thứ tự cố định (state machine):

| Trạng thái | Bông nói | Thao tác đúng | Sang |
|---|---|---|---|
| `look-left` | *"Stop! Look left!"* | chạm ⬅️ (bạn thú quay trái: *"No cars!"*) | `look-right` |
| `look-right` | *"Look right!"* | chạm ➡️ (*"No cars!"*) | `press` |
| `press` | *"Press the button. Wait for the green light!"* | chạm nút → đèn người đi bộ đổi xanh sau ~1 giây (đèn xe đổi đỏ, xe dừng hẳn) | `check` |
| `check` | *"Green light! Look left and right again!"* — hai mũi tên sáng lần lượt (tự động, bạn thú nhìn) | (tự động, ~2 giây) | `go` |
| `go` | *"All clear! Let's cross together!"* | chạm bạn thú → đi qua vạch kẻ | xong: *"Thank you, officer!"* |
- Thao tác sai thứ tự (chạm ➡️ trước ⬅️, chạm bạn thú khi đèn chưa xanh): bạn thú không đi, Bông nói lại câu của bước hiện tại (nhầm). Chạm nút khi đã bấm: không nhầm.
- Câu dùng **"green light"** (ôn màu) thay "green man".

### 5.3 Tìm bạn bị lạc theo quần áo (mức 3, mở rộng ca bạn bị lạc — PL2b)
- 3–4 bạn thú mặc đồ của trò **Mặc đồ** (mũ / giày, màu); sinh sẵn **đúng một** bạn khớp cả hai món mô tả.
- Câu trung tính, không theo giới tính: *"I lost my friend! My friend has a red hat and blue shoes."*
- Nhầm: *"That friend has a green hat. My friend has a red hat!"* (nói món khác đầu tiên của bạn vừa chạm).

| Thao tác | Tính nhầm? |
|---|---|
| Màu đèn sai; qua đường sai thứ tự; chọn bạn sai | Có |
| Chạm xe, chạm đèn lúc xe đang chạy, chạm nút đã bấm | Không |

**Tiến độ:** màu đèn (*red, green, yellow* — bài Colors) khi đúng ngay lần đầu; quần áo (mức 3) khi chọn đúng bạn ngay lần đầu.

---

## 6. Hình và âm thanh
- Giỏ hàng, máy xay, ly sinh tố, túi giấy, tem, hộp quà, chuông lớp, thẻ hành động (nếu bài Actions không có ảnh), đèn xe, đèn người đi bộ, nút bấm, mũi tên, vạch kẻ: **SVG vẽ sẵn**. Màu / hình là đáp án → không thay bằng ảnh.
- Đồ trong hộp, món ăn, hành động: ảnh bố mẹ đã thêm (bài học / Cho Bông ăn), không có thì emoji.
- Âm thanh Web Audio có sẵn hoặc thêm nhỏ: máy xay (*whirr*), chuông lớp (`ring`), gõ cửa (`knock`), còi xe (`honk`), tiếng bước chân — không cần file mới.

## 7. Mốc làm (thứ tự theo review)
| # | Mốc | Nghề | Nội dung |
|---|---|---|---|
| 1 | **PL1** | Cảnh sát | Đèn giao thông (5.1) + ghi chú cho bố mẹ |
| 2 | **SH1** | Bán hàng | Bày kệ (2.2) + đưa túi / chào khách (2.4) |
| 3 | **TE1** | Cô giáo nhí | Điểm danh (4.2) + Classroom actions (4.3) |
| 4 | **PO1** | Bưu tá | Dán tem (3.1) + giao bưu kiện (3.2) |
| 5 | SH2 | Bán hàng | Quầy sinh tố (2.3) |
| 6 | TE2 | Cô giáo nhí | Phát sao (4.4) |
| 7 | PL2a | Cảnh sát | Giúp bạn qua đường (5.2) |
| 8 | PL2b | Cảnh sát | Tìm bạn theo quần áo (5.3) |
- Mỗi mốc là một bản app riêng, chơi thử với bé rồi mới làm mốc sau.

## 8. Kiểm thử — mỗi mốc đủ 5 nhóm
**A. Logic từng bước:** đúng ngay lần đầu (hoàn thành, câu đúng, ghi tiến độ một lần); nhầm lần 1 (câu nhầm nói đúng tên thứ vừa chạm, đáp án giữ nguyên); nhầm lần 2 (đáp án nhún, vẫn chọn đúng được); thao tác "không tính nhầm" (bộ đếm không tăng); chạm liên tục trong hoạt ảnh (không hoàn thành / phát sticker hai lần); chạm đúng lúc đang có người nói (vẫn nhận).
**B. Khôi phục lượt:** ra nền ở đầu bước / giữa hoạt ảnh / sau khi xong bước → quay lại đúng nghề, ca, mục tiêu, số lần nhầm; kế hoạch không bốc lại; không ghi tiến độ trùng; không phát sticker / câu hoàn thành lượt lần hai.
**C. Dữ liệu và nội dung (unit):** bộ tem / bạn thú / thẻ / món / kịch bản đèn luôn có đáp án hợp lệ (đúng một khớp ở nơi cần); không hỏi về thứ không có trên màn; câu đúng ngữ pháp khi thay tên / số / màu (*a / an*, số ít / nhiều); dữ liệu bố mẹ thêm thiếu trường không làm lỗi; thiếu ảnh → emoji / hình mặc định.
**D. Hồi quy:** test cũ của nghề qua ở cả 3 mức; mỗi lượt đúng một ca cũ bị thay; mức / khóa mức / tiến độ không đổi; nghề khác dùng chung `jobs/kit.js`, `matchesSticker` vẫn qua.
**E. Thử tay với bé:** đo thời lượng lượt; việc nào bé chán / khó → báo bố mẹ, đổi ở bản sau (không tự đổi thiết kế khi code).

## 9. Cần bố mẹ chốt (đề xuất theo review)
1. **Làm cả 4 nghề**, từng mốc một, thử với bé sau mỗi mốc — *đề xuất: có*.
2. **Giữ "Giúp bạn qua đường" (PL2a)** với kịch bản an toàn ở 5.2 (dừng, nhìn trái, nhìn phải, chờ đèn xanh, nhìn lại, qua cùng nhau) + ghi chú cho bố mẹ — *đề xuất: giữ*.
3. **Đổi "Teacher says" thành "Classroom actions"** (không chơi luật Simon-says) — *đề xuất: đổi* (đã sửa trong spec).
4. **Thứ tự mốc** như mục 7: PL1 → SH1 → TE1 → PO1 → SH2 → TE2 → PL2a → PL2b.

## 10. Trả lời review (draft2)
| Điểm review | Xử lý |
|---|---|
| P1 Bán hàng: mức 1 tự vào giỏ; nhóm `other`; công thức sinh tố; xu | Mức 1 ghi rõ là **làm quen** (không nhầm, không tiến độ); bảng nhóm + cột "làm sinh tố" (2.1); mức 2 chỉ fruit / drink, mức 3 thêm giỏ Other food; sữa do máy rót; bước túi mở sau khi đủ món **và** đủ xu theo cơ chế xu có sẵn (2.4) |
| P1 Bưu tá: nguồn đồ trong hộp, câu đoán, tiến độ dựa vào nói | Nguồn + lọc + mạo từ + bộ mặc định (3.2); câu đoán sinh sẵn 50/50; tiến độ đồ trong hộp chỉ khi 👍/👎 đúng (mức 3) — "nói theo" không ghi |
| P1 Cô giáo: mức 1 không có sai; điểm danh nhún sẵn; số sao | Mức 1 = khám phá (không nhầm, không tiến độ, nhưng điểm danh vẫn phải chạm đúng bạn); số sao sinh sẵn (mức 2: 1–2, mức 3: 2–3) |
| P1 Cảnh sát: logic đèn, an toàn | Ghi rõ là **giả lập**, luật màn chơi cố định (xe đi khi đèn xanh và vạch trống); mức 1 là học màu; qua đường có state machine đầy đủ gồm nhìn lại sau khi đèn xanh; ghi chú bố mẹ |
| Lưu trạng thái: 3 lớp | Mục 1: kế hoạch lượt / trạng thái bước (lưu sau mỗi thao tác được nhận) / tiến độ học (`recorded`) |
| Nhầm 2 lần vs bước khám phá | Mục 1: chỉ bước có đáp án mới đếm nhầm |
| Món thiếu `group`, thiếu món | 2.1 + mục 1: lọc trước, bù bằng món có sẵn |
| Tem mức 1 không ghi tiến độ | Chủ ý — mức 1 làm quen (3.1) |
| Tên gọi khớp lớp | 4.1: lớp sinh sẵn, chỉ gọi bạn có trong lớp |
| Đèn người đi bộ chưa có state | Bảng trạng thái 5.2 |
| Màu ly hai quả | 2.3: ly màu quả đầu, lớp trên màu quả thứ hai |
| Mẫu câu đồ trong hộp, *a / an* | 3.2 |
| "Teacher says" | Đổi thành "Classroom actions" |
| Câu theo giới tính | 5.3: câu trung tính *"My friend has…"* |
| "green man" | Đổi *"green light"* |
| Câu chào dài | 2.4: tách câu ngắn, có ngắt |
| *"What should we do"* | Đổi *"What do we do, teacher?"* |
| PL2 lớn | Tách PL2a / PL2b |
| Kiểm thử chi tiết | Mục 8: 5 nhóm A–E cho mỗi mốc |
