# SPEC — 🧑‍⚕️ Đóng vai nghề: nhiệm vụ mới cho Bán hàng, Bưu tá, Cô giáo nhí, Cảnh sát

> Phiên bản spec: **draft1** · Ngày: 2026-10-26 · **Chưa làm** (làm sau Bác sĩ DR1–DR3). Bổ sung cho `SPEC-jobs.md` mục 3–6 (cách chơi hiện có của 4 nghề — **giữ nguyên**).
> Cùng khung với Cứu hỏa (`SPEC-fire2.md`) và Bác sĩ (`SPEC-doctor2.md`): mỗi nghề thêm **việc mở đầu lượt**, **một ca kiểu mới** xen với ca cũ, và / hoặc **việc nhỏ cuối ca / cuối lượt**.

## 1. Mục tiêu và luật chung
- Mỗi nghề có thêm việc để làm, mỗi việc gắn với **từ / mẫu câu mới** hoặc **ôn bài đã có** (màu, số, hình, đồ ăn, hành động, con vật).
- **Luật chung giữ nguyên cho mọi việc mới** (`jobs/kit.js`):
  - phụ đề có người nói;
  - nhắc sau 10 giây, tối đa 2 lần mỗi bước;
  - nhầm 2 lần thì đáp án nhún; gộp chạm nhầm 0,4 giây;
  - nhận thao tác đúng ngay cả khi đang có người nói;
  - 🧹 chơi lại; ra nền rồi quay lại đúng chỗ;
  - mức + khóa mức; lượt xong → Hoan hô + sticker.
- **Kế hoạch lượt lập một lần** lúc bắt đầu lượt (cả dữ liệu ca mới), lưu trong bản lưu chơi tiếp đang có của nghề — ra nền không bốc lại (như Cứu hỏa draft2).
- **Lượt không dài thêm nhiều:** ca mới **thay** một ca cũ (số ca / thư / hình mỗi lượt giữ như cũ); việc mở đầu ≤ ~15 giây.
- **Tiến độ "đã gặp"** dùng hàm ghi có sẵn: chỉ khi đúng ngay lần đầu, không ghi lặp khi ra nền / 🧹.
- **Bảng tính nhầm** mỗi nghề ghi rõ thao tác nào tính nhầm, thao tác nào chỉ để khám phá (không tính).

---

## 2. 🛒 Bán hàng — nhiệm vụ mới
Từ mới: *fruit, drink, bag, smoothie, have a nice day*; ôn đồ ăn (bài Food), số.

### 2.1 Mở cửa hàng: bày kệ (mở đầu lượt)
- Bông: *"Let's open the shop! Fill the shelves!"* — 3 (mức 1) / 4 món (mức 2–3) nằm trong thùng hàng, kệ có **2 giỏ**: 🍎 **Fruit** và 🥤 **Drinks** (mức 3 thêm giỏ 🍞 **Bread & more**).
- Bé kéo / chạm từng món → món bay vào giỏ đúng nhóm. Bông: *"Bananas are fruit!"* / *"Milk is a drink!"*
- Mức 1: chạm món là món tự bay vào giỏ đúng (chỉ nghe nhóm). Mức 2–3: bé **kéo vào giỏ**, giỏ sai → *"Milk is a drink! Put it in the drinks basket."* (tính nhầm).
- Nhóm của món lấy từ dữ liệu Cho Bông ăn (thêm trường `group: fruit | drink | other`); món bố mẹ thêm không có nhóm thì không lên thùng hàng.
- Xong: *"The shop is open!"* → khách đầu tiên.

### 2.2 Ca mới: Quầy sinh tố (thay 1 ca khách, mức 2–3)
- Khách: *"Can I have a banana smoothie, please?"* (mức 3: *"…banana and strawberry…"* — hai món).
- Bé kéo đúng món vào **máy xay** (chỉ món quả / sữa có nhóm `fruit` / `drink`), rồi chạm nút máy xay → tiếng *whirr*, ly sinh tố màu theo món → *"Here you are! A banana smoothie!"* → khách: *"Yummy! Thank you!"*.
- Món sai: *"That's an apple. I want banana!"* (tính nhầm); chạm máy xay khi chưa đủ món: máy rung, Bông nhắc món còn thiếu (không tính nhầm).

### 2.3 Đưa túi và chào khách (cuối mỗi ca, mọi mức)
- Đủ món (và đủ xu ở mức 2–3): túi giấy hiện trên quầy, Bông: *"Put it in the bag!"* → bé chạm túi → món bay vào túi → bé đưa túi cho khách (chạm khách) → Bông: *"Have a nice day!"* → khách: *"You too! Bye-bye!"*.
- Chỉ 2 lần chạm, không có nhầm (chạm chỗ khác: túi nhún).

| Thao tác | Tính nhầm? |
|---|---|
| Món vào giỏ sai nhóm (mức 2–3), món sai cho máy xay | Có |
| Chạm máy xay khi chưa đủ món, chạm chỗ khác lúc đưa túi | Không — chỉ nhắc |

**Tiến độ:** món đúng ngay lần đầu ghi "đã gặp" (như hiện nay); *fruit / drink* không ghi (chưa có bài).

---

## 3. 📮 Bưu tá — nhiệm vụ mới
Từ mới: *stamp, parcel, box, knock, what's inside?*; ôn hình (bài Shapes), màu, từ đã học.

### 3.1 Dán tem (mở đầu lượt)
- Bông: *"Letters need stamps! Put a stamp on each letter!"* — 3 lá thư, khay tem SVG (sao / tim / tròn / vuông, nhiều màu).
- Mức 1: tem nào cũng được → Bông nói tên tem: *"A red star stamp!"*.
- Mức 2: Bông gọi theo hình: *"A heart stamp, please!"*; mức 3: hình + màu: *"A blue circle stamp, please!"* (bộ tem có đúng một tem khớp, như sticker của Bác sĩ — dùng chung hàm `matchesSticker`).
- Xong 3 thư: *"Ready to go!"* → thư đầu tiên của lượt.

### 3.2 Ca mới: Giao bưu kiện (thay 1 thư, mức 1–3)
- Bông: *"A parcel for the green house!"* (mức 2: số nhà, mức 3: tên bạn thú — như thư). Bé chọn đúng nhà (luật như thư).
- Tới nhà: Bông: *"Knock on the door!"* → bé chạm cửa: *"Knock, knock!"* → bạn thú mở cửa: *"A parcel! What's inside?"*
- Bé chạm hộp → hộp mở, **đồ bên trong** nhảy ra (lấy từ từ bé đã học, như bảng khám mắt của Bác sĩ; thiếu thì bộ mặc định) → Bông: *"It's a ball!"* (bé nghe – nói theo ~2 giây) → bạn thú: *"A ball! Thank you!"*.
- Mức 3: trước khi mở, bạn thú đoán: *"Is it a car?"* → bé 👍 / 👎 (đúng / sai theo đồ thật) → mở hộp.

| Thao tác | Tính nhầm? |
|---|---|
| Tem sai (mức 2–3), nhà sai, 👍/👎 sai (mức 3) | Có |
| Chạm cửa sổ / bạn thú thay vì cửa | Không — cửa nhún |

**Tiến độ:** hình + màu tem (mức 2–3), từ đồ trong hộp (khi bé nói theo / chạm đúng lần đầu ở mức 3).

---

## 4. 👩‍🏫 Cô giáo nhí — nhiệm vụ mới
Từ mới: *Good morning, class!, here!, stand up, sit down, clap your hands, jump, wave*; ôn tên bạn thú, số.

### 4.1 Điểm danh (mở đầu lượt)
- Lớp học có 3 (mức 1) / 4 bạn (mức 2–3) ngồi bàn. Bé (cô giáo) chạm chuông 🔔 → *"Good morning, class!"* → cả lớp: *"Good morning, teacher!"*.
- Bông (lớp trưởng): *"Where's Kitty?"* → bé chạm đúng bạn → bạn đó giơ tay: *"Here!"*. Lần lượt đủ các bạn (mức 1 bạn được gọi nhún sẵn).
- Chạm nhầm bạn: bạn đó: *"I'm Puppy! Kitty is over there!"* (tính nhầm).

### 4.2 Ca mới: "Teacher says" — ra lệnh cho lớp (thay 1 hình, mọi mức)
- Hàng **thẻ hành động** (hình vẽ): *stand up, sit down, clap your hands, jump, wave* (mức 1: 3 thẻ; mức 2–3: 5 thẻ).
- Mức 1: Bông: *"What should we do, teacher?"* → bé chạm **thẻ nào cũng được** → Bông đọc lệnh: *"Stand up!"* → cả lớp làm động tác → bé có thể làm theo. 3 lệnh.
- Mức 2–3: một bạn xin: *"Can we jump, teacher?"* → bé chạm đúng thẻ *jump* → *"Jump!"* → cả lớp nhảy. Thẻ sai: *"That's clap. We want to jump!"* (tính nhầm).
- Hành động dùng lại bài **Actions** có sẵn (ảnh / emoji của bài nếu có); ghi "đã gặp" từ hành động khi đúng ngay lần đầu.

### 4.3 Phát sao cuối buổi (cuối lượt, mức 2–3)
- Bông: *"Give stars to the class! Two stars for Kitty!"* → bé chạm hộp sao 2 lần, Bông đếm *"One! Two!"* (sao bay vào vở bạn đó). 2 bạn × 1–3 sao.
- Chạm thừa (đã đủ sao): bạn đó: *"I have two stars! Thank you!"* — không tính nhầm.
- Kết: *"Goodbye, class!"* → *"Goodbye, teacher!"* → sticker cho bé.

| Thao tác | Tính nhầm? |
|---|---|
| Chạm nhầm bạn khi điểm danh, thẻ hành động sai (mức 2–3) | Có |
| Chạm chuông, chạm thừa sao, chạm thẻ ở mức 1 | Không |

**Tiến độ:** từ hành động (bài Actions), số khi đếm sao (mức 2–3).

---

## 5. 👮 Cảnh sát — nhiệm vụ mới
Từ mới: *stop, go, wait, red light, green light, look left, look right, cross the road*; ôn màu, quần áo (bài Mặc đồ).

### 5.1 Ca mới: Đèn giao thông (thay 1 ca tìm đồ, mọi mức)
- Ngã tư có **đèn giao thông** to và xe ô tô đồ chơi xếp hàng. Bông: *"You are the traffic police!"*.
- Mức 1: Bông: *"Make it green!"* → bé chạm đèn xanh → *"Green — go!"* → xe chạy qua; *"Make it red!"* → *"Red — stop!"* → xe dừng. 3 lần đổi đèn.
- Mức 2–3: xe hỏi: *"Can I go?"* — bé tự quyết: có người đi bộ đang qua đường → phải bật đỏ (*"Red — stop! Wait!"*); đường trống → bật xanh (*"Green — go!"*). Bật xanh khi đang có người qua: xe **không** chạy, Bông: *"Wait! A friend is crossing!"* (tính nhầm, không có cảnh va chạm).
- Đèn vàng (mức 3): *"Yellow — slow down!"* xe chạy chậm.

### 5.2 Ca mới: Giúp bạn qua đường (thay 1 ca, mức 2–3)
- Bạn thú ở mép đường: *"Can you help me cross the road?"*
- Bông: *"Look left!"* → bé chạm mũi tên ⬅️ (bạn thú quay nhìn trái) → *"Look right!"* → ➡️ → *"Wait for the green man!"* → bé chạm nút đèn người đi bộ → đèn hình người xanh → bé chạm bạn thú → bạn thú đi qua vạch kẻ: *"Thank you, officer!"*.
- Làm sai thứ tự (chạm bạn thú khi chưa có đèn xanh): bạn thú không đi, Bông: *"Wait for the green man!"* (tính nhầm). Không có cảnh xe đâm.
- **Ghi chú cho bố mẹ** (Góc bố mẹ): đây là trò đóng vai; bé nhỏ luôn qua đường **cùng người lớn**.

### 5.3 Tìm bạn bị lạc theo quần áo (mức 3, mở rộng ca bạn bị lạc đang có)
- *"I lost my friend! She has a red hat and blue shoes."* — 3–4 bạn thú mặc đồ khác nhau (dùng hình đồ của trò **Mặc đồ**); đúng một bạn khớp cả hai món.
- Nhầm: *"That friend has a green hat. My friend has a red hat!"* (tính nhầm).

| Thao tác | Tính nhầm? |
|---|---|
| Bật xanh khi có người qua (mức 2–3), qua đường sai thứ tự, chọn bạn sai | Có |
| Chạm xe, chạm đèn khi Bông chưa hỏi, bật đỏ thêm lần nữa | Không |

**Tiến độ:** màu đèn (*red, green, yellow*), quần áo (mức 3) khi đúng ngay lần đầu.

---

## 6. Hình và âm thanh
- Giỏ hàng, máy xay, túi giấy, tem, hộp quà, chuông lớp, thẻ hành động (nếu bài Actions không có ảnh), đèn giao thông, đèn người đi bộ, mũi tên, vạch kẻ đường: **SVG vẽ sẵn**. Màu / hình là đáp án → không thay bằng ảnh.
- Đồ trong hộp bưu kiện, món ăn, hành động: dùng ảnh bố mẹ đã thêm (bài học / Cho Bông ăn), không có thì emoji.
- Âm thanh: máy xay (*whirr* — Web Audio), chuông lớp (`ring`), gõ cửa (`knock` có sẵn ở Cứu hỏa), còi xe nhỏ (`honk`), tiếng bước chân qua đường — không cần file mới.

## 7. Mốc làm
| Mốc | Nghề | Nội dung |
|---|---|---|
| **SH1** | Bán hàng | Bày kệ (mở đầu) + đưa túi / chào khách |
| SH2 | Bán hàng | Quầy sinh tố |
| **PO1** | Bưu tá | Dán tem + giao bưu kiện (gõ cửa, mở hộp) |
| **TE1** | Cô giáo nhí | Điểm danh + "Teacher says" |
| TE2 | Cô giáo nhí | Phát sao cuối buổi |
| **PL1** | Cảnh sát | Đèn giao thông |
| PL2 | Cảnh sát | Giúp bạn qua đường + tìm bạn theo quần áo (mức 3) |

## 8. Kiểm thử (mỗi mốc)
- **Unit:** kế hoạch lượt theo mức (ca mới thay đúng một ca cũ, dữ liệu sinh sẵn); bộ tem / bộ bạn thú có **đúng một** đáp án khớp; nhóm món (fruit / drink) đúng; câu nói đúng số ít / nhiều, không có chỗ trống.
- **UI:** từng việc mới ở mức 1 / 2 / 3: đúng, nhầm (câu nhầm nói đúng tên thứ vừa chạm), thao tác không tính nhầm; ra nền giữa mỗi bước → quay lại đúng chỗ; hết lượt → sticker một lần; **test cũ của nghề vẫn qua**.
- **Thử tay với bé:** đo thời lượng lượt; việc nào bé chán / khó thì bỏ ở bản sau (hỏi bố mẹ trước).

## 9. Cần bố mẹ chốt
1. Làm **cả 4 nghề** — hay chọn nghề nào trước / bỏ việc nào?
2. **Thứ tự làm** (đề xuất, sau Bác sĩ DR1–DR3): **Cảnh sát PL1** (đèn giao thông — bé hay gặp ngoài đường) → **Bán hàng SH1** → **Cô giáo TE1** → **Bưu tá PO1** → các mốc số 2.
3. **Giúp bạn qua đường** (5.2) — giữ (có ghi chú cho bố mẹ "luôn qua đường cùng người lớn") hay bỏ?
