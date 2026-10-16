# SPEC — 🙈 Bông trốn tìm (Hide and seek)

> Phiên bản spec: **draft1** · Ngày: 2026-10-16 · Dự kiến app 0.19.0 · **Chưa làm**, chờ duyệt.
> Một trò mới trong Góc trò chơi (🎲 Play). **Ảnh trong game thay được** (mục 7).

## 1. Mục tiêu
- Bé 3 tuổi học **giới từ chỉ vị trí** (*in, under, behind, on, next to*) và **đồ vật trong nhà**: *"Where is Bông? Under the bed!"*.
- Trẻ 3 tuổi rất mê trốn tìm và "ú òa". Bé đi **tìm Bông** bằng cách chạm chỗ nấp. Ở lượt đổi vai, bé **đi trốn** và Bông đi tìm, đọc to từng chỗ.
- Bé cùng đếm *one … ten* khi Bông đi trốn (ôn số).
- Không có "sai": chạm nhầm chỗ thì có bất ngờ vui (một con mèo, chiếc tất…), không mất gì.

## 2. Màn hình
```
 🏠  🎲  🏡(đổi phòng)   🙈 Hide and seek          🐰 (Bông / lượt)
 ┌──────────────────────────────────────────┐
 │  tranh căn phòng (4:3)                    │
 │   🛏️ giường   🚪 tủ   📦 hộp   🪟 rèm   🪑 ghế │  ← mỗi chỗ nấp là một vùng chạm
 └──────────────────────────────────────────┘
```
- **🏡** chọn phòng: 🛏️ Bedroom, 🛋️ Living room, 🍳 Kitchen, 🛁 Bathroom, 🌳 Garden. Mỗi phòng có 5–6 chỗ nấp.
- Phụ đề tiếng Việt cho **mọi câu**.

## 3. Cách chơi — Bé đi tìm (mặc định)
| Lúc | App |
|---|---|
| Bắt đầu | Bông đứng giữa phòng: *"Let's play hide and seek! Close your eyes!"* (*Mình chơi trốn tìm nhé! Nhắm mắt lại nào!*) |
| Đếm | Màn tối dần, hai bàn tay che mắt hiện ra. Bông đếm *"One, two, three … ten!"*, mỗi số hiện to (bé đếm theo). Có tiếng sột soạt khi Bông chạy đi nấp |
| Đi tìm | Màn sáng lại: *"Ready or not, here I come! Where is Bông?"* (*Bông trốn ở đâu nhỉ?*) |
| Chạm **chỗ nhầm** | Chỗ đó rung nhẹ. Một bất ngờ hiện ra rồi biến mất, ví dụ 🐱 *"Meow! A cat!"*. Bông (giọng từ xa) nói *"Not under the bed! Hee hee!"* (*Không phải dưới gầm giường!*) |
| Gợi ý (sau 2 lần nhầm, hoặc 10 giây không chạm) | Ở chỗ Bông nấp **thò ra đôi tai / cái đuôi**, chỗ đó rung nhẹ + tiếng khúc khích |
| Chạm **đúng chỗ** | Bông nhảy ra: *"Peekaboo! You found me!"* (tiếng "ú òa"), rồi *"I'm under the bed!"* (*Bông trốn dưới gầm giường!*); chữ **under** nhấp nháy dưới hình |
| Sau khi tìm thấy | *"Again!"*: chơi lượt mới (Bông nấp chỗ khác). Sau 3 lượt thì gợi ý đổi vai: *"Now you hide!"* |

**Chỗ nấp và câu (theo dữ liệu, mục 5):** mỗi chỗ có giới từ + đồ vật cố định: *under the bed*, *in the box*, *behind the curtain*, *in the wardrobe*, *under the table*, *behind the door*.
- Không dùng chỗ "on" khi Bông đang trốn: ngồi trên ghế thì nhìn thấy ngay. "On" chỉ dùng ở lượt đổi vai và ở bất ngờ (*"A sock on the chair!"*).

**Mức:**
- **Dễ** (mặc định cho 3 tuổi): tai Bông luôn thò ra một chút.
- **Thường:** chỉ thò tai khi đến lúc gợi ý (sau 2 lần nhầm).
- Bố mẹ chọn mức trong Cài đặt.

## 4. Đổi vai — Bé đi trốn
| Lúc | App |
|---|---|
| Bắt đầu | *"Now you hide! I'll close my eyes."* Bông che mắt, đếm *one … five* |
| Bé chọn chỗ | Bé **kéo** hình bé (avatar 🧒, hoặc ảnh bé nếu có trong Hồ sơ) vào một chỗ nấp, hoặc **chạm** chỗ nấp. Hình bé "chui" vào chỗ đó |
| Bông đi tìm | Bông đi từng chỗ, mỗi chỗ một câu hỏi: *"Is Na under the bed? … No!"*, *"Is Na behind the curtain? … No!"*. Sau 1–3 chỗ thì tìm thấy: *"Found you! You're in the box!"* (*Tìm thấy rồi! Con trốn trong cái hộp!*) |
| Kết | *"Your turn to find me!"*: quay về lượt bé đi tìm |
- Lượt này bé **nghe** rất nhiều câu giới từ có tên mình. Không cần mic.
- **Mic (tùy chọn, mốc H3):** sau khi tìm thấy, Bông hỏi *"Where are you?"* và gợi ý câu *"I'm in the box!"* trong bong bóng. Nếu có mic và bé lên tiếng thì Bông nói *"Good job!"*; không có mic thì bỏ qua (luật "nỗ lực nói" như SPEC-talk 15.1, không tính sao).

## 5. Nội dung
| Phòng | Chỗ nấp (giới từ + đồ vật) | Bất ngờ ở chỗ nhầm |
|---|---|---|
| 🛏️ Bedroom | under the bed · in the wardrobe · behind the curtain · in the box · under the blanket · behind the door | 🧸 teddy, 🧦 sock, 🐱 cat |
| 🛋️ Living room | behind the sofa · under the table · behind the plant · in the basket · next to the TV · under the cushion | 🐶 dog, ⚽ ball, 🚗 car |
| 🍳 Kitchen | under the table · in the cupboard · behind the fridge · in the big pot · next to the oven | 🐭 mouse, 🍎 apple, 🥄 spoon |
| 🛁 Bathroom | in the bathtub · behind the towel · under the sink · in the laundry basket | 🦆 duck, 🧽 sponge, 🫧 bubbles |
| 🌳 Garden | behind the tree · in the bush · under the slide · in the little house · next to the flowers | 🐦 bird, 🦋 butterfly, 🐸 frog |
- **Bất ngờ** là từ vựng thêm (*"Quack! A duck!"*). Dùng ảnh từ vựng bé đã học nếu có (mục 7.3).
- "Next to" vẫn là chỗ nấp hợp lệ: Bông nấp **sát cạnh**, nửa người khuất sau mép vật.

## 6. Câu nói
| Lúc | Tiếng Anh | Phụ đề |
|---|---|---|
| Mở đầu | Let's play hide and seek! Close your eyes! | Mình chơi trốn tìm nhé! Nhắm mắt lại nào! |
| Đếm | One, two, … ten! | (số to trên màn) |
| Đi tìm | Ready or not, here I come! Where is Bông? | Bông trốn ở đâu nhỉ? |
| Chỗ nhầm | Not {prep} the {thing}! Hee hee! | Không phải {vi}! |
| Bất ngờ | {Sound}! A {surprise}! | {vi bất ngờ}! |
| Tìm thấy | Peekaboo! You found me! I'm {prep} the {thing}! | Ú òa! Con tìm thấy Bông rồi! Bông trốn {vi}! |
| Đổi vai | Now you hide! I'll close my eyes. | Giờ con đi trốn nhé! Bông nhắm mắt đây. |
| Bông tìm | Is {name} {prep} the {thing}? … No! | {Name} có trốn {vi} không? … Không! |
| Bông thấy | Found you! You're {prep} the {thing}! | Tìm thấy rồi! Con trốn {vi}! |
- Tên phần tiếng Việt viết sẵn cả cụm có giới từ: *dưới gầm giường*, *trong cái hộp*, *sau rèm cửa*, *cạnh cái ti vi*. Không ghép giới từ máy móc.
- `{name}` lấy từ Hồ sơ của bé. Chưa có tên thì dùng *"you"*: *"Are you under the bed?"*.

## 7. Ảnh thay được
Mặc định: **tranh phòng vẽ bằng SVG + emoji đồ vật + Bông SVG** (chạy offline, không cần ảnh). Bố mẹ thay bằng ảnh đẹp hơn theo cùng cách Dán tranh đang làm.

**7.1 Ảnh phòng** (`lessonId = 'hide:bg'`, `word = mã phòng`):
- Mỗi phòng có **bố cục cố định**: mỗi chỗ nấp là một ô chữ nhật trên khung 400×300.
- Góc bố mẹ có:
  - **⬇ Tải ảnh bố cục mẫu** (ảnh có ô màu ghi tên từng chỗ: bed, curtain…);
  - **📋 Copy prompt** mô tả căn phòng, vị trí từng đồ vật theo phần trăm khung, kèm câu *"dùng ảnh bố cục mẫu làm tham chiếu"*;
  - **👁 Xem vùng chạm** trên ảnh đã thêm, để kiểm tra đồ vật trong ảnh nằm đúng ô.
- Dùng lại cách làm của Dán tranh (SPEC-scenes 10.x: `sceneBackgroundPrompt`, ảnh bố cục, xem vùng).
- Khi có ảnh phòng, đồ vật đã nằm sẵn trong tranh. Bông trốn thì **ẩn hẳn**; khi gợi ý, tai Bông được vẽ đè lên mép vùng chạm (vị trí thò tai khai báo theo từng chỗ: trên / trái / phải).

**7.2 Ảnh Bông** (`lessonId = 'hide:bong'`, tùy chọn): 4 tư thế:
- `peek` — đôi tai thò ra, nền trong suốt;
- `boo` — nhảy ra "ú òa", hai tay giơ cao;
- `cover` — che mắt đếm;
- `seek` — đi tìm, tay che mày nhìn xa.

Có prompt ảnh lưới 4 ô dùng mô tả Bông chuẩn (`BONG_FULL_BODY`). Ảnh được cắt lưới và tự bỏ nền. Thiếu tư thế nào thì dùng Bông SVG.

**7.3 Ảnh bất ngờ** (`lessonId = 'hide:items'`):
- **Dùng lại ảnh có sẵn** có cùng tên (ảnh "cat", "duck" của bài Từ vựng), tự bỏ nền.
- Đổi ảnh từng món, ảnh lưới + cắt cho các món chưa có ảnh.

**7.4 Ảnh bé** (lượt đổi vai):
- Dùng **ảnh bé trong Hồ sơ** nếu có (thêm ô 📷 *Ảnh của bé* cạnh ảnh gia đình, lưu `profile:family` / `word = family:me`).
- Không có thì dùng 🧒 / 👧 theo bé trai / bé gái đã chọn ở Mặc đồ.
- Ảnh này **không** đi theo khi chia sẻ (như ảnh gia đình, SPEC-talk 15.6).

**7.5 Quy tắc chung:**
- Ảnh `hide:` không bị dùng lại làm ảnh từ vựng: thêm vào bộ lọc của `latestImageForWord`.
- Góc bố mẹ → **🙈 Ảnh Trốn tìm**: các mục 7.1–7.3 + **Chia sẻ** (file / Drive / link, khối `mediaShareSection` chung). Nhập ở đây hoặc ở Quản lý bài.
- Có trong bản sao lưu đầy đủ.

## 8. Dữ liệu và trạng thái
- Phòng nằm trong code (`app/js/hide-seek.js`), giống `sticker-scenes.js`:
  `{ id, en, vi, emoji, draw (mô tả cho prompt), spots: [{ id, prep: 'in'|'under'|'behind'|'next to', thing, thingVi, phraseVi, rect: [x, y, w, h], peek: 'top'|'left'|'right', emoji }], surprises: [{ id, en, vi, sound, emoji }] }`
- **Chọn chỗ nấp:** ngẫu nhiên, **không trùng chỗ vừa nấp**, ưu tiên giới từ chưa gặp gần đây (để bé gặp đủ in / under / behind).
- **Bất ngờ:** mỗi chỗ nhầm một bất ngờ ngẫu nhiên, trong một lượt không lặp.
- **Đổi vai:** Bông "đoán" 1–3 chỗ trước khi tìm thấy, chọn ngẫu nhiên nhưng **lần cuối luôn đúng chỗ bé nấp**. Không bao giờ để bé chờ quá ~15 giây.
- Cài đặt:
  - `hideSeek = { room, level: 'easy'|'normal', rounds }`
  - `hideSeekSwap` (bật / tắt gợi ý đổi vai)
- Không tính sao học. Nhớ phòng đang chơi.

## 9. Vòng đời và ca biên
- **Chạm trong lúc đếm:** bị bỏ qua (màn đang tối). Chạm Bông khi đang đếm thì bỏ qua đếm, Bông nấp ngay.
- **Chạm nhiều chỗ liên tiếp nhanh:** mỗi lần chạm hủy câu cũ và nói câu mới (một chuỗi tiếng mỗi lần chạm). Chạm đúng chỗ thì khóa các chạm khác cho đến khi Bông nói xong *"I'm under the bed!"*.
- **Vùng chạm chồng nhau** (chăn nằm trên giường): ô nhỏ hơn được ưu tiên. Thứ tự trong dữ liệu là thứ tự ưu tiên; có unit test bảo đảm không có hai ô trùng hoàn toàn.
- **Chạm ngoài mọi chỗ nấp:** không có gì xảy ra.
- **Rời game / app ra nền:** dừng tiếng, giữ chỗ Bông đang nấp. Quay lại thì Bông hỏi lại *"Where is Bông?"*.
- **Đổi phòng giữa lượt:** lượt mới ở phòng mới.
- **Ảnh phòng không khớp ô** (AI vẽ lệch): vẫn chơi được, vì vùng chạm theo ô. Trang 👁 Xem vùng chạm giúp bố mẹ phát hiện để tạo lại ảnh.
- **Máy bật "giảm chuyển động":** không rung, không bay; tai thò ra đứng yên.

## 10. Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| H1 | 2 phòng (Bedroom, Living room) bằng SVG, bé đi tìm, đếm, chỗ nhầm + bất ngờ, gợi ý tai, tìm thấy, mức Dễ / Thường | Chơi nhiều lượt không kẹt; câu giới từ đúng từng chỗ |
| H2 | Đổi vai (bé đi trốn, Bông tìm có tên bé), thêm 3 phòng | Bông luôn tìm thấy sau tối đa 3 lần đoán |
| H3 | Ảnh: phòng (bố cục mẫu + prompt + xem vùng), Bông 4 tư thế, bất ngờ (dùng lại ảnh), ảnh bé trong Hồ sơ, chia sẻ; mic tùy chọn | Ảnh phòng hiện đúng, vùng chạm khớp; chia sẻ đủ ảnh, không kèm ảnh bé |

## 11. Kiểm thử
- **Unit:**
  - mỗi phòng có ≥ 4 chỗ nấp, mã không trùng;
  - ô nằm trong khung 400×300, không có hai ô trùng hoàn toàn;
  - câu tìm thấy / chỗ nhầm / đổi vai đúng giới từ, có và không có tên bé;
  - chọn chỗ không lặp chỗ vừa nấp;
  - đổi vai luôn kết thúc đúng chỗ;
  - prompt ảnh phòng nêu đủ đồ vật và vị trí.
- **UI (chế độ nhanh):**
  - đếm 1–10 rồi *Where is Bông?*;
  - chạm nhầm → *Not … !* + bất ngờ;
  - 2 lần nhầm → tai thò ra đúng chỗ;
  - chạm đúng → *Peekaboo! … I'm under the bed!*;
  - đổi vai: kéo bé vào hộp → Bông hỏi các chỗ → *Found you! You're in the box!*;
  - ảnh phòng thay được, vùng chạm vẫn đúng;
  - ảnh `hide:` không lẫn vào ảnh từ vựng;
  - chia sẻ không kèm ảnh bé.
- **Thử tay với bé:** tai thò ra có đủ rõ không; đếm đến 10 có quá lâu không (cấu hình: đếm đến 5 hoặc 10).

## 12. Câu hỏi cần chốt
1. Lượt đổi vai bật ngay từ đầu, hay chỉ mở sau 3 lượt bé đi tìm? (Đề xuất: sau 3 lượt.)
2. Đếm đến 10 hay 5 cho bé 3 tuổi? (Đề xuất: 10, nhưng ▶ / chạm Bông bỏ qua được.)
3. Làm Bông trốn tìm trước hay Cho Bông ăn trước? (Đề xuất: **Cho Bông ăn trước**. Nó gần Mặc đồ nên dùng lại được nhiều code kéo-thả + ảnh. Trốn tìm dùng lại khung Dán tranh.)
