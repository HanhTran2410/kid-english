# SPEC — 🧑‍⚕️ Đóng vai nghề: 4 nghề mới

> Phiên bản spec: **draft2** (sửa theo review, mục 13) · Ngày: 2026-11-02 · Chưa làm.
> - draft1: bản đầu; chốt thứ tự làm, xe buýt vẽ người, bếp có lò nướng (mục 12).
> - **draft2, sửa theo review:**
>   - luật chung mới (mục 2.1–2.7): kế hoạch lượt + bản lưu, luật đáp án luôn đủ, chống chạm trùng, giọng và nghe lại, giới hạn thao tác mỗi ca, câu theo mức, ưu tiên từ chưa gặp;
>   - Nông trại: hay / grass vẽ khác hẳn nhau, luật số trứng;
>   - Đầu bếp: hành động có hoạt ảnh rõ ở mức 1, trang trí đặt sai loại;
>   - Thợ xây: mức 2–3 phải nghe mới làm được;
>   - Xe buýt: máy trạng thái hành khách, mỗi người một trạm xuống (mục 7.2);
>   - câu ngắn hơn; test JOBS3-13…21.
> Bổ sung cho `SPEC-jobs.md` (khung chung, 6 nghề hiện có: 🩺 Bác sĩ nhí, 🛒 Bán hàng, 📮 Bưu tá, 👩‍🏫 Cô giáo nhí, 👮 Cảnh sát, 🚒 Lính cứu hỏa). Các nghề hiện có **giữ nguyên**.
> Thêm **4 nghề**: 👩‍🌾 **Nông trại** (Farmer), 👨‍🍳 **Đầu bếp nhí** (Chef), 👷 **Thợ xây** (Builder), 🚌 **Bác tài xe buýt** (Bus driver).

## 1. Mục tiêu và lý do chọn nghề
- Mỗi nghề mới **ôn một nhóm bài có sẵn mà 6 nghề cũ chưa dùng (hoặc dùng ít)**, cộng một ít từ mới của nghề:

  | Nghề | Ôn bài có sẵn | Từ / câu **mới** của nghề |
  |---|---|---|
  | 👩‍🌾 Nông trại | **Animals** (+ tiếng kêu của Ai kêu thế?), Food (*egg*), Colors, số 1–5 | thức ăn của thú *hay, grass, corn, carrot, seeds* (từ mới, không coi là đã biết), *basket, hungry* |
  | 👨‍🍳 Đầu bếp nhí | Food, số 1–5 | động từ *pour, crack, mix, bake*; *cheese, tomato, "It's ready!"*, *"Hot! Wait!"* |
  | 👷 Thợ xây | **Đếm hình** (hình dạng), Colors, *big / small* | *roof, wall, door, window, helmet* |
  | 🚌 Bác tài xe buýt | **Family**, **Feelings**, Colors | *bus stop, seat belt, "My stop, please!"* |
- Mỗi nghề có **một người lớn đóng vai** bên trái sân khấu (như `SPEC-roles.md` mục 9): bác nông dân, chú đầu bếp, chú thợ xây, bác tài. Khách / bạn cần giúp là **bạn thú** (4 bạn của Bác sĩ nhí, `patients.js`) — trừ **Xe buýt**: hành khách là **người** (gia đình, mục 7).
- Không trùng nghề cũ: không có khám bệnh (Bác sĩ), không bán / trả xu (Bán hàng), không đưa thư theo địa chỉ (Bưu tá).

**Nguyên tắc nội dung (thêm vào mục 1 của `SPEC-jobs.md`, bắt buộc):**
- **Nông trại:** chỉ cho ăn, nhặt trứng, hái quả. Không có thịt, không làm thịt, không con vật nào bị nhốt chật / bị đánh.
- **Đầu bếp:** **không có dao, không có lửa bếp.** Chỉ rót, đập trứng, khuấy, bỏ vào lò (lò đóng cửa, chỉ thấy đèn cam). Đồ nóng thì có câu an toàn *"Hot! Wait!"* (như ca An toàn của Cứu hỏa).
- **Thợ xây:** đội mũ bảo hộ trước khi làm. Không có cảnh sập nhà, không ai ngã.
- **Xe buýt:** thắt dây an toàn. Xe chạy chậm, không có va chạm, không ai bị bỏ lại (người chưa lên thì xe chờ).

## 2. Khung chung
Dùng lại, không viết lại: **toàn bộ khung của `SPEC-jobs.md` mục 2** (ca / bước / thao tác con / lượt, nhắc 10 giây, luật nhầm, 🧹, ghi tiến độ một lần), **ba lớp dữ liệu của `SPEC-jobs2.md` mục 1**, **bố cục hai bên + ai nói người đó sáng** (`SPEC-roles.md`, mỗi nghề khai báo `roles(who)` ngay từ đầu).
- **Lượt:** **3 ca** → Hoan hô + sticker → về trang chọn nghề. Mở đầu lượt ≤ ~15 giây.
- **Mức:** `farmGame`, `chefGame`, `buildGame`, `busGame` = `{ level, rounds, lock, seen }`. Đủ 3 lượt lên một mức (tối đa 3). Khóa mức ở Cài đặt → Đóng vai nghề.
- **Ba lớp code** như cũ: `jobs/<nghề>.js` (file thuần: dữ liệu, kế hoạch lượt, đáp án, câu nói — có unit test), `screens/<nghề>.js` (SVG, chạm / kéo), `jobs/kit.js` (khung, không biết gì về nghề).

### 2.1 Kế hoạch lượt và bản lưu
- **Kế hoạch lượt** do `planRound(level, data, rng)` trong file thuần lập **một lần** khi bắt đầu lượt: mọi ca, mọi đáp án, mọi đồ trên màn, câu nói. Màn chỉ vẽ theo kế hoạch, không tự bốc ngẫu nhiên thêm.
- **Bản lưu chơi tiếp** (`saveSnap(job, …)`, cùng cơ chế 6 nghề cũ):

  ```
  { roundId, level, plan, caseIndex, step, stepState, recorded, wrongs }
  ```

  - `plan`: kế hoạch lượt ở trên, giữ nguyên tới hết lượt;
  - `step` + `stepState`: bước đang làm và các thao tác con đã nhận (trứng đã nhặt, lớp đã xếp, người đã lên xe…);
  - `recorded`: các mã đã ghi tiến độ trong lượt (mã ca + từ);
  - `wrongs`: số lần nhầm của bước, để nhớ đã tới lần nhún đáp án chưa.
- **Lưu ngay khi nhận một thao tác**, trước khi chạy hoạt ảnh. Quay lại thì hiện trạng thái ổn định cuối cùng (trứng đã ở trong giỏ, người đã ngồi trên xe…), chỉ nói lại câu yêu cầu, không chạy lại hoạt ảnh đã xong.
- **Ra nền rồi quay lại** (≤ 10 phút, cùng mức): chơi tiếp đúng ca, đúng bước, **không lập lại kế hoạch**. Kế hoạch chỉ lập lại khi bắt đầu lượt mới hoặc bấm 🧹; 🧹 giữ `recorded`.
- **Tắt hẳn app rồi mở lại:** bắt đầu lượt mới, giống 6 nghề cũ (bản lưu chỉ nằm trong bộ nhớ). Spec này không đổi điều đó; nếu sau này lưu bản chơi tiếp vào IndexedDB thì làm chung cho cả 10 nghề.

### 2.2 Đáp án luôn đủ (bất biến khi lập kế hoạch)
`planRound` phải bảo đảm, và unit test chạy **500 seed mỗi mức** để kiểm tra:
- **Đáp án duy nhất:** mỗi yêu cầu "chọn một" khớp **đúng một** thứ trên màn: con vật, chuồng, khối lấp ổ gà, người cần đón, trạm.
- **Đủ số lượng:** yêu cầu "chọn N" có **ít nhất N** thứ khớp, và đúng N nếu câu nói "the …" (hái *the red apples* = mọi quả đỏ). Phải có **ít nhất 1 thứ không khớp** để bé phải chọn.
- **Thẻ số:** 3 thẻ khác nhau trong 1–5, đúng một thẻ là đáp án.
- **Bản vẽ:** số chỗ của mỗi phần đúng bằng số trong câu (*"two windows"* = đúng 2 chỗ cửa sổ). Khay có đủ hình đúng, cộng ít nhất 1 hình nhiễu.
- **Hành khách:** mỗi người đúng **một trạm lên, một trạm xuống**; mỗi trạm có **nhiều nhất một người xuống** (mục 7.2).
- Không thỏa thì **bốc lại** (tối đa 50 lần), rồi lùi về **kế hoạch mặc định cố định** của mức đó. Không bao giờ vào lượt với một yêu cầu không làm được.

### 2.3 Chống chạm trùng
- Mỗi thứ chạm được có trạng thái `idle → taken`. Thao tác đúng đổi sang `taken` **ngay lúc nhận**, trước hoạt ảnh.
- Thứ đã `taken` không nhận thêm: không đếm lại, không ghi tiến độ lại, không làm xong bước hai lần.
- Bước xong **đúng một lần**, theo mã lượt / mã bước của `kit.js` (`epoch`). Hoạt ảnh của bước cũ chạy xong không đổi bước mới.
- Nhầm cùng một chỗ trong 0,4 giây gộp làm một (`WRONG_LOCK_MS`). Chạm liên tục lúc có hoạt ảnh không làm mất trạng thái.
- Viết thành **hàm chung trong `kit.js`** (`claim(id)` → true một lần), dùng cho cả 4 nghề. Nghề cũ dùng dần khi sửa tới.

### 2.4 Giọng và nghe lại (kế thừa, không làm hệ thống riêng)
- **Vào ca:** câu yêu cầu tự đọc **một lần**. Sau đó chỉ nhắc theo luật 10 giây (tối đa 2 lần mỗi bước).
- **Chạm nút Bông ở góc:** đọc lại **câu yêu cầu của bước đang làm**, ở dạng ngắn (*"Hay, please!"*, *"Pick up Grandma!"*).
- **Nhầm:** câu nhầm nói đúng tên thứ vừa chạm, rồi nhắc lại yêu cầu ngắn (*"That's corn. Hay, please!"*).
- **Ai nói giọng nào:**
  - người lớn bên trái: giọng chính;
  - bạn thú: giọng thứ hai (như hiện nay);
  - trẻ con (*sister*, *baby*): giọng bạn nhỏ của Nói chuyện với Bông.
  - Tất cả dùng hàng nói `talk` của `kit.js`.
- **Giọng đọc lỗi:** phụ đề vẫn hiện, hoạt ảnh vẫn chạy, mọi bước vẫn làm được. Không có bước nào phải chờ câu nói xong mới cho bé chạm.

### 2.5 Độ dài
- Mỗi ca **tối đa 5 thao tác con** của bé. Hoạt ảnh tự chạy (khuấy, nướng, xe chạy) không tính.
- Lượt mục tiêu **≤ 3 phút**. Không phải lượt nào cũng lấy số lượng tối đa: số trong khoảng của mức được bốc đều.
- Câu nối giữa các bước ≤ 1 câu. Lời khen ngắn (*"Good job!"*, *"Yummy!"*).

### 2.6 Câu theo mức
- **Mức 1:** 1–3 từ (*"Hay, please!"*, *"Triangle, please!"*, *"Pick up Daddy!"*).
- **Mức 2:** 2–5 từ (*"A red roof, please!"*, *"The yellow stop!"*).
- **Mức 3:** dài hơn, nhưng luôn có hình hoặc thẻ đi kèm (*"Two square windows, please!"*, *"Pick up the sleepy baby!"*).
- Mỗi câu một ý. Hai yêu cầu thì nói **lần lượt**: *"Pick up Grandma!"*, xong mới nói *"Now pick up Baby!"*.

### 2.7 Ưu tiên từ chưa gặp
- Khi bốc con vật, người nhà, món, màu: ưu tiên từ có `practiceCount` thấp (bài có sẵn) hoặc `seen` thấp (từ mới của nghề), rồi mới bốc ngẫu nhiên.
- Trong **một lượt**, một từ làm đáp án **nhiều nhất ở một ca**. Ví dụ Đầu bếp đã có bước *crack the egg* thì bánh mì kẹp không dùng *egg*.

## 3. Trang chọn nghề: 10 thẻ
- Thứ tự: 6 nghề cũ giữ nguyên, rồi 👩‍🌾 Farmer · 👨‍🍳 Chef · 👷 Builder · 🚌 Bus driver.
- **Màn ngang:** 5 thẻ × 2 hàng. **Màn dọc (điện thoại):** 2 cột × 5 hàng, thẻ thấp hơn (emoji + tên Anh + tên Việt vẫn đọc rõ), **không cuộn ngang**. Nếu iPhone nhỏ không vừa 5 hàng thì cho cuộn dọc.
- Nghề chỉ vào `JOBS` ở commit nghiệm thu của mốc đó (luật cũ). Trong lúc làm, trang có thể có 7, 8, 9 thẻ, nên bố cục phải đẹp với mọi số thẻ từ 6 tới 10.

---

## 4. 👩‍🌾 Nông trại (Farmer) — `farm`
Bé là bác nông dân nhỏ: cho thú ăn, nhặt trứng, hái quả. **Người lớn bên trái:** bác nông dân (mũ rơm, yếm xanh).

**Mở đầu lượt:** gà trống gáy (dùng `chicken.mp3`) → bác nông dân: *"Good morning, farm!"* → cửa chuồng mở.

### 4.1 Ca A — Cho thú ăn
- Một con vật ra trước chuồng và kêu (file tiếng của **Ai kêu thế?**): *"Moo!"*. Bác nông dân: *"The cow is hungry!"* Con vật: *"Hay, please!"*
- Khay có 3 thức ăn. Bé kéo / chạm đúng thức ăn → con vật ăn, nhai, vui: *"Yummy! Thank you!"*

| Con vật | Tiếng (file có sẵn) | Thức ăn | Hình thức ăn (SVG, không dùng emoji) |
|---|---|---|---|
| cow | `cow.mp3` | hay | **bó cỏ khô vàng**, buộc dây nâu ở giữa, sợi thẳng |
| sheep | `sheep.mp3` | grass | **cụm cỏ xanh tươi** mọc từ mảng đất nâu, lá nhọn cong |
| horse | `horse.mp3` | carrot | củ cà rốt cam, lá xanh |
| chicken | `chicken.mp3` | corn | bắp ngô vàng, vỏ xanh |
| pig | `pig.mp3` | apple | quả táo đỏ |
| duck | `duck.mp3` | seeds | túi nhỏ đầy hạt |
- **Hay và grass** khác nhau ở **dáng** (bó buộc dây ↔ cụm cỏ mọc từ đất), không chỉ khác màu. Ở mức 1–2, hai thứ **không cùng nằm trong một khay**; mức 3 mới có thể.
- Thức ăn là **từ mới** của nghề: lần đầu gặp trong lượt, bác nông dân đọc tên khi đồ hiện ở khay (*"Hay!"*).

| Mức | Bé làm |
|---|---|
| 1 | Con vật đứng ngoài; **bong bóng thức ăn luôn hiện** và được đọc tên. Nhầm: *"That's corn. Hay, please!"* |
| 2 | Chỉ nghe tên thức ăn; bong bóng hiện sau lần nhầm đầu. |
| 3 | **Ba cửa chuồng đóng**, chỉ nghe tiếng kêu. Bác nông dân: *"Who's hungry?"* Bé chạm cửa có con vật đó (cửa mở, con vật ra), rồi cho ăn như mức 2. Chạm cửa khác: cửa hé, con vật trong đó kêu tiếng của nó, *"Not me!"* (tính nhầm). Ba con vật trong 3 chuồng khác tiếng nhau. |
- Con vật vẽ SVG cùng kiểu bạn thú, có emoji to dự phòng. Ba ca A của lượt hỏi ba con vật khác nhau.

### 4.2 Ca B — Nhặt trứng
- 2–3 con gà mái ngồi trên ổ. Bé **chạm gà** → gà đứng dậy, *"Cluck!"*, lộ trứng → bé chạm từng quả, trứng bay vào giỏ, bác nông dân đếm *"One egg! Two eggs!"*.
- Mỗi quả là một thao tác con (`claim`, mục 2.3). Chạm gà đã đứng: gà kêu, không tính nhầm.
- Hết trứng: *"Three eggs!"* (theo số thật, số ít / nhiều đúng).

| Mức | Trứng | Hỏi thêm |
|---|---|---|
| 1 | tổng 1–3, một màu | không |
| 2 | tổng 2–5, một màu | *"How many eggs?"* → 3 thẻ số (luật như Cứu hỏa mức 2) |
| 3 | trứng **trắng và nâu**, tổng 3–5 | *"Two brown eggs, please!"* — chỉ trứng đúng màu vào giỏ, đủ số thì xong. Chạm trứng sai màu: *"That's a white egg. Brown eggs, please!"* (tính nhầm) |
- **Bất biến mức 3:** số được hỏi là 1–3; số trứng đúng màu **≥ số được hỏi**; có **≥ 1** trứng màu kia; tổng ≤ 5. Đã đủ số thì trứng đúng màu còn lại không nhận nữa (*"That's enough!"*, không tính nhầm).

### 4.3 Ca C — Hái quả
- Cây táo có 4–5 quả nhiều màu. Bác nông dân: *"Pick the red apples!"* → bé chạm từng quả đỏ, quả rơi vào giỏ, có đếm. Hái hết quả đỏ thì xong.
- **Mức 1:** 2 màu (đỏ / xanh lá), 2–3 quả cần hái.
- **Mức 2:** 3 màu.
- **Mức 3:** *"Pick two big red apples!"* (màu + cỡ + số). Trên cây có **đúng 2** quả to đỏ, có quả nhỏ đỏ và quả to màu khác để bé phải chọn.
- Quả là SVG tô màu (màu là đáp án, không thay bằng ảnh).

### 4.4 Lượt
| Mức | 3 ca |
|---|---|
| 1 | A + B + A (hai con vật khác nhau) |
| 2 | A + B + C, thứ tự ngẫu nhiên |
| 3 | A (cửa chuồng) + B (trứng màu) + C (màu + cỡ + số) |
- **Tiến độ "đã gặp":**
  - con vật có trong bài Animals (*cow, duck, pig*), khi cho ăn đúng;
  - *egg* (bài Food), khi nhặt xong trứng;
  - màu (Colors), khi hái xong.
- `seen`: mã con vật và mã thức ăn (từ mới).

---

## 5. 👨‍🍳 Đầu bếp nhí (Chef) — `chef`
Bé là đầu bếp trong một quán nhỏ. Bạn thú ngồi bàn, gọi món; bé làm theo từng bước rồi bưng ra. **Người lớn bên trái:** chú đầu bếp (mũ trắng cao).

**Mở đầu lượt:** *"Wash your hands!"* → bé chạm vòi nước (nước chảy, bọt xà phòng; một lần chạm là xong; dùng lại hình rửa tay của Bác sĩ nhí nếu tách được) → *"Let's cook!"*

### 5.1 Ca A — Làm bánh mì kẹp (xếp lớp)
- Khách: *"A sandwich, please!"* → tấm thẻ công thức hiện hình các lớp, xếp từ dưới lên.
- Khay: bread 🍞, egg 🍳, cheese 🧀, tomato 🍅, lettuce 🥬. Bé đưa đúng lớp tiếp theo → lớp rơi lên đĩa (mỗi lớp là một thao tác con). Đưa sai lớp: lớp bật về khay, *"That's tomato. Cheese, please!"* (tính nhầm).

| Mức | Thẻ công thức | Bé làm |
|---|---|---|
| 1 | 3 lớp (*bread, cheese, bread*); thẻ hiện, lớp tiếp theo trên thẻ sáng | chú đầu bếp gọi từng lớp: *"Bread!"* |
| 2 | 4 lớp, thẻ hiện | **khách** nói cả món một lần (*"Bread, cheese, tomato, bread!"*); chú chỉ nhắc lớp tiếp theo khi bé dừng |
| 3 | 4 lớp + một lời dặn *"No tomato, please!"* (cà chua có trong khay, không có trên thẻ) | đưa cà chua: khách *"No tomato, please!"* (tính nhầm), lớp không rơi lên đĩa |
- Xong: chú đầu bếp *"It's ready!"* → bé chạm đĩa → đĩa bay tới khách → *"Yummy! Thank you!"*

### 5.2 Ca B — Làm bánh nướng (động từ)
Một chuỗi bước, mỗi bước **một động từ**. Mỗi động từ có **hoạt ảnh rõ, chạy sau khi bé chạm**, và chú đầu bếp nói lại động từ đúng lúc hoạt ảnh chạy, để bé nối được từ với hành động:

| Bước | Câu | Bé làm → hoạt ảnh |
|---|---|---|
| pour | *"Pour the milk!"* | chạm hộp sữa → hộp nghiêng, dòng sữa trắng chảy vào bát, mực sữa dâng lên — chú: *"Pour!"* |
| crack | *"Crack the egg!"* | chạm quả trứng → trứng gõ vào thành bát, nứt đôi, lòng đỏ rơi xuống — *crack!* — chú: *"Crack!"* |
| mix | *"Mix!"* | chạm thìa → thìa tự khuấy 3 vòng, bột xoáy — chú: *"Mix, mix, mix!"* (một lần chạm) |
| bake | *"In the oven!"* | chạm / kéo bát vào lò → cửa đóng, đèn cam, *tick-tock* ~2 giây → *ding!* |
| (chờ) | *"Hot! Wait!"* | bánh ra, có hơi nóng ~2 giây. **Chạm bánh lúc này: bánh rung, chú "Hot! Wait!", không tính nhầm.** Hết hơi nóng → *"It's ready!"* (không phải thao tác) |

| Mức | Bước | Bé làm |
|---|---|---|
| 1 | pour → mix → bake (3 thao tác) | **chỉ một thứ trên bàn sáng / nhún**, nghe câu rồi chạm. Không có nhầm. Hoạt ảnh là phần dạy chính |
| 2 | pour → crack → mix → bake (4) | trên bàn có **3 đồ** (sữa, trứng, thìa), không đồ nào sáng; nghe động từ rồi chọn đồ. Nhầm: *"That's the spoon. Crack the egg!"* |
| 3 | 3 bước trên thẻ hình, thứ tự bốc từ pour / crack / mix, luôn kết thúc bằng bake | chú nói cả chuỗi một lần: *"First, pour the milk. Then, crack the egg!"*. Bé làm đúng **thứ tự**; làm bước sau trước: *"First, pour the milk!"* (tính nhầm). Nghe lại = nghe cả chuỗi |

### 5.3 Ca C — Trang trí (đếm)
- Bánh kem trơn trên bàn. Khách: *"Three strawberries, please!"* → bé đặt từng quả lên bánh, chú đếm.
- **Mức 1:** 1–3 cái, một loại.
- **Mức 2:** 2–5 cái, một loại.
- **Mức 3:** hai loại, tổng ≤ 5: *"Two strawberries and one cherry!"*. Khay có thêm 1 loại không được gọi.
- Đồ trang trí là emoji (🍓 🍒 🫐 ⭐ nến); không phải món chính nên không cần ảnh.

| Bé đặt | Xử lý | Tính nhầm? |
|---|---|---|
| đúng loại, còn thiếu | lên bánh, chú đếm theo loại đó | — |
| **sai loại** (loại không được gọi) | bật về khay: *"That's a blueberry. Strawberries, please!"* | **Có** |
| đúng loại nhưng **loại đó đã đủ** | bật về khay: *"That's enough!"* | Không |
- Loại nào đủ thì **chỉ loại đó** mờ đi trong khay; **loại kia vẫn đặt được**. Bánh chỉ xong khi **mọi loại** đủ số. Thứ tự giữa hai loại tùy ý.

### 5.4 Lượt
| Mức | 3 ca |
|---|---|
| 1 | A + B + C |
| 2 | A + B + C (thứ tự ngẫu nhiên) |
| 3 | A (có *"No …"*) + B (thứ tự) + C (hai loại) |
- **Tiến độ:** *bread, egg, milk* (bài Food), khi xong lớp / bước có từ đó. Động từ chưa có bài nên **không ghi** "đã gặp"; chỉ ghi vào `seen` (mã từ của nghề). Nếu sau này có bài Cooking thì nối vào.

---

## 6. 👷 Thợ xây (Builder) — `build`
Bé xây nhà / sửa đường cho bạn thú bằng các **hình**. **Người lớn bên trái:** chú thợ xây (mũ vàng, áo phản quang cam).

**Mở đầu lượt:** *"Helmet on!"* → bé chạm mũ bảo hộ trong khay → mũ đội lên đầu chú thợ xây / huy hiệu 👷 cạnh nút Bông → *"Let's build!"*

### 6.1 Ca A — Xây nhà theo bản vẽ
- Bạn thú: *"A house, please!"* → trên nền đất hiện **bản vẽ** các phần: tường (hình vuông), mái (tam giác), cửa (chữ nhật), cửa sổ (tròn / vuông).
- Mỗi lần **một phần sáng lên** (phần đang cần làm), kèm câu yêu cầu. Bé kéo / chạm hình trong khay → hình khớp vào phần đó, có tiếng *click*. Mỗi phần là một thao tác con.
- Hình sai (sai dáng, sai màu hoặc sai cỡ theo mức): **không đặt lên bản vẽ**, bật về khay, câu nhầm nói đúng thứ vừa đặt (tính nhầm).
- Xong: nhà rung nhẹ, ống khói bốc khói trắng nhỏ, bạn thú vào nhà, vẫy ở cửa sổ: *"My house! Thank you!"*

| Mức | Bản vẽ (gợi ý bằng mắt) | Câu (phải nghe) | Khay |
|---|---|---|---|
| 1 | 3 phần (tường, mái, cửa). Phần đang cần làm có **nét đứt đúng dáng, tô màu nhạt đúng màu** — nhìn là làm được | chú đọc tên: *"Triangle, please!"* (dạy tên hình) | đúng 3 hình, mỗi hình một màu |
| 2 | 4–5 phần. Phần cần làm chỉ là **ô sáng màu xám, không lộ dáng, không lộ màu** | bạn thú: *"A red triangle, please!"* | mỗi dáng **2 màu**, cộng 1 dáng nhiễu. Đúng dáng sai màu: *"That's a blue triangle. A red triangle, please!"* |
| 3 | 5 phần, ô xám như mức 2 | thêm cỡ và số: *"A big triangle, please!"*, *"Two square windows, please!"* (2 ô sáng cùng lúc, đặt theo thứ tự nào cũng được) | có hình to / nhỏ cùng dáng; có hình của **Đếm hình mới** nếu được (dưới) |
- **Mức 3, hình mới** (`SPEC-shapes2.md`): mái **hình thang**, cửa **nửa hình tròn**, cửa sổ **thoi / lục giác**. Chỉ dùng khi bé đã chơi **Đếm hình mới** ít nhất một lượt (`shapeCount2.rounds > 0` hoặc có `seen`). Chưa chơi thì dùng hình cũ (tròn, vuông, tam giác, chữ nhật, sao, tim).
- Hình dạng dùng **cùng bộ vẽ và tên** với Đếm hình (`shapes.js`).

### 6.2 Ca B — Sửa đường
- Đường có **một ổ gà** có dáng một hình. Xe của bạn thú dừng trước ổ: *"Oh no! A hole!"* → chú: *"Square, please!"* → bé chọn khối đúng dáng trong 3 khối → khối lấp ổ, đường phẳng → xe chạy qua: *"Beep beep! Thank you!"*
- **Mức 1:** viền ổ gà rõ dáng, chú nói tên hình.
- **Mức 2:** 3 khối gần dáng nhau (vuông / chữ nhật / tròn).
- **Mức 3:** hình mới (thang / bình hành / thoi), cùng điều kiện như 6.1.
- Chọn nhầm: khối không vừa, bật ra: *"That's a circle. Square, please!"* (tính nhầm).

### 6.3 Lượt
| Mức | 3 ca |
|---|---|
| 1 | A + B + A |
| 2 | A + B + A (có màu) |
| 3 | A (to / nhỏ, số, hình mới) + B (hình mới) + A |
- **Tiến độ:**
  - màu (Colors), khi đặt đúng phần có yêu cầu màu;
  - *big / small*, như Cảnh sát;
  - hình dạng **chưa ghi** "đã gặp" (bài Đếm hình lưu kiểu khác, như số ở Cứu hỏa).
- `seen`: mã phần nhà.

---

## 7. 🚌 Bác tài xe buýt (Bus driver) — `bus`
Bé lái xe buýt đón người trong gia đình rồi đưa họ tới đúng trạm. **Người lớn bên trái:** bác tài (mũ lưỡi trai xanh). Màn dọc: bác tài ngồi trong ô cửa lái phía trước xe.

**Nhân vật:** **người** (đã chốt). Vẽ SVG cùng kiểu người của Đóng vai (`jobs/people.js`: đầu tròn, nửa thân trên, nét đơn giản). Mỗi người một dấu hiệu nhìn là biết:

| Người | Dấu hiệu | Cỡ |
|---|---|---|
| *grandma* | tóc bạc búi cao, kính tròn, áo len tím | người lớn |
| *grandpa* | tóc bạc, ria bạc, kính, mũ nồi | người lớn |
| *mummy* | tóc dài, áo hồng, túi xách | người lớn |
| *daddy* | tóc ngắn, áo sơ mi xanh, cà vạt | người lớn |
| *sister* | tóc hai bím, váy vàng | trẻ con (~2/3) |
| *baby* | trong xe đẩy, mũ len | nhỏ nhất |
- **Mặt có cảm xúc** (bài Feelings: *happy, sad, sleepy, hungry*): chỉ đổi mắt / miệng (thêm 💤 cho *sleepy*, tay xoa bụng cho *hungry*) trên cùng một hình. Một bộ vẽ dùng cho mọi cảm xúc.
- Không dùng ảnh người thật. Bố mẹ **không** thay ảnh hành khách được (bé nhận ra người qua dấu hiệu); chỉ thay ảnh bác tài (mục 8).
- *Baby* chỉ nói *"Goo-goo!"* / *"Bye-bye!"*. Câu thay em bé (*"My stop, please!"*) do người lớn nói.

**Mở đầu lượt:** bé chạm còi → *"Beep beep!"* → bác tài: *"Seat belt on!"* → bé chạm dây an toàn (cạch) → *"Let's go!"* Xe chạy ngang màn (cảnh nền trượt).

### 7.1 Tuyến và lượt
- Mỗi lượt là **một tuyến**: **trạm 1, trạm 2, trạm 3, rồi bến cuối**.
  - Mỗi trạm có biển **một màu riêng**; màu 3 trạm khác nhau, lấy từ bài Colors.
  - Bến cuối có biển 🏁, không có màu.
- **Ca k = trạm k**, gồm ba phần theo thứ tự:
  1. **Tới trạm:** ở mức 2–3, có thể có người xuống (7.3).
  2. **Xuống:** người có trạm xuống là trạm này thì xuống.
  3. **Đón:** đón người ở trạm (7.4).
- **Hết lượt:** xe tới bến cuối. *"Everybody off! Bye-bye!"* → mọi người còn trên xe xuống, vẫy tay → Hoan hô + sticker.

### 7.2 Hành khách — dữ liệu và trạng thái
Mỗi hành khách trong kế hoạch lượt:

```
{ id, member, mood, boardStop, alightStop, state }
```

- `member`: người nhà (*grandma*, *daddy*…).
- `mood`: cảm xúc; chỉ có ở mức 3, mức 1–2 là `happy`.
- `boardStop`: trạm lên.
- `alightStop`: trạm xuống — số trạm sau `boardStop`, hoặc `end` (bến cuối).
- `state`:

  | Trạng thái | Nghĩa | Sang |
  |---|---|---|
  | `waiting` | đứng chờ ở `boardStop` | bé chạm đúng → `riding` (`boardedBy: 'child'`); hết nhắc → `riding` (`boardedBy: 'auto'`) |
  | `riding` | ngồi trên xe, hiện qua cửa sổ | tới `alightStop` → `off` |
  | `off` | đã xuống, vẫy tay rồi đi khỏi màn | — |

- Mỗi người **một `boardStop` và một `alightStop`**. Mỗi trạm có **nhiều nhất một** người có `alightStop` là trạm đó; bến cuối thì nhiều người được.
- Trên xe **tối đa 3** người. Mỗi `member` + `mood` chỉ có một người trong lượt, nên không có hai người giống hệt nhau.
- Đổi `state` là **một thao tác được nhận**: lưu ngay (mục 2.1), trước hoạt ảnh bước lên / bước xuống.

### 7.3 Tới trạm và xuống (mức 2–3)
- Ở **trạm 2 và 3**, nếu có người có `alightStop` là trạm này: lúc xe đang chạy, **chỉ người đó** nói (người đó sáng, những người khác trên xe mờ): *"My stop, please! The yellow stop!"*
- **Bản đồ tuyến** ở góc trên có 3 biển trạm màu (trạm 2, trạm 3 và một biển màu nhiễu). Bé chạm đúng biển → xe chạy tới trạm đó → người đó xuống: *"Bye-bye!"*. **Những người khác vẫn ngồi trên xe.**
- Chạm sai biển: *"That's the blue stop. The yellow stop, please!"* (tính nhầm). Xe không chạy.
- Không có ai xuống ở trạm này: xe **tự chạy** tới trạm, không hiện bản đồ.
- Không bắt bé bấm đúng lúc khi xe đang chạy: chỉ chọn trên bản đồ, xe chỉ chạy sau khi bé chọn xong.
- **Mức 1 không có bản đồ:** xe luôn tự chạy, mọi người xuống ở bến cuối.

### 7.4 Đón
- Ở trạm có 2–3 người đứng chờ. Trong số đó, người cần đón ở trạm này có trạng thái `waiting`; người còn lại chỉ đứng ở trạm, không lên xe.
- Bác tài: *"Pick up Grandma!"* → bé chạm bà → bà lên xe: *"Thank you!"*, ngồi vào ghế (thấy qua cửa sổ xe).
- Chạm người khác: người đó vẫy tay: *"Not me!"* (tính nhầm). Bác tài nhắc lại yêu cầu.

| Mức | Đón mỗi trạm | Xuống |
|---|---|---|
| 1 | 1 người, 2 người chờ (*"Pick up Daddy!"*) | không có bản đồ; tất cả xuống ở bến cuối |
| 2 | 1 người, đôi khi 2 người; **gọi lần lượt**: *"Pick up Grandma!"* → lên xong → *"Now pick up Baby!"* | theo màu trạm (7.3) |
| 3 | theo **cảm xúc**: 2 em bé chờ, một bé buồn ngủ, một bé vui — *"Pick up the sleepy baby!"* (mỗi mô tả khớp đúng một người) | theo màu trạm; có thể **một lần đèn đỏ** giữa hai trạm (dưới) |
- **Đèn giao thông (mức 3, nhiều nhất một lần mỗi lượt):** xe dừng ở đèn đỏ: *"Red light! Stop!"* Đèn chuyển xanh: *"Green! Go!"* → bé chạm bàn đạp → xe chạy. Chạm bàn đạp lúc đèn đỏ: xe đứng yên, *"Red light! Wait!"*, không tính nhầm. Dùng lại hình đèn giao thông của Cảnh sát.

### 7.5 Không bỏ ai
- Bé không đón sau **2 lần nhắc**: người cần đón nhún, rồi **tự đi lên xe chậm** → `riding` với `boardedBy: 'auto'`.
- Lên tự động thì: **không** tính đúng, **không** ghi tiến độ Family / Feelings, **không** tăng `seen`, **không** khen *"Good job!"* (chỉ *"Thank you!"*). Vẫn làm tiếp bước sau như bình thường (đón người thứ hai / sang trạm sau), không bỏ qua bước nào.
- Ra nền **đúng lúc người đó đang tự lên**: trạng thái đã lưu là `riding` (lưu trước hoạt ảnh). Quay lại thì người đó đã ngồi trên xe, bước đón xong, tiến độ không ghi.
- Xe **không bao giờ** rời trạm khi còn người `waiting` ở trạm đó.
- Bản đồ tuyến không có luật tự chọn: sau 2 lần nhắc, biển đúng nhún và chờ tiếp. Bé chạm là xe chạy.

### 7.6 Tiến độ
- **"Đã gặp":**
  - từ bài **Family**, khi đón đúng (`boardedBy: 'child'`, đúng ngay lần đầu);
  - từ bài **Feelings**, khi đón đúng theo cảm xúc (mức 3);
  - màu (Colors), khi chọn đúng trạm ngay lần đầu.
- `seen`: mã người nhà.

---

## 8. Hình, âm thanh, ảnh
- **Người lớn bên trái:** vẽ SVG sẵn, cùng kiểu `jobs/people.js`, và thêm vào `JOB_PEOPLE` để bố mẹ thay ảnh (Ảnh Đóng vai, có prompt): bác nông dân, chú đầu bếp, chú thợ xây, bác tài.
- **Ảnh nền** (`jobs/backgrounds.js`): mỗi nghề một prompt, chừa trống chỗ game vẽ đè lên (sân chuồng / quầy bếp / bãi đất / con đường). Có ảnh nền thì ẩn trang trí vẽ sẵn (luật cũ).
- **Không thay bằng ảnh** những thứ là đáp án: thức ăn của thú, quả / trứng tô màu, hình dạng, biển trạm màu, người nhà, mặt cảm xúc.
- **Âm thanh:** dùng file có sẵn (tiếng con vật, `car.mp3` / còi cho xe buýt, `dishes.mp3` cho bếp). Tiếng nhỏ mới (*crack, ding, click, tick-tock*) làm bằng `sfx.js` (tổng hợp); **không thêm file mp3** nếu không cần.
- **Giảm chuyển động:** hoạt ảnh động từ (5.2) vẫn phải cho thấy kết quả (sữa trong bát, trứng nứt), chỉ bỏ phần chuyển động dài.

## 9. Lưu, mức, Cài đặt
- Bản lưu chơi tiếp mỗi nghề: mục 2.1.
- **Cài đặt → Đóng vai nghề:** thêm 4 ô chọn mức (Nông trại, Đầu bếp nhí, Thợ xây, Xe buýt), dùng `levelSelect` có sẵn.
- **Sao lưu / chia sẻ:** `farmGame`, `chefGame`, `buildGame`, `busGame` nằm trong cài đặt như các nghề cũ. Ảnh người / ảnh nền mới đi theo kho `jobs:people` / `jobs:bg` có sẵn.

## 10. Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **N0** | Trang chọn nghề bố cục 6–10 thẻ (ngang 5 × 2, dọc 2 cột); `claim(id)` trong `kit.js` (2.3); chỗ cho người lớn mới trong `people.js` | ảnh chụp iPad + điện thoại với 6, 8, 10 thẻ không tràn; unit test `claim` |
| **N1** | 👩‍🌾 Nông trại mức 1–3 | bất biến 2.2 (500 seed); mỗi con vật đúng tiếng + đúng thức ăn; hay / grass phân biệt rõ trên ảnh chụp |
| **N2** | 👨‍🍳 Đầu bếp nhí mức 1–3 | xếp lớp đúng thứ tự; hoạt ảnh động từ; *"Hot! Wait!"* không tính nhầm; trang trí hai loại |
| **N3** | 👷 Thợ xây mức 1–3 | mức 2–3 không lộ dáng / màu trên bản vẽ; mức 3 chỉ dùng hình mới khi đã chơi Đếm hình mới |
| **N4** | 🚌 Bác tài xe buýt mức 1–3 | máy trạng thái hành khách (7.2) có unit test trước khi làm màn; đón / xuống đúng; không ai bị bỏ lại |
| **N5** | Cài đặt khóa mức 4 nghề + ảnh người / ảnh nền | như J6 của `SPEC-jobs.md` |
- Mỗi mốc là một bản app riêng (commit + GitHub Pages). Nghề chỉ hiện trên trang chọn nghề khi mốc đó nghiệm thu.
- N1–N3 làm độc lập được. **N4 làm file thuần + unit test của 7.2 trước**, rồi mới làm màn.

## 11. Kiểm thử
- **Unit (mỗi nghề):**
  - mọi câu không rỗng / không *undefined*, đúng số ít / nhiều, đúng độ dài câu theo mức (2.6);
  - `planRound` 500 seed mỗi mức thỏa mục 2.2;
  - ca ≤ 5 thao tác con (2.5);
  - một từ là đáp án nhiều nhất ở một ca (2.7);
  - lên mức / khóa mức.
- **UI (chế độ nhanh):**
  - một lượt mức 1 → sticker, `rounds` +1;
  - nhầm → câu nhầm; nhầm lần 2 → đáp án nhún;
  - ra nền quay lại đúng ca / bước;
  - 🧹 không ghi tiến độ lần hai;
  - giọng đọc lỗi vẫn chơi hết lượt.

| Mã | Ca | Mong đợi |
|---|---|---|
| JOBS3-01 | Trang chọn nghề 10 thẻ, điện thoại 390px | không cuộn ngang, đủ 10 thẻ, tên đọc được |
| JOBS3-02 | Nông trại mức 3, chạm cửa chuồng sai | con vật trong đó kêu đúng tiếng của nó, *"Not me!"*, tính nhầm |
| JOBS3-03 | Nhặt trứng, chạm nhanh 2 lần cùng quả | chỉ đếm một lần |
| JOBS3-04 | Trứng nâu mức 3 | chỉ trứng nâu vào giỏ, đủ số thì xong; trứng nâu thừa *"That's enough!"*, không tính nhầm |
| JOBS3-05 | Bánh mì kẹp mức 3, đưa cà chua | *"No tomato, please!"*, tính nhầm, lớp không rơi lên đĩa |
| JOBS3-06 | Bánh nướng, chạm bánh lúc còn nóng | rung + *"Hot! Wait!"*, **không** tính nhầm |
| JOBS3-07 | Trang trí, đặt thừa | *"That's enough!"*, quả thừa về khay, không tính nhầm |
| JOBS3-08 | Thợ xây mức 2, đúng dáng sai màu | câu nhầm nói màu bé đặt, hình về khay, **không** nằm trên bản vẽ |
| JOBS3-09 | Thợ xây mức 3 khi chưa chơi Đếm hình mới | không có hình thang / thoi / lục giác / nửa tròn |
| JOBS3-10 | Xe buýt mức 2, đón 2 người | gọi lần lượt; người thứ hai chỉ được gọi khi người thứ nhất đã lên; đủ 2 mới chạy tiếp |
| JOBS3-11 | Xe buýt, ra nền khi đã đón 1 người | quay lại, người đó vẫn trên xe, chỉ đón người còn lại |
| JOBS3-12 | Xe buýt, bé không chạm gì | sau 2 lần nhắc người cần đón tự lên, xe không bỏ ai |
| JOBS3-13 | Nông trại mức 3, 500 seed (unit) | không kế hoạch nào hỏi nhiều trứng đúng màu hơn số có; luôn có ≥ 1 trứng màu kia; thẻ số mức 2 luôn 3 số khác nhau, có đáp án |
| JOBS3-14 | Nông trại, chạm liên tục cùng một quả trứng lúc đang bay | chỉ nhận một lần, đếm một lần, ghi tiến độ một lần |
| JOBS3-15 | Trang trí hai loại, đặt sai loại sau khi đã đủ một loại | đồ sai về khay, tính nhầm; loại đã đủ giữ nguyên trên bánh; loại kia vẫn đặt được |
| JOBS3-16 | Thợ xây mức 2, đặt đúng dáng sai màu rồi đúng dáng đúng màu | lần đầu không có gì trên bản vẽ; lần sau hình nằm đúng chỗ |
| JOBS3-17 | Xe buýt mức 2–3, trên xe có 2 người, tới trạm của một người | chỉ người đó nói và xuống; người kia vẫn `riding`, vẫn thấy trên xe, xuống ở trạm của mình / bến cuối |
| JOBS3-18 | Xe buýt, người tự lên rồi ra nền giữa hoạt ảnh | quay lại: người đó đã ngồi trên xe, `boardedBy: 'auto'`, không có "đã gặp" Family |
| JOBS3-19 | Mọi nghề: chạm liên tục lúc có hoạt ảnh | không làm trùng thao tác, bước không xong hai lần |
| JOBS3-20 | Mọi nghề: giọng đọc lỗi giữa lượt | phụ đề vẫn hiện, chơi hết lượt → sticker |
| JOBS3-21 | Mọi nghề: ra nền giữa ca rồi quay lại | đúng ca, đúng bước, đúng các thao tác con đã nhận; kế hoạch lượt không đổi (so `roundId` + `plan`) |

## 12. Đã chốt (2026-11-02)
1. **Thứ tự làm:** Nông trại → Đầu bếp nhí → Thợ xây → Xe buýt (mốc N1 → N4). Theo review: giữ thứ tự; Xe buýt làm máy trạng thái hành khách trước.
2. **Xe buýt vẽ người** (không phải gia đình bạn thú) — bộ vẽ ở mục 7.
3. **Đầu bếp có lò nướng:** lò đóng cửa, chỉ thấy đèn cam, không thấy lửa; bánh ra còn hơi nóng thì có *"Hot! Wait!"* (mục 5.2).

**Còn mở:**
- **Chọn đúng 4 nghề này?** Review đồng ý giữ 4 nghề. Ứng viên để sau: 💇 Thợ cắt tóc (*long / short*, màu, bài Body), 🧑‍✈️ Phi công (thời tiết — nối với Mẫu câu *"It is rainy."*), 🧑‍🌾 Làm vườn (tưới cây, thời tiết), 🦁 Người giữ thú (gần Nông trại), 🦷 Nha sĩ (gần Bác sĩ nhí), 🧑‍🎨 Họa sĩ (gần Tô màu).
- **Tên tiếng Việt trên thẻ:** tạm dùng *Nông trại / Đầu bếp nhí / Thợ xây / Xe buýt*; đổi được khi nghiệm thu từng mốc.

## 13. Trả lời review (draft2)
| Review | Đã sửa |
|---|---|
| 1.1 hay / grass dễ nhầm; thức ăn là từ mới | Bảng 4.1 thêm cột hình SVG, khác nhau ở dáng; mức 1–2 không cùng khay; đọc tên lần đầu; ghi `seen` |
| 1.2 trứng nâu không đủ số | Bất biến 4.2 + 2.2, test JOBS3-13 |
| 1.3 động từ mức 1 chỉ chạm là xong | Hoạt ảnh rõ cho từng động từ + chú nói lại động từ lúc hoạt ảnh chạy (5.2); bảng mức 1–3 |
| 1.4 trang trí sai loại | Bảng xử lý 5.3: sai loại tính nhầm, thừa không tính; chỉ khóa loại đã đủ |
| 1.5 bản vẽ lộ đáp án | Mức 1 lộ dáng + màu (dạy tên); mức 2–3 ô xám, phải nghe (6.1); số chỗ = số trong câu (2.2) |
| 1.6 Xe buýt | Viết lại mục 7: tuyến (7.1), dữ liệu + trạng thái hành khách (7.2), chỉ một người xuống mỗi trạm, chỉ người đó nói (7.3), mức 1 không có bản đồ, tự lên không ghi tiến độ và lưu trước hoạt ảnh (7.5) |
| 2.1 ID và kế hoạch lượt | Mục 2.1. **Khác review:** tắt hẳn app thì bắt đầu lượt mới, giống 6 nghề cũ (bản lưu nằm trong bộ nhớ); muốn giữ qua khởi động lại thì làm chung cho cả 10 nghề |
| 2.2 chạm nhanh | Mục 2.3, `claim(id)` chung trong `kit.js` |
| 2.3 giọng đọc | Mục 2.4 (kế thừa hàng nói `talk`) |
| 3.1 câu khó | Mục 2.6 + đổi câu: *"My house! Thank you!"*, *"Triangle, please!"*, *"In the oven!"*, *"Pick up Grandma!"* → *"Now pick up Baby!"* |
| 3.2 ca dài | Mục 2.5 (≤ 5 thao tác con mỗi ca); khuấy một lần chạm; bánh nướng mức 1 còn 3 bước |
| 3.3 trùng *egg* | Mục 2.7; bánh mì kẹp mức 1 đổi thành *bread, cheese, bread* |
| 6 test thêm | JOBS3-13…21 (JOBS3-21 kiểm tra ra nền, không phải tắt app — xem dòng 2.1) |
