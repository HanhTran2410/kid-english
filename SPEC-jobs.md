# SPEC — 🧑‍⚕️ Đóng vai nghề (Jobs)

> Phiên bản spec: **draft2** · Ngày: 2026-10-23 · **J0 + J1 đã làm ở app 0.29.0** (khung chung, trang chọn nghề, Bán hàng; ghi chú ở mục 12), J2–J6 chưa làm. Tiếp theo `SPEC-doctor.md` mục 13.
> - draft1: bản đầu.
> - **draft2, sửa theo review:** danh sách nghề được bật (2.1); **bước / thao tác con** và luật khóa (2.2); quy tắc ghi `rounds` / `seen` / "đã gặp" — một lần, kể cả ra nền và 🧹 (2.2); ranh giới `kit.js` ↔ nghề (2.3); Bán hàng: số lượng, món bố mẹ thêm, điều kiện trả xu; Bưu tá: mỗi thư đúng một nhà, mức 3 = 4 nhà; Cô giáo: chấm nhầm thì chọn lại, không bắt bấm nút đối diện; Cảnh sát: dữ liệu đồ, bụi cây không tính nhầm; Cứu hỏa: câu theo số thật, thẻ số, ngọn lửa mục tiêu, ca trên cây; test JOBS-01…10 (mục 10).
> Gom Bác sĩ nhí và **5 nghề mới** vào một trang chọn nghề: 🛒 Bán hàng, 📮 Bưu tá, 👩‍🏫 Cô giáo nhí, 👮 Cảnh sát giúp bạn, 🚒 Lính cứu hỏa.
> Mọi nghề dùng **chung một khung** (mục 2): một bạn thú cần giúp → bé làm 1–2 việc → bạn thú cảm ơn → 3 ca → sticker.

## 1. Mục tiêu
- Bé 3 tuổi **đóng vai người lớn giúp đỡ** (bán hàng, đưa thư, dạy học, tìm đồ, dập lửa) và nghe / nói các mẫu câu ngắn của từng nghề: *"Can I have a banana, please?"*, *"This letter is for the red house!"*, *"I lost my ball. It's blue!"*.
- **Ôn từ đã học** ở các bài có sẵn thay vì dạy nhiều từ mới: màu (Colors), đồ ăn (Food + món của Cho Bông ăn), số 1–5, con vật, phương tiện.
- Giữ nguyên tinh thần Bác sĩ nhí: **không có "sai"**, nhầm thì nhân vật nói tên thứ bé vừa chọn rồi nhắc lại; không trừ điểm, không có màn thua.

**Nguyên tắc nội dung (bắt buộc, mọi nghề):**
- **Không có người xấu, không bắt người, không súng, không còng.** Cảnh sát chỉ **giúp** (tìm đồ, tìm bạn).
- **Lửa nhỏ, không đáng sợ:** ngọn lửa hoạt hình nhỏ, không khói đen, không ai bị thương, không ai kêu cứu hoảng hốt.
- **Tiền** (nếu có ở mức cao) là xu đồ chơi, không có mệnh giá thật.
- Bạn thú không khóc to; buồn thì mặt buồn và *"Oh no!"* nhỏ.

## 2. Khung chung

### 2.1 Trang chọn nghề
- Thẻ **🩺 Doctor** ở Góc trò chơi đổi thành **🧑‍⚕️ Jobs / Đóng vai** (màn `jobs`).
- Trang chọn nghề: Bông hỏi *"What do you want to be today?"*. Mỗi nghề một thẻ to (emoji + tên Anh + tên Việt).
- **Nghề được bật = có trong danh sách `JOBS`** (`screens/jobs.js`). Nghề chỉ được thêm vào danh sách ở commit **nghiệm thu** của mốc đó (test qua, đã thử trên máy); code của nghề đang làm dở có thể nằm trong repo nhưng không hiện. Bác sĩ nhí luôn có trong danh sách.
- Nút 🎲 trong màn chơi của mọi nghề quay về trang chọn nghề (không phải Góc trò chơi).
- *Sau này:* bé "mặc đồng phục" (Mặc đồ) trước khi vào nghề — không thuộc spec này.

### 2.2 Một lượt
| Từ | Nghĩa |
|---|---|
| **Ca** | Một bạn thú (khách) cần giúp một việc. Vào → nói yêu cầu → bé làm các bước → cảm ơn → ra về |
| **Bước** | Một việc bé làm: **chạm** một thứ (nhà, đồ, nút ✅ / ❌…) hoặc **đưa** một thứ (kéo / chạm trong khay) |
| **Thao tác con** | Một lần chạm / đưa **đúng** nhưng chưa xong bước: quả táo thứ nhất trong *two apples*, món thứ nhất trong hai món, từng đồng xu, từng ngọn lửa. Bước xong khi **đủ mọi thao tác con** |
| **Lượt** | Số ca theo nghề (`casesPerRound`): Bác sĩ, Bán hàng, Cảnh sát, Cứu hỏa **3**; Bưu tá, Cô giáo **5** (ca ngắn) → hoan hô + sticker (một lần) → về trang chọn nghề |

- **Khách = 4 bạn thú của Bác sĩ nhí** (gấu, mèo, cún, heo, `patients.js`), vẽ cùng một kiểu, mặt buồn / vui. Mỗi lượt các bạn khác nhau. Bông đứng góc làm **người phụ giúp** (đội mũ theo nghề), nhắc bé làm gì.
- **Dùng lại nguyên các luật của Bác sĩ nhí** (`SPEC-doctor.md`), không viết lại cho từng nghề:
  - nhầm / gợi ý (4.3): đồ / thứ có tên trong câu yêu cầu thì thứ đúng nhún ngay sau lần nhầm đầu; không có tên thì lần 1 câu ngắn, lần 2 mới nói tên + nhún; chạm nhầm cùng chỗ trong 0,4 giây gộp làm một;
  - nhắc sau 10 giây không thao tác, tối đa 2 lần mỗi bước; chỉ đếm khi không ai đang nói;
  - khóa thao tác khi đang xử lý thao tác **đúng** — chỉ trong lúc chạy hiệu ứng của **thao tác con đó** (đồ bay, câu đếm), xong thì mở lại để bé làm thao tác con tiếp theo; thao tác nhầm không khóa (4.4);
  - phụ đề có hình người nói; giọng đọc lỗi vẫn chơi được (4.5);
  - mã lượt / mã bước, **nhận thao tác đúng = chuyển bước ngay**, tiến độ ghi đúng một lần (8.1);
  - ra nền quay lại đúng ca, đúng bước; 🧹 chơi lại cùng các ca từ ca 1; giảm chuyển động (9).
- **Mức** mỗi nghề lưu riêng: `shopGame`, `postGame`, `teacherGame`, `policeGame`, `fireGame` = `{ level, rounds, lock, seen }` như `doctorGame`. Đủ **3 lượt** thì lên một mức (tối đa mức 3). Bố mẹ khóa mức ở Cài đặt: khóa thì **không đếm lượt** (`rounds` giữ 0); mở khóa thì đếm lại từ 0 ở mức đang khóa.
- **Ghi tiến độ — mỗi thứ đúng một lần:**

  | Gì | Ghi lúc | Ghi mấy lần |
  |---|---|---|
  | `rounds` (+1) + sticker | xong ca cuối của lượt | một lần mỗi lượt |
  | `seen` (+1 cho mã ca) | xong một ca | một lần mỗi ca của lượt — nghề tự định nghĩa mã ca (`seen` có thể rỗng nếu nghề không cần) |
  | "Đã gặp" (`practiceCount` +1) | **xong** một thao tác / bước có từ thuộc bài có sẵn (màu, đồ ăn, số, con vật…) | một lần mỗi từ mỗi bước (*two apples*: ghi khi đưa quả thứ hai) |

  Lượt giữ danh sách **đã ghi** (mã ca + từ); danh sách này đi theo bản lưu khi ra nền và **giữ nguyên khi 🧹 chơi lại** — chơi lại không ghi lần hai.

### 2.3 Code chung — ba lớp
| Lớp | Gồm | Không được |
|---|---|---|
| **`jobs/kit.js`** (khung) | đầu màn, sân khấu trống, hàng nói + phụ đề có người nói, nhắc 10 giây (nghề cho biết khi nào đang chờ + nhắc gì), khay kéo / chạm + đồ bay (nghề cho biết thả ở đâu là được, đưa thì làm gì), mã lượt (`epoch`, `cancelAll`), lưu / lấy bản ra nền, hoan hô + sticker. Mức chung ở `jobs/levels.js` (file thuần) | **tự quyết định đúng / sai**; biết về món ăn / bạn thú / nhà / lửa; import file riêng của nghề (`feed.js`, `patients.js`, `doctor.js`…) |
| **Logic nghề** (`jobs/<nghề>.js`, file thuần) | dữ liệu, chọn ca theo mức, đáp án, điều kiện xong bước / ca, mọi câu nói | đụng tới DOM |
| **Giao diện nghề** (`screens/<nghề>.js`) | SVG, vẽ nhà / bảng / lửa, nhận thao tác, gọi logic nghề, gọi khung | |
- **Bác sĩ nhí chuyển sang dùng `kit.js`**, không đổi hành vi: 8 test UI hiện có phải qua nguyên vẹn.

## 3. 🛒 Bán hàng (Shop) — `shop`
Bé bán hàng ở quầy. Khách là bạn thú, gọi món; bé đưa đúng món.

**Màn hình:** quầy hàng (SVG đơn giản, mái hiên sọc) ở dưới, **kệ** 3–6 món (khay), khách đứng sau quầy.

| Lúc | Người nói / App |
|---|---|
| Khách vào | Chuông cửa hàng *ding*. **Bông:** *"Hello! Welcome to our shop!"* |
| Yêu cầu | **Khách:** *"Can I have a banana, please?"* (đồ uống: *"Can I have some milk, please?"*) |
| Bé đưa đúng | Món bay vào túi của khách. Đủ món: **Bông:** *"Here you are!"* → chờ ~2 giây cho bé nói theo |
| Trả tiền (mức 2+) | **Khách:** *"Here's the money!"* — 1–3 **xu đồ chơi** hiện trên quầy (số xu = số món đã mua, tối đa 3). Bé chạm / kéo từng xu vào **két**; **Bông** đếm *"One coin!"*, *"Two coins!"*… Không có nhầm ở bước này |
| Cảm ơn | **Khách:** *"Thank you!"* |
| Bé đưa nhầm | **Khách:** *"Hmm, that's an apple. Can I have a banana, please?"* (câu nhầm theo loại danh từ của Cho Bông ăn) |
| Xong ca | **Khách:** *"Bye-bye!"* |

- **Món = món của Cho Bông ăn** (`feed.js`): dùng lại dữ liệu, loại danh từ (*a / an / some*, số nhiều), **ảnh món bố mẹ đã thay ở Ảnh Cho Bông ăn** (đọc chung `feed:food`, không có trang ảnh riêng). Món bố mẹ tự thêm ở Cho Bông ăn cũng bán được. Không bán *đồ không ăn được*.

| Mức | Kệ | Yêu cầu |
|---|---|---|
| 1 | 3 món dễ (món `easy` của Cho Bông ăn) | một món: *"Can I have a banana, please?"* |
| 2 | 5 món, có đồ uống | **một loại món**; món đếm được thì **1–3 cái** (thường 2): *"Can I have two apples, please?"* — đưa từng cái (thao tác con), Bông đếm *"One!"*, bộ đếm 1/2 trên bong bóng; món không đếm được luôn 1 |
| 3 | 6 món | **hai loại món khác nhau, mỗi loại 1**: *"Can I have a banana and some milk, please?"* — đưa đủ hai món (thứ tự nào cũng được); bong bóng hiện cả hai, món đã đưa có ✓; đưa lại món đã đủ: *"I have that already! Can I have …?"* (tính như nhầm) |

- **Món bố mẹ thêm** (Cho Bông ăn) bán được khi: là đồ ăn / đồ uống (không phải đồ không ăn được) và qua kiểm tra của Cho Bông ăn (tên Anh, loại danh từ, *a / an* + số nhiều nếu đếm được). Món hỏng bị bỏ, không lên kệ. Không có ảnh thì emoji 🍽️.
- **Tiền xu** chỉ là xu tròn vàng có ngôi sao, không mệnh giá, không có tiền thừa. Mức 1 không có bước trả tiền (ca ngắn).
- **Trả xu:** xu xuất hiện **sau khi đủ món** (sau *"Here you are!"*); số xu = tổng số cái đã mua, tối đa 3. Mỗi xu là một thao tác con, không có nhầm. **Ca chỉ xong khi bỏ đủ xu vào két**; ra nền giữa chừng thì quay lại còn đúng số xu chưa bỏ.
- **Bong bóng yêu cầu** cạnh khách hiện hình món (như Cho Bông ăn) — mức 1 luôn hiện; mức 2–3 hiện sau lần nhầm đầu (để bé tập nghe).
- **Tiến độ:** đưa đúng món có trong bài Food (*rice, bread, egg, banana, milk, water*) thì ghi "đã gặp" từ đó.

## 4. 📮 Bưu tá (Postman) — `post`
Bé đưa thư đến đúng nhà.

**Màn hình:** một dãy 3–5 **ngôi nhà** (SVG, mỗi nhà một màu tường, số to trên cửa ở mức 2+, bạn thú ló ở cửa sổ ở mức 3), túi thư của bé ở dưới.

| Lúc | Người nói / App |
|---|---|
| Có thư | Một lá thư bay ra từ túi. **Bông:** *"This letter is for the red house!"* |
| Bé kéo thư vào nhà / chạm nhà đúng | Thư bay vào hộp thư, cửa mở, bạn thú ló ra: *"A letter for me! Thank you!"* |
| Nhầm nhà | Cửa nhà đó mở, bạn thú trong nhà: *"Not for me! This is the blue house."* → thư về túi |

- **Lượt = 5 thư** (mỗi thư một ca ngắn, không có bước khách vào / ra).

| Mức | Nhà | Câu |
|---|---|---|
| 1 | 3 nhà, 3 màu khác nhau | *"… for the red house!"* |
| 2 | 4 nhà, số 1–5 trên cửa, **cùng màu** | *"… for house number three!"* |
| 3 | **4 nhà** khác màu, có số và mỗi nhà một bạn thú khác nhau ở cửa sổ (4 bạn thú) | trộn ba kiểu: màu / số / tên (*"This letter is for Kitty!"*) |

- Màu dùng bài Colors (*red, blue, yellow, green, pink, orange*); số 1–5. Ghi "đã gặp" màu / số đúng.
- **Mỗi thư đúng một nhà:** số nhà không trùng (mức 2–3), màu không trùng (mức 1, 3), bạn thú không trùng. Mức 2 cùng màu nên chỉ hỏi theo số.
- Xếp nhà mới mỗi lượt (số tăng dần trái → phải như một con phố); trong lượt nhà không đổi chỗ. Hai thư liền nhau không gửi **cùng một nhà nhận**.
- **Nhầm nhà:** thư về túi, **giữ nguyên thư đó** (không thư mới, không tăng số thư đã đưa). Địa chỉ có tên nên nhà đúng nhún ngay sau lần nhầm đầu.
- Mỗi thư một ca ngắn: không có khách vào / ra; cửa mở + một câu cảm ơn rồi sang thư sau.

## 5. 👩‍🏫 Cô giáo nhí (Teacher) — `teacher`
**Đảo vai:** Bông làm học trò, bé làm cô giáo. Bông nhìn hình trên bảng và nói tên — **đôi khi cố tình nói sai** cho vui. Bé chấm ✅ / ❌.

**Màn hình:** bảng đen (hình to ở giữa), Bông ngồi bàn học sinh, hai nút to **✅** và **❌** ở dưới.

| Lúc | Người nói / App |
|---|---|
| Hình mới | Bảng hiện hình. **Bông** giơ tay: *"I know! It's a cat!"* |
| Bông nói **đúng**, bé chạm ✅ | Bông vui: *"Yay! I'm right!"* + được dán ⭐ vào vở |
| Bông nói **sai**, bé chạm ❌ | Bông gãi đầu: *"Oops! What is it?"* → chờ ~2 giây cho bé nói → Bông: *"It's a dog! Thank you, teacher!"* |
| Bé chấm nhầm (✅ khi Bông sai, hoặc ❌ khi Bông đúng) | Bông: *"Hmm, are you sure? Look again!"* — hình nhún, **Bông nói lại đúng câu vừa nói**; bé **chọn lại** (nút nào cũng được), chưa sang câu. Nhầm lần 2: nút đúng nhún. Không bắt bé bấm nút đối diện chỉ để đi tiếp |

- **Lượt = 5 hình**, khoảng nửa số câu Bông nói sai (2 hoặc 3, ngẫu nhiên).
- **Câu sai phải thật sự sai:** tên thay thế khác tên đúng (sau khi chuẩn hóa, không trùng số ít / số nhiều) và lấy từ **danh sách tương thích** của mức (bảng dưới); không có tên thay thế hợp lệ thì câu đó Bông nói đúng.
- **Hình lấy từ từ bé đã học:** ưu tiên từ có `practiceCount > 0`; hình = ảnh bài học mới nhất → emoji; **bỏ** từ không có cả ảnh lẫn emoji, hoặc không có tên tiếng Anh hợp lệ. Không đủ 5 từ thì lấy thêm từ các bài có sẵn (Animals, Food, Colors, Vehicles, Body…).
- **Mức 3** chỉ dùng hình có thuộc tính rõ (màu / số) khai báo sẵn trong dữ liệu (*a red car*, *two cats*); câu sai đổi **đúng một** thuộc tính (màu hoặc đồ) và phải khác câu đúng.

| Mức | Câu sai trông thế nào |
|---|---|
| 1 | sai **khác hẳn nhóm**: hình con mèo, Bông nói *"It's a banana!"* (bé dễ thấy, buồn cười) |
| 2 | sai **cùng nhóm**: hình con mèo, *"It's a dog!"* |
| 3 | câu có màu / số: *"It's a red car!"* khi xe màu xanh (chỉ dùng từ có màu / số rõ) — sai màu hoặc sai đồ |

- Cuối lượt: vở của Bông có 5 ⭐ (một sao mỗi câu bé chấm xong), Bông: *"Thank you, teacher! I learned a lot!"* → sticker cho bé.
- **Tiến độ:** mỗi hình chấm xong ghi "đã gặp" từ đó.

## 6. 👮 Cảnh sát giúp bạn (Police) — `police`
Bạn thú làm mất đồ; bé (cảnh sát) tìm đúng đồ theo màu / cỡ và trả lại.

**Màn hình:** công viên (cỏ, cây, ghế) với 3–5 đồ cùng loại nằm rải rác, khách đứng một bên, Bông đội mũ cảnh sát.

| Lúc | Người nói / App |
|---|---|
| Khách vào | Còi xe cảnh sát nhỏ *wee-oo*. **Khách** (mặt buồn): *"Oh no! I lost my ball!"* |
| Mô tả | **Khách:** *"It's red!"* (mức 2+: *"It's big and red!"*) |
| Bé chạm đúng đồ | Đồ bay về tay khách. **Khách:** *"My ball! Thank you, officer!"* |
| Chạm nhầm | **Khách:** *"Hmm, that ball is blue. Mine is red!"* |

| Mức | Đồ | Mô tả |
|---|---|---|
| 1 | 3 đồ cùng loại, 3 màu | màu: *"It's red!"* |
| 2 | 4 đồ: 2 màu × 2 cỡ | màu + cỡ: *"It's big and blue!"* |
| 3 | 4–5 đồ, có đồ **nấp sau bụi cây / ghế** (chạm bụi để nhìn, như Trốn tìm) | màu + cỡ, đôi khi tìm **bạn bị lạc**: *"I lost my puppy! It's small and brown."* |

- **Đồ:** ball, balloon, hat, kite, teddy, car (đồ chơi) — vẽ SVG một màu tô theo màu yêu cầu, để đổi màu không cần ảnh mới.
- **Dữ liệu mỗi đồ trong cảnh:** `{ id, type, color, size, hidden }`. **Mỗi yêu cầu khớp đúng một đồ:** mức 1 màu khác nhau; mức 2 bốn đồ là đủ 4 tổ hợp 2 màu × 2 cỡ (không có hai đồ trùng cả màu lẫn cỡ).
- **Đồ nấp (mức 3):** chạm bụi cây / ghế thì đồ sau đó lộ ra (vật che dịch sang), **không tính là chọn nhầm**; chạm vật che không có gì thì vật che rung nhẹ, cũng không tính nhầm.
- **Bạn bị lạc (mức 3):** dữ liệu bạn thú có `color` + `size` riêng (*brown + small* = cún); trong cảnh chỉ một bạn khớp mô tả.
- **Tiến độ:** màu (Colors), *big / small*.
- *Sau này:* đèn giao thông (*"Red — stop! Green — go!"*) cho xe của bài Vehicles.

## 7. 🚒 Lính cứu hỏa (Firefighter) — `fire`
Bé dập những ngọn lửa nhỏ và giúp bạn thú xuống khỏi cây.

**Màn hình:** một ngôi nhà / cái cây, vòi nước của bé ở dưới. Lửa là ngọn lửa cam nhỏ hoạt hình.

**Ca kiểu A — dập lửa:**
| Lúc | Người nói / App |
|---|---|
| Báo | Còi xe cứu hỏa *nee naw* (file `fire-truck.mp3` của Ai kêu thế?). **Bông:** *"A little fire! Let's put it out!"* |
| Bé chạm từng ngọn lửa | Tia nước bắn từ vòi tới, *xèo*, lửa nhỏ dần rồi tắt; **Bông đếm**: *"One!"*, *"Two!"*… |
| Hết lửa | **Bông** nói theo **số lửa thật**: *"One fire! All gone!"* / *"Two fires! All gone!"* … · bạn thú ở cửa sổ vẫy tay: *"Thank you, firefighter!"* |

**Ca kiểu B — cứu bạn trên cây** (mức 2–3): bạn thú ngồi trên cành *"I can't get down!"* → bé kéo **cái thang** tới cây → bạn thú trèo xuống: *"Thank you!"*. Là **một ca riêng** trong lượt (tối đa 1 ca / lượt), **không có lửa** trong ca này; ca xong khi bạn thú đã xuống đất.

| Mức | Ca |
|---|---|
| 1 | dập 1–3 ngọn lửa, Bông đếm theo |
| 2 | 2–5 ngọn lửa; hết lửa thì Bông hỏi *"How many fires?"* → bé chọn số trong 3 thẻ số; có ca cứu bạn trên cây |
| 3 | Bông chỉ chỗ: *"The fire is on the roof!"* / *"in the window"* / *"by the door"* — bé dập đúng ngọn đó trước (lửa khác chờ) |

- **Mỗi ngọn lửa** là một thao tác con (chạm lại ngọn đã tắt không đếm lại); ca xong khi tắt hết.
- **Mức 2 — thẻ số:** hỏi *"How many fires?"* **sau khi tắt hết lửa**; 3 thẻ số khác nhau trong 1–5, có đúng một thẻ là số lửa thật; chọn nhầm theo luật nhầm chung.
- **Mức 3 — ngọn lửa mục tiêu:** mỗi ngọn lửa có mã + chỗ (`roof` / `window` / `door`); Bông gọi một chỗ → chỉ ngọn đó nhận; chạm ngọn khác: Bông nhắc *"The fire on the roof first!"* (tính nhầm theo luật chung). Tắt xong thì gọi chỗ tiếp theo.
- **Tiến độ:** số 1–5 (khi bé chọn đúng số ở mức 2), *roof / window / door* không ghi (chưa có bài).

## 8. Ảnh
- **Bán hàng:** dùng chung ảnh món của Cho Bông ăn.
- **Cô giáo nhí:** dùng ảnh bài học (không chép, chỉ đọc).
- **Bưu tá, Cảnh sát, Cứu hỏa:** chạy bằng SVG vẽ sẵn (nhà, đồ chơi tô màu, lửa) — **không cần ảnh**. Ảnh nền thay được (như ảnh nền phòng khám) để sau.

## 9. Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **J0** | `jobs/kit.js` (tách từ Bác sĩ nhí) + trang chọn nghề; Bác sĩ nhí dùng `kit.js` | 8 test UI Bác sĩ nhí qua nguyên vẹn; thẻ Jobs mở trang chọn nghề |
| **J1** | 🛒 Bán hàng mức 1–3 | câu xin đúng loại danh từ mọi món (unit); ảnh Cho Bông ăn hiện trên kệ |
| **J2** | 📮 Bưu tá mức 1–3 | 5 thư → sticker; nhà xáo, thư không trùng liên tiếp |
| **J3** | 👩‍🏫 Cô giáo nhí mức 1–3 | ưu tiên từ đã học, có ảnh; 2–3 câu sai / lượt |
| **J4** | 👮 Cảnh sát mức 1–3 | đồ tô đúng màu / cỡ; không có hai đồ giống hệt nhau |
| **J5** | 🚒 Cứu hỏa mức 1–3 | đếm đúng số lửa; chạm nhanh không đếm trùng |
| **J6** | Cài đặt: khóa mức từng nghề | như Ai kêu thế? |

Mỗi mốc là một bản app riêng (commit + đưa lên GitHub Pages), để thử với bé từng nghề.

## 10. Kiểm thử (mỗi nghề)
- **Unit:** dữ liệu (mọi câu không rỗng, không *undefined*), chọn ca theo mức (không trùng, đủ số, có đáp án đúng đúng một lần), câu nhầm, lên mức / khóa mức.
- **UI (chế độ nhanh):** một lượt mức 1 đầy đủ → sticker, `rounds` +1; nhầm → câu nhầm, gợi ý; ra nền quay lại đúng ca / bước; 🧹; giọng đọc lỗi vẫn chơi hết.
- **Thử tay với bé:** câu có dễ hiểu không, lửa / đồ bị mất có làm bé buồn / sợ không, lượt có quá dài không.

**Ca test theo review** (✅ = đã có test tự động):

| Mã | Ca | Mong đợi | |
|---|---|---|---|
| JOBS-01 | Trang chọn nghề | chỉ hiện các nghề trong `JOBS` | ✅ (đếm đủ số thẻ) |
| JOBS-02 | Bán hàng mức 2, *two apples* | quả thứ nhất chưa xong bước, quả thứ hai mới *"Here you are!"* | ✅ |
| JOBS-03 | Bán hàng mức 3, hai món | thứ tự nào cũng được, đủ cả hai mới xong | ✅ |
| JOBS-04 | Bưu tá | không có thư nào có hai nhà đúng | J2 |
| JOBS-05 | Cô giáo chấm nhầm | chọn lại được, không tự sang câu | J3 |
| JOBS-06 | Cảnh sát chạm bụi cây | đồ lộ ra, không tính nhầm | J4 |
| JOBS-07 | Cứu hỏa 1 / 2 ngọn lửa | câu tổng kết đúng số ít / nhiều | J5 |
| JOBS-08 | Cứu hỏa mức 2 thẻ số | 3 số khác nhau, đúng một đáp án | J5 |
| JOBS-09 | 🧹 lúc đang có hiệu ứng | việc cũ không đổi lượt mới; không ghi tiến độ lần hai | ✅ (Bán hàng; Bác sĩ DOC-07) |
| JOBS-10 | Ra nền khi đã đưa một trong hai món | món đã đưa không tính lại, món còn lại vẫn đưa được | ✅ |

## 11. Đã chốt (draft1)
1. **Thứ tự làm:** Bán hàng → Bưu tá → Cô giáo nhí → Cảnh sát → Cứu hỏa.
2. **Bán hàng có tiền xu đồ chơi từ mức 2** (mục 3).
3. **Lính cứu hỏa có lửa nhỏ hoạt hình** (nguyên tắc ở mục 1).

## 12. Ghi chú khi code
### J0 + J1 (0.29.0)
- **Khung chung** `app/js/jobs/kit.js` (`jobScreen`: đầu màn, sân khấu, phụ đề có người nói, nhắc 10 giây, khay kéo / chạm, đồ bay, `cancelAll` đổi mã lượt, `finishRound` → sticker → về trang chọn nghề; `saveSnap` / `takeSnap` lưu mỗi nghề một bản khi ra nền). Mức chung ở `app/js/jobs/levels.js` (file thuần).
- **Bác sĩ nhí** dùng `kit.js`; hành vi không đổi. Test UI chỉ đổi đường vào (Trò chơi → **Đóng vai** → Bác sĩ nhí). Class CSS chung đổi tên `dr-*` → `jb-*` (`jb-play`, `jb-tray`, `jb-say`, `jb-helper`, `jb-cap-<nghề>`); class riêng của Bác sĩ nhí giữ `dr-*`.
- **Trang chọn nghề** `screens/jobs.js` (`JOBS`: thêm nghề mới vào đây). Thẻ Góc trò chơi: 🧑‍⚕️ *Jobs / Đóng vai*.
- **Bán hàng:** dữ liệu + câu ở `app/js/jobs/shop.js` (kệ, món gọi, kế hoạch lượt, số xu, câu theo loại danh từ của `feed.js`), màn ở `screens/shop.js`. Đưa thêm món đã đủ: *"I have that already! Can I have …?"* (tính như nhầm). Bong bóng món luôn có đủ món trong DOM (ẩn ở mức 2–3 cho tới lần nhầm đầu / lần nhắc).
- Kệ trên điện thoại: ô tự co để 6 món vừa một hàng.
- **Ghi một lần (draft2):** Bán hàng và Bác sĩ nhí giữ `recorded` (mã ca + món / `body`, `seen`) trong bản lưu; 🧹 chơi lại không ghi "đã gặp" / `seen` lần hai. Bán hàng ghi "đã gặp" khi món **đủ số**, không phải mỗi cái.
- **Test:** `tests/unit/shop.test.js`, `tests/ui/shop.spec.js` (trang chọn nghề, mức 1 đủ luồng, 3 khách → sticker, mức 2 trả xu + ra nền giữa lúc trả xu, mức 3 hai món, ảnh món Cho Bông ăn trên kệ).
