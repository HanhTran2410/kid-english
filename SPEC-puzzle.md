# SPEC — 🧩 Ghép hình cùng Bông (Puzzle)

> Phiên bản spec: **draft2** · Ngày: 2026-10-19 · **Đã làm cả P1–P3 trong app 0.20.0** (ghi chú khi code ở mục 11).
> - Một thẻ mới trong Góc trò chơi (🎲 Play), **hai cách chơi trong cùng một trò**: **Ghép bộ phận** và **Ghép cả bức tranh**. Hai cách dùng chung kéo-thả, vùng hút, lời nói + phụ đề, đúng / sai, độ khó, kho ảnh.
> - draft1: bản đầu.
> - **draft2, sửa theo review:**
>   - **điểm neo + bán kính hút** thay cho "khung bao" (mảnh chỉ khớp đúng chỗ của nó);
>   - hệ tọa độ chung 200 × 200;
>   - kích thước tối thiểu tách hai kiểm tra: dữ liệu và màn hình;
>   - **bộ đếm theo số mảnh** + công thức mức, áp dụng từ tranh kế tiếp;
>   - `done` chỉ là "đã ghép xong ít nhất một lần";
>   - danh sách tranh chia **4 nhóm**;
>   - **xem trước / chỉnh vùng cắt** cho ảnh gia đình và ảnh bố mẹ thêm;
>   - phân biệt ra nền / thoát / 🔁;
>   - xe hơi: mảnh `car` gọi là **body**;
>   - màu đọc mới nhất mỗi lượt;
>   - thứ tự hỏi khai báo theo từng hình;
>   - bảng thao tác liên tiếp;
>   - test PU-01…PU-12;
>   - làm **bướm** trọn vẹn trước rồi mới nhân 10 hình.
> - **Câu hỏi draft1 đã chốt:** ảnh gia đình **hiện mặc định**, bố mẹ tắt được; ghép bộ phận không bóng mờ **để sau**. Thêm theo review: **tự lên mức ở tranh kế tiếp** (bố mẹ khóa được); **cắt giữa ảnh** mặc định, có **xem trước** cho ảnh gia đình / ảnh bố mẹ thêm.

## 1. Mục tiêu
- **Ghép bộ phận:** bé học **tên bộ phận** bằng tiếng Anh (*head, body, wings, tail, roof, wheels…*) khi lắp từng bộ phận vào hình con vật / đồ vật.
- **Ghép cả bức tranh:** bé rèn **quan sát, nhận diện hình, tư duy không gian** với ảnh từ vựng, hình vẽ sẵn, ảnh gia đình; ghép xong nghe lại từ (*"It's a cow! Moo moo!"*).
- Cho bé 3 tuổi: mảnh to, **không xoay mảnh**, vùng hút rộng, luôn có hình mẫu mờ. Kéo sai không bị trừ gì.

## 2. Màn hình
1. **Góc trò chơi** thêm thẻ **🧩 Puzzle · Ghép hình**.
2. **Chọn cách chơi:** 2 thẻ to.
   - 🦋 **Ghép bộ phận** — *head, body, wings, tail…*
   - 🖼️ **Ghép cả bức tranh** — *ảnh con vật, đồ vật, gia đình*
   - Nhớ cách chơi lần trước.
3. **Chọn hình:** lưới thẻ hình. Hình đã ghép xong ít nhất một lần có ✨. Ghép cả bức tranh chia **nhóm** (mục 5.1).
4. **Màn ghép:**
```
 🏠  🧩  🔁   🧩 Butterfly                      🐰
 ┌──────────────────────────────┐
 │   khung ghép (hình mẫu mờ)    │  ← thả mảnh vào đây
 └──────────────────────────────┘
   phụ đề (hàng riêng, cao cố định — không che khung, không làm khung co giãn)
  [mảnh] [mảnh] [mảnh] [mảnh]          ← khay, không cuộn (điện thoại: 2 hàng)
```
- **🧩** về chọn hình; **🔁** ghép lại hình này từ đầu.
- **Chạm Bông:** nghe lại câu hỏi đang có.
- Phụ đề tiếng Việt cho **mọi câu**, nằm hàng riêng cao cố định. Bài học từ Trốn tìm: phụ đề đè lên khung thì che chỗ thả; phụ đề làm khung co giãn thì bé thả trượt.

## 3. Thao tác chung (cả hai cách chơi)

### 3.1 Kéo, thả, chạm
| Bé làm | App |
|---|---|
| Kéo mảnh từ khay | Mảnh to lên theo ngón tay. Mức dễ: chỗ đúng của **chính mảnh đó** sáng nhẹ khi mảnh tới gần |
| Thả **đúng chỗ** (mục 3.2) | Mảnh **tự hút** khớp vào đúng vị trí, tiếng "tách", Bông: *"Yes! The tail!"* (ghép tranh: *"Yes!"*) |
| Thả **sai chỗ** — lần 1 | Mảnh nảy về khay, tiếng "boing" nhẹ, Bông: *"Oops! Try again!"* |
| Thả sai — lần 2 (cùng mảnh, trong lượt này) | Mảnh nảy về khay, **chỗ đúng phát sáng**, Bông: *"Look! Here!"* |
| Thả ra ngoài khung | Mảnh về khay, không nói gì, không tính sai |
| **Chạm** một mảnh (không kéo) | Mảnh nhún, Bông nói tên mảnh (*"The wings!"*), chỗ đúng sáng 1 giây. Chạm **không** tự đặt mảnh, vì bé cần tự kéo |
| Đặt mảnh cuối | Mảnh hợp thành hình nguyên vẹn (đường ghép biến mất), hoạt ảnh vui, tiếng ta-da, *"Wow! It's a butterfly!"* **đúng một lần**, rồi hiện **➡️ Next** |

### 3.2 Nhận đúng / sai (điểm neo)
- **Hệ tọa độ chung:**
  - Ghép bộ phận: mọi bộ phận và cả hình dùng **cùng một khung 200 × 200** (dữ liệu Tô màu vẽ mọi bộ phận theo tọa độ của hình hoàn chỉnh, không có viewBox riêng).
  - Ghép tranh: khung là ảnh vuông chia lưới.
  - Nhờ vậy mảnh đặt đúng = vẽ mảnh tại đúng tọa độ gốc, **không cần biến đổi tọa độ**.
- **Điểm neo:**
  - mỗi chỗ đích có một **điểm neo** (tâm khung bao của bộ phận / tâm ô lưới) và một **bán kính hút**;
  - khi kéo, **điểm neo của mảnh** là tâm hình mảnh đang theo ngón tay, đổi về tọa độ khung.
- **Đúng:** điểm neo mảnh cách **điểm neo của chính nó** ≤ bán kính hút:
  - ghép bộ phận: `max(28, 0,45 × cạnh ngắn khung bao)` trên khung 200;
  - ghép tranh: 45% cạnh ngắn ô.
- **Sai:** không đúng, nhưng nằm trong bán kính hút của **chỗ trống của mảnh khác**.
- **Không tính:** ngoài mọi bán kính (kể cả ngoài khung).
- **Hai chỗ đích gần nhau / trùng tâm** (nhụy hoa giữa cánh hoa): không nhầm được, vì mảnh chỉ được nhận ở **điểm neo của chính nó**. Kéo nhụy vào giữa là đúng nhụy, kéo cánh hoa vào giữa cũng là đúng cánh hoa.
- **Khung bao chỉ dùng** để đo kích thước, đặt điểm neo và vẽ chỗ sáng; không dùng để quyết định đúng / sai.

### 3.3 Thao tác liên tiếp và âm thanh
| Tình huống | Quy tắc |
|---|---|
| Chạm mảnh rồi kéo ngay | Câu đọc tên mảnh bị hủy khi bắt đầu kéo; không có hai câu nói chồng |
| Đang kéo mảnh A, chạm / kéo mảnh B | Ngón thứ hai bị bỏ qua; mảnh A không bị ảnh hưởng |
| Mảnh đang hút vào chỗ / đang nảy về khay | Khay khóa: không nhận thao tác mới tới khi xong (~0,4 giây) |
| Mảnh cuối vừa đặt | Câu hoàn thành và tiến độ chỉ chạy **một lần** |
| Bấm ➡️ Next / 🔁 liên tục | Chỉ tạo **một** lượt mới (nút tắt ngay sau lần bấm đầu) |
| Hiệu ứng (tách, boing, ta-da) | Phát cùng lời nói được. Giọng nói thì câu mới hủy câu cũ, không bao giờ hai câu chồng nhau |
- **Mã lượt** (như Cho Bông ăn / Trốn tìm): 🧩, 🔁, Next, rời game thì hẹn giờ / câu nói / hoạt ảnh của lượt cũ không được đổi trạng thái.

## 4. Ghép bộ phận

### 4.1 Hình và mảnh
- **10 hình** của trò Tô màu (bỏ ☀️ mặt trời, vì chỉ có một bộ phận thật).
- **Mảnh** là **hình SVG riêng của bộ phận** (đúng đường viền, không cắt ô chữ nhật).
- Bộ phận quá nhỏ hoặc là nét **vẽ sẵn trên nền**, không phải mảnh kéo.
- **Thứ tự hỏi khai báo riêng từng hình**, kiểm tra bằng mắt (không tự xếp theo kích thước):

  | Hình | Mảnh kéo (thứ tự Bông hỏi) | Vẽ sẵn |
  |---|---|---|
  | 🦋 butterfly | body, wings, head | antennae |
  | 🐦 bird | body, head, wing, tail | legs, beak |
  | 🐟 fish | body, tail, fins | — |
  | 🐱 cat | body, head, ears, tail | — |
  | 🐞 ladybug | shell, head | legs, spots |
  | 🌸 flower | leaves, petals, middle | stem (rộng 10/200 < 20) |
  | 🌳 tree | trunk, leaves | apples |
  | 🏠 house | walls, roof, door, windows | chimney |
  | 🚗 car | **body** (thân xe), wheels, windows | light |
  | 🍦 ice cream | cone, ice cream, cherry | — |
- **🚗 Xe hơi:** mảnh thân xe trong dữ liệu Tô màu tên `car`. Trong trò này **đổi tên hiển thị thành *body* / *thân xe*** (dữ liệu ghép có trường đổi tên). Như vậy *body, wheels, windows* là các bộ phận ngang hàng, còn *car* là cả hình (*"It's a car!"*).
- **Kích thước tối thiểu (2 kiểm tra):**
  - **dữ liệu:** cạnh ngắn khung bao mỗi mảnh ≥ 20 trên khung 200 (unit test);
  - **màn hình:** mảnh trong khay ≥ **64 px**; khung ghép ≥ 280 px trên điện thoại dọc (UI test ở 390 × 844).

### 4.2 Nền, màu, lớp vẽ
- **Nền:** cả hình hiện **bóng mờ** (xám nhạt, viền nét đứt); phần vẽ sẵn hiện rõ.
- **Lớp vẽ:** mảnh đã đặt vẽ theo **thứ tự lớp của dữ liệu Tô màu** (đầu đè thân, nhụy đè cánh hoa…), không theo thứ tự bé đặt.
- **Màu:** đọc **mới nhất từ cài đặt `coloring` mỗi lần mở hình** (không giữ bản sao cũ):
  - bộ phận bé đã tô → đúng màu đó;
  - bộ phận chưa tô (hoặc đã tẩy trắng) → **màu mặc định** (màu đầu tiên trong danh sách màu hợp lý của bộ phận);
  - dữ liệu Tô màu thiếu / hỏng → cả hình dùng màu mặc định, vẫn chơi được.

### 4.3 Bông dẫn dắt và câu nói
- Bông hỏi theo thứ tự ở 4.1: *"Where does the tail go?"*, mảnh đó nhún trong khay.
- Bé đặt **mảnh khác** đúng chỗ cũng được khen (*"Yes! The head!"*); câu hỏi chuyển sang mảnh còn thiếu kế tiếp.

| Lúc | Tiếng Anh | Phụ đề |
|---|---|---|
| Vào hình | Let's make a butterfly! | Mình ghép con bướm nhé! |
| Hỏi | Where does the tail go? / Where do the wings go? | Cái đuôi ở đâu nhỉ? / Cái cánh ở đâu nhỉ? |
| Đúng | Yes! The tail! / Yes! The wings! | Đúng rồi! Cái đuôi! |
| Sai lần 1 | Oops! Try again! | Ối! Thử lại nhé! |
| Sai lần 2 | Look! Here! | Nhìn này! Ở đây! |
| Xong | Wow! It's a butterfly! | Oa! Con bướm đây rồi! |
- *does* / *do* theo trường `plural` của bộ phận (dữ liệu Tô màu, không đoán theo chữ "s").
- Tên tiếng Việt lấy từ dữ liệu (đã đổi tên với xe hơi).
- **Hoạt ảnh xong** theo hình: bướm vỗ cánh, chim nghiêng đầu, cá bơi, mèo vẫy đuôi, xe chạy, nhà ống khói ra khói, hoa đung đưa, kem lắc…

## 5. Ghép cả bức tranh

### 5.1 Nhóm tranh (mỗi nhóm một nguồn, không dùng chung cơ chế tìm bài)
| Nhóm | Nguồn | Mã thẻ (cho ✨) |
|---|---|---|
| 📚 **Từ vựng** | Ảnh bố mẹ đã thêm ở các bài học, chia theo bài. Mỗi từ một ảnh (ảnh mới nhất), không lấy ảnh trò chơi (`scene: dress: feed: hide: puzzle: profile:`) | `grid:word:<từ>` |
| 🐾 **Con vật và đồ vật** | 10 hình vẽ sẵn (Tô màu, màu mới nhất). **Luôn có**, nên máy chưa có ảnh nào vẫn chơi được | `grid:svg:<mã hình>` |
| 👨‍👩‍👧 **Gia đình** | Ảnh trong Hồ sơ của bé (mẹ, bố, ông bà, bé…). **Bật mặc định**, bố mẹ tắt được. Chỉ đọc trên máy này, **không sao chép** vào dữ liệu trò chơi | `grid:family:<người>` |
| 📷 **Ảnh của bố mẹ** | Ảnh tự thêm ở Góc bố mẹ → Ảnh Ghép hình (`puzzle:photos`) | `grid:photo:<mã>` |
- Nhóm trống thì không hiện.
- **Ảnh nguồn bị xóa** (bài học / hồ sơ / ảnh ghép) → thẻ **biến mất** khỏi danh sách (danh sách dựng lại mỗi lần mở, không giữ đường dẫn cũ).
- Ảnh hỏng / không đọc được / nhỏ hơn 300 px → không hiện.

### 5.2 Cắt vuông
- Mặc định **cắt vuông giữa ảnh**.
- **Ảnh gia đình và ảnh bố mẹ thêm:** Góc bố mẹ → Ảnh Ghép hình có **xem trước ô vuông** cho từng ảnh, kèm 3 nút **chỉnh vị trí cắt**: ⬆ đầu / giữa / ⬇ cuối (ảnh dọc: trên / giữa / dưới; ảnh ngang: trái / giữa / phải).
  - Lưu ở cài đặt `puzzleCrop = { [mã ảnh]: 'start' | 'center' | 'end' }`.
  - Không cần trình sửa ảnh.
- **Ảnh từ vựng:** cắt giữa (ảnh bài học vốn gần vuông).

### 5.3 Số mảnh và mức (tự lên ở tranh kế tiếp)
- **Bộ đếm theo số mảnh**: `gridDone = { 2: n, 4: n, 6: n, 9: n }`. Chỉ tăng khi **ghép xong trọn một tranh** với số mảnh đó.
- **Số mảnh của tranh kế tiếp:**
  | Điều kiện | Mảnh |
  |---|---|
  | bố mẹ khóa mức (1 / 2 / 3) | mức 1 → như dòng dưới; mức 2 → 6; mức 3 → 9 |
  | `gridDone[2] < 2` | **2** (1 × 2) — làm quen |
  | `gridDone[4] < 4` | **4** (2 × 2) |
  | `gridDone[6] < 5` | **6** (2 cột × 3 hàng) |
  | còn lại | **9** (3 × 3) |
  - Nghĩa là: 2 tranh 2 mảnh → 4 tranh 4 mảnh → 5 tranh 6 mảnh → 9 mảnh.
  - Tranh 2 mảnh chỉ tính vào `gridDone[2]`.
- **Lên mức chỉ áp dụng từ tranh kế tiếp**, không đổi tranh đang chơi. 🔁 ghép lại tranh đang chơi giữ nguyên số mảnh của nó.
- **Khóa mức:** bộ đếm **vẫn tăng**. Mở khóa thì số mảnh tính lại theo bộ đếm.
- Bộ đếm nằm trong cài đặt nên đi theo sao lưu / khôi phục.
- Mảnh luôn là hình chữ nhật đều nhau, **không xoay**. Hình mẫu mờ (25%) luôn hiện. Chỗ đúng sáng khi tới gần ở 2 / 4 mảnh. Khay xáo thứ tự mảnh.

### 5.4 Câu nói
| Lúc | Tiếng Anh | Phụ đề |
|---|---|---|
| Vào hình | Let's make a picture! | Mình ghép tranh nhé! |
| Đúng | Yes! (thỉnh thoảng *Good job!*) | Đúng rồi! |
| Sai lần 1 / lần 2 | Oops! Try again! / Look! Here! | như mục 4.3 |
| Xong — từ vựng / hình vẽ | Wow! It's a cow! + tiếng kêu nếu có (*Moo moo!*) | Oa! Con bò đây rồi! |
| Xong — gia đình | Wow! It's Mummy! | Oa! Mẹ đây rồi! |
| Xong — ảnh bố mẹ thêm | Wow! It's {tên tiếng Anh}! (không có tên: *Wow! You did it!*) | Oa! {tên Việt} đây rồi! |
- **Tiếng kêu** lấy từ bảng tiếng kêu đã có của bài từ vựng (trường `sound` của từ, hoặc bảng có sẵn).
- Câu xong theo nhóm có mạo từ đúng: *a cow / an apple*; ảnh từ vựng dùng nguyên từ trong bài.

## 6. Ảnh và quyền riêng tư
- **Ghép bộ phận:** hình SVG từ dữ liệu Tô màu, không cần ảnh, chạy offline.
- **Ghép tranh không sao chép ảnh** bài học / gia đình: game đọc thẳng ảnh đang có, cắt mảnh lúc chơi.
  - Thay ảnh nguồn → tranh đổi theo.
  - Xóa ảnh nguồn → thẻ biến mất.
- **Ảnh bố mẹ thêm** (`puzzle:photos`):
  - mỗi ảnh có tên tiếng Anh + tiếng Việt;
  - danh sách lưu trong cài đặt `puzzlePhotos`;
  - có **Chia sẻ** (file / Drive / link) và nằm trong sao lưu đầy đủ.
- **Ảnh gia đình / ảnh bé** (`profile:`):
  - chỉ đọc trên máy;
  - **không bao giờ** trong gói chia sẻ, kể cả gói Ảnh Ghép hình;
  - **sao lưu đầy đủ** do bố mẹ tạo vẫn có, như trước: hai kho ảnh tách riêng (`puzzle:` / `profile:`), gói chia sẻ chỉ lấy `puzzle:*`.
- Ảnh `puzzle:` không bị dùng lại làm ảnh từ vựng (thêm vào bộ lọc `latestImageForWord`).

## 7. Trạng thái và dữ liệu
```
chọn cách chơi → chọn hình → playing (asking ⇄ dragging ⇄ snapping / bouncing) → done → [Next / 🧩]
```
**Vòng đời (hai hành vi khác nhau):**
| Tình huống | Kết quả |
|---|---|
| App ra nền rồi quay lại | **Giữ nguyên lượt đang chơi**: mảnh đã đặt, mảnh còn trong khay, số lần sai. Dừng tiếng; quay lại chỉ nói lại câu hỏi hiện tại (không phát lại câu cũ khác) |
| 🧩 về chọn hình / chọn hình khác / 🔁 / Next / 🏠 | **Lượt mới**, mã lượt mới: mọi hẹn giờ, câu nói của lượt cũ bị vô hiệu |

**Tiến độ (cài đặt `puzzle`, chỉ ghi khi ghép xong trọn một hình, không ghi mỗi mảnh):**
```js
{ mode: 'parts' | 'grid',              // cách chơi lần trước
  gridDone: { 2: n, 4: n, 6: n, 9: n }, // bộ đếm theo số mảnh (mục 5.3)
  lock: null | 1 | 2 | 3,              // bố mẹ khóa mức ghép tranh
  done: { [mã thẻ]: true } }            // ✨ — đã ghép xong ÍT NHẤT MỘT LẦN (bất kỳ số mảnh)
```
- Thêm: `puzzleFamily` (bật / tắt nhóm Gia đình, mặc định bật), `puzzleCrop`, `puzzlePhotos`.
- Lượt đang chơi chỉ nằm trong bộ nhớ.

**Dữ liệu ghép bộ phận** (`app/js/puzzle.js`, dựa trên `coloring.js`):
```js
{ picture: 'car', order: ['car', 'wheels', 'windows'], fixed: ['light'],
  rename: { car: { en: 'body', vi: 'thân xe', plural: false } }, dance: 'drive' }
```
- Điểm neo, khung bao của từng mảnh **tính từ SVG của bộ phận** (đo một lần khi mở hình, bằng `getBBox` trên khung 200 × 200).
- Unit test kiểm tra lại bằng dữ liệu đo sẵn trong test.

Không tính sao học. Ghép xong một ảnh từ vựng thì ghi "đã gặp" từ đó (như Chọn từ).

## 8. Ca biên
- **Tất cả mảnh đã đặt** thì khay ẩn. ➡️ Next chỉ hiện sau câu *"Wow! …"*.
- **Đổi mức / tắt nhóm Gia đình trong Cài đặt** giữa chừng: áp dụng từ lần mở danh sách / tranh sau.
- **Giảm chuyển động:** mảnh đặt thẳng vào chỗ, không nảy / bay; hoạt ảnh hoàn thành thay bằng ✨ đứng yên. Vùng hút giữ nguyên.
- **Điện thoại dọc:** khung ghép trên, khay dưới, mảnh ≥ 64 px.

## 9. Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **P1a** | **Bướm làm trọn vẹn trước:** bóng mờ, mảnh màu (màu bé đã tô), điểm neo + hút, Bông hỏi, đúng / sai 2 cấp, hoạt ảnh xong, mã lượt, ra nền | PU-01, PU-03, PU-09, PU-11 trên bướm |
| **P1b** | Nhân ra 10 hình (thứ tự, vẽ sẵn, đổi tên xe, hoạt ảnh từng hình) | Unit test dữ liệu 10 hình; PU-02, PU-12 |
| **P2** | Ghép tranh: nhóm Từ vựng + Con vật và đồ vật; chia 2 / 4 / 6 / 9; bộ đếm + tự lên mức + khóa mức; tiếng kêu | PU-05, PU-06, PU-07; máy không có ảnh vẫn chơi |
| **P3** | Nhóm Gia đình (bật / tắt), Góc bố mẹ → Ảnh Ghép hình (thêm ảnh + tên, xem trước + chỉnh vùng cắt, chia sẻ) | PU-08, PU-10; gói chia sẻ không có `profile:` |

## 10. Kiểm thử
**Unit**
- 10 hình: mảnh / vẽ sẵn là bộ phận có thật; thứ tự gồm đủ mảnh; mỗi mảnh ≥ 20/200; đổi tên xe.
- Câu *does / do* theo `plural`; câu xong có mạo từ đúng; tiếng kêu.
- Nhận đúng / sai / không tính theo điểm neo + bán kính, kể cả hai chỗ trùng tâm (nhụy / cánh hoa).
- Chia lưới 2 / 4 / 6 / 9: đúng số mảnh, phủ kín, không chồng.
- Công thức số mảnh từ bộ đếm + khóa mức; bộ đếm vẫn tăng khi khóa.
- Cắt vuông start / center / end cho ảnh dọc và ngang.

**UI**
| ID | Kịch bản | Mong đợi |
|---|---|---|
| PU-01 | Kéo mảnh đến gần chỗ của bộ phận khác | Không nhận nhầm: *Oops!*, mảnh về khay |
| PU-02 | Mảnh vẽ trong khay ở cỡ khác khung | Thả đúng thì vẫn khớp đúng tọa độ trên hình |
| PU-03 | Tô một phần ở Tô màu rồi mở ghép bộ phận | Phần đã tô đúng màu, phần chưa tô màu mặc định |
| PU-04 | Đổi màu ở Tô màu sau khi đã ghép | Lượt mới đọc màu mới nhất |
| PU-05 | Ghép xong tranh 2 mảnh | `gridDone[2]` +1, các bộ đếm khác không đổi |
| PU-06 | Đạt điều kiện lên mức khi đang chơi | Tranh đang chơi giữ số mảnh; tranh kế tiếp mới tăng |
| PU-07 | Xóa ảnh nguồn trong bài học | Thẻ ảnh không còn trong danh sách |
| PU-08 | Ảnh chân dung mặt sát mép | Xem trước ô vuông + chỉnh vị trí cắt; tranh ghép dùng vị trí đã chọn |
| PU-09 | Đặt mảnh cuối rồi chạm liên tục / bấm Next liên tục | Câu hoàn thành một lần; chỉ một lượt mới |
| PU-10 | Sao lưu rồi khôi phục | Bộ đếm, ✨, ảnh bố mẹ thêm, vị trí cắt còn đúng |
| PU-11 | Bật giảm chuyển động | Không nảy / bay; ✨ đứng yên |
| PU-12 | Điện thoại 390 × 844 | Mảnh trong khay ≥ 64 px, khung ≥ 280 px |
- Thêm: ra nền rồi quay lại giữ mảnh đã đặt; 🧩 rồi chọn lại hình thì ghép từ đầu; gói chia sẻ Ảnh Ghép hình không có ảnh `profile:`.

**Thử tay với bé:** mảnh đủ to để kéo bằng ngón tay; vùng hút đủ rộng; 6 mảnh có quá khó không.

## 11. Ghi chú khi code (0.20.0)
- **Cuống hoa vẽ sẵn:** đo bằng `getBBox` thì cuống hoa chỉ rộng 10/200, dưới mức tối thiểu 20, nên chuyển sang vẽ sẵn (hoa còn 3 mảnh).
- **Khung bao đo sẵn trong dữ liệu** (`PART_PUZZLES[].box`); UI test so lại với `getBBox` của SVG thật (lệch ≤ 1), để đổi hình Tô màu mà quên cập nhật thì test báo.
- **Điểm thả = vị trí ngón tay** (mảnh kéo luôn nằm giữa ngón tay). Không đo khung của mảnh đang kéo: máy bật "giảm chuyển động" có transition rất ngắn cho mọi phần tử, đo ngay lúc thả vẫn ra vị trí cũ, nên bé thả đúng mà bị tính trượt (lỗi tìm ra khi viết test, đã sửa; mảnh kéo cũng tắt transition).
- **Gợi ý sáng** (chỗ đúng sau 2 lần sai, khi chạm mảnh) luôn sáng đủ thời gian thật, vì không chặn lượt chơi.
- **Mảnh lưới trong khay** giữ đúng tỉ lệ ô, cạnh ngắn 72 px.

## Thêm hình (app 0.23.0)
- Ghép bộ phận: **25 hình** (thêm 15 tranh Tô màu mới, SPEC-coloring mục 9).
- Nhóm *Con vật và đồ vật* của Ghép cả bức tranh cũng có 25 hình.
