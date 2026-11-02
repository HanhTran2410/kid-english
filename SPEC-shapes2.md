# SPEC — 🔷 Đếm hình mới (More shapes)

> Phiên bản spec: **draft2 (đã chốt)** · Ngày: 2026-11-02 · **Đã làm M1 + M2 trong app 0.60.0** (ghi chú khi code ở mục 12).
> - **Câu hỏi đã chốt (theo đề xuất):** thẻ luôn hiện; *diamond* + *trapezoid*; chưa thêm lưỡi liềm / chữ thập; đếm góc chỉ lần đầu trong lượt.
> - **draft2 (sau review):** hình thang được hỏi luôn đáy dài ở dưới; câu nhận dạng hình thoi đổi thành *"Pointy top, pointy bottom!"*; định nghĩa "lần nhầm"; chạm lại cùng hình sai; câu đếm góc cho cả ngũ / lục / bát giác; quy tắc hình không che nhau + test vùng chạm; đổi tranh bướm → sâu, quầy nước → đèn ngủ, thêm tranh nhà nhỏ và rùa; `cornerIntro` thay cho `corners`.
>
> Thẻ mới trong mục **🔢 Số đếm**, ngay sau *🔺 Đếm hình* (SPEC-shapes). Cùng cách chơi với *Đếm hình* (chạm từng hình để đếm), nhưng dùng **bộ hình mới**: hình thang, hình bình hành, hình thoi, hình bầu dục (mức 1); hình ngũ giác, lục giác, bát giác, nửa hình tròn (mức 2).
> Spec này chỉ ghi **phần khác** với SPEC-shapes. Phần nào không nhắc thì làm y như SPEC-shapes (màn hình, cách chạm đếm, huy hiệu số, gợi ý 10 giây, ▶ / 🏠, giảm chuyển động, ra nền rồi quay lại…).

## 1. Mục tiêu
- Bé đã quen *circle, square, triangle…* thì học thêm **tên hình mới** bằng tiếng Anh, và **phân biệt các hình gần giống nhau**:
  - hình bình hành ↔ hình chữ nhật (bình hành **nghiêng**);
  - hình thoi ↔ hình vuông (thoi **nhọn trên, nhọn dưới**, dẹt; hình vuông luôn đặt thẳng);
  - hình thang ↔ hình chữ nhật / tam giác (thang có **cạnh trên ngắn, cạnh dưới dài**);
  - hình bầu dục ↔ hình tròn (bầu dục **dài ra**);
  - ngũ giác ↔ lục giác ↔ bát giác (**đếm góc** để biết tên).
- Vẫn là trò **đếm**: Bông hỏi *"How many parallelograms?"*, bé chạm từng hình để đếm.
- Mỗi tranh có **lẫn hình cũ** (chữ nhật, vuông, tròn…) đặt cạnh hình mới, nên bé phải nhìn **dáng** để chọn. Chạm nhầm thì Bông nói tên hình đó, cũng là học. Không trừ sao, không bao giờ nói "wrong".
- **Mới so với Đếm hình:** khi giới thiệu ngũ giác / lục giác / bát giác, Bông **đếm góc** (*"A hexagon has six corners!"*), vì tên hình đến từ số góc. Số đếm lại có ích thêm một lần.

## 2. Vị trí và màn hình
- **Số đếm** → thêm thẻ **🔷 More shapes / Đếm hình mới**, đặt **sau 🔺 Đếm hình**.
- Thẻ **luôn hiện**. Không bắt phải chơi xong *Đếm hình* trước. Bố mẹ muốn ẩn thì dùng tính năng ẩn bài sẵn có.
- Màn hình giống *Đếm hình*: tranh, thẻ hình cần đếm (hình mẫu to + tên), bộ đếm, ▶, 🏠.
- **Thẻ hình mẫu** dùng dáng "chuẩn" của mỗi hình (mục 4.1). Riêng ngũ giác / lục giác / bát giác có **chấm nhỏ ở mỗi góc**, để bé đếm góc được.
- Một lượt chơi = **5 câu**, xong thì hoan hô + sticker (như *Đếm hình*).

## 3. Cách chơi một câu
Giống *Đếm hình* (SPEC-shapes mục 3). Những phần **khác** hoặc **thêm**:

| Lúc | App |
|---|---|
| Giới thiệu hình **4 cạnh / bầu dục / nửa tròn** | *"This is a parallelogram!"*, thẻ hình mẫu nảy lên. Lần đầu gặp trong lượt thì Bông nói thêm **câu nhận dạng** (bảng câu nói bên dưới) |
| Giới thiệu hình **nhiều góc** (ngũ / lục / bát giác) | *"This is a hexagon!"*. Lần đầu gặp trong lượt: các góc trên thẻ mẫu **sáng lần lượt**, Bông đếm *"One, two, … six!"*, rồi *"A hexagon has six corners!"*. Các lần sau trong lượt chỉ nói *"This is a hexagon!"* |
| Chạm **hình sai** lần đầu (trong câu này) | Hình lắc nhẹ, Bông *"That's a rectangle!"*. Nếu là **hình dễ nhầm** (cột "Dễ nhầm với", mục 4.1): hình vừa chạm và thẻ hình mẫu **nháy cùng lúc** một nhịp, để bé so hai dáng. Không đếm, không tính sai. **Tính 1 lần nhầm** |
| Chạm lại **cùng hình sai** đó | Hình lắc nhẹ, Bông nói lại tên (bé chạm để nghe lại cũng là học). **Không** nháy so sánh nữa, **không** tính lần nhầm mới |
| Đủ **3 lần nhầm** trong câu | *"Find the parallelograms! It leans over!"* (câu nhận dạng của hình đang hỏi) + thẻ mẫu nảy. Chỉ nhắc **một lần** mỗi câu |
| **Mức 1**: câu khởi động | Bé chưa gặp loại hình đó: *"Find a trapezoid!"*, chạm **một** hình đúng là xong (như SPEC-shapes câu hỏi 3) |
| **Mức 2**: bước chọn số | Như *Đếm hình* mức 2: đếm đủ → 3 thẻ chữ số |
- **Lần nhầm** = số **hình sai khác nhau** bé đã chạm trong câu. Ví dụ: chữ nhật A → chữ nhật A → hình tròn = **2 lần nhầm**, chưa nhắc. Chạm chỗ trống / nét trang trí không tính.

**Câu nói mới:**
| Lúc | Tiếng Anh | Phụ đề |
|---|---|---|
| Nhận dạng bình hành | It leans over! | Hình này nghiêng sang một bên! |
| Nhận dạng thoi | Pointy top, pointy bottom! | Nhọn ở trên, nhọn ở dưới! |
| Nhận dạng thang | Short top, long bottom! | Cạnh trên ngắn, cạnh dưới dài! |
| Nhận dạng bầu dục | It's like an egg! | Giống quả trứng! |
| Nhận dạng nửa tròn | It's half a circle! | Một nửa hình tròn! |
| Đếm góc ngũ giác | One, two, three, four, five! · A pentagon has five corners! | 1, 2, 3, 4, 5! · Hình ngũ giác có năm góc! |
| Đếm góc lục giác | One, two, … six! · A hexagon has six corners! | 1, 2, … 6! · Hình lục giác có sáu góc! |
| Đếm góc bát giác | One, two, … eight! · An octagon has eight corners! | 1, 2, … 8! · Hình bát giác có tám góc! |
| Nhắc (3 lần nhầm) | Find the parallelograms! It leans over! | Tìm hình bình hành nào! Hình nghiêng sang một bên! |
- Câu đếm góc dùng **một mẫu chung** (`A/An {kind} has {N} corners!`), lấy N từ `cornerIntro` (mục 8); không viết riêng cho từng hình.
- Mỗi số khi đếm góc đọc một nhịp, góc tương ứng sáng cùng lúc (như huy hiệu số khi đếm hình).
- Câu còn lại (*How many…?*, *That's a…!*, *Three ovals! Great counting!*…) dùng mẫu của *Đếm hình*, chỉ thay tên hình. Mạo từ tự chọn theo nguyên âm: *an oval, an octagon, a hexagon, a semicircle*.

## 4. Nội dung

### 4.1 Hình học
| Hình | en (số nhiều) | vi | Mức | Dễ nhầm với | Dáng chuẩn trên thẻ mẫu |
|---|---|---|---|---|---|
| ⬭ | oval (ovals) | hình bầu dục | 1 | circle | nằm ngang, dài : rộng = 1,6 |
| 🔷 | diamond (diamonds) | hình thoi | 1 | square | đứng trên một đỉnh, đường chéo dọc : ngang = 1,6 |
| ⏢ | trapezoid (trapezoids) | hình thang | 1 | rectangle, triangle | thang cân, đáy dài ở dưới, đáy trên = 0,5 đáy dưới |
| ▱ | parallelogram (parallelograms) | hình bình hành | 1 | rectangle, diamond | cạnh đáy nằm ngang, nghiêng 30°, cạnh dài : ngắn = 1,6 |
| ⬠ | pentagon (pentagons) | hình ngũ giác | 2 | hexagon | đều, đỉnh nhọn hướng lên |
| ⬡ | hexagon (hexagons) | hình lục giác | 2 | pentagon, octagon | đều, hai cạnh nằm ngang (trên, dưới) |
| 🛑 | octagon (octagons) | hình bát giác | 2 | hexagon, circle | đều, một cạnh nằm ngang (như biển dừng) |
| ◗ | semicircle (semicircles) | nửa hình tròn | 2 | circle, oval | cạnh thẳng nằm dưới (như cửa vòm) |
- Hình cũ của *Đếm hình* (circle, square, triangle, rectangle, star, heart) **vẫn có trong tranh** để bé so, nhưng **không bao giờ được hỏi** trong trò này. Chạm vào thì Bông nói tên như thường.
- **Tên hình luôn là tên "riêng nhất"**: hình vuông thì gọi là *square* (dù về toán nó cũng là hình thoi, hình bình hành); hình chữ nhật thì gọi là *rectangle*. *"How many parallelograms?"* chỉ đếm hình bình hành **nghiêng**, không đếm hình chữ nhật. Góc bố mẹ có một dòng giải thích (mục 5).
- Tên tiếng Anh: **"diamond"** cho hình thoi (từ bé hay nghe; *rhombus* để sau), **"trapezoid"** (Mỹ; Anh gọi *trapezium*).

### 4.2 Quy tắc vẽ để không mơ hồ (thêm vào quy tắc của SPEC-shapes mục 4.2)
SPEC-shapes cấm hình bầu dục và hình thang. Trò này **cho phép**, nhưng mỗi hình phải **rõ dáng**:
- **Bầu dục:** dài : rộng **≥ 1,4** (không trông như hình tròn méo).
- **Thoi:** 4 cạnh bằng nhau, một đường chéo **dọc** (nhọn trên, nhọn dưới), đường chéo dài : ngắn **≥ 1,4**. **Không bao giờ vẽ hình vuông xoay 45°** làm hình thoi, vì hình vuông xoay vẫn là hình vuông. Bé sẽ học sai.
- **Hình vuông** trong tranh set 2 luôn **đặt thẳng** (cạnh đáy nằm ngang), để câu *"Pointy top, pointy bottom!"* luôn đúng: chỉ hình thoi mới nhọn trên, nhọn dưới.
- **Bình hành:** hai cặp cạnh song song, cạnh đáy nằm ngang, góc nghiêng **20°–40°** (không gần vuông), cạnh dài : ngắn **≥ 1,4** (không thành hình thoi).
- **Thang:** **đúng một** cặp cạnh song song (nằm ngang), đáy ngắn từ **0,3 đến 0,7** đáy dài (không gần tam giác, không gần chữ nhật). Không vẽ thang có hai cạnh bên song song.
  - **Tranh có hỏi hình thang** thì **mọi** hình thang trong tranh đều **đáy dài ở dưới**, như thẻ mẫu và câu *"Short top, long bottom!"*.
  - Hình thang **lật ngược** (thân tàu, giỏ, thân vương miện) chỉ có trong tranh **không hỏi** hình thang. Bé chạm vào thì Bông vẫn nói *"That's a trapezoid!"* (đúng tên), nhưng không bao giờ phải đếm nó.
- **Ngũ / lục / bát giác:** gần đều, cạnh ngắn của khung **≥ 36/200** để thấy rõ góc. Bát giác không nhỏ đến mức trông như hình tròn.
- **Nửa hình tròn:** đúng nửa (cạnh thẳng đi qua tâm), cạnh thẳng nằm ngang.
- **Hình không che nhau:** hai hình bất kỳ chỉ được **tách rời**, **chạm cạnh**, hoặc **một hình nằm trọn trong hình kia** (cửa sổ trong tường, vân trong mai rùa; hình trong vẽ sau). Không có hình nào bị che **một phần**, nên hình nào bé cũng thấy trọn dáng. (Ví dụ: con ong không bay đè lên ô sáp.)
- Mỗi tranh mức 1 có **ít nhất một hình dễ nhầm** với hình được hỏi (ví dụ hỏi bình hành thì có hình chữ nhật), để bé phải so.
- **Unit test phân loại lại từ tọa độ** (mục 10): mỗi hình trong dữ liệu phải được hàm phân loại nhận đúng `kind`, nên không có hình "lưng chừng".

### 4.3 Tranh (vẽ SVG, mỗi vùng là đúng **một** hình học)
**Tranh mức 1 (9 tranh, mốc M1):**
| Tranh | Hình (số lượng) | Hỏi ở mức 1 | Hỏi ở mức 2 |
|---|---|---|---|
| ⛴️ ship (tàu thủy) | thang 1 (thân, **lật ngược**), chữ nhật 3 (cabin + 2 ống khói), bầu dục 3 (cửa sổ), tròn 1 (phao); sóng là nét | ovals 3 | ovals 3 |
| 🧺 eggs (giỏ trứng) | thang 1 (giỏ, **lật ngược**), bầu dục 4 (trứng đứng), tròn 1 (mặt trời); quai giỏ là nét | ovals 4 | ovals 4 |
| 🐛 caterpillar (con sâu) | bầu dục 5 (5 đốt thân, nằm ngang, chạm nhau), tròn 1 (đầu); chân, râu là nét | ovals 5 | ovals 5 |
| 🏎️ race car (xe đua) | bình hành 3 (2 cửa kính + cánh gió), chữ nhật 1 (thân), tròn 2 (bánh), bầu dục 1 (đèn) | parallelograms 3 | parallelograms 3 |
| 📚 books (kệ sách) | chữ nhật 4 (3 sách đứng + mặt kệ), bình hành 2 (sách nghiêng) | parallelograms 2 | parallelograms 2 |
| 👑 crown (vương miện) | thang 1 (thân, **lật ngược**), tam giác 3 (mũi nhọn), thoi 3 (ngọc), vuông 1 (ngọc giữa), bầu dục 2 (ngọc) | diamonds 3 | diamonds 3, ovals 2 |
| 🪁 kite (cánh diều) | thoi 4 (diều + 3 nơ đuôi), vuông 1 (cái hộp dưới đất), bầu dục 2 (mây); dây là nét | diamonds 4 | diamonds 4 |
| 💡 lamps (đèn ngủ) | thang 3 (chụp đèn, đáy dài ở dưới), chữ nhật 4 (3 thân đèn + mặt bàn) | trapezoids 3 | trapezoids 3 |
| 🏡 cottage (nhà nhỏ) | thang 1 (mái, đáy dài ở dưới), vuông 1 (tường), chữ nhật 1 (cửa), tròn 2 (cửa sổ) | trapezoids 1 | trapezoids 1 |

**Tranh mức 2 (5 tranh, mốc M2):**
| Tranh | Hình (số lượng) | Hỏi ở mức 2 |
|---|---|---|
| 🐝 beehive (tổ ong) | lục giác 7 (ô sáp, chạm cạnh nhau), bầu dục 3 (thân ong + 2 cánh, bay **ngoài** tổ) | hexagons 7, ovals 3 |
| 🚸 street (góc phố) | bát giác 2 (biển dừng), ngũ giác 1 (biển trường học), thoi 2 (biển vàng), tròn 1, tam giác 1; cột biển là nét | octagons 2, diamonds 2 |
| 🏘️ houses (dãy nhà) | ngũ giác 3 (mặt nhà), chữ nhật 3 (cửa), nửa tròn 3 (cửa sổ vòm), tròn 1 (mặt trời) | pentagons 3, semicircles 3 |
| 🍪 cookies (khay bánh quy) | bát giác 3, lục giác 4, ngũ giác 2, nửa tròn 2 (bánh; khay là nền) | hexagons 4, octagons 3 / pentagons 2, semicircles 2 |
| 🐢 turtle (con rùa) | nửa tròn 1 (mai), lục giác 3 (vân, nằm trọn trong mai), bầu dục 5 (đầu + 4 chân); mắt là chấm | semicircles 1, hexagons 3 |
- Mức 1 mỗi tranh hỏi **một** loại; mức 2 hỏi tối đa 2 loại liền nhau trên cùng tranh (như *Đếm hình*).
- Đáp án mức 1 trải đều 1–5 (hiện có: 1, 2, 3, 4, 5).
- Ngũ giác / bát giác đặt cạnh lục giác ở cùng tranh (đĩa bánh quy, góc phố), để bé phải **đếm góc** mới chọn đúng.

### 4.4 Mức (tự lên, bố mẹ khóa được — như *Đếm hình*)
| Mức | Hình hỏi | Đáp án | Tranh dùng | Mỗi tranh | Bước chọn số |
|---|---|---|---|---|---|
| **1** (mặc định) | oval, diamond, trapezoid, parallelogram | 1–5 | 9 tranh mức 1 | hỏi 1 loại | không |
| **2** | + pentagon, hexagon, octagon, semicircle | 1–10 | **cả 14 tranh** | hỏi 1–2 loại | có (3 thẻ số) |
- Lên mức 2 sau **3 lượt chơi xong** ở mức 1. Áp dụng từ **lượt sau**.
- Mức của trò này **riêng**, không dính với mức của *Đếm hình*.
- Chọn câu trong một lượt: như *Đếm hình* (không lặp tranh, có đủ loại hình, ưu tiên số bé ít sao, không quá 2 lần cùng đáp án). Ở mức 2, một tranh có thể cho **2 câu liền nhau** (hai loại hình), nhưng không quay lại tranh đó lần nữa trong lượt.
- Ở mức 2, lượt nào cũng có **ít nhất 2 câu hỏi hình mức 2** (5 tranh mức 2 có 9 câu hình mức 2, đủ để chọn), để bé không chỉ gặp lại hình mức 1.

## 5. Tiến độ, phần thưởng
- **Sao số**: như *Đếm hình* (đếm đủ thì ghi tiến độ cho số N; mức 2 chọn đúng thẻ ngay lần đầu thì thêm sao). Không bao giờ trừ sao.
- **Từ hình học**: ghi "đã gặp" *oval, diamond, trapezoid…* vào kho tiến độ chung, để xem trong Góc bố mẹ.
- **Góc bố mẹ**: dòng giải thích *"Trò này gọi mỗi hình bằng tên riêng nhất: hình vuông là square, không gọi là diamond hay parallelogram."*
- Hết 5 câu: hoan hô + sticker. Thẻ trong Số đếm hiện số lần chơi xong như các thẻ khác.

## 6. Ảnh
- Như SPEC-shapes mục 6: tranh **vẽ SVG trong app**, không thay bằng ảnh AI.
- Màu: hình cùng loại **không cùng màu hết**; cặp dễ nhầm trong cùng tranh (bình hành ↔ chữ nhật…) có thể cùng màu, để bé **phải** nhìn dáng.
- Trước khi code xong M1, xem **bản vẽ thử** cả 9 tranh trên iPad và điện thoại dọc: hình có rõ dáng không, tranh có "ra" đồ vật không (nhất là con sâu, vương miện).

## 7. Trạng thái và ca biên
Giống SPEC-shapes mục 7. Thêm:
- **Đếm góc trên thẻ mẫu** (giới thiệu hình nhiều góc) là một bước có mã lượt: bé chạm ▶ hoặc 🏠 giữa chừng thì dừng ngay, không đếm tiếp.
- Đang đếm góc thì **chạm tranh không có tác dụng**. Bông hỏi xong *How many…?* mới chạm được.
- **Lần nhầm** đếm lại từ 0 mỗi câu; danh sách "hình sai đã chạm" cũng xóa khi sang câu.
- **Giảm chuyển động:** góc sáng lần lượt vẫn giữ (đứng yên, chỉ đổi màu chấm); hình dễ nhầm không nháy mà dùng viền đậm đứng yên.

## 8. Dữ liệu (mở rộng `app/js/shapes.js`, không tạo engine mới)
- Thêm 8 loại vào `KINDS`, cùng cấu trúc với loại cũ: `{ en, plural, vi, emoji, level, set }` (hình cũ thêm `set: 1`, hình mới `set: 2`). Mạo từ *a / an* tính từ `en` như hiện nay.
- Ngũ / lục / bát giác thêm `cornerIntro: 5 | 6 | 8`: có trường này thì lần giới thiệu đầu trong lượt sẽ đếm góc, N lấy từ đây. (Không đặt tên `corners`, vì hình thang, thoi… cũng có góc nhưng không đếm.)
- Hình mới:
  - `oval`: `{ c: [x, y], rx, ry }`;
  - `semicircle`: `{ c: [x, y], r }` (cạnh thẳng luôn ở dưới);
  - các đa giác (thoi, thang, bình hành, ngũ / lục / bát giác): `points` (như tam giác).
- Tranh mới có `set: 2`; `ask` giống tranh cũ. Đáp án vẫn = **đếm `shapes` theo `kind`**.
- Hàm `classifyShape(s)` phân loại lại từ tọa độ (số đỉnh, cạnh song song, cạnh bằng nhau, góc vuông, tỉ lệ) để test mục 4.2.
- Bài có sẵn trong Số đếm: `{ mode: 'shapes', set: 2, builtin: 'shapes-2', title: 'More shapes', titleVi: 'Đếm hình mới', emoji: '🔷' }`, tự thêm vào máy cũ một lần (như `shapes-1`).
- Cài đặt riêng `shapeCount2 = { level, rounds, lock }`.
- *Ôn tập* / *Học cùng Bông* vẫn **bỏ qua** bài `mode: 'shapes'` (cả set 1 và set 2), như hiện nay.

## 9. Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **M1** | Thẻ trong Số đếm; mức 1 (bầu dục / thoi / thang / bình hành, đáp án 1–5); 9 tranh; câu nhận dạng; hình dễ nhầm nháy cùng thẻ mẫu; đếm lần nhầm + nhắc; câu khởi động *Find a…!*; 5 câu + sticker; tiến độ số | Mọi hình qua test phân loại và test che nhau; chạm nhanh / chạm lại không đếm trùng; đáp án đúng với hình vẽ |
| **M2** | Mức 2 (ngũ / lục / bát giác, nửa tròn, đến 10, bước chọn số); thêm 5 tranh; đếm góc trên thẻ mẫu; tự lên mức, khóa mức | Đếm góc đúng số góc; ▶ giữa lúc đếm góc thì dừng ngay; câu hỏi đa dạng, không lặp |

## 10. Kiểm thử
**Unit**
- Như SPEC-shapes mục 10, áp dụng cho tranh set 2.
- **Phân loại lại:** `classifyShape(s) === s.kind` cho mọi hình của mọi tranh set 2. Có ca âm:
  - hình vuông xoay 45° phải ra `square`, không ra `diamond`;
  - bình hành nghiêng 10° bị loại (quá gần chữ nhật);
  - thang có đáy trên = 0,9 đáy dưới bị loại (quá gần chữ nhật);
  - bầu dục tỉ lệ 1,1 bị loại (quá gần tròn).
- **Hình thang:** tranh nào có `trapezoid` trong `ask` thì mọi hình thang của tranh đó đáy dài ở dưới.
- **Hình vuông** set 2 đều đặt thẳng.
- **Che nhau:** mọi cặp hình trong tranh hoặc tách rời / chạm cạnh, hoặc một hình nằm trọn trong hình kia và được vẽ sau (kiểm bằng lấy mẫu điểm).
- Ngũ / lục / bát giác có `cornerIntro` = số đỉnh của hình mẫu; câu đếm góc đúng cho cả ba (*A pentagon has five corners! / A hexagon has six corners! / An octagon has eight corners!*).
- Tên số ít / nhiều đúng (*One octagon / Three octagons*); mạo từ đúng (*an oval, an octagon, a hexagon, a semicircle*).
- **Lần nhầm:** chạm A → A → tròn = 2; chạm A → B → C = 3, nhắc một lần; sang câu thì về 0.
- Mỗi tranh mức 1 có ít nhất một hình dễ nhầm với loại được hỏi.
- Lượt mức 2 có ≥ 2 câu hình mức 2; không quay lại tranh đã dùng trong lượt.

**UI (chế độ nhanh)**
- Xe đua: *How many parallelograms?* → chạm 3 hình nghiêng → *Three parallelograms! Great counting!*.
- Chạm thân xe (chữ nhật) → *That's a rectangle!* + thân xe và thẻ mẫu nháy cùng lúc; bộ đếm không đổi.
- Chạm lại thân xe → nói lại *That's a rectangle!*, không nháy; chưa nhắc.
- Chạm 3 hình sai khác nhau → *Find the parallelograms! It leans over!*, chỉ một lần.
- **Vùng chạm:** chạm giữa cửa sổ (nằm trong cabin) → đếm cửa sổ, không phải cabin; chạm cabin ngoài cửa sổ → cabin; chạm cạnh chung hai ô sáp → đúng một ô; chạm nét (sóng, dây diều) → không có gì.
- Mức 2, tổ ong, lần đầu gặp lục giác: thẻ mẫu sáng 6 góc, *A hexagon has six corners!*, rồi mới hỏi. Câu sau cũng hỏi lục giác → chỉ *This is a hexagon!*.
- Chạm ▶ lúc đang đếm góc → sang câu sau ngay, không còn tiếng đếm cũ.
- Giảm chuyển động: không nháy / lắc; góc vẫn sáng lần lượt.

**Thử tay với bé:** bé có phân biệt bình hành với chữ nhật không (nếu không thì tăng góc nghiêng); câu nhận dạng có giúp không; tên *parallelogram* có quá dài để bé nói theo không; đếm góc có làm câu quá dài không; bé có thắc mắc khi chạm thân tàu (thang lật) mà Bông nói *trapezoid* không.

## 11. Câu hỏi đã chốt
1. Thẻ **luôn hiện**, không cần *Đếm hình* lên mức 2. Bố mẹ muốn ẩn thì dùng tính năng ẩn bài sẵn có.
2. **diamond** (không dùng *rhombus*), **trapezoid** (không dùng *trapezium*).
3. **Chưa** thêm hình lưỡi liềm (crescent) và hình chữ thập (cross). Để mốc sau nếu bé thích.
4. **Đếm góc** chỉ ở lần đầu gặp hình trong lượt; các lần sau chỉ *"This is a hexagon!"*.

## 12. Ghi chú khi code (0.60.0)
- **Không có engine mới:** bài `shapes-2` dùng chung trình phát của *Đếm hình* (`mode: 'shapes'`, thêm `set: 2`); tự thêm vào máy cũ một lần như các bài số khác. Mức lưu ở `shapeCount2`, *Đếm hình* vẫn dùng `shapeCount`.
- **Mỗi câu** Bông nói *"This is a …!"*; lần đầu gặp loại hình trong lượt thì thêm câu nhận dạng hoặc đếm góc. Câu khởi động *Find a …!* (mức 1, bé chưa gặp loại hình) đến sau phần giới thiệu.
- **Đĩa bánh quy bỏ hình bầu dục làm đĩa:** 11 bánh (mỗi bánh ≥ 36/200 để thấy góc) không đủ chỗ trong một đĩa bầu dục. Khay là màu nền.
- **Cánh diều:** hình vuông là cái hộp dưới đất (không vẽ nhà chỉ để có cửa sổ vuông).
- **Hình ngũ giác của dãy nhà** là ngũ giác đều (mái hơi dốc, tường hơi xiên), không phải "nhà" chữ nhật + tam giác, để đúng quy tắc *gần đều* và dáng thẻ mẫu.
- **Test "hình không che nhau"** lấy mẫu điểm trong khung và chỉ tính điểm nằm sâu trong hình (cách cạnh ≥ 1,5), nên các ô sáp / đốt sâu chạm cạnh không bị tính là che nhau.
- **Giảm chuyển động:** hình dễ nhầm và thẻ mẫu giữ viền xanh đậm đứng yên tới lần chạm nhầm sau.
