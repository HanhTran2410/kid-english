# SPEC — 🙈 Bông trốn tìm (Hide and seek)

> Phiên bản spec: **draft2** · Ngày: 2026-10-19 · **Đã làm cả H1–H3 trong app 0.19.0** (ghi chú khi code ở mục 12). Một trò mới trong Góc trò chơi (🎲 Play). **Ảnh trong game thay được** (mục 7).
> - draft1: bản đầu.
> - **draft2, sửa theo review:**
>   - chốt **4 giới từ** (in, under, behind, next to); bỏ *on*;
>   - **4–6 chỗ nấp mỗi phòng**, mỗi phòng đủ in / under / behind;
>   - thuật toán **túi giới từ** để bé gặp đều;
>   - câu có tên / không tên (*Is Na…?* / *Are you…?*);
>   - đếm đến **5** mặc định (Cài đặt: 10); quy tắc chạm khi đang đếm;
>   - trình tự khi chạm nhầm; gợi ý tai định nghĩa rõ;
>   - đổi vai: **chạm** là mặc định, nút đổi vai sớm, bố mẹ tắt được;
>   - **máy trạng thái + mã lượt**; lớp vẽ và vị trí tai;
>   - ảnh phòng phải **khớp bố cục** (có bước xác nhận);
>   - quyền riêng tư ảnh bé; **bỏ mic**;
>   - test HS-01…HS-12.
> - **Câu hỏi draft1 đã chốt:** đổi vai mở sau 3 lượt (có nút chơi sớm); đếm đến 5 (Cài đặt chọn 10); Cho Bông ăn làm trước (đã xong 0.18.0).

## 1. Mục tiêu
- Bé 3 tuổi học **4 giới từ chỉ vị trí** — *in, under, behind, next to* — và **đồ vật trong nhà**: *"Where is Bông? Under the bed!"*.
- *in, under, behind* là nhóm chính (mọi phòng đều có). *next to* là nhóm mở rộng (có ở cả 5 phòng).
- *on* **không dạy trong trò này**: ngồi *trên* ghế thì nhìn thấy ngay, không trốn được. Để dành cho trò khác.
- Trẻ 3 tuổi rất mê trốn tìm và "ú òa". Bé **đi tìm Bông** bằng cách chạm chỗ nấp. Ở lượt đổi vai, bé **đi trốn** và Bông đi tìm, đọc to từng chỗ có tên bé.
- Không có "sai": chạm nhầm chỗ thì có bất ngờ vui, không mất gì. Không cần mic.

## 2. Màn hình
```
 🏠  🎲  🏡   🙈 Hide and seek        [🙋 Đổi vai]   🐰
 ┌──────────────────────────────────────────┐
 │  tranh căn phòng (4:3)                    │
 │   giường   tủ   hộp   rèm   cửa           │  ← mỗi chỗ nấp là một vùng chạm
 └──────────────────────────────────────────┘
          [ 🔁 Again! ]   (chỉ hiện sau khi tìm thấy)
```
- **🏡** chọn phòng: 🛏️ Bedroom, 🛋️ Living room, 🍳 Kitchen, 🛁 Bathroom, 🌳 Garden. Mỗi phòng **4–6 chỗ nấp**.
- **🙋 Đổi vai:** hiện từ lượt thứ 2 (bé muốn đi trốn sớm thì bấm). Sau 3 lượt bé đi tìm, Bông tự gợi ý *"Now you hide!"*. Bố mẹ tắt đổi vai được (mục 8): khi đó không có nút và không có gợi ý.
- **🐰 Bông** góc trên: chạm khi đang đếm thì bỏ qua phần đếm.
- Phụ đề tiếng Việt cho **mọi câu**.

## 3. Bé đi tìm (mặc định)

### 3.1 Trình tự
| Trạng thái | App | Bé chạm được |
|---|---|---|
| `intro` | Bông đứng giữa phòng: *"Let's play hide and seek! Close your eyes!"* (*Mình chơi trốn tìm nhé! Nhắm mắt lại nào!*) | Bông (bỏ qua) |
| `counting` | Màn tối dần, hai bàn tay che mắt. Bông đếm *"One, two, three, four, five!"* (Cài đặt: đến 10). **Mỗi số hiện to đúng lúc đọc số đó.** Tiếng sột soạt khi Bông chạy đi nấp | **Chỉ Bông 🐰** (bỏ qua phần đếm còn lại); chạm vào phòng thì bỏ qua |
| `searching` | Màn sáng lại: *"Ready or not, here I come! Where is Bông?"* (*Bông trốn ở đâu nhỉ?*) | Các chỗ nấp |
| `found` | Xem 3.3 | Không gì (khóa) cho tới khi hiện **🔁 Again!** |
- **Không tự bỏ qua phần đếm** khi bé không làm gì. Đếm chỉ dừng khi đếm xong hoặc bé chạm Bông.
- **Chạm Bông khi đang đếm** chỉ có tác dụng **một lần**: sang thẳng `searching` (Bông đã nấp xong).

### 3.2 Chạm nhầm chỗ
1. Chỗ đó rung nhẹ. **Một bất ngờ** (🐱, 🧦…) bật ra kèm **tiếng hiệu ứng ngắn** (meo, pop…) và nhãn chữ nhỏ (*cat*). Bông chưa nói gì.
2. Khoảng 0,6 giây sau, Bông nói **một câu ngắn**: *"Not under the bed!"* (*Không phải dưới gầm giường!*). *"Hee hee!"* chỉ thỉnh thoảng (1/3 số lần), không phải lần nào cũng nói.
3. Bất ngờ thu lại, quay về `searching`.
- Muốn nghe tên bất ngờ thì bé chạm vào nó: *"A cat!"*. Như vậy câu giới từ không bị con mèo lấn át.
- **Chạm nhầm liên tiếp nhanh:** mỗi lần chạm có **mã thao tác** mới. Câu / bất ngờ của lần trước bị dừng ngay; chỉ phản hồi của **lần chạm mới nhất** được phát. Hẹn giờ cũ không được đổi trạng thái.

### 3.3 Chạm đúng chỗ
- **Khóa mọi vùng chạm ngay lập tức.** Tai (nếu đang hiện) biến mất.
- Bông nhảy ra khỏi chỗ đó: *"Peekaboo! You found me!"* (tiếng "ú òa"), rồi *"I'm under the bed!"* (*Bông trốn dưới gầm giường!*). Dưới tranh hiện cụm **under the bed**, chữ **under** nhấp nháy.
- Nói xong thì hiện **🔁 Again!**: bé bấm thì sang lượt mới (`intro` ngắn → `counting`).
- Sau lượt thứ 3: Bông hỏi thêm *"Now you hide!"*, hiện 2 nút **🙋 Đổi vai** và **🔁 Again!**.

### 3.4 Gợi ý đôi tai
| Mức | Tai xuất hiện | Khi chạm nhầm |
|---|---|---|
| **Dễ** (mặc định) | Ngay khi vào `searching`, luôn thấy một chút | Tai rung nhẹ + tiếng khúc khích |
| **Thường** | Sau **2 lần chạm nhầm** trong lượt, **hoặc 10 giây không chạm** | Như Dễ, sau khi tai đã hiện |
- **Mốc 10 giây** tính từ khi Bông **nói xong** *"Where is Bông?"*. Mỗi lần chạm (đúng hay nhầm) thì tính lại từ đầu. Dừng đếm khi Bông đang nói hoặc app ra nền.
- Tai **không nhận chạm** (chạm vào tai = chạm vùng chỗ nấp bên dưới, tức là tìm thấy).

## 4. Đổi vai — Bé đi trốn
| Trạng thái | App | Bé chạm được |
|---|---|---|
| `swapIntro` | *"Now you hide! I'll close my eyes."* Bông che mắt, đếm *one … five* | Không (chờ đếm xong, ~3 giây) |
| `childHiding` | *"Hide, hide!"*, các chỗ nấp sáng nhẹ | **Chạm một chỗ nấp** (mặc định). **Kéo** hình bé vào chỗ nấp cũng được nhưng không bắt buộc |
| (vừa chọn) | Hình bé (ảnh trong Hồ sơ, hoặc 🧒 / 👧) **chui vào** chỗ đó rồi khuất | Khóa |
| `bongSeeking` | Bông tới từng chỗ (Bông chọn), mỗi chỗ một câu hỏi + trả lời ngay: *"Is Na under the bed? … No!"* | Khóa (trừ 🏠 / 🎲 / 🏡) |
| `foundChild` | *"Found you! You're in the box!"* (*Tìm thấy rồi! Con trốn trong cái hộp!*), hình bé nhảy ra | — |
| quay lại | *"Your turn to find me!"* → bé đi tìm (`intro`) | — |
- **Bông đoán nhầm 0–2 chỗ, lần thứ 3 chắc chắn đúng.** Mỗi chỗ ~3 giây, nên tổng thời gian chờ ≤ 12 giây.
- Câu có tên / không tên (mục 6). Tên lấy từ **Hồ sơ của bé** (tên đọc bằng tiếng Anh).

## 5. Nội dung (4–6 chỗ nấp mỗi phòng)
| Phòng | Chỗ nấp | Bất ngờ |
|---|---|---|
| 🛏️ Bedroom (6) | under the bed · in the wardrobe · behind the curtain · in the box · under the blanket · next to the bed | 🧸 teddy, 🧦 sock, 🐱 cat |
| 🛋️ Living room (6) | behind the sofa · under the table · behind the plant · in the basket · next to the TV · under the cushion | 🐶 dog, ⚽ ball, 🚗 car |
| 🍳 Kitchen (5) | under the table · in the cupboard · behind the fridge · in the big pot · next to the oven | 🐭 mouse, 🍎 apple, 🥄 spoon |
| 🛁 Bathroom (5) | in the bathtub · behind the shower curtain · under the sink · in the laundry basket · next to the toilet | 🦆 duck, 🧽 sponge, 🧴 bottle |
| 🌳 Garden (5) | behind the tree · in the bush · under the slide · in the little house · next to the flowers | 🐦 bird, 🦋 butterfly, 🐸 frog |
- Mỗi phòng **có đủ in / under / behind**. *next to* có ở cả 5 phòng.
- **"Next to":** Bông nấp sát cạnh vật, nửa người khuất sau mép vật. Khi gợi ý, tai thò ra phía cạnh đó.
- **Cụm tiếng Việt viết sẵn từng chỗ, không ghép máy móc:** *dưới gầm giường, trong tủ quần áo, sau rèm cửa, trong cái hộp, dưới cái chăn, cạnh cái giường, sau ghế sô-pha, dưới gầm bàn, sau chậu cây, trong cái giỏ, cạnh cái ti vi, dưới cái gối tựa, trong tủ bếp, sau tủ lạnh, trong cái nồi to, cạnh cái lò nướng, trong bồn tắm, sau rèm tắm, dưới bồn rửa, trong giỏ đồ bẩn, cạnh bồn cầu, sau cái cây, trong bụi cây, dưới cầu trượt, trong ngôi nhà nhỏ, cạnh những bông hoa*.

## 6. Câu nói
| Lúc | Tiếng Anh | Phụ đề |
|---|---|---|
| Mở đầu | Let's play hide and seek! Close your eyes! | Mình chơi trốn tìm nhé! Nhắm mắt lại nào! |
| Đếm | One, two, three, four, five! | (số to trên màn) |
| Đi tìm | Ready or not, here I come! Where is Bông? | Bông trốn ở đâu nhỉ? |
| Chỗ nhầm | Not {cụm}! (thỉnh thoảng + Hee hee!) | Không phải {cụm vi}! |
| Chạm bất ngờ | A {surprise}! | {vi bất ngờ}! |
| Tìm thấy | Peekaboo! You found me! I'm {cụm}! | Ú òa! Con tìm thấy Bông rồi! Bông trốn {cụm vi}! |
| Đổi vai | Now you hide! I'll close my eyes. | Giờ con đi trốn nhé! Bông nhắm mắt đây. |
| Bông hỏi (có tên) | Is {Na} {cụm}? … No! | {Na} có trốn {cụm vi} không? … Không! |
| Bông hỏi (không tên) | Are you {cụm}? … No! | Con có trốn {cụm vi} không? … Không! |
| Bông thấy | Found you! You're {cụm}! | Tìm thấy rồi! Con trốn {cụm vi}! |
| Về lượt bé tìm | Your turn to find me! | Đến lượt con tìm Bông nhé! |
- **{cụm}** là cả cụm giới từ + mạo từ + đồ vật lấy nguyên từ dữ liệu (*under the bed*, *next to the TV*), không ghép từng từ. Thử với **mọi chỗ của 5 phòng** (unit test).

## 7. Ảnh thay được
Mặc định: **tranh phòng vẽ bằng SVG + Bông SVG + emoji bất ngờ**, chạy offline, không cần ảnh. Ảnh làm ở mốc H3, **không chặn** H1 / H2.

### 7.1 Lớp vẽ
Từ dưới lên:
1. Nền phòng: ảnh phòng hoặc SVG, đã có sẵn đồ vật.
2. Hình bé đang chui vào chỗ nấp (lượt đổi vai).
3. Bất ngờ bật ra.
4. Tai Bông.
5. Bông nhảy ra (ú òa).
6. Phụ đề.

- **Bông đang trốn thì không có phần tử nào của Bông trên màn** (trừ tai khi gợi ý). Lúc đổi phòng hoặc lúc ảnh đang tải cũng vậy.
- **Tai:** một hình đôi tai (SVG, hoặc ảnh `peek` nếu có) đặt theo `peek` của chỗ nấp:

  | `peek` | Vị trí tai |
  |---|---|
  | `top` | tai mọc lên từ mép trên ô (hộp, giỏ, bồn tắm) |
  | `left` / `right` | tai ló ra từ cạnh trái / phải ô (rèm, tủ lạnh, next to…) |
  | `bottom` | tai ló ra ở mép dưới phía trước (dưới gầm giường, dưới bàn) |

  - Cỡ tai = 30% cạnh ngắn của ô, tối thiểu 36 px trên màn.
  - Tai **luôn nằm trong khung tranh**: ô sát mép thì tai dịch vào trong.
- **Bông ú òa:** hiện ở giữa ô (hoặc cạnh ô với `next to`), cỡ cố định theo khung, luôn trong khung.

### 7.2 Ảnh phòng (`lessonId = 'hide:bg'`, `word = mã phòng`)
- Vùng chạm **cố định theo ô** trên khung 400×300. Ảnh thay thế phải **theo bố cục mẫu**.
- Góc bố mẹ có:
  - **⬇ Tải ảnh bố cục mẫu** (chính là tranh vẽ sẵn của phòng, không có chữ để AI không chép chữ vào ảnh); tên từng chỗ hiện ở khung vùng chạm trong trang;
  - **📋 Copy prompt** (mô tả phòng, vị trí từng đồ vật theo %, kèm *"use the attached layout image as reference"*);
  - giống Dán tranh (SPEC-scenes 10.x).
- **Bước xác nhận sau khi chọn ảnh:**
  - App hiện ảnh **kèm khung vùng chạm** và hỏi *"Mỗi đồ vật có nằm trong khung của nó không?"*.
  - **Khớp** → lưu.
  - **Chưa khớp** → không lưu, nhắc *"Gửi ảnh bố cục mẫu cho AI và tạo lại"*.
- Trang **👁 Xem vùng chạm** luôn mở lại được để kiểm tra.
- **Nghiệm thu:** phần chính của mỗi đồ vật nằm trong ô của nó (người kiểm tra bằng mắt). Không coi "vẫn chơi được" là đủ.
- **Xóa ảnh phòng** thì về tranh SVG, chơi bình thường.

### 7.3 Ảnh Bông (`lessonId = 'hide:bong'`, tùy chọn)
- 4 tư thế: `peek` (đôi tai, nền trong suốt), `boo` (ú òa), `cover` (che mắt đếm), `seek` (đi tìm).
- Ảnh lưới 4 ô với mô tả Bông chuẩn (`BONG_FULL_BODY`). Cắt lưới có xem trước, tự bỏ nền.
- **Thiếu tư thế nào thì dùng Bông SVG cho tư thế đó**, không để khung trống.

### 7.4 Ảnh bất ngờ (`lessonId = 'hide:items'`)
- **Dùng lại ảnh bài học** có cùng từ (ảnh "cat", "duck"…).
  - **Sao chép một lần** khi bố mẹ bấm (bỏ nền). Mỗi bất ngờ chỉ giữ **một** bản; dùng lại lần nữa thì **thay** bản cũ, không tạo thêm.
  - Ảnh bài học gốc **không bị đổi**. Xóa ảnh bất ngờ thì về emoji.
- Đổi ảnh từng bất ngờ; ảnh lưới + cắt cho các bất ngờ chưa có ảnh.

### 7.5 Ảnh bé (lượt đổi vai)
- Lấy từ **Hồ sơ của bé** → 📷 *Ảnh của bé* (lưu `profile:family`, `word = family:me`, cạnh ảnh gia đình).
- Không có thì dùng 🧒 / 👧 theo bé trai / bé gái đã chọn ở Mặc đồ.
- **Quyền riêng tư:**
  - ảnh bé chỉ dùng trên máy;
  - **mọi file chia sẻ** (gói ảnh Trốn tìm, gói bài, Drive, link) **không bao giờ có ảnh `profile:`**, kể cả khi bé vừa chơi lượt đổi vai bằng ảnh đó;
  - chỉ **bản sao lưu đầy đủ** do bố mẹ tự tạo mới có ảnh này (như ảnh gia đình, SPEC-talk 15.6).

### 7.6 Quy tắc chung
- Ảnh `hide:` **không** bị dùng lại làm ảnh từ vựng: thêm vào bộ lọc của `latestImageForWord`.
- Ảnh hỏng / không tải được: dùng SVG / emoji.
- Góc bố mẹ → **🙈 Ảnh Trốn tìm**: 7.2–7.4 + **Chia sẻ** (file / Drive / link, `mediaShareSection`). Nhập ở đây hoặc ở Quản lý bài.
- Bản sao lưu đầy đủ có mọi ảnh `hide:*`. Ảnh khóa theo **mã phòng / mã tư thế / mã bất ngờ**, nên khôi phục giữ đúng liên kết.

## 8. Dữ liệu, trạng thái, thuật toán
**Dữ liệu** (`app/js/hide-seek.js`, giống `sticker-scenes.js`):
```js
{ id: 'bedroom', en: 'bedroom', vi: 'phòng ngủ', emoji: '🛏️', draw: '…mô tả cho prompt…',
  spots: [ // 4–6 chỗ
    { id: 'bed-under',        // duy nhất trong phòng
      prep: 'under',          // 'in' | 'under' | 'behind' | 'next to'
      phrase: 'under the bed', phraseVi: 'dưới gầm giường',  // cả cụm, viết sẵn
      thing: 'bed', thingVi: 'cái giường',                     // tên đồ vật (prompt, xem vùng chạm)
      rect: [40, 170, 160, 80], // x, y, w, h trên khung 400×300
      peek: 'bottom',           // 'top' | 'left' | 'right' | 'bottom'
      emoji: '🛏️' } ],
  surprises: [{ id: 'cat', en: 'cat', vi: 'con mèo', sound: 'meow', emoji: '🐱' }] }
```

**Máy trạng thái:**
```
bé tìm:   intro → counting → searching ⇄ (wrongTap) → found → [Again] → intro …
đổi vai:  swapIntro → childHiding → bongSeeking → foundChild → intro (bé tìm)
```
- Mỗi thao tác chỉ hợp lệ trong trạng thái của nó (bảng 3.1 và mục 4).
- **Mã lượt:** mỗi lượt / mỗi lần đổi phòng / rời game tạo mã mới. Mọi hẹn giờ, câu nói, hoạt ảnh gắn mã. Mã đã đổi thì chúng **không được** đổi trạng thái hay phát tiếng.
- **Mã thao tác:** dùng cho chạm nhầm liên tiếp (3.2).
- **Đổi phòng giữa chừng:** dừng tiếng, hủy mọi thứ đang chờ, rồi lượt mới (`intro`) ở phòng mới.

**Chọn chỗ nấp — "túi giới từ":**
1. Mỗi phòng có một túi chứa các giới từ có trong phòng (vd. in, under, behind, next to), xáo ngẫu nhiên.
2. Mỗi lượt rút một giới từ, rồi chọn ngẫu nhiên một chỗ có giới từ đó.
3. Túi hết thì đổ lại.
- Nhờ vậy **mỗi giới từ xuất hiện đúng một lần trong mỗi vòng 3–4 lượt**, không giới từ nào dày đặc.
- **Không bao giờ trùng chỗ của lượt ngay trước** (cả khi túi vừa đổ lại).
- Đổi phòng thì **làm túi mới** cho phòng đó (lịch sử không mang theo).

**Bông đoán (đổi vai):** chọn 0–2 chỗ sai ngẫu nhiên (khác nhau, khác chỗ bé), rồi chỗ đúng.

**Bất ngờ:** mỗi lần nhầm một bất ngờ, không lặp trong cùng lượt; hết thì xoay vòng.

**Cài đặt:**
- `hideSeek = { room, level: 'easy'|'normal', count: 5|10, rounds }` — nhớ phòng, mức, số đếm, số lượt (để gợi ý đổi vai);
- `hideSeekSwap` (bật / tắt đổi vai, mặc định bật).

Không tính sao học.

## 9. Vòng đời và ca biên
- **App ra nền:** dừng tiếng, hoạt ảnh, hẹn giờ. Quay lại:
  - đang `counting` / `searching` → vào `searching`, Bông vẫn ở chỗ cũ, hỏi lại *"Where is Bông?"*;
  - đang đổi vai → về `childHiding` (bé chọn lại chỗ);
  - đang `found` → hiện 🔁 Again!.
- **Rời game** (🏠 / 🎲): hủy hết (mã lượt mới). Không còn tiếng của trò này phát trên màn khác.
- **Chạm ngoài mọi chỗ nấp:** không có gì xảy ra.
- **Vùng chạm chồng nhau** (chăn trên giường): ô **nhỏ hơn** được ưu tiên; dữ liệu xếp theo thứ tự ưu tiên. Unit test bảo đảm không có hai ô trùng hoàn toàn và mọi ô có phần không bị ô khác che hết.
- **Máy bật "giảm chuyển động":** không rung, không bay, tai đứng yên, Bông hiện ra không nhảy. Vùng chạm và trạng thái giữ nguyên.

## 10. Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **H1** | 2 phòng (Bedroom, Living room) SVG; đầy đủ trạng thái bé đi tìm; đếm 5/10 + bỏ qua; chạm nhầm + bất ngờ; tai (Dễ / Thường); túi giới từ; Cài đặt | HS-01…05, HS-11, HS-12 |
| **H2** | Đổi vai (chạm / kéo, câu có / không tên), nút đổi vai, tắt đổi vai; thêm 3 phòng | HS-06, HS-07; Bông luôn tìm thấy sau ≤ 3 chỗ |
| **H3** | Ảnh phòng (bố cục mẫu, prompt, xác nhận khớp, xem vùng), ảnh Bông 4 tư thế, ảnh bất ngờ (dùng lại), ảnh bé trong Hồ sơ, chia sẻ | HS-08…HS-10; ảnh phòng khớp ô |
- **Mic không làm** trong trò này. Nếu sau này thêm: không nói / không nhận dạng được thì vẫn chơi bình thường.

## 11. Kiểm thử
**Unit**
- Mỗi phòng **4–6 chỗ nấp**, mã không trùng; có đủ in / under / behind; `prep` thuộc 4 giới từ; `phrase` bắt đầu bằng đúng giới từ của nó.
- Ô nằm trong 400×300; không có hai ô trùng hoàn toàn; ô nào cũng còn phần không bị che.
- Mọi cụm của 5 phòng: câu nhầm, câu tìm thấy, câu hỏi đổi vai **có tên** (*Is Na …?*) và **không tên** (*Are you …?*), cụm tiếng Việt đúng dữ liệu.
- Túi giới từ: mỗi vòng đủ các giới từ của phòng; không trùng chỗ hai lượt liền (kể cả lúc đổ túi); đổi phòng thì túi mới.
- Đổi vai: luôn kết thúc đúng chỗ, tối đa 3 chỗ.
- Prompt ảnh phòng nêu đủ đồ vật và vị trí.

**UI (chế độ nhanh)**
| ID | Kịch bản | Mong đợi |
|---|---|---|
| HS-01 | Chơi liên tiếp nhiều lượt | Không lặp chỗ nấp ở lượt kế tiếp |
| HS-02 | Chạm liên tục nhiều chỗ nhầm | Chỉ phát phản hồi của lần chạm mới nhất; trạng thái không rối |
| HS-03 | Chạm Bông khi đang đếm | Sang `searching` đúng một lần; chạm phòng khi đang đếm không có tác dụng |
| HS-04 | Đổi phòng khi đang phát tiếng | Tiếng cũ dừng; lượt mới ở phòng mới không bị ảnh hưởng |
| HS-05 | Không chạm 10 giây (mức Thường) | Tai hiện sau 10 giây tính từ lúc nói xong *Where is Bông?*; 2 lần nhầm cũng hiện tai |
| HS-06 | Hồ sơ có tên Na | *Is Na in the box? … No!* / *Found you! You're in the box!* |
| HS-07 | Hồ sơ chưa có tên | *Are you in the box? … No!* |
| HS-08 | Ảnh Bông thiếu một tư thế | Tư thế đó dùng SVG, không khung trống |
| HS-09 | Xóa ảnh phòng | Về tranh SVG, chơi bình thường |
| HS-10 | Bé chơi đổi vai bằng ảnh của bé rồi xuất gói chia sẻ | Gói không có ảnh `profile:` nào |
| HS-11 | Bật giảm chuyển động | Không rung / bay; tai đứng yên |
| HS-12 | App ra nền khi đang tìm | Tiếng dừng; quay lại vào `searching`, cùng chỗ nấp |
- Thêm: chạm đúng thì khóa các chỗ khác (chạm tiếp không có câu nhầm); ảnh `hide:` không lẫn vào ảnh từ vựng; ảnh bất ngờ dùng lại hai lần vẫn chỉ một bản.

**Thử tay với bé:** tai có đủ rõ không; đếm đến 5 có vừa không; bé có hiểu cụm *next to* không.

## 12. Ghi chú khi code (0.19.0)
- **Phụ đề nằm hàng riêng dưới tranh**, không đè lên tranh: ảnh chụp thử cho thấy phụ đề che đúng các đồ vật ở đáy tranh (hộp, bàn, bồn cầu, hoa) mà bé cần chạm.
- **Bông ở góc trên** là nút "Bông": chạm khi đang mở đầu / đếm thì bỏ qua phần còn lại.
- **Vùng chạm** tính theo điểm chạm trên khung 400 × 300 (ô nhỏ nhất chứa điểm thắng). Các khung trên tranh chỉ để rung / sáng, không nhận chạm.
- **Quay lại sau khi app ra nền:** app dựng lại màn chơi, nên lượt đang chơi được giữ trong bộ nhớ (tối đa 10 phút, cùng phòng).
- **Ảnh của bé:** Hồ sơ của bé → "Ảnh của bé" (`profile:family` / `family:me`). Gói chia sẻ chỉ lấy ảnh theo `hide:*` nên không bao giờ có ảnh này (có test).
